import gsap from 'gsap';

export type TimelineController = { kill(): void };

export function runLoaderCompletionTimeline(
  root: HTMLElement,
  zero: HTMLElement,
  options: { reducedMotion: boolean; onComplete: () => void },
): TimelineController {
  const tagline = root.querySelector<HTMLElement>('[data-loader-tagline]');
  const line = root.querySelector<HTMLElement>('[data-loader-line]');
  if (!tagline || !line) return { kill() {} };

  const verticalScale = Math.max(1, (window.innerHeight + 24) / Math.max(1, line.offsetWidth));

  // CSS keeps the tagline non-painting before hydration. From this point onward,
  // GSAP exclusively owns its transform so no stale translate can keep it clipped.
  gsap.set(tagline, { y: 0, yPercent: 130, autoAlpha: 1, visibility: 'visible' });

  if (options.reducedMotion) {
    const timeline = gsap.timeline({ onComplete: options.onComplete });
    timeline
      .set(line, { transformOrigin: '50% 50%', scaleX: 0, rotation: 0 })
      .to(line, { scaleX: 1, duration: 0.18 })
      .set(zero, { autoAlpha: 0 })
      .to(tagline, { yPercent: 0, duration: 0.16 })
      .to({}, { duration: 0.35 })
      .set(tagline, { autoAlpha: 0 })
      .to(line, { top: '50%', scaleX: 0.16, duration: 0.16 })
      .to(line, { rotation: 90, duration: 0.18 })
      .to(line, { scaleX: verticalScale, duration: 0.2 });
    return timeline;
  }

  const zeroDrop = Math.max(126, window.innerHeight * 0.18);
  const timeline = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: options.onComplete });
  timeline
    .set(line, { transformOrigin: '50% 50%', scaleX: 0, rotation: 0 })
    .set(zero, { y: 0, autoAlpha: 1 })
    .to(line, { scaleX: 1, duration: 0.72 })
    .to(zero, { y: zeroDrop, duration: 0.68 }, '<0.06')
    .to(tagline, { yPercent: 0, duration: 0.68 }, '<0.04')
    .to({}, { duration: 2.25 })
    .to(tagline, { yPercent: 135, duration: 0.66 })
    .to(line, { top: '50%', scaleX: 0.16, duration: 0.72 }, '<0.08')
    .to(line, { rotation: 90, duration: 0.72 })
    .to(line, { scaleX: verticalScale, duration: 0.82, ease: 'power4.inOut' });

  return timeline;
}
