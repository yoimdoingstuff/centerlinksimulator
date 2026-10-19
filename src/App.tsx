/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  CallStatus,
  Difficulty,
  Mission,
  DialogueMessage,
  CallStats,
  VolumeZone,
} from './types/game';
import { MISSIONS, IVR_MENUS } from './utils/missions';
import {
  calculateTimeOfDayQueue,
  DIFFICULTY_CONFIGS,
  AntiCheatClock,
} from './utils/antiCheat';
import {
  playDialSequence,
  playRingbackTone,
  playDisconnectTone,
  playStaticBurst,
  playConnectionChime,
  getAudioContext,
} from './audio/dtmf';
import { holdMusic } from './audio/holdSynthesizer';
import { speechEngine } from './audio/speechEngine';
import { micAnalyzer, VoicePhraseResult } from './audio/micAnalyzer';
import { triggerHaptic } from './utils/haptics';
import {
  IOS_WALLPAPERS,
  getRandomWallpaper,
  Wallpaper,
} from './utils/wallpapers';
import { IOSKeypad } from './components/IOSKeypad';
import { IOSInCallScreen } from './components/IOSInCallScreen';
import { MissionDrawer } from './components/MissionDrawer';
import { InfoDropdown } from './components/InfoDropdown';
import { DifficultyModal } from './components/DifficultyModal';
import { RoadblockModal } from './components/RoadblockModal';
import { GameVictoryModal } from './components/GameVictoryModal';
import { SettingsModal } from './components/SettingsModal';
import { Image as ImageIcon, Settings, Shuffle } from 'lucide-react';
import {
  Representative,
  getRandomRepresentative,
} from './utils/representatives';
import { generateClientIVR, generateClientAgent } from './utils/geminiClient';

export default function App() {
  // Wallpaper state (randomized colorful blurred wallpaper)
  const [currentWallpaper, setCurrentWallpaper] = useState<Wallpaper>(() => getRandomWallpaper());

  // Game & Dial state - randomize reason so it's not always the same!
  const [dialedNumber, setDialedNumber] = useState<string>('132 850');
  const [missionIndex, setMissionIndex] = useState<number>(() =>
    Math.floor(Math.random() * MISSIONS.length)
  );
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [callStatus, setCallStatus] = useState<CallStatus>('IDLE');
  const [currentMenuId, setCurrentMenuId] = useState<string>('MAIN_MENU');
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [currentMenuPrompt, setCurrentMenuPrompt] = useState<string>('');

  // Signal dots state (0 to 5 dots)
  const [signalDots, setSignalDots] = useState<number>(5);

  // UI Drawer & Modal states
  const [showDifficultyModal, setShowDifficultyModal] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [roadblockType, setRoadblockType] = useState<
    'LINE_DROPPED' | 'CLOCK_TAMPERED' | 'HOSTILE_CALLER' | 'OFFENSIVE_ABUSE' | null
  >(null);
  const [showVictory, setShowVictory] = useState<boolean>(false);

  // Audio & Mic state
  const [currentDb, setCurrentDb] = useState<number>(0);
  const [currentZone, setCurrentZone] = useState<VolumeZone>('TOO_QUIET');
  const [isMicActive, setIsMicActive] = useState<boolean>(true);

  // Screaming & Hostility Tracking (2-min timer, 10s immunity, max 6 warnings)
  const [screamStrikes, setScreamStrikes] = useState<number>(0);
  const [screamTimer, setScreamTimer] = useState<number>(0);
  const [isScreamImmune, setIsScreamImmune] = useState<boolean>(false);

  // Timing & Telemetry
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [queuePos, setQueuePos] = useState<number>(50);
  const [initialQueuePos, setInitialQueuePos] = useState<number>(50);
  const [reverseJumps, setReverseJumps] = useState<number>(0);
  const [loopsSurvived, setLoopsSurvived] = useState<number>(0);
  const [peakDb, setPeakDb] = useState<number>(0);
  const [tamperDetected, setTamperDetected] = useState<boolean>(false);
  const [rushPeriodName, setRushPeriodName] = useState<string>('');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('01:12');

  const [currentRepresentative, setCurrentRepresentative] = useState<Representative>(() =>
    getRandomRepresentative()
  );

  // References
  const antiCheatRef = useRef<AntiCheatClock>(new AntiCheatClock());
  const callIntervalRef = useRef<number | null>(null);
  const signalIntervalRef = useRef<number | null>(null);
  const ringCancelRef = useRef<(() => void) | null>(null);
  const lastDropCallSecondsRef = useRef<number>(-999);
  const screamCooldownUntilRef = useRef<number>(0);
  const lastQueueAnnouncementSecRef = useRef<number>(0);

  const activeMission: Mission = MISSIONS[missionIndex % MISSIONS.length];

  // Update clock time display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setCurrentTimeStr(`${hrs}:${mins}`);
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 10000);
    return () => clearInterval(clockInterval);
  }, []);

  // Initialize time-of-day queue info
  useEffect(() => {
    const queueData = calculateTimeOfDayQueue(difficulty);
    setRushPeriodName(queueData.rushPeriodName);
    if (callStatus === 'IDLE') {
      setQueuePos(queueData.initialCount);
      setInitialQueuePos(queueData.initialCount);
    }
  }, [difficulty, callStatus]);

  // Keep latest refs for callbacks to prevent re-attaching and cancelling calls on state changes
  const callStatusRef = useRef(callStatus);
  callStatusRef.current = callStatus;
  const currentMenuIdRef = useRef(currentMenuId);
  currentMenuIdRef.current = currentMenuId;
  const queuePosRef = useRef(queuePos);
  queuePosRef.current = queuePos;
  const isMicActiveRef = useRef(isMicActive);
  isMicActiveRef.current = isMicActive;
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;
  const activeMissionRef = useRef(activeMission);
  activeMissionRef.current = activeMission;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const callSecondsRef = useRef(callSeconds);
  callSecondsRef.current = callSeconds;

  // Stable handler ref so mount effect can call it safely
  const handleUserSpeechRef = useRef<(result: VoicePhraseResult) => void>(() => {});

  // Connect microphone callbacks ONCE on mount
  useEffect(() => {
    micAnalyzer.setCallbacks(
      (db, zone) => {
        if (!isMicActiveRef.current) {
          setCurrentDb(0);
          setCurrentZone('TOO_QUIET');
          return;
        }
        setCurrentDb(db);
        setCurrentZone(zone);
        if (db > 0) {
          setPeakDb((prev) => Math.max(prev, db));
        }
      },
      (result) => {
        if (!isMicActiveRef.current) return;
        handleUserSpeechRef.current(result);
      }
    );

    return () => {
      micAnalyzer.cleanup();
      speechEngine.stop();
      holdMusic.stop();
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
      if (signalIntervalRef.current) clearInterval(signalIntervalRef.current);
      if (ringCancelRef.current) ringCancelRef.current();
    };
  }, []); // Run ONCE on mount only! Never cancel in-progress calls on state change

  // Signal dots fluctuation and zero-signal line drop simulation (Enforcing >= 3 min gap between dropouts)
  useEffect(() => {
    const isCallActive =
      callStatus !== 'IDLE' && callStatus !== 'CALL_ENDED' && callStatus !== 'VICTORY';

    if (!isCallActive) {
      setSignalDots(5);
      if (signalIntervalRef.current) {
        clearInterval(signalIntervalRef.current);
        signalIntervalRef.current = null;
      }
      return;
    }

    // Fluctuate signal every 6-8 seconds
    signalIntervalRef.current = window.setInterval(() => {
      const currentSec = callSecondsRef.current;
      const secondsSinceLastDrop = currentSec - lastDropCallSecondsRef.current;

      // Must have at least 180 seconds (3 minutes) of total calling AND 3 minutes since last drop
      const canDrop = currentSec >= 180 && secondsSinceLastDrop >= 180;

      const rand = Math.random();
      let newSignal = 5;

      if (canDrop && rand < 0.025) {
        // Rare carrier line drop after at least 3 minutes!
        newSignal = 0;
        lastDropCallSecondsRef.current = currentSec;
      } else if (rand < 0.15) {
        newSignal = 2; // Weak signal suspense without dropping
      } else if (rand < 0.45) {
        newSignal = 3;
      } else if (rand < 0.78) {
        newSignal = 4;
      } else {
        newSignal = 5;
      }

      setSignalDots(newSignal);

      // If signal reaches 0, trigger carrier line drop
      if (newSignal === 0) {
        triggerHaptic('error');
        setTimeout(() => {
          holdMusic.stop();
          playStaticBurst(400);
          playDisconnectTone(2000);
          setCallStatus('LINE_DROPPED');
          setRoadblockType('LINE_DROPPED');
          addMessage('SYSTEM', 'CARRIER SIGNAL LOST: 0 bars of reception. Call dropped.');
        }, 1200);
      }
    }, 7000);

    return () => {
      if (signalIntervalRef.current) {
        clearInterval(signalIntervalRef.current);
        signalIntervalRef.current = null;
      }
    };
  }, [callStatus, difficulty]);

  // Countdown 2-minute calm timer every second
  useEffect(() => {
    if (screamTimer <= 0) return;
    const interval = window.setInterval(() => {
      setIsScreamImmune(Date.now() < screamCooldownUntilRef.current);
      setScreamTimer((prev) => {
        if (prev <= 1) {
          setScreamStrikes(0);
          addMessage('SYSTEM', 'Hostility strikes cleared: 2 minutes of calm dialogue maintained.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [screamTimer]);

  // Cycle wallpaper
  const handleCycleWallpaper = () => {
    triggerHaptic('selection');
    const currentIndex = IOS_WALLPAPERS.findIndex((w) => w.id === currentWallpaper.id);
    const nextIndex = (currentIndex + 1) % IOS_WALLPAPERS.length;
    setCurrentWallpaper(IOS_WALLPAPERS[nextIndex]);
  };

  // Shuffle mission reason so it's not always the same!
  const handleShuffleMission = () => {
    triggerHaptic('selection');
    setMissionIndex((prev) => (prev + 1) % MISSIONS.length);
    const nextM = MISSIONS[(missionIndex + 1) % MISSIONS.length];
    addMessage('SYSTEM', `Calling reason switched to: "${nextM.title}"`);
  };

  // Drag-and-drop listener to easily drop an MP3 into the browser
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return;
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.mp3') || file.type.includes('audio')) {
        holdMusic.setCustomAudio(file, file.name);
        triggerHaptic('heavy');
        addMessage('SYSTEM', `Loaded custom hold music: "${file.name}"`);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Toggle microphone with hardware mute & resume
  const handleToggleMic = () => {
    const nextState = !isMicActive;
    setIsMicActive(nextState);
    micAnalyzer.setMuted(!nextState);
    if (!nextState) {
      setCurrentDb(0);
      setCurrentZone('TOO_QUIET');
    } else {
      // Re-activate voice listening immediately on unmute
      micAnalyzer.startListening();
    }
  };

  // Helper to add dialogue message
  const addMessage = (
    sender: 'USER' | 'ROBOCALLER' | 'AGENT' | 'SYSTEM',
    text: string,
    vol?: number
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        sender,
        text,
        timestamp: Date.now(),
        volumeDb: vol,
      },
    ]);
  };

  // Start call with audio unlock and guaranteed connection
  const handleDial = () => {
    triggerHaptic('heavy');

    // Pick a fresh random mission reason and fresh representative on every call!
    setMissionIndex(Math.floor(Math.random() * MISSIONS.length));
    setCurrentRepresentative(getRandomRepresentative());

    // Reset hostility strikes and cooldowns
    setScreamStrikes(0);
    setScreamTimer(0);
    screamCooldownUntilRef.current = 0;
    lastQueueAnnouncementSecRef.current = 0;

    // Unlock Web Audio & SpeechSynthesis immediately on user click gesture
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
    }

    // Unmute mic when placing call
    setIsMicActive(true);
    micAnalyzer.setMuted(false);
    micAnalyzer.requestMicrophone().catch(() => {});

    setCallStatus('DIALING');
    setCallSeconds(0);
    setMessages([]);
    antiCheatRef.current.reset();
    setTamperDetected(false);
    setRoadblockType(null);
    setShowVictory(false);
    setSignalDots(5);

    const queueData = calculateTimeOfDayQueue(difficulty);
    setQueuePos(queueData.initialCount);
    setInitialQueuePos(queueData.initialCount);
    setReverseJumps(0);
    setLoopsSurvived(0);
    setPeakDb(0);

    // Cancel any in-progress dial/ring sequence
    if (ringCancelRef.current) {
      ringCancelRef.current();
      ringCancelRef.current = null;
    }

    // Play full DTMF touch-tone sequence for 1-3-2-8-5-0, then ringback, then connect to Centrelink
    ringCancelRef.current = playDialSequence(dialedNumber || '132850', () => {
      // Once connected, reset timer to 0 so the in-call timer counts active call time
      setCallSeconds(0);
      enterRobocaller('MAIN_MENU');
    });

    // Start timer interval
    if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    callIntervalRef.current = window.setInterval(() => {
      setCallSeconds((prev) => prev + 1);

      // Check anti-cheat
      if (antiCheatRef.current.checkTamper()) {
        setTamperDetected(true);
        setQueuePos((p) => p + 45);
        setReverseJumps((j) => j + 1);
        setRoadblockType('CLOCK_TAMPERED');
        addMessage(
          'SYSTEM',
          'SECURITY ALERT: System clock discrepancy detected. In accordance with Centrelink integrity rules, you have been pushed back 45 spots in the queue.'
        );
      }

      // Every 120 seconds in hold queue, remind caller what number they are in queue!
      if (callStatusRef.current === 'HOLD_QUEUE') {
        const currentSec = callSecondsRef.current + 1;
        if (
          currentSec >= 120 &&
          currentSec - lastQueueAnnouncementSecRef.current >= 120
        ) {
          lastQueueAnnouncementSecRef.current = currentSec;
          const pos = queuePosRef.current;
          const announcement = `Thank you for holding. You are currently number ${pos} in the national queue. All customer service officers are assisting other callers. Please remain on the line.`;
          addMessage('ROBOCALLER', `[QUEUE ANNOUNCEMENT] You are number ${pos} in the queue.`);
          holdMusic.setDucked(true);
          speechEngine.speakRobocaller(announcement, () => {
            holdMusic.setDucked(false);
          });
        }
      }
    }, 1000);
  };

  // Enter Robocaller IVR menu
  const enterRobocaller = (menuId: string) => {
    setCallStatus('ROBOCALLER_IVR');
    setCurrentMenuId(menuId);
    holdMusic.stop();
    micAnalyzer.setMeterActive(true); // Active listening during IVR

    const menu = IVR_MENUS[menuId] || IVR_MENUS.MAIN_MENU;
    setCurrentMenuPrompt(menu.spokenPrompt);
    addMessage('ROBOCALLER', menu.spokenPrompt);

    speechEngine.speakRobocaller(menu.spokenPrompt, () => {
      if (isMicActive) {
        micAnalyzer.startListening();
      }
    });
  };

  // Enter Hold Queue (Isolates mic so hold music never registers on microphone)
  const enterHoldQueue = (initialWaitMessage?: string) => {
    setCallStatus('HOLD_QUEUE');
    micAnalyzer.setMeterActive(false); // Zero meter & isolate mic during hold music
    micAnalyzer.stopListening();

    const msg =
      initialWaitMessage ||
      `Please hold the line. All of our customer service officers are currently assisting other callers. You are caller number ${queuePos} in the queue.`;

    addMessage('ROBOCALLER', msg);
    speechEngine.speakRobocaller(msg, () => {
      holdMusic.play();
    });
  };

  // Hang up
  const handleHangUp = () => {
    triggerHaptic('heavy');
    speechEngine.stop();
    holdMusic.stop();
    micAnalyzer.setMeterActive(false);
    micAnalyzer.stopListening();
    if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    if (signalIntervalRef.current) clearInterval(signalIntervalRef.current);
    if (ringCancelRef.current) ringCancelRef.current();
    setCallStatus('IDLE');
    setSignalDots(5);
    addMessage('SYSTEM', 'Call disconnected.');
  };

  // Panic redial when line drops
  const handlePanicRedial = () => {
    triggerHaptic('medium');
    setRoadblockType(null);
    setCallStatus('HOLD_QUEUE');
    setSignalDots(4);
    lastDropCallSecondsRef.current = callSeconds; // Reset 3-minute drop countdown
    micAnalyzer.setMeterActive(false);

    playRingbackTone(() => {
      addMessage(
        'ROBOCALLER',
        `Reconnected to Centrelink phone lines. Your position in line (#${queuePos}) was preserved.`
      );
      holdMusic.play();
    });
  };

  // In-call keypad press handler
  const handleKeypadPress = (key: string) => {
    if (callStatus !== 'ROBOCALLER_IVR') return;

    const currentMenu = IVR_MENUS[currentMenuId] || IVR_MENUS.MAIN_MENU;
    const option = currentMenu.options.find((opt) => opt.key === key);

    if (option) {
      addMessage('USER', `Pressed ${key}: ${option.label}`);
      setLoopsSurvived((prev) => prev + 1);

      if (option.action === 'HOLD_QUEUE') {
        enterHoldQueue();
      } else if (option.action === 'SUBMENU' && option.targetMenu) {
        enterRobocaller(option.targetMenu);
      } else if (option.action === 'REPEAT') {
        enterRobocaller(currentMenuId);
      } else {
        const loopMsg =
          'Thank you. We have recorded your selection. Please listen carefully as our menu options have recently changed.';
        addMessage('ROBOCALLER', loopMsg);
        speechEngine.speakRobocaller(loopMsg, () => {
          enterRobocaller('MAIN_MENU');
        });
      }
    } else {
      addMessage('USER', `Pressed ${key}`);
      const invalidMsg =
        'That is not a valid option. Please listen carefully and select from the following choices.';
      addMessage('ROBOCALLER', invalidMsg);
      speechEngine.speakRobocaller(invalidMsg, () => {
        enterRobocaller(currentMenuId);
      });
    }
  };

  // Handle user's spoken voice
  const handleUserSpeech = async (result: VoicePhraseResult) => {
    if (!isMicActiveRef.current) return;
    const currentStatus = callStatusRef.current;
    if (currentStatus !== 'ROBOCALLER_IVR' && currentStatus !== 'AGENT_TALKING') return;

    const transcript = result.transcript.trim();
    const textLower = transcript.toLowerCase();
    addMessage('USER', transcript, result.peakDb);

    // 1. Severe Offensive & Abusive Keywords Check -> Immediate Call Termination
    const OFFENSIVE_KEYWORDS = [
      'cunt',
      'fuck off',
      'fuck you',
      'kill yourself',
      'die in a fire',
      'bomb your office',
      'slit your throat',
      'shoot you',
      'murder you',
    ];

    const isOffensive = OFFENSIVE_KEYWORDS.some((kw) => textLower.includes(kw));
    if (isOffensive) {
      triggerHaptic('error');
      holdMusic.stop();
      playDisconnectTone(2000);
      setCallStatus('CALL_ENDED');
      setRoadblockType('OFFENSIVE_ABUSE');
      addMessage('SYSTEM', 'CALL TERMINATED: Severe verbal abuse or explicit threats detected.');
      speechEngine.speakRobocaller(
        'This call is being terminated immediately under Commonwealth workplace anti-harassment policy. Goodbye.'
      );
      return;
    }

    // 2. Screaming & Hostility (> 82 dB) with 10-Second Immunity Delay & 2-Minute Reset
    if (result.peakDb >= 82) {
      // Check if within 10-second delay immunity (prevents logging the same scream multiple times)
      if (Date.now() < screamCooldownUntilRef.current) {
        return;
      }

      // Start 10-second immunity delay
      screamCooldownUntilRef.current = Date.now() + 10000;
      setIsScreamImmune(true);
      setTimeout(() => setIsScreamImmune(false), 10000);

      const newStrikes = screamStrikes + 1;
      setScreamStrikes(newStrikes);
      setScreamTimer(120); // Reset the 2-minute calm-down countdown
      triggerHaptic('error');

      if (newStrikes >= 6) {
        // Exceeded 6 strikes within 2 minutes: boot caller!
        setScreamStrikes(0);
        setScreamTimer(0);
        setRoadblockType('HOSTILE_CALLER');

        if (callStatus === 'AGENT_TALKING') {
          const rep = currentRepresentative;
          const kickMsg = `Right, that is your sixth warning. I have no tolerance for continuous shouting. I am returning your call to the general queue.`;
          addMessage('AGENT', kickMsg);
          speechEngine.speakRepresentative(kickMsg, { gender: rep.gender }, () => {
            enterHoldQueue('Placed back on hold after 6 hostility warnings...');
          });
        } else {
          const kickMsg = `Automated noise threshold exceeded 6 times. Your call has been returned to the start of the general menu.`;
          addMessage('ROBOCALLER', kickMsg);
          speechEngine.speakRobocaller(kickMsg, () => {
            enterRobocaller('MAIN_MENU');
          });
        }
        return;
      }

      // Below 6 strikes: representative or robocaller attempts to de-escalate and calm user down!
      if (callStatus === 'AGENT_TALKING') {
        const rep = currentRepresentative;
        const calmingMsg =
          rep.hostileResponses?.[newStrikes % rep.hostileResponses.length] ||
          `Whoa mate, steady on! Take a deep breath, no need to shout at me. I'm trying to help you sort this out.`;
        addMessage('AGENT', calmingMsg);
        speechEngine.speakRepresentative(
          calmingMsg,
          {
            gender: rep.gender,
            rate: rep.rate,
            pitch: rep.pitch,
            voiceHints: rep.voiceHints,
          },
          () => {
            if (isMicActive) micAnalyzer.startListening();
          }
        );
      } else {
        const warningMsg = `High volume detected. Warning ${newStrikes} of 6. Please speak in a moderate conversational tone while our automated system processes your enquiry.`;
        addMessage('ROBOCALLER', warningMsg);
        speechEngine.speakRobocaller(warningMsg, () => {
          if (isMicActive) micAnalyzer.startListening();
        });
      }
      return;
    }

    // 3. Robocaller IVR Processing with Strict Keyword Validation
    if (callStatus === 'ROBOCALLER_IVR') {
      const ivrValidKeywords = [
        'jobseeker', 'breach', 'payment', 'pension', 'concession',
        'report', 'income', 'debt', 'dispute', 'operator',
        'representative', 'officer', 'agent', 'human', 'help',
        'medical', 'certificate', 'doctor', 'suspended', 'demerit',
        'obligation', 'appointment', 'transfer', 'one', 'two', 'three', 'four', 'zero',
        'provider', 'centrelink', 'claim', 'exemption', 'attend', 'carer', 'dsp', 'disability', 'rent', 'austudy'
      ];
      const hasIvrKeyword = ivrValidKeywords.some((kw) => textLower.includes(kw));

      // If caller made random noises, grunts, or spoke unrelated gibberish: DO NOT ADVANCE!
      if (!hasIvrKeyword || textLower.length < 3) {
        const notUnderstoodMsg = `We did not recognize that response. To dispute a payment or speak to an officer, please say "transfer to officer" or press 1 on your keypad.`;
        addMessage('ROBOCALLER', notUnderstoodMsg);
        speechEngine.speakRobocaller(notUnderstoodMsg, () => {
          if (isMicActive) micAnalyzer.startListening();
        });
        return;
      }

      const isUrgent = result.peakDb >= 56 && result.peakDb < 82;

      // Try server API first
      try {
        const res = await fetch('/api/call/ivr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            speechText: transcript,
            volumeDb: result.peakDb,
            currentMenu: currentMenuId,
            promptTask: activeMission.title,
            difficulty,
            screamStrikes,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          addMessage('ROBOCALLER', data.robocallerResponseText);
          speechEngine.speakRobocaller(data.robocallerResponseText, () => {
            if (data.action === 'TRANSFER_QUEUE') {
              enterHoldQueue();
            } else if (data.action === 'KICK_TO_BACK') {
              setQueuePos((p) => p + (data.callerDelta || 10));
              enterRobocaller('MAIN_MENU');
            } else if (isMicActive) {
              micAnalyzer.startListening();
            }
          });
          return;
        }
      } catch {
        // try client-side Gemini fallback for static GitHub Pages
        const clientRes = await generateClientIVR({
          speechText: transcript,
          volumeDb: result.peakDb,
          currentMenu: currentMenuId,
          promptTask: activeMission.title,
          difficulty,
        });

        if (clientRes) {
          addMessage('ROBOCALLER', clientRes.robocallerResponseText);
          speechEngine.speakRobocaller(clientRes.robocallerResponseText, () => {
            if (clientRes.action === 'TRANSFER_QUEUE') {
              enterHoldQueue();
            } else if (clientRes.action === 'KICK_TO_BACK') {
              setQueuePos((p) => p + (clientRes.callerDelta || 10));
              enterRobocaller('MAIN_MENU');
            } else if (isMicActive) {
              micAnalyzer.startListening();
            }
          });
          return;
        }
      }

      // Offline programmatic IVR fallback
      if (
        isUrgent ||
        textLower.includes('transfer') ||
        textLower.includes('officer') ||
        textLower.includes('representative') ||
        textLower.includes('human') ||
        textLower.includes('dispute') ||
        textLower.includes('operator')
      ) {
        const transferMsg =
          'It sounds like you are experiencing difficulty with our automated menu. Please hold while we transfer your call to the queue for a customer service representative.';
        addMessage('ROBOCALLER', transferMsg);
        speechEngine.speakRobocaller(transferMsg, () => {
          enterHoldQueue();
        });
      } else {
        setLoopsSurvived((prev) => prev + 1);
        const misunderstanding =
          'Did you say: Report employment separation certificate? If this is correct, press 1. Otherwise, say "No" to return to the main menu.';
        addMessage('ROBOCALLER', misunderstanding);
        speechEngine.speakRobocaller(misunderstanding, () => {
          if (isMicActive) micAnalyzer.startListening();
        });
      }
    } else if (callStatus === 'AGENT_TALKING') {
      // 4. Human Representative Dialogue with Mission Keyword Verification
      const rep = currentRepresentative;
      const voiceOpts = {
        gender: rep.gender,
        pitch: rep.pitch,
        rate: rep.rate,
        voiceHints: rep.voiceHints,
      };

      const matchedPhrase = activeMission.keyPhrases.some((phrase) =>
        textLower.includes(phrase.toLowerCase())
      );

      const generalRelevantKeywords = [
        'medical', 'doctor', 'certificate', 'pdf', 'scanner', 'fingerprint',
        'attended', 'casual', 'earnings', 'bar', 'cousin', 'dubbo', 'unlink',
        'austudy', 'study load', 'carer', 'mother', 'review', 'dsp', 'disability',
        'points', 'impairment', 'rent', 'lease', 'periodic', 'mygov', 'exemption',
        'appointment', 'breach', 'hours', 'separation', 'compliance'
      ];
      const hasRelevantTopic = matchedPhrase || generalRelevantKeywords.some((kw) => textLower.includes(kw));

      // Try server API first
      try {
        const res = await fetch('/api/call/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            speechText: transcript,
            volumeDb: result.peakDb,
            activeMission,
            representative: rep,
            dialogueHistory: messages.slice(-4),
            holdTimeSeconds: callSeconds,
            difficulty,
            screamStrikes,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          addMessage('AGENT', data.agentResponseText);
          speechEngine.speakRepresentative(data.agentResponseText, voiceOpts, () => {
            if (data.approved) {
              setCallStatus('VICTORY');
              setShowVictory(true);
            } else if (data.agentState === 'PUT_ON_HOLD_AGAIN') {
              enterHoldQueue(
                `${rep.name} has placed you on hold while consulting with a senior technical specialist...`
              );
            } else if (isMicActive) {
              micAnalyzer.startListening();
            }
          });
          return;
        }
      } catch {
        // try client-side Gemini fallback for static GitHub Pages
        const clientRes = await generateClientAgent({
          speechText: transcript,
          volumeDb: result.peakDb,
          activeMission,
          representative: rep,
          holdTimeSeconds: callSeconds,
          difficulty,
          screamStrikes,
        });

        if (clientRes) {
          addMessage('AGENT', clientRes.agentResponseText);
          speechEngine.speakRepresentative(clientRes.agentResponseText, voiceOpts, () => {
            if (clientRes.approved) {
              setCallStatus('VICTORY');
              setShowVictory(true);
            } else if (clientRes.agentState === 'PUT_ON_HOLD_AGAIN') {
              enterHoldQueue(
                `${rep.name} has placed you on hold while consulting with a senior technical specialist...`
              );
            } else if (isMicActive) {
              micAnalyzer.startListening();
            }
          });
          return;
        }
      }

      // Offline programmatic keyword checking:
      // If user made random noise or mumbled gibberish without keywords, do NOT approve!
      if (!hasRelevantTopic || textLower.length < 4) {
        const confusionMsg =
          rep.gender === 'male'
            ? `Mate, that didn't make a lick of sense. Speak up clearly—what's the actual story with your documentation or provider?`
            : `I'm sorry, I could not understand that. Please state clearly the reason for your compliance dispute so I can check your file.`;
        addMessage('AGENT', confusionMsg);
        speechEngine.speakRepresentative(confusionMsg, voiceOpts, () => {
          if (isMicActive) micAnalyzer.startListening();
        });
        return;
      }

      // If user articulated key mission phrases with firm volume (50-81 dB): APPROVE!
      if (matchedPhrase && result.peakDb >= 50 && result.peakDb <= 81) {
        const winMsg =
          rep.approvalResponses[Math.floor(Math.random() * rep.approvalResponses.length)];
        addMessage('AGENT', winMsg);
        speechEngine.speakRepresentative(winMsg, voiceOpts, () => {
          setCallStatus('VICTORY');
          setShowVictory(true);
        });
      } else {
        const stallMsg =
          rep.stallResponses[Math.floor(Math.random() * rep.stallResponses.length)];
        addMessage('AGENT', stallMsg);
        speechEngine.speakRepresentative(stallMsg, voiceOpts, () => {
          if (isMicActive) micAnalyzer.startListening();
        });
      }
    }
  };

  // Wire up the speech recognition callback to the current speech handler
  handleUserSpeechRef.current = handleUserSpeech;

  // Hold queue loop
  useEffect(() => {
    if (callStatus !== 'HOLD_QUEUE') return;

    const config = DIFFICULTY_CONFIGS[difficulty];
    const holdInterval = window.setInterval(() => {
      // Reverse queue jump
      if (Math.random() < config.reverseJumpProbability / 10) {
        const bump = Math.floor(2 + Math.random() * 5);
        setQueuePos((prev) => prev + bump);
        setReverseJumps((prev) => prev + 1);
        addMessage(
          'ROBOCALLER',
          `Due to urgent priority processing of vulnerable clients, you are now caller number ${
            queuePos + bump
          } in the queue.`
        );
        return;
      }

      // Queue decrement
      setQueuePos((prev) => {
        if (prev <= 1) {
          clearInterval(holdInterval);
          holdMusic.stop();

          // Trap chance: "Hold for an agent who never answers"
          if (Math.random() < 0.25) {
            setCallStatus('AGENT_NEVER_ANSWERS_TRAP');
            const trapMsg =
              'Centrelink Services, please hold while I transfer your call to a specialized dispute resolution officer...';
            addMessage('ROBOCALLER', trapMsg);
            speechEngine.speakRobocaller(trapMsg, () => {
              setQueuePos(Math.floor(10 + Math.random() * 15));
              setCallStatus('HOLD_QUEUE');
              holdMusic.play();
            });
            return prev;
          }

          // Diverse representative answers! (Darren, Priya, Greg, Minh, Dimitri, Sharon, Gurpreet, Mateo)
          const rep = getRandomRepresentative();
          setCurrentRepresentative(rep);
          setCallStatus('AGENT_TALKING');
          micAnalyzer.setMeterActive(true);
          const agentGreeting = rep.greeting(activeMission.crn, activeMission.title);
          addMessage('AGENT', agentGreeting);
          speechEngine.speakRepresentative(
            agentGreeting,
            {
              gender: rep.gender,
              pitch: rep.pitch,
              rate: rep.rate,
              voiceHints: rep.voiceHints,
            },
            () => {
              if (isMicActive) micAnalyzer.startListening();
            }
          );
          return 0;
        }
        return prev - 1;
      });
    }, config.secondsPerQueueStep * 1000);

    return () => clearInterval(holdInterval);
  }, [callStatus, queuePos, difficulty, activeMission, isMicActive]);

  const handlePlayAgain = () => {
    setShowVictory(false);
    setMissionIndex((prev) => prev + 1);
    setCallStatus('IDLE');
    setMessages([]);
    speechEngine.stop();
    holdMusic.stop();
    setSignalDots(5);
    setShowDifficultyModal(true);
  };

  const stats: CallStats = {
    totalSeconds: callSeconds,
    holdSeconds: callSeconds > 10 ? callSeconds - 10 : 0,
    loopsSurvived,
    peakDb,
    initialQueuePos,
    currentQueuePos: queuePos,
    reverseJumps,
    tamperCount: antiCheatRef.current.getTamperCount(),
  };

  const isCallActive =
    callStatus !== 'IDLE' && callStatus !== 'CALL_ENDED' && callStatus !== 'VICTORY';

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden select-none">
      {/* Dynamic Colorful Blurred Wallpaper Layer */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-700 ease-in-out scale-110"
        style={{
          background: currentWallpaper.gradient,
          filter: 'blur(36px) brightness(0.85) saturate(1.4)',
        }}
      />
      {/* Soft Vignette / Translucent Overlay */}
      <div className="fixed inset-0 bg-black/25 pointer-events-none" />

      {/* iOS 7 Status Bar with EXACT Mathematical Center Clock */}
      <header className="relative z-30 w-full pt-2 px-5 flex items-center justify-between text-white/95 text-xs font-light">
        {/* Left: 5 Signal Dots + Carrier (fluctuates during call) */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((dot) => (
              <span
                key={dot}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  dot <= signalDots ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          <span className="font-normal text-[11px] tracking-wide ml-1">
            {signalDots === 0 ? 'Searching...' : 'Telstra 4G'}
          </span>
        </div>

        {/* Center: Clock Dead-Centered Absolutely! */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2 font-normal tracking-wide text-[13px] drop-shadow-xs pointer-events-none">
          {currentTimeStr}
        </div>

        {/* Right: Battery + Controls (Shuffle Reason, Wallpaper, Settings) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShuffleMission}
            className="p-1 text-white/75 hover:text-white transition cursor-pointer"
            title="Switch reason for calling Centrelink"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCycleWallpaper}
            className="p-1 text-white/75 hover:text-white transition cursor-pointer"
            title={`Wallpaper: ${currentWallpaper.name} (Click to switch)`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="p-1 text-white/75 hover:text-white transition cursor-pointer"
            title="Settings (Gemini API Key & Hold Music)"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1 font-mono text-[11px] ml-1">
            <span>78%</span>
            <div className="w-5 h-2.5 rounded-xs border border-white/80 p-0.5 flex items-center">
              <div className="h-full w-3.5 bg-white rounded-2xs" />
            </div>
          </div>
        </div>
      </header>

      {/* Autoclosed System Info Dropdown */}
      <div className="relative z-30 w-full px-4 pt-1">
        <InfoDropdown
          stats={stats}
          difficulty={difficulty}
          isCallActive={isCallActive}
          rushPeriodName={rushPeriodName}
          tamperDetected={tamperDetected}
          onOpenDifficultyModal={() => setShowDifficultyModal(true)}
        />
      </div>

      {/* Center Phone Display (Keypad vs In-Call Screen) */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center p-3 sm:p-4 w-full max-w-md mx-auto">
        {isCallActive ? (
          <IOSInCallScreen
            callStatus={callStatus}
            callSeconds={callSeconds}
            currentDb={currentDb}
            currentZone={currentZone}
            isMicActive={isMicActive}
            messages={messages}
            currentMenuPrompt={currentMenuPrompt}
            agentName={currentRepresentative.name}
            screamStrikes={screamStrikes}
            screamTimer={screamTimer}
            isScreamImmune={isScreamImmune}
            onHangUp={handleHangUp}
            onKeypadPress={handleKeypadPress}
            onToggleMic={handleToggleMic}
          />
        ) : (
          <IOSKeypad
            dialedNumber={dialedNumber}
            onNumberChange={setDialedNumber}
            onCall={handleDial}
          />
        )}
      </main>

      {/* Side Slide-Out Mission Drawer (Highlighted only on lower difficulties when needed) */}
      <MissionDrawer
        mission={activeMission}
        difficulty={difficulty}
        callStatus={callStatus}
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      {/* Initial / Change Difficulty Modal */}
      {showDifficultyModal && (
        <DifficultyModal
          currentDifficulty={difficulty}
          rushPeriodName={rushPeriodName}
          onSelect={setDifficulty}
          onConfirm={() => setShowDifficultyModal(false)}
        />
      )}

      {/* Settings & Privacy Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Roadblock Modals */}
      {roadblockType && (
        <RoadblockModal
          type={roadblockType}
          onRedial={handlePanicRedial}
          onDismiss={() => setRoadblockType(null)}
        />
      )}

      {/* Victory Modal */}
      {showVictory && (
        <GameVictoryModal
          mission={activeMission}
          difficulty={difficulty}
          stats={stats}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {/* Clean iOS 7 Glass Bottom Bar */}
      <footer className="relative z-20 w-full py-2 px-4 text-center text-[10px] text-white/50 font-light select-none">
        <span>Centrelink 132 850 · iOS 7.1 Telephony Edition</span>
      </footer>
    </div>
  );
}
