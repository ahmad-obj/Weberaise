export function getRenderSize(
  width: number,
  height: number,
  devicePixelRatio: number,
  coarse: boolean,
) {
  const cap = coarse ? 1.2 : 1.5;
  const dpr = Math.min(Math.max(devicePixelRatio || 1, 1), cap);

  return {
    width: Math.max(1, Math.round(width * dpr)),
    height: Math.max(1, Math.round(height * dpr)),
    dpr,
  };
}

export function dampScalar(
  current: number,
  target: number,
  dt: number,
  timeConstant = 0.28,
) {
  const ease = 1 - Math.exp(-Math.max(0, dt) / timeConstant);
  return current + (target - current) * ease;
}
