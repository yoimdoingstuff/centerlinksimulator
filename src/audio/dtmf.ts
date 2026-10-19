/**
 * Web Audio API DTMF tone generator and telephone sound effects
 */

let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

const DTMF_FREQUENCIES: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

export function playDTMFTone(key: string, durationMs: number = 180): void {
  const freqs = DTMF_FREQUENCIES[key];
  if (!freqs) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = durationMs / 1000;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(freqs[0], now);
    osc2.frequency.setValueAtTime(freqs[1], now);

    // Filter to simulate phone handset bandwidth
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1000;
    bandpass.Q.value = 0.8;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gainNode.gain.setValueAtTime(0.18, now + duration - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(bandpass);
    bandpass.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  } catch (err) {
    console.warn('AudioContext not yet unlocked', err);
  }
}

export function playRingbackTone(onEnd?: () => void): () => void {
  let isCancelled = false;
  let hasFired = false;

  const fireEnd = () => {
    if (isCancelled || hasFired) return;
    hasFired = true;
    if (onEnd) onEnd();
  };

  // Ironclad timeout: transition after 2.2 seconds no matter what
  const timer = setTimeout(fireEnd, 2200);

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = 400;
    osc2.frequency.value = 450;

    // Pattern: 0.4s on, 0.2s off, 0.4s on, 2.0s off
    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0.12, now + 0.05);
    gain.gain.setValueAtTime(0, now + 0.45);
    gain.gain.setValueAtTime(0.12, now + 0.65);
    gain.gain.setValueAtTime(0, now + 1.05);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.0);
    osc2.stop(now + 2.0);

    osc1.onended = () => {
      fireEnd();
    };

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      try {
        osc1.stop();
        osc2.stop();
      } catch {
        // already stopped
      }
    };
  } catch {
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }
}

/** Disconnect / Line dropped busy tone */
export function playDisconnectTone(durationMs: number = 3000): () => void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 425;

    // Fast pulse 0.375s on, 0.375s off
    const pulseCount = Math.floor(durationMs / 750);
    for (let i = 0; i < pulseCount; i++) {
      const pulseStart = now + i * 0.75;
      gain.gain.setValueAtTime(0.15, pulseStart);
      gain.gain.setValueAtTime(0, pulseStart + 0.375);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationMs / 1000);

    return () => {
      try {
        osc.stop();
      } catch {
        // stopped
      }
    };
  } catch {
    return () => {};
  }
}

/** Static burst for call quality degradation */
export function playStaticBurst(durationMs: number = 400): void {
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * (durationMs / 1000);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch {
    // ignore
  }
}
