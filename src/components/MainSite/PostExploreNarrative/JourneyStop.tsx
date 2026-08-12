import type { ReactNode } from 'react';
import type { JourneyStopId } from './journeyRoute';
import styles from './PostExploreNarrative.module.css';

type JourneyStopProps = {
  id: JourneyStopId;
  align: 'left' | 'right' | 'center';
  children: ReactNode;
};

export function JourneyStop({ id, align, children }: JourneyStopProps) {
  const alignmentClass = {
    left: styles.journeyStopLeft,
    right: styles.journeyStopRight,
    center: styles.journeyStopCenter,
  }[align];

  const anchorClass = id === 'reassurance'
    ? `${styles.journeyStopAnchor} ${styles.journeyStopAnchorWide}`
    : styles.journeyStopAnchor;

  return (
    <section className={`${styles.journeyStop} ${alignmentClass}`}>
      <div
        className={anchorClass}
        data-journey-stop={id}
        data-revealed="false"
      >
        {children}
      </div>
    </section>
  );
}
