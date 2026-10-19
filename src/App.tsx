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
  playRingbackTone,
  playDisconnectTone,
  playStaticBurst,
} from './audio/dtmf';
import { holdMusic } from './audio/holdSynthesizer';
import { speechEngine } from './audio/speechEngine';
import { micAnalyzer, VoicePhraseResult } from './audio/micAnalyzer';
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
import { Wifi, Image as ImageIcon } from 'lucide-react';

export default function App() {
  // Wallpaper state (randomized colorful blurred wallpaper)
  const [currentWallpaper, setCurrentWallpaper] = useState<Wallpaper>(() => getRandomWallpaper());

  // Game & Dial state
  const [dialedNumber, setDialedNumber] = useState<string>('132 850');
  const [missionIndex, setMissionIndex] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [callStatus, setCallStatus] = useState<CallStatus>('IDLE');
  const [currentMenuId, setCurrentMenuId] = useState<string>('MAIN_MENU');
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [currentMenuPrompt, setCurrentMenuPrompt] = useState<string>('');

  // UI Drawer & Modal states
  const [showDifficultyModal, setShowDifficultyModal] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [roadblockType, setRoadblockType] = useState<
    'LINE_DROPPED' | 'CLOCK_TAMPERED' | 'HOSTILE_CALLER' | null
  >(null);
  const [showVictory, setShowVictory] = useState<boolean>(false);

  // Audio & Mic state
  const [currentDb, setCurrentDb] = useState<number>(0);
  const [currentZone, setCurrentZone] = useState<VolumeZone>('TOO_QUIET');
  const [isMicActive, setIsMicActive] = useState<boolean>(true);

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

  // References
  const antiCheatRef = useRef<AntiCheatClock>(new AntiCheatClock());
  const callIntervalRef = useRef<number | null>(null);
  const ringCancelRef = useRef<(() => void) | null>(null);
  const isTransitioningRef = useRef<boolean>(false);

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

  // Connect microphone callbacks
  useEffect(() => {
    micAnalyzer.setCallbacks(
      (db, zone) => {
        if (!isMicActive) {
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
        if (!isMicActive) return;
        handleUserSpeech(result);
      }
    );

    return () => {
      micAnalyzer.cleanup();
      speechEngine.stop();
      holdMusic.stop();
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
      if (ringCancelRef.current) ringCancelRef.current();
    };
  }, [callStatus, currentMenuId, queuePos, isMicActive]);

  // Cycle wallpaper
  const handleCycleWallpaper = () => {
    const currentIndex = IOS_WALLPAPERS.findIndex((w) => w.id === currentWallpaper.id);
    const nextIndex = (currentIndex + 1) % IOS_WALLPAPERS.length;
    setCurrentWallpaper(IOS_WALLPAPERS[nextIndex]);
  };

  // Toggle microphone with hardware mute
  const handleToggleMic = () => {
    const nextState = !isMicActive;
    setIsMicActive(nextState);
    micAnalyzer.setMuted(!nextState); // True tab-level hardware mute!
    if (!nextState) {
      setCurrentDb(0);
      setCurrentZone('TOO_QUIET');
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

  // Start call
  const handleDial = async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    // Unmute mic when placing new call
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

    const queueData = calculateTimeOfDayQueue(difficulty);
    setQueuePos(queueData.initialCount);
    setInitialQueuePos(queueData.initialCount);
    setReverseJumps(0);
    setLoopsSurvived(0);
    setPeakDb(0);

    // Guaranteed transition to Robocaller IVR after ring tone
    ringCancelRef.current = playRingbackTone(() => {
      isTransitioningRef.current = false;
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
          'SECURITY ALERT: System clock discrepancy detected. In accordance with Services Australia integrity rules, you have been pushed back 45 spots in the queue.'
        );
      }
    }, 1000);
  };

  // Enter Robocaller IVR menu
  const enterRobocaller = (menuId: string) => {
    setCallStatus('ROBOCALLER_IVR');
    setCurrentMenuId(menuId);
    holdMusic.stop();

    const menu = IVR_MENUS[menuId] || IVR_MENUS.MAIN_MENU;
    setCurrentMenuPrompt(menu.spokenPrompt);
    addMessage('ROBOCALLER', menu.spokenPrompt);

    speechEngine.speakRobocaller(menu.spokenPrompt, () => {
      if (isMicActive) {
        micAnalyzer.startListening();
      }
    });
  };

  // Enter Hold Queue
  const enterHoldQueue = (initialWaitMessage?: string) => {
    setCallStatus('HOLD_QUEUE');
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
    isTransitioningRef.current = false;
    speechEngine.stop();
    holdMusic.stop();
    micAnalyzer.stopListening();
    if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    if (ringCancelRef.current) ringCancelRef.current();
    setCallStatus('IDLE');
    addMessage('SYSTEM', 'Call disconnected.');
  };

  // Panic redial when line drops
  const handlePanicRedial = () => {
    setRoadblockType(null);
    setCallStatus('HOLD_QUEUE');
    playRingbackTone(() => {
      addMessage(
        'ROBOCALLER',
        `Reconnected to Services Australia exchange. Your position in line (#${queuePos}) was preserved.`
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
    if (!isMicActive) return;
    if (callStatus !== 'ROBOCALLER_IVR' && callStatus !== 'AGENT_TALKING') return;

    addMessage('USER', result.transcript, result.peakDb);

    // Hostile screaming penalty (> 82 dB)
    if (result.peakDb >= 82) {
      setRoadblockType('HOSTILE_CALLER');
      setQueuePos((p) => p + 25);
      setReverseJumps((j) => j + 1);
      const penaltyMsg =
        'We do not tolerate abusive or aggressive language towards our staff or automated systems. Your call has been returned to the general automated menu.';
      addMessage('ROBOCALLER', penaltyMsg);
      speechEngine.speakRobocaller(penaltyMsg, () => {
        enterRobocaller('MAIN_MENU');
      });
      return;
    }

    if (callStatus === 'ROBOCALLER_IVR') {
      const isUrgent = result.peakDb >= 56 && result.peakDb < 82;

      try {
        const res = await fetch('/api/call/ivr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            speechText: result.transcript,
            volumeDb: result.peakDb,
            currentMenu: currentMenuId,
            promptTask: activeMission.title,
            difficulty,
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
        // client fallback
      }

      if (isUrgent) {
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
      try {
        const res = await fetch('/api/call/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            speechText: result.transcript,
            volumeDb: result.peakDb,
            activeMission,
            dialogueHistory: messages.slice(-4),
            holdTimeSeconds: callSeconds,
            difficulty,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          addMessage('AGENT', data.agentResponseText);
          speechEngine.speakRepresentative(data.agentResponseText, () => {
            if (data.approved) {
              setCallStatus('VICTORY');
              setShowVictory(true);
            } else if (data.agentState === 'PUT_ON_HOLD_AGAIN') {
              enterHoldQueue(
                'Sharon has placed you on hold while consulting with a senior technical specialist...'
              );
            } else if (isMicActive) {
              micAnalyzer.startListening();
            }
          });
          return;
        }
      } catch {
        // client fallback
      }

      const matchedPhrase = activeMission.keyPhrases.some((phrase) =>
        result.transcript.toLowerCase().includes(phrase.toLowerCase())
      );

      if (matchedPhrase && result.peakDb >= 50 && result.peakDb <= 81) {
        const winMsg =
          "Right, look... I've found your file on my screen. System's playing up today, but I've manually overridden the breach and stamped your exemption. Your payment should clear in 24 to 48 hours. Is there anything else today?";
        addMessage('AGENT', winMsg);
        speechEngine.speakRepresentative(winMsg, () => {
          setCallStatus('VICTORY');
          setShowVictory(true);
        });
      } else {
        const stallMsg =
          "Centrelink Services, Sharon speaking. Yeah look, I can see something on your screen here, but the server's running slow. Can you clearly state why you believe this decision is incorrect?";
        addMessage('AGENT', stallMsg);
        speechEngine.speakRepresentative(stallMsg, () => {
          if (isMicActive) micAnalyzer.startListening();
        });
      }
    }
  };

  // Hold queue loop
  useEffect(() => {
    if (callStatus !== 'HOLD_QUEUE') return;

    const config = DIFFICULTY_CONFIGS[difficulty];
    const holdInterval = window.setInterval(() => {
      // Line drop
      if (Math.random() < config.dropProbabilityPerMinute / 12) {
        holdMusic.stop();
        playStaticBurst(300);
        playDisconnectTone(2000);
        setCallStatus('LINE_DROPPED');
        setRoadblockType('LINE_DROPPED');
        addMessage('SYSTEM', 'CRITICAL WARNING: Carrier connection lost! Line dropped.');
        return;
      }

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

          // Trap chance
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

          // Real representative Sharon picks up!
          setCallStatus('AGENT_TALKING');
          const agentGreeting = `Centrelink Services Australia, Sharon speaking. I have your CRN ${activeMission.crn} on screen. How can I assist you with your mutual obligations today?`;
          addMessage('AGENT', agentGreeting);
          speechEngine.speakRepresentative(agentGreeting, () => {
            if (isMicActive) micAnalyzer.startListening();
          });
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

      {/* iOS 7 Status Bar */}
      <header className="relative z-30 w-full pt-2 px-5 flex items-center justify-between text-white/95 text-xs font-light">
        {/* Signal Dots + Carrier */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
          <span className="font-normal text-[11px] tracking-wide ml-1">Telstra 4G</span>
        </div>

        {/* Center Time */}
        <div className="text-center font-normal tracking-wide text-[13px] drop-shadow-xs">
          {currentTimeStr}
        </div>

        {/* Battery + Wallpaper Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCycleWallpaper}
            className="p-1 text-white/70 hover:text-white transition cursor-pointer"
            title={`Wallpaper: ${currentWallpaper.name} (Click to switch)`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1 font-mono text-[11px]">
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
        <span>Services Australia 132 850 · iOS 7.1 Telephony Edition</span>
      </footer>
    </div>
  );
}
