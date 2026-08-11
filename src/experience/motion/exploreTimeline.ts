import gsap from 'gsap';
import type { RevealEngine } from '@/webgl/reveal/RevealEngine';
import { bottomFillState } from '@/webgl/reveal/emitters/bottomFillEmitter';
import type { TimelineController } from './loaderTimeline';

export function runExploreTimeline(
  root: HTMLElement,
  engine: RevealEngine | null,
  options: { reducedMotion: boolean; onComplete: () => void },
): TimelineController {
  const button = root.querySelector<HTMLElement>('[data-hero-explore]');
  const fallbackFill = root.querySelector<HTMLElement>('[data-hero-exit-fill]');
  const progress = { value: 0 };
  const duration = options.reducedMotion ? 0.55 : 1.72;

  if (engine) {
    engine.clear();
    engine.setBottomFillProgress(0);
    engine.setMode('bottomFill');
  } else if (fallbackFill) {
    gsap.set(fallbackFill, { display: 'block', scaleY: 0, transformOrigin: '50% 100%' });
  }

  const timeline = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    onComplete: () => {
      if (engine) engine.setBottomFillProgress(1);
      options.onComplete();
    },
  });

  if (button) {
    timeline.to(button, { autoAlpha: 0, y: -7, duration: options.reducedMotion ? 0.08 : 0.22, ease: 'power2.out' }, 0);
  }

  if (engine) {
    timeline.to(progress, {
      value: 1,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => engine.setBottomFillProgress(bottomFillState(progress.value).progress),
    }, options.reducedMotion ? 0 : 0.04);
  } else if (fallbackFill) {
    timeline.to(fallbackFill, {
      scaleY: 1,
      duration,
      ease: 'power3.inOut',
    }, options.reducedMotion ? 0 : 0.04);
  } else {
    timeline.to(progress, { value: 1, duration: 0.01 });
  }

  return timeline;
}
