import test from 'node:test';
import assert from 'node:assert/strict';
import { buildJourneyPath } from '../src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts';

const rect = (left, top, width, height) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
  width,
  height,
});

const geometry = {
  q1: rect(52, 650, 1336, 430),
  q2: rect(52, 1500, 1336, 430),
  q3: rect(52, 2350, 1336, 430),
  reassurance: rect(120, 3300, 1200, 580),
  artQ1: rect(830, 700, 470, 350),
  artQ2: rect(120, 1540, 470, 350),
  artQ3: rect(830, 2390, 470, 350),
  o1: rect(330, 2510, 62, 86),
  o2: rect(393, 2510, 62, 86),
};

const rootRect = rect(0, 0, 1440, 4300);
const lookup = new Map([
  ['[data-journey-stop="q1"]', geometry.q1],
  ['[data-journey-stop="q2"]', geometry.q2],
  ['[data-journey-stop="q3"]', geometry.q3],
  ['[data-journey-stop="reassurance"]', geometry.reassurance],
  ['[data-ribbon-artwork="q1"]', geometry.artQ1],
  ['[data-ribbon-artwork="q2"]', geometry.artQ2],
  ['[data-ribbon-artwork="q3"]', geometry.artQ3],
  ['[data-ribbon-glyph="look-o-1"]', geometry.o1],
  ['[data-ribbon-glyph="look-o-2"]', geometry.o2],
]);

const root = {
  scrollHeight: 4300,
  getBoundingClientRect: () => rootRect,
  querySelector: (selector) => {
    const value = lookup.get(selector);
    return value ? { getBoundingClientRect: () => value } : null;
  },
};

const config = {
  edgeInset: 28,
  sampleSpacing: 12,
  opening: { lead: 220, loopRadiusX: 84, loopRadiusY: 52, exitRun: 120 },
  q1: { clearance: 76, wrapScale: 1 },
  q2: { bendWidth: 440, bendBias: 0 },
  q3: { glyphScaleX: 1.2, glyphScaleY: 1.08 },
  reassurance: { id: 'reassurance', side: 'left', clearance: 88, approachLead: 190, bandBias: -0.006 },
};

test('art-directed path is one continuous cubic route measured from artwork and glyphs', () => {
  const built = buildJourneyPath(root, config);
  assert.match(built.d, /^M /);
  assert.match(built.d, / C /);
  assert.equal((built.d.match(/M /g) ?? []).length, 1);
  assert.doesNotMatch(built.d, / L /);
  assert.ok(built.openingLocalY > 120);
  assert.ok(built.stops.q3.localY >= geometry.o1.top - 80);
  assert.ok(built.stops.q3.localY <= geometry.o1.bottom + 160);
});

test('q1 and q3 expose intentional front-layer clip windows', () => {
  const built = buildJourneyPath(root, config);
  assert.ok(built.frontClipRects.length >= 3);
  const intersectsQ1 = built.frontClipRects.some((clip) =>
    clip.x < geometry.artQ1.right && clip.x + clip.width > geometry.artQ1.left &&
    clip.y < geometry.artQ1.bottom && clip.y + clip.height > geometry.artQ1.top,
  );
  const intersectsLook = built.frontClipRects.some((clip) =>
    clip.x < geometry.o2.right && clip.x + clip.width > geometry.o1.left &&
    clip.y < geometry.o1.bottom && clip.y + clip.height > geometry.o1.top,
  );
  assert.equal(intersectsQ1, true);
  assert.equal(intersectsLook, true);
});

test('all reveal stops remain available to the controller', () => {
  const built = buildJourneyPath(root, config);
  for (const id of ['q1', 'q2', 'q3', 'reassurance']) {
    assert.ok(Number.isFinite(built.stops[id].localY), `${id} localY`);
    assert.ok(Number.isFinite(built.stops[id].revealLocalY), `${id} revealLocalY`);
  }
});
