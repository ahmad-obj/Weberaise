import styles from './shutter-text.module.css';

function glyph(char: string) {
  return char === ' ' ? '\u00A0' : char;
}

export function ShutterTextPlaceholder({ lines }: { lines: readonly string[] }) {
  return (
    <span className={styles.root} aria-label={lines.join(' ')}>
      <span className={`${styles.row} ${styles.placeholder}`} aria-hidden="true">
        {lines.map((line, lineIndex) => (
          <span
            key={`${line}-${lineIndex}`}
            className={styles.line}
            data-reassurance-line={lineIndex === 0 ? 'one' : 'two'}
          >
            {line.split('').map((char, characterIndex) => (
              <span key={`${char}-${characterIndex}`} className={styles.character}>
                <span className={styles.mainCharacter}>{glyph(char)}</span>
              </span>
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}
