'use client';

type DetachGeometry = {
  startScroll: number;
  travelRange: number;
  deltaX: number;
  deltaY: number;
};

type DetachElements = {
  origin: HTMLElement;
  shell: HTMLElement;
  footer: HTMLElement;
  stage: HTMLElement;
  dock: HTMLElement;
};

export function clampServicesDetachProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function servicesDetachScale(progress: number) {
  return 1 + clampServicesDetachProgress(progress);
}

function cubic(a: number, b: number, c: number, d: number, t: number) {
  const inv = 1 - t;
  return inv ** 3 * a + 3 * inv ** 2 * t * b + 3 * inv * t ** 2 * c + t ** 3 * d;
}

export function servicesDetachPoint(progress: number, deltaX: number, deltaY: number) {
  const t = clampServicesDetachProgress(progress);
  return {
    x: cubic(0, deltaX * 0.14, deltaX * 0.82, deltaX, t),
    y: cubic(0, Math.max(72, deltaY * 0.22), deltaY * 0.74, deltaY, t),
  };
}

function findDetachElements(): DetachElements | null {
  const origin = document.querySelector<HTMLElement>('[data-nav-detach-anchor]');
  const shell = document.querySelector<HTMLElement>('[data-services-detachable]');
  const footer = document.querySelector<HTMLElement>('[data-closing-footer]');
  const stage = document.querySelector<HTMLElement>('[data-closing-footer-stage]');
  const dock = document.querySelector<HTMLElement>('[data-services-footer-dock]');

  if (!origin || !shell || !footer || !stage || !dock) return null;
  return { origin, shell, footer, stage, dock };
}

function connectServicesDetachMotion({
  origin,
  shell,
  footer,
  stage,
  dock,
}: DetachElements): () => void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let geometry: DetachGeometry | null = null;
  let scrollFrame = 0;
  let geometryFrame = 0;
  let disposed = false;

  const updateFromScroll = () => {
    scrollFrame = 0;
    if (!geometry) return;

    const progress = clampServicesDetachProgress(
      (window.scrollY - geometry.startScroll) / geometry.travelRange,
    );
    const effective = reducedMotion ? (progress < 0.5 ? 0 : 1) : progress;
    const point = servicesDetachPoint(effective, geometry.deltaX, geometry.deltaY);
    const scale = servicesDetachScale(effective);

    shell.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) scale(${scale})`;
  };

  const scheduleScroll = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateFromScroll);
  };

  const refreshGeometry = () => {
    geometryFrame = 0;

    const originRect = origin.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const dockRect = dock.getBoundingClientRect();

    const originCenterX = originRect.left + originRect.width * 0.5;
    const originCenterY = originRect.top + originRect.height * 0.5;
    const dockPinnedCenterX = dockRect.left - stageRect.left + dockRect.width * 0.5;
    const dockPinnedCenterY = dockRect.top - stageRect.top + dockRect.height * 0.5;

    geometry = {
      startScroll: footerRect.top + window.scrollY - window.innerHeight,
      travelRange: Math.max(1, footerRect.height),
      deltaX: dockPinnedCenterX - originCenterX,
      deltaY: dockPinnedCenterY - originCenterY,
    };

    updateFromScroll();
  };

  const scheduleGeometry = () => {
    if (geometryFrame) return;
    geometryFrame = window.requestAnimationFrame(refreshGeometry);
  };

  const resizeObserver = new ResizeObserver(scheduleGeometry);
  resizeObserver.observe(origin);
  resizeObserver.observe(footer);
  resizeObserver.observe(stage);
  resizeObserver.observe(dock);

  refreshGeometry();
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleGeometry, { passive: true });
  window.addEventListener('load', scheduleGeometry, { once: true });

  document.fonts?.ready
    .then(() => {
      if (!disposed) scheduleGeometry();
    })
    .catch(() => undefined);

  return () => {
    disposed = true;
    if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    if (geometryFrame) window.cancelAnimationFrame(geometryFrame);
    resizeObserver.disconnect();
    window.removeEventListener('scroll', scheduleScroll);
    window.removeEventListener('resize', scheduleGeometry);
    window.removeEventListener('load', scheduleGeometry);
    shell.style.transform = 'translate3d(0, 0, 0) scale(1)';
  };
}

export function createServicesDetachMotion(): () => void {
  let disposed = false;
  let connectedCleanup: (() => void) | null = null;
  let waitObserver: MutationObserver | null = null;

  const tryConnect = () => {
    if (disposed || connectedCleanup) return;

    const elements = findDetachElements();
    if (!elements) return;

    connectedCleanup = connectServicesDetachMotion(elements);
    waitObserver?.disconnect();
    waitObserver = null;
  };

  tryConnect();

  if (!connectedCleanup) {
    waitObserver = new MutationObserver(tryConnect);
    waitObserver.observe(document.body, { childList: true, subtree: true });
  }

  return () => {
    disposed = true;
    waitObserver?.disconnect();
    waitObserver = null;
    connectedCleanup?.();
    connectedCleanup = null;
  };
}
