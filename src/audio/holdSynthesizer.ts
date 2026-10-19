import { getAudioContext } from './dtmf';
import { holdMusicConfig } from '../config/holdMusicConfig';

/**
 * Government telephone hold music controller
 * Powered by holdMusicConfig.ts (custom audio or procedural synth) with ducking
 */

class HoldMusicController {
  private isPlaying: boolean = false;
  private isDucked: boolean = false;
  private audioElem: HTMLAudioElement | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private synthInterval: number | null = null;
  private currentNoteIndex: number = 0;

  // Iconic classical hold tune melody notes (Vivaldi Spring & Mozart medley in Hz)
  private melody: Array<{ freq: number; dur: number }> = [
    { freq: 523.25, dur: 0.35 }, // C5
    { freq: 659.25, dur: 0.35 }, // E5
    { freq: 659.25, dur: 0.35 }, // E5
    { freq: 659.25, dur: 0.35 }, // E5
    { freq: 587.33, dur: 0.18 }, // D5
    { freq: 523.25, dur: 0.18 }, // C5
    { freq: 587.33, dur: 0.70 }, // D5
    { freq: 392.00, dur: 0.35 }, // G4
    { freq: 587.33, dur: 0.35 }, // D5
    { freq: 659.25, dur: 0.35 }, // E5
    { freq: 587.33, dur: 0.35 }, // D5
    { freq: 523.25, dur: 0.70 }, // C5
    { freq: 659.25, dur: 0.35 }, // E5
    { freq: 783.99, dur: 0.35 }, // G5
    { freq: 783.99, dur: 0.35 }, // G5
    { freq: 698.46, dur: 0.18 }, // F5
    { freq: 659.25, dur: 0.18 }, // E5
    { freq: 587.33, dur: 0.70 }, // D5
    { freq: 523.25, dur: 0.70 }, // C5
  ];

  public getTrackName(): string {
    return holdMusicConfig.trackTitle;
  }

  public play(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      const ctx = getAudioContext();
      if (!this.masterGain) {
        this.masterGain = ctx.createGain();
        this.filterNode = ctx.createBiquadFilter();

        if (holdMusicConfig.enableTelephoneBandpassFilter) {
          // Authentic telephone bandwidth filter (300Hz - 3400Hz)
          this.filterNode.type = 'bandpass';
          this.filterNode.frequency.value = holdMusicConfig.filterCenterFrequency;
          this.filterNode.Q.value = 0.65;
        } else {
          this.filterNode.type = 'allpass';
        }

        this.masterGain.connect(this.filterNode);
        this.filterNode.connect(ctx.destination);
      }

      const baseVol = holdMusicConfig.defaultVolume;
      this.masterGain.gain.setValueAtTime(
        this.isDucked ? baseVol * holdMusicConfig.duckingMultiplier : baseVol,
        ctx.currentTime
      );

      if (holdMusicConfig.audioFileUrl) {
        // Play audio file from config
        this.audioElem = new Audio(holdMusicConfig.audioFileUrl);
        this.audioElem.loop = true;
        this.audioElem.volume = this.isDucked
          ? baseVol * holdMusicConfig.duckingMultiplier
          : baseVol;
        this.audioElem.play().catch((e) => console.warn('Audio file playback pending gesture', e));
      } else {
        // Start procedural lo-fi synthesizer
        this.startSynthLoop();
      }
    } catch (err) {
      console.warn('Hold music play error', err);
    }
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.synthInterval) {
      window.clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.audioElem) {
      this.audioElem.pause();
      this.audioElem.currentTime = 0;
    }
  }

  public setDucked(ducked: boolean): void {
    this.isDucked = ducked;
    if (!this.isPlaying) return;

    try {
      const ctx = getAudioContext();
      const baseVol = holdMusicConfig.defaultVolume;
      const targetGain = ducked ? baseVol * holdMusicConfig.duckingMultiplier : baseVol;

      if (this.masterGain) {
        this.masterGain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.2);
      }
      if (this.audioElem) {
        this.audioElem.volume = targetGain;
      }
    } catch {
      // ignore
    }
  }

  private startSynthLoop(): void {
    if (this.synthInterval) {
      window.clearInterval(this.synthInterval);
    }

    const playNextNote = () => {
      if (!this.isPlaying || holdMusicConfig.audioFileUrl) return;
      try {
        const ctx = getAudioContext();
        const note = this.melody[this.currentNoteIndex];
        this.currentNoteIndex = (this.currentNoteIndex + 1) % this.melody.length;

        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        // Cheesy cheap 80s/90s sawtooth PBX tone
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.freq, ctx.currentTime);

        const now = ctx.currentTime;
        const dur = note.dur * 0.9;

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.25, now + 0.04);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(noteGain);
        if (this.masterGain) {
          noteGain.connect(this.masterGain);
        }

        osc.start(now);
        osc.stop(now + dur + 0.05);
      } catch {
        // audio context suspended
      }
    };

    playNextNote();
    this.synthInterval = window.setInterval(playNextNote, 340);
  }
}

export const holdMusic = new HoldMusicController();
