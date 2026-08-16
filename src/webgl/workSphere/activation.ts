import {
  dotVec3,
  multiplyMat4,
  normalizeVec3,
  transformVec3Quat,
  transformVec4Mat4,
  vec3f,
  type Mat4,
  type Quat,
} from './math';

export type ScreenBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PointerActivationSample = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  durationMs: number;
  coarsePointer: boolean;
};

const FINE_TRAVEL = 8;
const COARSE_TRAVEL = 14;
const MAX_DURATION_MS = 550;
const FRONT: readonly [number, number, number] = [0, 0, -1];

export function isActivationGesture(sample: PointerActivationSample): boolean {
  if (sample.durationMs < 0 || sample.durationMs > MAX_DURATION_MS) return false;
  const travel = Math.hypot(sample.endX - sample.startX, sample.endY - sample.startY);
  return travel <= (sample.coarsePointer ? COARSE_TRAVEL : FINE_TRAVEL);
}

export function frontAlignmentError(
  direction: ArrayLike<number>,
  orientation: Quat,
  front: readonly [number, number, number] = FRONT,
): number {
  const transformed = normalizeVec3(vec3f(), transformVec3Quat(vec3f(), direction, orientation));
  return 1 - Math.max(-1, Math.min(1, dotVec3(transformed, front)));
}

export function projectSurfaceBounds(
  model: Mat4,
  view: Mat4,
  projection: Mat4,
  cssWidth: number,
  cssHeight: number,
): ScreenBounds | null {
  if (cssWidth <= 0 || cssHeight <= 0) return null;
  const viewProjection = new Float32Array(16);
  multiplyMat4(viewProjection, projection, view);

  const centerWorld = transformVec4Mat4([0, 0, 0, 1], model);
  const radius = Math.hypot(centerWorld[0], centerWorld[1], centerWorld[2]);
  if (!Number.isFinite(radius) || radius <= 1e-6) return null;

  const corners: readonly [number, number, number, number][] = [
    [-2 / 3, -0.5, 0, 1],
    [2 / 3, -0.5, 0, 1],
    [2 / 3, 0.5, 0, 1],
    [-2 / 3, 0.5, 0, 1],
  ];

  const points: Array<{ x: number; y: number }> = [];
  for (const corner of corners) {
    const world = transformVec4Mat4(corner, model);
    const length = Math.hypot(world[0], world[1], world[2]);
    if (length <= 1e-6) return null;
    const s = radius / length;
    const clip = transformVec4Mat4([world[0] * s, world[1] * s, world[2] * s, 1], viewProjection);
    if (!Number.isFinite(clip[3]) || clip[3] <= 1e-6) return null;
    const ndcX = clip[0] / clip[3];
    const ndcY = clip[1] / clip[3];
    if (!Number.isFinite(ndcX) || !Number.isFinite(ndcY)) return null;
    points.push({
      x: (ndcX * 0.5 + 0.5) * cssWidth,
      y: (1 - (ndcY * 0.5 + 0.5)) * cssHeight,
    });
  }

  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const width = right - left;
  const height = bottom - top;
  if (![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  return { left, top, width, height };
}

export function hitTestProjectedSlots(
  pointX: number,
  pointY: number,
  projected: readonly { slotId: number; bounds: ScreenBounds | null; depth: number }[],
): number {
  let winner = -1;
  let bestDepth = -Infinity;
  for (const candidate of projected) {
    const bounds = candidate.bounds;
    if (!bounds) continue;
    const inside = pointX >= bounds.left
      && pointX <= bounds.left + bounds.width
      && pointY >= bounds.top
      && pointY <= bounds.top + bounds.height;
    if (inside && candidate.depth > bestDepth) {
      bestDepth = candidate.depth;
      winner = candidate.slotId;
    }
  }
  return winner;
}
