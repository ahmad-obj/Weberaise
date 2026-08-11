export const FINAL_ZERO_HOLD_MS = 700;

export function countdownDelay(value: number, target: number, reducedMotion: boolean): number {
  if (reducedMotion) return 4;
  if (value <= target) return 0;

  if (value > 60) return 24;
  if (value > 30) return 30;
  if (value > 20) return 38;
  if (value > 10) return 50;

  const nearZero: Record<number, number> = {
    10: 72,
    9: 84,
    8: 98,
    7: 114,
    6: 132,
    5: 156,
    4: 190,
    3: 240,
    2: 306,
    1: 396,
  };

  return nearZero[Math.max(1, Math.min(10, Math.floor(value)))] ?? 50;
}

export function countdownTransitionMs(value: number, reducedMotion: boolean): number {
  if (reducedMotion) return 1;
  if (value > 60) return 78;
  if (value > 30) return 84;
  if (value > 20) return 88;
  if (value > 10) return 90;

  const nearZero: Record<number, number> = {
    10: 92,
    9: 100,
    8: 108,
    7: 118,
    6: 132,
    5: 150,
    4: 176,
    3: 206,
    2: 242,
    1: 278,
    0: 300,
  };

  return nearZero[Math.max(0, Math.min(10, Math.floor(value)))] ?? 90;
}
