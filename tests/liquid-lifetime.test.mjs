import test from 'node:test';
import assert from 'node:assert/strict';

import {
  liquidRadiusScale,
  isLiquidPrimitiveAlive,
} from '../src/webgl/reveal/liquidLifetime.ts';

test('liquid radius holds before contracting geometrically', () => {
  const lifetime = 3.6;
  const hold = 0.62;

  assert.equal(liquidRadiusScale(0, lifetime, hold), 1);
  assert.ok(liquidRadiusScale(2.1, lifetime, hold) > 0.98);

  const early = liquidRadiusScale(2.4, lifetime, hold);
  const middle = liquidRadiusScale(3.0, lifetime, hold);
  const late = liquidRadiusScale(3.5, lifetime, hold);

  assert.ok(early > middle);
  assert.ok(middle > late);
  assert.ok(late > 0);
  assert.equal(liquidRadiusScale(3.6, lifetime, hold), 0);
  assert.equal(liquidRadiusScale(8, lifetime, hold), 0);
});

test('liquid primitive liveness ends exactly at its lifetime', () => {
  assert.equal(isLiquidPrimitiveAlive(0, 3.6), true);
  assert.equal(isLiquidPrimitiveAlive(3.59, 3.6), true);
  assert.equal(isLiquidPrimitiveAlive(3.6, 3.6), false);
});
