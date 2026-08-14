'use client';

import gsap from 'gsap';

const PLATE_INSET = 3;

type NavItem = HTMLElement;

export function createCenterHoverMotion(root: HTMLElement, reducedMotion: boolean): () => void {
  const plate = root.querySelector<HTMLElement>('[data-center-hover-plate]');
  const plateLabel = root.querySelector<HTMLElement>('[data-center-hover-label]');
  const links = Array.from(root.querySelectorAll<HTMLElement>('[data-center-nav-link]'));
  if (!plate || !plateLabel || links.length === 0) return () => undefined;

  let activeLink: NavItem | null = null;
  let focusFrame = 0;

  const positionPlate = (link: NavItem, animate: boolean) => {
    const rootRect = root.getBoundingClientRect();
    const targetRect = link.getBoundingClientRect();
    const slot = link.closest<HTMLElement>('[data-nav-item]');
    plateLabel.textContent = slot?.dataset.navLabel ?? link.textContent?.trim() ?? '';

    const vars = {
      x: targetRect.left - rootRect.left + PLATE_INSET,
      y: targetRect.top - rootRect.top + PLATE_INSET,
      width: Math.max(0, targetRect.width - PLATE_INSET * 2),
      height: Math.max(0, targetRect.height - PLATE_INSET * 2),
      opacity: 1,
      scale: 1,
      overwrite: 'auto' as const,
    };

    if (!animate || reducedMotion) {
      gsap.set(plate, vars);
      return;
    }

    gsap.to(plate, {
      ...vars,
      duration: 0.32,
      ease: 'power3.out',
    });
  };

  const activate = (link: NavItem) => {
    activeLink = link;
    positionPlate(link, true);
  };

  const hide = () => {
    activeLink = null;
    gsap.to(plate, {
      opacity: 0,
      scale: 0.82,
      duration: reducedMotion ? 0 : 0.16,
      ease: reducedMotion ? 'none' : 'power2.out',
      overwrite: 'auto',
    });
  };

  const cleanups: Array<() => void> = [];
  for (const link of links) {
    const onPointerEnter = () => activate(link);
    const onFocus = () => activate(link);
    link.addEventListener('pointerenter', onPointerEnter);
    link.addEventListener('focus', onFocus);
    cleanups.push(() => {
      link.removeEventListener('pointerenter', onPointerEnter);
      link.removeEventListener('focus', onFocus);
    });
  }

  const onPointerLeave = () => {
    if (root.contains(document.activeElement)) return;
    hide();
  };

  const onFocusOut = () => {
    window.cancelAnimationFrame(focusFrame);
    focusFrame = window.requestAnimationFrame(() => {
      if (!root.contains(document.activeElement)) hide();
    });
  };

  root.addEventListener('pointerleave', onPointerLeave);
  root.addEventListener('focusout', onFocusOut);

  const resizeObserver = new ResizeObserver(() => {
    if (activeLink) positionPlate(activeLink, false);
  });
  resizeObserver.observe(root);
  for (const link of links) resizeObserver.observe(link);

  gsap.set(plate, { opacity: 0, scale: 0.82, transformOrigin: '50% 50%' });

  return () => {
    window.cancelAnimationFrame(focusFrame);
    root.removeEventListener('pointerleave', onPointerLeave);
    root.removeEventListener('focusout', onFocusOut);
    for (const cleanup of cleanups) cleanup();
    resizeObserver.disconnect();
    gsap.killTweensOf(plate);
  };
}
