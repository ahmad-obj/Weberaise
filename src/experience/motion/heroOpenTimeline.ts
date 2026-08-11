import gsap from 'gsap';
import type { TimelineController } from './loaderTimeline';

export function runHeroOpenTimeline(
  root: HTMLElement,
  options: { reducedMotion: boolean; onComplete: () => void },
): TimelineController {
  const leftCurtain = root.querySelector<HTMLElement>('[data-hero-curtain-left]');
  const rightCurtain = root.querySelector<HTMLElement>('[data-hero-curtain-right]');
  const leftLine = root.querySelector<HTMLElement>('[data-hero-line-left]');
  const rightLine = root.querySelector<HTMLElement>('[data-hero-line-right]');
  if (!leftCurtain || !rightCurtain || !leftLine || !rightLine) return { kill() {} };

  const duration = options.reducedMotion ? 0.35 : 1.32;
  const timeline = gsap.timeline({ defaults: { ease: 'power4.inOut' }, onComplete: options.onComplete });
  timeline
    .set([leftCurtain, rightCurtain], { xPercent: 0 })
    .set([leftLine, rightLine], { x: 0 })
    .to(leftCurtain, { xPercent: -100, duration }, 0)
    .to(rightCurtain, { xPercent: 100, duration }, 0)
    .to(leftLine, { x: '-50vw', duration }, 0)
    .to(rightLine, { x: '50vw', duration }, 0);

  return timeline;
}
