import test from 'node:test';
import assert from 'node:assert/strict';

const modulePath = '../src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts';

test('smooth path is one cubic centerline', async () => {
  const { smoothRibbonPath } = await import(modulePath);
  const d = smoothRibbonPath([
    { x: 0, y: 0 },
    { x: 80, y: 60 },
    { x: 40, y: 130 },
    { x: 120, y: 220 },
  ]);
  assert.match(d, /^M /);
  assert.match(d, / C /);
  assert.equal((d.match(/M /g) ?? []).length, 1);
  assert.doesNotMatch(d, / L /);
});

test('loose oval loop is asymmetric and exits forward', async () => {
  const { appendLooseOvalLoop } = await import(modulePath);
  const points = [{ x: 40, y: 40 }];
  appendLooseOvalLoop(points, { x: 150, y: 125 }, 86, 58, 0.16);
  assert.ok(points.length >= 9);
  const xs = points.slice(1).map((point) => point.x);
  const ys = points.slice(1).map((point) => point.y);
  assert.ok(Math.max(...xs) - Math.min(...xs) > Math.max(...ys) - Math.min(...ys));
  assert.ok(points.at(-1).y > points[0].y);
});

test('artwork wrap markers preserve front behind front ordering', async () => {
  const { appendArtworkWrap } = await import(modulePath);
  const points = [{ x: 200, y: 200 }];
  const markers = appendArtworkWrap(
    points,
    { left: 700, top: 500, right: 1100, bottom: 800, width: 400, height: 300 },
    'right',
    70,
  );
  assert.ok(markers.frontEntryY < markers.backY);
  assert.ok(markers.backY < markers.frontExitY);
  assert.ok(points.at(-1).y > markers.frontExitY);
});

test('glyph loop remains part of forward-progressing route', async () => {
  const { appendGlyphLoop } = await import(modulePath);
  const points = [{ x: 300, y: 900 }];
  appendGlyphLoop(
    points,
    { left: 330, top: 920, right: 390, bottom: 1000, width: 60, height: 80 },
    1.18,
    1.08,
  );
  assert.ok(points.length >= 9);
  assert.ok(points.at(-1).y > 1000);
});
