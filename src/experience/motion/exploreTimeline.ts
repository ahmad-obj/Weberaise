import gsap from 'gsap';
import type { RevealEngine } from '@/webgl/reveal/RevealEngine';
import type { TimelineController } from './loaderTimeline';

export function runExploreTimeline(
  root: HTMLElement,
  engine: RevealEngine | null,
  options: { reducedMotion: boolean; onComplete: () => void },
): TimelineController {
  const button = root.querySelector<HTMLElement>('[data-hero-explore]');
  const fallbackFill = root.querySelector<HTMLElement>('[data-hero-exit-fill]');
  const progress = { value: 0 };
  const fluidDuration = 1.6;
  const fallbackDuration = options.reducedMotion ? 0.24 : 0.9;
  const finalBlackHold = options.reducedMotion ? 0 : 0.06;
  const canFluidExit = Boolean(
    engine && engine.quality.enableVelocity && !options.reducedMotion
  );

  if (canFluidExit && engine) {
    engine.clear();
    engine.setExitProgress(0);
    engine.setMode('fluidExit');
  } else {
    if (engine) engine.setMode('disabled');
    if (fallbackFill) {
      gsap.set(fallbackFill, {
        display: 'block',
        scaleY: 0,
        transformOrigin: '50% 100%',
      });
    }
  }

  const timeline = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    onComplete: () => {
      if (canFluidExit && engine) engine.setExitProgress(1);
      options.onComplete();
    },
  });

  if (button) {
    timeline.to(button, {
      autoAlpha: 0,
      y: -4,
      duration: options.reducedMotion ? 0.06 : 0.2,
      ease: 'power2.out',
    }, 0);
  }

  if (canFluidExit && engine) {
    timeline.to(progress, {
      value: 1,
      duration: fluidDuration,
      ease: 'power2.inOut',
      onUpdate: () => engine.setExitProgress(progress.value),
    }, 0.04);
  } else if (fallbackFill) {
    timeline.to(fallbackFill, {
      scaleY: 1,
      duration: fallbackDuration,
      ease: 'power3.inOut',
    }, options.reducedMotion ? 0 : 0.04);
  } else {
    timeline.to(progress, { value: 1, duration: 0.01 });
  }

  timeline.to({}, { duration: finalBlackHold });

  return timeline;
}
