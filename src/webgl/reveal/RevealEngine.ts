import { COMPOSITE_FRAGMENT, FULLSCREEN_VERTEX, HISTORY_FRAGMENT, MAX_SPLATS } from './shaders';
import type { RevealQuality } from './quality';
import type { RevealSample } from './emitters/types';

export type RevealMode = 'reveal' | 'bottomFill' | 'disabled';
export type RevealLayers = { brand: TexImageSource };

type RenderTarget = {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
};

type ProgramBundle = {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
};

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to allocate WebGL shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, fragmentSource: string): ProgramBundle {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, FULLSCREEN_VERTEX);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to allocate WebGL program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Unknown WebGL program link error.';
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return { program, uniforms: new Map() };
}

function uniform(gl: WebGL2RenderingContext, bundle: ProgramBundle, name: string) {
  if (!bundle.uniforms.has(name)) bundle.uniforms.set(name, gl.getUniformLocation(bundle.program, name));
  return bundle.uniforms.get(name) ?? null;
}

function createTexture(gl: WebGL2RenderingContext, width: number, height: number, initial: Uint8Array | null = null) {
  const texture = gl.createTexture();
  if (!texture) throw new Error('Unable to allocate WebGL texture.');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, initial);
  return texture;
}

function createRenderTarget(gl: WebGL2RenderingContext, width: number, height: number): RenderTarget {
  const texture = createTexture(gl, width, height);
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) throw new Error('Unable to allocate WebGL framebuffer.');
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('Reveal history framebuffer is incomplete.');
  }
  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0.5, 0.5, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return { texture, framebuffer, width, height };
}

function uploadLayer(gl: WebGL2RenderingContext, texture: WebGLTexture, source: TexImageSource) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
}

export class RevealEngine {
  readonly gl: WebGL2RenderingContext;
  private readonly historyProgram: ProgramBundle;
  private readonly compositeProgram: ProgramBundle;
  private readonly vao: WebGLVertexArrayObject;
  private readonly vertexBuffer: WebGLBuffer;
  private historyTargets: [RenderTarget, RenderTarget];
  private historyReadIndex = 0;
  private brandTexture: WebGLTexture;
  private samples: RevealSample[] = [];
  private running = false;
  private raf = 0;
  private lastTime = 0;
  private mode: RevealMode = 'reveal';
  private fillProgress = 0;
  private cssWidth = 1;
  private cssHeight = 1;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly quality: RevealQuality,
  ) {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: quality.mode === 'full' ? 'high-performance' : 'default',
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error('WebGL2 is not available.');
    this.gl = gl;
    this.historyProgram = createProgram(gl, HISTORY_FRAGMENT);
    this.compositeProgram = createProgram(gl, COMPOSITE_FRAGMENT);

    const vao = gl.createVertexArray();
    const vertexBuffer = gl.createBuffer();
    if (!vao || !vertexBuffer) throw new Error('Unable to allocate reveal geometry.');
    this.vao = vao;
    this.vertexBuffer = vertexBuffer;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.historyTargets = [createRenderTarget(gl, 2, 2), createRenderTarget(gl, 2, 2)];
    this.brandTexture = createTexture(gl, 1, 1, new Uint8Array([0,0,0,0]));
    this.canvas.dataset.revealMode = 'reveal';
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  resize(width: number, height: number, dpr = window.devicePixelRatio || 1) {
    this.cssWidth = Math.max(1, width);
    this.cssHeight = Math.max(1, height);
    const pixelRatio = Math.min(this.quality.dprCap, Math.max(1, dpr));
    const displayWidth = Math.max(1, Math.round(width * pixelRatio));
    const displayHeight = Math.max(1, Math.round(height * pixelRatio));
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
    }

    const aspect = width / Math.max(1, height);
    let maskWidth: number;
    let maskHeight: number;
    if (aspect >= 1) {
      maskHeight = this.quality.maskShortAxis;
      maskWidth = Math.round(maskHeight * aspect);
    } else {
      maskWidth = this.quality.maskShortAxis;
      maskHeight = Math.round(maskWidth / aspect);
    }
    maskWidth = Math.max(2, Math.min(768, maskWidth));
    maskHeight = Math.max(2, Math.min(768, maskHeight));
    if (this.historyTargets[0].width !== maskWidth || this.historyTargets[0].height !== maskHeight) {
      this.destroyHistoryTargets();
      this.historyTargets = [createRenderTarget(this.gl, maskWidth, maskHeight), createRenderTarget(this.gl, maskWidth, maskHeight)];
      this.historyReadIndex = 0;
    }
  }

  setLayers(layers: RevealLayers) {
    uploadLayer(this.gl, this.brandTexture, layers.brand);
  }

  emit(samples: readonly RevealSample[]) {
    if (this.mode === 'disabled' || samples.length === 0) return;
    this.samples.push(...samples);
    if (this.samples.length > 96) this.samples.splice(0, this.samples.length - 96);
  }

  setMode(mode: RevealMode) {
    this.mode = mode;
    this.canvas.dataset.revealMode = mode;
  }
  setBottomFillProgress(progress: number) { this.fillProgress = Math.min(1, Math.max(0, progress)); }
  getBottomFillProgress() { return this.fillProgress; }

  clear() {
    const gl = this.gl;
    for (const target of this.historyTargets) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.viewport(0, 0, target.width, target.height);
      gl.clearColor(0, 0.5, 0.5, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.samples.length = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private frame = (now: number) => {
    if (!this.running) return;
    const delta = Math.min(0.05, Math.max(1 / 240, (now - this.lastTime) / 1000));
    this.lastTime = now;
    this.updateHistory(delta, now / 1000);
    this.renderComposite(now / 1000);
    this.raf = requestAnimationFrame(this.frame);
  };

  private updateHistory(delta: number, time: number) {
    const gl = this.gl;
    const read = this.historyTargets[this.historyReadIndex];
    const writeIndex = this.historyReadIndex === 0 ? 1 : 0;
    const write = this.historyTargets[writeIndex];
    const splats = this.samples.splice(0, MAX_SPLATS);

    gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
    gl.viewport(0, 0, write.width, write.height);
    gl.useProgram(this.historyProgram.program);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, read.texture);
    gl.uniform1i(uniform(gl, this.historyProgram, 'uPrevious'), 0);
    gl.uniform1f(uniform(gl, this.historyProgram, 'uDelta'), delta);
    gl.uniform1f(uniform(gl, this.historyProgram, 'uTime'), time);
    gl.uniform1f(uniform(gl, this.historyProgram, 'uHalfLife'), this.quality.halfLife);
    gl.uniform1f(uniform(gl, this.historyProgram, 'uAdvection'), this.quality.advection);
    gl.uniform1f(uniform(gl, this.historyProgram, 'uAspect'), this.cssWidth / Math.max(1, this.cssHeight));
    gl.uniform1i(uniform(gl, this.historyProgram, 'uSplatCount'), splats.length);

    const positions = new Float32Array(MAX_SPLATS * 2);
    const velocities = new Float32Array(MAX_SPLATS * 2);
    const radii = new Float32Array(MAX_SPLATS);
    const strengths = new Float32Array(MAX_SPLATS);
    splats.forEach((sample, index) => {
      positions[index * 2] = sample.x;
      positions[index * 2 + 1] = 1 - sample.y;
      velocities[index * 2] = sample.vx;
      velocities[index * 2 + 1] = -sample.vy;
      radii[index] = sample.radius;
      strengths[index] = sample.strength;
    });
    gl.uniform2fv(uniform(gl, this.historyProgram, 'uSplatPos[0]'), positions);
    gl.uniform2fv(uniform(gl, this.historyProgram, 'uSplatVelocity[0]'), velocities);
    gl.uniform1fv(uniform(gl, this.historyProgram, 'uSplatRadius[0]'), radii);
    gl.uniform1fv(uniform(gl, this.historyProgram, 'uSplatStrength[0]'), strengths);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.historyReadIndex = writeIndex;
  }

  private renderComposite(time: number) {
    const gl = this.gl;
    const history = this.historyTargets[this.historyReadIndex];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.compositeProgram.program);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, history.texture);
    gl.uniform1i(uniform(gl, this.compositeProgram, 'uHistory'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.brandTexture);
    gl.uniform1i(uniform(gl, this.compositeProgram, 'uBrand'), 1);
    gl.uniform1f(uniform(gl, this.compositeProgram, 'uTime'), time);
    gl.uniform1f(uniform(gl, this.compositeProgram, 'uNoiseAmount'), this.quality.noiseAmount);
    gl.uniform1f(uniform(gl, this.compositeProgram, 'uFillProgress'), this.fillProgress);
    gl.uniform1f(uniform(gl, this.compositeProgram, 'uFillEnabled'), this.mode === 'bottomFill' ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private destroyHistoryTargets() {
    for (const target of this.historyTargets) {
      this.gl.deleteFramebuffer(target.framebuffer);
      this.gl.deleteTexture(target.texture);
    }
  }

  dispose() {
    this.stop();
    this.destroyHistoryTargets();
    this.gl.deleteTexture(this.brandTexture);
    this.gl.deleteBuffer(this.vertexBuffer);
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteProgram(this.historyProgram.program);
    this.gl.deleteProgram(this.compositeProgram.program);
  }
}
