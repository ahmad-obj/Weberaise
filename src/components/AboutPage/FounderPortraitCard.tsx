'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { getFounderCardRotation } from './founderCardMotion';
import type { Founder } from './founderTypes';
import styles from './FounderPortraitCard.module.css';

const SPRING = { damping: 30, stiffness: 100, mass: 2 } as const;

export function FounderPortraitCard({ founder }: { founder: Founder }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rawScale = useMotionValue(1);

  const rotateX = useSpring(rawRotateX, SPRING);
  const rotateY = useSpring(rawRotateY, SPRING);
  const scale = useSpring(rawScale, SPRING);

  const resetMotion = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    rawScale.set(1);
  };

  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType === 'touch') return;
    rawScale.set(1.07);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType === 'touch') return;
    const node = shellRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const rotation = getFounderCardRotation(
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
      rect.height,
    );

    rawRotateX.set(rotation.rotateX);
    rawRotateY.set(rotation.rotateY);
  };

  return (
    <article className={styles.card}>
      <div
        ref={shellRef}
        className={styles.shell}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetMotion}
      >
        <motion.div
          className={styles.tiltLayer}
          style={reducedMotion ? undefined : { rotateX, rotateY, scale }}
        >
          <div className={styles.frame}>
            <div className={styles.revealSurface} aria-hidden="true" />

            <div className={styles.imageLayer}>
              <motion.img
                src={founder.imageSrc}
                alt={founder.imageAlt}
                className={styles.image}
                style={{ objectPosition: founder.objectPosition }}
                loading={founder.id === '01' ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
              />
            </div>
          </div>

          <div className={styles.revealContent} aria-hidden="true">
            <span>{founder.id} / FOUNDER</span>
            <strong>{founder.revealTitle}</strong>
          </div>
        </motion.div>
      </div>

      <div className={styles.identity}>
        <h3>{founder.name}</h3>
        <p>{founder.role}</p>
      </div>
    </article>
  );
}
