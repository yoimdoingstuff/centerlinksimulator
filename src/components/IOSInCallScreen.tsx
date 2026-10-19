import React, { useState } from 'react';
import { CallStatus, DialogueMessage, VolumeZone } from '../types/game';
import { playDTMFTone } from '../audio/dtmf';
import { triggerHaptic } from '../utils/haptics';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Plus,
  Video,
  User,
  Flame,
  AlertTriangle,
} from 'lucide-react';

interface IOSInCallScreenProps {
  callStatus: CallStatus;
  callSeconds: number;
  currentDb: number;
  currentZone: VolumeZone;
  isMicActive: boolean;
  messages: DialogueMessage[];
  currentMenuPrompt: string;
  agentName?: string;
  onHangUp: () => void;
  onKeypadPress: (key: string) => void;
  onToggleMic: () => void;
}

export const IOSInCallScreen: React.FC<IOSInCallScreenProps> = ({
  callStatus,
  callSeconds,
  currentDb,
  currentZone,
  isMicActive,
  messages,
  currentMenuPrompt,
  agentName,
  onHangUp,
  onKeypadPress,
  onToggleMic,
}) => {
  const [showInCallKeypad, setShowInCallKeypad] = useState<boolean>(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyClick = (key: string) => {
    triggerHaptic('light');
    playDTMFTone(key);
    onKeypadPress(key);
  };

  const handleMuteClick = () => {
    triggerHaptic('medium');
    onToggleMic();
  };

  const handleSpeakerClick = () => {
    triggerHaptic('medium');
    setIsSpeakerMuted(!isSpeakerMuted);
  };

  const handleKeypadToggle = () => {
    triggerHaptic('selection');
    setShowInCallKeypad(!showInCallKeypad);
  };

  const handleEndClick = () => {
    triggerHaptic('heavy');
    onHangUp();
  };

  const lastMessage = messages[messages.length - 1];

  // Exact iOS 7 behavior:
  // While dialing: "calling Centrelink..."
  // Once connected: replaced with JUST the call timer!
  const isDialing = callStatus === 'DIALING';
  const subtitleText = isDialing
    ? 'calling Centrelink...'
    : formatTimer(callSeconds);

  const keys = [
    { key: '1', letters: '' },
    { key: '2', letters: 'ABC' },
    { key: '3', letters: 'DEF' },
    { key: '4', letters: 'GHI' },
    { key: '5', letters: 'JKL' },
    { key: '6', letters: 'MNO' },
    { key: '7', letters: 'PQRS' },
    { key: '8', letters: 'TUV' },
    { key: '9', letters: 'WXYZ' },
    { key: '*', letters: '' },
    { key: '0', letters: '+' },
    { key: '#', letters: '' },
  ];

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center select-none py-2 px-3 text-white">
      {/* Caller Header: Centrelink + Just Timer once connected */}
      <div className="text-center mb-5">
        <h2 className="text-3xl sm:text-4xl font-light tracking-wide text-white drop-shadow-sm">
          Centrelink
        </h2>
        <p className="text-sm font-light text-white/90 mt-1 tracking-wider tabular-nums font-mono">
          {subtitleText}
        </p>
      </div>

      {/* Voice Decibel Indicator (Subtle translucent iOS bar) */}
      <div className="w-full max-w-[310px] bg-black/25 backdrop-blur-md rounded-2xl p-2.5 mb-5 border border-white/20 shadow-xs">
        <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
          <span className="text-white/80 flex items-center gap-1 font-sans">
            {!isMicActive ? (
              <span className="text-red-300 flex items-center gap-1">
                <MicOff className="w-3.5 h-3.5" /> Mic Muted
              </span>
            ) : currentZone === 'ASSERTIVE' ? (
              <span className="text-emerald-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-emerald-400" /> Urgency (Sweet Spot)
              </span>
            ) : currentZone === 'SCREAMING' ? (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Too Loud!
              </span>
            ) : (
              <span className="text-white/70 flex items-center gap-1">
                <Mic className="w-3.5 h-3.5" /> Mic:
              </span>
            )}
          </span>
          <span
            className={`font-bold tabular-nums ${
              !isMicActive
                ? 'text-red-300'
                : currentZone === 'ASSERTIVE'
                ? 'text-emerald-300'
                : currentZone === 'SCREAMING'
                ? 'text-red-400'
                : 'text-white'
            }`}
          >
            {isMicActive ? `${currentDb} dB` : 'MUTED'}
          </span>
        </div>

        {/* Level Bar */}
        <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-75 rounded-full ${
              !isMicActive
                ? 'bg-transparent'
                : currentZone === 'SCREAMING'
                ? 'bg-red-500'
                : currentZone === 'ASSERTIVE'
                ? 'bg-emerald-400'
                : 'bg-white/80'
            }`}
            style={{ width: `${!isMicActive ? 0 : Math.min(100, currentDb)}%` }}
          />
        </div>
      </div>

      {/* Live Audio Dialogue Subtitle Banner */}
      <div className="w-full max-w-[310px] bg-black/30 backdrop-blur-md rounded-2xl p-3 mb-6 border border-white/20 min-h-[70px] flex items-center text-xs leading-relaxed text-white/95 shadow-md">
        {lastMessage ? (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block text-white/70 mb-0.5">
              {lastMessage.sender === 'USER'
                ? 'You said:'
                : lastMessage.sender === 'AGENT'
                ? `${agentName || 'Sharon'} (Centrelink):`
                : 'Centrelink IVR:'}
            </span>
            <p className="line-clamp-3 font-light">{lastMessage.text}</p>
          </div>
        ) : (
          <p className="text-white/60 italic font-light">
            {currentMenuPrompt || 'Connected to Centrelink phone lines...'}
          </p>
        )}
      </div>

      {/* In-Call Keypad OR Exact iOS 7 6-Button Grid */}
      {showInCallKeypad ? (
        <div className="mb-6 animate-in fade-in zoom-in-95 duration-100">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">
            {keys.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleKeyClick(item.key)}
                className="w-18 h-18 rounded-full border border-white/50 bg-white/15 hover:bg-white/25 active:bg-white/45 backdrop-blur-md flex flex-col items-center justify-center text-white transition active:scale-95 cursor-pointer shadow-sm"
              >
                <span className="text-2xl font-light leading-none">{item.key}</span>
                {item.letters && (
                  <span className="text-[8px] font-medium tracking-wider text-white/80 uppercase mt-0.5">
                    {item.letters}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-center mt-3">
            <button
              type="button"
              onClick={handleKeypadToggle}
              className="px-5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-medium text-white transition cursor-pointer"
            >
              Hide Keypad
            </button>
          </div>
        </div>
      ) : (
        /* Exact iOS 7 In-Call Action Circles */
        <div className="grid grid-cols-3 gap-x-6 sm:gap-x-7 gap-y-5 mb-8">
          {/* 1. Mute */}
          <button
            type="button"
            onClick={handleMuteClick}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div
              className={`w-18 h-18 sm:w-19 sm:h-19 rounded-full flex items-center justify-center transition border ${
                !isMicActive
                  ? 'bg-white text-slate-900 border-white shadow-md'
                  : 'border-white/50 bg-white/10 hover:bg-white/20 active:bg-white/35 backdrop-blur-md text-white'
              }`}
            >
              {!isMicActive ? (
                <MicOff className="w-7 h-7 stroke-[1.8]" />
              ) : (
                <div className="relative">
                  <Mic className="w-7 h-7 stroke-[1.8]" />
                  <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-white -rotate-45" />
                </div>
              )}
            </div>
            <span className="text-xs font-light text-white/90">mute</span>
          </button>

          {/* 2. Keypad (3x3 dots) */}
          <button
            type="button"
            onClick={handleKeypadToggle}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-18 h-18 sm:w-19 sm:h-19 rounded-full border border-white/50 bg-white/10 hover:bg-white/20 active:bg-white/35 backdrop-blur-md flex items-center justify-center text-white transition">
              <div className="grid grid-cols-3 gap-1 p-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
            <span className="text-xs font-light text-white/90">keypad</span>
          </button>

          {/* 3. Speaker */}
          <button
            type="button"
            onClick={handleSpeakerClick}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div
              className={`w-18 h-18 sm:w-19 sm:h-19 rounded-full flex items-center justify-center transition border ${
                isSpeakerMuted
                  ? 'bg-white text-slate-900 border-white'
                  : 'border-white/50 bg-white/10 hover:bg-white/20 active:bg-white/35 backdrop-blur-md text-white'
              }`}
            >
              {isSpeakerMuted ? (
                <VolumeX className="w-7 h-7 stroke-[1.8]" />
              ) : (
                <Volume2 className="w-7 h-7 stroke-[1.8]" />
              )}
            </div>
            <span className="text-xs font-light text-white/90">speaker</span>
          </button>

          {/* 4. Add Call */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              alert('Centrelink: 3-way calling is not permitted.');
            }}
            className="flex flex-col items-center gap-1.5 cursor-pointer opacity-50"
          >
            <div className="w-18 h-18 sm:w-19 sm:h-19 rounded-full border border-white/30 bg-white/5 backdrop-blur-md flex items-center justify-center text-white">
              <Plus className="w-7 h-7 stroke-[1.8]" />
            </div>
            <span className="text-xs font-light text-white/60">add call</span>
          </button>

          {/* 5. FaceTime */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              alert('FaceTime is not available with Centrelink.');
            }}
            className="flex flex-col items-center gap-1.5 cursor-pointer opacity-40"
          >
            <div className="w-18 h-18 sm:w-19 sm:h-19 rounded-full border border-white/30 bg-white/5 backdrop-blur-md flex items-center justify-center text-white">
              <Video className="w-7 h-7 stroke-[1.8]" />
            </div>
            <span className="text-xs font-light text-white/50">FaceTime</span>
          </button>

          {/* 6. Contacts */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              alert('Contacts: Centrelink 132 850');
            }}
            className="flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <div className="w-18 h-18 sm:w-19 sm:h-19 rounded-full border border-white/50 bg-white/10 hover:bg-white/20 active:bg-white/35 backdrop-blur-md flex items-center justify-center text-white transition">
              <User className="w-7 h-7 stroke-[1.8]" />
            </div>
            <span className="text-xs font-light text-white/90">contacts</span>
          </button>
        </div>
      )}

      {/* iOS 7 Wide Red "End" Bar Button */}
      <div className="w-full max-w-[310px] flex justify-center">
        <button
          type="button"
          onClick={handleEndClick}
          className="w-full py-4 bg-[#ff3b30] hover:bg-[#e0342a] active:scale-[0.98] text-white font-normal text-2xl rounded-2xl text-center shadow-xl shadow-red-950/40 transition cursor-pointer"
        >
          End
        </button>
      </div>
    </div>
  );
};
