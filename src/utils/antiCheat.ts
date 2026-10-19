import { Difficulty } from '../types/game';

export interface DifficultyConfig {
  name: Difficulty;
  label: string;
  expectedDuration: string;
  initialQueueMin: number;
  initialQueueMax: number;
  secondsPerQueueStep: number;
  dropProbabilityPerMinute: number;
  reverseJumpProbability: number;
  voiceTolerance: number; // 0 to 1
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  EASY: {
    name: 'EASY',
    label: 'Easy Mode (~5m)',
    expectedDuration: '2 to 10 minutes (Average ~5 min)',
    initialQueueMin: 8,
    initialQueueMax: 18,
    secondsPerQueueStep: 14,
    dropProbabilityPerMinute: 0.04,
    reverseJumpProbability: 0.05,
    voiceTolerance: 0.85,
  },
  NORMAL: {
    name: 'NORMAL',
    label: 'Normal Mode (~15m)',
    expectedDuration: '6 to 20 minutes (Average ~15 min)',
    initialQueueMin: 35,
    initialQueueMax: 70,
    secondsPerQueueStep: 20,
    dropProbabilityPerMinute: 0.12,
    reverseJumpProbability: 0.18,
    voiceTolerance: 0.65,
  },
  REALISTIC: {
    name: 'REALISTIC',
    label: 'Realistic Mode (Real-Life Wait)',
    expectedDuration: '45 to 90+ minutes (Real-time Australian government wait)',
    initialQueueMin: 180,
    initialQueueMax: 450,
    secondsPerQueueStep: 45,
    dropProbabilityPerMinute: 0.22,
    reverseJumpProbability: 0.32,
    voiceTolerance: 0.45,
  },
};

/**
 * Calculates realistic Centrelink queue size based on user's current computer hour
 */
export function calculateTimeOfDayQueue(difficulty: Difficulty): {
  initialCount: number;
  rushPeriodName: string;
} {
  const config = DIFFICULTY_CONFIGS[difficulty];
  if (difficulty !== 'REALISTIC') {
    const count =
      Math.floor(Math.random() * (config.initialQueueMax - config.initialQueueMin + 1)) +
      config.initialQueueMin;
    return {
      initialCount: count,
      rushPeriodName: 'Standard Automated Queue',
    };
  }

  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const decimalHour = hour + minute / 60;

  let baseCount = 280;
  let period = 'After Hours Skeleton Queue';

  if (decimalHour >= 8.5 && decimalHour < 11.5) {
    // Morning Rush
    baseCount = Math.floor(340 + Math.random() * 140); // 340 - 480
    period = 'Peak Morning Rush (High Volume)';
  } else if (decimalHour >= 11.5 && decimalHour < 14.0) {
    // Lunch Rush
    baseCount = Math.floor(250 + Math.random() * 110); // 250 - 360
    period = 'Midday Lunch Surge';
  } else if (decimalHour >= 14.0 && decimalHour < 16.5) {
    // Afternoon Peak
    baseCount = Math.floor(310 + Math.random() * 130); // 310 - 440
    period = 'Late Afternoon Escalation Peak';
  } else if (decimalHour >= 16.5 && decimalHour < 18.0) {
    // Pre-closure
    baseCount = Math.floor(210 + Math.random() * 90);
    period = 'Closing Hours Queue Choke';
  } else {
    // Off peak / evening
    baseCount = Math.floor(160 + Math.random() * 80);
    period = 'Off-Peak System Maintenance Queue';
  }

  return {
    initialCount: baseCount,
    rushPeriodName: period,
  };
}

/**
 * High-precision anti-cheat monotonic clock tracker
 * Prevents players from fast-forwarding the system time to cheat the queue
 */
export class AntiCheatClock {
  private initialWallTime: number = Date.now();
  private initialPerfTime: number = performance.now();
  private hasTampered: boolean = false;
  private tamperEvents: number = 0;

  public reset(): void {
    this.initialWallTime = Date.now();
    this.initialPerfTime = performance.now();
    this.hasTampered = false;
    this.tamperEvents = 0;
  }

  public checkTamper(): boolean {
    const elapsedWall = Date.now() - this.initialWallTime;
    const elapsedPerf = performance.now() - this.initialPerfTime;

    // Discrepancy > 4000ms between wall clock and monotonic timer = cheating!
    if (Math.abs(elapsedWall - elapsedPerf) > 4000) {
      this.hasTampered = true;
      this.tamperEvents++;
      // Resync to prevent infinite cascading triggers
      this.initialWallTime = Date.now();
      this.initialPerfTime = performance.now();
      return true;
    }

    return false;
  }

  public getTamperCount(): number {
    return this.tamperEvents;
  }
}
