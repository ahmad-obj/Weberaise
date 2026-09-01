'use client';

import { ShutterTextPlaceholder } from '@/components/ui/ShutterTextPlaceholder';
import { useLayoutEffect, useRef, useState } from 'react';
import type { BuiltJourneyPath } from './buildJourneyPath';
import { JourneyArtwork } from './JourneyArtwork';
import { JourneyStop } from './JourneyStop';
import { loadPostExploreRuntime, type PostExploreRuntime } from './postExploreRuntime';
import { RibbonBackLayer, RibbonFrontLayer } from './RibbonTrail';
import type { JourneyStopId } from './journeyRoute';
import styles from './PostExploreNarrative.module.css';

type JourneyGeometry = BuiltJourneyPath & { sampleSpacing: number };

function LookQuestion() {
  return (
    <>
      <span className={styles.q3Line} data-q3-line="lead">
        Need to <span className={styles.lookWord} data-look-word>L<span data-ribbon-glyph="look-o-1">O</span><span data-ribbon-glyph="look-o-2">O</span>K</span>
      </span>
      <span className={styles.q3Line} data-q3-line="finish"><span data-q3-finish-copy>better online?</span></span>
    </>
  );
}

export function JourneyNarrative({ questions, reassurance }: { questions: readonly string[]; reassurance: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const backSvgRef = useRef<SVGSVGElement>(null);
  const backBasePathRef = useRef<SVGPathElement>(null);
  const backHighlightPathRef = useRef<SVGPathElement>(null);
  const frontBasePathRef = useRef<SVGPathElement>(null);
  const frontHighlightPathRef = useRef<SVGPathElement>(null);
  const taperRevealPathRef = useRef<SVGPathElement>(null);
  const [geometry, setGeometry] = useState<JourneyGeometry | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [reassuranceActive, setReassuranceActive] = useState(false);
  const [ShutterTextRuntime, setShutterTextRuntime] = useState<PostExploreRuntime['ShutterText'] | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const shell = root.closest<HTMLElement>('[data-experience-state]');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let started = false;
    let disposed = false;
    let runtime: PostExploreRuntime | null = null;
    let experienceObserver: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let rebuildTimer = 0;
    let rebuildFrame = 0;
    let lastWidth = 0;
    let lastHeight = 0;
    setReducedMotion(motionQuery.matches);

    const rebuild = () => {
      if (!runtime) return;
      const config = runtime.getJourneyRoute(window.innerWidth);
      const built = runtime.buildJourneyPath(root, config);
      lastWidth = built.width;
      lastHeight = built.height;
      setGeometry({ ...built, sampleSpacing: config.sampleSpacing });
    };
    const scheduleRebuild = () => {
      window.clearTimeout(rebuildTimer);
      rebuildTimer = window.setTimeout(() => {
        if (rebuildFrame) window.cancelAnimationFrame(rebuildFrame);
        rebuildFrame = window.requestAnimationFrame(() => { rebuildFrame = 0; rebuild(); });
      }, 120);
    };
    const startJourney = async () => {
      if (started || disposed || (shell && shell.dataset.experienceState !== 'main')) return;
      started = true;
      runtime = await loadPostExploreRuntime();
      if (disposed) return;
      setShutterTextRuntime(() => runtime!.ShutterText);
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (Math.abs(entry.contentRect.width - lastWidth) > 4 || Math.abs(entry.contentRect.height - lastHeight) > 4) scheduleRebuild();
      });
      resizeObserver.observe(root);
      window.addEventListener('orientationchange', scheduleRebuild, { passive: true });
      scheduleRebuild();
    };
    if (shell && shell.dataset.experienceState !== 'main') {
      experienceObserver = new MutationObserver(() => {
        if (shell.dataset.experienceState === 'main') {
          void startJourney();
          experienceObserver?.disconnect();
          experienceObserver = null;
        }
      });
      experienceObserver.observe(shell, { attributes: true, attributeFilter: ['data-experience-state'] });
    } else void startJourney();
    const handleMotionPreference = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    motionQuery.addEventListener('change', handleMotionPreference);
    return () => {
      disposed = true;
      experienceObserver?.disconnect();
      resizeObserver?.disconnect();
      motionQuery.removeEventListener('change', handleMotionPreference);
      window.removeEventListener('orientationchange', scheduleRebuild);
      window.clearTimeout(rebuildTimer);
      if (rebuildFrame) window.cancelAnimationFrame(rebuildFrame);
    };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const svg = backSvgRef.current;
    const backBasePath = backBasePathRef.current;
    const backHighlightPath = backHighlightPathRef.current;
    const frontBasePath = frontBasePathRef.current;
    const frontHighlightPath = frontHighlightPathRef.current;
    const taperRevealPath = taperRevealPathRef.current;
    if (!root || !svg || !backBasePath || !backHighlightPath || !frontBasePath || !frontHighlightPath || !taperRevealPath || !geometry?.d) return undefined;
    let disposed = false;
    let cleanupController: () => void = () => undefined;
    const frame = window.requestAnimationFrame(() => {
      void loadPostExploreRuntime().then((runtimeModule) => {
        if (disposed) return;
        cleanupController = runtimeModule.createRibbonController({
          root,
          svg,
          measurementPath: backBasePath,
          drawPaths: [backBasePath, backHighlightPath, frontBasePath, frontHighlightPath],
          openingLocalY: geometry.openingLocalY,
          sampleSpacing: geometry.sampleSpacing,
          stops: geometry.stops,
          markerProgress: geometry.markerProgress,
          taper: { revealPath: taperRevealPath, startLocalY: geometry.taper.startLocalY },
          reducedMotion,
          onReveal: (id: JourneyStopId) => {
            const anchor = root.querySelector<HTMLElement>(`[data-journey-stop="${id}"]`);
            if (!anchor || anchor.dataset.revealed === 'true') return;
            if (id === 'reassurance') setReassuranceActive(true);
            else {
              const target = anchor.querySelector<HTMLElement>('[data-journey-question]');
              if (target) runtimeModule.revealJourneyStop(target, reducedMotion);
            }
            anchor.dataset.revealed = 'true';
          },
        });
      });
    });
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      cleanupController();
    };
  }, [geometry, reducedMotion]);

  const width = geometry?.width ?? 1;
  const height = geometry?.height ?? 1;
  const pathD = geometry?.d ?? '';
  const frontClipRects = geometry?.frontClipRects ?? [];
  const taper = geometry?.taper ?? { startLocalY: height, centerlineD: '', polygonPoints: [] };

  return (
    <section ref={rootRef} className={styles.journey} data-journey>
      <RibbonBackLayer d={pathD} width={width} height={height} svgRef={backSvgRef} backBasePathRef={backBasePathRef} backHighlightPathRef={backHighlightPathRef} taperRevealPathRef={taperRevealPathRef} taper={taper} />
      <div className={styles.journeyContent}>
        <div className={styles.journeyLead} aria-hidden="true" />
        <JourneyStop id="q1" align="left"><div className={`${styles.journeyBeat} ${styles.journeyBeatTextLeft} ${styles.journeyBeatQ1}`}><h2 className={styles.journeyQuestion} data-journey-question>{questions[0]}</h2><JourneyArtwork id="q1" label="Layered website concept with a storefront on its platform" /></div></JourneyStop>
        <JourneyStop id="q2" align="right"><div className={`${styles.journeyBeat} ${styles.journeyBeatTextRight} ${styles.journeyBeatQ2}`}><JourneyArtwork id="q2" label="Layered website redesign composition" /><h2 className={styles.journeyQuestion} data-journey-question data-ribbon-question="q2">{questions[1]}</h2></div></JourneyStop>
        <JourneyStop id="q3" align="center"><div className={styles.journeyBeatQ3}><h2 className={`${styles.journeyQuestion} ${styles.journeyQuestionQ3}`} data-journey-question><LookQuestion /></h2></div></JourneyStop>
        <JourneyStop id="reassurance" align="center"><h2 className={styles.reassuranceHeading} data-reassurance-text aria-label={reassurance}>{ShutterTextRuntime ? <ShutterTextRuntime lines={['DONT WORRY.', 'WE GOT YOU']} active={reassuranceActive} /> : <ShutterTextPlaceholder lines={['DONT WORRY.', 'WE GOT YOU']} />}</h2></JourneyStop>
      </div>
      <RibbonFrontLayer d={pathD} width={width} height={height} frontBasePathRef={frontBasePathRef} frontHighlightPathRef={frontHighlightPathRef} frontClipRects={frontClipRects} />
    </section>
  );
}
