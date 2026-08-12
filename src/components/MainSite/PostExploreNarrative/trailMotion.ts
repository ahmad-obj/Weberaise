'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const TRAIL_TIMING = {
  initial: 0.09,
  q1: 0.23,
  q2: 0.47,
  q3: 0.69,
  questionsFade: 0.83,
  reassurance: 0.94,
  end: 1,
} as const;

type PathState = {
  path: SVGPathElement;
  length: number;
};

function setPathProgress(paths: readonly PathState[], progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));

  for (const { path, length } of paths) {
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length * (1 - clamped)}`;
  }
}

function setQuestionStates(root: HTMLElement, progress: number) {
  const questions = Array.from(root.querySelectorAll<HTMLElement>('[data-trail-question]'));
  const thresholds = [TRAIL_TIMING.q1, TRAIL_TIMING.q2, TRAIL_TIMING.q3];

  questions.forEach((question, index) => {
    question.dataset.visited = progress >= (thresholds[index] ?? 1) ? 'true' : 'false';
  });

  root.dataset.trailQuestionsFaded = progress >= TRAIL_TIMING.questionsFade ? 'true' : 'false';

  const narrative = root.closest<HTMLElement>('[data-post-explore-narrative]');
  if (narrative) {
    narrative.dataset.reassuranceActive = progress >= TRAIL_TIMING.reassurance ? 'true' : 'false';
  }
}

export function createTrailMotion(root: HTMLElement, reducedMotion: boolean): () => void {
  if (typeof window === 'undefined') return () => undefined;

  gsap.registerPlugin(ScrollTrigger);

  const paths = Array.from(root.querySelectorAll<SVGPathElement>('[data-trail-path]')).map((path) => ({
    path,
    length: path.getTotalLength(),
  }));

  if (paths.length === 0) return () => undefined;

  setPathProgress(paths, 0);
  setQuestionStates(root, 0);

  let scrollTrigger: ScrollTrigger | null = null;
  const autoState = { progress: 0 };

  const applyScrollProgress = (scrollProgress: number) => {
    const mapped = TRAIL_TIMING.initial + scrollProgress * (TRAIL_TIMING.end - TRAIL_TIMING.initial);
    const visibleProgress = Math.max(TRAIL_TIMING.initial, mapped);
    setPathProgress(paths, visibleProgress);
    setQuestionStates(root, visibleProgress);
  };

  const createScrollDriver = () => {
    scrollTrigger?.kill();
    scrollTrigger = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      onUpdate: (self) => applyScrollProgress(self.progress),
    });

    applyScrollProgress(scrollTrigger.progress);
  };

  let introTween: gsap.core.Tween | null = null;

  if (reducedMotion) {
    setPathProgress(paths, TRAIL_TIMING.initial);
    setQuestionStates(root, TRAIL_TIMING.initial);
    createScrollDriver();
  } else {
    introTween = gsap.to(autoState, {
      progress: TRAIL_TIMING.initial,
      duration: 0.65,
      ease: 'power2.out',
      onUpdate: () => {
        setPathProgress(paths, autoState.progress);
        setQuestionStates(root, autoState.progress);
      },
      onComplete: createScrollDriver,
    });
  }

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
    introTween?.kill();
    scrollTrigger?.kill();

    const narrative = root.closest<HTMLElement>('[data-post-explore-narrative]');
    if (narrative) delete narrative.dataset.reassuranceActive;
  };
}
