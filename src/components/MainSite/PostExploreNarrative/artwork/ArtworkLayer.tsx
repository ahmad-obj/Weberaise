import Image from 'next/image';
import styles from '../PostExploreNarrative.module.css';

type ArtworkLayerProps = {
  src: string;
  name: string;
  className: string;
  width: number;
  height: number;
};

export function ArtworkLayer({ src, name, className, width, height }: ArtworkLayerProps) {
  return (
    <span className={`${styles.artworkPlacement} ${className}`} data-artwork-layer={name}>
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        sizes="(max-width: 720px) 94vw, (max-width: 1200px) 48vw, 42vw"
        className={styles.artworkImage}
        loading="lazy"
      />
    </span>
  );
}
