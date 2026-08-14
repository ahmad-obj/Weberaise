import type { WorkProject } from '@/content/workProjects';
import { ArcballController } from './arcball';
import { cameraTargetZ, stepCameraZ } from './camera';
import { WORK_SPHERE } from './constants';
import { buildProjectSlots, createProjectSurfaceMesh } from './geometry';
import {
  lookAtMat4,
  mat4Identity,
  multiplyMat4,
  perspectiveMat4,
  scaleMat4,
  targetToMat4,
  transformVec3Quat,
  vec3f,
  type Mat4,
  type Vec3f,
} from './math';
import { WorkPreviewMediaPool, type WorkMediaUniforms } from './mediaPool';
import { findNearestSlot, rankSlotsByFront } from './selection';
import { WORK_QUALITY_PROFILES } from './quality';
import { workSphereFragmentShader, workSphereVertexShader } from './shaders';
import type {
  SphereSlot,
  WorkSphereCallbacks,
  WorkSphereOptions,
} from './types';

type Uniforms = {
  viewMatrix: WebGLUniformLocation | null;
  projectionMatrix: WebGLUniformLocation | null;
  rotationAxisVelocity: WebGLUniformLocation | null;
  deformation: WebGLUniformLocation | null;
  cornerRadius: WebGLUniformLocation | null;
  media: WorkMediaUniforms;
};

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create Work sphere shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || 'Unknown Work sphere shader error.';
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
    const info = gl.getProgramInfoLog(program) || 'Unable to link Work sphere program.';
    gl.deleteProgram(program);
    throw new Error(info);
  }
  return program;
}

function translationMatrix(x: number, y: number, z: number): Mat4 {
  const matrix = mat4Identity();
  matrix[12] = x;
  matrix[13] = y;
  matrix[14] = z;
  return matrix;
}

function scaleMatrix(scale: number): Mat4 {
  const matrix = mat4Identity();
  matrix[0] = scale;
  matrix[5] = scale;
  matrix[10] = scale;
  return matrix;
}

export class WorkSphereEngine {
  readonly slots: readonly SphereSlot[];

  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly indexCount: number;
  private readonly instanceMatrixBuffer: WebGLBuffer;
  private readonly instanceMatrices: Float32Array;
  private readonly models: Mat4[];
  private readonly orientedDirections: Vec3f[];
  private readonly controller: ArcballController;
  private readonly mediaPool: WorkPreviewMediaPool;
  private readonly uniforms: Uniforms;
  private readonly callbacks: WorkSphereCallbacks;
  private readonly profile: (typeof WORK_QUALITY_PROFILES)[keyof typeof WORK_QUALITY_PROFILES];
  private readonly scaleFactor: number;

  private projection = mat4Identity();
  private view = mat4Identity();
  private raf = 0;
  private started = false;
  private destroyed = false;
  private interactive = false;
  private entranceProgress = 0;
  private activeSlotId = 0;
  private lastMovement = false;
  private lastFrame = performance.now();
  private cameraZ: number;
  private pointerId: number | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly projects: readonly WorkProject[],
    callbacks: WorkSphereCallbacks = {},
    options: WorkSphereOptions = {},
  ) {
    if (!projects.length) throw new Error('Work sphere requires at least one project.');

    const gl = canvas.getContext('webgl2', {
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 is not available.');

    this.gl = gl;
    this.callbacks = callbacks;
    const qualityName = options.quality ?? (options.reducedMotion ? 'reduced' : 'full');
    this.profile = WORK_QUALITY_PROFILES[qualityName];
    this.scaleFactor = qualityName === 'mobile' ? 1.12 : 1;
    this.cameraZ = WORK_SPHERE.cameraRestZ * this.scaleFactor;
    this.controller = new ArcballController(Boolean(options.reducedMotion));
    this.slots = buildProjectSlots(projects.length, WORK_SPHERE.radius);
    this.activeSlotId = findNearestSlot(this.slots, this.controller.orientation);
    this.models = this.slots.map(() => mat4Identity());
    this.orientedDirections = this.slots.map(() => vec3f());
    this.instanceMatrices = new Float32Array(this.slots.length * 16);

    this.program = createProgram(gl);
    const mesh = createProjectSurfaceMesh();
    this.indexCount = mesh.indices.length;

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

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

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
      viewMatrix: gl.getUniformLocation(this.program, 'uViewMatrix'),
      projectionMatrix: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
      rotationAxisVelocity: gl.getUniformLocation(this.program, 'uRotationAxisVelocity'),
      deformation: gl.getUniformLocation(this.program, 'uDeformation'),
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

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.bindEvents();
    this.resize();
    this.updateMatrices();

    const initialRanked = rankSlotsByFront(this.slots, this.controller.orientation);
    void this.mediaPool
      .prepareInitial(initialRanked.slice(0, 6).map(entry => entry.slotId))
      .catch(() => undefined)
      .finally(() => this.callbacks.onReady?.());
  }

  start() {
    if (this.destroyed || this.started) return;
    this.started = true;
    this.lastFrame = performance.now();
    this.mediaPool.resumePriority();
    this.scheduleFrame();
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
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteProgram(this.program);
  }

  setInteractive(value: boolean) {
    this.interactive = value;
    if (!value) {
      this.pointerId = null;
      this.controller.pointerUp();
    }
  }

  setEntranceProgress(progress: number) {
    this.entranceProgress = Math.max(0, Math.min(1, progress));
    this.updateMatrices();
  }

  snapToSlot(slotId: number) {
    const slot = this.slots.find(candidate => candidate.id === slotId);
    if (!slot) return;
    const world = transformVec3Quat(vec3f(), slot.direction, this.controller.orientation);
    this.controller.setSnapTarget(world);
    this.activeSlotId = slotId;
    this.callbacks.onActiveSlotChange?.(slotId);
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
    }
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    this.controller.setViewport(cssWidth, cssHeight);
    const aspect = cssWidth / cssHeight;
    const referenceHeight = WORK_SPHERE.radius * 0.35;
    const restDistance = WORK_SPHERE.cameraRestZ * this.scaleFactor;
    const fov = aspect > 1
      ? 2 * Math.atan(referenceHeight / restDistance)
      : 2 * Math.atan(referenceHeight / aspect / restDistance);
    perspectiveMat4(
      this.projection,
      fov,
      aspect,
      WORK_SPHERE.cameraNear,
      WORK_SPHERE.cameraFar,
    );
    this.updateView();
    this.updateMatrices();
  };

  private scheduleFrame() {
    if (!this.started || this.destroyed || document.hidden) return;
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    if (!this.started || this.destroyed) return;
    const deltaMs = Math.min(32, Math.max(1, now - this.lastFrame));
    this.lastFrame = now;

    const snapshot = this.controller.update(deltaMs, WORK_SPHERE.targetFrameDurationMs);

    if (!this.controller.isPointerDown) {
      const nearest = findNearestSlot(this.slots, snapshot.orientation);
      if (nearest >= 0) {
        const slot = this.slots.find(candidate => candidate.id === nearest);
        if (slot) {
          const world = transformVec3Quat(vec3f(), slot.direction, snapshot.orientation);
          this.controller.setSnapTarget(world);
        }
        if (nearest !== this.activeSlotId) {
          this.activeSlotId = nearest;
          this.callbacks.onActiveSlotChange?.(nearest);
          this.refreshMediaPriorities();
        }
      }
    }

    const moving = this.controller.isPointerDown || Math.abs(snapshot.rotationVelocity) > 0.01;
    if (moving !== this.lastMovement) {
      this.lastMovement = moving;
      this.callbacks.onMovementChange?.(moving);
    }

    const targetZ = cameraTargetZ(
      this.scaleFactor,
      snapshot.rotationVelocity,
      this.controller.isPointerDown,
    );
    this.cameraZ = stepCameraZ(
      this.cameraZ,
      targetZ,
      deltaMs,
      this.controller.isPointerDown,
    );
    this.updateView();
    this.updateMatrices();
    this.mediaPool.uploadReadyFrames();
    this.render(snapshot.rotationAxis, snapshot.rotationVelocity);
    this.scheduleFrame();
  };

  private updateView() {
    lookAtMat4(this.view, [0, 0, this.cameraZ], [0, 0, 0], [0, 1, 0]);
  }

  private updateMatrices() {
    const reduced = this.profile.deformation === 0;
    const entranceScale = reduced
      ? 1.08 + (1 - 1.08) * this.entranceProgress
      : WORK_SPHERE.entranceStartScale
        + (1 - WORK_SPHERE.entranceStartScale) * this.entranceProgress;
    const effectiveRadius = WORK_SPHERE.radius * entranceScale;

    for (const slot of this.slots) {
      const oriented = transformVec3Quat(
        this.orientedDirections[slot.id],
        slot.direction,
        this.controller.orientation,
      );
      const px = oriented[0] * entranceScale;
      const py = oriented[1] * entranceScale;
      const pz = oriented[2] * entranceScale;
      const depthScale =
        (Math.abs(pz) / effectiveRadius) * WORK_SPHERE.depthScaleIntensity
        + (1 - WORK_SPHERE.depthScaleIntensity);
      const finalScale = WORK_SPHERE.baseSurfaceScale * depthScale * entranceScale;

      const matrix = this.models[slot.id];
      matrix.set(mat4Identity());
      multiplyMat4(matrix, matrix, translationMatrix(-px, -py, -pz));

      const facing = targetToMat4(
        mat4Identity(),
        [0, 0, 0],
        [px, py, pz],
        Math.abs(py / effectiveRadius) > 0.98 ? [1, 0, 0] : [0, 1, 0],
      );
      multiplyMat4(matrix, matrix, facing);
      multiplyMat4(matrix, matrix, scaleMatrix(finalScale));
      multiplyMat4(matrix, matrix, translationMatrix(0, 0, -effectiveRadius));

      this.instanceMatrices.set(matrix, slot.id * 16);
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceMatrixBuffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.instanceMatrices);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
  }

  private render(rotationAxis: ArrayLike<number>, rotationVelocity: number) {
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, this.view);
    gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, this.projection);
    gl.uniform4f(
      this.uniforms.rotationAxisVelocity,
      rotationAxis[0],
      rotationAxis[1],
      rotationAxis[2],
      rotationVelocity * 1.1,
    );
    gl.uniform1f(this.uniforms.deformation, this.profile.deformation);
    gl.uniform1f(this.uniforms.cornerRadius, 0.045);
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
    this.mediaPool.updatePriorities(ranked);
  }

  private bindEvents() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.style.touchAction = 'none';
  }

  private unbindEvents() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private localPoint(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private onPointerDown = (event: PointerEvent) => {
    if (!this.interactive) return;
    const { x, y } = this.localPoint(event);
    this.pointerId = event.pointerId;
    this.canvas.setPointerCapture?.(event.pointerId);
    this.controller.setSnapTarget(null);
    this.controller.pointerDown(x, y);
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.interactive || this.pointerId !== event.pointerId) return;
    const { x, y } = this.localPoint(event);
    this.controller.pointerMove(x, y);
  };

  private onPointerUp = (event: PointerEvent) => {
    if (this.pointerId !== event.pointerId) return;
    this.pointerId = null;
    this.controller.pointerUp();
  };

  private onPointerLeave = () => {
    if (this.pointerId === null) return;
    this.pointerId = null;
    this.controller.pointerUp();
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
