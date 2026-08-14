import { mat4, quat, vec3 } from 'gl-matrix';
import type { WorkProject } from '@/content/workProjects';
import { ArcballController } from './arcball';
import { WORK_SPHERE } from './constants';
import { buildProjectSlots, createProjectQuad } from './geometry';
import { WorkPreviewMediaPool, type WorkMediaUniforms } from './mediaPool';
import { projectQuadBounds, pointInBounds } from './projection';
import { WORK_QUALITY_PROFILES } from './quality';
import { findNearestSlot, rankSlotsByFront } from './selection';
import { workSphereFragmentShader, workSphereVertexShader } from './shaders';
import type {
  ScreenBounds,
  SphereSlot,
  WorkSphereCallbacks,
  WorkSphereOptions,
  WorkSphereSnapshot,
} from './types';

type PointerSession = {
  pointerId: number;
  downX: number;
  downY: number;
  downAt: number;
  pointerType: string;
};

type Uniforms = {
  viewProjection: WebGLUniformLocation | null;
  velocity: WebGLUniformLocation | null;
  deformation: WebGLUniformLocation | null;
  projectOpening: WebGLUniformLocation | null;
  openingSlot: WebGLUniformLocation | null;
  hiddenSlot: WebGLUniformLocation | null;
  cornerRadius: WebGLUniformLocation | null;
  media: WorkMediaUniforms;
};

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create Work sphere shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || 'Unknown shader compile error.';
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, workSphereVertexShader);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, workSphereFragmentShader);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create Work sphere program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || 'Unknown program link error.';
    gl.deleteProgram(program);
    throw new Error(info);
  }
  return program;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export class WorkSphereEngine {
  readonly slots: readonly SphereSlot[];

  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly indexCount: number;
  private readonly instanceMatrixBuffer: WebGLBuffer;
  private readonly instanceMetaBuffer: WebGLBuffer;
  private readonly instanceMatrices: Float32Array;
  private readonly models: mat4[];
  private readonly orientedDirections: vec3[];
  private readonly controller: ArcballController;
  private readonly mediaPool: WorkPreviewMediaPool;
  private readonly uniforms: Uniforms;
  private readonly callbacks: WorkSphereCallbacks;
  private readonly profile: (typeof WORK_QUALITY_PROFILES)[keyof typeof WORK_QUALITY_PROFILES];

  private projection = mat4.create();
  private view = mat4.create();
  private viewProjection = mat4.create();
  private raf = 0;
  private started = false;
  private destroyed = false;
  private interactive = false;
  private entranceProgress = 0;
  private projectOpeningProgress = 0;
  private openingSlotId = -1;
  private hiddenSlotId = -1;
  private activeSlotId = 0;
  private hoverSlotId: number | null = null;
  private lastMovement = false;
  private lastFrame = performance.now();
  private pointerSession: PointerSession | null = null;
  private coarsePointer = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly projects: readonly WorkProject[],
    callbacks: WorkSphereCallbacks = {},
    options: WorkSphereOptions = {},
  ) {
    if (!projects.length) throw new Error('Work sphere requires at least one project.');
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 is not available.');

    this.gl = gl;
    this.callbacks = callbacks;
    this.profile = WORK_QUALITY_PROFILES[options.quality ?? (options.reducedMotion ? 'reduced' : 'full')];
    this.controller = new ArcballController(Boolean(options.reducedMotion));
    this.slots = buildProjectSlots(projects.length);
    this.activeSlotId = findNearestSlot(this.slots, this.controller.orientation);
    this.models = this.slots.map(() => mat4.create());
    this.orientedDirections = this.slots.map(() => vec3.create());
    this.instanceMatrices = new Float32Array(this.slots.length * 16);

    this.program = createProgram(gl);
    const quad = createProjectQuad();
    this.indexCount = quad.indices.length;

    const vao = gl.createVertexArray();
    const positionBuffer = gl.createBuffer();
    const uvBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    const matrixBuffer = gl.createBuffer();
    const metaBuffer = gl.createBuffer();
    if (!vao || !positionBuffer || !uvBuffer || !indexBuffer || !matrixBuffer || !metaBuffer) {
      throw new Error('Unable to allocate Work sphere buffers.');
    }
    this.vao = vao;
    this.instanceMatrixBuffer = matrixBuffer;
    this.instanceMetaBuffer = metaBuffer;

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad.uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quad.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceMatrices.byteLength, gl.DYNAMIC_DRAW);
    const bytesPerMatrix = 16 * Float32Array.BYTES_PER_ELEMENT;
    for (let column = 0; column < 4; column += 1) {
      const location = 2 + column;
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(
        location,
        4,
        gl.FLOAT,
        false,
        bytesPerMatrix,
        column * 4 * Float32Array.BYTES_PER_ELEMENT,
      );
      gl.vertexAttribDivisor(location, 1);
    }

    const meta = new Float32Array(this.slots.length * 2);
    for (const slot of this.slots) {
      meta[slot.id * 2] = slot.projectIndex;
      meta[slot.id * 2 + 1] = slot.id;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, metaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, meta, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(6);
    gl.vertexAttribPointer(6, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(6, 1);
    gl.bindVertexArray(null);

    this.uniforms = {
      viewProjection: gl.getUniformLocation(this.program, 'uViewProjection'),
      velocity: gl.getUniformLocation(this.program, 'uVelocity'),
      deformation: gl.getUniformLocation(this.program, 'uDeformation'),
      projectOpening: gl.getUniformLocation(this.program, 'uProjectOpening'),
      openingSlot: gl.getUniformLocation(this.program, 'uOpeningSlot'),
      hiddenSlot: gl.getUniformLocation(this.program, 'uHiddenSlot'),
      cornerRadius: gl.getUniformLocation(this.program, 'uCornerRadius'),
      media: {
        posterAtlas: gl.getUniformLocation(this.program, 'uPosterAtlas'),
        atlasGrid: gl.getUniformLocation(this.program, 'uAtlasGrid'),
        videoTextures: [0, 1, 2].map(index => gl.getUniformLocation(this.program, `uVideo${index}`)),
        videoSlotIds: [0, 1, 2].map(index => gl.getUniformLocation(this.program, `uVideoSlot${index}`)),
      },
    };

    this.mediaPool = new WorkPreviewMediaPool(
      gl,
      projects,
      this.slots,
      Math.min(3, this.profile.liveVideoSlots),
      !options.reducedMotion,
    );

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.bindEvents();
    this.resize();
    this.updateMatrices();

    const initialRanked = rankSlotsByFront(this.slots, this.controller.orientation);
    void this.mediaPool
      .prepareInitial(initialRanked.slice(0, 3).map(entry => entry.slotId))
      .catch(() => undefined)
      .finally(() => this.callbacks.onReady?.());
  }

  start() {
    if (this.destroyed || this.started) return;
    this.started = true;
    this.lastFrame = performance.now();
    this.scheduleFrame();
    this.mediaPool.resumePriority();
  }

  stop() {
    this.started = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.mediaPool.pauseAll();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stop();
    this.unbindEvents();
    this.mediaPool.destroy();
    this.gl.deleteBuffer(this.instanceMatrixBuffer);
    this.gl.deleteBuffer(this.instanceMetaBuffer);
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteProgram(this.program);
  }

  setInteractive(value: boolean) {
    this.interactive = value;
    if (!value) {
      this.pointerSession = null;
      this.controller.stop();
      this.setHoverSlot(null);
    }
  }

  setEntranceProgress(progress: number) {
    this.entranceProgress = clamp01(progress);
  }

  setHoverSlot(slotId: number | null) {
    if (this.hoverSlotId === slotId) return;
    this.hoverSlotId = slotId;
    if (slotId !== null) this.controller.stop();
    this.callbacks.onHoverSlotChange?.(slotId);
    this.refreshMediaPriorities();
  }

  snapToSlot(slotId: number) {
    const slot = this.slots.find(candidate => candidate.id === slotId);
    if (!slot) return;
    this.activeSlotId = slotId;
    this.controller.setSnapTarget(slot.direction);
    this.callbacks.onActiveSlotChange?.(slotId);
    this.refreshMediaPriorities();
  }

  setProjectOpening(slotId: number, progress: number) {
    this.openingSlotId = slotId;
    this.projectOpeningProgress = clamp01(progress);
  }

  setSelectedHidden(hidden: boolean) {
    this.hiddenSlotId = hidden ? this.openingSlotId : -1;
  }

  getSlotScreenBounds(slotId: number): ScreenBounds | null {
    const model = this.models[slotId];
    if (!model) return null;
    const local = projectQuadBounds(
      model,
      this.viewProjection,
      this.canvas.clientWidth,
      this.canvas.clientHeight,
    );
    if (!local) return null;
    const rect = this.canvas.getBoundingClientRect();
    return { ...local, left: local.left + rect.left, top: local.top + rect.top };
  }

  getOrientationSnapshot(): WorkSphereSnapshot {
    return {
      orientation: quat.clone(this.controller.orientation),
      activeSlotId: this.activeSlotId,
    };
  }

  restoreOrientation(snapshot: WorkSphereSnapshot) {
    this.controller.restoreOrientation(snapshot.orientation);
    this.activeSlotId = snapshot.activeSlotId;
    const slot = this.slots.find(candidate => candidate.id === snapshot.activeSlotId);
    this.controller.setSnapTarget(slot?.direction ?? null);
    this.updateMatrices();
    this.callbacks.onActiveSlotChange?.(this.activeSlotId);
    this.refreshMediaPriorities();
  }

  getProjectIndexForSlot(slotId: number) {
    return this.slots.find(slot => slot.id === slotId)?.projectIndex ?? -1;
  }

  getActiveSlotId() {
    return this.activeSlotId;
  }

  resize = () => {
    if (this.destroyed) return;
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, this.profile.dprCap);
    const cssWidth = Math.max(1, this.canvas.clientWidth || window.innerWidth);
    const cssHeight = Math.max(1, this.canvas.clientHeight || window.innerHeight);
    const width = Math.round(cssWidth * dpr);
    const height = Math.round(cssHeight * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    this.controller.setViewport(cssWidth, cssHeight);
    mat4.perspective(this.projection, Math.PI / 3.05, cssWidth / cssHeight, 0.1, 60);
    mat4.lookAt(this.view, [0, 0, WORK_SPHERE.cameraZ], [0, 0, 0], [0, 1, 0]);
    mat4.multiply(this.viewProjection, this.projection, this.view);
    this.updateMatrices();
  };

  private scheduleFrame() {
    if (!this.started || this.destroyed || document.hidden) return;
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    if (!this.started || this.destroyed) return;
    const deltaMs = Math.min(40, Math.max(1, now - this.lastFrame));
    this.lastFrame = now;

    const snapshot = this.controller.update(deltaMs);
    const nearest = findNearestSlot(this.slots, snapshot.orientation);
    if (!this.controller.isPointerDown && this.hoverSlotId === null && nearest >= 0) {
      const slot = this.slots.find(candidate => candidate.id === nearest);
      this.controller.setSnapTarget(slot?.direction ?? null);
    }

    if (nearest >= 0 && nearest !== this.activeSlotId) {
      this.activeSlotId = nearest;
      this.callbacks.onActiveSlotChange?.(nearest);
      this.refreshMediaPriorities();
    }

    if (snapshot.moving !== this.lastMovement) {
      this.lastMovement = snapshot.moving;
      this.callbacks.onMovementChange?.(snapshot.moving);
    }

    this.updateMatrices();
    this.mediaPool.uploadReadyFrames();
    this.render(snapshot.angularVelocity);
    this.scheduleFrame();
  };

  private updateMatrices() {
    const entranceStart = this.profile.inertia === 0 ? 1.08 : 1.9;
    const sceneScale = entranceStart + (1 - entranceStart) * this.entranceProgress;
    const openingSlot = this.slots.find(slot => slot.id === this.openingSlotId);

    for (const slot of this.slots) {
      const localDirection = vec3.fromValues(...slot.direction);
      const direction = vec3.transformQuat(
        this.orientedDirections[slot.id],
        localDirection,
        this.controller.orientation,
      );
      vec3.normalize(direction, direction);

      const depth = clamp01((direction[2] + 1) * 0.5);
      let sizeScale = (0.74 + depth * 0.32) * sceneScale;
      let radius = WORK_SPHERE.radius * sceneScale;

      if (this.profile.liveVideoSlots === 1 && slot.id === this.activeSlotId) sizeScale *= 1.12;
      if (openingSlot) {
        if (slot.id === openingSlot.id) {
          sizeScale *= 1 + this.projectOpeningProgress * 0.1;
        } else {
          sizeScale *= 1 - this.projectOpeningProgress * 0.16;
          radius *= 1 + this.projectOpeningProgress * 0.14;
        }
      }

      const position = vec3.scale(vec3.create(), direction, radius);
      const worldUp = Math.abs(direction[1]) > 0.94 ? [1, 0, 0] : [0, 1, 0];
      const model = this.models[slot.id];
      mat4.targetTo(model, position, [0, 0, 0], worldUp);
      mat4.scale(model, model, [
        WORK_SPHERE.projectWidth * sizeScale,
        WORK_SPHERE.projectHeight * sizeScale,
        1,
      ]);
      this.instanceMatrices.set(model, slot.id * 16);
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceMatrixBuffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.instanceMatrices);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
  }

  private render(angularVelocity: number) {
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.uniforms.viewProjection, false, this.viewProjection);
    gl.uniform1f(this.uniforms.velocity, angularVelocity / 0.16);
    gl.uniform1f(this.uniforms.deformation, this.profile.deformation);
    gl.uniform1f(this.uniforms.projectOpening, this.projectOpeningProgress);
    gl.uniform1i(this.uniforms.openingSlot, this.openingSlotId);
    gl.uniform1i(this.uniforms.hiddenSlot, this.hiddenSlotId);
    gl.uniform1f(this.uniforms.cornerRadius, 0.055);
    this.mediaPool.bind(this.uniforms.media);
    gl.bindVertexArray(this.vao);
    gl.drawElementsInstanced(
      gl.TRIANGLES,
      this.indexCount,
      gl.UNSIGNED_SHORT,
      0,
      this.slots.length,
    );
    gl.bindVertexArray(null);
  }

  private refreshMediaPriorities() {
    const ranked = rankSlotsByFront(this.slots, this.controller.orientation);
    this.mediaPool.updatePriorities(ranked, this.hoverSlotId ?? undefined);
  }

  private pickSlot(localX: number, localY: number): number | null {
    const ordered = this.slots
      .map(slot => ({ slot, z: this.orientedDirections[slot.id]?.[2] ?? -1 }))
      .filter(entry => entry.z > 0.05)
      .sort((a, b) => b.z - a.z);

    for (const { slot } of ordered) {
      const bounds = projectQuadBounds(
        this.models[slot.id],
        this.viewProjection,
        this.canvas.clientWidth,
        this.canvas.clientHeight,
      );
      if (pointInBounds(localX, localY, bounds)) return slot.id;
    }
    return null;
  }

  private bindEvents() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerCancel);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.style.touchAction = 'none';
  }

  private unbindEvents() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private localPoint(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private onPointerDown = (event: PointerEvent) => {
    if (!this.interactive) return;
    const { x, y } = this.localPoint(event);
    this.coarsePointer = event.pointerType === 'touch'
      || window.matchMedia('(pointer: coarse)').matches;
    this.pointerSession = {
      pointerId: event.pointerId,
      downX: x,
      downY: y,
      downAt: performance.now(),
      pointerType: event.pointerType,
    };
    this.canvas.setPointerCapture?.(event.pointerId);
    this.setHoverSlot(null);
    this.controller.pointerDown(x, y);
    if (this.profile.inertia === 0) this.mediaPool.setAutomaticPlayback(true);
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.interactive) return;
    const { x, y } = this.localPoint(event);
    if (this.pointerSession?.pointerId === event.pointerId) {
      this.controller.pointerMove(x, y);
      return;
    }
    if (!this.coarsePointer && event.pointerType !== 'touch') {
      this.setHoverSlot(this.pickSlot(x, y));
    }
  };

  private onPointerUp = (event: PointerEvent) => {
    const session = this.pointerSession;
    if (!session || session.pointerId !== event.pointerId) return;
    const { x, y } = this.localPoint(event);
    this.controller.pointerUp();
    this.pointerSession = null;

    const travel = Math.hypot(x - session.downX, y - session.downY);
    const duration = performance.now() - session.downAt;
    const threshold = this.coarsePointer
      ? WORK_SPHERE.clickTravelCoarse
      : WORK_SPHERE.clickTravelFine;
    if (!this.interactive || travel > threshold || duration > WORK_SPHERE.clickDurationMs) return;

    const slotId = this.pickSlot(x, y);
    if (slotId === null) return;
    if (this.coarsePointer && slotId !== this.activeSlotId) {
      this.snapToSlot(slotId);
      return;
    }
    this.callbacks.onProjectActivate?.(slotId);
  };

  private onPointerCancel = (event: PointerEvent) => {
    if (this.pointerSession?.pointerId !== event.pointerId) return;
    this.pointerSession = null;
    this.controller.pointerUp();
  };

  private onPointerLeave = () => {
    if (!this.pointerSession) this.setHoverSlot(null);
  };

  private onVisibilityChange = () => {
    if (document.hidden) {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.mediaPool.pauseAll();
      return;
    }
    if (this.started) {
      this.lastFrame = performance.now();
      this.mediaPool.resumePriority();
      this.scheduleFrame();
    }
  };
}
