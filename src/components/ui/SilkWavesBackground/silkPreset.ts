export const SILK_COLORS = [
  [1 / 255, 4 / 255, 10 / 255],
  [3 / 255, 19 / 255, 45 / 255],
  [10 / 255, 61 / 255, 145 / 255],
  [40 / 255, 120 / 255, 246 / 255],
] as const;

export const SILK_PRESET = {
  timeScale: 0.76,
  colorCount: 4,
  shape: [1.26, 0.28, 0.5, 0] as const,
  surface: [2.4, 1.11, 0, 1] as const,
  finish: [0, 0, 0, 0.05] as const,
  transform: [1581, 0, 0, 0] as const,
  space: [0, 0, 0, 0] as const,
  cursor: [0, 2, 0.65, 0.46] as const,
} as const;
