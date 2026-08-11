export const FINAL_ZERO_HOLD_MS = 700;

export function countdownDelay(value: number, target: number, reducedMotion: boolean): number {
  if (reducedMotion) return 4;
  if (value <= target) return 0;

  if (value > 60) return 24;
  if (value > 30) return 30;
  if (value > 20) return 38;
  if (value > 10) return 50;

  const nearZero: Record<number, number> = {
    10: 68,
    9: 78,
    8: 90,
    7: 104,
    6: 122,
    5: 148,
    4: 184,
    3: 232,
    2: 296,
    1: 382,
  };

  return nearZero[Math.max(1, Math.min(10, Math.floor(value)))] ?? 50;
}
