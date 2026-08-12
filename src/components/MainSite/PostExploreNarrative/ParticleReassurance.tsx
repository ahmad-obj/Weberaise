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
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  seed: number;
  depth: number;
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
const pointerRepel = 42;
const repelRadius = 120;
const idleDrift = 0.55;

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

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return undefined;

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
    let resizeFrame: number | null = null;
    let buildId = 0;
    let isIntersecting = false;
    let hasStarted = false;
    let gathering = false;
    let gatherStart = 0;
    let gatherElapsedBeforePause = 0;
    let lastRect: DOMRectReadOnly | null = null;

    const pointer = {
      active: false,
      x: 0,
      y: 0,
      smoothX: 0,
      smoothY: 0,
    };

    const cancelFrame = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };

    const clearCanvas = () => {
      context.clearRect(0, 0, width, height);
    };

    const drawParticle = (particle: Particle, x = particle.x, y = particle.y) => {
      context.fillStyle = particle.color;
      context.fillRect(x - particle.size / 2, y - particle.size / 2, particle.size, particle.size);
    };

    const drawCurrentParticles = () => {
      clearCanvas();
      for (const particle of particles) drawParticle(particle);
    };

    const drawSettledParticles = () => {
      clearCanvas();
      for (const particle of particles) drawParticle(particle, particle.targetX, particle.targetY);
    };

    const ensureRenderLoop = () => {
      if (reducedMotion || !isIntersecting || animationFrame !== null || particles.length === 0) return;
      animationFrame = window.requestAnimationFrame(render);
    };

    const render = (now: number) => {
      animationFrame = null;
      clearCanvas();

      pointer.smoothX += (pointer.x - pointer.smoothX) * 0.18;
      pointer.smoothY += (pointer.y - pointer.smoothY) * 0.18;

      let gatherComplete = true;

      for (const particle of particles) {
        let baseX = particle.targetX;
        let baseY = particle.targetY;

        if (gathering) {
          const elapsed = gatherElapsedBeforePause + (now - gatherStart);
          const local = (elapsed - particle.delay) / profile.gatherDuration;
          const progress = Math.min(1, Math.max(0, local));
          const eased = easeOutCubic(progress);
          baseX = particle.startX + (particle.targetX - particle.startX) * eased;
          baseY = particle.startY + (particle.targetY - particle.startY) * eased;
          if (progress < 1) gatherComplete = false;
        } else {
          const driftTime = now * 0.001;
          baseX += Math.sin(driftTime * 0.9 + particle.seed * 10) * idleDrift * particle.depth;
          baseY += Math.cos(driftTime * 0.75 + particle.depth * 10) * idleDrift * particle.depth;
        }

        if (pointer.active) {
          const dx = baseX - pointer.smoothX;
          const dy = baseY - pointer.smoothY;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < repelRadius) {
            const force = Math.pow(1 - distance / repelRadius, 2) * pointerRepel;
            baseX += (dx / distance) * force;
            baseY += (dy / distance) * force;
          }
        }

        particle.x += (baseX - particle.x) * 0.22;
        particle.y += (baseY - particle.y) * 0.22;
        drawParticle(particle);
      }

      if (gathering && gatherComplete) {
        gathering = false;
        gatherElapsedBeforePause = 0;
      }

      ensureRenderLoop();
    };

    const startGather = () => {
      if (reducedMotion || particles.length === 0) return;
      hasStarted = true;
      gathering = true;
      gatherElapsedBeforePause = 0;
      gatherStart = performance.now();
      particles.forEach((particle) => {
        particle.startX = particle.x;
        particle.startY = particle.y;
      });
      ensureRenderLoop();
    };

    const pause = () => {
      if (animationFrame !== null && gathering) {
        gatherElapsedBeforePause += performance.now() - gatherStart;
      }
      cancelFrame();
    };

    const resume = () => {
      if (gathering) gatherStart = performance.now();
      ensureRenderLoop();
    };

    const sampleText = async (scatterInitial: boolean) => {
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

      const computed = window.getComputedStyle(frame);
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
        // Computed fallback metrics remain usable if font loading is unavailable.
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
        offscreenContext.fillText(line, offscreen.width / 2, padding + ascent + index * baselineStep);
      });

      const imageData = offscreenContext.getImageData(0, 0, offscreen.width, offscreen.height);
      const candidates: Target[] = [];
      const step = 3;

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
        const seed = deterministicUnit(index, 1);
        const depth = 0.5 + deterministicUnit(index, 2) * 0.85;
        const angle = deterministicUnit(index, 3) * Math.PI * 2;
        const scatter =
          profile.scatterMin +
          (profile.scatterMax - profile.scatterMin) * deterministicUnit(index, 4);
        const colorChoice = deterministicUnit(index, 5);
        const color = colorChoice > 0.955 ? GLOW_BLUE : colorChoice > 0.91 ? ACCENT_BLUE : WHITE;
        const size = 1.2 + target.alpha * 0.65 + deterministicUnit(index, 6) * 0.12;
        const startX = scatterInitial ? target.x + Math.cos(angle) * scatter : target.x;
        const startY = scatterInitial ? target.y + Math.sin(angle) * scatter : target.y;

        return {
          x: startX,
          y: startY,
          startX,
          startY,
          targetX: target.x,
          targetY: target.y,
          size,
          color,
          seed,
          depth,
          delay: deterministicUnit(index, 7) * 150,
        };
      });

      pointer.x = width / 2;
      pointer.y = height / 2;
      pointer.smoothX = pointer.x;
      pointer.smoothY = pointer.y;
      gathering = false;
      gatherElapsedBeforePause = 0;

      if (reducedMotion) {
        drawSettledParticles();
        return;
      }

      drawCurrentParticles();

      if (scatterInitial && isIntersecting && !hasStarted) {
        startGather();
      } else if (isIntersecting) {
        ensureRenderLoop();
      }
    };

    const queueSample = () => {
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        void sampleText(!hasStarted);
      });
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isIntersecting = entry.isIntersecting;

        if (entry.isIntersecting) {
          if (!hasStarted) startGather();
          else resume();
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
      queueSample();
    });

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
      ensureRenderLoop();
    };

    const handlePointerEnter = (event: PointerEvent) => {
      handlePointerMove(event);
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      cancelFrame();
      if (reducedMotion) {
        gathering = false;
        drawSettledParticles();
      } else if (isIntersecting) {
        ensureRenderLoop();
      }
    };

    intersectionObserver.observe(frame);
    resizeObserver.observe(frame);
    canvas.addEventListener('pointerenter', handlePointerEnter);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    motionQuery.addEventListener('change', handleMotionPreference);
    void sampleText(true);

    return () => {
      buildId += 1;
      cancelFrame();
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerenter', handlePointerEnter);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      motionQuery.removeEventListener('change', handleMotionPreference);
    };
  }, [text]);

  return (
    <section className={styles.reassuranceSection} data-particle-reassurance>
      <div ref={frameRef} className={styles.particleTextFrame} aria-label={text}>
        <h2 className="sr-only">{text}</h2>
        <canvas ref={canvasRef} className={styles.particleCanvas} aria-hidden="true" />
      </div>
    </section>
  );
}
