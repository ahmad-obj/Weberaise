'use client';

import { useId, type RefObject } from 'react';
import type { RibbonClipRect, RibbonTaperGeometry } from './buildJourneyPath';
import styles from './PostExploreNarrative.module.css';

type RibbonLayerBaseProps = { d: string; width: number; height: number };
type RibbonBackLayerProps = RibbonLayerBaseProps & {
  svgRef: RefObject<SVGSVGElement | null>;
  backBasePathRef: RefObject<SVGPathElement | null>;
  backHighlightPathRef: RefObject<SVGPathElement | null>;
  taperRevealPathRef: RefObject<SVGPathElement | null>;
  taper: RibbonTaperGeometry;
};
type RibbonFrontLayerProps = RibbonLayerBaseProps & {
  frontBasePathRef: RefObject<SVGPathElement | null>;
  frontHighlightPathRef: RefObject<SVGPathElement | null>;
  frontClipRects: readonly RibbonClipRect[];
};

function RibbonBaseGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#1D4ED8" />
      <stop offset="34%" stopColor="#3B82F6" />
      <stop offset="56%" stopColor="#93C5FD" />
      <stop offset="72%" stopColor="#60A5FA" />
      <stop offset="100%" stopColor="#2563EB" />
    </linearGradient>
  );
}

function RibbonHighlightGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0" />
      <stop offset="50%" stopColor="#DBEAFE" stopOpacity="1" />
      <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0" />
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
  backBasePathRef,
  backHighlightPathRef,
  taperRevealPathRef,
  taper,
}: RibbonBackLayerProps) {
  const idBase = useId().replaceAll(':', '');
  const baseGradientId = `ribbon-back-base-${idBase}`;
  const highlightGradientId = `ribbon-back-highlight-${idBase}`;
  const ribbonBackClip = `ribbon-back-clip-${idBase}`;
  const taperRevealMask = `ribbon-taper-mask-${idBase}`;
  const taperShapeClip = `ribbon-taper-shape-${idBase}`;
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
        <RibbonBaseGradient id={baseGradientId} />
        <RibbonHighlightGradient id={highlightGradientId} />
        <clipPath id={ribbonBackClip} clipPathUnits="userSpaceOnUse">
          <rect x="-24" y="-24" width={width + 48} height={clipHeight + 24} />
        </clipPath>
        <clipPath id={taperShapeClip} clipPathUnits="userSpaceOnUse">
          <polygon points={polygonString(taper)} />
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
        ref={backBasePathRef}
        className={`${styles.ribbonPath} ${styles.ribbonPathBase}`}
        data-ribbon-path="back"
        data-ribbon-stroke="base"
        d={d}
        stroke={`url(#${baseGradientId})`}
        clipPath={`url(#${ribbonBackClip})`}
      />
      <path
        ref={backHighlightPathRef}
        className={`${styles.ribbonPath} ${styles.ribbonPathHighlight}`}
        data-ribbon-path="back-highlight"
        data-ribbon-stroke="highlight"
        d={d}
        stroke={`url(#${highlightGradientId})`}
        clipPath={`url(#${ribbonBackClip})`}
      />
      {taper.polygonPoints.length > 2 ? (
        <>
          <polygon
            className={`${styles.ribbonTaper} ${styles.ribbonTaperBase}`}
            points={polygonString(taper)}
            fill={`url(#${baseGradientId})`}
            mask={`url(#${taperRevealMask})`}
            data-ribbon-taper
          />
          <path
            className={styles.ribbonTaperHighlight}
            d={taper.centerlineD}
            fill="none"
            stroke={`url(#${highlightGradientId})`}
            clipPath={`url(#${taperShapeClip})`}
            mask={`url(#${taperRevealMask})`}
            data-ribbon-taper-highlight
          />
        </>
      ) : null}
    </svg>
  );
}

export function RibbonFrontLayer({ d, width, height, frontBasePathRef, frontHighlightPathRef, frontClipRects }: RibbonFrontLayerProps) {
  const idBase = useId().replaceAll(':', '');
  const baseGradientId = `ribbon-front-base-${idBase}`;
  const highlightGradientId = `ribbon-front-highlight-${idBase}`;
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
        <RibbonBaseGradient id={baseGradientId} />
        <RibbonHighlightGradient id={highlightGradientId} />
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          {frontClipRects.map((rect, index) => (
            <rect key={`${index}-${rect.x}-${rect.y}`} x={rect.x} y={rect.y} width={Math.max(0, rect.width)} height={Math.max(0, rect.height)} rx="18" />
          ))}
        </clipPath>
      </defs>
      <path
        ref={frontBasePathRef}
        className={`${styles.ribbonPath} ${styles.ribbonPathBase}`}
        data-ribbon-path="front"
        data-ribbon-stroke="base"
        d={d}
        stroke={`url(#${baseGradientId})`}
        clipPath={`url(#${clipId})`}
      />
      <path
        ref={frontHighlightPathRef}
        className={`${styles.ribbonPath} ${styles.ribbonPathHighlight}`}
        data-ribbon-path="front-highlight"
        data-ribbon-stroke="highlight"
        d={d}
        stroke={`url(#${highlightGradientId})`}
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}
