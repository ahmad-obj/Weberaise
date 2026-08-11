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
      <div className="loader-completion__zero-mask">
        <span data-loader-zero className="loader-zero-glyph loader-completion__zero">0</span>
      </div>
      <div className="loader-completion__tagline-mask">
        <span data-loader-tagline className="loader-completion__tagline">Need a website for business?</span>
      </div>
      <div data-loader-line className="loader-completion__line" />
    </div>
  );
}
