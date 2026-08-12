export type RibbonPoint = { x: number; y: number };
export type RibbonRect = { left: number; top: number; right: number; bottom: number; width: number; height: number };
export type RibbonWrapMarkers = { frontEntryY: number; backY: number; frontExitY: number };

function push(points: RibbonPoint[], x: number, y: number) {
  const previous = points.at(-1);
  if (!previous || Math.abs(previous.x - x) >= 0.01 || Math.abs(previous.y - y) >= 0.01) points.push({ x, y });
}

function ellipsePoint(center: RibbonPoint, rx: number, ry: number, angle: number, skew = 0): RibbonPoint {
  return {
    x: center.x + Math.cos(angle) * rx + Math.sin(angle) * rx * skew * 0.04,
    y: center.y + Math.sin(angle) * ry,
  };
}

export function appendFlow(points: RibbonPoint[], target: RibbonPoint, bendX = 0) {
  const from = points.at(-1);
  if (!from) return void points.push(target);
  const dy = target.y - from.y;
  const bend = Math.max(-96, Math.min(96, bendX));
  push(points, from.x + bend * 0.58, from.y + dy * 0.34);
  push(points, target.x - bend * 0.42, from.y + dy * 0.72);
  push(points, target.x, target.y);
}

function appendCleanOvalLoop(points: RibbonPoint[], center: RibbonPoint, rx: number, ry: number, skew = 0) {
  const topY = center.y - ry;
  const preEntryX = center.x - rx * 0.52;

  appendFlow(points, { x: preEntryX, y: topY }, Math.min(18, rx * 0.08));
  push(points, center.x, topY);

  const steps = 16;
  for (let index = 1; index <= steps; index += 1) {
    const angle = -Math.PI * 0.5 + (Math.PI * 2 * index) / steps;
    const point = ellipsePoint(center, rx, ry, angle, skew);
    push(points, point.x, point.y);
  }

  push(points, center.x + rx * 0.52, topY);
  push(points, center.x + rx * 0.92, topY + ry * 0.16);
}

export function appendLooseOvalLoop(points: RibbonPoint[], center: RibbonPoint, radiusX: number, radiusY: number, skew = 0.14) {
  appendCleanOvalLoop(points, center, Math.max(20, radiusX), Math.max(14, radiusY), Math.min(0.12, skew));
}

export function appendArtworkWrap(points: RibbonPoint[], rect: RibbonRect, side: 'left' | 'right', clearance: number): RibbonWrapMarkers {
  const sign = side === 'right' ? 1 : -1;
  const center = {
    x: rect.left + rect.width * 0.5 - sign * clearance * 0.18,
    y: rect.top + rect.height * 0.5,
  };
  const rx = rect.width * 0.5 + clearance * 0.12;
  const ry = rect.height * 0.5 + clearance * 0.24;

  appendCleanOvalLoop(points, center, rx, ry, sign * 0.035);

  return {
    frontEntryY: rect.top + rect.height * 0.05,
    backY: rect.top + rect.height * 0.66,
    frontExitY: rect.bottom + Math.max(48, clearance * 0.55),
  };
}

export function appendGentleBend(points: RibbonPoint[], fromSide: 'left' | 'right', center: RibbonPoint, width: number) {
  const sign = fromSide === 'right' ? 1 : -1;
  const half = Math.max(76, width * 0.5);
  appendFlow(points, { x: center.x + sign * half, y: center.y - 132 }, -sign * half * 0.08);
  push(points, center.x + sign * half * 0.74, center.y - 68);
  push(points, center.x + sign * half * 0.26, center.y - 4);
  push(points, center.x - sign * half * 0.22, center.y + 68);
  push(points, center.x - sign * half * 0.58, center.y + 148);
}

export function appendGlyphLoop(points: RibbonPoint[], rect: RibbonRect, scaleX: number, scaleY: number) {
  const center = { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 };
  const rx = Math.max(12, rect.width * 0.5 * scaleX);
  const ry = Math.max(14, rect.height * 0.5 * scaleY);
  appendCleanOvalLoop(points, center, rx, ry, 0);
}

export function appendReassuranceLoop(points: RibbonPoint[], rect: RibbonRect, paddingX: number, paddingY: number, skew = 0.12) {
  const center = { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 };
  const rx = rect.width * 0.5 + Math.max(24, paddingX);
  const ry = rect.height * 0.5 + Math.max(22, paddingY);
  appendCleanOvalLoop(points, center, rx, ry, Math.min(0.08, skew));
  const exit = points.at(-1)!;
  push(points, exit.x + rx * 0.08, Math.max(exit.y + 34, rect.bottom + paddingY * 0.42));
}

export function buildTaperPolygon(centerline: readonly RibbonPoint[], fullWidth: number): RibbonPoint[] {
  if (centerline.length < 2) return [];
  const left: RibbonPoint[] = [];
  const right: RibbonPoint[] = [];
  const last = centerline.length - 1;

  for (let index = 0; index <= last; index += 1) {
    const point = centerline[index]!;
    const previous = centerline[Math.max(0, index - 1)]!;
    const next = centerline[Math.min(last, index + 1)]!;
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.max(0.0001, Math.hypot(dx, dy));
    const factor = Math.pow(1 - index / last, 1.08);
    const half = fullWidth * 0.5 * factor;
    const nx = -dy / length;
    const ny = dx / length;
    left.push({ x: point.x + nx * half, y: point.y + ny * half });
    right.push({ x: point.x - nx * half, y: point.y - ny * half });
  }

  return [...left, ...right.reverse()];
}

export function smoothRibbonPath(points: readonly RibbonPoint[], tension = 0.72) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`;
  const safeTension = Math.max(0.2, Math.min(1.0, tension));
  const commands = [`M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)]!;
    const p1 = points[index]!;
    const p2 = points[index + 1]!;
    const p3 = points[Math.min(points.length - 1, index + 2)]!;
    const factor = safeTension / 6;
    const c1x = p1.x + (p2.x - p0.x) * factor;
    const c1y = p1.y + (p2.y - p0.y) * factor;
    const c2x = p2.x - (p3.x - p1.x) * factor;
    const c2y = p2.y - (p3.y - p1.y) * factor;
    commands.push(`C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`);
  }

  return commands.join(' ');
}
