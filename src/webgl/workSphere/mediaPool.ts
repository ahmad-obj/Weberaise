import type { WorkProject } from '@/content/workProjects';
import type { SphereSlot } from './types';

type RankedSlot = { slotId: number; rank: number };

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: (now: number, metadata: unknown) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

type LiveSlot = {
  texture: WebGLTexture;
  video: VideoWithFrameCallback;
  assignedSlotId: number;
  assignedProjectIndex: number;
  dirty: boolean;
  hasFrame: boolean;
  textureWidth: number;
  textureHeight: number;
  lastTime: number;
  frameHandle: number | null;
};

export type WorkMediaUniforms = {
  posterAtlas: WebGLUniformLocation | null;
  atlasGrid: WebGLUniformLocation | null;
  videoTextures: readonly (WebGLUniformLocation | null)[];
  videoSlotIds: readonly (WebGLUniformLocation | null)[];
};

export function selectLiveVideoSlots(
  ranked: readonly RankedSlot[],
  maxSlots: number,
  hoverSlotId?: number,
): number[] {
  const result: number[] = [];
  if (maxSlots <= 0) return result;
  if (hoverSlotId !== undefined && hoverSlotId >= 0) result.push(hoverSlotId);
  for (const item of [...ranked].sort((a, b) => a.rank - b.rank)) {
    if (!result.includes(item.slotId)) result.push(item.slotId);
    if (result.length >= maxSlots) break;
  }
  return result.slice(0, maxSlots);
}

export class WorkPreviewMediaPool {
  readonly atlasGrid: number;

  private posterTexture: WebGLTexture;
  private liveSlots: LiveSlot[];
  private slotById: Map<number, SphereSlot>;
  private destroyed = false;
  private allowPlayback: boolean;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly projects: readonly WorkProject[],
    slots: readonly SphereSlot[],
    maxLiveSlots: number,
    autoPlayback = true,
  ) {
    this.slotById = new Map(slots.map(slot => [slot.id, slot]));
    this.atlasGrid = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, projects.length))));
    this.allowPlayback = autoPlayback;
    this.posterTexture = this.createTexture();
    this.liveSlots = Array.from({ length: Math.max(0, maxLiveSlots) }, () => this.createLiveSlot());
  }

  async prepareInitial(initialPriorityIds: readonly number[]): Promise<void> {
    await this.buildPosterAtlas();
    const ranked = initialPriorityIds.map((slotId, rank) => ({ slotId, rank }));
    this.updatePriorities(ranked);

    const primary = this.liveSlots[0]?.video;
    if (!primary || !primary.src) return;
    await Promise.race([
      this.waitForCurrentData(primary),
      new Promise<void>(resolve => window.setTimeout(resolve, 1200)),
    ]);
  }

  updatePriorities(ranked: readonly RankedSlot[], hoverSlotId?: number) {
    if (this.destroyed) return;
    const desired = selectLiveVideoSlots(ranked, this.liveSlots.length, hoverSlotId);
    const existingBySlot = new Map<number, LiveSlot>();
    for (const slot of this.liveSlots) {
      if (slot.assignedSlotId >= 0) existingBySlot.set(slot.assignedSlotId, slot);
    }

    const nextAssignments: Array<{ live: LiveSlot; slotId: number }> = [];
    const free = this.liveSlots.filter(slot => !desired.includes(slot.assignedSlotId));
    for (const slotId of desired) {
      const existing = existingBySlot.get(slotId);
      if (existing) nextAssignments.push({ live: existing, slotId });
      else {
        const live = free.shift();
        if (live) nextAssignments.push({ live, slotId });
      }
    }

    const used = new Set(nextAssignments.map(entry => entry.live));
    for (const live of this.liveSlots) {
      if (!used.has(live)) this.unassign(live);
    }
    for (const { live, slotId } of nextAssignments) {
      if (live.assignedSlotId !== slotId) this.assign(live, slotId);
      if (this.allowPlayback) void live.video.play().catch(() => undefined);
    }
  }

  uploadReadyFrames() {
    if (this.destroyed) return;
    const gl = this.gl;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    for (const live of this.liveSlots) {
      const video = live.video;
      if (live.assignedSlotId < 0 || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) continue;
      if (!video.requestVideoFrameCallback && video.currentTime !== live.lastTime) {
        live.dirty = true;
        live.lastTime = video.currentTime;
      }
      if (!live.dirty || !video.videoWidth || !video.videoHeight) continue;

      gl.bindTexture(gl.TEXTURE_2D, live.texture);
      try {
        if (live.textureWidth !== video.videoWidth || live.textureHeight !== video.videoHeight) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          live.textureWidth = video.videoWidth;
          live.textureHeight = video.videoHeight;
        } else {
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
        }
        live.hasFrame = true;
        live.dirty = false;
      } catch {
        live.hasFrame = false;
      }
    }
  }

  bind(uniforms: WorkMediaUniforms) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.posterTexture);
    gl.uniform1i(uniforms.posterAtlas, 0);
    gl.uniform1i(uniforms.atlasGrid, this.atlasGrid);

    for (let index = 0; index < this.liveSlots.length; index += 1) {
      const live = this.liveSlots[index];
      gl.activeTexture(gl.TEXTURE1 + index);
      gl.bindTexture(gl.TEXTURE_2D, live.texture);
      gl.uniform1i(uniforms.videoTextures[index], 1 + index);
      gl.uniform1i(uniforms.videoSlotIds[index], live.hasFrame ? live.assignedSlotId : -1);
    }
    for (let index = this.liveSlots.length; index < uniforms.videoTextures.length; index += 1) {
      gl.uniform1i(uniforms.videoSlotIds[index], -1);
    }
  }

  pauseAll() {
    for (const live of this.liveSlots) live.video.pause();
  }

  resumePriority() {
    if (!this.allowPlayback) return;
    for (const live of this.liveSlots) {
      if (live.assignedSlotId >= 0) void live.video.play().catch(() => undefined);
    }
  }

  setAutomaticPlayback(enabled: boolean) {
    this.allowPlayback = enabled;
    if (!enabled) this.pauseAll();
    else this.resumePriority();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    const gl = this.gl;
    for (const live of this.liveSlots) {
      this.cancelFrameCallback(live);
      live.video.pause();
      live.video.removeAttribute('src');
      live.video.load();
      gl.deleteTexture(live.texture);
    }
    gl.deleteTexture(this.posterTexture);
    this.liveSlots = [];
  }

  private createTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error('Unable to allocate Work preview texture.');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([7, 10, 15, 255]));
    return texture;
  }

  private createLiveSlot(): LiveSlot {
    const video = document.createElement('video') as VideoWithFrameCallback;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    return {
      texture: this.createTexture(),
      video,
      assignedSlotId: -1,
      assignedProjectIndex: -1,
      dirty: false,
      hasFrame: false,
      textureWidth: 1,
      textureHeight: 1,
      lastTime: -1,
      frameHandle: null,
    };
  }

  private async buildPosterAtlas() {
    const cellWidth = 1024;
    const cellHeight = 640;
    const canvas = document.createElement('canvas');
    canvas.width = this.atlasGrid * cellWidth;
    canvas.height = this.atlasGrid * cellHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to create poster atlas canvas.');
    context.fillStyle = '#070a0f';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await Promise.all(this.projects.map(async (project, projectIndex) => {
      const x = (projectIndex % this.atlasGrid) * cellWidth;
      const y = Math.floor(projectIndex / this.atlasGrid) * cellHeight;
      try {
        const image = await this.loadImage(project.media.poster);
        const sourceRatio = image.naturalWidth / image.naturalHeight;
        const targetRatio = cellWidth / cellHeight;
        let sx = 0;
        let sy = 0;
        let sw = image.naturalWidth;
        let sh = image.naturalHeight;
        if (sourceRatio > targetRatio) {
          sw = sh * targetRatio;
          sx = (image.naturalWidth - sw) * 0.5;
        } else {
          sh = sw / targetRatio;
          sy = (image.naturalHeight - sh) * 0.5;
        }
        context.drawImage(image, sx, sy, sw, sh, x, y, cellWidth, cellHeight);
      } catch {
        context.fillStyle = '#070a0f';
        context.fillRect(x, y, cellWidth, cellHeight);
      }
    }));

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.posterTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to load Work poster: ${src}`));
      image.src = src;
    });
  }

  private assign(live: LiveSlot, slotId: number) {
    this.cancelFrameCallback(live);
    const slot = this.slotById.get(slotId);
    if (!slot) return this.unassign(live);
    const project = this.projects[slot.projectIndex];
    if (!project) return this.unassign(live);

    live.video.pause();
    live.assignedSlotId = slotId;
    live.assignedProjectIndex = slot.projectIndex;
    live.dirty = false;
    live.hasFrame = false;
    live.textureWidth = 1;
    live.textureHeight = 1;
    live.lastTime = -1;
    live.video.src = project.media.browsePreview;
    live.video.load();
    this.scheduleFrameCallback(live);
  }

  private unassign(live: LiveSlot) {
    this.cancelFrameCallback(live);
    live.video.pause();
    live.video.removeAttribute('src');
    live.video.load();
    live.assignedSlotId = -1;
    live.assignedProjectIndex = -1;
    live.dirty = false;
    live.hasFrame = false;
    live.lastTime = -1;
  }

  private scheduleFrameCallback(live: LiveSlot) {
    if (!live.video.requestVideoFrameCallback) return;
    const callback = () => {
      if (live.assignedSlotId < 0 || this.destroyed) return;
      live.dirty = true;
      live.frameHandle = live.video.requestVideoFrameCallback?.(callback) ?? null;
    };
    live.frameHandle = live.video.requestVideoFrameCallback(callback);
  }

  private cancelFrameCallback(live: LiveSlot) {
    if (live.frameHandle !== null && live.video.cancelVideoFrameCallback) {
      live.video.cancelVideoFrameCallback(live.frameHandle);
    }
    live.frameHandle = null;
  }

  private waitForCurrentData(video: HTMLVideoElement): Promise<void> {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
    return new Promise(resolve => {
      const done = () => {
        video.removeEventListener('loadeddata', done);
        resolve();
      };
      video.addEventListener('loadeddata', done, { once: true });
    });
  }
}
