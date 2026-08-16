'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { WorkProject } from '@/content/workProjects';
import type { ScreenBounds } from '@/webgl/workSphere/activation';
import styles from './WorkPage.module.css';

export type WorkTransitionRect = ScreenBounds;

export function getWorkProjectDestination(
  viewportWidth: number,
  viewportHeight: number,
): WorkTransitionRect {
  const mobile = viewportWidth < 720;
  const side = mobile ? 18 : Math.min(64, Math.max(28, viewportWidth * 0.04));
  const top = Math.min(104, Math.max(68, viewportHeight * 0.07));
  const width = Math.max(1, viewportWidth - side * 2);
  const availableHeight = Math.max(1, viewportHeight - top - 28);
  const height = Math.min(availableHeight, width / 1.6);
  const finalWidth = Math.min(width, height * 1.6);
  return {
    left: (viewportWidth - finalWidth) / 2,
    top,
    width: finalWidth,
    height,
  };
}

type WorkProjectTransitionProps = {
  project: WorkProject;
  sourceRect: WorkTransitionRect;
  direction: 'open' | 'close';
  reducedMotion: boolean;
  onOwnership(): void;
  onProgress(progress: number): void;
  onComplete(): void;
};

export function WorkProjectTransition({
  project,
  sourceRect,
  direction,
  reducedMotion,
  onOwnership,
  onProgress,
  onComplete,
}: WorkProjectTransitionProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const ownershipSentRef = useRef(false);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const destination = getWorkProjectDestination(window.innerWidth, window.innerHeight);
    const from = direction === 'open' ? sourceRect : destination;
    const to = direction === 'open' ? destination : sourceRect;
    const geometryDuration = reducedMotion ? 0.22 : 0.72;
    const crossfadeDuration = reducedMotion ? 0.06 : 0.1;

    gsap.set(frame, {
      left: from.left,
      top: from.top,
      width: from.width,
      height: from.height,
      borderRadius: direction === 'open' ? 12 : 6,
      opacity: direction === 'open' ? 0 : 1,
    });

    const timeline = gsap.timeline({
      onComplete: () => {
        onProgress(direction === 'open' ? 1 : 0);
        onComplete();
      },
    });

    if (direction === 'open') {
      timeline.to(frame, {
        opacity: 1,
        duration: crossfadeDuration,
        ease: 'power1.out',
        onUpdate: () => onProgress(0),
        onComplete: () => {
          if (!ownershipSentRef.current) {
            ownershipSentRef.current = true;
            onOwnership();
          }
        },
      });
      timeline.to(frame, {
        left: to.left,
        top: to.top,
        width: to.width,
        height: to.height,
        borderRadius: 6,
        duration: geometryDuration,
        ease: reducedMotion ? 'power1.out' : 'power4.inOut',
        onUpdate: () => {
          const p = Math.max(0, Math.min(1, (timeline.time() - crossfadeDuration) / geometryDuration));
          onProgress(p);
        },
      });
    } else {
      timeline.to(frame, {
        left: to.left,
        top: to.top,
        width: to.width,
        height: to.height,
        borderRadius: 12,
        duration: geometryDuration,
        ease: reducedMotion ? 'power1.out' : 'power4.inOut',
        onUpdate: () => onProgress(1),
        onComplete: () => {
          if (!ownershipSentRef.current) {
            ownershipSentRef.current = true;
            onOwnership();
          }
        },
      });
      timeline.to(frame, {
        opacity: 0,
        duration: crossfadeDuration,
        ease: 'power1.out',
        onUpdate: () => onProgress(1),
      });
    }

    return () => {
      timeline.kill();
    };
  }, [direction, onComplete, onOwnership, onProgress, reducedMotion, sourceRect]);

  return (
    <div ref={frameRef} className={styles.projectTransition} aria-hidden="true">
      <img src={project.media.showcasePoster || project.media.poster} alt="" />
    </div>
  );
}
