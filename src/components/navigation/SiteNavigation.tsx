'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { CenterNavCluster } from './CenterNavCluster';
import { GooeyTalkButton } from './GooeyTalkButton';
import { createCenterHoverMotion } from './centerHoverMotion';
import { type NavigationMode } from './navigationModel';
import { useNavigationThemes } from './useNavigationTheme';
import styles from './Navigation.module.css';
import mobileStyles from './NavigationMobile.module.css';

type NavigationLayer = 'experience' | 'route';

type SiteNavigationProps = {
  mode: NavigationMode;
  layer?: NavigationLayer;
  interactive?: boolean;
  onNavigate?: (href: string) => void;
};

export function SiteNavigation({
  mode,
  layer = 'experience',
  interactive = true,
  onNavigate,
}: SiteNavigationProps) {
  const rootRef = useRef<HTMLElement>(null);
  const themes = useNavigationThemes(mode === 'main', rootRef);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return createCenterHoverMotion(root, reducedMotion);
  }, []);

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
      className={`${styles.navRoot} ${mobileStyles.mobileAware}`}
      data-site-navigation
      data-navigation-mode={mode}
      data-navigation-layer={layer}
      data-navigation-disabled={interactive ? 'false' : 'true'}
      aria-label="Primary"
      inert={!interactive ? true : undefined}
    >
      <div
        className={styles.logoZone}
        data-nav-zone="logo"
        data-nav-theme={mode === 'main' ? themes.logo : undefined}
      >
        <a
          className={`${styles.pill} ${styles.logoPill} ${styles.pillFlood}`}
          href="/"
          aria-label="Weberaise home"
          data-pill-flood
        >
          <span className={styles.pillFloodSurface} data-pill-flood-surface aria-hidden="true" />
          <span className={styles.pillFloodBase} data-pill-flood-base aria-hidden="true">
            <span className={styles.logoMark} />
          </span>
          <span className={styles.pillFloodReveal} data-pill-flood-reveal aria-hidden="true">
            <span className={styles.logoMark} />
          </span>
        </a>
      </div>

      <div
        className={styles.centerZone}
        data-nav-zone="center"
        data-nav-theme={mode === 'main' ? themes.center : undefined}
      >
        <CenterNavCluster onNavigate={interactive ? onNavigate : undefined} />
      </div>

      <div
        className={styles.talkZone}
        data-nav-zone="talk"
        data-nav-theme={mode === 'main' ? themes.talk : undefined}
      >
        <GooeyTalkButton />
      </div>
    </nav>
  );
}
