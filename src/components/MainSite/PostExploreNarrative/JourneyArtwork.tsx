import { Q1ArtworkScene } from './artwork/Q1ArtworkScene';
import { Q2ArtworkScene } from './artwork/Q2ArtworkScene';
import { Q3ArtworkScene } from './artwork/Q3ArtworkScene';
import styles from './PostExploreNarrative.module.css';

type JourneyArtworkProps = {
  id: 'q1' | 'q2' | 'q3';
  label: string;
};

export function JourneyArtwork({ id, label }: JourneyArtworkProps) {
  const scene = {
    q1: <Q1ArtworkScene />,
    q2: <Q2ArtworkScene />,
    q3: <Q3ArtworkScene />,
  }[id];

  return (
    <figure className={`${styles.journeyArtwork} ${styles[`journeyArtwork${id.toUpperCase()}`]}`} data-ribbon-artwork={id} aria-label={label}>
      {scene}
    </figure>
  );
}
