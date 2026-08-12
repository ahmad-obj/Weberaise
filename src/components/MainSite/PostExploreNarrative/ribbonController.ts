'use client';

import gsap from 'gsap';
import type { BuiltJourneyPath } from './buildJourneyPath';
import type { JourneyStopId } from './journeyRoute';
import { buildPathLookup, resolveLengthForDocumentY } from './pathLookup';

export const HEAD_BAND_MIN = 0.45;
export const HEAD_BAND_MAX = 0.58;
export const HEAD_NOMINAL = 0.52;

const ACQUISITION_START = 0.12;
const ACQUISITION_DISTANCE = 0.46;

type RibbonControllerOptions = {
  root: HTMLElement;
  svg: SVGSVGElement;
  measurementPath: SVGPathElement;
  drawPaths: readonly SVGPathElement[];
  openingLocalY: number;
  sampleSpacing: number;
  stops: BuiltJourneyPath['stops'];
  reducedMotion: boolean;
  onReveal: (id: JourneyStopId) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value: number) {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function centerBandRatio(
  scrollY: number,
  viewportHeight: number,
  rootDocumentTop: number,
  stops: BuiltJourneyPath['stops'],
) {
  const nominalDocumentY = scrollY + viewportHeight * HEAD_NOMINAL;
  const zone = Math.max(240, viewportHeight * 0.78);
  let nearest:
    | { delta: number; absoluteDelta: number; bandBias: number }
    | undefined;

  for (const stop of Object.values(stops)) {
    const delta = rootDocumentTop + stop.localY - nominalDocumentY;
    const absoluteDelta = Math.abs(delta);
    if (!nearest || absoluteDelta < nearest.absoluteDelta) {
      nearest = { delta, absoluteDelta, bandBias: stop.bandBias };
    }
  }

  if (!nearest || nearest.absoluteDelta >= zone) return HEAD_NOMINAL;

  const normalized = clamp(nearest.delta / zone, -1, 1);
  const proximity = 1 - Math.abs(normalized);
  const approachDrop = Math.max(0, normalized) * proximity * 0.12;
  const visitLift = proximity * 0.025;
  const biased = HEAD_NOMINAL + approachDrop - visitLift + nearest.bandBias * proximity;

  return clamp(biased, HEAD_BAND_MIN, HEAD_BAND_MAX);
}

export function createRibbonController({
  root,
  svg,
  measurementPath,
  drawPaths,
  openingLocalY,
  sampleSpacing,
  stops,
  reducedMotion,
  onReveal,
}: RibbonControllerOptions): () => void {
  const rootRect = root.getBoundingClientRect();
  const rootDocumentTop = window.scrollY + rootRect.top;
  const lookup = buildPathLookup(measurementPath, svg, rootDocumentTop, sampleSpacing);
  const openingDocumentY = rootDocumentTop + openingLocalY;
  const openingFloor = Math.min(
    lookup.totalLength,
    resolveLengthForDocumentY(lookup, openingDocumentY),
  );
  const initialScrollY = window.scrollY;
  const openingPlayed = root.dataset.ribbonOpened === 'true';
  const revealedStops = new Set<JourneyStopId>();

  for (const id of Object.keys(stops) as JourneyStopId[]) {
    const element = root.querySelector<HTMLElement>(`[data-journey-stop="${id}"]`);
    if (element?.dataset.revealed === 'true') revealedStops.add(id);
  }

  for (const drawPath of drawPaths) {
    drawPath.style.strokeDasharray = `${lookup.totalLength}`;
  }

  const setVisibleLength = (length: number) => {
    const clampedLength = clamp(length, 0, lookup.totalLength);
    for (const drawPath of drawPaths) {
      drawPath.style.strokeDashoffset = `${lookup.totalLength - clampedLength}`;
    }
  };

  let latestResolvedLength = 0;
  let latestTargetDocumentY = rootDocumentTop;
  let raf = 0;
  const introState = { opening: openingPlayed || reducedMotion ? openingFloor : 0 };

  const revealReachedStops = () => {
    for (const id of Object.keys(stops) as JourneyStopId[]) {
      if (revealedStops.has(id)) continue;
      const stop = stops[id];
      const revealDocumentY = rootDocumentTop + stop.revealLocalY;
      if (latestTargetDocumentY < revealDocumentY) continue;

      revealedStops.add(id);
      onReveal(id);
    }
  };

  const renderFromScroll = () => {
    raf = 0;
    const viewportHeight = Math.max(1, window.innerHeight);
    const travel = Math.max(0, window.scrollY - initialScrollY);
    const acquisition = reducedMotion
      ? 1
      : smoothstep(travel / Math.max(1, viewportHeight * ACQUISITION_DISTANCE));
    const trackedRatio = centerBandRatio(
      window.scrollY,
      viewportHeight,
      rootDocumentTop,
      stops,
    );
    const desiredViewportRatio =
      ACQUISITION_START + (trackedRatio - ACQUISITION_START) * acquisition;

    latestTargetDocumentY = window.scrollY + viewportHeight * desiredViewportRatio;
    latestResolvedLength = travel > 1
      ? resolveLengthForDocumentY(lookup, latestTargetDocumentY)
      : 0;

    const opening = root.dataset.ribbonOpened === 'true'
      ? openingFloor
      : introState.opening;
    setVisibleLength(Math.max(opening, latestResolvedLength));

    if (travel > 1) revealReachedStops();
  };

  const queueRender = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(renderFromScroll);
  };

  const handleScroll = () => queueRender();
  window.addEventListener('scroll', handleScroll, { passive: true });

  let introTween: gsap.core.Tween | null = null;

  if (openingPlayed || reducedMotion) {
    root.dataset.ribbonOpened = 'true';
    setVisibleLength(Math.max(openingFloor, latestResolvedLength));
    queueRender();
  } else {
    setVisibleLength(0);
    introTween = gsap.to(introState, {
      opening: openingFloor,
      duration: 0.82,
      ease: 'power2.out',
      onUpdate: () => {
        setVisibleLength(Math.max(introState.opening, latestResolvedLength));
      },
      onComplete: () => {
        root.dataset.ribbonOpened = 'true';
        queueRender();
      },
    });
  }

  return () => {
    window.removeEventListener('scroll', handleScroll);
    if (raf) window.cancelAnimationFrame(raf);
    introTween?.kill();
  };
}
