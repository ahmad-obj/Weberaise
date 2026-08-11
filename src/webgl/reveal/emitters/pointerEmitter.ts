import { interpolateSegment } from '../math.ts';
import type { RevealSample, TimedPoint } from './types';

export type PointerEmitterOptions = {
  maxSpacing: number;
  radius: number;
  maxVelocity: number;
  strength?: number;
};

function clampVelocity(vx: number, vy: number, maxVelocity: number) {
  const magnitude = Math.hypot(vx, vy);
  if (magnitude <= maxVelocity || magnitude === 0) return { vx, vy };
  const scale = maxVelocity / magnitude;
  return { vx: vx * scale, vy: vy * scale };
}

export function createPointerSamples(
  previous: TimedPoint,
  current: TimedPoint,
  options: PointerEmitterOptions,
): RevealSample[] {
  const points = interpolateSegment(previous, current, Math.max(0.002, options.maxSpacing));
  const totalDt = Math.max(1 / 240, current.time - previous.time);
  const velocity = clampVelocity(
    (current.x - previous.x) / totalDt,
    (current.y - previous.y) / totalDt,
    Math.max(0.01, options.maxVelocity),
  );

  return points.map((point, index) => {
    const t = (index + 1) / points.length;
    return {
      x: point.x,
      y: point.y,
      radius: options.radius,
      strength: options.strength ?? 1,
      vx: velocity.vx,
      vy: velocity.vy,
      time: previous.time + totalDt * t,
    };
  });
}
