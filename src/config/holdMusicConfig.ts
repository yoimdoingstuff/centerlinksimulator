/**
 * Centrelink Hold Music Configuration
 * 
 * Site owners can edit this file to change the default hold music,
 * supply an external or bundled audio file URL, or tune the procedural synthesizer.
 */

export interface HoldMusicConfig {
  trackTitle: string;
  audioFileUrl: string | null;
  defaultVolume: number;
  enableTelephoneBandpassFilter: boolean;
  filterCenterFrequency: number;
  duckingMultiplier: number;
}

export const holdMusicConfig: HoldMusicConfig = {
  // Tim Carleton's world-famous telephone hold tune: Opus No. 1
  trackTitle: 'Tim Carleton - Opus No. 1 (Default Centrelink Hold Music)',
  audioFileUrl: null,
  defaultVolume: 0.24,
  enableTelephoneBandpassFilter: true,
  filterCenterFrequency: 1400,
  duckingMultiplier: 0.18,
};
