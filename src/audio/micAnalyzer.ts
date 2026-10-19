import { getAudioContext } from './dtmf';
import { VolumeZone } from '../types/game';

export interface VoicePhraseResult {
  transcript: string;
  peakDb: number;
  averageDb: number;
  zone: VolumeZone;
}

export type PhraseCallback = (result: VoicePhraseResult) => void;
export type VolumeTickCallback = (currentDb: number, zone: VolumeZone) => void;

interface IWindowSpeechRecognition extends Window {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
}

interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

export class MicAnalyzer {
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private speechRecognition: ISpeechRecognitionInstance | null = null;

  private currentDb: number = 0;
  private peakDbInPhrase: number = 0;
  private dbSamples: number[] = [];
  private currentTranscript: string = '';
  private isListening: boolean = false;
  private hasPermission: boolean = false;

  private onPhraseComplete: PhraseCallback | null = null;
  private onVolumeTick: VolumeTickCallback | null = null;
  private silenceTimer: number | null = null;

  public async requestMicrophone(): Promise<boolean> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Don't suppress yelling!
          autoGainControl: false,  // Don't auto-dampen yelling!
        },
      });

      const ctx = getAudioContext();
      const source = ctx.createMediaStreamSource(this.mediaStream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.2;
      source.connect(this.analyser);

      this.hasPermission = true;
      this.initSpeechRecognition();
      this.startMeterLoop();
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or unavailable:', err);
      this.hasPermission = false;
      return false;
    }
  }

  private isMuted: boolean = false;

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    if (muted) {
      this.currentDb = 0;
      this.peakDbInPhrase = 0;
      this.currentTranscript = '';
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
      if (this.onVolumeTick) {
        this.onVolumeTick(0, 'TOO_QUIET');
      }
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getHasPermission(): boolean {
    return this.hasPermission;
  }

  public setCallbacks(onVolumeTick: VolumeTickCallback, onPhraseComplete: PhraseCallback): void {
    this.onVolumeTick = onVolumeTick;
    this.onPhraseComplete = onPhraseComplete;
  }

  public startListening(): void {
    if (this.isMuted) return;
    this.isListening = true;
    this.currentTranscript = '';
    this.peakDbInPhrase = 0;
    this.dbSamples = [];

    if (this.speechRecognition) {
      try {
        this.speechRecognition.start();
      } catch {
        // Recognition might already be running
      }
    }
  }

  public stopListening(): void {
    this.isListening = false;
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch {
        // already stopped
      }
    }
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  public cleanup(): void {
    this.stopListening();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  private startMeterLoop(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const checkVolume = () => {
      if (!this.analyser) return;

      if (this.isMuted) {
        this.currentDb = 0;
        if (this.onVolumeTick) {
          this.onVolumeTick(0, 'TOO_QUIET');
        }
        this.animFrameId = requestAnimationFrame(checkVolume);
        return;
      }

      this.analyser.getByteTimeDomainData(dataArray);

      // Compute RMS
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / dataArray.length);

      // Convert to subjective dB scale (0 to 100)
      let db = 0;
      if (rms > 0.001) {
        db = Math.round(20 * Math.log10(rms * 10) + 72);
      }
      db = Math.max(0, Math.min(100, db));
      this.currentDb = db;

      const zone = this.classifyZone(db);

      if (this.onVolumeTick) {
        this.onVolumeTick(db, zone);
      }

      if (this.isListening && db > 25) {
        this.peakDbInPhrase = Math.max(this.peakDbInPhrase, db);
        this.dbSamples.push(db);

        // Reset silence timer whenever user speaks
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
        }

        // After 1.4s of silence after speech, finalize phrase
        this.silenceTimer = window.setTimeout(() => {
          this.finalizePhrase();
        }, 1400);
      }

      this.animFrameId = requestAnimationFrame(checkVolume);
    };

    this.animFrameId = requestAnimationFrame(checkVolume);
  }

  private classifyZone(db: number): VolumeZone {
    if (db < 30) return 'TOO_QUIET';
    if (db < 56) return 'CASUAL';
    if (db < 82) return 'ASSERTIVE';
    return 'SCREAMING';
  }

  private initSpeechRecognition(): void {
    const win = window as unknown as IWindowSpeechRecognition;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      console.warn('SpeechRecognition API not available in this browser. Fallback phrase generation enabled.');
      return;
    }

    try {
      const recognition = new (SpeechRec as { new (): ISpeechRecognitionInstance })();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-AU';

      recognition.onresult = (event: unknown) => {
        const speechEvent = event as {
          resultIndex: number;
          results: Array<{
            isFinal: boolean;
            [index: number]: { transcript: string; confidence: number };
          }>;
        };

        let interim = '';
        for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
          const res = speechEvent.results[i];
          const transcriptPiece = res[0].transcript;
          if (res.isFinal) {
            this.currentTranscript += ' ' + transcriptPiece;
          } else {
            interim += transcriptPiece;
          }
        }

        if (interim.trim().length > 0 && !this.silenceTimer) {
          this.silenceTimer = window.setTimeout(() => {
            this.finalizePhrase();
          }, 1400);
        }
      };

      recognition.onerror = () => {
        // Recognition error, keep listening
      };

      recognition.onend = () => {
        if (this.isListening) {
          try {
            recognition.start();
          } catch {
            // Already started
          }
        }
      };

      this.speechRecognition = recognition;
    } catch (err) {
      console.warn('Failed to initialize SpeechRecognition', err);
    }
  }

  private finalizePhrase(): void {
    if (!this.isListening) return;

    const transcript = this.currentTranscript.trim();
    const peak = this.peakDbInPhrase;
    const avg =
      this.dbSamples.length > 0
        ? Math.round(this.dbSamples.reduce((a, b) => a + b, 0) / this.dbSamples.length)
        : peak;

    const zone = this.classifyZone(peak || this.currentDb);

    if (this.onPhraseComplete && (transcript.length > 0 || peak > 45)) {
      this.onPhraseComplete({
        transcript: transcript || '(Inaudible frustrated shouting)',
        peakDb: peak,
        averageDb: avg,
        zone,
      });
    }

    this.currentTranscript = '';
    this.peakDbInPhrase = 0;
    this.dbSamples = [];
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
}

export const micAnalyzer = new MicAnalyzer();
