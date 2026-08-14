'use client';

import { CENTER_NAV_ITEMS } from './navigationModel';
import styles from './Navigation.module.css';

type CenterNavClusterProps = {
  onNavigate?: (href: string) => void;
};

export function CenterNavCluster({ onNavigate }: CenterNavClusterProps) {
  return (
    <div className={styles.centerCluster} data-center-nav-cluster>
      {CENTER_NAV_ITEMS.map((item) => {
        const link = (
          <a
            className={`${styles.pill} ${styles.centerPill} ${styles.pillFlood}`}
            href={item.href}
            data-center-nav-link
            data-pill-flood
            onClick={onNavigate
              ? (event) => {
                  event.preventDefault();
                  onNavigate(item.href);
                }
              : undefined}
          >
            <span className={styles.pillFloodSurface} data-pill-flood-surface aria-hidden="true" />
            <span className={styles.pillFloodBase} data-pill-flood-base>
              {item.label}
            </span>
            <span className={styles.pillFloodReveal} data-pill-flood-reveal aria-hidden="true">
              {item.label}
            </span>
          </a>
        );

        return (
          <span
            className={styles.navItemSlot}
            data-nav-item={item.key}
            data-nav-label={item.label}
            data-nav-detach-anchor={item.key === 'services' ? '' : undefined}
            key={item.key}
          >
            {item.key === 'services' ? (
              <span className={styles.servicesDetachable} data-services-detachable>
                {link}
              </span>
            ) : link}
          </span>
        );
      })}
    </div>
  );
}
