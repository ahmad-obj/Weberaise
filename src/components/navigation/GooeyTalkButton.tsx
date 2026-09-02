'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { TalkContactBubble } from './TalkContactBubble';
import styles from './Navigation.module.css';

export function GooeyTalkButton() {
  const [open, setOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const bubbleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const shell = shellRef.current;
      if (!shell || shell.contains(event.target as Node)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      window.requestAnimationFrame(() => buttonRef.current?.focus());
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const closeBubble = () => setOpen(false);

  return (
    <div
      ref={shellRef}
      className={styles.talkShell}
      data-talk-open={open ? 'true' : 'false'}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.pill} ${styles.talkPill} ${styles.pillFlood}`}
        data-talk-pill
        data-pill-flood
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={bubbleId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.pillFloodSurface} data-pill-flood-surface aria-hidden="true" />
        <span className={styles.pillFloodBase} data-pill-flood-base>
          LET&apos;S TALK
        </span>
        <span className={styles.pillFloodReveal} data-pill-flood-reveal aria-hidden="true">
          LET&apos;S TALK
        </span>
      </button>

      <TalkContactBubble id={bubbleId} open={open} onClose={closeBubble} />
    </div>
  );
}
