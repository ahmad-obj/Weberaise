export function getRenderSize(
  width: number,
  height: number,
  devicePixelRatio: number,
) {
  const dpr = Math.min(Math.max(devicePixelRatio || 1, 1), 2);

  return {
    width: Math.max(1, Math.round(width * dpr)),
    height: Math.max(1, Math.round(height * dpr)),
    dpr,
  };
}

export function getTailRootMargin(viewportHeight: number) {
  const margin = Math.max(0, Math.round(viewportHeight * 1.6));
  return `${margin}px 0px`;
}
