import type { RevealSample } from './types';

export type AutonomousStrokeOptions = {
  start: { x: number; y: number };
  control: { x: number; y: number };
  end: { x: number; y: number };
  radius: number;
  duration: number;
  count: number;
  startTime?: number;
  strength?: number;
};

function quadratic(a: number, b: number, c: number, t: number) {
  const inverse = 1 - t;
  return inverse * inverse * a + 2 * inverse * t * b + t * t * c;
}

export function createAutonomousStroke(options: AutonomousStrokeOptions): RevealSample[] {
  const count = Math.max(2, Math.floor(options.count));
  const duration = Math.max(0.05, options.duration);
  const startTime = options.startTime ?? 0;
  const output: RevealSample[] = [];
  let previous = options.start;

  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1);
    const point = {
      x: quadratic(options.start.x, options.control.x, options.end.x, t),
      y: quadratic(options.start.y, options.control.y, options.end.y, t),
    };
    const dt = duration / Math.max(1, count - 1);
    output.push({
      x: point.x,
      y: point.y,
      radius: options.radius,
      strength: options.strength ?? 0.95,
      vx: index === 0 ? 0 : (point.x - previous.x) / dt,
      vy: index === 0 ? 0 : (point.y - previous.y) / dt,
      time: startTime + duration * t,
    });
    previous = point;
  }

  return output;
}

export function createHeroAutonomousStroke(): RevealSample[] {
  return createAutonomousStroke({
    start: { x: 0.495, y: 0.82 },
    control: { x: 0.515, y: 0.79 },
    end: { x: 0.535, y: 0.815 },
    radius: 0.085,
    duration: 0.64,
    count: 20,
    startTime: 0,
    strength: 0.96,
  });
}
