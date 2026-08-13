import { ArtworkLayer } from './ArtworkLayer';
import styles from '../PostExploreNarrative.module.css';

const ROOT = '/artwork/journey/display/Q2';

export function Q2ArtworkScene() {
  return (
    <div className={`${styles.artworkScene} ${styles.q2Scene}`} data-artwork-scene="q2" data-artwork-reference="q2-master" data-artwork-cluster="" aria-hidden="true">
      <ArtworkLayer src={`${ROOT}/01_browser_base_shell.png`} name="browser-shell" className={styles.q2BrowserShell} width={1154} height={967} />
      <ArtworkLayer src={`${ROOT}/02_nav_header_strip.png`} name="nav" className={styles.q2Nav} width={1380} height={907} />
      <ArtworkLayer src={`${ROOT}/03_image_media_block.png`} name="media" className={styles.q2Media} width={1267} height={890} />
      <ArtworkLayer src={`${ROOT}/04_text_layout_fragments_cluster.png`} name="text-cluster" className={styles.q2TextCluster} width={1054} height={1191} />
      <ArtworkLayer src={`${ROOT}/05_oversized_cta.png`} name="cta" className={styles.q2Cta} width={1362} height={872} />
      <ArtworkLayer src={`${ROOT}/06_profile_card_a.png`} name="profile-a" className={styles.q2ProfileA} width={1275} height={898} />
      <ArtworkLayer src={`${ROOT}/07_profile_card_b.png`} name="profile-b" className={styles.q2ProfileB} width={1133} height={788} />
      <ArtworkLayer src={`${ROOT}/08_detached_search_input.png`} name="search" className={styles.q2Search} width={1227} height={694} />
    </div>
  );
}
