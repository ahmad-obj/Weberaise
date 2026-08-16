'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './WorkPage.module.css';

type WorkOpeningProps = {
  ready: boolean;
  reducedMotion: boolean;
  onComplete(): void;
};

const MIN_OPENING_MS = 900;

export function WorkOpening({ ready, reducedMotion, onComplete }: WorkOpeningProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const completedRef = useRef(false);
  const [minimumBeatComplete, setMinimumBeatComplete] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumBeatComplete(true), MIN_OPENING_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    if (!ready || !minimumBeatComplete || completedRef.current || !textRef.current) return undefined;
    completedRef.current = true;
    const duration = reducedMotion ? 0.16 : 0.34;
    const tween = gsap.to(textRef.current, {
      yPercent: -115,
      opacity: 0,
      duration,
      ease: 'power3.inOut',
      onComplete,
    });
    return () => {
      tween.kill();
    };
  }, [minimumBeatComplete, onComplete, ready, reducedMotion]);

  return (
    <div className={styles.opening} data-work-opening>
      <h1 className={styles.openingMask}>
        <span ref={textRef} className={styles.openingText}>OUR WORKS</span>
      </h1>
    </div>
  );
}
