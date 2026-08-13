export const SERVICES_MOTION = {
  intro: {
    lineDuration: 0.92,
    lineStagger: 0.075,
    readingHold: 1.8,
    outerExitDuration: 0.72,
    servicesBeat: 0.18,
    handoffDuration: 0.96,
    rowRevealDuration: 0.72,
    rowRevealStagger: 0.065,
  },
  hover: {
    blocksIn: {
      duration: 0.4,
      ease: 'power3',
      scale: 0.8,
      xPercent: 20,
      stagger: -0.035,
    },
    blocksOut: {
      duration: 0.4,
      ease: 'power4',
      scale: 0.8,
    },
    titleOut: {
      duration: 0.1,
      ease: 'power1.in',
    },
    titleIn: {
      duration: 0.5,
      ease: 'expo',
      rotation: 15,
    },
  },
  takeover: {
    duration: 0.9,
    ease: 'power4.inOut',
    itemStagger: 0.04,
  },
  close: {
    duration: 0.5,
    ease: 'power4.inOut',
    titleStagger: 0.03,
  },
} as const;

export function getTitleExitY(targetTop: number, selectedTop: number): -100 | 100 {
  return targetTop > selectedTop ? 100 : -100;
}

export function getIntroExitX(
  viewportWidth: number,
  elementWidth: number,
  direction: 'left' | 'right',
): number {
  const distance = viewportWidth / 2 + elementWidth / 2 + 24;
  return direction === 'left' ? -distance : distance;
}

export function getSupplementalStartDelay(primaryCount: number): number {
  return SERVICES_MOTION.takeover.itemStagger * primaryCount;
}
