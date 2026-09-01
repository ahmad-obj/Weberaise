export const EXIT_FLUID_CONFIG = {
  sourceBandTop: 0.14,
  dyeStrength: 0.24,
  velocityBase: 4.2,
  velocityPeak: 8.0,
  lateralStrength: 0.45,
  sealStart: 0.9997,
} as const;

export function clampExitProgress(progress: number) {
  return Math.min(1, Math.max(0, progress));
}
