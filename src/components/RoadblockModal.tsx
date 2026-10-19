import React, { useEffect, useState } from 'react';
import { PhoneCall, AlertOctagon, ShieldAlert, ArrowRight } from 'lucide-react';

interface RoadblockModalProps {
  type: 'LINE_DROPPED' | 'CLOCK_TAMPERED' | 'HOSTILE_CALLER';
  graceSeconds?: number;
  onRedial?: () => void;
  onDismiss?: () => void;
}

export const RoadblockModal: React.FC<RoadblockModalProps> = ({
  type,
  graceSeconds = 30,
  onRedial,
  onDismiss,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(graceSeconds);

  useEffect(() => {
    if (type !== 'LINE_DROPPED') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [type]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {type === 'LINE_DROPPED' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 mx-auto flex items-center justify-center animate-bounce">
              <PhoneCall className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-red-400">
                Network Disconnect
              </span>
              <h2 className="text-xl font-bold text-slate-100 mt-1">
                Line Dropped!
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                The call dropped out randomly! You have a limited grace period to panic-redial and rescue your current queue position before your ticket is completely forfeited.
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-red-900/60 flex items-center justify-center gap-3">
              <span className="text-xs text-slate-400 font-mono">Grace Period:</span>
              <span
                className={`text-2xl font-bold font-mono tabular-nums ${
                  timeLeft <= 10 ? 'text-red-500 animate-ping' : 'text-amber-400'
                }`}
              >
                00:{timeLeft.toString().padStart(2, '0')}
              </span>
            </div>

            <button
              onClick={onRedial}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 transition cursor-pointer"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Redial 132 850 Immediately</span>
            </button>
          </div>
        )}

        {type === 'CLOCK_TAMPERED' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-800 text-amber-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
                Anti-Cheat Protection
              </span>
              <h2 className="text-xl font-bold text-slate-100 mt-1">
                System Time Irregularity
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                A system clock modification was detected. In accordance with Services Australia Telephony Integrity Rule 4B, your session has been penalized and callers have been moved ahead of you.
              </p>
            </div>

            <button
              onClick={onDismiss}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Acknowledge Penalty</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {type === 'HOSTILE_CALLER' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 mx-auto flex items-center justify-center">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-rose-400">
                Policy Enforcement
              </span>
              <h2 className="text-xl font-bold text-slate-100 mt-1">
                Uncontrolled Screaming Detected
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Your microphone exceeded the maximum permissible decibel limit (&gt;82 dB). Services Australia maintains a zero-tolerance policy for aggressive yelling. You have been demoted back to the automated menu.
              </p>
            </div>

            <button
              onClick={onDismiss}
              className="w-full py-3 bg-rose-700 hover:bg-rose-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Return to Automated Menu</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
