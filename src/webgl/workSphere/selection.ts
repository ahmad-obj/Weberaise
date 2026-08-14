import { quat, vec3 } from 'gl-matrix';
import type { SphereSlot, Vec3 } from './types';

export function findNearestSlot(
  slots: readonly SphereSlot[],
  orientation: quat,
  front: Vec3 = [0, 0, 1],
): number {
  if (!slots.length) return -1;
  const frontVector = vec3.fromValues(...front);
  let bestSlot = slots[0].id;
  let bestDot = -Infinity;

  for (const slot of slots) {
    const oriented = vec3.transformQuat(vec3.create(), vec3.fromValues(...slot.direction), orientation);
    const dot = vec3.dot(frontVector, oriented);
    if (dot > bestDot) {
      bestDot = dot;
      bestSlot = slot.id;
    }
  }

  return bestSlot;
}

export function nextKeyboardSlot(current: number, delta: number, slotCount: number): number {
  if (slotCount <= 0) return -1;
  const normalized = ((current + delta) % slotCount + slotCount) % slotCount;
  return normalized;
}

export function rankSlotsByFront(
  slots: readonly SphereSlot[],
  orientation: quat,
): Array<{ slotId: number; rank: number; depth: number }> {
  return slots
    .map(slot => {
      const oriented = vec3.transformQuat(vec3.create(), vec3.fromValues(...slot.direction), orientation);
      return { slotId: slot.id, depth: oriented[2], rank: 0 };
    })
    .sort((a, b) => b.depth - a.depth)
    .map((entry, rank) => ({ ...entry, rank }));
}
