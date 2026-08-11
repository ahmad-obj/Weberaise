'use client';

type LoaderCountdownProps = {
  value: number;
};

export function LoaderCountdown({ value }: LoaderCountdownProps) {
  const previousValue = Math.min(100, value + 1);
  const zeroClass = value === 0 ? ' loader-zero-glyph' : '';

  return (
    <div className="loader-countdown" aria-hidden="true">
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
