'use client';

import { CENTER_NAV_ITEMS, type NavigationMode } from './navigationModel';
import styles from './Navigation.module.css';

export function SiteNavigation({ mode }: { mode: NavigationMode }) {
  return (
    <nav
      className={styles.navRoot}
      data-site-navigation
      data-navigation-mode={mode}
      aria-label="Primary"
    >
      <div className={styles.logoZone} data-nav-zone="logo">
        <a className={`${styles.pill} ${styles.logoPill}`} href="/" aria-label="Weberaise home">
          <span className={styles.logoMark} aria-hidden="true" />
        </a>
      </div>

      <div className={styles.centerZone} data-nav-zone="center">
        <div className={styles.centerCluster}>
          {CENTER_NAV_ITEMS.map((item) => (
            <a className={`${styles.pill} ${styles.centerPill}`} href={item.href} key={item.key}>
              {item.label}
            </a>
          ))}
        </div>
      </div>

      <div className={styles.talkZone} data-nav-zone="talk">
        <a className={`${styles.pill} ${styles.talkPill}`} href="#contact">
          LET&apos;S TALK
        </a>
      </div>
    </nav>
  );
}
