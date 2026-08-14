'use client';

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { GOOEY_PARTICLES } from './gooeyParticles';
import styles from './GooeyLink.module.css';

export type GooeyLinkProps = {
  href: string;
  label: string;
  className?: string;
};

function particleStyle(particle: (typeof GOOEY_PARTICLES)[number]): CSSProperties {
  return {
    '--goo-x': `${particle.x}px`,
    '--goo-y': `${particle.y}px`,
    '--goo-scale': particle.scale,
    '--goo-delay': `${particle.delay}ms`,
  } as CSSProperties;
}

export function GooeyLink({ href, label, className = '' }: GooeyLinkProps) {
  const [pointerActive, setPointerActive] = useState(false);
  const [focusActive, setFocusActive] = useState(false);
  const [burstEpoch, setBurstEpoch] = useState(0);
  const active = pointerActive || focusActive;

  const restartBurst = () => setBurstEpoch((epoch: number) => epoch + 1);
  const classNames = [styles.root, className].filter(Boolean).join(' ');

  return (
    <Link
      href={href}
      className={classNames}
      data-active={active ? 'true' : 'false'}
      onPointerEnter={() => {
        setPointerActive(true);
        restartBurst();
      }}
      onPointerLeave={() => setPointerActive(false)}
      onFocus={() => {
        setFocusActive(true);
        restartBurst();
      }}
      onBlur={() => setFocusActive(false)}
    >
      <span className={styles.baseLabel}>{label}</span>

      <span className={styles.gooField} aria-hidden="true">
        <span className={styles.gooCore} />
        {active
          ? GOOEY_PARTICLES.map((particle, index) => (
              <span
                key={`${burstEpoch}-${index}`}
                className={styles.gooParticle}
                style={particleStyle(particle)}
              />
            ))
          : null}
      </span>

      <span className={styles.hoverLabel} aria-hidden="true">
        {label}
      </span>
    </Link>
  );
}
