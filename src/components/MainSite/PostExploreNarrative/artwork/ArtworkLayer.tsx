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
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      sizes="(max-width: 720px) 88vw, (max-width: 1200px) 44vw, 38vw"
      className={`${styles.artworkLayer} ${className}`}
      data-artwork-layer={name}
      loading="lazy"
    />
  );
}
