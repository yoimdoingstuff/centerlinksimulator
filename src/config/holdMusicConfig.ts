/**
 * Centrelink Hold Music Configuration
 * 
 * Site owners can edit this file to change the default hold music,
 * supply an external or bundled audio file URL, or tune the procedural synthesizer.
 */

export interface HoldMusicConfig {
  /**
   * Title or description of the hold music
   */
  trackTitle: string;

  /**
   * Optional URL or path to an audio file (e.g., '/audio/hold_music.mp3' or external URL).
   * If null or empty, the built-in procedural Australian government lo-fi synthesizer will play.
   */
  audioFileUrl: string | null;

  /**
   * Default master volume for the hold music (0.0 to 1.0)
   */
  defaultVolume: number;

  /**
   * Whether to apply the authentic 300Hz-3400Hz telephone bandpass filter
   * to simulate telephone audio compression.
   */
  enableTelephoneBandpassFilter: boolean;

  /**
   * The bandpass center frequency in Hz (standard phone voice band is ~1400 Hz)
   */
  filterCenterFrequency: number;

  /**
   * Volume level multiplier when someone is speaking (audio ducking, e.g. 0.15 = 15% volume)
   */
  duckingMultiplier: number;
}

export const holdMusicConfig: HoldMusicConfig = {
  trackTitle: 'Centrelink Classic Government Hold Loop (Synthesized Classical)',
  // Set to a path like '/audio/custom-hold.mp3' if you bundle a file, or keep null for procedural synth
  audioFileUrl: null,
  defaultVolume: 0.22,
  enableTelephoneBandpassFilter: true,
  filterCenterFrequency: 1400,
  duckingMultiplier: 0.18,
};
