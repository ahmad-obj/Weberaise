export type RibbonPoint = { x: number; y: number };
export type RibbonRect = { left: number; top: number; right: number; bottom: number; width: number; height: number };
export type RibbonWrapMarkers = { frontEntryY: number; backY: number; frontExitY: number };

function push(points: RibbonPoint[], x: number, y: number) {
  const previous = points.at(-1);
  if (!previous || Math.abs(previous.x - x) >= 0.01 || Math.abs(previous.y - y) >= 0.01) points.push({ x, y });
}

export function appendFlow(points: RibbonPoint[], target: RibbonPoint, bendX = 0) {
  const from = points.at(-1);
  if (!from) return void points.push(target);
  const dy = target.y - from.y;
  push(points, from.x + bendX, from.y + dy * 0.42);
  push(points, target.x - bendX * 0.32, from.y + dy * 0.76);
  push(points, target.x, target.y);
}

export function appendLooseOvalLoop(points: RibbonPoint[], center: RibbonPoint, radiusX: number, radiusY: number, skew = 0.14) {
  const start = points.at(-1) ?? { x: center.x - radiusX, y: center.y };
  const rx = Math.max(20, radiusX), ry = Math.max(14, radiusY);
  appendFlow(points, { x: center.x - rx, y: center.y - ry * 0.12 }, Math.min(32, rx * 0.18));
  for (let i = 1; i <= 10; i += 1) {
    const a = Math.PI + (Math.PI * 2 * i) / 10;
    push(points, center.x + Math.cos(a) * rx + Math.cos(a * 3) * rx * skew * 0.34, center.y + Math.sin(a) * ry + Math.sin(a * 2) * ry * skew);
  }
  push(points, center.x - rx * 0.58, Math.max(start.y + 24, center.y + ry * 0.56));
  push(points, center.x + rx * 0.2, Math.max(start.y + 48, center.y + ry * 0.82));
}

export function appendArtworkWrap(points: RibbonPoint[], rect: RibbonRect, side: 'left' | 'right', clearance: number): RibbonWrapMarkers {
  const sign = side === 'right' ? 1 : -1;
  const outerX = side === 'right' ? rect.right + clearance : rect.left - clearance;
  const innerX = side === 'right' ? rect.left + rect.width * 0.14 : rect.right - rect.width * 0.14;
  const nearX = side === 'right' ? rect.right - rect.width * 0.08 : rect.left + rect.width * 0.08;
  const frontEntryY = rect.top + rect.height * 0.08;
  const backY = rect.top + rect.height * 0.62;
  const frontExitY = rect.bottom + Math.max(24, clearance * 0.34);
  appendFlow(points, { x: innerX, y: frontEntryY }, -sign * Math.min(56, rect.width * 0.12));
  push(points, outerX + sign * clearance * 0.28, rect.top + rect.height * 0.22);
  push(points, outerX, rect.top + rect.height * 0.48);
  push(points, nearX, backY);
  push(points, innerX, rect.bottom - rect.height * 0.08);
  push(points, outerX - sign * clearance * 0.16, frontExitY);
  push(points, outerX - sign * clearance * 0.48, frontExitY + Math.max(54, rect.height * 0.18));
  return { frontEntryY, backY, frontExitY };
}

export function appendGentleBend(points: RibbonPoint[], fromSide: 'left' | 'right', center: RibbonPoint, width: number) {
  const sign = fromSide === 'right' ? 1 : -1, half = Math.max(70, width * 0.5);
  appendFlow(points, { x: center.x + sign * half, y: center.y - 110 }, -sign * half * 0.2);
  push(points, center.x + sign * half * 0.45, center.y - 38);
  push(points, center.x - sign * half * 0.12, center.y + 32);
  push(points, center.x - sign * half * 0.52, center.y + 118);
}

export function appendGlyphLoop(points: RibbonPoint[], rect: RibbonRect, scaleX: number, scaleY: number) {
  const cx = rect.left + rect.width * 0.5, cy = rect.top + rect.height * 0.5;
  const rx = Math.max(10, rect.width * 0.5 * scaleX), ry = Math.max(12, rect.height * 0.5 * scaleY);
  appendFlow(points, { x: cx - rx, y: cy - ry * 0.08 }, Math.min(18, rx * 0.25));
  for (let i = 1; i <= 9; i += 1) {
    const a = Math.PI + (Math.PI * 2 * i) / 9;
    push(points, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry * (1 + Math.cos(a) * 0.035));
  }
  push(points, cx + rx * 0.58, cy + ry * 0.26);
}

export function appendReassuranceLoop(points: RibbonPoint[], rect: RibbonRect, paddingX: number, paddingY: number, skew = 0.12) {
  const center = { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 };
  const rx = rect.width * 0.5 + Math.max(24, paddingX), ry = rect.height * 0.5 + Math.max(22, paddingY);
  appendLooseOvalLoop(points, center, rx, ry, skew);
  const exit = points.at(-1)!;
  push(points, exit.x + rx * 0.08, Math.max(exit.y + 34, rect.bottom + paddingY * 0.42));
}

export function buildTaperPolygon(centerline: readonly RibbonPoint[], fullWidth: number): RibbonPoint[] {
  if (centerline.length < 2) return [];
  const left: RibbonPoint[] = [], right: RibbonPoint[] = [], last = centerline.length - 1;
  for (let i = 0; i <= last; i += 1) {
    const p = centerline[i]!, prev = centerline[Math.max(0, i - 1)]!, next = centerline[Math.min(last, i + 1)]!;
    const dx = next.x - prev.x, dy = next.y - prev.y, len = Math.max(0.0001, Math.hypot(dx, dy));
    const factor = Math.pow(1 - i / last, 1.08), half = fullWidth * 0.5 * factor;
    const nx = -dy / len, ny = dx / len;
    left.push({ x: p.x + nx * half, y: p.y + ny * half });
    right.push({ x: p.x - nx * half, y: p.y - ny * half });
  }
  return [...left, ...right.reverse()];
}

export function smoothRibbonPath(points: readonly RibbonPoint[], tension = 0.88) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`;
  const t = Math.max(0.2, Math.min(1.2, tension)), commands = [`M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]!, p1 = points[i]!, p2 = points[i + 1]!, p3 = points[Math.min(points.length - 1, i + 2)]!, f = t / 6;
    const c1x = p1.x + (p2.x - p0.x) * f, c1y = p1.y + (p2.y - p0.y) * f;
    const c2x = p2.x - (p3.x - p1.x) * f, c2y = p2.y - (p3.y - p1.y) * f;
    commands.push(`C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`);
  }
  return commands.join(' ');
}
