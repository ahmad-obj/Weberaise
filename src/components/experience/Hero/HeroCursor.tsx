'use client';

import { useEffect, useRef, type RefObject } from 'react';

export function HeroCursor({ active, rootRef }: { active: boolean; rootRef: RefObject<HTMLElement | null> }) {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    if (!root || !dot || !active) return;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (!finePointer) return;

    const move = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      dot.style.transform = `translate3d(${event.clientX - rect.left}px, ${event.clientY - rect.top}px, 0)`;
      dot.dataset.visible = 'true';
    };
    const leave = () => { dot.dataset.visible = 'false'; };

    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerleave', leave, { passive: true });
    return () => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
      dot.dataset.visible = 'false';
    };
  }, [active, rootRef]);

  return <div ref={dotRef} className="hero-cursor" data-visible="false" aria-hidden="true" />;
}
