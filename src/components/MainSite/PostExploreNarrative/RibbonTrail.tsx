'use client';

import type { RefObject, SVGAttributes } from 'react';
import styles from './PostExploreNarrative.module.css';

type RibbonTrailProps = SVGAttributes<SVGSVGElement> & {
  d: string;
  width: number;
  height: number;
  svgRef: RefObject<SVGSVGElement | null>;
  pathRef: RefObject<SVGPathElement | null>;
  'data-ribbon-svg'?: string;
};

export function RibbonTrail({
  d,
  width,
  height,
  svgRef,
  pathRef,
  ...svgProps
}: RibbonTrailProps) {
  return (
    <svg
      ref={svgRef}
      className={styles.ribbonSvg}
      viewBox={`0 0 ${Math.max(1, width)} ${Math.max(1, height)}`}
      preserveAspectRatio="none"
      {...svgProps}
    >
      <path ref={pathRef} className={styles.ribbonPath} data-ribbon-path d={d} />
    </svg>
  );
}
