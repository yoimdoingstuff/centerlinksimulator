import { getAudioContext } from './dtmf';
import { holdMusicConfig } from '../config/holdMusicConfig';

/**
 * Authentic procedural synthesizer for "Opus No. 1" by Tim Carleton & Darrick Deel
 * The most iconic telephone hold music in history.
 */

class HoldMusicController {
  private isPlaying: boolean = false;
  private isDucked: boolean = false;
  private audioElem: HTMLAudioElement | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private synthInterval: number | null = null;
  private currentNoteIndex: number = 0;

  // Tim Carleton's "Opus No. 1" melodic transcription (in Eb major)
  private melody: Array<{ freq: number; dur: number; bassFreq?: number }> = [
    { freq: 311.13, dur: 0.38, bassFreq: 155.56 }, // Eb4 (Eb2 bass)
    { freq: 392.00, dur: 0.38 },                    // G4
    { freq: 466.16, dur: 0.38 },                    // Bb4
    { freq: 523.25, dur: 0.58 },                    // C5
    { freq: 466.16, dur: 0.38 },                    // Bb4
    { freq: 392.00, dur: 0.38 },                    // G4
    { freq: 349.23, dur: 0.38, bassFreq: 174.61 }, // F4 (F2 bass)
    { freq: 392.00, dur: 0.38 },                    // G4
    { freq: 311.13, dur: 0.76, bassFreq: 155.56 }, // Eb4 (long)
    { freq: 261.63, dur: 0.38, bassFreq: 130.81 }, // C4 (C2 bass)
    { freq: 311.13, dur: 0.38 },                    // Eb4
    { freq: 349.23, dur: 0.38 },                    // F4
    { freq: 392.00, dur: 0.58 },                    // G4
    { freq: 466.16, dur: 0.38 },                    // Bb4
    { freq: 415.30, dur: 0.38, bassFreq: 207.65 }, // Ab4 (Ab2 bass)
    { freq: 392.00, dur: 0.38 },                    // G4
    { freq: 349.23, dur: 0.58 },                    // F4
    { freq: 311.13, dur: 0.95, bassFreq: 155.56 }, // Eb4 resolution
  ];

  private customTrackTitle: string | null = null;
  private customAudioUrl: string | null = null;

  public getTrackName(): string {
    return this.customTrackTitle || holdMusicConfig.trackTitle;
  }

  public setCustomAudio(urlOrFile: string | File, title?: string): void {
    if (typeof urlOrFile === 'string') {
      this.customAudioUrl = urlOrFile;
      this.customTrackTitle = title || 'Custom Hold Music';
    } else {
      this.customAudioUrl = URL.createObjectURL(urlOrFile);
      this.customTrackTitle = title || urlOrFile.name.replace(/\.[^/.]+$/, '');
    }
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
          this.filterNode.Q.value = 0.7;
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

      // Prioritize: 1. User dropped file, 2. holdMusicConfig URL, 3. standard dropped MP3 names in public/
      const candidateUrls = [
        this.customAudioUrl,
        holdMusicConfig.audioFileUrl,
        './opus-no-1.mp3',
        './hold-music.mp3',
        '/opus-no-1.mp3',
        '/hold-music.mp3',
      ].filter(Boolean) as string[];

      if (candidateUrls.length > 0) {
        const audioUrl = candidateUrls[0];
        const audio = new Audio(audioUrl);
        audio.loop = true;
        audio.volume = this.isDucked
          ? baseVol * holdMusicConfig.duckingMultiplier
          : baseVol;

        audio.oncanplay = () => {
          if (!this.isPlaying) return;
          audio.play().catch(() => {});
        };

        audio.onerror = () => {
          // If mp3 is not found in public/ or failed, fallback immediately to authentic synth!
          if (this.isPlaying && !this.synthInterval) {
            this.startSynthLoop();
          }
        };

        this.audioElem = audio;
        audio.play().catch(() => {
          // In case of playback failure, start procedural synth
          if (this.isPlaying && !this.synthInterval) {
            this.startSynthLoop();
          }
        });
      } else {
        this.startSynthLoop();
      }
    } catch (err) {
      console.warn('Hold music play error', err);
      this.startSynthLoop();
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
      this.audioElem = null;
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
        this.masterGain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.15);
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

        const now = ctx.currentTime;
        const dur = note.dur * 0.95;

        // Lead synth (Smooth Rhodes/Marimba sound)
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now);

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.28, now + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(noteGain);
        if (this.masterGain) {
          noteGain.connect(this.masterGain);
        }

        osc.start(now);
        osc.stop(now + dur + 0.04);

        // Warm subtle bass note on bar downbeats
        if (note.bassFreq) {
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();

          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(note.bassFreq, now);

          bassGain.gain.setValueAtTime(0, now);
          bassGain.gain.linearRampToValueAtTime(0.18, now + 0.03);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 1.5);

          bassOsc.connect(bassGain);
          if (this.masterGain) {
            bassGain.connect(this.masterGain);
          }

          bassOsc.start(now);
          bassOsc.stop(now + dur * 1.5 + 0.05);
        }
      } catch {
        // audio context suspended
      }
    };

    playNextNote();
    this.synthInterval = window.setInterval(playNextNote, 380);
  }
}

export const holdMusic = new HoldMusicController();
