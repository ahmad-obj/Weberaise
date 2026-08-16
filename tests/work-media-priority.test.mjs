import assert from 'node:assert/strict';
import test from 'node:test';
import { selectLiveVideoSlots } from '../src/webgl/workSphere/mediaPool.ts';

test('desktop live pool never exceeds three unique projects', () => {
  const ranked = [
    { slotId: 0, rank: 0, projectIndex: 0 },
    { slotId: 1, rank: 1, projectIndex: 1 },
    { slotId: 2, rank: 2, projectIndex: 2 },
    { slotId: 3, rank: 3, projectIndex: 3 },
  ];
  assert.deepEqual(selectLiveVideoSlots(ranked, 3), [0, 1, 2]);
});

test('repeated instances of one project consume only one live slot', () => {
  const ranked = Array.from({ length: 42 }, (_, slotId) => ({
    slotId,
    rank: slotId,
    projectIndex: 0,
  }));
  assert.deepEqual(selectLiveVideoSlots(ranked, 3), [0]);
});

test('repeated projects are skipped until a new project appears', () => {
  const ranked = [
    { slotId: 0, rank: 0, projectIndex: 0 },
    { slotId: 6, rank: 1, projectIndex: 0 },
    { slotId: 1, rank: 2, projectIndex: 1 },
    { slotId: 7, rank: 3, projectIndex: 1 },
    { slotId: 2, rank: 4, projectIndex: 2 },
  ];
  assert.deepEqual(selectLiveVideoSlots(ranked, 3), [0, 1, 2]);
});
