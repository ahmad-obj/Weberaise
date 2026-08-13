import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJourneyPath } from '../src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts';

const modulePath = '../src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts';


function cubicEndpoints(d) {
  const first = d.match(/^M\s+([\d.-]+)\s+([\d.-]+)/);
  const points = first ? [{ x: Number(first[1]), y: Number(first[2]) }] : [];
  points.push(...[...d.matchAll(/C\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+([\d.-]+)\s+([\d.-]+)/g)]
    .map((match) => ({ x: Number(match[1]), y: Number(match[2]) })));
  return points;
}

function strictSegmentCrossings(points) {
  const crossings = [];
  const orient = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

  for (let i = 0; i < points.length - 1; i += 1) {
    for (let j = i + 2; j < points.length - 1; j += 1) {
      const a = points[i];
      const b = points[i + 1];
      const c = points[j];
      const d = points[j + 1];
      const o1 = orient(a, b, c);
      const o2 = orient(a, b, d);
      const o3 = orient(c, d, a);
      const o4 = orient(c, d, b);
      if (o1 * o2 < -1e-6 && o3 * o4 < -1e-6) crossings.push([i, j]);
    }
  }

  return crossings;
}

function maxNearTopRun(points, topY, tolerance) {
  let max = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    if (Math.abs(a.y - topY) <= tolerance && Math.abs(b.y - topY) <= tolerance) {
      max = Math.max(max, Math.abs(b.x - a.x));
    }
  }
  return max;
}


test('opening oval hands off from its tangent instead of adding a hooked departure', async () => {
  const { appendLooseOvalLoop } = await import(modulePath);
  const center = { x: 150, y: 125 };
  const radiusY = 58;
  const points = [{ x: 40, y: 40 }];

  appendLooseOvalLoop(points, center, 86, radiusY, 0.08);

  assert.ok(Math.abs(points.at(-1).y - (center.y - radiusY)) < 1, `opening loop leaves tangent at y=${points.at(-1).y}`);
});

test('large reassurance oval does not draw a long duplicate top edge', async () => {
  const { appendReassuranceLoop } = await import(modulePath);
  const rect = { left: 260, top: 2700, right: 1180, bottom: 2880, width: 920, height: 180 };
  const points = [{ x: 310, y: 2460 }];

  appendReassuranceLoop(points, rect, 86, 58, 0.12);

  const ry = rect.height * 0.5 + 58;
  const topY = rect.top + rect.height * 0.5 - ry;
  assert.ok(
    maxNearTopRun(points, topY, 1) < 90,
    `reassurance loop has a ${maxNearTopRun(points, topY, 1).toFixed(1)}px near-top chord`,
  );
  assert.ok(points.at(-1).x > rect.right + 12, `reassurance exits through text at x=${points.at(-1).x}`);
  assert.ok(points.at(-1).y > rect.bottom, `reassurance must exit below frame at y=${points.at(-1).y}`);
});


test('Q1 artwork wrap keeps its loop seam out of the visible top edge', async () => {
  const { appendArtworkWrap } = await import(modulePath);
  const rect = { left: 700, top: 500, right: 1100, bottom: 800, width: 400, height: 300 };
  const points = [{ x: 260, y: 220 }];
  const before = points.length;

  appendArtworkWrap(points, rect, 'right', 70);

  let maxFlatRunAboveArtwork = 0;
  for (let index = before; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    if (a.y < rect.top && b.y < rect.top && Math.abs(a.y - b.y) < 1) {
      maxFlatRunAboveArtwork = Math.max(maxFlatRunAboveArtwork, Math.abs(a.x - b.x));
    }
  }
  assert.ok(maxFlatRunAboveArtwork < 14, `Q1 exposes a ${maxFlatRunAboveArtwork.toFixed(1)}px seam above artwork`);
});

test('adjacent LOOK glyphs use one clean paired trace without strict crossing knots', async () => {
  const module = await import(modulePath);
  assert.equal(typeof module.appendGlyphPairLoops, 'function', 'paired LOOK primitive must exist');
  const points = [{ x: 620, y: 1830 }];
  const first = { left: 335.7, top: 2474.8, right: 379.3, bottom: 2547, width: 43.6, height: 72.2 };
  const second = { left: 379.3, top: 2474.8, right: 422.9, bottom: 2547, width: 43.6, height: 72.2 };

  module.appendGlyphPairLoops(points, first, second, 1.22, 1.1);

  assert.deepEqual(strictSegmentCrossings(points), []);
  assert.ok(points.at(-1).x > second.right + 12, `LOOK trace exits through following text at x=${points.at(-1).x}`);
});

test('opening departure clears its oval before descending', async () => {
  const { appendLooseOvalLoop, appendTangentFlow } = await import(modulePath);
  const points = [{ x: 0, y: 18 }];
  const center = { x: 320, y: 92.88 };
  const rx = 88;
  const ry = 54;

  appendLooseOvalLoop(points, center, rx, ry, 0.06);
  const loopEnd = points.length - 1;
  const exit = points.at(-1);
  appendTangentFlow(points, { x: 489.6, y: exit.y + 132 }, 34);

  const postLoop = points.slice(0);
  const crossingPairs = strictSegmentCrossings(postLoop).filter(([a, b]) => a < loopEnd - 1 && b >= loopEnd);
  assert.deepEqual(crossingPairs, [], `opening departure re-enters its loop: ${JSON.stringify(crossingPairs)}`);
});

test('reassurance departure clears the oval instead of cutting through its right edge', async () => {
  const { appendReassuranceLoop } = await import(modulePath);
  const rect = { left: 57.6, top: 3299.2, right: 1382.4, bottom: 3486.8, width: 1324.8, height: 187.6 };
  const points = [{ x: 430, y: 2450 }];

  appendReassuranceLoop(points, rect, 82, 54, 0.115);

  const crossingPairs = strictSegmentCrossings(points);
  assert.deepEqual(crossingPairs, [], `reassurance departure re-enters its loop: ${JSON.stringify(crossingPairs)}`);
});

test('reassurance loop respects compact horizontal padding on mobile', async () => {
  const { appendReassuranceLoop } = await import(modulePath);
  const rect = { left: 18, top: 3296.7, right: 372.9, bottom: 3354.1, width: 354.9, height: 57.4 };
  const paddingX = 8;
  const points = [{ x: 208, y: 2315 }];

  appendReassuranceLoop(points, rect, paddingX, 34, 0.1);

  const maxX = Math.max(...points.map((point) => point.x));
  assert.ok(maxX <= rect.right + paddingX + 1, `mobile reassurance ignores compact padding at x=${maxX}`);
});

function maxTurnInRange(points, startIndex = 0) {
  let max = 0;
  for (let index = Math.max(1, startIndex); index < points.length - 1; index += 1) {
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

function longestAlmostHorizontalSegment(points, startIndex = 0) {
  let max = 0;
  for (let index = startIndex; index < points.length - 1; index += 1) {
    const a = points[index];
    const b = points[index + 1];
    if (Math.abs(a.y - b.y) <= 0.75) max = Math.max(max, Math.abs(a.x - b.x));
  }
  return max;
}

test('opening leaves the oval through a tangent-preserving soft departure', async () => {
  const { appendLooseOvalLoop, appendTangentFlow } = await import(modulePath);
  assert.equal(typeof appendTangentFlow, 'function');

  const points = [{ x: 0, y: 18 }];
  appendLooseOvalLoop(points, { x: 320.32, y: 92.88 }, 88, 54, 0.06);
  const departureStart = points.length - 2;
  appendTangentFlow(points, { x: 489.6, y: 170.88 }, 34);

  assert.ok(maxTurnInRange(points, departureStart) < 0.9, `opening departure max turn ${maxTurnInRange(points, departureStart)}`);
});

test('LOOK paired trace has no eyeglass-style horizontal bridge', async () => {
  const { appendGlyphPairLoops } = await import(modulePath);
  const points = [{ x: 620, y: 1830 }];
  const first = { left: 335.7, top: 2474.8, right: 379.3, bottom: 2547, width: 43.6, height: 72.2 };
  const second = { left: 379.3, top: 2474.8, right: 422.9, bottom: 2547, width: 43.6, height: 72.2 };
  const start = points.length;

  appendGlyphPairLoops(points, first, second, 1.22, 1.1);

  assert.ok(longestAlmostHorizontalSegment(points, start) < 14, `LOOK bridge run ${longestAlmostHorizontalSegment(points, start)}`);
  assert.ok(maxTurnInRange(points, start) < 1.05, `LOOK transition max turn ${maxTurnInRange(points, start)}`);
});

test('mobile LOOK trace approaches from the side instead of drawing a long vertical stem through the word', async () => {
  const { appendGlyphPairLoops } = await import(modulePath);
  const first = { left: 154, top: 2289.578125, right: 174.203125, bottom: 2323.65625, width: 20.203125, height: 34.078125 };
  const second = { left: 174.203125, top: 2289.578125, right: 194.40625, bottom: 2323.65625, width: 20.203125, height: 34.078125 };
  const points = [{ x: 155.69, y: 1945.95 }];
  const start = points.length;

  appendGlyphPairLoops(points, first, second, 1.18, 1.06);

  const approach = points.slice(start).filter((point) => (
    point.y >= first.top - first.height * 3
    && point.y <= first.top - first.height * 0.55
  ));
  assert.ok(approach.length > 0, 'LOOK trace should expose a short side-approach staging point');
  assert.ok(
    approach.some((point) => point.x <= first.left - first.height * 0.55),
    `mobile LOOK approach stayed vertically aligned at x=${Math.min(...approach.map((point) => point.x)).toFixed(2)}`,
  );
  assert.deepEqual(strictSegmentCrossings(points), []);
});

test('mobile opening never reverses back through its own oval', () => {
  const rect = (left, top, width, height) => ({ left, top, right: left + width, bottom: top + height, width, height });
  const geometry = {
    q1: rect(18, 618.625, 354, 349.46875), q2: rect(18, 1462.625, 354, 349.46875), q3: rect(18, 2289.578125, 354, 383.546875),
    artQ1: rect(28.8125, 710.703125, 343.1875, 257.390625), artQ2: rect(18, 1462.625, 343.1875, 257.390625), artQ3: rect(28.8125, 2415.734375, 343.1875, 257.390625),
    q2Text: rect(100.5, 1778.015625, 271.5, 34.078125), o1: rect(154, 2289.578125, 20.203125, 34.078125), o2: rect(174.203125, 2289.578125, 20.203125, 34.078125),
    reassuranceText: rect(18, 3296.65625, 354.890625, 57.40625),
  };
  const selectors = new Map([
    ['[data-journey-stop="q1"]', geometry.q1], ['[data-journey-stop="q2"]', geometry.q2], ['[data-journey-stop="q3"]', geometry.q3],
    ['[data-ribbon-artwork="q1"]', geometry.artQ1], ['[data-ribbon-artwork="q2"]', geometry.artQ2], ['[data-ribbon-artwork="q3"]', geometry.artQ3],
    ['[data-ribbon-question="q2"]', geometry.q2Text], ['[data-ribbon-glyph="look-o-1"]', geometry.o1], ['[data-ribbon-glyph="look-o-2"]', geometry.o2],
    ['[data-reassurance-text]', geometry.reassuranceText],
  ]);
  const root = {
    scrollHeight: 3840,
    getBoundingClientRect: () => rect(0, 0, 390, 3840),
    querySelector: (selector) => selectors.has(selector) ? { getBoundingClientRect: () => selectors.get(selector) } : null,
  };
  const mobileConfig = {
    edgeInset: 14, sampleSpacing: 8, ribbonWidth: 3.9,
    opening: { lead: 118, loopRadiusX: 54, loopRadiusY: 34, exitRun: 76 },
    q1: { clearance: 34, wrapScale: 0.88 }, q2: { bendWidth: 188, bendBias: 0 }, q3: { glyphScaleX: 1.18, glyphScaleY: 1.06 },
    reassurance: { paddingX: 30, paddingY: 34, skew: 0.1, approachLead: 132, bandBias: -0.004, exitRun: 52, taperLength: 118 },
  };

  const built = buildJourneyPath(root, mobileConfig);
  const openingPoints = cubicEndpoints(built.d).filter((point) => point.y < 400);
  assert.deepEqual(strictSegmentCrossings(openingPoints), []);
});

const desktopRect = (left, top, width, height) => ({ left, top, right: left + width, bottom: top + height, width, height });
const desktopGeometry = {
  q1: desktopRect(52, 650, 1336, 430), q2: desktopRect(52, 1500, 1336, 430), q3: desktopRect(52, 2350, 1336, 430),
  artQ1: desktopRect(830, 700, 470, 350), artQ2: desktopRect(120, 1540, 470, 350), artQ3: desktopRect(830, 2390, 470, 350),
  q2Text: desktopRect(719, 1669, 649, 73), o1: desktopRect(330, 2510, 62, 86), o2: desktopRect(393, 2510, 62, 86),
  reassuranceText: desktopRect(58, 3330, 1324, 188),
};
const desktopRootRect = desktopRect(0, 0, 1440, 4300);
const desktopLookup = new Map([
  ['[data-journey-stop="q1"]', desktopGeometry.q1], ['[data-journey-stop="q2"]', desktopGeometry.q2], ['[data-journey-stop="q3"]', desktopGeometry.q3],
  ['[data-ribbon-artwork="q1"]', desktopGeometry.artQ1], ['[data-ribbon-artwork="q2"]', desktopGeometry.artQ2], ['[data-ribbon-artwork="q3"]', desktopGeometry.artQ3],
  ['[data-ribbon-question="q2"]', desktopGeometry.q2Text], ['[data-ribbon-glyph="look-o-1"]', desktopGeometry.o1], ['[data-ribbon-glyph="look-o-2"]', desktopGeometry.o2],
  ['[data-reassurance-text]', desktopGeometry.reassuranceText],
]);
const desktopRoot = {
  scrollHeight: 4300,
  getBoundingClientRect: () => desktopRootRect,
  querySelector: (selector) => {
    const value = desktopLookup.get(selector);
    return value ? { getBoundingClientRect: () => value } : null;
  },
};
const desktopConfig = {
  edgeInset: 28, sampleSpacing: 10, ribbonWidth: 5.2,
  opening: { lead: 220, loopRadiusX: 88, loopRadiusY: 54, exitRun: 132 },
  q1: { clearance: 78, wrapScale: 1 }, q2: { bendWidth: 460, bendBias: 0 }, q3: { glyphScaleX: 1.22, glyphScaleY: 1.1 },
  reassurance: { paddingX: 82, paddingY: 54, skew: 0.115, approachLead: 190, bandBias: -0.006, exitRun: 72, taperLength: 168 },
};

test('built LOOK route uses the crossing-free paired OO trace', () => {
  const built = buildJourneyPath(desktopRoot, desktopConfig);
  const points = cubicEndpoints(built.d).filter((point) => (
    point.y >= desktopGeometry.o1.top - 80
    && point.y <= desktopGeometry.o1.bottom + 80
    && point.x >= desktopGeometry.o1.left - 80
    && point.x <= desktopGeometry.o2.right + 100
  ));
  assert.deepEqual(strictSegmentCrossings(points), []);
});

test('reassurance route stays inside the document so its exit and taper remain visible', () => {
  const built = buildJourneyPath(desktopRoot, desktopConfig);
  const points = cubicEndpoints(built.d).filter((point) => point.y >= desktopGeometry.reassuranceText.top - 120);
  const maxX = Math.max(...points.map((point) => point.x));
  assert.ok(maxX <= desktopRootRect.width - 2, `reassurance/taper escapes viewport at x=${maxX}`);
});
