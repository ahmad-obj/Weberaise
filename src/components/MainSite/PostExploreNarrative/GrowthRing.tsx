// Layout basis: https://reactbits.dev/text-animations/circular-text
// Source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/CircularText/CircularText.tsx

import type { CSSProperties } from 'react';
import styles from './PostExploreNarrative.module.css';

type RingCharacterStyle = CSSProperties & {
  '--char-angle': string;
};

export function GrowthRing({ text, center }: { text: string; center: string }) {
  const characters = Array.from(text);

  return (
    <div className={styles.growthRing} data-growth-ring>
      <span className="sr-only">{`${text} ${center}`}</span>
      <div className={styles.ringTrack} aria-hidden="true">
        {characters.map((character, index) => {
          const angle = (360 / characters.length) * index;
          const style: RingCharacterStyle = { '--char-angle': `${angle}deg` };

          return (
            <span
              className={styles.ringChar}
              style={style}
              key={`${character}-${index}`}
            >
              {character === ' ' ? '\u00A0' : character}
            </span>
          );
        })}
      </div>
      <strong className={styles.ringCenter} aria-hidden="true">
        {center}
      </strong>
    </div>
  );
}
