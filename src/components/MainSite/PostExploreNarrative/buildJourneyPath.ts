import type { JourneyRouteConfig, JourneyStopId } from './journeyRoute';
import {
  appendArtworkWrap,
  appendFlow,
  appendGentleBend,
  appendGlyphPairLoops,
  appendLooseOvalLoop,
  appendReassuranceLoop,
  appendTangentFlow,
  buildTaperPolygon,
  smoothRibbonPath,
  type RibbonPoint,
  type RibbonRect,
} from './ribbonPrimitives';

export type BuiltJourneyStop = {
  localY: number;
  revealLocalY: number;
  revealViewportRatio: number;
  bandBias: number;
};
export type RibbonClipRect = { x: number; y: number; width: number; height: number };
export type RibbonTaperGeometry = {
  startLocalY: number;
  centerlineD: string;
  polygonPoints: readonly RibbonPoint[];
};
export type BuiltJourneyPath = {
  d: string;
  width: number;
  height: number;
  openingLocalY: number;
  stops: Record<JourneyStopId, BuiltJourneyStop>;
  frontClipRects: readonly RibbonClipRect[];
  taper: RibbonTaperGeometry;
};

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function localRect(rootRect: DOMRect, rect: DOMRect): RibbonRect {
  return { left: rect.left - rootRect.left, top: rect.top - rootRect.top, right: rect.right - rootRect.left, bottom: rect.bottom - rootRect.top, width: rect.width, height: rect.height };
}
function measure(root: HTMLElement, rootRect: DOMRect, selector: string): RibbonRect {
  const element = root.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Missing journey geometry target: ${selector}`);
  return localRect(rootRect, element.getBoundingClientRect());
}
function expand(rect: RibbonRect, x: number, y = x): RibbonClipRect {
  return { x: rect.left - x, y: rect.top - y, width: rect.width + x * 2, height: rect.height + y * 2 };
}
function centerY(rect: RibbonRect) { return rect.top + rect.height * 0.5; }

export function buildJourneyPath(root: HTMLElement, config: JourneyRouteConfig): BuiltJourneyPath {
  const rootRect = root.getBoundingClientRect();
  const width = Math.max(1, rootRect.width);
  const height = Math.max(1, root.scrollHeight || rootRect.height);

  const q1 = measure(root, rootRect, '[data-journey-stop="q1"]');
  const q2 = measure(root, rootRect, '[data-journey-stop="q2"]');
  const q3 = measure(root, rootRect, '[data-journey-stop="q3"]');
  const artQ1 = measure(root, rootRect, '[data-ribbon-artwork="q1"]');
  const artQ2 = measure(root, rootRect, '[data-ribbon-artwork="q2"]');
  const q2Text = measure(root, rootRect, '[data-ribbon-question="q2"]');
  const o1 = measure(root, rootRect, '[data-ribbon-glyph="look-o-1"]');
  const o2 = measure(root, rootRect, '[data-ribbon-glyph="look-o-2"]');
  const reassuranceText = measure(root, rootRect, '[data-reassurance-text]');

  const points: RibbonPoint[] = [{ x: 0, y: 18 }];
  const frontClipRects: RibbonClipRect[] = [];

  const leadX = clamp(config.opening.lead, config.edgeInset + 60, width * 0.42);
  const openingCenter = {
    x: clamp(leadX + config.opening.loopRadiusX * 1.14, config.edgeInset + config.opening.loopRadiusX, width - config.edgeInset - config.opening.loopRadiusX),
    y: Math.max(92, config.opening.loopRadiusY * 1.72),
  };
  appendLooseOvalLoop(points, openingCenter, config.opening.loopRadiusX, config.opening.loopRadiusY, 0.06);
  const openingExit = points.at(-1)!;
  const openingDepartureX = clamp(
    Math.max(width * 0.34, openingExit.x + Math.max(18, config.opening.loopRadiusX * 0.42)),
    config.edgeInset,
    width - config.edgeInset,
  );
  appendTangentFlow(
    points,
    { x: openingDepartureX, y: openingExit.y + config.opening.exitRun },
    Math.min(38, config.opening.loopRadiusX * 0.42),
  );
  const openingLocalY = points.at(-1)!.y;

  const wrapRect: RibbonRect = config.q1.wrapScale === 1 ? artQ1 : {
    left: artQ1.left + artQ1.width * (1 - config.q1.wrapScale) * 0.5,
    right: artQ1.right - artQ1.width * (1 - config.q1.wrapScale) * 0.5,
    top: artQ1.top + artQ1.height * (1 - config.q1.wrapScale) * 0.5,
    bottom: artQ1.bottom - artQ1.height * (1 - config.q1.wrapScale) * 0.5,
    width: artQ1.width * config.q1.wrapScale,
    height: artQ1.height * config.q1.wrapScale,
  };
  appendArtworkWrap(points, wrapRect, 'right', config.q1.clearance);
  frontClipRects.push(
    { x: artQ1.left - 34, y: artQ1.top - 48, width: artQ1.width * 0.58, height: artQ1.height * 0.34 },
    { x: artQ1.left + artQ1.width * 0.06, y: artQ1.bottom - artQ1.height * 0.2, width: artQ1.width + config.q1.clearance, height: artQ1.height * 0.34 + config.q1.clearance },
  );

  const horizontalGap = q2Text.left - artQ2.right;
  const hasHorizontalGap = horizontalGap > 36;
  const q2CenterX = hasHorizontalGap ? artQ2.right + horizontalGap * 0.5 : width * (0.5 + config.q2.bendBias);
  const q2BendWidth = hasHorizontalGap ? Math.min(config.q2.bendWidth, Math.max(92, horizontalGap * 1.12)) : Math.min(config.q2.bendWidth, width * 0.42);
  appendGentleBend(points, 'right', { x: q2CenterX, y: centerY(q2) }, q2BendWidth);

  appendGlyphPairLoops(points, o1, o2, config.q3.glyphScaleX, config.q3.glyphScaleY);
  const lookBounds: RibbonRect = {
    left: Math.min(o1.left, o2.left), top: Math.min(o1.top, o2.top), right: Math.max(o1.right, o2.right), bottom: Math.max(o1.bottom, o2.bottom),
    width: Math.max(o1.right, o2.right) - Math.min(o1.left, o2.left), height: Math.max(o1.bottom, o2.bottom) - Math.min(o1.top, o2.top),
  };
  frontClipRects.push(expand(lookBounds, 20, 26));

  const reassuranceSideMargin = Math.max(0, Math.min(reassuranceText.left, width - reassuranceText.right));
  const reassurancePaddingX = Math.min(config.reassurance.paddingX, Math.max(4, reassuranceSideMargin - 8));
  appendReassuranceLoop(points, reassuranceText, reassurancePaddingX, config.reassurance.paddingY, config.reassurance.skew);
  const reassuranceExit = points.at(-1)!;
  appendFlow(points, { x: reassuranceExit.x, y: reassuranceExit.y + config.reassurance.exitRun }, 0);

  const taperStartIndex = points.length - 1;
  const taperStart = points[taperStartIndex]!;
  appendFlow(points, { x: taperStart.x, y: Math.min(height - 22, taperStart.y + config.reassurance.taperLength) }, 0);
  const taperCenterline = points.slice(taperStartIndex);
  const taper: RibbonTaperGeometry = {
    startLocalY: taperStart.y,
    centerlineD: smoothRibbonPath(taperCenterline, 0.72),
    polygonPoints: buildTaperPolygon(taperCenterline, config.ribbonWidth),
  };

  const stops: Record<JourneyStopId, BuiltJourneyStop> = {
    q1: { localY: centerY(artQ1), revealLocalY: Math.max(openingLocalY, q1.top), revealViewportRatio: 0.76, bandBias: 0.006 },
    q2: { localY: centerY(q2), revealLocalY: q2.top, revealViewportRatio: 0.76, bandBias: -0.004 },
    q3: { localY: centerY(lookBounds), revealLocalY: q3.top, revealViewportRatio: 0.76, bandBias: 0.004 },
    reassurance: {
      localY: centerY(reassuranceText),
      revealLocalY: reassuranceText.top,
      revealViewportRatio: 0.82,
      bandBias: config.reassurance.bandBias,
    },
  };

  return { d: smoothRibbonPath(points, 0.72), width, height, openingLocalY, stops, frontClipRects, taper };
}
