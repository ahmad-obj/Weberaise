export const EXIT_FLUID_CONFIG = {
  sourceBandTop: 0.14,
  dyeStrength: 0.24,
  velocityBase: 4.2,
  velocityPeak: 7.0,
  lateralStrength: 0.35,
  sealStart: 0.94,
} as const;

export function clampExitProgress(progress: number) {
  return Math.min(1, Math.max(0, progress));
}
