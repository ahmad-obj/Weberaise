'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  getBaseVelocity,
  getVelocityEase,
  getVelocityTarget,
  type DriftDirection,
} from './driftWallMotion';
import styles from './DriftWall.module.css';

export type DriftWallItem = {
  id: string;
  image: string;
};

export type DriftWallProps = {
  items: readonly DriftWallItem[];
  columns?: number;
  speed?: number;
  variance?: number;
  direction?: DriftDirection;
  tilt?: number;
  turn?: number;
  perspective?: number;
  depth?: number;
  parallax?: number;
  lift?: number;
  className?: string;
};

type ColumnMeta = {
  copyHeight: number;
  copies: number;
};

type Geometry = {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  gap: number;
};

const INITIAL_GEOMETRY: Geometry = {
  width: 720,
  height: 640,
  tileWidth: 220,
  tileHeight: 165,
  gap: 16,
};

function readReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function DriftWall({
  items,
  columns = 3,
  speed = 30,
  variance = 0.22,
  direction = 'up',
  tilt = 10,
  turn = -10,
  perspective = 1400,
  depth = 90,
  parallax = 0.42,
  lift = 42,
  className = '',
}: DriftWallProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const offsetsRef = useRef<number[]>([]);
  const velocitiesRef = useRef<number[]>([]);
  const hoveredColRef = useRef(-1);
  const activeIdRef = useRef<string | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pointerDampedRef = useRef({ x: 0, y: 0 });
  const lastTsRef = useRef<number | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(true);
  const [geometry, setGeometry] = useState<Geometry>(INITIAL_GEOMETRY);

  const safeColumns = Math.max(1, Math.round(columns));

  const columnItems = useMemo<DriftWallItem[][]>(() => {
    if (items.length === 0) return [];
    const result = Array.from({ length: safeColumns }, () => [] as DriftWallItem[]);
    items.forEach((item, index) => result[index % safeColumns].push(item));
    return result.map((column) => (column.length ? column : [items[0]]));
  }, [items, safeColumns]);

  const columnMeta = useMemo<ColumnMeta[]>(() => {
    const unit = geometry.tileHeight + geometry.gap;
    return columnItems.map((column) => {
      const copyHeight = Math.max(unit, column.length * unit);
      const copies = Math.max(2, Math.ceil((geometry.height * 1.7) / copyHeight) + 1);
      return { copyHeight, copies };
    });
  }, [columnItems, geometry.gap, geometry.height, geometry.tileHeight]);

  const baseVelocities = useMemo(
    () => columnItems.map((_, index) => getBaseVelocity(index, speed, variance, direction)),
    [columnItems, direction, speed, variance],
  );

  useEffect(() => {
    setReduced(readReducedMotion());
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width || INITIAL_GEOMETRY.width;
      const height = entry.contentRect.height || INITIAL_GEOMETRY.height;
      const gap = width < 640 ? 8 : width < 900 ? 12 : 16;
      const minTile = width < 640 ? 92 : 150;
      const maxTile = width < 640 ? 132 : 270;
      const tileWidth = Math.min(maxTile, Math.max(minTile, (width - gap * 2) / 3));
      const tileHeight = tileWidth * 0.75;
      setGeometry({ width, height, gap, tileWidth, tileHeight });
    });

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry.isIntersecting),
      { rootMargin: '240px 0px' },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    offsetsRef.current = columnMeta.map(
      (meta, index) => meta.copyHeight * ((index * 0.37) % 1),
    );
    velocitiesRef.current = columnItems.map(() => 0);
    trackRefs.current.forEach((track, index) => {
      const offset = offsetsRef.current[index] ?? 0;
      if (track) track.style.transform = `translate3d(0, ${-offset}px, 0)`;
    });
  }, [columnItems, columnMeta]);

  const applyPlaneTransform = useCallback((pointerX: number, pointerY: number) => {
    const plane = planeRef.current;
    if (!plane) return;
    plane.style.transform =
      `translate(-50%, -50%) scale(1.18) `
      + `rotateX(${tilt + pointerY}deg) rotateY(${turn + pointerX}deg) `
      + `translateZ(${-depth}px)`;
  }, [depth, tilt, turn]);

  useEffect(() => {
    if (reduced || !isNearViewport || columnItems.length === 0) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
      pointerDampedRef.current = { x: 0, y: 0 };
      applyPlaneTransform(0, 0);
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTsRef.current === null) lastTsRef.current = timestamp;
      const dt = Math.min(0.05, Math.max(0, timestamp - lastTsRef.current) / 1000);
      lastTsRef.current = timestamp;

      const maxTilt = parallax * 8;
      const targetX = pointerRef.current.x * maxTilt;
      const targetY = -pointerRef.current.y * maxTilt;
      const pointerEase = 1 - Math.exp(-dt / 0.12);
      pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * pointerEase;
      pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * pointerEase;
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);

      columnMeta.forEach((meta, columnIndex) => {
        const baseVelocity = baseVelocities[columnIndex] ?? 0;
        const target = getVelocityTarget(baseVelocity, columnIndex, hoveredColRef.current);
        const ease = getVelocityEase(dt, target);
        const current = velocitiesRef.current[columnIndex] ?? 0;
        velocitiesRef.current[columnIndex] = current + (target - current) * ease;

        let next = (offsetsRef.current[columnIndex] ?? 0)
          + velocitiesRef.current[columnIndex] * dt;
        next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
        offsetsRef.current[columnIndex] = next;

        const track = trackRefs.current[columnIndex];
        if (track) track.style.transform = `translate3d(0, ${-next}px, 0)`;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [applyPlaneTransform, baseVelocities, columnItems.length, columnMeta, isNearViewport, parallax, reduced]);

  const clearActiveTile = useCallback(() => {
    if (activeIdRef.current !== null) {
      activeIdRef.current = null;
      setActiveId(null);
    }
    hoveredColRef.current = -1;
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const root = containerRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    if (!reduced && parallax > 0) {
      pointerRef.current = {
        x: (event.clientX - rect.left) / rect.width - 0.5,
        y: (event.clientY - rect.top) / rect.height - 0.5,
      };
    }

    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const tile = hit instanceof Element
      ? hit.closest<HTMLElement>('[data-drift-tile]')
      : null;

    if (!tile || !root.contains(tile)) {
      clearActiveTile();
      return;
    }

    const id = tile.dataset.tileId ?? null;
    const column = Number(tile.dataset.col ?? -1);
    if (!id || !Number.isFinite(column)) {
      clearActiveTile();
      return;
    }

    hoveredColRef.current = column;
    if (activeIdRef.current === id) return;
    activeIdRef.current = id;
    setActiveId(id);
  }, [clearActiveTile, parallax, reduced]);

  const handlePointerLeave = useCallback(() => {
    pointerRef.current = { x: 0, y: 0 };
    clearActiveTile();
  }, [clearActiveTile]);

  if (items.length === 0) return null;

  const cssVariables = {
    '--dw-tile-w': `${geometry.tileWidth}px`,
    '--dw-tile-h': `${geometry.tileHeight}px`,
    '--dw-gap': `${geometry.gap}px`,
    '--dw-perspective': `${perspective}px`,
    '--dw-lift': `${lift}px`,
  } as CSSProperties;

  const rootClassName = [styles.root, reduced ? styles.reduced : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={rootClassName}
      style={cssVariables}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-hidden="true"
    >
      <div ref={planeRef} className={styles.plane}>
        {columnItems.map((column, columnIndex) => {
          const meta = columnMeta[columnIndex];
          if (!meta) return null;
          return (
            <div className={styles.column} key={`column-${columnIndex}`}>
              <div
                className={styles.track}
                ref={(element: HTMLDivElement | null) => { trackRefs.current[columnIndex] = element; }}
              >
                {Array.from({ length: meta.copies }, (_, copyIndex) =>
                  column.map((item, itemIndex) => {
                    const tileId = `${columnIndex}-${copyIndex}-${itemIndex}-${item.id}`;
                    return (
                      <div
                        key={tileId}
                        className={styles.tile}
                        data-drift-tile
                        data-tile-id={tileId}
                        data-col={columnIndex}
                        data-active={activeId === tileId ? 'true' : 'false'}
                      >
                        <span className={styles.tileInner}>
                          <img
                            src={item.image}
                            alt=""
                            draggable={false}
                            decoding="async"
                            loading="lazy"
                          />
                          <span className={styles.overlay} aria-hidden="true" />
                        </span>
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          );
        })}
      </div>
      <span className={styles.fadeTop} aria-hidden="true" />
      <span className={styles.fadeBottom} aria-hidden="true" />
    </div>
  );
}
