import {
  COMPOSITE_FRAGMENT,
  FIELD_FRAGMENT,
  FIELD_VERTEX,
  FULLSCREEN_VERTEX,
} from './shaders';
import { isLiquidPrimitiveAlive, liquidRadiusScale } from './liquidLifetime';
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

type LiquidPrimitive = RevealSample & {
  bornAt: number;
};

const QUAD = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
  -1,  1,
   1, -1,
   1,  1,
]);

const INSTANCE_FLOATS = 6;
const INSTANCE_STRIDE = INSTANCE_FLOATS * Float32Array.BYTES_PER_ELEMENT;

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

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): ProgramBundle {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
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

function createTexture(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  initial: Uint8Array | null = null,
) {
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
    throw new Error('Reveal field framebuffer is incomplete.');
  }
  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0, 0, 0);
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

function configureFullscreenGeometry(gl: WebGL2RenderingContext) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  if (!vao || !buffer) throw new Error('Unable to allocate reveal fullscreen geometry.');

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  return { vao, buffer };
}

function configureFieldGeometry(gl: WebGL2RenderingContext) {
  const vao = gl.createVertexArray();
  const cornerBuffer = gl.createBuffer();
  const instanceBuffer = gl.createBuffer();
  if (!vao || !cornerBuffer || !instanceBuffer) {
    throw new Error('Unable to allocate reveal primitive geometry.');
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);

  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, INSTANCE_STRIDE, 0);
  gl.vertexAttribDivisor(1, 1);

  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 1, gl.FLOAT, false, INSTANCE_STRIDE, 2 * Float32Array.BYTES_PER_ELEMENT);
  gl.vertexAttribDivisor(2, 1);

  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 2, gl.FLOAT, false, INSTANCE_STRIDE, 3 * Float32Array.BYTES_PER_ELEMENT);
  gl.vertexAttribDivisor(3, 1);

  gl.enableVertexAttribArray(4);
  gl.vertexAttribPointer(4, 1, gl.FLOAT, false, INSTANCE_STRIDE, 5 * Float32Array.BYTES_PER_ELEMENT);
  gl.vertexAttribDivisor(4, 1);

  return { vao, cornerBuffer, instanceBuffer };
}

export class RevealEngine {
  readonly gl: WebGL2RenderingContext;
  private readonly fieldProgram: ProgramBundle;
  private readonly compositeProgram: ProgramBundle;
  private readonly fullscreenVao: WebGLVertexArrayObject;
  private readonly fullscreenBuffer: WebGLBuffer;
  private readonly fieldVao: WebGLVertexArrayObject;
  private readonly fieldCornerBuffer: WebGLBuffer;
  private readonly instanceBuffer: WebGLBuffer;
  private fieldTarget: RenderTarget;
  private brandTexture: WebGLTexture;
  private primitives: LiquidPrimitive[] = [];
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
    this.gl = gl;

    this.fieldProgram = createProgram(gl, FIELD_VERTEX, FIELD_FRAGMENT);
    this.compositeProgram = createProgram(gl, FULLSCREEN_VERTEX, COMPOSITE_FRAGMENT);

    const fullscreen = configureFullscreenGeometry(gl);
    this.fullscreenVao = fullscreen.vao;
    this.fullscreenBuffer = fullscreen.buffer;

    const field = configureFieldGeometry(gl);
    this.fieldVao = field.vao;
    this.fieldCornerBuffer = field.cornerBuffer;
    this.instanceBuffer = field.instanceBuffer;

    this.fieldTarget = createRenderTarget(gl, 2, 2);
    this.brandTexture = createTexture(gl, 1, 1, new Uint8Array([0, 0, 0, 0]));
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

    const aspect = width / Math.max(1, height);
    const maxLongAxis = 1024;
    let fieldWidth: number;
    let fieldHeight: number;

    if (aspect >= 1) {
      fieldHeight = this.quality.maskShortAxis;
      fieldWidth = Math.round(fieldHeight * aspect);
      if (fieldWidth > maxLongAxis) {
        fieldWidth = maxLongAxis;
        fieldHeight = Math.round(fieldWidth / aspect);
      }
    } else {
      fieldWidth = this.quality.maskShortAxis;
      fieldHeight = Math.round(fieldWidth / aspect);
      if (fieldHeight > maxLongAxis) {
        fieldHeight = maxLongAxis;
        fieldWidth = Math.round(fieldHeight * aspect);
      }
    }

    fieldWidth = Math.max(2, fieldWidth);
    fieldHeight = Math.max(2, fieldHeight);

    if (this.fieldTarget.width !== fieldWidth || this.fieldTarget.height !== fieldHeight) {
      this.destroyFieldTarget();
      this.fieldTarget = createRenderTarget(this.gl, fieldWidth, fieldHeight);
    }
  }

  setLayers(layers: RevealLayers) {
    uploadLayer(this.gl, this.brandTexture, layers.brand);
  }

  emit(samples: readonly RevealSample[]) {
    if (this.mode === 'disabled' || samples.length === 0) return;

    const now = performance.now() / 1000;
    const newestSampleTime = samples.at(-1)?.time ?? now;

    for (const sample of samples) {
      // Preserve only the tiny relative timing within an interpolated pointer batch.
      // Autonomous samples are emitted on timers and therefore naturally get their
      // actual birth time here as well.
      const relativeLag = Math.min(0.12, Math.max(0, newestSampleTime - sample.time));
      this.primitives.push({ ...sample, bornAt: now - relativeLag });
    }

    if (this.primitives.length > this.quality.maxPrimitives) {
      this.primitives.splice(0, this.primitives.length - this.quality.maxPrimitives);
    }
  }

  setMode(mode: RevealMode) {
    this.mode = mode;
    this.canvas.dataset.revealMode = mode;
  }

  setBottomFillProgress(progress: number) {
    this.fillProgress = Math.min(1, Math.max(0, progress));
  }

  getBottomFillProgress() {
    return this.fillProgress;
  }

  clear() {
    this.primitives.length = 0;
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fieldTarget.framebuffer);
    gl.viewport(0, 0, this.fieldTarget.width, this.fieldTarget.height);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private frame = (nowMilliseconds: number) => {
    if (!this.running) return;
    const now = nowMilliseconds / 1000;

    if (this.mode === 'reveal') this.renderField(now);
    this.renderComposite(now);
    this.raf = requestAnimationFrame(this.frame);
  };

  private renderField(now: number) {
    const gl = this.gl;
    const active: LiquidPrimitive[] = [];
    const instanceValues: number[] = [];

    for (const primitive of this.primitives) {
      const age = Math.max(0, now - primitive.bornAt);
      if (!isLiquidPrimitiveAlive(age, this.quality.lifetime)) continue;

      active.push(primitive);
      const radiusScale = liquidRadiusScale(age, this.quality.lifetime, this.quality.holdFraction);
      if (radiusScale <= 0.005) continue;

      instanceValues.push(
        primitive.x,
        1 - primitive.y,
        primitive.radius * radiusScale,
        primitive.vx,
        -primitive.vy,
        primitive.strength,
      );
    }

    this.primitives = active;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fieldTarget.framebuffer);
    gl.viewport(0, 0, this.fieldTarget.width, this.fieldTarget.height);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const instanceCount = instanceValues.length / INSTANCE_FLOATS;
    if (instanceCount === 0) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return;
    }

    gl.useProgram(this.fieldProgram.program);
    gl.bindVertexArray(this.fieldVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(instanceValues), gl.DYNAMIC_DRAW);
    gl.uniform1f(
      uniform(gl, this.fieldProgram, 'uAspect'),
      this.cssWidth / Math.max(1, this.cssHeight),
    );

    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, instanceCount);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private renderComposite(time: number) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.BLEND);
    gl.useProgram(this.compositeProgram.program);
    gl.bindVertexArray(this.fullscreenVao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fieldTarget.texture);
    gl.uniform1i(uniform(gl, this.compositeProgram, 'uField'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.brandTexture);
    gl.uniform1i(uniform(gl, this.compositeProgram, 'uBrand'), 1);

    gl.uniform1f(uniform(gl, this.compositeProgram, 'uTime'), time);
    gl.uniform1f(
      uniform(gl, this.compositeProgram, 'uSurfaceThreshold'),
      this.quality.surfaceThreshold,
    );
    gl.uniform1f(
      uniform(gl, this.compositeProgram, 'uContourWarp'),
      this.quality.contourWarp,
    );
    gl.uniform1f(uniform(gl, this.compositeProgram, 'uFillProgress'), this.fillProgress);
    gl.uniform1f(
      uniform(gl, this.compositeProgram, 'uFillEnabled'),
      this.mode === 'bottomFill' ? 1 : 0,
    );

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private destroyFieldTarget() {
    this.gl.deleteFramebuffer(this.fieldTarget.framebuffer);
    this.gl.deleteTexture(this.fieldTarget.texture);
  }

  dispose() {
    this.stop();
    this.destroyFieldTarget();
    this.gl.deleteTexture(this.brandTexture);
    this.gl.deleteBuffer(this.fullscreenBuffer);
    this.gl.deleteBuffer(this.fieldCornerBuffer);
    this.gl.deleteBuffer(this.instanceBuffer);
    this.gl.deleteVertexArray(this.fullscreenVao);
    this.gl.deleteVertexArray(this.fieldVao);
    this.gl.deleteProgram(this.fieldProgram.program);
    this.gl.deleteProgram(this.compositeProgram.program);
  }
}
