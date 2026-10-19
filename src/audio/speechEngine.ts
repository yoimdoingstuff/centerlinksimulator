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
  private isSpeakerBoost: boolean = false;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.refreshVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.refreshVoices();
      }
    }
  }

  private refreshVoices(): void {
    if (!this.synth) return;
    try {
      const v = this.synth.getVoices();
      if (v && v.length > 0) {
        this.cachedVoices = v;
      }
    } catch {}
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0 && this.synth) {
      this.refreshVoices();
    }
    return this.cachedVoices.length > 0 ? this.cachedVoices : (this.synth?.getVoices() || []);
  }

  public setSpeakerBoost(enabled: boolean): void {
    this.isSpeakerBoost = enabled;
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

  public playHumanBreath(): void {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      const bufferSize = Math.floor(ctx.sampleRate * 0.14);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.14);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
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
    utterance.volume = this.isSpeakerBoost ? 1.0 : 0.85;

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
    // Do NOT play robotic telephone prompt beep for human representatives!

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
    this.playHumanBreath();
    this.startKeyboardTypingFoley();

    // Natural conversational formatting: pronounce acronyms phonetically and add natural breathing pauses
    const naturalText = text
      .replace(/\bCRN\b/gi, 'C-R-N')
      .replace(/\bABN\b/gi, 'A-B-N')
      .replace(/\bPDF\b/gi, 'P-D-F')
      .replace(/\bIVR\b/gi, 'I-V-R')
      .replace(/\bDSP\b/gi, 'D-S-P')
      .replace(/\$([0-9]+)/g, '$1 dollars')
      .replace(/\.\.\./g, ' — ')
      .replace(/([,;:])\s*/g, '$1 ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(naturalText);
    this.currentUtterance = utterance;

    // Pitch and rate tailored for natural human inflection
    utterance.rate = voiceOpts?.rate ?? 0.94;
    utterance.pitch = voiceOpts?.pitch ?? 1.0;
    utterance.volume = this.isSpeakerBoost ? 1.0 : 0.88;

    const voices = this.getAvailableVoices();
    const hints = voiceOpts?.voiceHints || [];
    const isMale = voiceOpts?.gender === 'male';

    const scoreVoice = (v: SpeechSynthesisVoice): number => {
      let score = 0;
      const nameLower = v.name.toLowerCase();
      const langLower = v.lang.toLowerCase();

      // Highest bonus for Natural / Neural / Online / Enhanced / Siri / Google
      if (/natural|neural|online|enhanced|premium/i.test(v.name)) score += 60;
      if (/google/i.test(v.name)) score += 40;
      if (/siri/i.test(v.name)) score += 35;

      // Locale matching:
      if (langLower.includes('en-au') || langLower.includes('en_au') || nameLower.includes('australia')) score += 45;
      else if (langLower.includes('en-gb') || langLower.includes('en-uk')) score += 25;
      else if (langLower.includes('en-us')) score += 15;
      else if (langLower.startsWith('en')) score += 10;

      // Gender matching
      if (isMale && /male|russell|lee|david|george|william|guy|ryan|daniel|oliver/i.test(v.name)) score += 30;
      if (!isMale && /female|karen|catherine|samantha|natasha|sonia|jenny|ava|nicole|veena|priya/i.test(v.name)) score += 30;

      // Hints matching
      for (const h of hints) {
        if (nameLower.includes(h.toLowerCase()) || langLower.includes(h.toLowerCase())) score += 40;
      }

      // Heavily penalize legacy mechanical voices
      if (/espeak|compact|bad|scanner|robotic/i.test(nameLower)) score -= 100;

      return score;
    };

    const sortedVoices = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
    const selectedVoice = sortedVoices[0];

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
