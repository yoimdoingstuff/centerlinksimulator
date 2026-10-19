import React, { useState } from 'react';
import { Key, Music, Shield, ExternalLink, X, CheckCircle2, AlertCircle, Trash2, Volume2 } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey, hasClientGeminiKey } from '../utils/geminiClient';
import { holdMusic } from '../audio/holdSynthesizer';
import { triggerHaptic } from '../utils/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>(getStoredApiKey());
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [audioFileName, setAudioFileName] = useState<string>('');

  if (!isOpen) return null;

  const handleSaveKey = () => {
    triggerHaptic('heavy');
    setStoredApiKey(apiKeyInput);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleClearKey = () => {
    triggerHaptic('medium');
    clearStoredApiKey();
    setApiKeyInput('');
    setSaveSuccess(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerHaptic('selection');
      holdMusic.setCustomAudio(file, file.name);
      setAudioFileName(file.name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-md shadow-2xl backdrop-blur-2xl text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-500">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Settings & GitHub Pages Guide</h3>
              <p className="text-[11px] text-slate-500">API Key Privacy & Custom Hold Music</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Gemini API Key */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Gemini API Key Configuration
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                hasClientGeminiKey()
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              {hasClientGeminiKey() ? 'AI Active' : 'Keyword Fallback Active'}
            </span>
          </div>

          {/* Guide for Everyone to use on GitHub Pages */}
          <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div>
              <strong className="text-slate-800 dark:text-slate-200">Want everyone on your website to use your key?</strong>
              <p className="mt-1">
                You can provide a single key for all visitors without exposing it in your git source code:
              </p>
              <ol className="list-decimal list-inside mt-1 space-y-0.5 text-slate-600 dark:text-slate-400">
                <li>In your GitHub repo, go to <strong>Settings</strong> &gt; <strong>Secrets and variables</strong> &gt; <strong>Actions</strong></li>
                <li>Add a new secret named <code className="text-blue-500 font-mono">GEMINI_API_KEY</code> with your key</li>
                <li>The deploy workflow will automatically build your key into the site for all visitors!</li>
              </ol>
            </div>
            <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
              <strong className="text-slate-800 dark:text-slate-200">Or paste your key below for private testing:</strong>
              <p className="mt-0.5 text-[10px]">
                Saved securely in this browser&apos;s <code className="text-blue-500">localStorage</code> only.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy... (Paste Gemini API Key)"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 font-mono"
              />
              {apiKeyInput && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="absolute right-2 top-2.5 p-1 text-slate-400 hover:text-red-500 transition"
                  title="Clear key"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveKey}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Saved to Browser
                  </>
                ) : (
                  'Save Key Locally'
                )}
              </button>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition flex items-center gap-1"
              >
                <span>Get Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Section 2: Custom Hold Music (Opus No. 1) */}
        <div className="space-y-3 mb-5 border-t border-slate-200 dark:border-slate-800 pt-4">
          <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
            <Music className="w-3.5 h-3.5 text-indigo-500" />
            Hold Music (Opus No. 1 by Tim Carleton)
          </span>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <strong>Drop-in MP3 Support:</strong>
            <br />
            1. You can drop any MP3 file named <code className="text-indigo-500 font-mono">opus-no-1.mp3</code> into your repository&apos;s <code className="text-indigo-500 font-mono">public/</code> directory.
            <br />
            2. Or select any audio file on your device right now:
          </p>

          <div className="flex items-center gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-full py-2 px-3 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium flex items-center justify-center gap-1.5 transition">
                <Volume2 className="w-3.5 h-3.5" />
                <span>{audioFileName ? `Loaded: ${audioFileName}` : 'Select MP3 File to Play'}</span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Screaming & Anti-Abuse Rules Guide */}
        <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
          <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            Hostility & Anti-Abuse Rules
          </span>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <p>• <strong>Scream Tolerance:</strong> You can shout (&gt;82 dB) up to 6 times before getting booted to the queue. Representatives will attempt to de-escalate and calm you down.</p>
            <p>• <strong>10s Immunity Cooldown:</strong> After shouting, a 10-second delay prevents logging duplicate strikes for the same outburst.</p>
            <p>• <strong>2-Minute Reset:</strong> Maintaining 2 minutes of calm dialogue clears all hostility strikes.</p>
            <p>• <strong>Severe Offensive Abuse:</strong> Explicit threats or severe offensive slurs result in immediate line termination with no warnings.</p>
          </div>
        </div>

        {/* Done Button */}
        <div className="pt-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition hover:opacity-90 active:scale-98"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
