import { ArtworkLayer } from './ArtworkLayer';
import styles from '../PostExploreNarrative.module.css';

const ROOT = '/artwork/journey/display/Q3';

export function Q3ArtworkScene() {
  return (
    <div className={`${styles.artworkScene} ${styles.q3Scene}`} data-artwork-scene="q3" data-artwork-cluster="" aria-hidden="true">
      <ArtworkLayer src={`${ROOT}/02_spotlight_beam.png`} name="beam" className={styles.q3Beam} width={1536} height={1024} />
      <ArtworkLayer src={`${ROOT}/03_spotlight_floor_pool.png`} name="floor-pool" className={styles.q3FloorPool} width={1345} height={931} />
      <ArtworkLayer src={`${ROOT}/04_character_ground_shadow.png`} name="shadow" className={styles.q3Shadow} width={1219} height={915} />
      <ArtworkLayer src={`${ROOT}/01_character.png`} name="character" className={styles.q3Character} width={785} height={1344} />
      <ArtworkLayer src={`${ROOT}/05_main_website_card.png`} name="website-card" className={styles.q3WebsiteCard} width={790} height={842} />
      <ArtworkLayer src={`${ROOT}/06_profile_search_card.png`} name="profile-card" className={styles.q3ProfileCard} width={820} height={750} />
      <ArtworkLayer src={`${ROOT}/07_brand_media_tile.png`} name="brand-tile" className={styles.q3BrandTile} width={931} height={569} />
      <ArtworkLayer src={`${ROOT}/08_secondary_blue_tile.png`} name="secondary-tile" className={styles.q3SecondaryTile} width={915} height={829} />
    </div>
  );
}
