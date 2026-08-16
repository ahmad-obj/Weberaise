import assert from 'node:assert/strict';
import test from 'node:test';
import { ArcballController } from '../src/webgl/workSphere/arcball.ts';
import { cameraTargetZ, stepCameraZ } from '../src/webgl/workSphere/camera.ts';
import { buildProjectSlots } from '../src/webgl/workSphere/geometry.ts';
import { findNearestSlot, nextKeyboardSlot } from '../src/webgl/workSphere/selection.ts';
import { transformVec3Quat, vec3f } from '../src/webgl/workSphere/math.ts';

test('pointer movement changes a normalized orientation quaternion', () => {
  const control = new ArcballController(false);
  control.setViewport(1200, 800);
  control.pointerDown(600, 400);
  control.pointerMove(760, 470);
  for (let i = 0; i < 8; i += 1) control.update(16.6667);
  const q = control.orientation;
  assert.ok(Math.abs(Math.hypot(...q) - 1) < 1e-5);
  assert.ok(Math.abs(q[0]) + Math.abs(q[1]) + Math.abs(q[2]) > 1e-4);
});

test('release smoothly settles reference rotation velocity', () => {
  const control = new ArcballController(false);
  control.setViewport(1200, 800);
  control.pointerDown(500, 400);
  control.pointerMove(780, 430);
  control.update(16.6667);
  control.pointerUp();
  const first = Math.abs(control.update(16.6667).rotationVelocity);
  for (let i = 0; i < 160; i += 1) control.update(16.6667);
  const last = Math.abs(control.update(16.6667).rotationVelocity);
  assert.ok(last < first);
  assert.ok(last < 0.01);
});

test('nearest-vertex snap converges to the reference snap direction', () => {
  const slots = buildProjectSlots(6);
  const control = new ArcballController(false);
  control.setViewport(1200, 800);
  control.pointerDown(480, 390);
  control.pointerMove(730, 500);
  control.update(16.6667);
  control.pointerUp();

  for (let i = 0; i < 360; i += 1) {
    const nearest = findNearestSlot(slots, control.orientation);
    const slot = slots.find(candidate => candidate.id === nearest);
    if (slot) {
      const world = transformVec3Quat(vec3f(), slot.direction, control.orientation);
      control.setSnapTarget([world[0], world[1], world[2]]);
    }
    control.update(16.6667);
  }

  const nearest = findNearestSlot(slots, control.orientation);
  const slot = slots.find(candidate => candidate.id === nearest);
  assert.ok(slot);
  const world = transformVec3Quat(vec3f(), slot.direction, control.orientation);
  assert.ok(world[2] < -1.98);
});

test('camera pulls back during energetic drag and returns toward rest', () => {
  const rest = cameraTargetZ(1, 0, false);
  const drag = cameraTargetZ(1, 0.08, true);
  assert.equal(rest, 3);
  assert.ok(drag > rest + 2.5);

  const pulled = stepCameraZ(rest, drag, 16.6667, true);
  assert.ok(pulled > rest);
  const returning = stepCameraZ(pulled, rest, 16.6667, false);
  assert.ok(returning < pulled);
});

test('keyboard order wraps across all 42 sphere instances', () => {
  assert.equal(nextKeyboardSlot(0, -1, 42), 41);
  assert.equal(nextKeyboardSlot(41, 1, 42), 0);
});
