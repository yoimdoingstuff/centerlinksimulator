import { holdMusic } from './holdSynthesizer';
import { getAudioContext } from './dtmf';

/**
 * Speech synthesis manager providing:
 * 1. Monotone, mechanical robocaller voice
 * 2. Fatigued human representative voice with background keyboard typing Foley
 */

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

  public speakRobocaller(text: string, onEnd?: () => void): void {
    this.stop();
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
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
    const auVoice = voices.find(v => v.lang.includes('en-AU')) ||
      voices.find(v => v.lang.includes('en-GB')) ||
      voices.find(v => v.lang.includes('en-US')) ||
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
    const approxDurationMs = Math.max(2500, (wordCount / 2.5) * 1000 + 2000);
    const safetyTimer = setTimeout(safeEnd, approxDurationMs);

    utterance.onend = safeEnd;
    utterance.onerror = safeEnd;

    try {
      this.synth.speak(utterance);
    } catch {
      safeEnd();
    }
  }

  public speakRepresentative(text: string, onEnd?: () => void): void {
    this.stop();
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    holdMusic.setDucked(true);
    this.isSpeaking = true;
    this.startKeyboardTypingFoley();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Representative parameters: tired, slightly slower, natural human pitch
    utterance.rate = 0.96;
    utterance.pitch = 1.02;

    const voices = this.synth.getVoices();
    // Prefer female or alternate voice for Sharon the rep
    const repVoice = voices.find(v => v.lang.includes('en-AU') && (v.name.includes('Karen') || v.name.includes('Catherine') || v.name.includes('Female'))) ||
      voices.find(v => v.lang.includes('en-AU')) ||
      voices.find(v => v.lang.includes('en-US')) ||
      voices[0];

    if (repVoice) {
      utterance.voice = repVoice;
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
    const approxDurationMs = Math.max(2500, (wordCount / 2.5) * 1000 + 2000);
    const safetyTimer = setTimeout(safeEnd, approxDurationMs);

    utterance.onend = safeEnd;
    utterance.onerror = safeEnd;

    try {
      this.synth.speak(utterance);
    } catch {
      safeEnd();
    }
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
