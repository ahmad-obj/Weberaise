import { WORK_SPHERE } from './constants';
import {
  cloneQuat,
  copyQuat,
  multiplyQuat,
  normalizeQuat,
  normalizeVec3,
  quatFromAxisAngle,
  quatIdentity,
  rotationToQuat,
  slerpQuat,
  transformVec3Quat,
  vec3f,
  type Quat,
  type Vec3f,
} from './math';
import type { Vec3 } from './types';

export type ArcballSnapshot = {
  orientation: Quat;
  angularVelocity: number;
  moving: boolean;
};

export function decayAngularVelocity(
  value: number,
  deltaMs: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 0;
  const next = value * Math.exp(-deltaMs / WORK_SPHERE.inertiaTimeConstantMs);
  return Math.abs(next) < 0.004 ? 0 : next;
}

export class ArcballController {
  readonly orientation = quatIdentity();

  private viewportWidth = 1;
  private viewportHeight = 1;
  private pointerDownState = false;
  private previousPoint = vec3f(0, 0, 1);
  private angularVelocity = 0;
  private inertiaAxis = vec3f(0, 1, 0);
  private snapTarget: Vec3f | null = null;
  private reducedMotion = false;

  constructor(
    reducedMotion = false,
    private readonly inertiaScale = 1,
  ) {
    this.reducedMotion = reducedMotion;
  }

  get isPointerDown() {
    return this.pointerDownState;
  }

  get velocity() {
    return this.angularVelocity;
  }

  setViewport(width: number, height: number) {
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);
  }

  setReducedMotion(value: boolean) {
    this.reducedMotion = value;
    if (value) this.angularVelocity = 0;
  }

  pointerDown(x: number, y: number) {
    this.pointerDownState = true;
    this.angularVelocity = 0;
    this.snapTarget = null;
    this.previousPoint = this.project(x, y);
  }

  pointerMove(x: number, y: number) {
    if (!this.pointerDownState) return;
    const currentPoint = this.project(x, y);
    const delta = rotationToQuat(quatIdentity(), this.previousPoint, currentPoint);
    multiplyQuat(this.orientation, delta, this.orientation);
    normalizeQuat(this.orientation, this.orientation);

    const clampedW = Math.max(-1, Math.min(1, delta[3]));
    const angle = 2 * Math.acos(clampedW);
    const sinHalf = Math.sqrt(Math.max(0, 1 - clampedW * clampedW));
    if (sinHalf > 1e-5 && angle > 1e-5) {
      this.inertiaAxis[0] = delta[0] / sinHalf;
      this.inertiaAxis[1] = delta[1] / sinHalf;
      this.inertiaAxis[2] = delta[2] / sinHalf;
      this.angularVelocity = Math.min(0.16, angle) * this.inertiaScale;
    }

    this.previousPoint = currentPoint;
  }

  pointerUp() {
    this.pointerDownState = false;
    if (this.reducedMotion) this.angularVelocity = 0;
  }

  setSnapTarget(direction: Vec3 | null) {
    this.snapTarget = direction ? vec3f(...direction) : null;
  }

  stop() {
    this.angularVelocity = 0;
    this.pointerDownState = false;
  }

  restoreOrientation(value: Quat) {
    copyQuat(this.orientation, value);
    normalizeQuat(this.orientation, this.orientation);
    this.stop();
  }

  update(deltaMs: number): ArcballSnapshot {
    if (!this.pointerDownState && this.angularVelocity > 0) {
      const rotation = quatFromAxisAngle(quatIdentity(), this.inertiaAxis, this.angularVelocity);
      multiplyQuat(this.orientation, rotation, this.orientation);
      normalizeQuat(this.orientation, this.orientation);
      this.angularVelocity = decayAngularVelocity(this.angularVelocity, deltaMs, this.reducedMotion);
    }

    if (
      !this.pointerDownState
      && this.snapTarget
      && this.angularVelocity <= WORK_SPHERE.snapVelocityThreshold
    ) {
      const current = transformVec3Quat(vec3f(), this.snapTarget, this.orientation);
      const correction = rotationToQuat(quatIdentity(), current, [0, 0, 1]);
      const factor = this.reducedMotion
        ? 1
        : 1 - Math.exp(-deltaMs / WORK_SPHERE.snapTimeConstantMs);
      const partial = slerpQuat(quatIdentity(), quatIdentity(), correction, factor);
      multiplyQuat(this.orientation, partial, this.orientation);
      normalizeQuat(this.orientation, this.orientation);
    }

    return {
      orientation: cloneQuat(this.orientation),
      angularVelocity: this.angularVelocity,
      moving: this.pointerDownState || this.angularVelocity > 0.004,
    };
  }

  private project(x: number, y: number): Vec3f {
    const size = Math.max(this.viewportWidth, this.viewportHeight);
    const nx = (2 * x - this.viewportWidth) / size;
    const ny = (this.viewportHeight - 2 * y) / size;
    const d = nx * nx + ny * ny;
    const z = d <= 0.5
      ? Math.sqrt(Math.max(0, 1 - d))
      : 0.5 / Math.sqrt(Math.max(d, 1e-6));
    return normalizeVec3(vec3f(), [nx, ny, z]);
  }
}
