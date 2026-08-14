'use client';

import { useState, type CSSProperties } from 'react';
import { GOOEY_PARTICLES } from './gooeyParticles';
import styles from './Navigation.module.css';

function particleStyle(particle: (typeof GOOEY_PARTICLES)[number]): CSSProperties {
  return {
    '--goo-x': `${particle.x}px`,
    '--goo-y': `${particle.y}px`,
    '--goo-scale': particle.scale,
    '--goo-delay': `${particle.delay}ms`,
  } as CSSProperties;
}

type GooeyTalkButtonProps = {
  onNavigate?: (href: string) => void;
};

export function GooeyTalkButton({ onNavigate }: GooeyTalkButtonProps) {
  const [pointerActive, setPointerActive] = useState(false);
  const [focusActive, setFocusActive] = useState(false);
  const [burstEpoch, setBurstEpoch] = useState(0);
  const active = pointerActive || focusActive;

  const restartBurst = () => setBurstEpoch((epoch) => epoch + 1);

  return (
    <a
      className={`${styles.pill} ${styles.talkPill}`}
      href="#contact"
      data-talk-pill
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
      onClick={onNavigate
        ? (event) => {
            event.preventDefault();
            onNavigate('#contact');
          }
        : undefined}
    >
      <span className={styles.talkBaseLabel}>LET&apos;S TALK</span>

      <span className={styles.gooField} aria-hidden="true">
        <span className={styles.gooCore} />
        {active
          ? GOOEY_PARTICLES.map((particle, index) => (
              <span
                data-goo-particle
                className={styles.gooParticle}
                key={`${burstEpoch}-${index}`}
                style={particleStyle(particle)}
              />
            ))
          : null}
      </span>

      <span className={styles.talkHoverLabel} aria-hidden="true">
        LET&apos;S TALK
      </span>
    </a>
  );
}
