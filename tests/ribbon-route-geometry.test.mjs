import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJourneyPath } from '../src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts';

const rect = (left, top, width, height) => ({ left, top, right: left + width, bottom: top + height, width, height });
const geometry = {
  q1: rect(52, 650, 1336, 430), q2: rect(52, 1500, 1336, 430), q3: rect(52, 2350, 1336, 430),
  artQ1: rect(830, 700, 470, 350), artQ2: rect(120, 1540, 470, 350), artQ3: rect(830, 2390, 470, 350),
  q2Text: rect(719, 1669, 649, 73), o1: rect(330, 2510, 62, 86), o2: rect(393, 2510, 62, 86),
  reassuranceText: rect(220, 3330, 1000, 116),
};
const rootRect = rect(0, 0, 1440, 4300);
const lookup = new Map([
  ['[data-journey-stop="q1"]', geometry.q1], ['[data-journey-stop="q2"]', geometry.q2], ['[data-journey-stop="q3"]', geometry.q3],
  ['[data-ribbon-artwork="q1"]', geometry.artQ1], ['[data-ribbon-artwork="q2"]', geometry.artQ2], ['[data-ribbon-artwork="q3"]', geometry.artQ3],
  ['[data-ribbon-question="q2"]', geometry.q2Text], ['[data-ribbon-glyph="look-o-1"]', geometry.o1], ['[data-ribbon-glyph="look-o-2"]', geometry.o2],
  ['[data-reassurance-text]', geometry.reassuranceText],
]);
const root = {
  scrollHeight: 4300,
  getBoundingClientRect: () => rootRect,
  querySelector: (selector) => { const value = lookup.get(selector); return value ? { getBoundingClientRect: () => value } : null; },
};
const config = {
  edgeInset: 28, sampleSpacing: 12, ribbonWidth: 5.2,
  opening: { lead: 220, loopRadiusX: 84, loopRadiusY: 52, exitRun: 120 },
  q1: { clearance: 76, wrapScale: 1 }, q2: { bendWidth: 440, bendBias: 0 }, q3: { glyphScaleX: 1.2, glyphScaleY: 1.08 },
  reassurance: { paddingX: 82, paddingY: 54, skew: 0.115, approachLead: 190, bandBias: -0.006, exitRun: 72, taperLength: 168 },
};

function cubicEndpoints(d) {
  return [...d.matchAll(/C\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+([\d.-]+)\s+([\d.-]+)/g)].map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));
}

test('art-directed path remains one continuous cubic route', () => {
  const built = buildJourneyPath(root, config);
  assert.match(built.d, /^M /);
  assert.match(built.d, / C /);
  assert.equal((built.d.match(/M /g) ?? []).length, 1);
  assert.doesNotMatch(built.d, / L /);
  assert.ok(built.openingLocalY > 120);
  assert.ok(built.stops.q3.localY >= geometry.o1.top - 80);
  assert.ok(built.stops.q3.localY <= geometry.o1.bottom + 160);
  assert.ok(built.segments.length >= 22);
  assert.deepEqual(Object.keys(built.markers), [
    'openingExit', 'q1Approach', 'q1WrapFront', 'q1WrapBack', 'q1WrapExit',
    'q2BendExit', 'q3Approach', 'q3FirstLoopComplete', 'q3SecondLoopComplete',
    'reassuranceApproach', 'reassuranceLoopComplete', 'taperEnd',
  ]);
  for (let index = 0; index < built.segments.length - 1; index += 1) {
    const segment = built.segments[index];
    const next = built.segments[index + 1];
    const exit = Math.atan2(segment.end.y - segment.control2.y, segment.end.x - segment.control2.x);
    const enter = Math.atan2(next.control1.y - next.start.y, next.control1.x - next.start.x);
    let delta = Math.abs(exit - enter);
    if (delta > Math.PI) delta = Math.PI * 2 - delta;
    assert.ok(delta < 0.18, `${segment.id} → ${next.id} tangent delta ${delta}`);
  }
});

test('q2 calm bend stays in the measured artwork-to-text gap at text height', () => {
  const built = buildJourneyPath(root, config);
  const corridor = cubicEndpoints(built.d).filter((point) => point.y >= geometry.q2Text.top - 20 && point.y <= geometry.q2Text.bottom + 20);
  assert.ok(corridor.length > 0);
  for (const point of corridor) assert.ok(point.x <= geometry.q2Text.left - 12, `q2 route entered text at x=${point.x}`);
});

test('q1 and q3 expose intentional front-layer clip windows', () => {
  const built = buildJourneyPath(root, config);
  assert.ok(built.frontClipRects.length >= 3);
  assert.equal(built.frontClipRects.some((clip) => clip.x < geometry.artQ1.right && clip.x + clip.width > geometry.artQ1.left && clip.y < geometry.artQ1.bottom && clip.y + clip.height > geometry.artQ1.top), true);
  assert.equal(built.frontClipRects.some((clip) => clip.x < geometry.o2.right && clip.x + clip.width > geometry.o1.left && clip.y < geometry.o1.bottom && clip.y + clip.height > geometry.o1.top), true);
});

test('reassurance is measured from text and finishes in taper geometry', () => {
  const built = buildJourneyPath(root, config);
  assert.ok(built.stops.reassurance.localY >= geometry.reassuranceText.top);
  assert.ok(built.stops.reassurance.localY <= geometry.reassuranceText.bottom);
  assert.ok(built.taper.startLocalY > geometry.reassuranceText.bottom);
  assert.match(built.taper.centerlineD, /^M /);
  assert.ok(built.taper.polygonPoints.length >= 8);
  assert.ok(built.taper.polygonPoints.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)));
});

test('all reveal stops remain available to controller', () => {
  const built = buildJourneyPath(root, config);
  for (const id of ['q1', 'q2', 'q3', 'reassurance']) {
    assert.ok(Number.isFinite(built.stops[id].localY), `${id} localY`);
    assert.ok(Number.isFinite(built.stops[id].revealLocalY), `${id} revealLocalY`);
  }
});
