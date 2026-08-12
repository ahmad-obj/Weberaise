'use client';

// Motion basis: https://reactbits.dev/text-animations/scroll-float
// Source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ScrollFloat/ScrollFloat.tsx

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export type QuestionWindow = {
  enterStart: number;
  enterEnd: number;
};

export const QUESTION_WINDOWS: readonly QuestionWindow[] = [
  { enterStart: 0.0, enterEnd: 0.18 },
  { enterStart: 0.25, enterEnd: 0.43 },
  { enterStart: 0.48, enterEnd: 0.66 },
] as const;

export const GROUP_FADE_START = 0.82;
export const GROUP_FADE_END = 0.98;

const TIMELINE_UNITS = 10;
const ENTER_STAGGER = 0.03;

function tweenDurationForWindow(span: number, itemCount: number, stagger: number, floor: number) {
  return Math.max(floor, span - Math.max(0, itemCount - 1) * stagger);
}

export function createQuestionTimeline(root: HTMLElement, reducedMotion: boolean): () => void {
  if (typeof window === 'undefined') return () => undefined;

  gsap.registerPlugin(ScrollTrigger);

  const headings = Array.from(root.querySelectorAll<HTMLElement>('[data-question-index]'));
  const visuals = headings
    .map((heading) => heading.querySelector<HTMLElement>('[data-question-visual]'))
    .filter((visual): visual is HTMLElement => Boolean(visual));
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

  timeline.to(clock, { value: 1, duration: TIMELINE_UNITS, ease: 'none' }, 0);
  gsap.set(visuals, { opacity: 1, yPercent: 0, filter: 'blur(0px)' });

  headings.forEach((heading, index) => {
    const window = QUESTION_WINDOWS[index];
    if (!window) return;

    const characters = Array.from(heading.querySelectorAll<HTMLElement>('[data-question-char]'));
    if (characters.length === 0) return;

    const enterAt = window.enterStart * TIMELINE_UNITS;
    const enterSpan = (window.enterEnd - window.enterStart) * TIMELINE_UNITS;

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
      return;
    }

    const enterDuration = tweenDurationForWindow(
      enterSpan,
      characters.length,
      ENTER_STAGGER,
      0.52,
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
  });

  const fadeAt = GROUP_FADE_START * TIMELINE_UNITS;
  const fadeDuration = (GROUP_FADE_END - GROUP_FADE_START) * TIMELINE_UNITS;

  timeline.to(
    visuals,
    reducedMotion
      ? {
          opacity: 0,
          duration: fadeDuration,
          ease: 'power1.inOut',
        }
      : {
          opacity: 0,
          yPercent: -8,
          filter: 'blur(2px)',
          duration: fadeDuration,
          ease: 'power2.inOut',
        },
    fadeAt,
  );

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
