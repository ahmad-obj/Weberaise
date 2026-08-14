'use client';

import styles from './Navigation.module.css';

type GooeyTalkButtonProps = {
  onNavigate?: (href: string) => void;
};

export function GooeyTalkButton({ onNavigate }: GooeyTalkButtonProps) {
  return (
    <a
      className={`${styles.pill} ${styles.talkPill} ${styles.pillFlood}`}
      href="#contact"
      data-talk-pill
      data-pill-flood
      onClick={onNavigate
        ? (event) => {
            event.preventDefault();
            onNavigate('#contact');
          }
        : undefined}
    >
      <span className={styles.pillFloodSurface} data-pill-flood-surface aria-hidden="true" />
      <span className={styles.pillFloodBase} data-pill-flood-base>
        LET&apos;S TALK
      </span>
      <span className={styles.pillFloodReveal} data-pill-flood-reveal aria-hidden="true">
        LET&apos;S TALK
      </span>
    </a>
  );
}
