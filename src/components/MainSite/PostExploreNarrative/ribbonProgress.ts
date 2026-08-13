function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeRibbonProgress(visibleLength: number, totalLength: number) {
  if (!Number.isFinite(visibleLength) || !Number.isFinite(totalLength) || totalLength <= 0) return 0;
  return clamp(visibleLength / totalLength, 0, 1);
}

export function restoreRibbonLength(
  storedProgress: string | undefined,
  totalLength: number,
  openingFloor: number,
  openingPlayed: boolean,
) {
  const parsed = Number.parseFloat(storedProgress ?? '');
  const restored = Number.isFinite(parsed)
    ? clamp(parsed, 0, 1) * Math.max(0, totalLength)
    : 0;
  const visibleLength = openingPlayed ? Math.max(openingFloor, restored) : restored;
  return clamp(visibleLength, 0, Math.max(0, totalLength));
}

type InitialRibbonDrawOptions = {
  restoredVisibleLength: number;
  openingFloor: number;
  pacedLength: number;
  scrollLocalY: number;
  openingPlayed: boolean;
  openingSeconds: number;
  scrubSeconds: number;
};

export function resolveInitialRibbonDraw({
  restoredVisibleLength,
  openingFloor,
  pacedLength,
  scrollLocalY,
  openingPlayed,
  openingSeconds,
  scrubSeconds,
}: InitialRibbonDrawOptions) {
  const targetLength = Math.max(openingFloor, pacedLength);
  if (openingPlayed || scrollLocalY > 1) {
    return { targetLength, duration: scrubSeconds };
  }

  const remainingOpening = clamp(
    (openingFloor - restoredVisibleLength) / Math.max(0.001, openingFloor),
    0,
    1,
  );
  return { targetLength, duration: openingSeconds * remainingOpening };
}
