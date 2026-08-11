export type BottomFillState = {
  progress: number;
  complete: boolean;
};

export function bottomFillState(progress: number): BottomFillState {
  const clamped = Math.min(1, Math.max(0, progress));
  return { progress: clamped, complete: clamped >= 1 };
}
