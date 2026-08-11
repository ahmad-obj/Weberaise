'use client';

import type { CSSProperties } from 'react';
import { countdownTransitionMs } from '@/experience/loading/countdownTiming';

type LoaderCountdownProps = {
  value: number;
  reducedMotion: boolean;
};

type LoaderCountdownStyle = CSSProperties & {
  '--loader-digit-transition': string;
};

export function LoaderCountdown({ value, reducedMotion }: LoaderCountdownProps) {
  const previousValue = Math.min(100, value + 1);
  const zeroClass = value === 0 ? ' loader-zero-glyph' : '';
  const style: LoaderCountdownStyle = {
    '--loader-digit-transition': `${countdownTransitionMs(value, reducedMotion)}ms`,
  };

  return (
    <div className="loader-countdown" aria-hidden="true" style={style}>
      {value < 100 && (
        <span
          key={`previous-${previousValue}`}
          className="loader-countdown__number loader-countdown__number--previous"
        >
          {previousValue}
        </span>
      )}
      <span
        key={`current-${value}`}
        className={`loader-countdown__number loader-countdown__number--current${zeroClass}`}
      >
        {value}
      </span>
    </div>
  );
}
