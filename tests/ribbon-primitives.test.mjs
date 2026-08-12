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

test('glyph loop returns near the glyph baseline with slight forward drop', async () => {
  const { appendGlyphLoop } = await import(modulePath);
  const points = [{ x: 300, y: 900 }];
  const rect = { left: 330, top: 920, right: 390, bottom: 1000, width: 60, height: 80 };
  appendGlyphLoop(points, rect, 1.18, 1.08);
  const exit = points.at(-1);
  assert.ok(points.length >= 9);
  assert.ok(exit.y > rect.top + rect.height * 0.5);
  assert.ok(exit.y < rect.bottom + rect.height * 0.35);
  assert.ok(exit.x > rect.left + rect.width * 0.5);
});

test('reassurance loop frames a rect imperfectly and exits below it', async () => {
  const { appendReassuranceLoop } = await import(modulePath);
  const points = [{ x: 280, y: 2400 }];
  const rect = { left: 260, top: 2700, right: 1180, bottom: 2880, width: 920, height: 180 };
  const before = points.length;
  appendReassuranceLoop(points, rect, 86, 58, 0.12);
  assert.ok(points.length >= before + 9);
  const exit = points.at(-1);
  assert.ok(exit.y > rect.bottom);
  const loopPoints = points.slice(before);
  const xs = loopPoints.map((point) => point.x);
  const ys = loopPoints.map((point) => point.y);
  assert.ok(Math.max(...xs) - Math.min(...xs) > Math.max(...ys) - Math.min(...ys));
});

test('taper polygon narrows from full width to a shared zero-width endpoint', async () => {
  const { buildTaperPolygon } = await import(modulePath);
  const centerline = [
    { x: 620, y: 3050 },
    { x: 628, y: 3090 },
    { x: 624, y: 3140 },
    { x: 626, y: 3190 },
  ];
  const polygon = buildTaperPolygon(centerline, 5.2);
  assert.equal(polygon.length, centerline.length * 2);
  const firstLeft = polygon[0];
  const firstRight = polygon.at(-1);
  assert.ok(Math.hypot(firstLeft.x - firstRight.x, firstLeft.y - firstRight.y) > 4.5);
  const lastLeft = polygon[centerline.length - 1];
  const lastRight = polygon[centerline.length];
  assert.ok(Math.hypot(lastLeft.x - lastRight.x, lastLeft.y - lastRight.y) < 0.05);
});
