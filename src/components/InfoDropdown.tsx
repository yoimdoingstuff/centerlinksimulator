import React, { useState } from 'react';
import { CallStats, Difficulty } from '../types/game';
import { holdMusicConfig } from '../config/holdMusicConfig';
import { ChevronDown, ChevronUp, Clock, Music, Volume2, ShieldCheck, Settings2 } from 'lucide-react';

interface InfoDropdownProps {
  stats: CallStats;
  difficulty: Difficulty;
  isCallActive: boolean;
  rushPeriodName: string;
  tamperDetected: boolean;
  onOpenDifficultyModal: () => void;
}

export const InfoDropdown: React.FC<InfoDropdownProps> = ({
  stats,
  difficulty,
  isCallActive,
  rushPeriodName,
  tamperDetected,
  onOpenDifficultyModal,
}) => {
  // Autoclosed by default as requested!
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="w-full max-w-sm mx-auto mb-3 select-none">
      {/* Dropdown Toggle Trigger Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/70 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer backdrop-blur-md"
        >
          <Settings2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Queue Telemetry & System Info</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Dropdown Expandable Card */}
      {isOpen && (
        <div className="mt-2.5 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-3.5 text-xs text-slate-800 dark:text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              Queue Telemetry
            </span>
            <span className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
              {difficulty} MODE
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
            <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 text-[10px] block">Queue Position</span>
              <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                #{stats.currentQueuePos}
              </span>
              <span className="text-[9px] text-slate-400 block">started #{stats.initialQueuePos}</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 text-[10px] block">Reverse Jumps</span>
              <span className="font-mono font-bold text-sm text-amber-500">
                {stats.reverseJumps}
              </span>
              <span className="text-[9px] text-slate-400 block">people cut in line</span>
            </div>
          </div>

          {/* Voice Urgency Sweet Spot Guide */}
          <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
              Voice Escalation Guide:
            </span>
            <ul className="text-[10px] text-slate-500 space-y-0.5 pl-1">
              <li>• <span className="text-amber-500 font-medium">30 - 55 dB</span>: Casual/polite (ignored or looped)</li>
              <li>• <span className="text-emerald-500 font-bold">56 - 81 dB</span>: Firm/loud (sweet spot to reach operator)</li>
              <li>• <span className="text-red-500 font-medium">&gt; 82 dB</span>: Screaming (hostile caller penalty)</li>
            </ul>
          </div>

          {/* Hold Music Configuration Info */}
          <div className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 truncate">
              <Music className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500 truncate">Hold Music:</span>
              <span className="font-medium truncate text-slate-700 dark:text-slate-300">
                {holdMusicConfig.trackTitle}
              </span>
            </div>
          </div>

          {/* Anti-Cheat & Time of Day */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Anti-cheat clock locked
            </span>
            <span>{rushPeriodName}</span>
          </div>

          {/* Change Difficulty Button */}
          {!isCallActive && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenDifficultyModal();
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Change Difficulty
            </button>
          )}
        </div>
      )}
    </div>
  );
};
