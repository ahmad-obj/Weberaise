import type { JourneyRouteConfig, JourneyStopId } from './journeyRoute';
import {
  RibbonCurveBuilder,
  curveSegmentsToPathD,
  normalizeDirection,
  sampleCurveSegments,
  tangentHandle,
  type RibbonCurveSegment,
  type RibbonMarkerId,
} from './ribbonCurveBuilder';
import { buildTaperPolygon, type RibbonPoint, type RibbonRect } from './ribbonPrimitives';

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
  segments: readonly RibbonCurveSegment[];
  markers: Record<RibbonMarkerId, RibbonPoint>;
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

function curveTo(
  builder: RibbonCurveBuilder,
  id: string,
  end: RibbonPoint,
  endDirection: RibbonPoint,
  entryDistance: number,
  exitDistance: number,
  initialDirection?: RibbonPoint,
) {
  const start = builder.currentPoint;
  const fallback = normalizeDirection({ x: end.x - start.x, y: end.y - start.y });
  const entryDirection = builder.exitDirection ?? (initialDirection ? normalizeDirection(initialDirection) : fallback);
  const exitDirection = normalizeDirection(endDirection);
  return builder.cubic(
    id,
    tangentHandle(start, entryDirection, Math.max(12, entryDistance)),
    tangentHandle(end, exitDirection, -Math.max(12, exitDistance)),
    end,
  );
}

function lineDirection(from: RibbonPoint, to: RibbonPoint): RibbonPoint {
  return normalizeDirection({ x: to.x - from.x, y: to.y - from.y });
}

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

  const frontClipRects: RibbonClipRect[] = [];
  const builder = new RibbonCurveBuilder({ x: 0, y: 18 });

  // Opening signature: one calm approach, one true four-cubic oval, one tangent departure.
  const openingRadiusX = Math.max(20, config.opening.loopRadiusX);
  const openingRadiusY = Math.max(14, config.opening.loopRadiusY);
  const leadX = clamp(config.opening.lead, config.edgeInset + 60, width * 0.42);
  const openingCenter = {
    x: clamp(leadX + openingRadiusX * 1.14, config.edgeInset + openingRadiusX, width - config.edgeInset - openingRadiusX),
    y: Math.max(92, openingRadiusY * 1.72),
  };
  const openingSeam = { x: openingCenter.x - openingRadiusX, y: openingCenter.y };
  curveTo(builder, 'opening-approach', openingSeam, { x: 0, y: 1 }, openingRadiusX * 0.9, openingRadiusY * 0.9, { x: 1, y: 0.15 });
  builder.ellipse('opening-loop', openingCenter, openingRadiusX, openingRadiusY, Math.PI, -Math.PI * 2);
  const openingTarget = {
    x: clamp(Math.max(width * 0.34, openingSeam.x + openingRadiusX * 1.95), config.edgeInset, width - config.edgeInset),
    y: openingCenter.y + openingRadiusY + config.opening.exitRun,
  };
  curveTo(builder, 'opening-departure', openingTarget, { x: 0.52, y: 1 }, openingRadiusY * 0.95, Math.max(44, openingRadiusY * 0.85));
  builder.mark('openingExit');
  const openingLocalY = builder.currentPoint.y;

  // Q1: a single open wrap with broad quarter-turn gestures and no sampled wobble.
  const wrapRect: RibbonRect = config.q1.wrapScale === 1 ? artQ1 : {
    left: artQ1.left + artQ1.width * (1 - config.q1.wrapScale) * 0.5,
    right: artQ1.right - artQ1.width * (1 - config.q1.wrapScale) * 0.5,
    top: artQ1.top + artQ1.height * (1 - config.q1.wrapScale) * 0.5,
    bottom: artQ1.bottom - artQ1.height * (1 - config.q1.wrapScale) * 0.5,
    width: artQ1.width * config.q1.wrapScale,
    height: artQ1.height * config.q1.wrapScale,
  };
  const q1Clearance = config.q1.clearance;
  const q1Approach = { x: wrapRect.left - q1Clearance * 0.18, y: wrapRect.top - q1Clearance * 0.28 };
  curveTo(builder, 'q1-long-approach', q1Approach, { x: 1, y: 0 }, Math.max(84, width * 0.09), Math.max(72, wrapRect.width * 0.16));
  builder.mark('q1Approach');

  const q1UpperEnd = { x: wrapRect.right + q1Clearance * 0.46, y: wrapRect.top + wrapRect.height * 0.07 };
  builder.cubic(
    'q1-upper-front',
    tangentHandle(q1Approach, { x: 1, y: 0 }, Math.max(110, wrapRect.width * 0.42)),
    tangentHandle(q1UpperEnd, { x: 0, y: 1 }, -Math.max(82, wrapRect.height * 0.3)),
    q1UpperEnd,
  ).mark('q1WrapFront');

  const q1RightEnd = { x: wrapRect.right + q1Clearance * 0.62, y: wrapRect.bottom + q1Clearance * 0.18 };
  builder.cubic(
    'q1-right-back',
    tangentHandle(q1UpperEnd, { x: 0, y: 1 }, Math.max(96, wrapRect.height * 0.42)),
    tangentHandle(q1RightEnd, { x: -1, y: 0 }, -Math.max(92, wrapRect.width * 0.18)),
    q1RightEnd,
  ).mark('q1WrapBack');

  const q1LowerEnd = { x: wrapRect.left + wrapRect.width * 0.1, y: wrapRect.bottom + q1Clearance * 0.7 };
  const lowerExitDirection = normalizeDirection({ x: 0.32, y: 1 });
  builder.cubic(
    'q1-lower-front',
    tangentHandle(q1RightEnd, { x: -1, y: 0 }, Math.max(126, wrapRect.width * 0.46)),
    tangentHandle(q1LowerEnd, lowerExitDirection, -Math.max(72, wrapRect.height * 0.22)),
    q1LowerEnd,
  );
  frontClipRects.push(
    { x: artQ1.left - 34, y: artQ1.top - 48, width: artQ1.width * 0.58, height: artQ1.height * 0.34 },
    { x: artQ1.left + artQ1.width * 0.06, y: artQ1.bottom - artQ1.height * 0.2, width: artQ1.width + q1Clearance, height: artQ1.height * 0.34 + q1Clearance },
  );

  // Resolve the paired-O seam first so Q1 and Q2 can travel monotonically toward it.
  const q3ScaleX = config.q3.glyphScaleX;
  const q3ScaleY = config.q3.glyphScaleY;
  const q3OffsetX = config.q3.offsetX ?? -0.03;
  const q3OffsetY = config.q3.offsetY ?? 0.02;
  const firstCenter = {
    x: o1.left + o1.width * (0.5 + q3OffsetX),
    y: o1.top + o1.height * (0.5 + q3OffsetY),
  };
  const secondCenter = {
    x: o2.left + o2.width * (0.5 + q3OffsetX),
    y: o2.top + o2.height * (0.5 + q3OffsetY),
  };
  const pairCenterY = (firstCenter.y + secondCenter.y) * 0.5;
  const centerGap = Math.max(1, secondCenter.x - firstCenter.x);
  const desiredFirstRadiusX = Math.max(6, o1.width * 0.5 * q3ScaleX);
  const desiredSecondRadiusX = Math.max(6, o2.width * 0.5 * q3ScaleX);
  const pairScale = Math.min(1, centerGap / Math.max(1, desiredFirstRadiusX + desiredSecondRadiusX));
  const firstRadiusX = desiredFirstRadiusX * pairScale;
  const secondRadiusX = desiredSecondRadiusX * pairScale;
  const firstRadiusY = Math.max(10, o1.height * 0.5 * q3ScaleY);
  const secondRadiusY = Math.max(10, o2.height * 0.5 * q3ScaleY);
  const firstLoopCenter = { x: firstCenter.x, y: pairCenterY };
  const secondLoopCenter = { x: secondCenter.x, y: pairCenterY };
  const q3Seam = { x: firstLoopCenter.x + firstRadiusX, y: pairCenterY };
  const q3ApproachClearance = config.q3.approachClearance ?? 0.72;
  const q3Approach = {
    x: q3Seam.x + Math.max(18, firstRadiusX * 0.56),
    y: pairCenterY - Math.max(firstRadiusY, secondRadiusY) - Math.max(16, o1.height * 0.3),
  };

  const horizontalGap = q2Text.left - artQ2.right;
  const measuredCorridorX = horizontalGap > 36 ? artQ2.right + horizontalGap * 0.5 : width * (0.5 + config.q2.bendBias);
  const q1ExitX = clamp(Math.max(measuredCorridorX, q3Approach.x + Math.max(44, width * 0.08)), config.edgeInset, width - config.edgeInset);
  const q1Exit = {
    x: q1ExitX,
    y: Math.max(q1LowerEnd.y + 100, centerY(q2) - Math.max(150, q2.height * 0.42)),
  };
  const q2Direction = normalizeDirection({ x: q3Approach.x - q1Exit.x, y: q3Approach.y - q1Exit.y });
  curveTo(builder, 'q1-long-exit', q1Exit, q2Direction, Math.max(90, q1Clearance * 1.6), Math.max(86, q2.height * 0.18));
  builder.mark('q1WrapExit');

  // Q2: exactly two long cubics sharing one tangent through the artwork/text corridor.
  const q2Mid = {
    x: q1Exit.x + (q3Approach.x - q1Exit.x) * 0.48,
    y: centerY(q2),
  };
  const sharedQ2Direction = lineDirection(q1Exit, q3Approach);
  curveTo(builder, 'q2-calm-entry', q2Mid, sharedQ2Direction, Math.max(100, q2.height * 0.23), Math.max(92, q2.height * 0.2));
  builder.mark('q2BendExit');
  const q3EntryDirection = lineDirection(q3Approach, q3Seam);
  curveTo(builder, 'q2-calm-exit', q3Approach, q3EntryDirection, Math.max(110, q2.height * 0.26), Math.max(70, o1.height * 1.2));
  builder.mark('q3Approach');

  // Q3: enter from a broad upper approach, trace both O glyphs from their shared seam, exit down-right.
  curveTo(builder, 'q3-seam-entry', q3Seam, { x: 0, y: 1 }, Math.max(28, firstRadiusY * 0.62), Math.max(26, firstRadiusY * 0.62));
  builder.ellipse('q3-first-o', firstLoopCenter, firstRadiusX, firstRadiusY, 0, Math.PI * 2).mark('q3FirstLoopComplete');
  builder.ellipse('q3-second-o', secondLoopCenter, secondRadiusX, secondRadiusY, Math.PI, -Math.PI * 2).mark('q3SecondLoopComplete');
  const q3ClearBelow = {
    x: q3Seam.x - Math.max(18, firstRadiusX * 0.62),
    y: pairCenterY + Math.max(firstRadiusY, secondRadiusY) + Math.max(20, o2.height * 0.36),
  };
  curveTo(builder, 'q3-clear-below', q3ClearBelow, { x: 1, y: 0.1 }, Math.max(28, secondRadiusY * 0.7), Math.max(26, o2.height * 0.46));
  const q3Exit = {
    x: o2.right + Math.max(20, o2.width * 0.62),
    y: pairCenterY + Math.max(firstRadiusY, secondRadiusY) + Math.max(42, o2.height * 0.72),
  };
  curveTo(builder, 'q3-downward-exit', q3Exit, { x: 0.34, y: 1 }, Math.max(28, secondRadiusY * 0.7), Math.max(36, o2.height * 0.65));
  const lookBounds: RibbonRect = {
    left: Math.min(o1.left, o2.left), top: Math.min(o1.top, o2.top), right: Math.max(o1.right, o2.right), bottom: Math.max(o1.bottom, o2.bottom),
    width: Math.max(o1.right, o2.right) - Math.min(o1.left, o2.left), height: Math.max(o1.bottom, o2.bottom) - Math.min(o1.top, o2.top),
  };
  frontClipRects.push(expand(lookBounds, 20, 26));

  // Reassurance: one offset oval around the locked lines, then a tangent descent into the taper.
  const reassuranceSideMargin = Math.max(0, Math.min(reassuranceText.left, width - reassuranceText.right));
  const reassurancePaddingX = Math.min(config.reassurance.paddingX, Math.max(4, reassuranceSideMargin - 8));
  const reassuranceCenter = {
    x: reassuranceText.left + reassuranceText.width * 0.5 - reassurancePaddingX * config.reassurance.skew * 0.18,
    y: reassuranceText.top + reassuranceText.height * 0.5 + config.reassurance.paddingY * 0.04,
  };
  const reassuranceRadiusX = reassuranceText.width * 0.5 + Math.max(8, reassurancePaddingX);
  const reassuranceRadiusY = reassuranceText.height * 0.5 + Math.max(22, config.reassurance.paddingY);
  const reassuranceSeam = { x: reassuranceCenter.x + reassuranceRadiusX, y: reassuranceCenter.y };
  curveTo(builder, 'reassurance-approach', reassuranceSeam, { x: 0, y: 1 }, Math.max(110, config.reassurance.approachLead * 0.72), Math.max(52, reassuranceRadiusY * 0.42));
  builder.mark('reassuranceApproach');
  builder.ellipse('reassurance-loop', reassuranceCenter, reassuranceRadiusX, reassuranceRadiusY, 0, Math.PI * 2).mark('reassuranceLoopComplete');

  const taperStart = {
    x: reassuranceSeam.x - Math.min(20, reassurancePaddingX * 0.18),
    y: reassuranceCenter.y + reassuranceRadiusY + config.reassurance.exitRun,
  };
  curveTo(builder, 'reassurance-departure', taperStart, { x: -0.08, y: 1 }, Math.max(46, reassuranceRadiusY * 0.38), Math.max(34, config.reassurance.exitRun * 0.62));
  const taperStartIndex = builder.segments.length;
  const taperEnd = {
    x: clamp(taperStart.x - Math.min(34, width * 0.025), config.edgeInset, width - config.edgeInset),
    y: Math.min(height - 22, taperStart.y + config.reassurance.taperLength),
  };
  curveTo(builder, 'taper-descent', taperEnd, { x: 0, y: 1 }, Math.max(32, config.reassurance.taperLength * 0.3), Math.max(28, config.reassurance.taperLength * 0.24));
  builder.mark('taperEnd');

  const taperSegments = builder.segments.slice(taperStartIndex);
  const taperCenterline = sampleCurveSegments(taperSegments, 12);
  const taper: RibbonTaperGeometry = {
    startLocalY: taperStart.y,
    centerlineD: curveSegmentsToPathD(taperSegments, taperStart),
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

  return {
    d: builder.toPathD(),
    width,
    height,
    openingLocalY,
    stops,
    frontClipRects,
    taper,
    segments: builder.segments,
    markers: builder.markers,
  };
}
