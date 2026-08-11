'use client';

import { useMemo } from 'react';
import { createCountdownPositions } from '@/experience/loading/countdownPositions';

type LoaderCountdownProps = {
  value: number;
  viewport: { width: number; height: number };
};

function pointForValue(value: number, positions: ReturnType<typeof createCountdownPositions>, viewport: { width: number; height: number }) {
  if (value <= 0) return { x: viewport.width / 2, y: viewport.height / 2 };
  const index = Math.max(0, Math.min(99, 100 - value));
  return positions[index] ?? { x: viewport.width / 2, y: viewport.height / 2 };
}

export function LoaderCountdown({ value, viewport }: LoaderCountdownProps) {
  const glyph = useMemo(() => ({ width: Math.min(190, viewport.width * 0.26), height: Math.min(140, viewport.height * 0.16) }), [viewport]);
  const positions = useMemo(
    () => createCountdownPositions(4137, 100, viewport, glyph, Math.max(20, Math.min(44, viewport.width * 0.03)), Math.max(64, viewport.width * 0.075)),
    [glyph, viewport],
  );
  const current = pointForValue(value, positions, viewport);
  const previousValue = Math.min(100, value + 1);
  const previous = pointForValue(previousValue, positions, viewport);

  return (
    <div className="loader-countdown" aria-hidden="true">
      {value < 100 && (
        <span
          key={`previous-${previousValue}`}
          className="loader-countdown__number loader-countdown__number--previous"
          style={{ left: previous.x, top: previous.y }}
        >
          {previousValue}
        </span>
      )}
      <span
        key={`current-${value}`}
        className="loader-countdown__number loader-countdown__number--current"
        style={{ left: current.x, top: current.y }}
      >
        {value}
      </span>
    </div>
  );
}
