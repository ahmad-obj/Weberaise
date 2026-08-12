'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { BuiltJourneyPath } from './buildJourneyPath';
import { buildJourneyPath } from './buildJourneyPath';
import { JourneyArtwork } from './JourneyArtwork';
import { JourneyStop } from './JourneyStop';
import { ParticleReassurance } from './ParticleReassurance';
import { revealJourneyStop } from './questionReveal';
import { RibbonBackLayer, RibbonFrontLayer } from './RibbonTrail';
import { createRibbonController } from './ribbonController';
import { getJourneyRoute, type JourneyStopId } from './journeyRoute';
import styles from './PostExploreNarrative.module.css';

type JourneyGeometry = BuiltJourneyPath & {
  sampleSpacing: number;
};

function LookQuestion({ text }: { text: string }) {
  const match = text.match(/^(.*?)(look)(.*)$/i);
  if (!match) return <>{text}</>;

  return (
    <>
      {match[1]}
      <span className={styles.lookWord} data-look-word>
        l<span data-ribbon-glyph="look-o-1">o</span><span data-ribbon-glyph="look-o-2">o</span>k
      </span>
      {match[3]}
    </>
  );
}

export function JourneyNarrative({
  questions,
  reassurance,
}: {
  questions: readonly string[];
  reassurance: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const backSvgRef = useRef<SVGSVGElement>(null);
  const backPathRef = useRef<SVGPathElement>(null);
  const frontPathRef = useRef<SVGPathElement>(null);
  const [geometry, setGeometry] = useState<JourneyGeometry | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const shell = root.closest<HTMLElement>('[data-experience-state]');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let started = false;
    let experienceObserver: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let rebuildTimer = 0;
    let rebuildFrame = 0;
    let lastWidth = 0;
    let lastHeight = 0;

    setReducedMotion(motionQuery.matches);

    const rebuild = () => {
      const config = getJourneyRoute(window.innerWidth);
      const built = buildJourneyPath(root, config);
      lastWidth = built.width;
      lastHeight = built.height;
      setGeometry({ ...built, sampleSpacing: config.sampleSpacing });
    };

    const scheduleRebuild = () => {
      window.clearTimeout(rebuildTimer);
      rebuildTimer = window.setTimeout(() => {
        if (rebuildFrame) window.cancelAnimationFrame(rebuildFrame);
        rebuildFrame = window.requestAnimationFrame(() => {
          rebuildFrame = 0;
          rebuild();
        });
      }, 120);
    };

    const startJourney = () => {
      if (started) return;
      if (shell && shell.dataset.experienceState !== 'main') return;
      started = true;
      rebuild();

      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const widthChanged = Math.abs(entry.contentRect.width - lastWidth) > 4;
        const heightChanged = Math.abs(entry.contentRect.height - lastHeight) > 4;
        if (widthChanged || heightChanged) scheduleRebuild();
      });
      resizeObserver.observe(root);
      window.addEventListener('orientationchange', scheduleRebuild, { passive: true });
    };

    if (shell && shell.dataset.experienceState !== 'main') {
      experienceObserver = new MutationObserver(() => {
        if (shell.dataset.experienceState === 'main') {
          startJourney();
          experienceObserver?.disconnect();
          experienceObserver = null;
        }
      });
      experienceObserver.observe(shell, {
        attributes: true,
        attributeFilter: ['data-experience-state'],
      });
    } else {
      startJourney();
    }

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    motionQuery.addEventListener('change', handleMotionPreference);

    return () => {
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
    const measurementPath = backPathRef.current;
    const frontPath = frontPathRef.current;
    if (!root || !svg || !measurementPath || !frontPath || !geometry?.d) return undefined;

    let cleanupController: () => void = () => undefined;
    const frame = window.requestAnimationFrame(() => {
      cleanupController = createRibbonController({
        root,
        svg,
        measurementPath,
        drawPaths: [measurementPath, frontPath],
        openingLocalY: geometry.openingLocalY,
        sampleSpacing: geometry.sampleSpacing,
        stops: geometry.stops,
        reducedMotion,
        onReveal: (id: JourneyStopId) => {
          const anchor = root.querySelector<HTMLElement>(`[data-journey-stop="${id}"]`);
          if (!anchor || anchor.dataset.revealed === 'true') return;

          if (id !== 'reassurance') {
            const target = anchor.querySelector<HTMLElement>('[data-journey-question]');
            if (target) revealJourneyStop(target, reducedMotion);
          }

          anchor.dataset.revealed = 'true';
        },
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      cleanupController();
    };
  }, [geometry, reducedMotion]);

  const width = geometry?.width ?? 1;
  const height = geometry?.height ?? 1;
  const pathD = geometry?.d ?? '';
  const frontClipRects = geometry?.frontClipRects ?? [];

  return (
    <section ref={rootRef} className={styles.journey} data-journey>
      <RibbonBackLayer
        d={pathD}
        width={width}
        height={height}
        svgRef={backSvgRef}
        backPathRef={backPathRef}
      />

      <div className={styles.journeyContent}>
        <div className={styles.journeyLead} aria-hidden="true" />

        <JourneyStop id="q1" align="left">
          <div className={`${styles.journeyBeat} ${styles.journeyBeatTextLeft}`}>
            <h2 className={styles.journeyQuestion} data-journey-question>
              {questions[0]}
            </h2>
            <JourneyArtwork id="q1" label="Website concept artwork placeholder" />
          </div>
        </JourneyStop>

        <JourneyStop id="q2" align="right">
          <div className={`${styles.journeyBeat} ${styles.journeyBeatTextRight}`}>
            <JourneyArtwork id="q2" label="Website redesign artwork placeholder" />
            <h2 className={styles.journeyQuestion} data-journey-question>
              {questions[1]}
            </h2>
          </div>
        </JourneyStop>

        <JourneyStop id="q3" align="left">
          <div className={`${styles.journeyBeat} ${styles.journeyBeatTextLeft}`}>
            <h2 className={styles.journeyQuestion} data-journey-question>
              <LookQuestion text={questions[2] ?? ''} />
            </h2>
            <JourneyArtwork id="q3" label="Online presence artwork placeholder" />
          </div>
        </JourneyStop>

        <JourneyStop id="reassurance" align="center">
          <ParticleReassurance text={reassurance} />
        </JourneyStop>
      </div>

      <RibbonFrontLayer
        d={pathD}
        width={width}
        height={height}
        frontPathRef={frontPathRef}
        frontClipRects={frontClipRects}
      />
    </section>
  );
}
