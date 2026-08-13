import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const moduleFile = resolve(root, 'src/components/MainSite/PostExploreNarrative/ribbonCurveBuilder.ts');
const modulePath = '../src/components/MainSite/PostExploreNarrative/ribbonCurveBuilder.ts';

const markerIds = [
  'openingExit',
  'q1Approach',
  'q1WrapFront',
  'q1WrapBack',
  'q1WrapExit',
  'q2BendExit',
  'q3Approach',
  'q3FirstLoopComplete',
  'q3SecondLoopComplete',
  'reassuranceApproach',
  'reassuranceLoopComplete',
  'taperEnd',
];

function angleDelta(a, b) {
  let delta = Math.abs(a - b);
  if (delta > Math.PI) delta = Math.PI * 2 - delta;
  return delta;
}

test('semantic ribbon curve builder exists', () => {
  assert.equal(existsSync(moduleFile), true, 'ribbonCurveBuilder.ts must replace dense point smoothing');
});

test('semantic cubic builder emits one continuous cubic path with ordered markers', async () => {
  assert.equal(existsSync(moduleFile), true, 'ribbonCurveBuilder.ts must exist before its API can be exercised');
  const { RibbonCurveBuilder } = await import(modulePath);
  const builder = new RibbonCurveBuilder({ x: 0, y: 0 });

  for (const [index, id] of markerIds.entries()) {
    const startX = index * 60;
    builder
      .cubic(`segment-${id}`, { x: startX + 18, y: index * 30 + 6 }, { x: startX + 42, y: index * 30 + 24 }, { x: startX + 60, y: index * 30 + 30 })
      .mark(id);
  }

  const d = builder.toPathD();
  assert.equal((d.match(/M /g) ?? []).length, 1);
  assert.equal((d.match(/ C /g) ?? []).length, markerIds.length);
  assert.doesNotMatch(d, /\bL\b|\bQ\b/);
  assert.deepEqual(Object.keys(builder.markers), markerIds);
  assert.ok(builder.segments.every((segment) => (
    Math.hypot(segment.control1.x - segment.start.x, segment.control1.y - segment.start.y) > 0.01
    && Math.hypot(segment.end.x - segment.control2.x, segment.end.y - segment.control2.y) > 0.01
  )));
});

test('adjacent semantic curves preserve their shared tangent', async () => {
  assert.equal(existsSync(moduleFile), true, 'ribbonCurveBuilder.ts must exist before tangent continuity can be tested');
  const { RibbonCurveBuilder } = await import(modulePath);
  const builder = new RibbonCurveBuilder({ x: 0, y: 0 });
  builder.cubic('first', { x: 25, y: 0 }, { x: 75, y: 50 }, { x: 100, y: 50 });
  builder.cubic('second', { x: 125, y: 50 }, { x: 175, y: 100 }, { x: 200, y: 100 });

  for (let index = 0; index < builder.segments.length - 1; index += 1) {
    const segment = builder.segments[index];
    const next = builder.segments[index + 1];
    const exit = Math.atan2(segment.end.y - segment.control2.y, segment.end.x - segment.control2.x);
    const enter = Math.atan2(next.control1.y - next.start.y, next.control1.x - next.start.x);
    assert.ok(angleDelta(exit, enter) < 0.16, `${segment.id} → ${next.id} breaks tangent continuity`);
  }
});
