import assert from 'node:assert/strict';
import test from 'node:test';
import { selectLiveVideoSlots } from '../src/webgl/workSphere/mediaPool.ts';

test('desktop live pool never exceeds three', () => {
  const ranked = [4, 2, 9, 5, 3].map((slotId, rank) => ({ slotId, rank }));
  assert.deepEqual(selectLiveVideoSlots(ranked, 3), [4, 2, 9]);
});

test('hover gets first priority without growing the pool', () => {
  const ranked = [1, 2, 3, 4].map((slotId, rank) => ({ slotId, rank }));
  assert.deepEqual(selectLiveVideoSlots(ranked, 3, 4), [4, 1, 2]);
});
