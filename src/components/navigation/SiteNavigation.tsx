'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { CenterNavCluster } from './CenterNavCluster';
import { GooeyTalkButton } from './GooeyTalkButton';
import { type NavigationMode } from './navigationModel';
import { useNavigationTheme } from './useNavigationTheme';
import styles from './Navigation.module.css';

type SiteNavigationProps = {
  mode: NavigationMode;
  interactive?: boolean;
  onNavigate?: (href: string) => void;
};

export function SiteNavigation({
  mode,
  interactive = true,
  onNavigate,
}: SiteNavigationProps) {
  const rootRef = useRef<HTMLElement>(null);
  const theme = useNavigationTheme(mode === 'main');

  useLayoutEffect(() => {
    if (mode !== 'hero' || !rootRef.current) return undefined;

    const root = rootRef.current;
    const zones = root.querySelectorAll<HTMLElement>('[data-nav-zone]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const context = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(zones, { opacity: 1, clearProps: 'transform' });
        return;
      }

      gsap.fromTo(
        zones,
        { opacity: 0, y: -10, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.36,
          stagger: 0.055,
          ease: 'power3.out',
          clearProps: 'transform',
        },
      );
    }, root);

    return () => context.revert();
  }, [mode]);

  return (
    <nav
      ref={rootRef}
      className={styles.navRoot}
      data-site-navigation
      data-navigation-mode={mode}
      data-navigation-disabled={interactive ? 'false' : 'true'}
      data-nav-theme={mode === 'main' ? theme : undefined}
      aria-label="Primary"
      inert={!interactive ? true : undefined}
    >
      <div className={styles.logoZone} data-nav-zone="logo">
        <a className={`${styles.pill} ${styles.logoPill}`} href="/" aria-label="Weberaise home">
          <span className={styles.logoMark} aria-hidden="true" />
        </a>
      </div>

      <div className={styles.centerZone} data-nav-zone="center">
        <CenterNavCluster onNavigate={interactive ? onNavigate : undefined} />
      </div>

      <div className={styles.talkZone} data-nav-zone="talk">
        <GooeyTalkButton onNavigate={interactive ? onNavigate : undefined} />
      </div>
    </nav>
  );
}
