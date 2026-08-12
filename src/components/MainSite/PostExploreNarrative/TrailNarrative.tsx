'use client';

import { useLayoutEffect, useRef } from 'react';
import { ParticleReassurance } from './ParticleReassurance';
import { DESKTOP_TRAIL, MOBILE_TRAIL } from './trailPath';
import { createTrailMotion } from './trailMotion';
import styles from './PostExploreNarrative.module.css';

export function TrailNarrative({
  questions,
  reassurance,
}: {
  questions: readonly string[];
  reassurance: string;
}) {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cleanup = createTrailMotion(root, motionQuery.matches);

    const handleMotionPreference = () => {
      cleanup();
      cleanup = createTrailMotion(root, motionQuery.matches);
    };

    motionQuery.addEventListener('change', handleMotionPreference);

    return () => {
      motionQuery.removeEventListener('change', handleMotionPreference);
      cleanup();
    };
  }, []);

  return (
    <section ref={rootRef} className={styles.trailScroll} data-trail-narrative>
      <div className={styles.trailStage}>
        <svg
          className={`${styles.trailSvg} ${styles.trailSvgDesktop}`}
          viewBox={DESKTOP_TRAIL.viewBox}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className={styles.trailPath} data-trail-path="desktop" d={DESKTOP_TRAIL.d} />
        </svg>

        <svg
          className={`${styles.trailSvg} ${styles.trailSvgMobile}`}
          viewBox={MOBILE_TRAIL.viewBox}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className={styles.trailPath} data-trail-path="mobile" d={MOBILE_TRAIL.d} />
        </svg>

        <div className={styles.trailQuestions}>
          {questions.map((question, index) => {
            const positionClass = [
              styles.trailQuestionOne,
              styles.trailQuestionTwo,
              styles.trailQuestionThree,
            ][index];

            return (
              <h2
                className={`${styles.trailQuestion} ${positionClass ?? ''}`}
                data-trail-question={index}
                data-visited="false"
                key={question}
              >
                {question}
              </h2>
            );
          })}
        </div>

        <ParticleReassurance text={reassurance} />
      </div>
    </section>
  );
}
