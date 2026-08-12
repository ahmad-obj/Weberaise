'use client';

import { useEffect, useState } from 'react';

export type NavigationTheme = 'dark' | 'light';

const DEFAULT_THEME: NavigationTheme = 'dark';
const NAV_PROBE_Y = 48;

export function useNavigationTheme(enabled: boolean): NavigationTheme {
  const [theme, setTheme] = useState<NavigationTheme>(DEFAULT_THEME);

  useEffect(() => {
    if (!enabled) return undefined;

    let frame = 0;

    const readTheme = () => {
      frame = 0;
      const probeY = Math.min(Math.max(0, NAV_PROBE_Y), Math.max(0, window.innerHeight - 1));
      const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-theme]'));
      const activeSection = sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= probeY && rect.bottom > probeY;
      });
      const nextTheme: NavigationTheme = activeSection?.dataset.navTheme === 'light' ? 'light' : 'dark';
      setTheme((current) => (current === nextTheme ? current : nextTheme));
    };

    const scheduleRead = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(readTheme);
    };

    scheduleRead();
    window.addEventListener('scroll', scheduleRead, { passive: true });
    window.addEventListener('resize', scheduleRead, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleRead);
      window.removeEventListener('resize', scheduleRead);
    };
  }, [enabled]);

  return theme;
}
