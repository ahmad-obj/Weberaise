import type { BuiltJourneyPath } from './buildJourneyPath';
import type { PathLookup, PathSample } from './pathLookup';
import type { RibbonMarkerId } from './ribbonCurveBuilder';
import type { RibbonPoint } from './ribbonPrimitives';

export const RIBBON_MARKER_ORDER: readonly RibbonMarkerId[] = [
  'openingExit',
  'q1Approach',
  'q1WrapFront',
  'q1WrapBack',
  'q1WrapExit',
  'q2BendExit',
  'q3Approach',
  'q3FirstLoopComplete',
  'q3SecondLoopComplete',
  'reassuranceApproach',
  'reassuranceLoopComplete',
  'taperEnd',
];

export type RibbonPacingAnchor = {
  id: RibbonMarkerId;
  scrollLocalY: number;
  pathLength: number;
};

type MarkerPoint = { id: RibbonMarkerId; point: RibbonPoint };
type PacingInput = {
  lookup: PathLookup;
  markers: Record<RibbonMarkerId, RibbonPoint>;
  stops: BuiltJourneyPath['stops'];
  viewportHeight: number;
};

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function distance(sample: PathSample, point: RibbonPoint) {
  return Math.hypot(sample.localX - point.x, sample.localY - point.y);
}
function samePoint(a: RibbonPoint | undefined, b: RibbonPoint | undefined) {
  return Boolean(a && b && Math.hypot(a.x - b.x, a.y - b.y) < 0.5);
}

function localMinimaAfter(samples: readonly PathSample[], point: RibbonPoint, minimumLength: number) {
  const start = samples.findIndex((sample) => sample.length > minimumLength + 0.001);
  if (start < 0) return [];
  const minima: PathSample[] = [];
  for (let index = Math.max(1, start); index < samples.length - 1; index += 1) {
    const sample = samples[index]!;
    if (sample.length <= minimumLength + 0.001) continue;
    const currentDistance = distance(sample, point);
    if (currentDistance <= distance(samples[index - 1]!, point) && currentDistance <= distance(samples[index + 1]!, point)) minima.push(sample);
  }
  const final = samples.at(-1);
  if (final && final.length > minimumLength + 0.001 && distance(final, point) <= distance(samples.at(-2) ?? final, point)) minima.push(final);
  return minima;
}

export function resolveMarkerLengths(
  lookup: PathLookup,
  orderedMarkers: readonly MarkerPoint[],
): Record<RibbonMarkerId, number> {
  const result = {} as Record<RibbonMarkerId, number>;
  let previousLength = -1;

  for (let index = 0; index < orderedMarkers.length; index += 1) {
    const marker = orderedMarkers[index]!;
    const minima = localMinimaAfter(lookup.samples, marker.point, previousLength);
    const skipEntryPass = marker.id === 'q3FirstLoopComplete'
      && samePoint(marker.point, orderedMarkers[index + 1]?.point);
    let sample: PathSample | undefined = minima[skipEntryPass ? 1 : 0];

    if (!sample) {
      sample = lookup.samples
        .filter((candidate) => candidate.length > previousLength + 0.001)
        .reduce<PathSample | undefined>((nearest, candidate) => (
          !nearest || distance(candidate, marker.point) < distance(nearest, marker.point) ? candidate : nearest
        ), undefined);
    }

    const minimumAdvance = Math.max(0.001, lookup.totalLength * 0.000001);
    const resolved = Math.min(lookup.totalLength, Math.max(previousLength + minimumAdvance, sample?.length ?? lookup.totalLength));
    result[marker.id] = resolved;
    previousLength = resolved;
  }

  return result;
}

function pushAnchor(
  anchors: RibbonPacingAnchor[],
  id: RibbonMarkerId,
  desiredScrollLocalY: number,
  markerLengths: Record<RibbonMarkerId, number>,
) {
  const previous = anchors.at(-1);
  anchors.push({
    id,
    scrollLocalY: Math.max(desiredScrollLocalY, (previous?.scrollLocalY ?? -1) + 1),
    pathLength: Math.max(markerLengths[id], (previous?.pathLength ?? -1) + 0.001),
  });
}

export function buildRibbonPacingAnchors({ lookup, markers, stops, viewportHeight }: PacingInput): RibbonPacingAnchor[] {
  const safeViewportHeight = Math.max(1, viewportHeight);
  const orderedMarkers = RIBBON_MARKER_ORDER.map((id) => ({ id, point: markers[id] }));
  const markerLengths = resolveMarkerLengths(lookup, orderedMarkers);
  markerLengths.taperEnd = lookup.totalLength;

  const q1Start = Math.max(1, stops.q1.revealLocalY - safeViewportHeight * stops.q1.revealViewportRatio);
  const q3NaturalStart = Math.max(1, stops.q3.revealLocalY - safeViewportHeight * stops.q3.revealViewportRatio);
  const reassuranceNaturalStart = Math.max(1, stops.reassurance.revealLocalY - safeViewportHeight * stops.reassurance.revealViewportRatio);
  const anchors: RibbonPacingAnchor[] = [];

  pushAnchor(anchors, 'openingExit', 0, markerLengths);
  pushAnchor(anchors, 'q1Approach', q1Start, markerLengths);
  pushAnchor(anchors, 'q1WrapFront', q1Start + safeViewportHeight * 0.16, markerLengths);
  pushAnchor(anchors, 'q1WrapBack', q1Start + safeViewportHeight * 0.34, markerLengths);
  pushAnchor(anchors, 'q1WrapExit', q1Start + safeViewportHeight * 0.55, markerLengths);

  const q1ExitScroll = anchors.at(-1)!.scrollLocalY;
  pushAnchor(anchors, 'q2BendExit', q1ExitScroll + safeViewportHeight * 0.32, markerLengths);
  const earliestQ3Start = anchors.at(-1)!.scrollLocalY + 1;
  const q3Start = Math.max(q3NaturalStart, earliestQ3Start);
  pushAnchor(anchors, 'q3Approach', q3Start, markerLengths);
  pushAnchor(anchors, 'q3FirstLoopComplete', q3Start + safeViewportHeight * 0.22, markerLengths);
  pushAnchor(anchors, 'q3SecondLoopComplete', q3Start + safeViewportHeight * 0.44, markerLengths);

  const earliestReassuranceStart = anchors.at(-1)!.scrollLocalY + 1;
  const reassuranceStart = Math.max(reassuranceNaturalStart, earliestReassuranceStart);
  pushAnchor(anchors, 'reassuranceApproach', reassuranceStart, markerLengths);
  pushAnchor(anchors, 'reassuranceLoopComplete', reassuranceStart + safeViewportHeight * 0.5, markerLengths);
  pushAnchor(anchors, 'taperEnd', anchors.at(-1)!.scrollLocalY + safeViewportHeight * 0.24, markerLengths);

  return anchors;
}

export function resolvePacedLength(anchors: readonly RibbonPacingAnchor[], scrollLocalY: number) {
  if (!anchors.length) return 0;
  if (scrollLocalY <= anchors[0]!.scrollLocalY) return anchors[0]!.pathLength;
  if (scrollLocalY >= anchors.at(-1)!.scrollLocalY) return anchors.at(-1)!.pathLength;

  let low = 0;
  let high = anchors.length - 1;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (anchors[middle]!.scrollLocalY <= scrollLocalY) low = middle;
    else high = middle;
  }

  const lower = anchors[low]!;
  const upper = anchors[high]!;
  const progress = clamp((scrollLocalY - lower.scrollLocalY) / Math.max(0.001, upper.scrollLocalY - lower.scrollLocalY), 0, 1);
  const eased = progress * progress * (3 - 2 * progress);
  return lower.pathLength + (upper.pathLength - lower.pathLength) * eased;
}
