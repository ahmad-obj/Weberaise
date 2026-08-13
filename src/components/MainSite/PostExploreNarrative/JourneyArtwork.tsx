import { Q1ArtworkScene } from './artwork/Q1ArtworkScene';
import { Q2ArtworkScene } from './artwork/Q2ArtworkScene';
import styles from './PostExploreNarrative.module.css';

type JourneyArtworkProps = {
  id: 'q1' | 'q2';
  label: string;
};

export function JourneyArtwork({ id, label }: JourneyArtworkProps) {
  const scene = {
    q1: <Q1ArtworkScene />,
    q2: <Q2ArtworkScene />,
  }[id];

  return (
    <figure className={`${styles.journeyArtwork} ${styles[`journeyArtwork${id.toUpperCase()}`]}`} data-ribbon-artwork={id} aria-label={label}>
      {scene}
    </figure>
  );
}
