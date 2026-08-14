import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildProjectSlots,
  createIcosphereDirections,
  createProjectSurfaceMesh,
} from '../src/webgl/workSphere/geometry.ts';

test('one icosahedron subdivision produces exactly 42 sphere positions', () => {
  const positions = createIcosphereDirections(2);
  assert.equal(positions.length, 42);
  for (const [x, y, z] of positions) {
    assert.ok(Math.abs(Math.hypot(x, y, z) - 2) < 1e-5);
  }
});

test('sphere density is independent of project count', () => {
  assert.equal(buildProjectSlots(1).length, 42);
  assert.equal(buildProjectSlots(6).length, 42);
  assert.equal(buildProjectSlots(17).length, 42);
});

test('one project fills every sphere slot', () => {
  assert.ok(buildProjectSlots(1).every(slot => slot.projectIndex === 0));
});

test('six projects repeat cyclically across all sphere slots', () => {
  buildProjectSlots(6).forEach((slot, id) => {
    assert.equal(slot.projectIndex, id % 6);
  });
});

test('website surface is exact 4:3 with 35 vertices and 144 indices', () => {
  const mesh = createProjectSurfaceMesh();
  assert.equal(mesh.positions.length / 3, 35);
  assert.equal(mesh.uvs.length / 2, 35);
  assert.equal(mesh.indices.length, 144);

  const xs = [];
  const ys = [];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    xs.push(mesh.positions[i]);
    ys.push(mesh.positions[i + 1]);
  }
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  assert.ok(Math.abs(width / height - 4 / 3) < 1e-6);
});
