'use client';

import { useEffect } from 'react';

export function ServicesHashHandoff() {
  useEffect(() => {
    if (window.location.hash !== '#contact') return undefined;

    let frame = 0;
    let cancelled = false;

    const scrollWhenReady = () => {
      if (cancelled) return;

      const servicesPage = document.querySelector<HTMLElement>('[data-index-interactive]');
      const contact = document.getElementById('contact');
      const introStillLocked = document.body.style.overflow === 'hidden';
      const indexReady = servicesPage?.dataset.indexInteractive === 'true';

      if (!contact || !indexReady || introStillLocked) {
        frame = window.requestAnimationFrame(scrollWhenReady);
        return;
      }

      contact.scrollIntoView({ behavior: 'auto', block: 'start' });
    };

    frame = window.requestAnimationFrame(scrollWhenReady);

    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
