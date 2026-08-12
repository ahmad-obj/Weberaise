'use client';

import { useEffect, useRef } from 'react';
import { SiteNavigation } from '@/components/navigation/SiteNavigation';
import { runHeroOpenTimeline } from '@/experience/motion/heroOpenTimeline';
import { runExploreTimeline } from '@/experience/motion/exploreTimeline';
import type { RevealEngine } from '@/webgl/reveal/RevealEngine';
import { HeroFrontLayer } from './HeroFrontLayer';
import { HeroRevealLayer } from './HeroRevealLayer';
import { HeroRevealCanvas } from './HeroRevealCanvas';
import { HeroCursor } from './HeroCursor';
import { HeroExploreButton } from './HeroExploreButton';

type HeroProps = {
  phase: 'heroOpening' | 'heroInteractive' | 'heroExiting';
  reducedMotion: boolean;
  onOpened: () => void;
  onExplore: () => void;
  onExploreComplete: () => void;
};

export function Hero({
  phase,
  reducedMotion,
  onOpened,
  onExplore,
  onExploreComplete,
}: HeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const engineRef = useRef<RevealEngine | null>(null);
  const pendingTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (phase !== 'heroOpening' || !rootRef.current) return;
    const controller = runHeroOpenTimeline(rootRef.current, { reducedMotion, onComplete: onOpened });
    return () => controller.kill();
  }, [onOpened, phase, reducedMotion]);

  useEffect(() => {
    if (phase !== 'heroExiting' || !rootRef.current) return;

    const controller = runExploreTimeline(rootRef.current, engineRef.current, {
      reducedMotion,
      onComplete: () => {
        const target = pendingTargetRef.current;
        pendingTargetRef.current = null;
        onExploreComplete();

        if (!target) return;

        const scrollWhenUnlocked = (attempt = 0) => {
          if (
            document.documentElement.classList.contains('experience-scroll-locked') &&
            attempt < 12
          ) {
            window.requestAnimationFrame(() => scrollWhenUnlocked(attempt + 1));
            return;
          }

          const element = document.querySelector<HTMLElement>(target);
          if (!element) return;

          element.scrollIntoView({ behavior: 'auto', block: 'start' });

          if (window.location.hash !== target) {
            window.history.replaceState(null, '', target);
          }
        };

        window.requestAnimationFrame(() => scrollWhenUnlocked());
      },
    });
    return () => controller.kill();
  }, [onExploreComplete, phase, reducedMotion]);

  const handleHeroNavigate = (href: string) => {
    if (phase !== 'heroInteractive') return;
    pendingTargetRef.current = href;
    onExplore();
  };

  return (
    <section
      ref={rootRef}
      className="hero-experience"
      data-hero-interactive={phase === 'heroInteractive' ? 'true' : 'false'}
      aria-label="Welcome to Weberaise"
    >
      <HeroFrontLayer />
      <HeroRevealLayer />

      {(phase === 'heroInteractive' || phase === 'heroExiting') && (
        <SiteNavigation
          mode="hero"
          interactive={phase === 'heroInteractive'}
          onNavigate={handleHeroNavigate}
        />
      )}

      <HeroRevealCanvas
        phase={phase}
        reducedMotion={reducedMotion}
        rootRef={rootRef}
        engineRef={engineRef}
      />
      <HeroCursor active={phase === 'heroInteractive'} rootRef={rootRef} />
      <span className="sr-only">WEBERAISE</span>

      {(phase === 'heroInteractive' || phase === 'heroExiting') && (
        <div data-hero-explore>
          <HeroExploreButton onExplore={onExplore} disabled={phase !== 'heroInteractive'} />
        </div>
      )}

      <div data-hero-exit-fill className="hero-exit-fill" aria-hidden="true" />

      {phase === 'heroOpening' && (
        <div className="hero-opening" aria-hidden="true">
          <div data-hero-curtain-left className="hero-opening__curtain hero-opening__curtain--left" />
          <div data-hero-curtain-right className="hero-opening__curtain hero-opening__curtain--right" />
          <div data-hero-line-left className="hero-opening__line hero-opening__line--left" />
          <div data-hero-line-right className="hero-opening__line hero-opening__line--right" />
        </div>
      )}
    </section>
  );
}
