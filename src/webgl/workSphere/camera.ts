export const REFERENCE_TARGET_FRAME_MS = 1000 / 60;

export function cameraTargetZ(
  scaleFactor: number,
  rotationVelocity: number,
  pointerDown: boolean,
): number {
  const rest = 3 * scaleFactor;
  return pointerDown ? rest + rotationVelocity * 80 + 2.5 : rest;
}

export function stepCameraZ(
  currentZ: number,
  targetZ: number,
  deltaMs: number,
  pointerDown: boolean,
): number {
  const timeScale = deltaMs / REFERENCE_TARGET_FRAME_MS + 0.0001;
  const damping = (pointerDown ? 7 : 5) / timeScale;
  return currentZ + (targetZ - currentZ) / Math.max(1, damping);
}
