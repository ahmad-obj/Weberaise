import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPathLookup } from '../src/components/MainSite/PostExploreNarrative/pathLookup.ts';

test('path lookup preserves traversal samples through same-height loop', () => {
  const points = [
    { x: 0, y: 100 },
    { x: 10, y: 90 },
    { x: 20, y: 100 },
    { x: 10, y: 110 },
    { x: 0, y: 100 },
    { x: 30, y: 100 },
    { x: 40, y: 120 },
  ];
  const totalLength = (points.length - 1) * 10;
  const path = {
    getTotalLength: () => totalLength,
    getPointAtLength: (length) => points[Math.min(points.length - 1, Math.round(length / 10))],
  };
  const svg = {
    getBoundingClientRect: () => ({ width: 200, height: 200 }),
    viewBox: { baseVal: { width: 200, height: 200, x: 0, y: 0 } },
  };

  const lookup = buildPathLookup(path, svg, 0, 10);
  const loopSamples = lookup.samples.filter((sample) => sample.length >= 10 && sample.length <= 50);

  assert.ok(loopSamples.length >= 4, `expected loop samples to survive lookup, got ${loopSamples.length}`);
  assert.ok(lookup.samples.every((sample) => Number.isFinite(sample.localX) && Number.isFinite(sample.localY)));
  assert.deepEqual(
    lookup.samples.slice(0, points.length).map(({ localX, localY }) => ({ x: localX, y: localY })),
    points,
  );
  for (let index = 1; index < lookup.samples.length; index += 1) {
    assert.ok(
      lookup.samples[index].documentY > lookup.samples[index - 1].documentY,
      'virtual documentY must advance strictly',
    );
  }
});
