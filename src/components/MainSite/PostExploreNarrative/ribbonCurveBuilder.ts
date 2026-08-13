import type { RibbonPoint } from './ribbonPrimitives';

export type RibbonMarkerId =
  | 'openingExit'
  | 'q1Approach'
  | 'q1WrapFront'
  | 'q1WrapBack'
  | 'q1WrapExit'
  | 'q2BendExit'
  | 'q3Approach'
  | 'q3FirstLoopComplete'
  | 'q3SecondLoopComplete'
  | 'reassuranceApproach'
  | 'reassuranceLoopComplete'
  | 'taperEnd';

export type RibbonCurveSegment = {
  id: string;
  start: RibbonPoint;
  control1: RibbonPoint;
  control2: RibbonPoint;
  end: RibbonPoint;
};

const EPSILON = 0.01;

function clone(point: RibbonPoint): RibbonPoint {
  return { x: point.x, y: point.y };
}

export function normalizeDirection(direction: RibbonPoint): RibbonPoint {
  const length = Math.hypot(direction.x, direction.y);
  if (length < EPSILON) throw new Error('Ribbon tangent direction must have non-zero length');
  return { x: direction.x / length, y: direction.y / length };
}

export function tangentHandle(point: RibbonPoint, direction: RibbonPoint, distance: number): RibbonPoint {
  const unit = normalizeDirection(direction);
  return { x: point.x + unit.x * distance, y: point.y + unit.y * distance };
}

export function ellipseCubics(
  center: RibbonPoint,
  radiusX: number,
  radiusY: number,
  startAngle: number,
  sweep: number,
): RibbonCurveSegment[] {
  const rx = Math.max(EPSILON, Math.abs(radiusX));
  const ry = Math.max(EPSILON, Math.abs(radiusY));
  const count = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI * 0.5)));
  const angleStep = sweep / count;
  const segments: RibbonCurveSegment[] = [];

  for (let index = 0; index < count; index += 1) {
    const angleA = startAngle + angleStep * index;
    const angleB = angleA + angleStep;
    const handleScale = (4 / 3) * Math.tan(angleStep / 4);
    const start = { x: center.x + Math.cos(angleA) * rx, y: center.y + Math.sin(angleA) * ry };
    const end = { x: center.x + Math.cos(angleB) * rx, y: center.y + Math.sin(angleB) * ry };
    const tangentA = { x: -Math.sin(angleA) * rx, y: Math.cos(angleA) * ry };
    const tangentB = { x: -Math.sin(angleB) * rx, y: Math.cos(angleB) * ry };
    segments.push({
      id: `ellipse-${index + 1}`,
      start,
      control1: { x: start.x + tangentA.x * handleScale, y: start.y + tangentA.y * handleScale },
      control2: { x: end.x - tangentB.x * handleScale, y: end.y - tangentB.y * handleScale },
      end,
    });
  }

  return segments;
}

export function curveSegmentsToPathD(segments: readonly RibbonCurveSegment[], fallback?: RibbonPoint) {
  const first = segments[0]?.start ?? fallback;
  if (!first) return '';
  return [
    `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`,
    ...segments.map(({ control1, control2, end }) => (
      `C ${control1.x.toFixed(2)} ${control1.y.toFixed(2)} ${control2.x.toFixed(2)} ${control2.y.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
    )),
  ].join(' ');
}

function cubicPoint(segment: RibbonCurveSegment, progress: number): RibbonPoint {
  const t = Math.min(1, Math.max(0, progress));
  const inverse = 1 - t;
  const a = inverse * inverse * inverse;
  const b = 3 * inverse * inverse * t;
  const c = 3 * inverse * t * t;
  const d = t * t * t;
  return {
    x: a * segment.start.x + b * segment.control1.x + c * segment.control2.x + d * segment.end.x,
    y: a * segment.start.y + b * segment.control1.y + c * segment.control2.y + d * segment.end.y,
  };
}

export function sampleCurveSegments(segments: readonly RibbonCurveSegment[], samplesPerSegment = 10): RibbonPoint[] {
  if (!segments.length) return [];
  const points = [clone(segments[0]!.start)];
  const count = Math.max(2, Math.round(samplesPerSegment));
  for (const segment of segments) {
    for (let index = 1; index <= count; index += 1) points.push(cubicPoint(segment, index / count));
  }
  return points;
}

export class RibbonCurveBuilder {
  readonly segments: RibbonCurveSegment[] = [];
  readonly markers = {} as Record<RibbonMarkerId, RibbonPoint>;
  private current: RibbonPoint;

  constructor(start: RibbonPoint) {
    this.current = clone(start);
  }

  get currentPoint(): RibbonPoint {
    return clone(this.current);
  }

  get exitDirection(): RibbonPoint | null {
    const last = this.segments.at(-1);
    return last ? normalizeDirection({ x: last.end.x - last.control2.x, y: last.end.y - last.control2.y }) : null;
  }

  cubic(id: string, control1: RibbonPoint, control2: RibbonPoint, end: RibbonPoint) {
    if (Math.hypot(control1.x - this.current.x, control1.y - this.current.y) < EPSILON) {
      throw new Error(`Ribbon segment ${id} has a zero-length entry handle`);
    }
    if (Math.hypot(end.x - control2.x, end.y - control2.y) < EPSILON) {
      throw new Error(`Ribbon segment ${id} has a zero-length exit handle`);
    }
    this.segments.push({
      id,
      start: clone(this.current),
      control1: clone(control1),
      control2: clone(control2),
      end: clone(end),
    });
    this.current = clone(end);
    return this;
  }

  ellipse(id: string, center: RibbonPoint, radiusX: number, radiusY: number, startAngle: number, sweep: number) {
    const segments = ellipseCubics(center, radiusX, radiusY, startAngle, sweep);
    for (const [index, segment] of segments.entries()) {
      if (Math.hypot(segment.start.x - this.current.x, segment.start.y - this.current.y) > 0.08) {
        throw new Error(`Ribbon ellipse ${id} does not begin at the current point`);
      }
      this.cubic(`${id}-${index + 1}`, segment.control1, segment.control2, segment.end);
    }
    return this;
  }

  mark(id: RibbonMarkerId) {
    this.markers[id] = clone(this.current);
    return this;
  }

  toPathD() {
    return curveSegmentsToPathD(this.segments, this.current);
  }
}
