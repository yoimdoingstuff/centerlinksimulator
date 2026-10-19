import { holdMusic } from './holdSynthesizer';
import { getAudioContext } from './dtmf';

/**
 * Speech synthesis manager providing:
 * 1. Monotone, mechanical robocaller voice
 * 2. Fatigued human representative voice with background keyboard typing Foley
 */

export interface RepresentativeVoiceOptions {
  gender?: 'male' | 'female';
  pitch?: number;
  rate?: number;
  voiceHints?: string[];
}

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private officeFoleyInterval: number | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public playPromptBeep(): void {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.setValueAtTime(0.12, now + 0.08);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // ignore
    }
  }

  public speakRobocaller(text: string, onEnd?: () => void): void {
    this.stop();
    this.playPromptBeep();

    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch {
      // ignore
    }

    holdMusic.setDucked(true);
    this.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Robotic parameters: slightly faster rate, higher or very flat monotone pitch
    utterance.rate = 1.08;
    utterance.pitch = 0.95;

    // Pick an English voice
    const voices = this.synth.getVoices();
    const auVoice =
      voices.find((v) => v.lang.includes('en-AU')) ||
      voices.find((v) => v.lang.includes('en-GB')) ||
      voices.find((v) => v.lang.includes('en-US')) ||
      voices[0];

    if (auVoice) {
      utterance.voice = auVoice;
    }

    let finished = false;
    const safeEnd = () => {
      if (finished) return;
      finished = true;
      clearTimeout(safetyTimer);
      this.isSpeaking = false;
      this.currentUtterance = null;
      holdMusic.setDucked(false);
      if (onEnd) onEnd();
    };

    // Calculate approx speech duration: ~160 words per minute plus grace period
    const wordCount = text.split(/\s+/).length;
    const approxDurationMs = Math.max(2000, (wordCount / 2.8) * 1000 + 1500);
    const safetyTimer = window.setTimeout(safeEnd, approxDurationMs);

    utterance.onend = safeEnd;
    utterance.onerror = safeEnd;

    // Small delay after stop/cancel avoids Chrome dropping speak()
    setTimeout(() => {
      try {
        if (this.synth) {
          this.synth.speak(utterance);
        } else {
          safeEnd();
        }
      } catch {
        safeEnd();
      }
    }, 40);
  }

  public speakRepresentative(
    text: string,
    voiceOptionsOrOnEnd?: RepresentativeVoiceOptions | (() => void),
    maybeOnEnd?: () => void
  ): void {
    let voiceOpts: RepresentativeVoiceOptions | undefined;
    let onEnd: (() => void) | undefined;

    if (typeof voiceOptionsOrOnEnd === 'function') {
      onEnd = voiceOptionsOrOnEnd;
    } else {
      voiceOpts = voiceOptionsOrOnEnd;
      onEnd = maybeOnEnd;
    }

    this.stop();
    this.playPromptBeep();

    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch {
      // ignore
    }

    holdMusic.setDucked(true);
    this.isSpeaking = true;
    this.startKeyboardTypingFoley();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Pitch and rate from representative config
    utterance.rate = voiceOpts?.rate ?? 0.96;
    utterance.pitch = voiceOpts?.pitch ?? 1.0;

    const voices = this.synth.getVoices();
    const hints = voiceOpts?.voiceHints || [];
    const isMale = voiceOpts?.gender === 'male';

    let selectedVoice: SpeechSynthesisVoice | undefined;

    // 1. Try matching specific name hints first
    for (const hint of hints) {
      selectedVoice = voices.find((v) => v.name.toLowerCase().includes(hint.toLowerCase()));
      if (selectedVoice) break;
    }

    // 2. Otherwise match gender and Australian/English locale
    if (!selectedVoice) {
      if (isMale) {
        selectedVoice =
          voices.find(
            (v) =>
              (v.lang.includes('en-AU') || v.lang.includes('en-GB') || v.lang.includes('en-US')) &&
              (v.name.toLowerCase().includes('male') ||
                v.name.toLowerCase().includes('david') ||
                v.name.toLowerCase().includes('george') ||
                v.name.toLowerCase().includes('james'))
          ) ||
          voices.find((v) => v.lang.includes('en-AU')) ||
          voices[0];
      } else {
        selectedVoice =
          voices.find(
            (v) =>
              (v.lang.includes('en-AU') || v.lang.includes('en-GB') || v.lang.includes('en-US')) &&
              (v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('karen') ||
                v.name.toLowerCase().includes('catherine') ||
                v.name.toLowerCase().includes('samantha'))
          ) ||
          voices.find((v) => v.lang.includes('en-AU')) ||
          voices[0];
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    let finished = false;
    const safeEnd = () => {
      if (finished) return;
      finished = true;
      clearTimeout(safetyTimer);
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.stopKeyboardTypingFoley();
      holdMusic.setDucked(false);
      if (onEnd) onEnd();
    };

    const wordCount = text.split(/\s+/).length;
    const approxDurationMs = Math.max(2200, (wordCount / 2.5) * 1000 + 1800);
    const safetyTimer = window.setTimeout(safeEnd, approxDurationMs);

    utterance.onend = safeEnd;
    utterance.onerror = safeEnd;

    setTimeout(() => {
      try {
        if (this.synth) {
          this.synth.speak(utterance);
        } else {
          safeEnd();
        }
      } catch {
        safeEnd();
      }
    }, 40);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.stopKeyboardTypingFoley();
    holdMusic.setDucked(false);
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  // Synthesize realistic clattering keyboard keystrokes in the background
  private startKeyboardTypingFoley(): void {
    this.stopKeyboardTypingFoley();
    const playClick = () => {
      if (!this.isSpeaking) return;
      try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Mechanical switch click (quick pitch sweep down)
        osc.type = 'triangle';
        const startFreq = 2200 + Math.random() * 800;
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.025);

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.035);
      } catch {
        // ignore
      }
    };

    // Burst typing pattern
    this.officeFoleyInterval = window.setInterval(() => {
      if (Math.random() > 0.4) {
        playClick();
        if (Math.random() > 0.6) {
          setTimeout(playClick, 65 + Math.random() * 50);
        }
      }
    }, 180);
  }

  private stopKeyboardTypingFoley(): void {
    if (this.officeFoleyInterval) {
      window.clearInterval(this.officeFoleyInterval);
      this.officeFoleyInterval = null;
    }
  }
}

export const speechEngine = new SpeechEngine();
