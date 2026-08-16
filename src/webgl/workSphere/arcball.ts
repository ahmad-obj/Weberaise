import {
  crossVec3,
  dotVec3,
  multiplyQuat,
  normalizeQuat,
  normalizeVec3,
  quatFromAxisAngle,
  quatIdentity,
  slerpQuat,
  vec3f,
  type Quat,
  type Vec3f,
} from './math';
import type { Vec3 } from './types';

const EPSILON = 0.1;
const TWO_PI = Math.PI * 2;
const IDENTITY = quatIdentity();

export type ArcballSnapshot = {
  orientation: Quat;
  rotationAxis: Vec3f;
  rotationVelocity: number;
  moving: boolean;
};

function copyQuat(out: Quat, value: ArrayLike<number>) {
  out[0] = value[0];
  out[1] = value[1];
  out[2] = value[2];
  out[3] = value[3];
  return out;
}

function copyVec3(out: Vec3f, value: ArrayLike<number>) {
  out[0] = value[0];
  out[1] = value[1];
  out[2] = value[2];
  return out;
}

export class ArcballController {
  readonly orientation = quatIdentity();
  readonly rotationAxis = vec3f(1, 0, 0);
  readonly snapDirection = vec3f(0, 0, -1);

  private viewportWidth = 1;
  private viewportHeight = 1;
  private pointerDownState = false;
  private pointerX = 0;
  private pointerY = 0;
  private previousPointerX = 0;
  private previousPointerY = 0;
  private pointerRotation = quatIdentity();
  private combinedRotation = quatIdentity();
  private smoothedRotationVelocity = 0;
  private snapTargetDirection: Vec3f | null = null;

  rotationVelocity = 0;

  constructor(private reducedMotion = false) {}

  get isPointerDown() {
    return this.pointerDownState;
  }

  setViewport(width: number, height: number) {
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);
  }

  setReducedMotion(value: boolean) {
    this.reducedMotion = value;
    if (value && !this.pointerDownState) {
      copyQuat(this.pointerRotation, IDENTITY);
      this.smoothedRotationVelocity = 0;
      this.rotationVelocity = 0;
    }
  }

  pointerDown(x: number, y: number) {
    this.pointerX = x;
    this.pointerY = y;
    this.previousPointerX = x;
    this.previousPointerY = y;
    this.pointerDownState = true;
  }

  pointerMove(x: number, y: number) {
    if (!this.pointerDownState) return;
    this.pointerX = x;
    this.pointerY = y;
  }

  pointerUp() {
    this.pointerDownState = false;
    if (this.reducedMotion) {
      copyQuat(this.pointerRotation, IDENTITY);
      this.smoothedRotationVelocity = 0;
      this.rotationVelocity = 0;
    }
  }

  setSnapTarget(direction: Vec3 | ArrayLike<number> | null) {
    if (!direction) {
      this.snapTargetDirection = null;
      return;
    }
    const target = this.snapTargetDirection ?? vec3f();
    copyVec3(target, direction);
    normalizeVec3(target, target);
    this.snapTargetDirection = target;
  }

  stop() {
    this.pointerDownState = false;
    copyQuat(this.pointerRotation, IDENTITY);
    copyQuat(this.combinedRotation, IDENTITY);
    this.smoothedRotationVelocity = 0;
    this.rotationVelocity = 0;
  }

  update(deltaMs: number, targetFrameDuration = 1000 / 60): ArcballSnapshot {
    const timeScale = deltaMs / targetFrameDuration + 0.00001;
    let angleFactor = timeScale;
    const snapRotation = quatIdentity();

    if (this.pointerDownState) {
      const intensity = 0.3 * timeScale;
      const angleAmplification = 5 / timeScale;
      const deltaX = (this.pointerX - this.previousPointerX) * intensity;
      const deltaY = (this.pointerY - this.previousPointerY) * intensity;

      if (deltaX * deltaX + deltaY * deltaY > EPSILON) {
        const nextX = this.previousPointerX + deltaX;
        const nextY = this.previousPointerY + deltaY;
        const a = normalizeVec3(vec3f(), this.project(nextX, nextY));
        const b = normalizeVec3(vec3f(), this.project(this.previousPointerX, this.previousPointerY));
        this.previousPointerX = nextX;
        this.previousPointerY = nextY;
        angleFactor *= angleAmplification;
        this.quatFromVectors(a, b, this.pointerRotation, angleFactor);
      } else {
        slerpQuat(this.pointerRotation, this.pointerRotation, IDENTITY, intensity);
      }
    } else if (this.reducedMotion) {
      copyQuat(this.pointerRotation, IDENTITY);
      if (this.snapTargetDirection) {
        this.quatFromVectors(this.snapTargetDirection, this.snapDirection, snapRotation, 1);
      }
    } else {
      const intensity = 0.1 * timeScale;
      slerpQuat(this.pointerRotation, this.pointerRotation, IDENTITY, intensity);

      if (this.snapTargetDirection) {
        const dx = this.snapTargetDirection[0] - this.snapDirection[0];
        const dy = this.snapTargetDirection[1] - this.snapDirection[1];
        const dz = this.snapTargetDirection[2] - this.snapDirection[2];
        const squaredDistance = dx * dx + dy * dy + dz * dz;
        const distanceFactor = Math.max(0.1, 1 - squaredDistance * 10);
        angleFactor *= 0.2 * distanceFactor;
        this.quatFromVectors(
          this.snapTargetDirection,
          this.snapDirection,
          snapRotation,
          angleFactor,
        );
      }
    }

    const combined = quatIdentity();
    multiplyQuat(combined, snapRotation, this.pointerRotation);
    multiplyQuat(this.orientation, combined, this.orientation);
    normalizeQuat(this.orientation, this.orientation);

    const rotationAverageIntensity = this.reducedMotion ? 1 : 0.8 * timeScale;
    slerpQuat(
      this.combinedRotation,
      this.combinedRotation,
      combined,
      rotationAverageIntensity,
    );
    normalizeQuat(this.combinedRotation, this.combinedRotation);

    const w = Math.max(-1, Math.min(1, this.combinedRotation[3]));
    const radians = Math.acos(w) * 2;
    const sine = Math.sin(radians / 2);
    let instantaneousVelocity = 0;
    if (sine > 0.000001) {
      instantaneousVelocity = radians / TWO_PI;
      this.rotationAxis[0] = this.combinedRotation[0] / sine;
      this.rotationAxis[1] = this.combinedRotation[1] / sine;
      this.rotationAxis[2] = this.combinedRotation[2] / sine;
      normalizeVec3(this.rotationAxis, this.rotationAxis);
    }

    if (this.reducedMotion) {
      this.smoothedRotationVelocity = 0;
      this.rotationVelocity = 0;
    } else {
      const velocityIntensity = 0.5 * timeScale;
      this.smoothedRotationVelocity +=
        (instantaneousVelocity - this.smoothedRotationVelocity) * velocityIntensity;
      this.rotationVelocity = this.smoothedRotationVelocity / timeScale;
    }

    return {
      orientation: this.orientation,
      rotationAxis: this.rotationAxis,
      rotationVelocity: this.rotationVelocity,
      moving: this.pointerDownState || Math.abs(this.rotationVelocity) > 0.01,
    };
  }

  private quatFromVectors(
    a: ArrayLike<number>,
    b: ArrayLike<number>,
    out: Quat,
    angleFactor = 1,
  ) {
    const axis = crossVec3(vec3f(), a, b);
    const axisLength = Math.hypot(axis[0], axis[1], axis[2]);
    const dot = Math.max(-1, Math.min(1, dotVec3(a, b)));
    const angle = Math.acos(dot) * angleFactor;

    if (axisLength < 1e-7 || Math.abs(angle) < 1e-7) {
      copyQuat(out, IDENTITY);
      return;
    }

    normalizeVec3(axis, axis);
    quatFromAxisAngle(out, axis, angle);
    normalizeQuat(out, out);
  }

  private project(x: number, y: number): Vec3f {
    const radius = 2;
    const width = this.viewportWidth;
    const height = this.viewportHeight;
    const size = Math.max(width, height) - 1;
    const px = (2 * x - width - 1) / Math.max(1, size);
    const py = (2 * y - height - 1) / Math.max(1, size);
    const xySquared = px * px + py * py;
    const radiusSquared = radius * radius;
    const z = xySquared <= radiusSquared / 2
      ? Math.sqrt(radiusSquared - xySquared)
      : radiusSquared / Math.sqrt(Math.max(xySquared, 1e-8));
    return vec3f(-px, py, z);
  }
}
