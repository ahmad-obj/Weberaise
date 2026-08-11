import type { RevealSample } from './emitters/types';

export type InertialAfterglideOptions = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  strength?: number;
  duration?: number;
  steps?: number;
  minSpeed?: number;
};

export type InertialEmission = {
  delayMs: number;
  sample: RevealSample;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function createInertialAfterglide(options: InertialAfterglideOptions): InertialEmission[] {
  const speed = Math.hypot(options.vx, options.vy);
  const minSpeed = options.minSpeed ?? 0.16;
  if (speed < minSpeed) return [];

  const duration = Math.min(0.38, Math.max(0.24, options.duration ?? 0.34));
  const steps = Math.min(7, Math.max(4, Math.round(options.steps ?? 5)));
  const strength = options.strength ?? 1;
  const nx = options.vx / speed;
  const ny = options.vy / speed;
  const px = -ny;
  const py = nx;

  // Inertia is deliberately a small forward lobe, not a second cursor blob.
  // Fast input gets a little more carry, but never more than ~3.8% of viewport space.
  const carry = Math.min(0.038, 0.013 + speed * 0.013);
  const seed = Math.sin((options.x * 91.7 + options.y * 57.3) * Math.PI);
  const emissions: InertialEmission[] = [];

  for (let index = 0; index < steps; index += 1) {
    const t = (index + 1) / steps;
    const eased = 1 - Math.pow(1 - t, 2.4);
    const decay = Math.pow(1 - t, 1.5);

    // Small deterministic lateral wobble keeps the advancing edge irregular
    // without creating random smoke, spray or a symmetric growing sphere.
    const lateral = Math.sin(t * Math.PI * 2.15 + seed * 1.9) * carry * 0.14 * decay;
    const forward = carry * eased;
    const x = clamp01(options.x + nx * forward + px * lateral);
    const y = clamp01(options.y + ny * forward + py * lateral);
    const radiusScale = 0.66 - t * 0.36;
    const strengthScale = 0.56 - t * 0.40;

    emissions.push({
      delayMs: Math.round(duration * 1000 * (index / Math.max(1, steps - 1))),
      sample: {
        x,
        y,
        radius: options.radius * Math.max(0.26, radiusScale),
        strength: strength * Math.max(0.12, strengthScale),
        vx: options.vx * decay * 0.24,
        vy: options.vy * decay * 0.24,
        time: t * duration,
      },
    });
  }

  return emissions;
}
