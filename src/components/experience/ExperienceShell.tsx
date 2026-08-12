'use client';

import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { Loader } from '@/components/experience/Loader/Loader';
import { Hero } from '@/components/experience/Hero/Hero';
import { SiteNavigation } from '@/components/navigation/SiteNavigation';
import {
  experienceReducer,
  INITIAL_EXPERIENCE_STATE,
} from '@/experience/state/experienceReducer';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ExperienceShell({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(experienceReducer, INITIAL_EXPERIENCE_STATE);
  const reducedMotion = useMemo(prefersReducedMotion, []);

  useEffect(() => {
    dispatch({ type: 'START_LOADING' });
  }, []);

  useEffect(() => {
    const locked = state !== 'main';
    document.documentElement.dataset.experienceState = state;
    document.documentElement.classList.toggle('experience-scroll-locked', locked);
    return () => document.documentElement.classList.remove('experience-scroll-locked');
  }, [state]);

  const onCriticalReady = useCallback(() => dispatch({ type: 'CRITICAL_READY' }), []);
  const onLoaderComplete = useCallback(() => dispatch({ type: 'LOADER_COMPLETE' }), []);
  const onHeroOpened = useCallback(() => dispatch({ type: 'HERO_OPENED' }), []);
  const onExplore = useCallback(() => dispatch({ type: 'EXPLORE' }), []);
  const onExploreComplete = useCallback(() => dispatch({ type: 'EXPLORE_COMPLETE' }), []);

  const showLoader = state === 'loading' || state === 'loaderCompletion';
  const showHero = state === 'heroOpening' || state === 'heroInteractive' || state === 'heroExiting';

  return (
    <div className="experience-shell" data-experience-state={state}>
      <div className="intro-stage">
        {showLoader && (
          <Loader
            phase={state}
            onCriticalReady={onCriticalReady}
            onComplete={onLoaderComplete}
            reducedMotion={reducedMotion}
          />
        )}
        {showHero && (
          <Hero
            phase={state}
            reducedMotion={reducedMotion}
            onOpened={onHeroOpened}
            onExplore={onExplore}
            onExploreComplete={onExploreComplete}
          />
        )}
      </div>
      <div className="main-stage" inert={state !== 'main'} aria-hidden={state !== 'main'}>
        {state === 'main' && <SiteNavigation mode="main" />}
        {children}
      </div>
    </div>
  );
}
