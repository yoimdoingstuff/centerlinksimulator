/**
 * iOS-style Haptic vibration feedback utility
 */

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'error' = 'light'): void {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'selection':
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(45);
        break;
      case 'error':
        navigator.vibrate([40, 60, 40]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Unsupported or gesture blocked
  }
}
