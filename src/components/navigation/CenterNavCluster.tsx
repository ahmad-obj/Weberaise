'use client';

import { useLayoutEffect, useRef } from 'react';
import { CENTER_NAV_ITEMS } from './navigationModel';
import { createCenterHoverMotion } from './centerHoverMotion';
import styles from './Navigation.module.css';

type CenterNavClusterProps = {
  onNavigate?: (href: string) => void;
};

export function CenterNavCluster({ onNavigate }: CenterNavClusterProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return createCenterHoverMotion(root, reducedMotion);
  }, []);

  return (
    <div ref={rootRef} className={styles.centerCluster} data-center-nav-cluster>
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
            onClick={onNavigate
              ? (event) => {
                  event.preventDefault();
                  onNavigate(item.href);
                }
              : undefined}
          >
            <span
              className={styles.centerPillSurface}
              data-center-pill-surface
              aria-hidden="true"
            />
            <span className={styles.centerPillLabel} data-center-pill-label>
              {item.label}
            </span>
            <span
              className={styles.centerPillLabelHover}
              data-center-pill-label-hover
              aria-hidden="true"
            >
              {item.label}
            </span>
          </a>
        </span>
      ))}
    </div>
  );
}
