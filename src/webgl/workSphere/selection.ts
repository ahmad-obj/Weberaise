import {
  dotVec3,
  transformVec3Quat,
  vec3f,
  type Quat,
} from './math';
import type { SphereSlot, Vec3 } from './types';

export const REFERENCE_SNAP_DIRECTION: Vec3 = [0, 0, -1];

export function findNearestSlot(
  slots: readonly SphereSlot[],
  orientation: Quat,
  snapDirection: Vec3 = REFERENCE_SNAP_DIRECTION,
): number {
  if (!slots.length) return -1;

  const inverseOrientation = new Float32Array([
    -orientation[0],
    -orientation[1],
    -orientation[2],
    orientation[3],
  ]);
  const targetInObjectSpace = transformVec3Quat(
    vec3f(),
    snapDirection,
    inverseOrientation,
  );

  let nearestSlotId = slots[0].id;
  let bestDot = -Infinity;
  for (const slot of slots) {
    const dot = dotVec3(targetInObjectSpace, slot.direction);
    if (dot > bestDot) {
      bestDot = dot;
      nearestSlotId = slot.id;
    }
  }
  return nearestSlotId;
}

export function nextKeyboardSlot(current: number, delta: number, slotCount: number): number {
  if (slotCount <= 0) return -1;
  return ((current + delta) % slotCount + slotCount) % slotCount;
}

export function rankSlotsByFront(
  slots: readonly SphereSlot[],
  orientation: Quat,
): Array<{ slotId: number; rank: number; depth: number }> {
  return slots
    .map(slot => {
      const oriented = transformVec3Quat(vec3f(), slot.direction, orientation);
      return { slotId: slot.id, depth: -oriented[2], rank: 0 };
    })
    .sort((a, b) => b.depth - a.depth)
    .map((entry, rank) => ({ ...entry, rank }));
}
