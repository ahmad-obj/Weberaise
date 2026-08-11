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
  const minSpeed = options.minSpeed ?? 0.14;
  if (speed < minSpeed) return [];

  const duration = Math.min(0.34, Math.max(0.22, options.duration ?? 0.30));
  const steps = Math.min(4, Math.max(2, Math.round(options.steps ?? 3)));
  const strength = options.strength ?? 1;
  const nx = options.vx / speed;
  const ny = options.vy / speed;
  const px = -ny;
  const py = nx;

  // The main liquid mass never translates after the pointer stops. Only a few
  // small satellite patches carry forward from the most recent motion vector.
  const carry = Math.min(0.05, 0.019 + speed * 0.018);
  const seed = Math.sin((options.x * 91.7 + options.y * 57.3) * Math.PI);
  const emissions: InertialEmission[] = [];

  for (let index = 0; index < steps; index += 1) {
    const t = (index + 1) / steps;
    const eased = 1 - Math.pow(1 - t, 2.1);
    const forward = carry * (0.34 + eased * 0.66);
    const lateral = Math.sin(t * Math.PI * 2.7 + seed * 2.1) * carry * (0.15 - t * 0.045);
    const x = clamp01(options.x + nx * forward + px * lateral);
    const y = clamp01(options.y + ny * forward + py * lateral);

    // Keep each satellite visibly above the implicit-surface threshold while
    // remaining much smaller than the cursor's primary reveal radius.
    const radiusScale = 0.38 - t * 0.12;
    const strengthScale = 0.74 - t * 0.20;

    emissions.push({
      delayMs: Math.round(duration * 1000 * (index / Math.max(1, steps - 1))),
      sample: {
        x,
        y,
        radius: options.radius * radiusScale,
        strength: strength * strengthScale,
        vx: options.vx * (1 - t) * 0.16,
        vy: options.vy * (1 - t) * 0.16,
        time: t * duration,
      },
    });
  }

  return emissions;
}
