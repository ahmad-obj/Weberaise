import assert from 'node:assert/strict';
import test from 'node:test';
import { ArcballController, decayAngularVelocity } from '../src/webgl/workSphere/arcball.ts';
import { buildProjectSlots } from '../src/webgl/workSphere/geometry.ts';
import { transformVec3Quat, vec3f } from '../src/webgl/workSphere/math.ts';
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

test('soft snap converges the chosen sphere direction toward front', () => {
  const slots = buildProjectSlots(6);
  const controller = new ArcballController(false);
  controller.setSnapTarget(slots[0].direction);
  for (let i = 0; i < 180; i += 1) controller.update(16.6667);
  const worldDirection = transformVec3Quat(vec3f(), slots[0].direction, controller.orientation);
  assert.ok(worldDirection[2] > 0.999);
});
