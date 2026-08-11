'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createProgressController } from '@/experience/loading/progressController';
import { createCriticalAssetRegistry, preloadImage } from '@/experience/loading/criticalAssetRegistry';
import { LoaderCountdown } from './LoaderCountdown';
import { LoaderCompletion } from './LoaderCompletion';

type LoaderProps = {
  phase: 'loading' | 'loaderCompletion';
  onCriticalReady: () => void;
  onComplete: () => void;
  reducedMotion: boolean;
};

function fontReady(): Promise<void> {
  return document.fonts.ready.then(() => undefined);
}

export function Loader({ phase, onCriticalReady, onComplete, reducedMotion }: LoaderProps) {
  const progress = useRef(createProgressController());
  const [display, setDisplay] = useState(100);
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });
  const criticalDispatched = useRef(false);

  const registry = useMemo(
    () => createCriticalAssetRegistry([
      { id: 'fonts', weight: 3, run: fontReady },
      { id: 'brand', weight: 1, run: () => preloadImage('/brand/weberaise-horizontal-on-dark.svg') },
      { id: 'hero-code', weight: 2, run: () => import('@/webgl/reveal/createRevealEngine').then((module) => module.warmRevealEngine()).catch(() => undefined) },
    ]),
    [],
  );

  useEffect(() => {
    const updateViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    updateViewport();
    window.addEventListener('resize', updateViewport, { passive: true });
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (phase !== 'loading') return;
    const unsubscribe = registry.subscribe((snapshot) => progress.current.updateRealProgress(snapshot.progress));
    void registry.start();
    return unsubscribe;
  }, [phase, registry]);

  const step = useCallback(() => {
    const snapshot = progress.current.snapshot();
    if (display <= snapshot.target) return;
    const next = progress.current.nextDisplay();
    setDisplay(next);
  }, [display]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const snapshot = progress.current.snapshot();
    if (display === 0 && snapshot.ready && !criticalDispatched.current) {
      criticalDispatched.current = true;
      onCriticalReady();
      return;
    }
    if (display <= snapshot.target) return;

    const distance = display - snapshot.target;
    const delay = reducedMotion ? 4 : distance > 55 ? 12 : distance > 20 ? 18 : distance > 6 ? 28 : 42;
    const timer = window.setTimeout(step, delay);
    return () => window.clearTimeout(timer);
  }, [display, onCriticalReady, phase, reducedMotion, step]);

  if (phase === 'loaderCompletion') {
    return <LoaderCompletion onComplete={onComplete} reducedMotion={reducedMotion} />;
  }

  return (
    <section className="loader" aria-label="Loading Weberaise">
      <p className="sr-only" role="status">Preparing the Weberaise experience.</p>
      <LoaderCountdown value={display} viewport={viewport} />
    </section>
  );
}
