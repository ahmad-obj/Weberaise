export type Vec3f = Float32Array;
export type Quat = Float32Array;
export type Mat4 = Float32Array;

const EPSILON = 1e-6;

export function vec3f(x = 0, y = 0, z = 0): Vec3f {
  return new Float32Array([x, y, z]);
}

export function cloneVec3(value: ArrayLike<number>): Vec3f {
  return vec3f(value[0], value[1], value[2]);
}

export function normalizeVec3(out: Vec3f, value: ArrayLike<number>): Vec3f {
  const length = Math.hypot(value[0], value[1], value[2]);
  if (length > EPSILON) {
    out[0] = value[0] / length;
    out[1] = value[1] / length;
    out[2] = value[2] / length;
  } else {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  return out;
}

export function scaleVec3(out: Vec3f, value: ArrayLike<number>, scalar: number): Vec3f {
  out[0] = value[0] * scalar;
  out[1] = value[1] * scalar;
  out[2] = value[2] * scalar;
  return out;
}

export function dotVec3(a: ArrayLike<number>, b: ArrayLike<number>): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function crossVec3(out: Vec3f, a: ArrayLike<number>, b: ArrayLike<number>): Vec3f {
  const ax = a[0]; const ay = a[1]; const az = a[2];
  const bx = b[0]; const by = b[1]; const bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}

export function quatIdentity(): Quat {
  return new Float32Array([0, 0, 0, 1]);
}

export function cloneQuat(value: ArrayLike<number>): Quat {
  return new Float32Array([value[0], value[1], value[2], value[3]]);
}

export function copyQuat(out: Quat, value: ArrayLike<number>): Quat {
  out[0] = value[0]; out[1] = value[1]; out[2] = value[2]; out[3] = value[3];
  return out;
}

export function normalizeQuat(out: Quat, value: ArrayLike<number>): Quat {
  const length = Math.hypot(value[0], value[1], value[2], value[3]);
  if (length > EPSILON) {
    out[0] = value[0] / length;
    out[1] = value[1] / length;
    out[2] = value[2] / length;
    out[3] = value[3] / length;
  } else {
    out.set([0, 0, 0, 1]);
  }
  return out;
}

export function multiplyQuat(out: Quat, a: ArrayLike<number>, b: ArrayLike<number>): Quat {
  const ax = a[0]; const ay = a[1]; const az = a[2]; const aw = a[3];
  const bx = b[0]; const by = b[1]; const bz = b[2]; const bw = b[3];
  out[0] = ax * bw + aw * bx + ay * bz - az * by;
  out[1] = ay * bw + aw * by + az * bx - ax * bz;
  out[2] = az * bw + aw * bz + ax * by - ay * bx;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}

export function quatFromAxisAngle(out: Quat, axis: ArrayLike<number>, angle: number): Quat {
  const half = angle * 0.5;
  const sine = Math.sin(half);
  const normalized = normalizeVec3(vec3f(), axis);
  out[0] = normalized[0] * sine;
  out[1] = normalized[1] * sine;
  out[2] = normalized[2] * sine;
  out[3] = Math.cos(half);
  return out;
}

export function rotationToQuat(out: Quat, from: ArrayLike<number>, to: ArrayLike<number>): Quat {
  const a = normalizeVec3(vec3f(), from);
  const b = normalizeVec3(vec3f(), to);
  const dot = dotVec3(a, b);

  if (dot < -0.999999) {
    const axis = Math.abs(a[0]) < 0.9
      ? crossVec3(vec3f(), a, [1, 0, 0])
      : crossVec3(vec3f(), a, [0, 1, 0]);
    normalizeVec3(axis, axis);
    return quatFromAxisAngle(out, axis, Math.PI);
  }

  if (dot > 0.999999) {
    out.set([0, 0, 0, 1]);
    return out;
  }

  const axis = crossVec3(vec3f(), a, b);
  out[0] = axis[0];
  out[1] = axis[1];
  out[2] = axis[2];
  out[3] = 1 + dot;
  return normalizeQuat(out, out);
}

export function slerpQuat(out: Quat, a: ArrayLike<number>, b: ArrayLike<number>, t: number): Quat {
  let bx = b[0]; let by = b[1]; let bz = b[2]; let bw = b[3];
  let cosine = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;
  if (cosine < 0) {
    cosine = -cosine;
    bx = -bx; by = -by; bz = -bz; bw = -bw;
  }

  let scaleA: number;
  let scaleB: number;
  if (1 - cosine > 1e-6) {
    const omega = Math.acos(Math.max(-1, Math.min(1, cosine)));
    const sine = Math.sin(omega);
    scaleA = Math.sin((1 - t) * omega) / sine;
    scaleB = Math.sin(t * omega) / sine;
  } else {
    scaleA = 1 - t;
    scaleB = t;
  }

  out[0] = scaleA * a[0] + scaleB * bx;
  out[1] = scaleA * a[1] + scaleB * by;
  out[2] = scaleA * a[2] + scaleB * bz;
  out[3] = scaleA * a[3] + scaleB * bw;
  return normalizeQuat(out, out);
}

export function transformVec3Quat(out: Vec3f, value: ArrayLike<number>, q: ArrayLike<number>): Vec3f {
  const x = value[0]; const y = value[1]; const z = value[2];
  const qx = q[0]; const qy = q[1]; const qz = q[2]; const qw = q[3];
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;
  out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  return out;
}

export function mat4Identity(): Mat4 {
  const out = new Float32Array(16);
  out[0] = out[5] = out[10] = out[15] = 1;
  return out;
}

export function multiplyMat4(out: Mat4, a: ArrayLike<number>, b: ArrayLike<number>): Mat4 {
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
  out.set(result);
  return out;
}

export function perspectiveMat4(
  out: Mat4,
  fovy: number,
  aspect: number,
  near: number,
  far: number,
): Mat4 {
  out.fill(0);
  const f = 1 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[5] = f;
  out[11] = -1;
  out[15] = 0;
  const nf = 1 / (near - far);
  out[10] = (far + near) * nf;
  out[14] = 2 * far * near * nf;
  return out;
}

export function lookAtMat4(
  out: Mat4,
  eye: ArrayLike<number>,
  center: ArrayLike<number>,
  up: ArrayLike<number>,
): Mat4 {
  const z = normalizeVec3(vec3f(), [eye[0] - center[0], eye[1] - center[1], eye[2] - center[2]]);
  const x = normalizeVec3(vec3f(), crossVec3(vec3f(), up, z));
  const y = crossVec3(vec3f(), z, x);

  out[0] = x[0]; out[1] = y[0]; out[2] = z[0]; out[3] = 0;
  out[4] = x[1]; out[5] = y[1]; out[6] = z[1]; out[7] = 0;
  out[8] = x[2]; out[9] = y[2]; out[10] = z[2]; out[11] = 0;
  out[12] = -dotVec3(x, eye);
  out[13] = -dotVec3(y, eye);
  out[14] = -dotVec3(z, eye);
  out[15] = 1;
  return out;
}

export function targetToMat4(
  out: Mat4,
  eye: ArrayLike<number>,
  target: ArrayLike<number>,
  up: ArrayLike<number>,
): Mat4 {
  const z = normalizeVec3(vec3f(), [eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
  let x = crossVec3(vec3f(), up, z);
  if (Math.hypot(x[0], x[1], x[2]) < EPSILON) {
    x = crossVec3(x, Math.abs(z[1]) < 0.99 ? [0, 1, 0] : [1, 0, 0], z);
  }
  normalizeVec3(x, x);
  const y = crossVec3(vec3f(), z, x);

  out[0] = x[0]; out[1] = x[1]; out[2] = x[2]; out[3] = 0;
  out[4] = y[0]; out[5] = y[1]; out[6] = y[2]; out[7] = 0;
  out[8] = z[0]; out[9] = z[1]; out[10] = z[2]; out[11] = 0;
  out[12] = eye[0]; out[13] = eye[1]; out[14] = eye[2]; out[15] = 1;
  return out;
}

export function scaleMat4(out: Mat4, matrix: ArrayLike<number>, scale: ArrayLike<number>): Mat4 {
  const sx = scale[0]; const sy = scale[1]; const sz = scale[2];
  if (out !== matrix) out.set(matrix as ArrayLike<number>);
  out[0] *= sx; out[1] *= sx; out[2] *= sx; out[3] *= sx;
  out[4] *= sy; out[5] *= sy; out[6] *= sy; out[7] *= sy;
  out[8] *= sz; out[9] *= sz; out[10] *= sz; out[11] *= sz;
  return out;
}

export function transformVec4Mat4(
  value: readonly [number, number, number, number],
  matrix: ArrayLike<number>,
): [number, number, number, number] {
  const [x, y, z, w] = value;
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12] * w,
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13] * w,
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14] * w,
    matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15] * w,
  ];
}
