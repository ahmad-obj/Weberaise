import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const moduleFile = resolve(root, 'src/components/MainSite/PostExploreNarrative/ribbonPacing.ts');
const modulePath = '../src/components/MainSite/PostExploreNarrative/ribbonPacing.ts';

const markerIds = [
  'openingExit', 'q1Approach', 'q1WrapFront', 'q1WrapBack', 'q1WrapExit', 'q2BendExit',
  'q3Approach', 'q3FirstLoopComplete', 'q3SecondLoopComplete',
  'reassuranceApproach', 'reassuranceLoopComplete', 'taperEnd',
];

function fixture() {
  const samples = markerIds.map((id, index) => ({
    length: index * 120,
    localX: index * 40,
    localY: index * 280,
    documentY: index * 280,
  }));
  const markers = Object.fromEntries(markerIds.map((id, index) => [id, { x: index * 40, y: index * 280 }]));
  const stops = {
    q1: { localY: 700, revealLocalY: 560, revealViewportRatio: 0.76, bandBias: 0 },
    q2: { localY: 1500, revealLocalY: 1360, revealViewportRatio: 0.76, bandBias: 0 },
    q3: { localY: 2300, revealLocalY: 2160, revealViewportRatio: 0.76, bandBias: 0 },
    reassurance: { localY: 3200, revealLocalY: 3060, revealViewportRatio: 0.82, bandBias: 0 },
  };
  return { lookup: { totalLength: samples.at(-1).length, samples }, markers, stops, viewportHeight: 900 };
}

test('semantic ribbon pacing module exists', () => {
  assert.equal(existsSync(moduleFile), true, 'ribbonPacing.ts must allocate scroll budget by interaction');
});

test('pacing anchors are monotonic and protect every perceptual loop budget', async () => {
  assert.equal(existsSync(moduleFile), true, 'ribbonPacing.ts must exist before its mapping can be tested');
  const { buildRibbonPacingAnchors } = await import(modulePath);
  const anchors = buildRibbonPacingAnchors(fixture());

  for (let index = 1; index < anchors.length; index += 1) {
    assert.ok(anchors[index].scrollLocalY > anchors[index - 1].scrollLocalY, `${anchors[index].id} scroll anchor is not monotonic`);
    assert.ok(anchors[index].pathLength > anchors[index - 1].pathLength, `${anchors[index].id} path anchor is not monotonic`);
  }

  const byId = Object.fromEntries(anchors.map((anchor) => [anchor.id, anchor]));
  const budget = (from, to) => byId[to].scrollLocalY - byId[from].scrollLocalY;
  assert.ok(budget('q1Approach', 'q1WrapExit') >= 900 * 0.52);
  assert.ok(budget('q1WrapExit', 'q2BendExit') <= 900 * 0.36);
  assert.ok(budget('q3Approach', 'q3SecondLoopComplete') >= 900 * 0.42);
  assert.ok(budget('reassuranceApproach', 'reassuranceLoopComplete') >= 900 * 0.48);
});

test('paced length interpolation remains bounded and reversible', async () => {
  assert.equal(existsSync(moduleFile), true, 'ribbonPacing.ts must exist before interpolation can be tested');
  const { buildRibbonPacingAnchors, resolvePacedLength } = await import(modulePath);
  const anchors = buildRibbonPacingAnchors(fixture());
  const start = anchors.find((anchor) => anchor.id === 'q3Approach');
  const end = anchors.find((anchor) => anchor.id === 'q3SecondLoopComplete');
  const midpoint = (start.scrollLocalY + end.scrollLocalY) / 2;
  const forward = resolvePacedLength(anchors, midpoint);
  const reverse = resolvePacedLength(anchors, midpoint);

  assert.ok(forward > start.pathLength && forward < end.pathLength);
  assert.equal(reverse, forward);
  assert.equal(resolvePacedLength(anchors, -1000), anchors[0].pathLength);
  assert.equal(resolvePacedLength(anchors, 100000), anchors.at(-1).pathLength);
});

test('shared OO seam resolves first and second completion to different loop passes', async () => {
  const { resolveMarkerLengths } = await import(modulePath);
  const seam = { x: 10, y: 10 };
  const lookup = {
    totalLength: 350,
    samples: [
      { length: 0, localX: 0, localY: 0, documentY: 0 },
      { length: 5, localX: 0, localY: 10, documentY: 5 },
      { length: 10, localX: 10, localY: 10, documentY: 10 },
      { length: 20, localX: 10, localY: 10, documentY: 20 },
      { length: 40, localX: 0, localY: 10, documentY: 40 },
      { length: 100, localX: 10, localY: 10, documentY: 100 },
      { length: 140, localX: 0, localY: 10, documentY: 140 },
      { length: 200, localX: 10, localY: 10, documentY: 200 },
      { length: 230, localX: 20, localY: 10, documentY: 230 },
      { length: 260, localX: 10, localY: 10, documentY: 260 },
      { length: 280, localX: 30, localY: 10, documentY: 280 },
      { length: 300, localX: 10, localY: 10, documentY: 300 },
      { length: 320, localX: 30, localY: 10, documentY: 320 },
      { length: 350, localX: 40, localY: 20, documentY: 350 },
    ],
  };
  const ordered = [
    { id: 'q3Approach', point: { x: 0, y: 10 } },
    { id: 'q3FirstLoopComplete', point: seam },
    { id: 'q3SecondLoopComplete', point: seam },
    { id: 'reassuranceApproach', point: { x: 30, y: 10 } },
  ];
  const lengths = resolveMarkerLengths(lookup, ordered);

  assert.equal(lengths.q3FirstLoopComplete, 100);
  assert.equal(lengths.q3SecondLoopComplete, 200);
});
