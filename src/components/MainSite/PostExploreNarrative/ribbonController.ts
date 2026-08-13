'use client';

import gsap from 'gsap';
import type { BuiltJourneyPath } from './buildJourneyPath';
import type { JourneyStopId } from './journeyRoute';
import { buildPathLookup, resolveLengthForDocumentY } from './pathLookup';
import { buildRibbonPacingAnchors, resolvePacedLength } from './ribbonPacing';

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

    if (taper) {
      const taperProgress = clamp((clampedLength - taperStartLength) / canonicalTaperLength, 0, 1);
      const taperVisible = taperTotalLength * taperProgress;
      taper.revealPath.style.strokeDashoffset = `${taperTotalLength - taperVisible}`;
    }
  };

  let latestResolvedLength = 0;
  let raf = 0;
  const introState = { opening: openingPlayed || reducedMotion ? openingFloor : 0 };
  const drawState = { visibleLength: openingPlayed || reducedMotion ? openingFloor : 0 };
  const scrubSeconds = window.innerWidth <= 720 ? 0.14 : 0.18;
  let scrubTween: gsap.core.Tween | null = null;

  const applyVisibleLength = (length: number) => {
    drawState.visibleLength = length;
    setVisibleLength(length);
  };

  const scrubTo = (targetLength: number) => {
    scrubTween?.kill();
    if (reducedMotion) {
      applyVisibleLength(targetLength);
      return;
    }
    scrubTween = gsap.to(drawState, {
      visibleLength: targetLength,
      duration: scrubSeconds,
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
    const opening = root.dataset.ribbonOpened === 'true' ? openingFloor : introState.opening;
    scrubTo(Math.max(opening, latestResolvedLength));
    revealReachedStops(viewportHeight);
  };

  const queueRender = () => {
    if (!raf) raf = window.requestAnimationFrame(renderFromScroll);
  };
  const handleScroll = () => queueRender();
  window.addEventListener('scroll', handleScroll, { passive: true });

  let introTween: gsap.core.Tween | null = null;
  if (openingPlayed || reducedMotion) {
    root.dataset.ribbonOpened = 'true';
    renderFromScroll();
  } else {
    setVisibleLength(0);
    introTween = gsap.to(introState, {
      opening: openingFloor,
      duration: 0.82,
      ease: 'power2.out',
      onUpdate: () => applyVisibleLength(Math.max(introState.opening, latestResolvedLength)),
      onComplete: () => {
        root.dataset.ribbonOpened = 'true';
        queueRender();
      },
    });
    queueRender();
  }

  return () => {
    window.removeEventListener('scroll', handleScroll);
    if (raf) window.cancelAnimationFrame(raf);
    scrubTween?.kill();
    introTween?.kill();
  };
}
