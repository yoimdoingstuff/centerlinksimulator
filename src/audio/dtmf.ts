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

export function playLinePickupClick(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Relay switch click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);

    // Subtle line pickup static pop
    playStaticBurst(60);
  } catch {
    // ignore
  }
}

/**
 * Plays the full outgoing call dialing sequence:
 * 1. Rapid DTMF touch-tone sequence for the dialed number
 * 2. Australian dual-tone ringback cadence (400Hz + 450Hz)
 * 3. Line pickup click & connection chime
 * 4. Guaranteed callback into Centrelink
 */
export function playDialSequence(
  numberToDial: string,
  onConnect?: () => void
): () => void {
  let isCancelled = false;
  let hasConnected = false;
  const timeoutIds: number[] = [];
  let stopCurrentTone: (() => void) | null = null;

  const triggerConnect = () => {
    if (isCancelled || hasConnected) return;
    hasConnected = true;
    playLinePickupClick();
    playConnectionChime();
    if (onConnect) onConnect();
  };

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 1. Play DTMF tones for each dialed digit
    const cleanDigits = numberToDial.replace(/[^0-9*#]/g, '') || '132850';
    const digits = cleanDigits.slice(0, 10).split('');

    const toneDurationMs = 70;
    const toneGapMs = 35;
    let currentDelay = 50;

    digits.forEach((digit) => {
      const tid = window.setTimeout(() => {
        if (isCancelled) return;
        playDTMFTone(digit, toneDurationMs);
      }, currentDelay);
      timeoutIds.push(tid);
      currentDelay += toneDurationMs + toneGapMs;
    });

    // 2. Play ringback tone after dialing completes (~700ms - 800ms)
    currentDelay += 180;
    const ringTid = window.setTimeout(() => {
      if (isCancelled) return;
      stopCurrentTone = playRingbackTone(() => {
        triggerConnect();
      });
    }, currentDelay);
    timeoutIds.push(ringTid);

    // Safety fallback timer (~2.6 seconds max) to guarantee call connects even if audio fails
    const safetyTimer = window.setTimeout(() => {
      triggerConnect();
    }, currentDelay + 1700);
    timeoutIds.push(safetyTimer);

    return () => {
      isCancelled = true;
      timeoutIds.forEach((id) => clearTimeout(id));
      if (stopCurrentTone) stopCurrentTone();
    };
  } catch {
    const fallbackTimer = window.setTimeout(triggerConnect, 1800);
    return () => {
      isCancelled = true;
      clearTimeout(fallbackTimer);
    };
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

  // Ring for 1.4 seconds then connect
  const timer = window.setTimeout(fireEnd, 1400);

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = 400;
    osc2.frequency.value = 450;

    // Authentic Australian ring cadence: 0.4s on, 0.2s pause, 0.4s on, 0.4s pause
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.setValueAtTime(0, now + 0.4);
    gain.gain.setValueAtTime(0.22, now + 0.6);
    gain.gain.setValueAtTime(0, now + 1.0);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.35);
    osc2.stop(now + 1.35);

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
    noise.start();
  } catch {
    // ignore
  }
}

/** Line connection chime when call connects to exchange */
export function playConnectionChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.setValueAtTime(1250, now + 0.08);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.setValueAtTime(0.15, now + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  } catch {
    // ignore
  }
}

