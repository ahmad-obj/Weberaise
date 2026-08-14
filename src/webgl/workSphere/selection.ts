import {
  dotVec3,
  transformVec3Quat,
  vec3f,
  type Quat,
} from './math';
import type { SphereSlot, Vec3 } from './types';

export function findNearestSlot(
  slots: readonly SphereSlot[],
  orientation: Quat,
  front: Vec3 = [0, 0, 1],
): number {
  if (!slots.length) return -1;
  let bestSlot = slots[0].id;
  let bestDot = -Infinity;

  for (const slot of slots) {
    const oriented = transformVec3Quat(vec3f(), slot.direction, orientation);
    const dot = dotVec3(front, oriented);
    if (dot > bestDot) {
      bestDot = dot;
      bestSlot = slot.id;
    }
  }

  return bestSlot;
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
      return { slotId: slot.id, depth: oriented[2], rank: 0 };
    })
    .sort((a, b) => b.depth - a.depth)
    .map((entry, rank) => ({ ...entry, rank }));
}
