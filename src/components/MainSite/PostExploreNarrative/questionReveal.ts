'use client';

import gsap from 'gsap';

export function revealJourneyStop(
  element: HTMLElement,
  reducedMotion: boolean,
): gsap.core.Tween | null {
  if (reducedMotion) {
    gsap.set(element, { autoAlpha: 1, y: 0 });
    return null;
  }

  return gsap.fromTo(
    element,
    { autoAlpha: 0, y: 24 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.82,
      ease: 'power3.out',
      clearProps: 'transform',
    },
  );
}
