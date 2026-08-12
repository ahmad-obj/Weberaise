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
  const tangentRun = Math.max(8, Math.min(24, rx * 0.16));

  appendFlow(points, { x: center.x - tangentRun, y: topY }, Math.min(12, rx * 0.05));
  push(points, center.x, topY);

  const steps = 16;
  for (let index = 1; index <= steps; index += 1) {
    const angle = -Math.PI * 0.5 + (Math.PI * 2 * index) / steps;
    const point = ellipsePoint(center, rx, ry, angle, skew);
    push(points, point.x, point.y);
  }

  push(points, center.x + tangentRun, topY);
}

function appendAngledOvalLoop(
  points: RibbonPoint[],
  center: RibbonPoint,
  rx: number,
  ry: number,
  startAngle: number,
  skew = 0,
) {
  const seam = ellipsePoint(center, rx, ry, startAngle, skew);
  const tangentX = -Math.sin(startAngle) * rx + Math.cos(startAngle) * rx * skew * 0.04;
  const tangentY = Math.cos(startAngle) * ry;
  const tangentLength = Math.max(0.0001, Math.hypot(tangentX, tangentY));
  const tx = tangentX / tangentLength;
  const ty = tangentY / tangentLength;
  const tangentRun = Math.max(10, Math.min(26, Math.min(rx, ry) * 0.18));

  appendFlow(points, { x: seam.x - tx * tangentRun, y: seam.y - ty * tangentRun }, Math.min(14, rx * 0.04));
  push(points, seam.x, seam.y);

  const steps = 24;
  for (let index = 1; index <= steps; index += 1) {
    const angle = startAngle + (Math.PI * 2 * index) / steps;
    const point = ellipsePoint(center, rx, ry, angle, skew);
    push(points, point.x, point.y);
  }

  push(points, seam.x + tx * tangentRun, seam.y + ty * tangentRun);
}

export function appendLooseOvalLoop(points: RibbonPoint[], center: RibbonPoint, radiusX: number, radiusY: number, skew = 0.14) {
  const rx = Math.max(20, radiusX);
  const ry = Math.max(14, radiusY);
  appendCleanOvalLoop(points, center, rx, ry, Math.min(0.12, skew));
  push(points, center.x + rx + Math.max(12, rx * 0.12), center.y - ry);
}

export function appendTangentFlow(points: RibbonPoint[], target: RibbonPoint, forwardRun = 32) {
  const from = points.at(-1);
  if (!from) return void points.push(target);

  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const direction = dx >= 0 ? 1 : -1;
  const run = Math.min(Math.max(14, Math.min(48, Math.abs(forwardRun))), Math.max(8, Math.abs(dx) * 0.72));
  const tangentEndX = from.x + direction * run;
  const remainingDx = target.x - tangentEndX;
  const finalSettle = direction * Math.min(5, Math.abs(remainingDx) * 0.12);

  push(points, tangentEndX, from.y);
  push(points, tangentEndX + remainingDx * 0.55, from.y + dy * 0.15);
  push(points, tangentEndX + remainingDx * 0.82, from.y + dy * 0.42);
  push(points, target.x - finalSettle, from.y + dy * 0.72);
  push(points, target.x, target.y);
}

export function appendArtworkWrap(points: RibbonPoint[], rect: RibbonRect, side: 'left' | 'right', clearance: number): RibbonWrapMarkers {
  const sign = side === 'right' ? 1 : -1;
  const center = {
    x: rect.left + rect.width * 0.5 - sign * clearance * 0.18,
    y: rect.top + rect.height * 0.5,
  };
  const rx = rect.width * 0.5 + clearance * 0.12;
  const ry = rect.height * 0.5 + clearance * 0.24;

  appendAngledOvalLoop(
    points,
    center,
    rx,
    ry,
    side === 'right' ? -Math.PI * 0.25 : -Math.PI * 0.75,
    sign * 0.035,
  );

  const frontExitY = rect.bottom + Math.max(48, clearance * 0.55);
  appendFlow(
    points,
    {
      x: center.x + sign * (rx - clearance * 0.28),
      y: frontExitY + Math.max(46, rect.height * 0.14),
    },
    sign * Math.min(22, clearance * 0.22),
  );

  return {
    frontEntryY: rect.top + rect.height * 0.05,
    backY: rect.top + rect.height * 0.66,
    frontExitY,
  };
}

export function appendGentleBend(points: RibbonPoint[], fromSide: 'left' | 'right', center: RibbonPoint, width: number) {
  const from = points.at(-1);
  if (!from) return;
  const sign = fromSide === 'right' ? 1 : -1;
  const half = Math.max(76, width * 0.5);
  const target = {
    x: center.x - sign * half * 0.48,
    y: center.y + 130,
  };
  const steps = 9;

  for (let index = 1; index <= steps; index += 1) {
    const progress = index / steps;
    const eased = progress * progress * (3 - 2 * progress);
    push(
      points,
      from.x + (target.x - from.x) * eased,
      from.y + (target.y - from.y) * progress,
    );
  }
}

export function appendGlyphLoop(points: RibbonPoint[], rect: RibbonRect, scaleX: number, scaleY: number) {
  const center = { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 };
  const rx = Math.max(12, rect.width * 0.5 * scaleX);
  const ry = Math.max(14, rect.height * 0.5 * scaleY);
  appendCleanOvalLoop(points, center, rx, ry, 0);
  appendFlow(
    points,
    { x: center.x + rx * 1.08, y: center.y + ry * 0.22 },
    Math.min(10, rx * 0.12),
  );
}

export function appendGlyphPairLoops(
  points: RibbonPoint[],
  firstRect: RibbonRect,
  secondRect: RibbonRect,
  scaleX: number,
  scaleY: number,
) {
  const firstCenter = { x: firstRect.left + firstRect.width * 0.5, y: firstRect.top + firstRect.height * 0.5 };
  const secondCenter = { x: secondRect.left + secondRect.width * 0.5, y: secondRect.top + secondRect.height * 0.5 };
  const centerY = (firstCenter.y + secondCenter.y) * 0.5;
  const centerGap = Math.max(1, secondCenter.x - firstCenter.x);
  const desiredFirstRx = Math.max(6, firstRect.width * 0.5 * scaleX);
  const desiredSecondRx = Math.max(6, secondRect.width * 0.5 * scaleX);
  const pairScale = Math.min(1, centerGap / Math.max(1, desiredFirstRx + desiredSecondRx));
  const firstRx = desiredFirstRx * pairScale;
  const secondRx = desiredSecondRx * pairScale;
  const firstRy = Math.max(10, firstRect.height * 0.5 * scaleY);
  const secondRy = Math.max(10, secondRect.height * 0.5 * scaleY);
  const seam = { x: firstCenter.x + firstRx, y: centerY };
  const approachLift = Math.max(14, Math.min(firstRy, secondRy) * 0.7);

  appendFlow(points, { x: seam.x, y: seam.y - approachLift }, 0);
  push(points, seam.x, seam.y);

  const steps = 24;
  for (let index = 1; index <= steps; index += 1) {
    const angle = (Math.PI * 2 * index) / steps;
    const point = ellipsePoint({ x: firstCenter.x, y: centerY }, firstRx, firstRy, angle, 0);
    push(points, point.x, point.y);
  }

  push(points, seam.x, seam.y);
  for (let index = 1; index <= steps; index += 1) {
    const angle = Math.PI - (Math.PI * 2 * index) / steps;
    const point = ellipsePoint({ x: secondCenter.x, y: centerY }, secondRx, secondRy, angle, 0);
    push(points, point.x, point.y);
  }

  const clearBelow = centerY + Math.max(firstRy, secondRy) + 12;
  push(points, seam.x, clearBelow);
  appendFlow(
    points,
    {
      x: secondRect.right + Math.max(14, secondRect.width * 0.55),
      y: clearBelow + Math.max(28, secondRy * 0.72),
    },
    Math.min(14, centerGap * 0.16),
  );
}

export function appendReassuranceLoop(points: RibbonPoint[], rect: RibbonRect, paddingX: number, paddingY: number, skew = 0.12) {
  const center = { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 };
  const rx = rect.width * 0.5 + Math.max(8, paddingX);
  const ry = rect.height * 0.5 + Math.max(22, paddingY);
  appendAngledOvalLoop(points, center, rx, ry, 0, Math.min(0.08, skew));
  const tangentExit = points.at(-1)!;
  appendFlow(
    points,
    {
      x: tangentExit.x,
      y: center.y + ry + Math.max(28, paddingY * 0.5),
    },
    0,
  );
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
