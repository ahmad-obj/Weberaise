import { COMPOSITE_FRAGMENT, FULLSCREEN_VERTEX } from './shaders';
import {
  ADVECTION_FRAGMENT,
  DIVERGENCE_FRAGMENT,
  FLUID_VERTEX,
  GRADIENT_SUBTRACT_FRAGMENT,
  PRESSURE_FRAGMENT,
  SPLAT_FRAGMENT,
} from './fluid/shaders';
import {
  createFullscreenGeometry,
  createProgram,
  getUniform,
  type ProgramBundle,
} from './fluid/gl';
import {
  clearFluidTarget,
  createDoubleFluidTarget,
  createFluidTarget,
  disposeDoubleFluidTarget,
  disposeFluidTarget,
} from './fluid/renderTargets';
import type { DoubleFluidTarget, FluidSplat, FluidTarget } from './fluid/types';
import { referenceFrameScale, retentionFromReferenceFrame } from './math';
import type { RevealQuality } from './quality';
import type { RevealSample } from './emitters/types';

export type RevealMode = 'reveal' | 'bottomFill' | 'disabled';
export type RevealLayers = { brand: TexImageSource };

function createBrandTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) throw new Error('Unable to allocate reveal brand texture.');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

function uploadLayer(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  source: TexImageSource,
) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    source,
  );
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function bindTextureUnit(
  gl: WebGL2RenderingContext,
  program: ProgramBundle,
  uniformName: string,
  texture: WebGLTexture,
  unit: number,
) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(getUniform(gl, program, uniformName), unit);
}

export class RevealEngine {
  readonly gl: WebGL2RenderingContext;

  private readonly splatProgram: ProgramBundle;
  private readonly advectionProgram: ProgramBundle;
  private readonly divergenceProgram: ProgramBundle;
  private readonly pressureProgram: ProgramBundle;
  private readonly gradientProgram: ProgramBundle;
  private readonly compositeProgram: ProgramBundle;
  private readonly fullscreenVao: WebGLVertexArrayObject;
  private readonly fullscreenBuffer: WebGLBuffer;

  private readonly velocity: DoubleFluidTarget;
  private readonly dye: DoubleFluidTarget;
  private readonly pressure: DoubleFluidTarget;
  private readonly divergence: FluidTarget;
  private readonly brandTexture: WebGLTexture;

  private pendingSample: RevealSample | null = null;
  private lastInputPoint: { x: number; y: number } | null = null;
  private lastFrameTime: number | null = null;
  private running = false;
  private raf = 0;
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
    if (!gl.getExtension('EXT_color_buffer_float')) {
      throw new Error('Renderable half-float color buffers are unavailable.');
    }
    this.gl = gl;

    this.splatProgram = createProgram(gl, FLUID_VERTEX, SPLAT_FRAGMENT);
    this.advectionProgram = createProgram(gl, FLUID_VERTEX, ADVECTION_FRAGMENT);
    this.divergenceProgram = createProgram(gl, FLUID_VERTEX, DIVERGENCE_FRAGMENT);
    this.pressureProgram = createProgram(gl, FLUID_VERTEX, PRESSURE_FRAGMENT);
    this.gradientProgram = createProgram(gl, FLUID_VERTEX, GRADIENT_SUBTRACT_FRAGMENT);
    this.compositeProgram = createProgram(gl, FULLSCREEN_VERTEX, COMPOSITE_FRAGMENT);

    const fullscreen = createFullscreenGeometry(gl);
    this.fullscreenVao = fullscreen.vao;
    this.fullscreenBuffer = fullscreen.buffer;

    const simResolution = Math.max(2, quality.simResolution);
    const dyeResolution = Math.max(2, quality.dyeResolution);
    this.velocity = createDoubleFluidTarget(gl, simResolution, simResolution, gl.LINEAR);
    this.pressure = createDoubleFluidTarget(gl, simResolution, simResolution, gl.NEAREST);
    this.dye = createDoubleFluidTarget(gl, dyeResolution, dyeResolution, gl.LINEAR);
    this.divergence = createFluidTarget(gl, simResolution, simResolution, gl.NEAREST);
    this.brandTexture = createBrandTexture(gl);

    this.canvas.dataset.revealMode = 'reveal';
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);
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
  }

  setLayers(layers: RevealLayers) {
    uploadLayer(this.gl, this.brandTexture, layers.brand);
  }

  emit(samples: readonly RevealSample[]) {
    if (this.mode === 'disabled' || samples.length === 0) return;

    // Nothin's production loop stores the latest pointer position and injects
    // once per RAF. Coalescing here prevents high-frequency pointer events or
    // interpolation from multiplying dye/velocity passes within one frame.
    const latest = samples.at(-1);
    if (latest) this.pendingSample = latest;
  }

  resetInputStream() {
    this.lastInputPoint = null;
    this.pendingSample = null;
  }

  setMode(mode: RevealMode) {
    this.mode = mode;
    this.canvas.dataset.revealMode = mode;
    this.lastFrameTime = null;
  }

  setBottomFillProgress(progress: number) {
    this.fillProgress = Math.min(1, Math.max(0, progress));
  }

  getBottomFillProgress() {
    return this.fillProgress;
  }

  clear() {
    const gl = this.gl;
    clearFluidTarget(gl, this.velocity.read);
    clearFluidTarget(gl, this.velocity.write);
    clearFluidTarget(gl, this.pressure.read);
    clearFluidTarget(gl, this.pressure.write);
    clearFluidTarget(gl, this.dye.read);
    clearFluidTarget(gl, this.dye.write);
    clearFluidTarget(gl, this.divergence);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.pendingSample = null;
    this.resetInputStream();
    this.lastFrameTime = null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = null;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.lastFrameTime = null;
  }

  prime() {
    this.lastFrameTime = null;
    this.stepFluid(0);
    this.renderComposite(0);
    this.lastFrameTime = null;
  }

  private frame = (nowMilliseconds: number) => {
    if (!this.running) return;

    if (document.hidden) {
      this.lastFrameTime = null;
      this.raf = requestAnimationFrame(this.frame);
      return;
    }

    const now = nowMilliseconds / 1000;
    if (this.mode === 'reveal') this.stepFluid(now);
    this.renderComposite(now);
    this.raf = requestAnimationFrame(this.frame);
  };

  private drawProgram(program: ProgramBundle, target: FluidTarget) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.viewport(0, 0, target.width, target.height);
    gl.disable(gl.BLEND);
    gl.useProgram(program.program);
    gl.bindVertexArray(this.fullscreenVao);
  }

  private applySplat(
    target: DoubleFluidTarget,
    splat: FluidSplat,
    color: [number, number, number],
  ) {
    const gl = this.gl;
    const program = this.splatProgram;
    this.drawProgram(program, target.write);
    bindTextureUnit(gl, program, 'uTarget', target.read.texture, 0);
    gl.uniform2f(getUniform(gl, program, 'uPoint'), splat.x, splat.y);
    gl.uniform3f(getUniform(gl, program, 'uColor'), color[0], color[1], color[2]);
    gl.uniform1f(getUniform(gl, program, 'uRadius'), this.quality.splatRadius);
    gl.uniform1f(
      getUniform(gl, program, 'uAspectRatio'),
      this.cssWidth / Math.max(1, this.cssHeight),
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    target.swap();
  }

  private applyPendingSplat() {
    const sample = this.pendingSample;
    if (!sample) return;
    this.pendingSample = null;

    const previous = this.lastInputPoint;
    const dx = previous ? sample.x - previous.x : 0;
    const dy = previous ? sample.y - previous.y : 0;
    const splat: FluidSplat = {
      x: Math.min(1, Math.max(0, sample.x)),
      y: Math.min(1, Math.max(0, 1 - sample.y)),
      dx,
      dy: -dy,
      strength: Math.max(0, sample.strength),
    };
    this.lastInputPoint = { x: sample.x, y: sample.y };

    if (this.quality.enableVelocity) {
      this.applySplat(this.velocity, splat, [
        splat.dx * this.quality.splatForce,
        splat.dy * this.quality.splatForce,
        0,
      ]);
    }
    this.applySplat(this.dye, splat, [splat.strength, splat.strength, splat.strength]);
  }

  private advect(
    source: DoubleFluidTarget,
    velocityTexture: WebGLTexture,
    dtFrames: number,
    dissipation: number,
  ) {
    const gl = this.gl;
    const program = this.advectionProgram;
    this.drawProgram(program, source.write);
    bindTextureUnit(gl, program, 'uVelocity', velocityTexture, 0);
    bindTextureUnit(gl, program, 'uSource', source.read.texture, 1);
    gl.uniform2f(
      getUniform(gl, program, 'uTexelSize'),
      1 / source.read.width,
      1 / source.read.height,
    );
    gl.uniform1f(getUniform(gl, program, 'uDtFrames'), dtFrames);
    gl.uniform1f(getUniform(gl, program, 'uDissipation'), dissipation);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    source.swap();
  }

  private computeDivergence() {
    const gl = this.gl;
    const program = this.divergenceProgram;
    this.drawProgram(program, this.divergence);
    bindTextureUnit(gl, program, 'uVelocity', this.velocity.read.texture, 0);
    gl.uniform2f(
      getUniform(gl, program, 'uTexelSize'),
      1 / this.velocity.read.width,
      1 / this.velocity.read.height,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private solvePressure() {
    const gl = this.gl;
    clearFluidTarget(gl, this.pressure.read);
    const program = this.pressureProgram;

    for (let iteration = 0; iteration < this.quality.pressureIterations; iteration += 1) {
      this.drawProgram(program, this.pressure.write);
      bindTextureUnit(gl, program, 'uPressure', this.pressure.read.texture, 0);
      bindTextureUnit(gl, program, 'uDivergence', this.divergence.texture, 1);
      gl.uniform2f(
        getUniform(gl, program, 'uTexelSize'),
        1 / this.pressure.read.width,
        1 / this.pressure.read.height,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this.pressure.swap();
    }
  }

  private subtractPressureGradient() {
    const gl = this.gl;
    const program = this.gradientProgram;
    this.drawProgram(program, this.velocity.write);
    bindTextureUnit(gl, program, 'uPressure', this.pressure.read.texture, 0);
    bindTextureUnit(gl, program, 'uVelocity', this.velocity.read.texture, 1);
    gl.uniform2f(
      getUniform(gl, program, 'uTexelSize'),
      1 / this.velocity.read.width,
      1 / this.velocity.read.height,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.velocity.swap();
  }

  private stepFluid(now: number) {
    const deltaSeconds = this.lastFrameTime === null
      ? 0
      : Math.min(1 / 30, Math.max(0, now - this.lastFrameTime));
    this.lastFrameTime = now;

    const dtFrames = referenceFrameScale(deltaSeconds, 60);
    const velocityDissipation = retentionFromReferenceFrame(
      this.quality.velocityRetention60,
      deltaSeconds,
      60,
    );
    const dyeDissipation = retentionFromReferenceFrame(
      this.quality.dyeRetention60,
      deltaSeconds,
      60,
    );

    this.applyPendingSplat();

    if (!this.quality.enableVelocity) {
      this.advect(this.dye, this.velocity.read.texture, dtFrames, dyeDissipation);
      return;
    }

    this.advect(this.velocity, this.velocity.read.texture, dtFrames, velocityDissipation);
    this.advect(this.dye, this.velocity.read.texture, dtFrames, dyeDissipation);
    this.computeDivergence();
    this.solvePressure();
    this.subtractPressureGradient();
  }

  private renderComposite(time: number) {
    const gl = this.gl;
    const program = this.compositeProgram;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.BLEND);
    gl.useProgram(program.program);
    gl.bindVertexArray(this.fullscreenVao);

    bindTextureUnit(gl, program, 'uDye', this.dye.read.texture, 0);
    bindTextureUnit(gl, program, 'uBrand', this.brandTexture, 1);
    gl.uniform1f(getUniform(gl, program, 'uRevealGain'), this.quality.revealGain);
    gl.uniform1f(getUniform(gl, program, 'uEdgeSoftness'), this.quality.edgeSoftness);
    gl.uniform1f(getUniform(gl, program, 'uEdgeWidth'), this.quality.edgeWidth);
    gl.uniform1f(getUniform(gl, program, 'uTime'), time);
    gl.uniform1f(getUniform(gl, program, 'uFillProgress'), this.fillProgress);
    gl.uniform1f(
      getUniform(gl, program, 'uFillEnabled'),
      this.mode === 'bottomFill' ? 1 : 0,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    this.stop();
    const gl = this.gl;
    disposeDoubleFluidTarget(gl, this.velocity);
    disposeDoubleFluidTarget(gl, this.pressure);
    disposeDoubleFluidTarget(gl, this.dye);
    disposeFluidTarget(gl, this.divergence);
    gl.deleteTexture(this.brandTexture);
    gl.deleteBuffer(this.fullscreenBuffer);
    gl.deleteVertexArray(this.fullscreenVao);
    gl.deleteProgram(this.splatProgram.program);
    gl.deleteProgram(this.advectionProgram.program);
    gl.deleteProgram(this.divergenceProgram.program);
    gl.deleteProgram(this.pressureProgram.program);
    gl.deleteProgram(this.gradientProgram.program);
    gl.deleteProgram(this.compositeProgram.program);
  }
}
