export interface Wallpaper {
  id: string;
  name: string;
  gradient: string;
}

export const IOS_WALLPAPERS: Wallpaper[] = [
  {
    id: 'ios7_spectrum',
    name: 'iOS 7 Spectrum (Classic)',
    gradient: 'radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.9) 0%, rgba(249, 115, 22, 0.85) 30%, rgba(217, 70, 239, 0.85) 60%, rgba(59, 130, 246, 0.9) 100%)',
  },
  {
    id: 'ocean_waves',
    name: 'Pacific Waves & Surf',
    gradient: 'radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.95) 0%, rgba(14, 116, 144, 0.9) 35%, rgba(15, 23, 42, 0.95) 80%, rgba(3, 105, 161, 0.9) 100%)',
  },
  {
    id: 'geometric_aurora',
    name: 'Geometric Aurora & Violet',
    gradient: 'radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.9) 0%, rgba(236, 72, 153, 0.85) 35%, rgba(59, 130, 246, 0.9) 70%, rgba(16, 185, 129, 0.8) 100%)',
  },
  {
    id: 'sunset_twilight',
    name: 'Sunset Twilight & Gold',
    gradient: 'radial-gradient(circle at 30% 80%, rgba(245, 158, 11, 0.95) 0%, rgba(239, 68, 68, 0.9) 40%, rgba(147, 51, 234, 0.9) 75%, rgba(30, 27, 75, 0.95) 100%)',
  },
];

export function getRandomWallpaper(): Wallpaper {
  const index = Math.floor(Math.random() * IOS_WALLPAPERS.length);
  return IOS_WALLPAPERS[index];
}
