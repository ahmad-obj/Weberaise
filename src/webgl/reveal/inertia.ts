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
  const minSpeed = options.minSpeed ?? 0.12;
  if (speed < minSpeed) return [];

  const duration = Math.min(0.45, Math.max(0.24, options.duration ?? 0.38));
  const steps = Math.min(8, Math.max(4, Math.round(options.steps ?? 6)));
  const strength = options.strength ?? 1;
  const nx = options.vx / speed;
  const ny = options.vy / speed;
  const px = -ny;
  const py = nx;
  const carry = Math.min(0.055, 0.016 + speed * 0.018);
  const seed = Math.sin((options.x * 91.7 + options.y * 57.3) * Math.PI);
  const emissions: InertialEmission[] = [];

  for (let index = 0; index < steps; index += 1) {
    const t = (index + 1) / steps;
    const eased = 1 - Math.pow(1 - t, 2.25);
    const decay = Math.pow(1 - t, 1.35);
    const lateral = Math.sin(t * Math.PI * 2.35 + seed * 1.7) * carry * 0.12 * decay;
    const forward = carry * eased;
    const x = clamp01(options.x + nx * forward + px * lateral);
    const y = clamp01(options.y + ny * forward + py * lateral);
    const radiusScale = 0.72 - t * 0.42;
    const strengthScale = 0.66 - t * 0.48;

    emissions.push({
      delayMs: Math.round(duration * 1000 * (index / Math.max(1, steps - 1))),
      sample: {
        x,
        y,
        radius: options.radius * Math.max(0.24, radiusScale),
        strength: strength * Math.max(0.12, strengthScale),
        vx: options.vx * decay * 0.32,
        vy: options.vy * decay * 0.32,
        time: t * duration,
      },
    });
  }

  return emissions;
}
