export const FINAL_ZERO_HOLD_MS = 700;

export function countdownDelay(value: number, target: number, reducedMotion: boolean): number {
  if (reducedMotion) return 4;
  if (value <= target) return 0;

  if (value > 60) return 34;
  if (value > 30) return 42;
  if (value > 20) return 50;
  if (value > 10) return 60;

  const nearZero: Record<number, number> = {
    10: 78,
    9: 90,
    8: 104,
    7: 120,
    6: 138,
    5: 162,
    4: 196,
    3: 244,
    2: 308,
    1: 396,
  };

  return nearZero[Math.max(1, Math.min(10, Math.floor(value)))] ?? 60;
}

export function countdownTransitionMs(value: number, reducedMotion: boolean): number {
  if (reducedMotion) return 1;
  if (value > 60) return 28;
  if (value > 30) return 34;
  if (value > 20) return 40;
  if (value > 10) return 48;

  const nearZero: Record<number, number> = {
    10: 60,
    9: 68,
    8: 76,
    7: 84,
    6: 94,
    5: 108,
    4: 128,
    3: 154,
    2: 188,
    1: 236,
    0: 260,
  };

  return nearZero[Math.max(0, Math.min(10, Math.floor(value)))] ?? 48;
}
