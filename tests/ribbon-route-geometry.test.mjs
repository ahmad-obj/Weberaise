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

const stopRects = {
  q1: rect(72, 780, 760, 150),
  q2: rect(590, 1700, 760, 150),
  q3: rect(72, 2600, 760, 190),
  reassurance: rect(120, 3500, 1200, 580),
};

const rootRect = rect(0, 0, 1440, 4300);
const root = {
  scrollHeight: 4300,
  getBoundingClientRect: () => rootRect,
  querySelector: (selector) => {
    const id = selector.match(/data-journey-stop="([^"]+)"/)?.[1];
    const value = id ? stopRects[id] : undefined;
    return value ? { getBoundingClientRect: () => value } : null;
  },
};

const config = {
  edgeInset: 28,
  openingLength: 112,
  sampleSpacing: 12,
  visits: [
    { id: 'q1', side: 'right', clearance: 96, approachLead: 150, bandBias: 0.006 },
    { id: 'q2', side: 'left', clearance: 108, approachLead: 170, bandBias: -0.004 },
    { id: 'q3', side: 'right', clearance: 96, approachLead: 160, bandBias: 0.004 },
    { id: 'reassurance', side: 'left', clearance: 88, approachLead: 190, bandBias: -0.006 },
  ],
};

function cubicEndpoints(d) {
  const values = [];
  for (const match of d.matchAll(/C\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+([\d.-]+)\s+([\d.-]+)/g)) {
    values.push({ x: Number(match[1]), y: Number(match[2]) });
  }
  return values;
}

test('broad sweeps enter the safe side before reaching a stop typography corridor', () => {
  const built = buildJourneyPath(root, config);
  const points = cubicEndpoints(built.d);

  for (const visit of config.visits) {
    const target = stopRects[visit.id];
    const protectedTop = target.top - Math.min(visit.clearance, 80);
    const protectedBottom = target.bottom + Math.min(visit.clearance, 80);
    const safeLeft = target.left - visit.clearance;
    const safeRight = target.right + visit.clearance;

    const corridorPoints = points.filter(
      (point) => point.y >= protectedTop && point.y <= protectedBottom,
    );

    assert.ok(corridorPoints.length > 0, `${visit.id} should have route points in its vertical corridor`);

    for (const point of corridorPoints) {
      const onSafeSide = visit.side === 'left' ? point.x <= safeLeft : point.x >= safeRight;
      assert.equal(
        onSafeSide,
        true,
        `${visit.id} route point (${point.x}, ${point.y}) entered the protected typography corridor`,
      );
    }
  }
});
