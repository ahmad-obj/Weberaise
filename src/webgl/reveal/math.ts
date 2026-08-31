export type Point2 = { x: number; y: number };

export function interpolateSegment(start: Point2, end: Point2, maxSpacing: number): Point2[] {
  const spacing = Math.max(0.0001, maxSpacing);
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  if (distance === 0) return [{ ...end }];
  const steps = Math.max(1, Math.ceil(distance / spacing));
  const output: Point2[] = [];
  for (let index = 1; index <= steps; index += 1) {
    const t = index / steps;
    output.push({
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    });
  }
  return output;
}

export function referenceFrameScale(deltaSeconds: number, referenceHz = 60): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return 0;
  return Math.min(2, deltaSeconds * Math.max(1, referenceHz));
}

export function retentionFromReferenceFrame(
  baseRetention: number,
  deltaSeconds: number,
  referenceHz = 60,
): number {
  const base = Math.min(1, Math.max(0, baseRetention));
  return Math.pow(base, referenceFrameScale(deltaSeconds, referenceHz));
}

export function retentionForHalfLife(deltaSeconds: number, halfLifeSeconds: number): number {
  if (halfLifeSeconds <= 0) return 0;
  if (deltaSeconds <= 0) return 1;
  return Math.pow(0.5, deltaSeconds / halfLifeSeconds);
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function oldestFirstWeight(ageSeconds: number, lifetimeSeconds: number): number {
  if (lifetimeSeconds <= 0 || ageSeconds >= lifetimeSeconds) return 0;
  if (ageSeconds <= 0) return 1;
  const normalizedAge = ageSeconds / lifetimeSeconds;
  return 1 - smoothstep(0.55, 1, normalizedAge);
}
