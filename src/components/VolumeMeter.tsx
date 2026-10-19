import React from 'react';
import { VolumeZone } from '../types/game';
import { Mic, Volume2, AlertTriangle, Flame } from 'lucide-react';

interface VolumeMeterProps {
  currentDb: number;
  zone: VolumeZone;
  isListening: boolean;
}

export const VolumeMeter: React.FC<VolumeMeterProps> = ({ currentDb, zone, isListening }) => {
  // Meter percentage (0 to 100)
  const clampedDb = Math.max(0, Math.min(100, currentDb));

  let zoneLabel = 'Quiet / Whisper';
  let zoneColor = 'text-slate-400';
  let barGradient = 'from-slate-400 to-slate-500';
  let helperText = 'Speak louder to be heard by the automated system.';
  let icon = <Mic className="w-4 h-4 text-slate-400" />;

  if (zone === 'CASUAL') {
    zoneLabel = 'Casual / Polite (30-55 dB)';
    zoneColor = 'text-amber-400';
    barGradient = 'from-amber-400 to-amber-500';
    helperText = 'The automated system will ignore or misunderstand polite speech.';
    icon = <Volume2 className="w-4 h-4 text-amber-400" />;
  } else if (zone === 'ASSERTIVE') {
    zoneLabel = 'Firm / Frustrated (56-81 dB) — SWEET SPOT';
    zoneColor = 'text-emerald-400';
    barGradient = 'from-emerald-400 to-emerald-500';
    helperText = 'Optimal urgency! Tripping automated escalation to an operator.';
    icon = <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />;
  } else if (zone === 'SCREAMING') {
    zoneLabel = 'Uncontrolled Screaming (>82 dB) — DANGER';
    zoneColor = 'text-red-400';
    barGradient = 'from-red-500 to-rose-600';
    helperText = 'Hostile caller limit exceeded! You will be penalized!';
    icon = <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Voice Loudness Meter
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-sm tabular-nums">
          <span className={`font-bold ${zoneColor}`}>{clampedDb}</span>
          <span className="text-xs text-slate-500">dB</span>
        </div>
      </div>

      {/* Decibel Bar Gauge */}
      <div className="relative h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
        {/* Color zones background indicators */}
        <div className="absolute inset-0 flex opacity-25 pointer-events-none">
          <div className="w-[30%] bg-slate-500 border-r border-slate-700" title="Too Quiet" />
          <div className="w-[26%] bg-amber-500 border-r border-slate-700" title="Casual" />
          <div className="w-[26%] bg-emerald-500 border-r border-slate-700" title="Sweet Spot" />
          <div className="w-[18%] bg-red-600" title="Screaming Danger" />
        </div>

        {/* Animated Active Level */}
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-75 ease-out`}
          style={{ width: `${clampedDb}%` }}
        />
      </div>

      {/* Zone Threshold Markers */}
      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
        <span>0 dB</span>
        <span className="text-amber-500/70">30 dB (Casual)</span>
        <span className="text-emerald-500 font-semibold">56 dB (Sweet Spot)</span>
        <span className="text-red-500/80">82 dB (Hostile)</span>
      </div>

      {/* Current Zone Feedback */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isListening ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isListening ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            />
          </span>
          <span className={`text-xs font-medium ${zoneColor}`}>{zoneLabel}</span>
        </div>
        <span className="text-[11px] text-slate-400 max-w-[260px] truncate text-right">
          {helperText}
        </span>
      </div>
    </div>
  );
};
