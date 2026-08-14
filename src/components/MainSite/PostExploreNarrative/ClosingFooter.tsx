'use client';

import { useLayoutEffect } from 'react';
import { createServicesDetachMotion } from './servicesDetachMotion';
import styles from './ClosingFooter.module.css';

export function ClosingFooter() {
  useLayoutEffect(() => createServicesDetachMotion(), []);

  return (
    <footer className={styles.root} data-closing-footer data-nav-theme="dark">
      <div className={styles.stage} data-closing-footer-stage>
        <div className={styles.heroCopy}>
          <h2 className={styles.heading}>
            <span>WHAT CAN WE</span>
            <span>BUILD FOR YOU?</span>
          </h2>
          <div className={styles.dock} data-services-footer-dock aria-hidden="true" />
        </div>

        <div className={styles.meta}>
          <span>WEBERAISE</span>
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  );
}
