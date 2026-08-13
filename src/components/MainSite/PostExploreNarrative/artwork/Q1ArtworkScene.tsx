import { ArtworkLayer } from './ArtworkLayer';
import styles from '../PostExploreNarrative.module.css';

const ROOT = '/artwork/journey/display/Q1';

export function Q1ArtworkScene() {
  return (
    <div className={`${styles.artworkScene} ${styles.q1Scene}`} data-artwork-scene="q1" data-artwork-reference="q1-master" data-artwork-cluster="" aria-hidden="true">
      <ArtworkLayer src={`${ROOT}/01_island_platform.png`} name="island" className={styles.q1Island} width={1217} height={764} />
      <ArtworkLayer src={`${ROOT}/02_storefront.png`} name="storefront" className={styles.q1Storefront} width={1273} height={900} />
      <ArtworkLayer src={`${ROOT}/03_floating_nav_strip.png`} name="nav" className={styles.q1Nav} width={1206} height={748} />
      <ArtworkLayer src={`${ROOT}/04_image_content_card.png`} name="image-card" className={styles.q1ImageCard} width={1275} height={902} />
      <ArtworkLayer src={`${ROOT}/05_cta_chip.png`} name="cta" className={styles.q1Cta} width={983} height={736} />
      <ArtworkLayer src={`${ROOT}/06_browser_content_card_large.png`} name="browser-large" className={styles.q1BrowserLarge} width={1009} height={795} />
      <ArtworkLayer src={`${ROOT}/07_browser_content_card_small.png`} name="browser-small" className={styles.q1BrowserSmall} width={1219} height={787} />
    </div>
  );
}
