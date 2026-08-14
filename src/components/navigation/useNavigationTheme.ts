'use client';

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

export type NavigationTheme = 'dark' | 'light';
export type NavigationZone = 'logo' | 'center' | 'talk';
export type NavigationThemes = Record<NavigationZone, NavigationTheme>;

type ZoneProbe = { x: number; y: number };
type ThemeRegion = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  theme: NavigationTheme;
};

const ZONES: readonly NavigationZone[] = ['logo', 'center', 'talk'];
const DEFAULT_THEMES: NavigationThemes = {
  logo: 'dark',
  center: 'dark',
  talk: 'dark',
};

function themesEqual(left: NavigationThemes, right: NavigationThemes) {
  return ZONES.every((zone) => left[zone] === right[zone]);
}

function themeForDocumentPoint(regions: ThemeRegion[], x: number, y: number): NavigationTheme {
  for (let index = regions.length - 1; index >= 0; index -= 1) {
    const region = regions[index];
    if (x < region.left || x > region.right || y < region.top || y > region.bottom) continue;
    return region.theme;
  }
  return 'dark';
}

export function useNavigationThemes(
  enabled: boolean,
  rootRef: RefObject<HTMLElement | null>,
): NavigationThemes {
  const [themes, setThemes] = useState<NavigationThemes>(DEFAULT_THEMES);
  const currentThemesRef = useRef<NavigationThemes>(DEFAULT_THEMES);

  useLayoutEffect(() => {
    if (!enabled) return undefined;

    const root = rootRef.current;
    if (!root) return undefined;

    let frame = 0;
    let geometryFrame = 0;
    let disposed = false;
    let probes: Partial<Record<NavigationZone, ZoneProbe>> = {};
    let regions: ThemeRegion[] = [];
    let observedThemeElements = new Set<HTMLElement>();

    const readThemes = () => {
      frame = 0;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const next: NavigationThemes = { ...DEFAULT_THEMES };

      for (const zone of ZONES) {
        const probe = probes[zone];
        if (!probe) continue;
        next[zone] = themeForDocumentPoint(regions, probe.x + scrollX, probe.y + scrollY);
      }

      if (themesEqual(currentThemesRef.current, next)) return;
      currentThemesRef.current = next;
      setThemes(next);
    };

    const scheduleRead = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(readThemes);
    };

    let resizeObserver: ResizeObserver;

    const refreshGeometry = () => {
      geometryFrame = 0;
      const currentRoot = rootRef.current;
      if (!currentRoot) return;

      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const nextProbes: Partial<Record<NavigationZone, ZoneProbe>> = {};

      for (const zone of ZONES) {
        const element = currentRoot.querySelector<HTMLElement>(`[data-nav-zone="${zone}"]`);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        nextProbes[zone] = {
          x: Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width * 0.5)),
          y: Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height * 0.5)),
        };
      }

      const themedElements = Array.from(
        document.querySelectorAll<HTMLElement>('[data-nav-theme]'),
      ).filter((element) => !currentRoot.contains(element));

      const nextRegions = themedElements.map<ThemeRegion>((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left + scrollX,
          right: rect.right + scrollX,
          top: rect.top + scrollY,
          bottom: rect.bottom + scrollY,
          theme: element.dataset.navTheme === 'light' ? 'light' : 'dark',
        };
      });

      const nextObservedThemeElements = new Set(themedElements);
      for (const element of observedThemeElements) {
        if (!nextObservedThemeElements.has(element)) resizeObserver.unobserve(element);
      }
      for (const element of nextObservedThemeElements) {
        if (!observedThemeElements.has(element)) resizeObserver.observe(element);
      }

      observedThemeElements = nextObservedThemeElements;
      probes = nextProbes;
      regions = nextRegions;
      readThemes();
    };

    const scheduleGeometry = () => {
      if (geometryFrame) return;
      geometryFrame = window.requestAnimationFrame(refreshGeometry);
    };

    resizeObserver = new ResizeObserver(scheduleGeometry);
    resizeObserver.observe(root);

    const mutationObserver = new MutationObserver((records) => {
      if (records.some((record) => !root.contains(record.target))) scheduleGeometry();
    });
    mutationObserver.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-nav-theme'],
    });

    refreshGeometry();
    window.addEventListener('scroll', scheduleRead, { passive: true });
    window.addEventListener('resize', scheduleGeometry, { passive: true });
    window.addEventListener('load', scheduleGeometry, { once: true });

    document.fonts?.ready
      .then(() => {
        if (!disposed) scheduleGeometry();
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      if (geometryFrame) window.cancelAnimationFrame(geometryFrame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', scheduleRead);
      window.removeEventListener('resize', scheduleGeometry);
      window.removeEventListener('load', scheduleGeometry);
    };
  }, [enabled, rootRef]);

  return themes;
}
