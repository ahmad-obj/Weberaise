'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

export type NavigationTheme = 'dark' | 'light';
export type NavigationZone = 'logo' | 'center' | 'talk';
export type NavigationThemes = Record<NavigationZone, NavigationTheme>;

const ZONES: readonly NavigationZone[] = ['logo', 'center', 'talk'];
const DEFAULT_THEMES: NavigationThemes = {
  logo: 'dark',
  center: 'dark',
  talk: 'dark',
};

function themeUnderPoint(root: HTMLElement, x: number, y: number): NavigationTheme {
  const stack = document.elementsFromPoint(x, y);

  for (const element of stack) {
    if (root.contains(element)) continue;

    const themed = element.closest<HTMLElement>('[data-nav-theme]');
    if (!themed || root.contains(themed)) continue;

    return themed.dataset.navTheme === 'light' ? 'light' : 'dark';
  }

  return 'dark';
}

function themesEqual(left: NavigationThemes, right: NavigationThemes) {
  return ZONES.every((zone) => left[zone] === right[zone]);
}

export function useNavigationThemes(
  enabled: boolean,
  rootRef: RefObject<HTMLElement | null>,
): NavigationThemes {
  const [themes, setThemes] = useState<NavigationThemes>(DEFAULT_THEMES);

  useLayoutEffect(() => {
    if (!enabled) return undefined;

    let frame = 0;

    const readThemes = () => {
      frame = 0;
      const root = rootRef.current;
      if (!root) return;

      const next: NavigationThemes = { ...DEFAULT_THEMES };

      for (const zone of ZONES) {
        const element = root.querySelector<HTMLElement>(`[data-nav-zone="${zone}"]`);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        const x = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width * 0.5));
        const y = Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height * 0.5));
        next[zone] = themeUnderPoint(root, x, y);
      }

      setThemes((current) => (themesEqual(current, next) ? current : next));
    };

    const scheduleRead = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(readThemes);
    };

    readThemes();
    window.addEventListener('scroll', scheduleRead, { passive: true });
    window.addEventListener('resize', scheduleRead, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleRead);
      window.removeEventListener('resize', scheduleRead);
    };
  }, [enabled, rootRef]);

  return themes;
}
