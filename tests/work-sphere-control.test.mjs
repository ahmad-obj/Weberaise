import assert from 'node:assert/strict';
import test from 'node:test';
import { decayAngularVelocity } from '../src/webgl/workSphere/arcball.ts';
import { nextKeyboardSlot } from '../src/webgl/workSphere/selection.ts';

test('inertia decays to rest', () => {
  let velocity = 1;
  for (let i = 0; i < 120; i += 1) {
    const next = decayAngularVelocity(velocity, 16.6667, false);
    assert.ok(next <= velocity);
    velocity = next;
  }
  assert.ok(velocity < 0.002);
});

test('reduced motion removes residual inertia', () => {
  assert.equal(decayAngularVelocity(1, 16.6667, true), 0);
});

test('keyboard order wraps', () => {
  assert.equal(nextKeyboardSlot(0, -1, 12), 11);
  assert.equal(nextKeyboardSlot(11, 1, 12), 0);
});
