export type ProgressSnapshot = {
  display: number;
  target: number;
  realProgress: number;
  ready: boolean;
};

export type ProgressController = {
  updateRealProgress(progress: number): ProgressSnapshot;
  nextDisplay(): number;
  snapshot(): ProgressSnapshot;
  reset(): void;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function countdownTarget(progress: number): number {
  if (progress >= 1) return 0;
  return Math.max(1, 100 - Math.floor(progress * 100));
}

export function createProgressController(): ProgressController {
  let display = 100;
  let target = 100;
  let realProgress = 0;

  const snapshot = (): ProgressSnapshot => ({
    display,
    target,
    realProgress,
    ready: realProgress >= 1,
  });

  return {
    updateRealProgress(progress) {
      realProgress = clamp01(progress);
      target = countdownTarget(realProgress);
      return snapshot();
    },
    nextDisplay() {
      if (display > target) display -= 1;
      return display;
    },
    snapshot,
    reset() {
      display = 100;
      target = 100;
      realProgress = 0;
    },
  };
}
