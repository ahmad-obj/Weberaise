'use client';

import { useCallback, useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import { createRevealEngine } from '@/webgl/reveal/createRevealEngine';
import { createPointerTracker } from '@/webgl/reveal/pointerTracker';
import { createHeroAutonomousStroke } from '@/webgl/reveal/emitters/autonomousEmitter';
import type { RevealEngine } from '@/webgl/reveal/RevealEngine';

type HeroPhase = 'heroOpening' | 'heroInteractive' | 'heroExiting';

type HeroRevealCanvasProps = {
  phase: HeroPhase;
  reducedMotion: boolean;
  rootRef: RefObject<HTMLElement | null>;
  engineRef: MutableRefObject<RevealEngine | null>;
};

type NavigatorWithMemory = Navigator & { deviceMemory?: number };

const BRAND_SRC = '/brand/weberaise-horizontal-on-dark.svg';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = async () => {
      try { await image.decode(); } catch {}
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Unable to load ${src}`));
    image.src = src;
  });
}

function createBrandLayer(root: HTMLElement, image: HTMLImageElement, scale: number): HTMLCanvasElement {
  const rootRect = root.getBoundingClientRect();
  const brand = root.querySelector<HTMLElement>('.hero-brand-lockup');
  const brandRect = brand?.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(rootRect.width * scale));
  canvas.height = Math.max(1, Math.round(rootRect.height * scale));
  const context = canvas.getContext('2d');
  if (!context || !brandRect) return canvas;

  const x = (brandRect.left - rootRect.left) * scale;
  const y = (brandRect.top - rootRect.top) * scale;
  const width = brandRect.width * scale;
  const height = brandRect.height * scale;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, x, y, width, height);
  return canvas;
}

function playAutonomousStroke(engine: RevealEngine, timers: number[]) {
  const duration = 0.64;
  const samples = createHeroAutonomousStroke();
  engine.resetInputStream();

  samples.forEach((sample, index) => {
    const delay = (index / Math.max(1, samples.length - 1)) * duration * 1000;
    const id = window.setTimeout(() => engine.emit([sample]), delay);
    timers.push(id);
  });
}

function installFallbackPointer(root: HTMLElement) {
  root.classList.add('is-reveal-fallback');
  const move = (event: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(1, rect.width)));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(1, rect.height)));
    root.style.setProperty('--fallback-x', `${x * 100}%`);
    root.style.setProperty('--fallback-y', `${y * 100}%`);
    root.classList.add('is-fallback-active');
  };
  const leave = () => root.classList.remove('is-fallback-active');
  root.addEventListener('pointermove', move, { passive: true });
  root.addEventListener('pointerup', leave, { passive: true });
  root.addEventListener('pointercancel', leave, { passive: true });
  root.addEventListener('pointerleave', leave, { passive: true });
  return () => {
    root.removeEventListener('pointermove', move);
    root.removeEventListener('pointerup', leave);
    root.removeEventListener('pointercancel', leave);
    root.removeEventListener('pointerleave', leave);
    root.classList.remove('is-reveal-fallback', 'is-fallback-active');
  };
}

export function HeroRevealCanvas({ phase, reducedMotion, rootRef, engineRef }: HeroRevealCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autonomousPlayed = useRef(false);
  const autonomousCancelled = useRef(false);
  const autonomousTimers = useRef<number[]>([]);
  const fallbackCleanup = useRef<(() => void) | null>(null);
  const [engineReady, setEngineReady] = useState(false);

  const cancelAutonomousStroke = useCallback(() => {
    if (autonomousCancelled.current) return;
    autonomousCancelled.current = true;
    autonomousTimers.current.forEach((id) => window.clearTimeout(id));
    autonomousTimers.current.length = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    // React Strict Mode and legitimate dependency changes may replay effects.
    // Re-arm one-shot lifecycle flags before beginning a new engine instance.
    autonomousPlayed.current = false;
    autonomousCancelled.current = false;
    autonomousTimers.current.length = 0;
    setEngineReady(false);

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let brandImage: HTMLImageElement | null = null;

    const initialize = async () => {
      await document.fonts.ready;
      try {
        brandImage = await loadImage(BRAND_SRC);
      } catch {
        brandImage = null;
      }
      if (disposed) return;

      if (!brandImage) {
        fallbackCleanup.current = installFallbackPointer(root);
        return;
      }

      const rect = root.getBoundingClientRect();
      const engine = createRevealEngine(canvas, {
        width: rect.width,
        height: rect.height,
        dpr: window.devicePixelRatio || 1,
        reducedMotion,
        deviceMemory: (navigator as NavigatorWithMemory).deviceMemory,
      });

      if (!engine) {
        fallbackCleanup.current = installFallbackPointer(root);
        return;
      }

      engineRef.current = engine;
      const refreshLayout = () => {
        const nextRect = root.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        engine.resize(nextRect.width, nextRect.height, dpr);
        const scale = Math.min(engine.quality.dprCap, Math.max(1, dpr));
        if (brandImage) engine.setLayers({ brand: createBrandLayer(root, brandImage, scale) });
      };

      refreshLayout();
      engine.start();
      resizeObserver = new ResizeObserver(refreshLayout);
      resizeObserver.observe(root);
      setEngineReady(true);
    };

    void initialize();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      fallbackCleanup.current?.();
      fallbackCleanup.current = null;
      cancelAutonomousStroke();
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [cancelAutonomousStroke, engineRef, reducedMotion, rootRef]);

  useEffect(() => {
    const root = rootRef.current;
    const engine = engineRef.current;
    if (!engineReady || !root || !engine || phase !== 'heroInteractive') return;

    engine.setMode('reveal');
    engine.resetInputStream();
    const radius = root.clientWidth < 720 ? 0.10 : 0.078;
    const tracker = createPointerTracker({
      maxSpacing: 0.022,
      radius,
      maxVelocity: 1.85,
      strength: 1,
    });
    let liveInputStarted = false;

    const resetStream = () => {
      tracker.reset();
      engine.resetInputStream();
    };

    const takeOverFromAutonomous = () => {
      if (liveInputStarted) return;
      liveInputStarted = true;
      cancelAutonomousStroke();
      resetStream();
    };

    const begin = () => {
      takeOverFromAutonomous();
      resetStream();
    };

    const move = (event: PointerEvent) => {
      takeOverFromAutonomous();
      const rect = root.getBoundingClientRect();
      const point = {
        x: Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(1, rect.width))),
        y: Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(1, rect.height))),
        time: performance.now() / 1000,
      };
      const samples = tracker.push(point);
      engine.emit(samples);
    };

    root.addEventListener('pointerdown', begin, { passive: true });
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerup', resetStream, { passive: true });
    root.addEventListener('pointercancel', resetStream, { passive: true });
    root.addEventListener('pointerleave', resetStream, { passive: true });
    return () => {
      root.removeEventListener('pointerdown', begin);
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerup', resetStream);
      root.removeEventListener('pointercancel', resetStream);
      root.removeEventListener('pointerleave', resetStream);
      resetStream();
    };
  }, [cancelAutonomousStroke, engineReady, engineRef, phase, rootRef]);

  useEffect(() => {
    const engine = engineRef.current;
    if (
      !engineReady ||
      !engine ||
      phase !== 'heroInteractive' ||
      autonomousPlayed.current ||
      autonomousCancelled.current
    ) return;

    autonomousPlayed.current = true;
    const delay = window.setTimeout(
      () => {
        if (!autonomousCancelled.current) playAutonomousStroke(engine, autonomousTimers.current);
      },
      reducedMotion ? 80 : 260,
    );
    autonomousTimers.current.push(delay);
  }, [engineReady, engineRef, phase, reducedMotion]);

  return (
    <>
      <canvas ref={canvasRef} className="hero-reveal-canvas" aria-hidden="true" />
      <div data-reveal-fallback className="hero-reveal-fallback" aria-hidden="true" />
    </>
  );
}
