'use client';

import { useEffect, useRef } from 'react';
import { runLoaderCompletionTimeline } from '@/experience/motion/loaderTimeline';

type LoaderCompletionProps = {
  onComplete: () => void;
  reducedMotion: boolean;
};

export function LoaderCompletion({ onComplete, reducedMotion }: LoaderCompletionProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const controller = runLoaderCompletionTimeline(rootRef.current, { reducedMotion, onComplete });
    return () => controller.kill();
  }, [onComplete, reducedMotion]);

  return (
    <div ref={rootRef} className="loader-completion" aria-hidden="true">
      <div className="loader-completion__upper-mask">
        <span data-loader-zero className="loader-completion__zero">0</span>
        <span data-loader-tagline className="loader-completion__tagline">RAISE THE STANDARD</span>
      </div>
      <div data-loader-line className="loader-completion__line" />
    </div>
  );
}
