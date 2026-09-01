import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildProjectSlots,
  createIcosphereDirections,
  createProjectSurfaceMesh,
} from '../src/webgl/workSphere/geometry.ts';
import { mat4Identity, multiplyMat4 } from '../src/webgl/workSphere/math.ts';

function referenceMultiply(a, b) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      result[column * 4 + row] =
        a[row] * b[column * 4]
        + a[4 + row] * b[column * 4 + 1]
        + a[8 + row] * b[column * 4 + 2]
        + a[12 + row] * b[column * 4 + 3];
    }
  }
  return result;
}

test('matrix multiplication preserves current values and alias semantics', () => {
  const identity = mat4Identity();
  const a = new Float32Array([
    1, 2, 3, 4,
    5, 6, 7, 8,
    9, 10, 11, 12,
    13, 14, 15, 16,
  ]);
  const b = new Float32Array([
    17, 18, 19, 20,
    21, 22, 23, 24,
    25, 26, 27, 28,
    29, 30, 31, 32,
  ]);

  const expected = referenceMultiply(a, b);
  assert.deepEqual(multiplyMat4(new Float32Array(16), identity, a), a);
  assert.deepEqual(multiplyMat4(new Float32Array(16), a, identity), a);
  assert.deepEqual(multiplyMat4(new Float32Array(16), a, b), expected);

  const aliasA = new Float32Array(a);
  multiplyMat4(aliasA, aliasA, b);
  assert.deepEqual(aliasA, expected);

  const aliasB = new Float32Array(b);
  multiplyMat4(aliasB, a, aliasB);
  assert.deepEqual(aliasB, expected);
});

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

test('surface triangles face +Z before tangent placement so front instances survive culling', () => {
  const mesh = createProjectSurfaceMesh();
  const [ia, ib, ic] = mesh.indices;
  const point = index => [
    mesh.positions[index * 3],
    mesh.positions[index * 3 + 1],
    mesh.positions[index * 3 + 2],
  ];
  const a = point(ia);
  const b = point(ib);
  const c = point(ic);
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const normalZ = ab[0] * ac[1] - ab[1] * ac[0];
  assert.ok(normalZ > 0);
});
