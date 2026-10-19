import React from 'react';
import { Difficulty } from '../types/game';
import { DIFFICULTY_CONFIGS } from '../utils/antiCheat';
import { Check, Shield, Clock } from 'lucide-react';

interface DifficultyModalProps {
  currentDifficulty: Difficulty;
  rushPeriodName: string;
  onSelect: (diff: Difficulty) => void;
  onConfirm: () => void;
}

export const DifficultyModal: React.FC<DifficultyModalProps> = ({
  currentDifficulty,
  rushPeriodName,
  onSelect,
  onConfirm,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="text-center space-y-1 mb-5">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Select Difficulty</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            How much bureaucracy can you endure today?
          </p>
        </div>

        {/* Grouped iOS style list */}
        <div className="space-y-2 mb-6">
          {(['EASY', 'NORMAL', 'REALISTIC'] as Difficulty[]).map((d) => {
            const cfg = DIFFICULTY_CONFIGS[d];
            const isSelected = currentDifficulty === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onSelect(d)}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500/60 text-blue-950 dark:text-blue-100 ring-1 ring-blue-500/30'
                    : 'bg-slate-100/70 dark:bg-slate-800/50 border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{cfg.label}</span>
                    {d === 'REALISTIC' && (
                      <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">
                        Authentic
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cfg.expectedDuration}</span>
                  </div>
                  {d === 'REALISTIC' && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-mono">
                      Current queue: {rushPeriodName}
                    </div>
                  )}
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 transition cursor-pointer text-sm"
        >
          Open Phone & Start
        </button>
      </div>
    </div>
  );
};
