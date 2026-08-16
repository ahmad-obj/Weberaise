import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isActivationGesture,
  hitTestProjectedSlots,
} from '../src/webgl/workSphere/activation.ts';

test('activation thresholds distinguish click/tap from drag', () => {
  const base = { startX: 0, startY: 0, durationMs: 120 };
  assert.equal(isActivationGesture({ ...base, endX: 7, endY: 0, coarsePointer: false }), true);
  assert.equal(isActivationGesture({ ...base, endX: 9, endY: 0, coarsePointer: false }), false);
  assert.equal(isActivationGesture({ ...base, endX: 13, endY: 0, coarsePointer: true }), true);
  assert.equal(isActivationGesture({ ...base, endX: 15, endY: 0, coarsePointer: true }), false);
  assert.equal(isActivationGesture({ ...base, endX: 1, endY: 1, durationMs: 551, coarsePointer: false }), false);
});

test('one-shot hit test preserves physical slot identity and chooses front-most overlap', () => {
  const projected = [
    { slotId: 5, bounds: { left: 0, top: 0, width: 100, height: 100 }, depth: 0.2 },
    { slotId: 19, bounds: { left: 0, top: 0, width: 100, height: 100 }, depth: 0.8 },
  ];
  assert.equal(hitTestProjectedSlots(50, 50, projected), 19);
  assert.equal(hitTestProjectedSlots(120, 50, projected), -1);
});
