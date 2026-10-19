import React from 'react';
import { Mission, CallStats, Difficulty } from '../types/game';
import { Award, Clock, Flame, RotateCcw, Share2, CheckCircle2 } from 'lucide-react';

interface GameVictoryModalProps {
  mission: Mission;
  difficulty: Difficulty;
  stats: CallStats;
  onPlayAgain: () => void;
}

export const GameVictoryModal: React.FC<GameVictoryModalProps> = ({
  mission,
  difficulty,
  stats,
  onPlayAgain,
}) => {
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs}s`;
  };

  const handleShare = () => {
    const text = `I just survived Centrelink Call Simulator on ${difficulty} difficulty! Held for ${formatTimer(
      stats.holdSeconds
    )}, yelled at ${stats.peakDb} dB, and Officer Sharon finally stamped my exemption!`;
    if (navigator.share) {
      navigator.share({ title: 'Centrelink Call Simulator', text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
      alert('Result copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Giant Green Approved Stamp Effect */}
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none rotate-12">
          <Award className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-600 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <div className="inline-block border-2 border-emerald-500 text-emerald-400 font-mono font-black text-xs uppercase px-3 py-1 rounded-md tracking-widest rotate-[-3deg] shadow-sm mb-2">
              CLAIM APPROVED — OFFICIAL EXEMPTION GRANTED
            </div>
            <h2 className="text-2xl font-bold text-slate-100">
              You Defeated Centrelink!
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Officer Sharon begrudgingly pulled up your file, verified your Customer Reference Number, and manually overrode your infringement.
            </p>
          </div>

          {/* Mission Solved Badge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-left text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Resolved Case Dossier:
            </span>
            <p className="font-semibold text-slate-200 mt-0.5">{mission.title}</p>
            <p className="text-slate-400 text-[11px] mt-1 font-mono">CRN: {mission.crn}</p>
          </div>

          {/* Telemetry Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center justify-center gap-1 text-slate-500 text-[10px] uppercase font-mono">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Hold Time</span>
              </div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                {formatTimer(stats.holdSeconds)}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center justify-center gap-1 text-slate-500 text-[10px] uppercase font-mono">
                <Flame className="w-3 h-3 text-rose-400" />
                <span>Max Volume</span>
              </div>
              <div className="text-base font-bold font-mono text-rose-400 mt-1 tabular-nums">
                {stats.peakDb} dB
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <div className="text-slate-500 text-[10px] uppercase font-mono">
                Menus Survived
              </div>
              <div className="text-base font-bold font-mono text-amber-400 mt-1 tabular-nums">
                {stats.loopsSurvived}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <div className="text-slate-500 text-[10px] uppercase font-mono">
                Reverse Jumps
              </div>
              <div className="text-base font-bold font-mono text-blue-400 mt-1 tabular-nums">
                {stats.reverseJumps}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={handleShare}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Victory</span>
            </button>

            <button
              onClick={onPlayAgain}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>New Bureaucratic Mission</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
