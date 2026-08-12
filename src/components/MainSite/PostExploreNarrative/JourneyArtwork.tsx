import styles from './PostExploreNarrative.module.css';

type JourneyArtworkProps = {
  id: 'q1' | 'q2' | 'q3';
  label: string;
};

export function JourneyArtwork({ id, label }: JourneyArtworkProps) {
  return (
    <figure className={styles.journeyArtwork} data-ribbon-artwork={id} aria-label={label}>
      <div className={styles.journeyArtworkSurface} aria-hidden="true">
        <span className={styles.journeyArtworkOrb} />
        <span className={styles.journeyArtworkGrid} />
        <span className={styles.journeyArtworkBadge}>ARTWORK / {id.toUpperCase()}</span>
      </div>
    </figure>
  );
}
