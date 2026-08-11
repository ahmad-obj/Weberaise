'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { runLoaderCompletionTimeline } from '@/experience/motion/loaderTimeline';

type LoaderCompletionProps = {
  zeroRef: RefObject<HTMLSpanElement | null>;
  onComplete: () => void;
  reducedMotion: boolean;
};

export function LoaderCompletion({ zeroRef, onComplete, reducedMotion }: LoaderCompletionProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const zero = zeroRef.current;
    if (!root || !zero) return;
    const controller = runLoaderCompletionTimeline(root, zero, { reducedMotion, onComplete });
    return () => controller.kill();
  }, [onComplete, reducedMotion, zeroRef]);

  return (
    <div ref={rootRef} className="loader-completion" aria-hidden="true">
      <div className="loader-completion__tagline-mask">
        <span data-loader-tagline className="loader-completion__tagline">Need a website for business?</span>
      </div>
      <div data-loader-line className="loader-completion__line" />
    </div>
  );
}
