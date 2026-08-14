'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import type { WorkProject } from '@/content/workProjects';
import type { ScreenBounds } from '@/webgl/workSphere/types';
import styles from './WorkPage.module.css';

type ProjectTransitionBridgeProps = {
  sourceBounds: ScreenBounds;
  project: WorkProject;
  direction: 'open' | 'close';
  reducedMotion: boolean;
  onHandoff(): void;
  onComplete(): void;
};

export function getShowcaseDestination(sourceBounds: ScreenBounds): ScreenBounds {
  if (typeof window === 'undefined') return sourceBounds;
  const pagePad = Math.max(18, Math.min(52, window.innerWidth * 0.03));
  const top = Math.max(70, window.innerHeight * 0.075);
  const sourceAspect = sourceBounds.width / Math.max(1, sourceBounds.height);
  const maxWidth = window.innerWidth - pagePad * 2;
  const maxHeight = window.innerHeight * 0.7;
  let width = maxWidth;
  let height = width / sourceAspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * sourceAspect;
  }
  return {
    left: (window.innerWidth - width) * 0.5,
    top,
    width,
    height,
  };
}

export function ProjectTransitionBridge({
  sourceBounds,
  project,
  direction,
  reducedMotion,
  onHandoff,
  onComplete,
}: ProjectTransitionBridgeProps) {
  const bridgeRef = useRef<HTMLDivElement>(null);
  const destination = useMemo(() => getShowcaseDestination(sourceBounds), [sourceBounds]);

  useLayoutEffect(() => {
    const bridge = bridgeRef.current;
    if (!bridge) return undefined;
    const duration = reducedMotion ? 0.22 : 0.72;
    const from = direction === 'open' ? sourceBounds : destination;
    const to = direction === 'open' ? destination : sourceBounds;

    gsap.set(bridge, {
      left: from.left,
      top: from.top,
      width: from.width,
      height: from.height,
      borderRadius: direction === 'open' ? 16 : 12,
      opacity: 1,
    });

    const timeline = gsap.timeline({ onComplete });
    if (direction === 'open') {
      timeline.call(onHandoff, [], reducedMotion ? 0 : 0.045);
    } else {
      timeline.call(onHandoff, [], duration * 0.72);
    }
    timeline.to(bridge, {
      left: to.left,
      top: to.top,
      width: to.width,
      height: to.height,
      borderRadius: direction === 'open' ? 8 : 16,
      duration,
      ease: reducedMotion ? 'power1.out' : 'power4.inOut',
    }, 0);

    return () => timeline.kill();
  }, [destination, direction, onComplete, onHandoff, reducedMotion, sourceBounds]);

  return (
    <div
      ref={bridgeRef}
      className={styles.transitionBridge}
      data-transition-bridge
      aria-hidden="true"
    >
      <img src={project.media.poster} alt="" />
    </div>
  );
}
