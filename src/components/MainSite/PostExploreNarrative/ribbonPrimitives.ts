export type RibbonPoint = { x: number; y: number };

export type RibbonRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type RibbonWrapMarkers = {
  frontEntryY: number;
  backY: number;
  frontExitY: number;
};

function push(points: RibbonPoint[], x: number, y: number) {
  const previous = points.at(-1);
  if (previous && Math.abs(previous.x - x) < 0.01 && Math.abs(previous.y - y) < 0.01) return;
  points.push({ x, y });
}

export function appendFlow(points: RibbonPoint[], target: RibbonPoint, bendX = 0) {
  const from = points.at(-1);
  if (!from) {
    points.push(target);
    return;
  }
  const dy = target.y - from.y;
  push(points, from.x + bendX, from.y + dy * 0.42);
  push(points, target.x - bendX * 0.32, from.y + dy * 0.76);
  push(points, target.x, target.y);
}

export function appendLooseOvalLoop(
  points: RibbonPoint[],
  center: RibbonPoint,
  radiusX: number,
  radiusY: number,
  skew = 0.14,
) {
  const start = points.at(-1) ?? { x: center.x - radiusX, y: center.y };
  const rx = Math.max(20, radiusX);
  const ry = Math.max(14, radiusY);
  const entryY = center.y - ry * 0.12;
  appendFlow(points, { x: center.x - rx, y: entryY }, Math.min(32, rx * 0.18));

  const count = 10;
  for (let index = 1; index <= count; index += 1) {
    const angle = Math.PI + (Math.PI * 2 * index) / count;
    const verticalSkew = Math.sin(angle * 2) * ry * skew;
    const horizontalSkew = Math.cos(angle * 3) * rx * skew * 0.34;
    push(
      points,
      center.x + Math.cos(angle) * rx + horizontalSkew,
      center.y + Math.sin(angle) * ry + verticalSkew,
    );
  }

  push(points, center.x - rx * 0.58, Math.max(start.y + 24, center.y + ry * 0.56));
  push(points, center.x + rx * 0.2, Math.max(start.y + 48, center.y + ry * 0.82));
}

export function appendArtworkWrap(
  points: RibbonPoint[],
  rect: RibbonRect,
  side: 'left' | 'right',
  clearance: number,
): RibbonWrapMarkers {
  const sign = side === 'right' ? 1 : -1;
  const outerX = side === 'right' ? rect.right + clearance : rect.left - clearance;
  const innerX = side === 'right'
    ? rect.left + rect.width * 0.14
    : rect.right - rect.width * 0.14;
  const nearX = side === 'right'
    ? rect.right - rect.width * 0.08
    : rect.left + rect.width * 0.08;

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

export function appendGentleBend(
  points: RibbonPoint[],
  fromSide: 'left' | 'right',
  center: RibbonPoint,
  width: number,
) {
  const sign = fromSide === 'right' ? 1 : -1;
  const half = Math.max(70, width * 0.5);
  appendFlow(points, { x: center.x + sign * half, y: center.y - 110 }, -sign * half * 0.2);
  push(points, center.x + sign * half * 0.45, center.y - 38);
  push(points, center.x - sign * half * 0.12, center.y + 32);
  push(points, center.x - sign * half * 0.52, center.y + 118);
}

export function appendGlyphLoop(
  points: RibbonPoint[],
  rect: RibbonRect,
  scaleX: number,
  scaleY: number,
) {
  const centerX = rect.left + rect.width * 0.5;
  const centerY = rect.top + rect.height * 0.5;
  const rx = Math.max(10, rect.width * 0.5 * scaleX);
  const ry = Math.max(12, rect.height * 0.5 * scaleY);
  const entryY = centerY - ry * 0.08;

  appendFlow(points, { x: centerX - rx, y: entryY }, Math.min(18, rx * 0.25));
  const count = 9;
  for (let index = 1; index <= count; index += 1) {
    const angle = Math.PI + (Math.PI * 2 * index) / count;
    push(
      points,
      centerX + Math.cos(angle) * rx,
      centerY + Math.sin(angle) * ry * (1 + Math.cos(angle) * 0.035),
    );
  }
  push(points, centerX + rx * 0.58, centerY + ry * 0.26);
}

export function smoothRibbonPath(points: readonly RibbonPoint[], tension = 0.88) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`;

  const safeTension = Math.max(0.2, Math.min(1.2, tension));
  const commands = [`M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)]!;
    const p1 = points[index]!;
    const p2 = points[index + 1]!;
    const p3 = points[Math.min(points.length - 1, index + 2)]!;
    const factor = safeTension / 6;
    const c1 = {
      x: p1.x + (p2.x - p0.x) * factor,
      y: p1.y + (p2.y - p0.y) * factor,
    };
    const c2 = {
      x: p2.x - (p3.x - p1.x) * factor,
      y: p2.y - (p3.y - p1.y) * factor,
    };
    commands.push(
      `C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)} ${c2.x.toFixed(2)} ${c2.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    );
  }

  return commands.join(' ');
}
