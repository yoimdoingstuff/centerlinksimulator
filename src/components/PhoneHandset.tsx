import React, { useState } from 'react';
import { CallStatus, DialogueMessage, VolumeZone } from '../types/game';
import { playDTMFTone } from '../audio/dtmf';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Bot, User, Radio, Signal, Wifi, BatteryMedium } from 'lucide-react';
import { VolumeMeter } from './VolumeMeter';

interface PhoneHandsetProps {
  callStatus: CallStatus;
  callSeconds: number;
  currentDb: number;
  currentZone: VolumeZone;
  isMicActive: boolean;
  messages: DialogueMessage[];
  currentMenuPrompt: string;
  onDial: () => void;
  onHangUp: () => void;
  onKeypadPress: (key: string) => void;
  onToggleMic: () => void;
}

export const PhoneHandset: React.FC<PhoneHandsetProps> = ({
  callStatus,
  callSeconds,
  currentDb,
  currentZone,
  isMicActive,
  messages,
  currentMenuPrompt,
  onDial,
  onHangUp,
  onKeypadPress,
  onToggleMic,
}) => {
  const [showKeypad, setShowKeypad] = useState<boolean>(true);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyClick = (key: string) => {
    playDTMFTone(key);
    onKeypadPress(key);
  };

  const isCallActive =
    callStatus !== 'IDLE' && callStatus !== 'CALL_ENDED' && callStatus !== 'VICTORY';

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="relative mx-auto w-full max-w-[390px] bg-slate-950 rounded-[44px] p-4 shadow-2xl border-4 border-slate-700/80 ring-1 ring-slate-800">
      {/* Phone Earpiece Notch */}
      <div className="flex justify-center mb-3">
        <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center gap-2 border border-slate-800">
          <div className="w-2 h-2 rounded-full bg-slate-800" />
          <div className="w-8 h-1 bg-slate-800 rounded-full" />
        </div>
      </div>

      {/* Handset Screen */}
      <div className="bg-slate-900 rounded-[32px] overflow-hidden flex flex-col h-[670px] border border-slate-800 relative">
        {/* Top Status Bar */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between text-xs text-slate-400 font-mono border-b border-slate-800/40">
          <div className="flex items-center gap-1.5 font-sans font-medium text-slate-300">
            <span>Telstra 4G</span>
          </div>
          <div className="flex items-center gap-2">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Call Banner Header */}
        <div className="px-5 py-3 text-center bg-gradient-to-b from-slate-900 to-slate-900/90 border-b border-slate-800/60">
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">Services Australia</h2>
          <p className="text-xs font-mono text-amber-400 font-medium">132 850 (Centrelink)</p>

          {isCallActive ? (
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-mono text-emerald-400 font-bold tabular-nums">
                {formatTimer(callSeconds)}
              </span>
              <span className="text-xs text-slate-400 font-sans">
                {callStatus === 'DIALING' && '· Dialing...'}
                {callStatus === 'ROBOCALLER_IVR' && '· Automated IVR'}
                {callStatus === 'HOLD_QUEUE' && '· On Hold'}
                {callStatus === 'AGENT_TALKING' && '· Officer Sharon'}
                {callStatus === 'AGENT_NEVER_ANSWERS_TRAP' && '· Hold Trap'}
                {callStatus === 'LINE_DROPPED' && '· LINE DROPPED'}
              </span>
            </div>
          ) : (
            <div className="mt-1 text-xs text-slate-500">Call Disconnected</div>
          )}
        </div>

        {/* Dynamic Center Area */}
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3 min-h-0">
          {/* Active Speaker Avatar Card */}
          {isCallActive ? (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 shrink-0">
              {callStatus === 'AGENT_TALKING' ? (
                <div className="w-12 h-12 rounded-full bg-blue-900/60 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0">
                  <User className="w-6 h-6" />
                </div>
              ) : callStatus === 'HOLD_QUEUE' || callStatus === 'AGENT_NEVER_ANSWERS_TRAP' ? (
                <div className="w-12 h-12 rounded-full bg-amber-900/40 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 animate-pulse">
                  <Radio className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {callStatus === 'AGENT_TALKING'
                      ? 'Sharon (Level 2 Services Officer)'
                      : callStatus === 'HOLD_QUEUE' || callStatus === 'AGENT_NEVER_ANSWERS_TRAP'
                      ? 'National Holding Queue'
                      : 'Interactive Voice Response Bot'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {callStatus === 'AGENT_TALKING'
                    ? 'Reviewing claims & manual overrides'
                    : callStatus === 'HOLD_QUEUE'
                    ? 'Playing hold muzak... Listen for announcements'
                    : 'Voice & Keypad Navigation Active'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <Phone className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">Ready to place call</p>
              <p className="text-xs text-slate-500 mt-1">Tap the green Call button to connect</p>
            </div>
          )}

          {/* Live Transcript / Dialogue Bubble */}
          {isCallActive && (
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex-1 overflow-y-auto text-xs space-y-2">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Live Call Audio Feed
              </div>

              {lastMessage ? (
                <div
                  className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                    lastMessage.sender === 'USER'
                      ? 'bg-blue-950/60 border border-blue-800/50 text-blue-200 ml-3'
                      : lastMessage.sender === 'AGENT'
                      ? 'bg-amber-950/40 border border-amber-800/40 text-amber-200 mr-3'
                      : 'bg-slate-800/60 border border-slate-700 text-slate-200 mr-3'
                  }`}
                >
                  <span className="font-semibold block mb-0.5 text-[10px] opacity-75">
                    {lastMessage.sender === 'USER' ? 'You (Voice Input)' : lastMessage.sender === 'AGENT' ? 'Sharon (Centrelink)' : 'Automated System'}
                  </span>
                  {lastMessage.text}
                </div>
              ) : (
                <p className="text-slate-400 italic text-[11px]">
                  {currentMenuPrompt || 'Connecting to Services Australia exchange...'}
                </p>
              )}
            </div>
          )}

          {/* Live Voice Decibel Meter */}
          {isCallActive && (
            <VolumeMeter currentDb={currentDb} zone={currentZone} isListening={isMicActive} />
          )}

          {/* Interactive DTMF Phone Keypad */}
          {isCallActive && showKeypad && (
            <div className="grid grid-cols-3 gap-2 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-2.5 shrink-0">
              {[
                { key: '1', sub: '.,' },
                { key: '2', sub: 'ABC' },
                { key: '3', sub: 'DEF' },
                { key: '4', sub: 'GHI' },
                { key: '5', sub: 'JKL' },
                { key: '6', sub: 'MNO' },
                { key: '7', sub: 'PQRS' },
                { key: '8', sub: 'TUV' },
                { key: '9', sub: 'WXYZ' },
                { key: '*', sub: ' ' },
                { key: '0', sub: '+' },
                { key: '#', sub: ' ' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleKeyClick(item.key)}
                  className="flex flex-col items-center justify-center py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 active:scale-95 text-slate-100 rounded-xl border border-slate-800 transition cursor-pointer select-none"
                  title={`Dial ${item.key}`}
                >
                  <span className="text-base font-bold font-mono leading-none">{item.key}</span>
                  <span className="text-[9px] font-sans text-slate-500 tracking-widest uppercase mt-0.5">
                    {item.sub}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Phone Action Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-around">
          {isCallActive ? (
            <>
              {/* Mic Toggle */}
              <button
                onClick={onToggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition border ${
                  isMicActive
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-red-900/50 border-red-700 text-red-300'
                }`}
                title={isMicActive ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              {/* Keypad Toggle */}
              <button
                onClick={() => setShowKeypad(!showKeypad)}
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition ${
                  showKeypad
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {showKeypad ? 'Hide Keypad' : 'Show Keypad'}
              </button>

              {/* Red Hangup Button */}
              <button
                onClick={onHangUp}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-900/40 transition cursor-pointer"
                title="Hang Up"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </>
          ) : (
            <button
              onClick={onDial}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition cursor-pointer"
            >
              <Phone className="w-5 h-5" />
              <span>Dial 132 850 (Start Simulator)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
