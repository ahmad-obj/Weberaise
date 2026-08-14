import type { SphereSlot, Vec3 } from './types';

const PHI = (1 + Math.sqrt(5)) / 2;

function normalize([x, y, z]: Vec3): Vec3 {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

const ICOSAHEDRON_BASE: readonly Vec3[] = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
].map(normalize);

export function createIcosahedronDirections(): readonly Vec3[] {
  const front = ICOSAHEDRON_BASE.map(direction => [...direction] as Vec3);
  const back = ICOSAHEDRON_BASE.map(([x, y, z]) => [-x, -y, -z] as Vec3);
  return [...front, ...back];
}

export function buildProjectSlots(projectCount: number): readonly SphereSlot[] {
  if (projectCount <= 0) return [];

  const directions = createIcosahedronDirections();
  return directions.map((direction, id) => {
    const pairedIndex = id % ICOSAHEDRON_BASE.length;
    const projectIndex = projectCount <= ICOSAHEDRON_BASE.length
      ? pairedIndex % projectCount
      : id % projectCount;
    return { id, direction, projectIndex };
  });
}

export function createProjectQuad() {
  return {
    positions: new Float32Array([
      -0.5, -0.5, 0,
      0.5, -0.5, 0,
      0.5, 0.5, 0,
      -0.5, 0.5, 0,
    ]),
    uvs: new Float32Array([
      0, 1,
      1, 1,
      1, 0,
      0, 0,
    ]),
    indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
  };
}
