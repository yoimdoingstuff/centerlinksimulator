import React, { useState } from 'react';
import { Mission, Difficulty, CallStatus } from '../types/game';
import { MISSIONS } from '../utils/missions';
import { FileText, X, ChevronLeft, ChevronRight, ShieldAlert, Sparkles, PhoneCall, Lock, Shuffle, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface MissionDrawerProps {
  mission: Mission;
  difficulty: Difficulty;
  callStatus: CallStatus;
  isOpen: boolean;
  onToggle: () => void;
  onSelectMission?: (index: number) => void;
  onShuffleMission?: () => void;
}

export const MissionDrawer: React.FC<MissionDrawerProps> = ({
  mission,
  difficulty,
  callStatus,
  isOpen,
  onToggle,
  onSelectMission,
  onShuffleMission,
}) => {
  const [showCaseSelector, setShowCaseSelector] = useState<boolean>(false);
  const isLowerDifficulty = difficulty === 'EASY' || difficulty === 'NORMAL';
  const isActivelyNeeded = callStatus === 'ROBOCALLER_IVR' || callStatus === 'AGENT_TALKING';
  const isHighlighted = isLowerDifficulty && isActivelyNeeded;
  const isCallActive = callStatus !== 'IDLE' && callStatus !== 'CALL_ENDED' && callStatus !== 'VICTORY';

  const handleCaseSelect = (idx: number) => {
    triggerHaptic('selection');
    if (onSelectMission) {
      onSelectMission(idx);
    }
    setShowCaseSelector(false);
  };

  return (
    <>
      {/* Pull Tab / Handle sticking out from the right edge */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <button
          type="button"
          onClick={onToggle}
          className={`flex items-center gap-1.5 py-3 px-2.5 rounded-l-2xl shadow-xl border-y border-l transition-all cursor-pointer ${
            isHighlighted
              ? 'bg-amber-500 text-slate-950 border-amber-300 ring-4 ring-amber-400/50 animate-pulse'
              : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800'
          }`}
          title="Open Case File / Reason for Calling"
        >
          {isOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
          <div className="flex flex-col items-center">
            {isHighlighted ? (
              <Sparkles className="w-4 h-4 text-slate-950 mb-1" />
            ) : (
              <FileText className="w-4 h-4 mb-1" />
            )}
            <span
              className="text-[10px] font-bold uppercase tracking-wider writing-mode-vertical rotate-180 select-none"
              style={{ writingMode: 'vertical-rl' }}
            >
              {isHighlighted ? 'Dossier Needed!' : 'Reason for Call'}
            </span>
          </div>
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={onToggle}
        />
      )}

      {/* Slide-out Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col border-l border-slate-200 dark:border-slate-800 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Case Dossier
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Reason You Are Calling
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Active Case Status / Selector Toggle */}
          <div className="flex items-center justify-between">
            {isCallActive ? (
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Case locked during active call
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCaseSelector(!showCaseSelector)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{showCaseSelector ? 'Close Case List' : 'Choose Different Case'}</span>
                </button>
                {onShuffleMission && (
                  <button
                    type="button"
                    onClick={onShuffleMission}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center gap-1 transition"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Shuffle</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Optional Case Selector Dropdown List */}
          {showCaseSelector && !isCallActive && (
            <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5 animate-in fade-in duration-150">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block">
                Select a Centrelink Dispute:
              </span>
              {MISSIONS.map((m, idx) => {
                const isSelected = m.id === mission.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleCaseSelect(idx)}
                    className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate pr-2">{m.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* CRN & Target Department Card */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center text-[11px] text-slate-500 mb-1">
              <span>Customer Reference Number:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                {mission.crn}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Department: <strong className="text-slate-700 dark:text-slate-300">{mission.targetDepartment}</strong>
            </div>
          </div>

          {/* EXACT PHONE MENU NAVIGATION GUIDE */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 p-3.5 rounded-2xl shadow-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 mb-1 text-xs">
              <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Where to Go in Phone Menu:</span>
            </div>
            <p className="text-emerald-950 dark:text-emerald-100 font-semibold text-xs leading-relaxed bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
              {mission.menuGuide}
            </p>
          </div>

          {/* Breach Infringement */}
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-400 mb-1 text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>Breach Notice Issued</span>
            </div>
            <p className="text-red-900 dark:text-red-200/90 leading-relaxed font-mono text-[11px]">
              {mission.penaltyNotice}
            </p>
          </div>

          {/* Detailed Narrative */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
              What Happened (Your Case):
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
              {mission.description}
            </p>
          </div>

          {/* Key Phrases to Mention */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 p-3.5 rounded-2xl">
            <span className="font-bold text-blue-900 dark:text-blue-300 block mb-2 text-xs">
              Keywords to say to the agent:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {mission.keyPhrases.map((phrase, idx) => (
                <span
                  key={idx}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-2 py-0.8 rounded-md text-[11px] border border-blue-200 dark:border-blue-800/60 font-medium"
                >
                  &quot;{phrase}&quot;
                </span>
              ))}
            </div>
          </div>

          {/* Pro tip */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-[11px] text-amber-900 dark:text-amber-200/90 leading-relaxed">
            <strong>Pro Tip:</strong> If you navigate to the wrong department menu, don&apos;t panic! The robocaller or agent will detect your case and transfer your call across to the correct queue.
          </div>
        </div>
      </div>
    </>
  );
};
