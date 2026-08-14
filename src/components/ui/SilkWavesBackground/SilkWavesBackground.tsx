'use client';

import { useEffect, useRef, useState } from 'react';
import { dampScalar, getRenderSize, getTailRootMargin } from './silkMath';
import { SILK_FRAGMENT_SHADER, SILK_VERTEX_SHADER } from './silkShaders';
import styles from './SilkWavesBackground.module.css';

type SilkWavesBackgroundProps = {
  activeTargetId: string;
};

type WebglState = 'idle' | 'ready' | 'fallback';

type Uniforms = {
  resolution: WebGLUniformLocation;
  time: WebGLUniformLocation;
  pointer: WebGLUniformLocation;
};

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create shader.');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, SILK_VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, SILK_FRAGMENT_SHADER);
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    throw new Error('Unable to create WebGL program.');
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'Unknown shader link error.';
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function requireUniform(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);
  if (!location) throw new Error(`Missing Silk shader uniform: ${name}`);
  return location;
}

export function SilkWavesBackground({ activeTargetId }: SilkWavesBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglState, setWebglState] = useState<WebglState>('idle');

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setWebglState('fallback');
      return;
    }

    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let raf = 0;
    let nearTail = false;
    let pageVisible = !document.hidden;
    let reducedMotion = false;
    let lastTimestamp = 0;
    let elapsed = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerTargetX = 0;
    let pointerTargetY = 0;

    const coarseQuery = window.matchMedia('(pointer: coarse)');
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = reducedMotionQuery.matches;

    let uniforms: Uniforms;

    try {
      program = createProgram(gl);
      gl.useProgram(program);

      const positionLocation = gl.getAttribLocation(program, 'aPosition');
      if (positionLocation < 0) throw new Error('Missing Silk shader position attribute.');

      buffer = gl.createBuffer();
      if (!buffer) throw new Error('Unable to create Silk geometry buffer.');

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1, -1,
          1, -1,
          -1, 1,
          -1, 1,
          1, -1,
          1, 1,
        ]),
        gl.STATIC_DRAW,
      );
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      uniforms = {
        resolution: requireUniform(gl, program, 'uResolution'),
        time: requireUniform(gl, program, 'uTime'),
        pointer: requireUniform(gl, program, 'uPointer'),
      };
    } catch (error) {
      console.warn('Silk background WebGL initialization failed.', error);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      setWebglState('fallback');
      return;
    }

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const renderSize = getRenderSize(
        rect.width || window.innerWidth,
        rect.height || window.innerHeight,
        window.devicePixelRatio,
        coarseQuery.matches,
      );

      if (canvas.width !== renderSize.width) canvas.width = renderSize.width;
      if (canvas.height !== renderSize.height) canvas.height = renderSize.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = (timeSeconds: number) => {
      gl.useProgram(program);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, timeSeconds);
      gl.uniform2f(uniforms.pointer, pointerX, pointerY);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const tick = (timestamp: number) => {
      raf = 0;
      if (reducedMotion || !nearTail || !pageVisible) return;

      const dt = Math.min(0.05, Math.max(0, (timestamp - (lastTimestamp || timestamp)) / 1000));
      lastTimestamp = timestamp;
      elapsed += dt;

      pointerX = dampScalar(pointerX, pointerTargetX, dt, 0.42);
      pointerY = dampScalar(pointerY, pointerTargetY, dt, 0.42);
      draw(elapsed);
      raf = requestAnimationFrame(tick);
    };

    const startIfNeeded = () => {
      stop();

      if (reducedMotion) {
        pointerX = 0;
        pointerY = 0;
        draw(4.25);
        return;
      }

      if (!nearTail || !pageVisible) return;
      lastTimestamp = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointerQuery.matches || reducedMotion) return;
      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      pointerTargetX = (event.clientX / width - 0.5) * 2;
      pointerTargetY = (0.5 - event.clientY / height) * 2;
    };

    const onPointerLeave = () => {
      pointerTargetX = 0;
      pointerTargetY = 0;
    };

    const onVisibilityChange = () => {
      pageVisible = !document.hidden;
      startIfNeeded();
    };

    const onReducedMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      startIfNeeded();
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      stop();
      setWebglState('fallback');
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reducedMotion || !raf) draw(reducedMotion ? 4.25 : elapsed);
    });
    resizeObserver.observe(root);

    const activeTarget = document.getElementById(activeTargetId);
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        nearTail = entries.some((entry) => entry.isIntersecting);
        startIfNeeded();
      },
      { rootMargin: getTailRootMargin(window.innerHeight), threshold: 0 },
    );

    if (activeTarget) {
      intersectionObserver.observe(activeTarget);
    } else {
      nearTail = true;
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    canvas.addEventListener('webglcontextlost', onContextLost);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    reducedMotionQuery.addEventListener('change', onReducedMotionChange);

    resize();
    setWebglState('ready');
    draw(reducedMotion ? 4.25 : 0);
    startIfNeeded();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      reducedMotionQuery.removeEventListener('change', onReducedMotionChange);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    };
  }, [activeTargetId]);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-webgl-state={webglState}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
