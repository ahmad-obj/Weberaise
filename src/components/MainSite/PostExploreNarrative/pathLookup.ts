export type PathSample = {
  length: number;
  documentY: number;
};

export type PathLookup = {
  totalLength: number;
  samples: readonly PathSample[];
};

const MIN_TRAVEL_FACTOR = 0.05;
const MIN_DOCUMENT_ADVANCE = 0.02;

export function buildPathLookup(
  path: SVGPathElement,
  svg: SVGSVGElement,
  journeyTop: number,
  sampleSpacing = 12,
): PathLookup {
  const totalLength = path.getTotalLength();
  const svgRect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  const scaleX = viewBox.width > 0 ? svgRect.width / viewBox.width : 1;
  const scaleY = viewBox.height > 0 ? svgRect.height / viewBox.height : 1;
  const sampleCount = Math.max(2, Math.ceil(totalLength / Math.max(4, sampleSpacing)) + 1);
  const samples: PathSample[] = [];

  let previousPoint: DOMPoint | SVGPoint | null = null;
  let lastDocumentY = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < sampleCount; index += 1) {
    const length = Math.min(totalLength, (index / (sampleCount - 1)) * totalLength);
    const point = path.getPointAtLength(length);
    const actualDocumentY = journeyTop + (point.y - viewBox.y) * scaleY;

    if (!previousPoint) {
      samples.push({ length, documentY: actualDocumentY });
      previousPoint = point;
      lastDocumentY = actualDocumentY;
      continue;
    }

    const dx = (point.x - previousPoint.x) * scaleX;
    const dy = (point.y - previousPoint.y) * scaleY;
    const screenTravel = Math.hypot(dx, dy);
    const minimumAdvance = Math.max(MIN_DOCUMENT_ADVANCE, screenTravel * MIN_TRAVEL_FACTOR);
    const documentY = Math.max(actualDocumentY, lastDocumentY + minimumAdvance);

    samples.push({ length, documentY });
    previousPoint = point;
    lastDocumentY = documentY;
  }

  return { totalLength, samples };
}

function binarySearchLowerBound(samples: readonly PathSample[], targetDocumentY: number) {
  let low = 0;
  let high = samples.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if ((samples[mid]?.documentY ?? Number.POSITIVE_INFINITY) < targetDocumentY) low = mid + 1;
    else high = mid;
  }

  return low;
}

export function resolveLengthForDocumentY(lookup: PathLookup, targetDocumentY: number): number {
  const { samples, totalLength } = lookup;
  if (samples.length === 0) return 0;
  if (targetDocumentY <= samples[0]!.documentY) return samples[0]!.length;
  if (targetDocumentY >= samples[samples.length - 1]!.documentY) return totalLength;

  const upperIndex = binarySearchLowerBound(samples, targetDocumentY);
  const upper = samples[upperIndex]!;
  const lower = samples[Math.max(0, upperIndex - 1)]!;
  const span = Math.max(0.0001, upper.documentY - lower.documentY);
  const progress = Math.min(1, Math.max(0, (targetDocumentY - lower.documentY) / span));

  return lower.length + (upper.length - lower.length) * progress;
}
