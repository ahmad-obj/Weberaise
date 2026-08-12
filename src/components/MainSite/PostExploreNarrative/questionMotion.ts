'use client';

// Motion basis: https://reactbits.dev/text-animations/scroll-float
// Source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ScrollFloat/ScrollFloat.tsx

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export type QuestionWindow = {
  enterStart: number;
  enterEnd: number;
  holdEnd: number;
  exitEnd: number;
};

export const QUESTION_WINDOWS: readonly QuestionWindow[] = [
  { enterStart: 0.0, enterEnd: 0.16, holdEnd: 0.25, exitEnd: 0.35 },
  { enterStart: 0.3, enterEnd: 0.46, holdEnd: 0.55, exitEnd: 0.65 },
  { enterStart: 0.6, enterEnd: 0.76, holdEnd: 0.86, exitEnd: 0.96 },
] as const;

const TIMELINE_UNITS = 10;
const ENTER_STAGGER = 0.03;
const EXIT_STAGGER = 0.012;

function tweenDurationForWindow(span: number, itemCount: number, stagger: number, floor: number) {
  return Math.max(floor, span - Math.max(0, itemCount - 1) * stagger);
}

export function createQuestionTimeline(root: HTMLElement, reducedMotion: boolean): () => void {
  if (typeof window === 'undefined') return () => undefined;

  gsap.registerPlugin(ScrollTrigger);

  const headings = Array.from(root.querySelectorAll<HTMLElement>('[data-question-index]'));
  const clock = { value: 0 };
  const timeline = gsap.timeline({
    defaults: { overwrite: 'auto' },
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  // Establish a stable normalized 0..10 timeline even though the final visual event ends at 9.6.
  timeline.to(clock, { value: 1, duration: TIMELINE_UNITS, ease: 'none' }, 0);

  headings.forEach((heading, index) => {
    const window = QUESTION_WINDOWS[index];
    if (!window) return;

    const visual = heading.querySelector<HTMLElement>('[data-question-visual]');
    const characters = Array.from(heading.querySelectorAll<HTMLElement>('[data-question-char]'));
    if (!visual || characters.length === 0) return;

    const enterAt = window.enterStart * TIMELINE_UNITS;
    const enterSpan = (window.enterEnd - window.enterStart) * TIMELINE_UNITS;
    const exitAt = window.holdEnd * TIMELINE_UNITS;
    const exitSpan = (window.exitEnd - window.holdEnd) * TIMELINE_UNITS;

    if (reducedMotion) {
      gsap.set(characters, {
        opacity: 0,
        yPercent: 0,
        scaleX: 1,
        scaleY: 1,
        filter: 'blur(0px)',
      });

      timeline.to(
        characters,
        {
          opacity: 1,
          duration: enterSpan,
          ease: 'power1.out',
        },
        enterAt,
      );
      timeline.to(
        characters,
        {
          opacity: 0,
          duration: exitSpan,
          ease: 'power1.in',
        },
        exitAt,
      );
      return;
    }

    const enterDuration = tweenDurationForWindow(
      enterSpan,
      characters.length,
      ENTER_STAGGER,
      0.45,
    );
    const firstExitSpan = exitSpan * 0.58;
    const finalExitAt = exitAt + exitSpan * 0.45;
    const finalExitSpan = exitSpan * 0.55;
    const firstExitDuration = tweenDurationForWindow(
      firstExitSpan,
      characters.length,
      EXIT_STAGGER,
      0.24,
    );
    const finalExitDuration = tweenDurationForWindow(
      finalExitSpan,
      characters.length,
      EXIT_STAGGER,
      0.2,
    );

    timeline.fromTo(
      characters,
      {
        opacity: 0,
        yPercent: 120,
        scaleY: 2.3,
        scaleX: 0.7,
        filter: 'blur(0px)',
        transformOrigin: '50% 0%',
      },
      {
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        filter: 'blur(0px)',
        duration: enterDuration,
        stagger: ENTER_STAGGER,
        ease: 'power3.out',
      },
      enterAt,
    );

    timeline.to(
      characters,
      {
        yPercent: -24,
        scaleY: 0.96,
        scaleX: 1.03,
        duration: firstExitDuration,
        stagger: EXIT_STAGGER,
        ease: 'power2.in',
      },
      exitAt,
    );

    timeline.to(
      characters,
      {
        opacity: 0,
        yPercent: -34,
        filter: 'blur(3px)',
        duration: finalExitDuration,
        stagger: EXIT_STAGGER,
        ease: 'power2.in',
      },
      finalExitAt,
    );
  });

  let refreshTimer = 0;
  const scheduleRefresh = () => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 160);
  };

  window.addEventListener('resize', scheduleRefresh, { passive: true });
  window.addEventListener('orientationchange', scheduleRefresh, { passive: true });

  return () => {
    window.clearTimeout(refreshTimer);
    window.removeEventListener('resize', scheduleRefresh);
    window.removeEventListener('orientationchange', scheduleRefresh);
    timeline.scrollTrigger?.kill();
    timeline.kill();
  };
}
