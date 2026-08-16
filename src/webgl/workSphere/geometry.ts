import type { SphereSlot, Vec3 } from './types';

const ICOSPHERE_RADIUS = 2;

const BASE_VERTICES: readonly Vec3[] = (() => {
  const t = Math.sqrt(5) * 0.5 + 0.5;
  return [
    [-1, t, 0],
    [1, t, 0],
    [-1, -t, 0],
    [1, -t, 0],
    [0, -1, t],
    [0, 1, t],
    [0, -1, -t],
    [0, 1, -t],
    [t, 0, -1],
    [t, 0, 1],
    [-t, 0, -1],
    [-t, 0, 1],
  ] as Vec3[];
})();

const BASE_FACES: readonly [number, number, number][] = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

function midpoint(
  vertices: Vec3[],
  aIndex: number,
  bIndex: number,
  cache: Map<string, number>,
): number {
  const low = Math.min(aIndex, bIndex);
  const high = Math.max(aIndex, bIndex);
  const key = `${low}:${high}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const a = vertices[aIndex];
  const b = vertices[bIndex];
  const index = vertices.length;
  vertices.push([
    (a[0] + b[0]) * 0.5,
    (a[1] + b[1]) * 0.5,
    (a[2] + b[2]) * 0.5,
  ]);
  cache.set(key, index);
  return index;
}

function normalizeToRadius([x, y, z]: Vec3, radius: number): Vec3 {
  const length = Math.hypot(x, y, z) || 1;
  const scale = radius / length;
  return [x * scale, y * scale, z * scale];
}

export function createIcosphereDirections(radius = ICOSPHERE_RADIUS): readonly Vec3[] {
  const vertices = BASE_VERTICES.map(vertex => [...vertex] as Vec3);
  const midpointCache = new Map<string, number>();
  const subdividedFaces: [number, number, number][] = [];

  for (const [a, b, c] of BASE_FACES) {
    const ab = midpoint(vertices, a, b, midpointCache);
    const bc = midpoint(vertices, b, c, midpointCache);
    const ca = midpoint(vertices, c, a, midpointCache);
    subdividedFaces.push(
      [a, ab, ca],
      [b, bc, ab],
      [c, ca, bc],
      [ab, bc, ca],
    );
  }

  void subdividedFaces;
  return vertices.map(vertex => normalizeToRadius(vertex, radius));
}

export function buildProjectSlots(
  projectCount: number,
  radius = ICOSPHERE_RADIUS,
): readonly SphereSlot[] {
  if (projectCount <= 0) return [];

  return createIcosphereDirections(radius).map((direction, id) => ({
    id,
    direction,
    projectIndex: id % projectCount,
  }));
}

export function createProjectSurfaceMesh() {
  const cellsX = 6;
  const cellsY = 4;
  const width = 4 / 3;
  const height = 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= cellsY; y += 1) {
    const v = y / cellsY;
    for (let x = 0; x <= cellsX; x += 1) {
      const u = x / cellsX;
      positions.push((u - 0.5) * width, (v - 0.5) * height, 0);
      uvs.push(u, 1 - v);
    }
  }

  const stride = cellsX + 1;
  for (let y = 0; y < cellsY; y += 1) {
    for (let x = 0; x < cellsX; x += 1) {
      const a = y * stride + x;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  return {
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  };
}
