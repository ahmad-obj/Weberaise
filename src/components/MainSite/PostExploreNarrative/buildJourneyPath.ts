import type { JourneyRouteConfig, JourneyStopId } from './journeyRoute';

export type BuiltJourneyStop = {
  localY: number;
  revealLocalY: number;
  bandBias: number;
};

export type BuiltJourneyPath = {
  d: string;
  width: number;
  height: number;
  openingLocalY: number;
  stops: Record<JourneyStopId, BuiltJourneyStop>;
};

type Point = { x: number; y: number };

type MeasuredStop = {
  id: JourneyStopId;
  left: number;
  right: number;
  centerY: number;
  top: number;
  bottom: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cubicPath(points: readonly Point[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;

  const commands = [`M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`];

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!;
    const current = points[index]!;
    const deltaY = Math.max(0, current.y - previous.y);
    const control = Math.max(18, deltaY * 0.42);
    const c1y = Math.min(current.y, previous.y + control);
    const c2y = Math.max(previous.y, current.y - control);

    commands.push(
      `C ${previous.x.toFixed(2)} ${c1y.toFixed(2)} ${current.x.toFixed(2)} ${c2y.toFixed(2)} ${current.x.toFixed(2)} ${current.y.toFixed(2)}`,
    );
  }

  return commands.join(' ');
}

function measureStops(root: HTMLElement, config: JourneyRouteConfig): MeasuredStop[] {
  const rootRect = root.getBoundingClientRect();

  return config.visits.map(({ id }) => {
    const element = root.querySelector<HTMLElement>(`[data-journey-stop="${id}"]`);
    if (!element) {
      throw new Error(`Missing journey stop: ${id}`);
    }

    const rect = element.getBoundingClientRect();
    const top = rect.top - rootRect.top;
    const bottom = rect.bottom - rootRect.top;

    return {
      id,
      left: rect.left - rootRect.left,
      right: rect.right - rootRect.left,
      top,
      bottom,
      centerY: top + rect.height * 0.5,
    };
  });
}

export function buildJourneyPath(root: HTMLElement, config: JourneyRouteConfig): BuiltJourneyPath {
  const rootRect = root.getBoundingClientRect();
  const width = Math.max(1, rootRect.width);
  const height = Math.max(1, root.scrollHeight || rootRect.height);
  const measured = measureStops(root, config);
  const points: Point[] = [];
  const stops = {} as Record<JourneyStopId, BuiltJourneyStop>;

  const openingLocalY = Math.min(110, Math.max(64, height * 0.025));
  points.push({ x: 0, y: 12 });
  points.push({ x: Math.min(width * 0.14, 180), y: openingLocalY });

  let lastY = openingLocalY;

  for (const visit of config.visits) {
    const stop = measured.find((entry) => entry.id === visit.id);
    if (!stop) continue;

    const passX = visit.side === 'left'
      ? clamp(stop.left - visit.clearance, config.edgeInset, width - config.edgeInset)
      : clamp(stop.right + visit.clearance, config.edgeInset, width - config.edgeInset);

    const oppositeX = visit.side === 'left'
      ? clamp(width * 0.72, config.edgeInset, width - config.edgeInset)
      : clamp(width * 0.28, config.edgeInset, width - config.edgeInset);

    const approachY = Math.max(lastY + 90, stop.centerY - visit.approachLead);
    const passY = Math.max(approachY + 54, stop.centerY);
    const departY = Math.max(
      passY + 58,
      Math.min(stop.bottom + visit.approachLead * 0.44, height - 70),
    );

    points.push({ x: oppositeX, y: approachY });
    points.push({ x: passX, y: passY });
    points.push({ x: passX, y: departY });

    stops[visit.id] = {
      localY: passY,
      revealLocalY: Math.max(0, passY - Math.max(86, visit.approachLead * 0.58)),
      bandBias: visit.bandBias,
    };

    lastY = departY;
  }

  return {
    d: cubicPath(points),
    width,
    height,
    openingLocalY,
    stops,
  };
}
