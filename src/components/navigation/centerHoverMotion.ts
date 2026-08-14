'use client';

import gsap from 'gsap';

type PillMotionState = {
  link: HTMLElement;
  surface: HTMLElement;
  baseContent: HTMLElement;
  revealContent: HTMLElement;
  timeline: gsap.core.Timeline | null;
  activeTween: gsap.core.Tween | null;
  pointerActive: boolean;
  focusActive: boolean;
};

const ENTER_DURATION = 0.46;
const LEAVE_DURATION = 0.36;
const MIN_INTERRUPT_RATIO = 0.18;
const FLOOD_OVERSCAN = 6;

function buildTimeline(state: PillMotionState) {
  const previousProgress = state.timeline?.progress() ?? 0;
  state.activeTween?.kill();
  state.timeline?.kill();

  const rect = state.link.getBoundingClientRect();
  const width = Math.max(1, state.link.offsetWidth || rect.width);
  const height = Math.max(1, state.link.offsetHeight || rect.height);
  const radius = Math.hypot(width * 0.5, height) + FLOOD_OVERSCAN;
  const diameter = Math.ceil(radius * 2);
  const centeredRadius = diameter * 0.5;

  state.surface.style.width = `${diameter}px`;
  state.surface.style.height = `${diameter}px`;
  state.surface.style.bottom = `-${centeredRadius}px`;

  gsap.set(state.surface, {
    xPercent: -50,
    scale: 0,
    transformOrigin: '50% 50%',
  });
  gsap.set(state.baseContent, { y: 0, opacity: 1 });
  gsap.set(state.revealContent, { y: Math.ceil(height + 12), opacity: 0 });

  const timeline = gsap.timeline({ paused: true });
  timeline.to(state.surface, { scale: 1, duration: 1, ease: 'none' }, 0);
  timeline.to(state.baseContent, { y: -(height + 6), duration: 1, ease: 'none' }, 0);
  timeline.to(state.revealContent, { y: 0, opacity: 1, duration: 1, ease: 'none' }, 0);
  timeline.progress(previousProgress);

  state.timeline = timeline;
  state.activeTween = null;
}

function animateState(state: PillMotionState, active: boolean, reducedMotion: boolean) {
  const timeline = state.timeline;
  if (!timeline) return;

  state.activeTween?.kill();
  state.activeTween = null;

  if (reducedMotion) {
    timeline.progress(active ? 1 : 0);
    return;
  }

  const targetProgress = active ? 1 : 0;
  const distance = Math.abs(targetProgress - timeline.progress());
  if (distance < 0.001) return;

  const fullDuration = active ? ENTER_DURATION : LEAVE_DURATION;
  state.activeTween = timeline.tweenTo(active ? timeline.duration() : 0, {
    duration: fullDuration * Math.max(MIN_INTERRUPT_RATIO, distance),
    ease: 'power3.out',
    overwrite: 'auto',
  });
}

export function createCenterHoverMotion(root: HTMLElement, reducedMotion: boolean): () => void {
  const links = Array.from(root.querySelectorAll<HTMLElement>('[data-pill-flood]'));
  const states: PillMotionState[] = [];
  let disposed = false;

  for (const link of links) {
    const surface = link.querySelector<HTMLElement>('[data-pill-flood-surface]');
    const baseContent = link.querySelector<HTMLElement>('[data-pill-flood-base]');
    const revealContent = link.querySelector<HTMLElement>('[data-pill-flood-reveal]');
    if (!surface || !baseContent || !revealContent) continue;

    states.push({
      link,
      surface,
      baseContent,
      revealContent,
      timeline: null,
      activeTween: null,
      pointerActive: false,
      focusActive: false,
    });
  }

  if (states.length === 0) return () => undefined;

  const syncState = (state: PillMotionState) => {
    animateState(state, state.pointerActive || state.focusActive, reducedMotion);
  };

  const cleanups: Array<() => void> = [];
  for (const state of states) {
    const onPointerEnter = () => {
      state.pointerActive = true;
      syncState(state);
    };
    const onPointerLeave = () => {
      state.pointerActive = false;
      syncState(state);
    };
    const onFocus = () => {
      state.focusActive = true;
      syncState(state);
    };
    const onBlur = () => {
      state.focusActive = false;
      syncState(state);
    };

    state.link.addEventListener('pointerenter', onPointerEnter);
    state.link.addEventListener('pointerleave', onPointerLeave);
    state.link.addEventListener('focus', onFocus);
    state.link.addEventListener('blur', onBlur);

    cleanups.push(() => {
      state.link.removeEventListener('pointerenter', onPointerEnter);
      state.link.removeEventListener('pointerleave', onPointerLeave);
      state.link.removeEventListener('focus', onFocus);
      state.link.removeEventListener('blur', onBlur);
    });
  }

  const layout = () => {
    for (const state of states) buildTimeline(state);
  };

  layout();

  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(root);
  for (const state of states) resizeObserver.observe(state.link);

  document.fonts?.ready
    .then(() => {
      if (!disposed) layout();
    })
    .catch(() => undefined);

  return () => {
    disposed = true;
    resizeObserver.disconnect();
    for (const cleanup of cleanups) cleanup();
    for (const state of states) {
      state.activeTween?.kill();
      state.timeline?.kill();
    }
  };
}
