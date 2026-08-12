'use client';

// Algorithm basis: https://reactbits.dev/text-animations/particle-text
// Source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ParticleText/ParticleText.tsx

import { useEffect, useRef } from 'react';
import {
  deterministicUnit,
  easeOutCubic,
  particleProfileForWidth,
} from './particleModel';
import styles from './PostExploreNarrative.module.css';

type Particle = {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  delay: number;
};

type Target = {
  x: number;
  y: number;
  alpha: number;
};

const WHITE = '#F5F7FA';
const GLOW_BLUE = '#60A5FA';
const ACCENT_BLUE = '#3B82F6';

function materialSizeChange(previous: DOMRectReadOnly | null, next: DOMRectReadOnly) {
  if (!previous) return true;
  return Math.abs(previous.width - next.width) > 4 || Math.abs(previous.height - next.height) > 4;
}

export function ParticleReassurance({ text }: { text: string }) {
  const displayLines = text.split('. ').map((line, index, lines) =>
    index < lines.length - 1 ? `${line}.` : line,
  );
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolvedRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    const resolved = resolvedRef.current;
    if (!frame || !canvas || !resolved) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;
    let particles: Particle[] = [];
    let profile = particleProfileForWidth(frame.clientWidth || window.innerWidth);
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame: number | null = null;
    let startTime = 0;
    let elapsedBeforePause = 0;
    let isIntersecting = false;
    let hasStarted = false;
    let isSettled = false;
    let buildId = 0;
    let lastRect: DOMRectReadOnly | null = null;

    const cancelFrame = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };

    const clearCanvas = () => {
      context.clearRect(0, 0, width, height);
    };

    const setSettled = (settled: boolean) => {
      isSettled = settled;
      frame.dataset.particleSettled = settled ? 'true' : 'false';
    };

    const drawParticle = (particle: Particle, x: number, y: number) => {
      context.fillStyle = particle.color;
      context.globalAlpha = 1;
      context.fillRect(x - particle.size / 2, y - particle.size / 2, particle.size, particle.size);
    };

    const drawSettledParticles = () => {
      clearCanvas();
      for (const particle of particles) {
        drawParticle(particle, particle.targetX, particle.targetY);
      }
      context.globalAlpha = 1;
    };

    const drawScatteredParticles = () => {
      clearCanvas();
      for (const particle of particles) {
        drawParticle(particle, particle.startX, particle.startY);
      }
      context.globalAlpha = 1;
    };

    const render = (now: number) => {
      const elapsed = elapsedBeforePause + (now - startTime);
      let complete = true;
      clearCanvas();

      for (const particle of particles) {
        const local = (elapsed - particle.delay) / profile.gatherDuration;
        const progress = Math.min(1, Math.max(0, local));
        const eased = easeOutCubic(progress);
        const x = particle.startX + (particle.targetX - particle.startX) * eased;
        const y = particle.startY + (particle.targetY - particle.startY) * eased;

        if (progress < 1) complete = false;
        drawParticle(particle, x, y);
      }

      context.globalAlpha = 1;

      if (complete) {
        drawSettledParticles();
        setSettled(true);
        animationFrame = null;
        return;
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    const startOrResume = () => {
      if (reducedMotion || isSettled || !particles.length || animationFrame !== null) return;
      hasStarted = true;
      startTime = performance.now();
      animationFrame = window.requestAnimationFrame(render);
    };

    const pause = () => {
      if (animationFrame === null || isSettled) return;
      elapsedBeforePause += performance.now() - startTime;
      cancelFrame();
    };

    const sampleText = async (animateAfterBuild: boolean) => {
      const currentBuild = ++buildId;
      const rect = frame.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      profile = particleProfileForWidth(width);
      dpr = Math.min(window.devicePixelRatio || 1, profile.dprCap);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const computed = window.getComputedStyle(resolved);
      const baseFontSize = Number.parseFloat(computed.fontSize) || 96;
      const baseLineHeight = Number.parseFloat(computed.lineHeight) || baseFontSize * 0.9;
      let resolvedFontSize = baseFontSize;
      const fontWeight = computed.fontWeight;
      const fontFamily = computed.fontFamily;
      let font = `${fontWeight} ${resolvedFontSize}px ${fontFamily}`;

      try {
        await document.fonts.load(font, text);
        await document.fonts.ready;
      } catch {
        // Continue with computed fallback font metrics if font loading is unavailable.
      }
      if (currentBuild !== buildId) return;

      const offscreen = document.createElement('canvas');
      const offscreenContext = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offscreenContext) return;

      const measureLines = () => {
        offscreenContext.font = font;
        return displayLines.map((line) => offscreenContext.measureText(line));
      };

      let lineMetrics = measureLines();
      let maxLineWidth = Math.max(1, ...lineMetrics.map((metrics) => metrics.width));
      const maxTextWidth = width * 0.88;
      if (maxLineWidth > maxTextWidth) {
        resolvedFontSize = Math.max(24, resolvedFontSize * (maxTextWidth / maxLineWidth));
        font = `${fontWeight} ${resolvedFontSize}px ${fontFamily}`;
        try {
          await document.fonts.load(font, text);
        } catch {
          // Continue with the resized computed font.
        }
        if (currentBuild !== buildId) return;
        lineMetrics = measureLines();
        maxLineWidth = Math.max(1, ...lineMetrics.map((metrics) => metrics.width));
      }

      const ascent = Math.ceil(
        Math.max(...lineMetrics.map((metrics) => metrics.actualBoundingBoxAscent || resolvedFontSize * 0.78)),
      );
      const descent = Math.ceil(
        Math.max(...lineMetrics.map((metrics) => metrics.actualBoundingBoxDescent || resolvedFontSize * 0.22)),
      );
      const lineBox = ascent + descent;
      const baselineStep = baseLineHeight * (resolvedFontSize / baseFontSize);
      const padding = Math.max(12, Math.ceil(resolvedFontSize * 0.1));
      const textHeight = lineBox + Math.max(0, displayLines.length - 1) * baselineStep;

      offscreen.width = Math.ceil(maxLineWidth) + padding * 2;
      offscreen.height = Math.ceil(textHeight) + padding * 2;
      offscreenContext.font = font;
      offscreenContext.textAlign = 'center';
      offscreenContext.textBaseline = 'alphabetic';
      offscreenContext.fillStyle = WHITE;
      offscreenContext.clearRect(0, 0, offscreen.width, offscreen.height);

      displayLines.forEach((line, index) => {
        const baseline = padding + ascent + index * baselineStep;
        offscreenContext.fillText(line, offscreen.width / 2, baseline);
      });

      const imageData = offscreenContext.getImageData(0, 0, offscreen.width, offscreen.height);
      const candidates: Target[] = [];
      const step = width < 720 ? 3 : 3;

      for (let y = 0; y < offscreen.height; y += step) {
        for (let x = 0; x < offscreen.width; x += step) {
          const alpha = imageData.data[(y * offscreen.width + x) * 4 + 3] ?? 0;
          if (alpha > 52) {
            candidates.push({
              x: width / 2 - offscreen.width / 2 + x,
              y: height / 2 - offscreen.height / 2 + y,
              alpha: alpha / 255,
            });
          }
        }
      }

      const stride = Math.max(1, Math.ceil(candidates.length / profile.maxParticles));
      const selected = candidates.filter((_, index) => index % stride === 0).slice(0, profile.maxParticles);

      particles = selected.map((target, index) => {
        const angle = deterministicUnit(index, 1) * Math.PI * 2;
        const scatter =
          profile.scatterMin +
          (profile.scatterMax - profile.scatterMin) * deterministicUnit(index, 2);
        const colorChoice = deterministicUnit(index, 3);
        const color = colorChoice > 0.955 ? GLOW_BLUE : colorChoice > 0.91 ? ACCENT_BLUE : WHITE;
        const size = 1.2 + target.alpha * 0.65 + deterministicUnit(index, 4) * 0.12;

        return {
          targetX: target.x,
          targetY: target.y,
          startX: target.x + Math.cos(angle) * scatter,
          startY: target.y + Math.sin(angle) * scatter,
          size,
          color,
          delay: deterministicUnit(index, 5) * 150,
        };
      });

      cancelFrame();
      elapsedBeforePause = 0;

      if (reducedMotion) {
        drawSettledParticles();
        setSettled(true);
        return;
      }

      if (isSettled && !animateAfterBuild) {
        drawSettledParticles();
        setSettled(true);
        return;
      }

      if (!animateAfterBuild) {
        setSettled(false);
        drawScatteredParticles();
        return;
      }

      setSettled(false);
      drawScatteredParticles();
      if (isIntersecting) startOrResume();
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isIntersecting = entry.isIntersecting;

        if (entry.isIntersecting) {
          if (!hasStarted && !reducedMotion) {
            hasStarted = true;
            void sampleText(true);
          } else {
            startOrResume();
          }
        } else {
          pause();
        }
      },
      { rootMargin: '10% 0px', threshold: 0.2 },
    );

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !materialSizeChange(lastRect, entry.contentRect)) return;
      lastRect = entry.contentRect;
      const shouldAnimate = hasStarted && !isSettled && !reducedMotion;
      void sampleText(shouldAnimate);
    });

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      cancelFrame();
      elapsedBeforePause = 0;

      if (reducedMotion) {
        setSettled(true);
        clearCanvas();
      } else {
        hasStarted = isIntersecting;
        setSettled(false);
        void sampleText(isIntersecting);
      }
    };

    frame.dataset.particleSettled = reducedMotion ? 'true' : 'false';
    intersectionObserver.observe(frame);
    resizeObserver.observe(frame);
    motionQuery.addEventListener('change', handleMotionPreference);

    // Prime deterministic geometry without triggering the gather before the scene approaches view.
    void sampleText(false);

    return () => {
      buildId += 1;
      cancelFrame();
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      motionQuery.removeEventListener('change', handleMotionPreference);
    };
  }, [text]);

  return (
    <section className={styles.reassuranceSection} data-particle-reassurance>
      <div ref={frameRef} className={styles.particleTextFrame} data-particle-settled="false">
        <h2 className="sr-only">{text}</h2>
        <canvas ref={canvasRef} className={styles.particleCanvas} aria-hidden="true" />
        <span ref={resolvedRef} className={styles.reassuranceResolved} aria-hidden="true">
          {displayLines.map((line) => (
            <span className={styles.reassuranceLine} key={line}>{line}</span>
          ))}
        </span>
      </div>
    </section>
  );
}
