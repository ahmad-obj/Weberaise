import { mat4, vec4 } from 'gl-matrix';
import type { ScreenBounds } from './types';

const QUAD_CORNERS = [
  [-0.5, -0.5, 0, 1],
  [0.5, -0.5, 0, 1],
  [0.5, 0.5, 0, 1],
  [-0.5, 0.5, 0, 1],
] as const;

export function projectQuadBounds(
  model: mat4,
  viewProjection: mat4,
  cssWidth: number,
  cssHeight: number,
): ScreenBounds | null {
  const clipMatrix = mat4.multiply(mat4.create(), viewProjection, model);
  const points = QUAD_CORNERS.map(corner => {
    const clip = vec4.transformMat4(vec4.create(), vec4.fromValues(...corner), clipMatrix);
    if (clip[3] <= 0.0001) return null;
    const x = clip[0] / clip[3];
    const y = clip[1] / clip[3];
    return {
      x: (x * 0.5 + 0.5) * cssWidth,
      y: (1 - (y * 0.5 + 0.5)) * cssHeight,
    };
  });

  if (points.some(point => point === null)) return null;
  const valid = points as Array<{ x: number; y: number }>;
  const left = Math.min(...valid.map(point => point.x));
  const right = Math.max(...valid.map(point => point.x));
  const top = Math.min(...valid.map(point => point.y));
  const bottom = Math.max(...valid.map(point => point.y));

  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

export function pointInBounds(x: number, y: number, bounds: ScreenBounds | null): boolean {
  if (!bounds) return false;
  return x >= bounds.left
    && x <= bounds.left + bounds.width
    && y >= bounds.top
    && y <= bounds.top + bounds.height;
}
