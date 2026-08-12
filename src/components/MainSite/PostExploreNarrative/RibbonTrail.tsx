'use client';

import { useId, type RefObject } from 'react';
import type { RibbonClipRect, RibbonTaperGeometry } from './buildJourneyPath';
import styles from './PostExploreNarrative.module.css';

type RibbonLayerBaseProps = { d: string; width: number; height: number };
type RibbonBackLayerProps = RibbonLayerBaseProps & {
  svgRef: RefObject<SVGSVGElement | null>;
  backPathRef: RefObject<SVGPathElement | null>;
  taperRevealPathRef: RefObject<SVGPathElement | null>;
  taper: RibbonTaperGeometry;
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

function polygonString(taper: RibbonTaperGeometry) {
  return taper.polygonPoints.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
}

export function RibbonBackLayer({
  d,
  width,
  height,
  svgRef,
  backPathRef,
  taperRevealPathRef,
  taper,
}: RibbonBackLayerProps) {
  const idBase = useId().replaceAll(':', '');
  const gradientId = `ribbon-back-${idBase}`;
  const ribbonBackClip = `ribbon-back-clip-${idBase}`;
  const taperRevealMask = `ribbon-taper-mask-${idBase}`;
  const clipHeight = Math.max(0, Math.min(height, taper.startLocalY + 7));

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
        <clipPath id={ribbonBackClip} clipPathUnits="userSpaceOnUse">
          <rect x="-24" y="-24" width={width + 48} height={clipHeight + 24} />
        </clipPath>
        <mask id={taperRevealMask} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
          <rect x="0" y="0" width={width} height={height} fill="black" />
          <path
            ref={taperRevealPathRef}
            d={taper.centerlineD}
            fill="none"
            stroke="white"
            strokeWidth="18"
            strokeLinecap="round"
            data-ribbon-taper-reveal
          />
        </mask>
      </defs>
      <path
        ref={backPathRef}
        className={styles.ribbonPath}
        data-ribbon-path="back"
        d={d}
        stroke={`url(#${gradientId})`}
        clipPath={`url(#${ribbonBackClip})`}
      />
      {taper.polygonPoints.length > 2 ? (
        <polygon
          className={styles.ribbonTaper}
          points={polygonString(taper)}
          fill={`url(#${gradientId})`}
          mask={`url(#${taperRevealMask})`}
          data-ribbon-taper
        />
      ) : null}
    </svg>
  );
}

export function RibbonFrontLayer({ d, width, height, frontPathRef, frontClipRects }: RibbonFrontLayerProps) {
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
            <rect key={`${index}-${rect.x}-${rect.y}`} x={rect.x} y={rect.y} width={Math.max(0, rect.width)} height={Math.max(0, rect.height)} rx="18" />
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
