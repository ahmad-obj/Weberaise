'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import styles from './shutter-text.module.css';

export type ShutterTextProps = {
  text: string;
  active: boolean;
  className?: string;
};

function glyph(char: string) {
  return char === ' ' ? '\u00A0' : char;
}

export default function ShutterText({ text, active, className = '' }: ShutterTextProps) {
  const reducedMotion = useReducedMotion();
  const characters = text.split('');
  const rootClassName = `${styles.root} ${className}`.trim();

  return (
    <span className={rootClassName} aria-label={text}>
      <AnimatePresence mode="wait" initial={false}>
        {active ? (
          <motion.span key="active" className={styles.row} aria-hidden="true">
            {characters.map((char, i) => (
              <span key={`${char}-${i}`} className={styles.character}>
                {reducedMotion ? (
                  <span className={styles.staticCharacter}>{glyph(char)}</span>
                ) : (
                  <>
                    <motion.span
                      initial={{ opacity: 0, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      transition={{ delay: i * 0.04 + 0.3, duration: 0.8 }}
                      className={styles.mainCharacter}
                    >
                      {glyph(char)}
                    </motion.span>

                    <motion.span
                      initial={{ x: '-100%', opacity: 0 }}
                      animate={{ x: '100%', opacity: [0, 1, 0] }}
                      transition={{ duration: 0.7, delay: i * 0.04, ease: 'easeInOut' }}
                      className={`${styles.slice} ${styles.sliceBright}`}
                      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 35%, 0 35%)' }}
                      aria-hidden="true"
                    >
                      {glyph(char)}
                    </motion.span>

                    <motion.span
                      initial={{ x: '100%', opacity: 0 }}
                      animate={{ x: '-100%', opacity: [0, 1, 0] }}
                      transition={{ duration: 0.7, delay: i * 0.04 + 0.1, ease: 'easeInOut' }}
                      className={`${styles.slice} ${styles.sliceMiddle}`}
                      style={{ clipPath: 'polygon(0 35%, 100% 35%, 100% 65%, 0 65%)' }}
                      aria-hidden="true"
                    >
                      {glyph(char)}
                    </motion.span>

                    <motion.span
                      initial={{ x: '-100%', opacity: 0 }}
                      animate={{ x: '100%', opacity: [0, 1, 0] }}
                      transition={{ duration: 0.7, delay: i * 0.04 + 0.2, ease: 'easeInOut' }}
                      className={`${styles.slice} ${styles.sliceBright}`}
                      style={{ clipPath: 'polygon(0 65%, 100% 65%, 100% 100%, 0 100%)' }}
                      aria-hidden="true"
                    >
                      {glyph(char)}
                    </motion.span>
                  </>
                )}
              </span>
            ))}
          </motion.span>
        ) : (
          <span key="placeholder" className={`${styles.row} ${styles.placeholder}`} aria-hidden="true">
            {characters.map((char, i) => (
              <span key={`${char}-${i}`} className={`${styles.character} ${styles.staticCharacter}`}>
                {glyph(char)}
              </span>
            ))}
          </span>
        )}
      </AnimatePresence>
    </span>
  );
}
