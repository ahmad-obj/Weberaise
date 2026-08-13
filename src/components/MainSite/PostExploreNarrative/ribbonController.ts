'use client';

import gsap from 'gsap';
import type { BuiltJourneyPath } from './buildJourneyPath';
import type { JourneyStopId } from './journeyRoute';
import { buildPathLookup, resolveLengthForDocumentY } from './pathLookup';
import { buildRibbonPacingAnchors, resolvePacedLength } from './ribbonPacing';
import { normalizeRibbonProgress, restoreRibbonLength } from './ribbonProgress';

export const HEAD_BAND_MIN = 0.45;
export const HEAD_BAND_MAX = 0.58;
export const HEAD_NOMINAL = 0.52;

type RibbonTaperController = {
  revealPath: SVGPathElement;
  startLocalY: number;
};

type RibbonControllerOptions = {
  root: HTMLElement;
  svg: SVGSVGElement;
  measurementPath: SVGPathElement;
  drawPaths: readonly SVGPathElement[];
  openingLocalY: number;
  sampleSpacing: number;
  stops: BuiltJourneyPath['stops'];
  markers: BuiltJourneyPath['markers'];
  taper?: RibbonTaperController;
  reducedMotion: boolean;
  onReveal: (id: JourneyStopId) => void;
};

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }

export function createRibbonController({
  root,
  svg,
  measurementPath,
  drawPaths,
  openingLocalY,
  sampleSpacing,
  stops,
  markers,
  taper,
  reducedMotion,
  onReveal,
}: RibbonControllerOptions): () => void {
  const rootRect = root.getBoundingClientRect();
  const rootDocumentTop = window.scrollY + rootRect.top;
  const lookup = buildPathLookup(measurementPath, svg, rootDocumentTop, sampleSpacing);
  const pacingAnchors = buildRibbonPacingAnchors({ lookup, markers, stops, viewportHeight: Math.max(1, window.innerHeight) });
  const openingFloor = pacingAnchors.find((anchor) => anchor.id === 'openingExit')?.pathLength
    ?? Math.min(lookup.totalLength, resolveLengthForDocumentY(lookup, rootDocumentTop + openingLocalY));
  const taperTotalLength = taper?.revealPath.getTotalLength() ?? 0;
  const taperStartLength = taper
    ? Math.max(0, lookup.totalLength - taperTotalLength)
    : lookup.totalLength;
  const canonicalTaperLength = Math.max(0.0001, lookup.totalLength - taperStartLength);
  const openingPlayed = root.dataset.ribbonOpened === 'true';
  const restoredVisibleLength = restoreRibbonLength(
    root.dataset.ribbonVisibleProgress,
    lookup.totalLength,
    openingFloor,
    openingPlayed,
  );
  const revealedStops = new Set<JourneyStopId>();

  for (const id of Object.keys(stops) as JourneyStopId[]) {
    const element = root.querySelector<HTMLElement>(`[data-journey-stop="${id}"]`);
    if (element?.dataset.revealed === 'true') revealedStops.add(id);
  }

  for (const drawPath of drawPaths) drawPath.style.strokeDasharray = `${lookup.totalLength}`;
  if (taper) {
    taper.revealPath.style.strokeDasharray = `${taperTotalLength}`;
    taper.revealPath.style.strokeDashoffset = `${taperTotalLength}`;
  }

  const setVisibleLength = (length: number) => {
    const clampedLength = clamp(length, 0, lookup.totalLength);
    for (const drawPath of drawPaths) drawPath.style.strokeDashoffset = `${lookup.totalLength - clampedLength}`;
    root.dataset.ribbonVisibleProgress = normalizeRibbonProgress(clampedLength, lookup.totalLength).toString();
    if (clampedLength >= openingFloor - 0.01) root.dataset.ribbonOpened = 'true';

    if (taper) {
      const taperProgress = clamp((clampedLength - taperStartLength) / canonicalTaperLength, 0, 1);
      const taperVisible = taperTotalLength * taperProgress;
      taper.revealPath.style.strokeDashoffset = `${taperTotalLength - taperVisible}`;
    }
  };

  let latestResolvedLength = 0;
  let raf = 0;
  const drawState = { visibleLength: restoredVisibleLength };
  const scrubSeconds = window.innerWidth <= 720 ? 0.14 : 0.18;
  let scrubTween: gsap.core.Tween | null = null;

  const scrubTo = (targetLength: number, duration = scrubSeconds) => {
    scrubTween?.kill();
    if (reducedMotion) {
      drawState.visibleLength = targetLength;
      setVisibleLength(targetLength);
      return;
    }
    scrubTween = gsap.to(drawState, {
      visibleLength: targetLength,
      duration,
      ease: 'power1.out',
      overwrite: true,
      onUpdate: () => setVisibleLength(drawState.visibleLength),
    });
  };

  const revealReachedStops = (viewportHeight: number) => {
    for (const id of Object.keys(stops) as JourneyStopId[]) {
      if (revealedStops.has(id)) continue;
      const stop = stops[id];
      const revealDocumentY = window.scrollY + viewportHeight * stop.revealViewportRatio;
      if (revealDocumentY < rootDocumentTop + stop.revealLocalY) continue;
      revealedStops.add(id);
      onReveal(id);
    }
  };

  const renderFromScroll = () => {
    raf = 0;
    const viewportHeight = Math.max(1, window.innerHeight);
    const scrollLocalY = Math.max(0, window.scrollY - rootDocumentTop);
    latestResolvedLength = scrollLocalY > 1 ? resolvePacedLength(pacingAnchors, scrollLocalY) : 0;
    scrubTo(Math.max(openingFloor, latestResolvedLength));
    revealReachedStops(viewportHeight);
  };

  const queueRender = () => {
    if (!raf) raf = window.requestAnimationFrame(renderFromScroll);
  };
  const handleScroll = () => queueRender();
  window.addEventListener('scroll', handleScroll, { passive: true });

  setVisibleLength(restoredVisibleLength);
  if (openingPlayed || reducedMotion) {
    root.dataset.ribbonOpened = 'true';
    renderFromScroll();
  } else {
    const remainingOpening = clamp(
      (openingFloor - restoredVisibleLength) / Math.max(0.001, openingFloor),
      0,
      1,
    );
    scrubTo(openingFloor, 0.82 * remainingOpening);
    revealReachedStops(Math.max(1, window.innerHeight));
  }

  return () => {
    window.removeEventListener('scroll', handleScroll);
    if (raf) window.cancelAnimationFrame(raf);
    scrubTween?.kill();
  };
}
