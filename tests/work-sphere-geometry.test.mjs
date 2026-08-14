import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProjectSlots, createIcosahedronDirections, createProjectQuad } from '../src/webgl/workSphere/geometry.ts';

test('base sphere uses twelve normalized icosahedron directions', () => {
  const dirs = createIcosahedronDirections();
  assert.equal(dirs.length, 12);
  for (const [x, y, z] of dirs) assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 1e-6);
});

test('six projects repeat on antipodal pairs', () => {
  const slots = buildProjectSlots(6);
  assert.equal(slots.length, 12);
  for (let projectIndex = 0; projectIndex < 6; projectIndex += 1) {
    const pair = slots.filter(slot => slot.projectIndex === projectIndex);
    assert.equal(pair.length, 2);
    const dot = pair[0].direction.reduce((sum, value, i) => sum + value * pair[1].direction[i], 0);
    assert.ok(dot < -0.99);
  }
});

test('project geometry is a landscape quad', () => {
  assert.deepEqual(Array.from(createProjectQuad().indices), [0, 1, 2, 0, 2, 3]);
});
