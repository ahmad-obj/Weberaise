'use client';

import { useLayoutEffect, useRef } from 'react';
import { CENTER_NAV_ITEMS } from './navigationModel';
import { createCenterHoverMotion } from './centerHoverMotion';
import styles from './Navigation.module.css';

export function CenterNavCluster() {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return createCenterHoverMotion(root, reducedMotion);
  }, []);

  return (
    <div ref={rootRef} className={styles.centerCluster} data-center-nav-cluster>
      <span className={styles.centerHoverPlate} data-center-hover-plate aria-hidden="true">
        <span data-center-hover-label />
      </span>

      {CENTER_NAV_ITEMS.map((item) => (
        <span
          className={styles.navItemSlot}
          data-nav-item={item.key}
          data-nav-label={item.label}
          data-nav-detach-anchor={item.key === 'services' ? '' : undefined}
          key={item.key}
        >
          <a
            className={`${styles.pill} ${styles.centerPill}`}
            href={item.href}
            data-center-nav-link
          >
            {item.label}
          </a>
        </span>
      ))}
    </div>
  );
}
