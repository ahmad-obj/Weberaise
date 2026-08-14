import { quat, vec2, vec3 } from 'gl-matrix';
import { WORK_SPHERE } from './constants';
import type { Vec3 } from './types';

export type ArcballSnapshot = {
  orientation: quat;
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
  return Math.abs(next) < 0.0005 ? 0 : next;
}

export class ArcballController {
  readonly orientation = quat.create();

  private viewportWidth = 1;
  private viewportHeight = 1;
  private pointerDownState = false;
  private previousPoint = vec3.fromValues(0, 0, 1);
  private angularVelocity = 0;
  private inertiaAxis = vec3.fromValues(0, 1, 0);
  private snapTarget: vec3 | null = null;
  private reducedMotion = false;

  constructor(reducedMotion = false) {
    this.reducedMotion = reducedMotion;
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
    const delta = quat.rotationTo(quat.create(), this.previousPoint, currentPoint);
    quat.multiply(this.orientation, delta, this.orientation);
    quat.normalize(this.orientation, this.orientation);

    const clampedW = Math.max(-1, Math.min(1, delta[3]));
    const angle = 2 * Math.acos(clampedW);
    const sinHalf = Math.sqrt(Math.max(0, 1 - clampedW * clampedW));
    if (sinHalf > 1e-5 && angle > 1e-5) {
      vec3.set(this.inertiaAxis, delta[0] / sinHalf, delta[1] / sinHalf, delta[2] / sinHalf);
      this.angularVelocity = Math.min(0.16, angle);
    }

    this.previousPoint = currentPoint;
  }

  pointerUp() {
    this.pointerDownState = false;
    if (this.reducedMotion) this.angularVelocity = 0;
  }

  setSnapTarget(direction: Vec3 | null) {
    this.snapTarget = direction ? vec3.fromValues(...direction) : null;
  }

  stop() {
    this.angularVelocity = 0;
    this.pointerDownState = false;
  }

  restoreOrientation(value: quat) {
    quat.copy(this.orientation, value);
    quat.normalize(this.orientation, this.orientation);
    this.stop();
  }

  update(deltaMs: number): ArcballSnapshot {
    if (!this.pointerDownState && this.angularVelocity > 0) {
      const rotation = quat.setAxisAngle(quat.create(), this.inertiaAxis, this.angularVelocity);
      quat.multiply(this.orientation, rotation, this.orientation);
      quat.normalize(this.orientation, this.orientation);
      this.angularVelocity = decayAngularVelocity(this.angularVelocity, deltaMs, this.reducedMotion);
    }

    if (
      !this.pointerDownState
      && this.snapTarget
      && this.angularVelocity <= WORK_SPHERE.snapVelocityThreshold
    ) {
      const current = vec3.transformQuat(vec3.create(), this.snapTarget, this.orientation);
      const target = vec3.fromValues(0, 0, 1);
      const correction = quat.rotationTo(quat.create(), current, target);
      const factor = this.reducedMotion ? 1 : 1 - Math.exp(-deltaMs / WORK_SPHERE.snapTimeConstantMs);
      const partial = quat.slerp(quat.create(), quat.create(), correction, factor);
      quat.multiply(this.orientation, partial, this.orientation);
      quat.normalize(this.orientation, this.orientation);
    }

    return {
      orientation: quat.clone(this.orientation),
      angularVelocity: this.angularVelocity,
      moving: this.pointerDownState || this.angularVelocity > 0.004,
    };
  }

  private project(x: number, y: number): vec3 {
    const size = Math.max(this.viewportWidth, this.viewportHeight);
    const nx = (2 * x - this.viewportWidth) / size;
    const ny = (this.viewportHeight - 2 * y) / size;
    const radius = 1;
    const d = nx * nx + ny * ny;
    const z = d <= radius * radius * 0.5
      ? Math.sqrt(Math.max(0, radius * radius - d))
      : (radius * radius * 0.5) / Math.sqrt(Math.max(d, 1e-6));
    return vec3.normalize(vec3.create(), vec3.fromValues(nx, ny, z));
  }
}
