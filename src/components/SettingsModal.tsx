import React, { useState } from 'react';
import { Key, Music, Shield, X, CheckCircle2, AlertCircle, Trash2, Volume2, Sparkles, Lock, RefreshCw, Play } from 'lucide-react';
import {
  isSiteWideKeyLoaded,
  hasCustomUserKey,
  getCustomUserKey,
  setStoredApiKey,
  clearStoredApiKey,
  hasClientGeminiKey,
  testGeminiApiKey,
} from '../utils/geminiClient';
import { holdMusic } from '../audio/holdSynthesizer';
import { speechEngine } from '../audio/speechEngine';
import { triggerHaptic } from '../utils/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => hasCustomUserKey() || !isSiteWideKeyLoaded());
  const [customKeyInput, setCustomKeyInput] = useState<string>(() => getCustomUserKey());
  const [testingStatus, setTestingStatus] = useState<{ isTesting: boolean; result?: { success: boolean; message: string } }>({
    isTesting: false,
  });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [voiceTesting, setVoiceTesting] = useState<boolean>(false);

  if (!isOpen) return null;

  const siteKeyLoaded = isSiteWideKeyLoaded();

  const handleTestKey = async () => {
    triggerHaptic('medium');
    setTestingStatus({ isTesting: true });
    const keyToTest = isCustomMode ? customKeyInput : undefined;
    const res = await testGeminiApiKey(keyToTest);
    setTestingStatus({ isTesting: false, result: res });
    if (res.success) {
      triggerHaptic('heavy');
    } else {
      triggerHaptic('error');
    }
  };

  const handleSaveCustomKey = () => {
    triggerHaptic('heavy');
    setStoredApiKey(customKeyInput);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleRevertToBuiltIn = () => {
    triggerHaptic('selection');
    clearStoredApiKey();
    setCustomKeyInput('');
    setIsCustomMode(false);
    setTestingStatus({ isTesting: false });
  };

  const handleTestVoice = () => {
    triggerHaptic('selection');
    setVoiceTesting(true);
    speechEngine.speakRepresentative(
      "G'day mate, Centrelink Services, Darren speaking. System's running a bit slow today, but I'm here. How can I help sort your dispute?",
      { gender: 'male', voiceHints: ['Russell', 'Lee', 'en-AU', 'male'] },
      () => setVoiceTesting(false)
    );
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
              <h3 className="font-bold text-sm">Settings & AI Status</h3>
              <p className="text-[11px] text-slate-500">Gemini AI Configuration & Audio Controls</p>
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

        {/* Section 1: Gemini AI Status & Uneditable Built-in Key */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Gemini AI Status
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                hasClientGeminiKey()
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              {hasClientGeminiKey() ? '✨ AI Loaded & Active' : '💾 Local Mode'}
            </span>
          </div>

          {/* State A: Built-in Site Key is Loaded (Uneditable & Hidden from view) */}
          {siteKeyLoaded && !isCustomMode ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Built-in Gemini AI Loaded (Protected)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                The site deployment includes a pre-configured Gemini AI key that powers the representatives for all visitors. The key is securely loaded and uneditable.
              </p>

              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testingStatus.isTesting}
                  className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{testingStatus.isTesting ? 'Testing AI...' : 'Test AI Connection'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  Override with Custom Key
                </button>
              </div>
            </div>
          ) : (
            /* State B: Custom Key Input Mode */
            <div className="space-y-3">
              <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span>Enter your own personal Gemini API key below to test or override the site's default AI:</span>
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  placeholder="AIzaSy... (Paste Personal Gemini Key)"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 font-mono"
                />
                {customKeyInput && (
                  <button
                    type="button"
                    onClick={() => setCustomKeyInput('')}
                    className="absolute right-2 top-2.5 p-1 text-slate-400 hover:text-red-500 transition"
                    title="Clear"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustomKey}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <span>Save Key</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testingStatus.isTesting}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{testingStatus.isTesting ? 'Testing...' : 'Test Key'}</span>
                </button>
                {siteKeyLoaded && (
                  <button
                    type="button"
                    onClick={handleRevertToBuiltIn}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    title="Revert to built-in key"
                  >
                    Revert
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Test Result Feedback Box */}
          {testingStatus.result && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in duration-150 ${
                testingStatus.result.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800'
              }`}
            >
              {testingStatus.result.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">
                <strong className="block mb-0.5">
                  {testingStatus.result.success ? 'AI Key Verified & Active!' : 'Connection Check Failed'}
                </strong>
                <span>{testingStatus.result.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Voice Preview */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
              <Volume2 className="w-3.5 h-3.5 text-blue-500" />
              Representative Voice Check
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-600 dark:text-slate-400">
              <span>Test human speech synthesis:</span>
            </div>
            <button
              type="button"
              onClick={handleTestVoice}
              disabled={voiceTesting}
              className="py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition active:scale-95 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{voiceTesting ? 'Speaking...' : 'Preview Voice'}</span>
            </button>
          </div>
        </div>

        {/* Section 3: Custom Hold Music */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
              <Music className="w-3.5 h-3.5 text-blue-500" />
              Hold Music (Opus No. 1 or Custom MP3)
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            By default, the simulator procedurally generates Tim Carleton&apos;s iconic <strong>&quot;Opus No. 1&quot;</strong>. You can drag and drop any MP3 anywhere onto the screen, or upload one here:
          </p>

          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer group">
            <Music className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-1 transition" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {audioFileName ? `Loaded: ${audioFileName}` : 'Choose Custom MP3 File'}
            </span>
            <input
              type="file"
              accept=".mp3,audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
