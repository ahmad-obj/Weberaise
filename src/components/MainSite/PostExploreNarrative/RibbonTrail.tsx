'use client';

import { useId, type RefObject } from 'react';
import type { RibbonClipRect } from './buildJourneyPath';
import styles from './PostExploreNarrative.module.css';

type RibbonLayerBaseProps = {
  d: string;
  width: number;
  height: number;
};

type RibbonBackLayerProps = RibbonLayerBaseProps & {
  svgRef: RefObject<SVGSVGElement | null>;
  backPathRef: RefObject<SVGPathElement | null>;
};

type RibbonFrontLayerProps = RibbonLayerBaseProps & {
  frontPathRef: RefObject<SVGPathElement | null>;
  frontClipRects: readonly RibbonClipRect[];
};

function RibbonGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#2563EB" />
      <stop offset="42%" stopColor="#3B82F6" />
      <stop offset="68%" stopColor="#60A5FA" />
      <stop offset="100%" stopColor="#3B82F6" />
    </linearGradient>
  );
}

function viewBox(width: number, height: number) {
  return `0 0 ${Math.max(1, width)} ${Math.max(1, height)}`;
}

export function RibbonBackLayer({
  d,
  width,
  height,
  svgRef,
  backPathRef,
}: RibbonBackLayerProps) {
  const gradientId = `ribbon-back-${useId().replaceAll(':', '')}`;

  return (
    <svg
      ref={svgRef}
      className={`${styles.ribbonSvg} ${styles.ribbonSvgBack}`}
      viewBox={viewBox(width, height)}
      preserveAspectRatio="none"
      aria-hidden="true"
      data-ribbon-svg="back"
    >
      <defs>
        <RibbonGradient id={gradientId} />
      </defs>
      <path
        ref={backPathRef}
        className={styles.ribbonPath}
        data-ribbon-path="back"
        d={d}
        stroke={`url(#${gradientId})`}
      />
    </svg>
  );
}

export function RibbonFrontLayer({
  d,
  width,
  height,
  frontPathRef,
  frontClipRects,
}: RibbonFrontLayerProps) {
  const idBase = useId().replaceAll(':', '');
  const gradientId = `ribbon-front-${idBase}`;
  const clipId = `ribbon-front-clip-${idBase}`;

  return (
    <svg
      className={`${styles.ribbonSvg} ${styles.ribbonSvgFront}`}
      viewBox={viewBox(width, height)}
      preserveAspectRatio="none"
      aria-hidden="true"
      data-ribbon-svg="front"
    >
      <defs>
        <RibbonGradient id={gradientId} />
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          {frontClipRects.map((rect, index) => (
            <rect
              key={`${index}-${rect.x}-${rect.y}`}
              x={rect.x}
              y={rect.y}
              width={Math.max(0, rect.width)}
              height={Math.max(0, rect.height)}
              rx="18"
            />
          ))}
        </clipPath>
      </defs>
      <path
        ref={frontPathRef}
        className={styles.ribbonPath}
        data-ribbon-path="front"
        d={d}
        stroke={`url(#${gradientId})`}
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}
