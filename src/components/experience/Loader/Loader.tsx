'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createProgressController } from '@/experience/loading/progressController';
import { createCriticalAssetRegistry, preloadImage } from '@/experience/loading/criticalAssetRegistry';
import { countdownDelay, countdownTransitionMs, FINAL_ZERO_HOLD_MS } from '@/experience/loading/countdownTiming';
import { LoaderCountdown } from './LoaderCountdown';
import { LoaderCompletion } from './LoaderCompletion';
import { LoaderCountdownDecoration } from './LoaderCountdownDecoration';

type LoaderProps = {
  phase: 'loading' | 'loaderCompletion';
  onCriticalReady: () => void;
  onComplete: () => void;
  reducedMotion: boolean;
};

type ZeroStyle = CSSProperties & {
  '--loader-digit-transition': string;
};

function fontReady(): Promise<void> {
  return document.fonts.ready.then(() => undefined);
}

async function warmHeroCode(): Promise<void> {
  const [, revealModule] = await Promise.all([
    import('@/components/experience/Hero/Hero'),
    import('@/webgl/reveal/createRevealEngine'),
  ]);
  await revealModule.warmRevealEngine().catch(() => undefined);
}

export function Loader({ phase, onCriticalReady, onComplete, reducedMotion }: LoaderProps) {
  const progress = useRef(createProgressController());
  const [display, setDisplay] = useState(100);
  const [criticalProgress, setCriticalProgress] = useState(0);
  const criticalDispatched = useRef(false);
  const zeroHoldTimer = useRef<number | null>(null);
  const zeroRef = useRef<HTMLSpanElement>(null);

  const registry = useMemo(
    () => createCriticalAssetRegistry([
      { id: 'fonts', weight: 3, run: fontReady },
      { id: 'brand', weight: 1, run: () => preloadImage('/brand/weberaise-horizontal-on-dark.svg') },
      { id: 'hero-code', weight: 2, run: warmHeroCode },
    ]),
    [],
  );

  useEffect(() => {
    if (phase !== 'loading') return;
    const unsubscribe = registry.subscribe((snapshot) => {
      progress.current.updateRealProgress(snapshot.progress);
      setCriticalProgress(snapshot.progress);
    });
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
    if (phase !== 'loading' || display === 0) return;
    const snapshot = progress.current.snapshot();
    if (display <= snapshot.target) return;

    const timer = window.setTimeout(step, countdownDelay(display, snapshot.target, reducedMotion));
    return () => window.clearTimeout(timer);
  }, [display, criticalProgress, phase, reducedMotion, step]);

  useEffect(() => {
    if (phase !== 'loading' || display !== 0 || !progress.current.snapshot().ready || criticalDispatched.current) return;
    if (zeroHoldTimer.current !== null) return;

    zeroHoldTimer.current = window.setTimeout(() => {
      zeroHoldTimer.current = null;
      if (criticalDispatched.current) return;
      criticalDispatched.current = true;
      onCriticalReady();
    }, reducedMotion ? 80 : FINAL_ZERO_HOLD_MS);

    return () => {
      if (zeroHoldTimer.current !== null) {
        window.clearTimeout(zeroHoldTimer.current);
        zeroHoldTimer.current = null;
      }
    };
  }, [criticalProgress, display, onCriticalReady, phase, reducedMotion]);

  const showPersistentZero = display === 0 || phase === 'loaderCompletion';
  const zeroStyle: ZeroStyle = {
    '--loader-digit-transition': `${countdownTransitionMs(0, reducedMotion)}ms`,
  };

  return (
    <section className="loader" aria-label="Loading Weberaise">
      <p className="sr-only" role="status">Preparing the Weberaise experience.</p>

      {phase === 'loading' && (
        <LoaderCountdownDecoration hidden={display === 0} />
      )}

      {showPersistentZero && (
        <div className="loader-persistent-zero-mask" aria-hidden="true">
          <span
            ref={zeroRef}
            data-loader-zero
            className="loader-zero-glyph loader-persistent-zero"
            style={zeroStyle}
          >
            0
          </span>
        </div>
      )}

      {phase === 'loading' && display > 0 && (
        <LoaderCountdown value={display} reducedMotion={reducedMotion} />
      )}

      {phase === 'loaderCompletion' && (
        <LoaderCompletion zeroRef={zeroRef} onComplete={onComplete} reducedMotion={reducedMotion} />
      )}
    </section>
  );
}
