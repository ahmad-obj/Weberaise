import { createPointerSamples, type PointerEmitterOptions } from './emitters/pointerEmitter';
import type { RevealSample, TimedPoint } from './emitters/types';

export type PointerTracker = {
  push(point: TimedPoint): RevealSample[];
  reset(): void;
};

export function createPointerTracker(options: PointerEmitterOptions): PointerTracker {
  let previous: TimedPoint | null = null;

  return {
    push(point) {
      if (!previous) {
        previous = point;
        return [{
          x: point.x,
          y: point.y,
          radius: options.radius,
          strength: options.strength ?? 1,
          vx: 0,
          vy: 0,
          time: point.time,
        }];
      }

      const samples = createPointerSamples(previous, point, options);
      previous = point;
      return samples;
    },
    reset() {
      previous = null;
    },
  };
}
