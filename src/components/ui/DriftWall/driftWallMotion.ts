export type DriftDirection = 'up' | 'down';

export function columnFactor(index: number, variance: number): number {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
}

export function getBaseVelocity(
  index: number,
  speed: number,
  variance: number,
  direction: DriftDirection,
): number {
  const directionSign = direction === 'up' ? 1 : -1;
  const alternatingSign = index % 2 === 0 ? 1 : -1;
  return speed * columnFactor(index, variance) * directionSign * alternatingSign;
}

export function getVelocityTarget(
  baseVelocity: number,
  columnIndex: number,
  hoveredColumn: number,
): number {
  return hoveredColumn === columnIndex ? 0 : baseVelocity;
}

export function getVelocityEase(dt: number, targetVelocity: number): number {
  const timeConstant = targetVelocity === 0 ? 0.16 : 0.28;
  return 1 - Math.exp(-dt / timeConstant);
}
