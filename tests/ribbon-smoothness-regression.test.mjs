import test from 'node:test';
import assert from 'node:assert/strict';

const modulePath = '../src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts';

function maxTurn(points) {
  let max = 0;

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const angleA = Math.atan2(current.y - previous.y, current.x - previous.x);
    const angleB = Math.atan2(next.y - current.y, next.x - current.x);
    let delta = Math.abs(angleB - angleA);
    if (delta > Math.PI) delta = Math.PI * 2 - delta;
    max = Math.max(max, delta);
  }

  return max;
}

test('opening loop stays oval and avoids angular knees', async () => {
  const { appendLooseOvalLoop } = await import(modulePath);
  const points = [{ x: 40, y: 40 }];
  appendLooseOvalLoop(points, { x: 150, y: 125 }, 86, 58, 0.16);

  const loopPoints = points.slice(1);
  const xs = loopPoints.map((point) => point.x);
  const ys = loopPoints.map((point) => point.y);

  assert.ok(Math.max(...xs) - Math.min(...xs) > Math.max(...ys) - Math.min(...ys));
  assert.ok(maxTurn(loopPoints) < 1.45, `opening loop max turn ${maxTurn(loopPoints)}`);
});

test('Q1 wrap stays smooth around artwork', async () => {
  const { appendArtworkWrap } = await import(modulePath);
  const points = [{ x: 200, y: 200 }];

  appendArtworkWrap(
    points,
    { left: 700, top: 500, right: 1100, bottom: 800, width: 400, height: 300 },
    'right',
    70,
  );

  assert.ok(maxTurn(points) < 1.55, `wrap max turn ${maxTurn(points)}`);
});

test('Q2 bend is one calm monotonic sweep instead of an S-curve', async () => {
  const { appendGentleBend } = await import(modulePath);
  const points = [{ x: 1260, y: 1160 }];
  appendGentleBend(points, 'right', { x: 720, y: 1600 }, 440);

  for (let index = 1; index < points.length; index += 1) {
    assert.ok(
      points[index].x <= points[index - 1].x + 0.01,
      `Q2 bend reversed horizontal direction at point ${index}`,
    );
  }
  assert.ok(maxTurn(points) < 0.55, `Q2 bend max turn ${maxTurn(points)}`);
});

test('glyph loop reads as a clean oval trace', async () => {
  const { appendGlyphLoop } = await import(modulePath);
  const points = [{ x: 300, y: 900 }];

  appendGlyphLoop(
    points,
    { left: 330, top: 920, right: 390, bottom: 1000, width: 60, height: 80 },
    1.18,
    1.08,
  );

  assert.ok(maxTurn(points) < 1.45, `glyph loop max turn ${maxTurn(points)}`);
});
