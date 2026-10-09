import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkPreviewMediaPool } from '../src/webgl/workSphere/mediaPool.ts';
import { createProjectSurfaceMesh } from '../src/webgl/workSphere/geometry.ts';

function fixture(autoPlayback = true) {
  const videos = [];
  const flips = [];
  const gl = new Proxy({ pixelStorei: (_, value) => flips.push(value), createTexture: () => ({}) }, {
    get: (target, key) => key in target ? target[key] : (() => {}),
  });
  globalThis.document = { createElement: tag => {
    if (tag === 'canvas') return { width: 0, height: 0, getContext: () => ({ fillRect() {}, drawImage() {} }) };
    const video = { src: '', paused: true, loads: 0, plays: 0,
      pause() { this.paused = true; }, removeAttribute() { this.src = ''; },
      load() { this.loads++; }, play() { this.paused = false; this.plays++; return Promise.resolve(); },
    };
    videos.push(video);
    return video;
  }};
  const projects = [0, 1, 2].map(i => ({ media: { poster: `poster-${i}`, browsePreview: `preview-${i}` } }));
  const slots = [0, 1, 2, 3, 4, 5].map(id => ({ id, projectIndex: id % 3 }));
  return { pool: new WorkPreviewMediaPool(gl, projects, slots, 3, autoPlayback), videos, flips };
}
const ranked = ids => ids.map((slotId, rank) => ({ slotId, rank, projectIndex: slotId % 3 }));

test('moving the same project between globe tiles retains its decoder and frame', () => {
  const { pool, videos } = fixture();
  pool.updatePriorities(ranked([0, 1, 2]));
  const before = videos.map(v => v.loads);
  pool.liveSlots.forEach(s => { s.hasFrame = true; });
  pool.updatePriorities(ranked([5, 3, 4]));
  assert.deepEqual(videos.map(v => v.loads), before);
  assert.ok(pool.liveSlots.every(s => s.hasFrame));
  assert.deepEqual(pool.liveSlots.map(s => s.assignedSlotId), [3, 4, 5]);
  assert.deepEqual(videos.map(v => v.plays), [1, 1, 1]);
});

test('reduced motion shows posters without downloading preview videos', () => {
  const { pool, videos } = fixture(false);
  pool.updatePriorities(ranked([0, 1, 2]));
  assert.ok(videos.every(v => !v.src && v.loads === 0));
});

test('top-origin mesh UVs use unflipped uploads for both atlas and video', async () => {
  const { pool, flips } = fixture();
  globalThis.Image = class {
    naturalWidth = 480; naturalHeight = 300;
    set src(value) { queueMicrotask(() => this.onload()); }
  };
  await pool.buildPosterAtlas();
  pool.uploadReadyFrames();
  assert.deepEqual(flips, [0, 0]);
  const mesh = createProjectSurfaceMesh();
  assert.equal(mesh.uvs[1], 1); // Bottom of the world-space tile samples image bottom.
  assert.equal(mesh.uvs.at(-1), 0); // Top samples image top.
});

test('published preview and showcase MP4s have fast-start metadata and bounded sizes', async () => {
  const { readFileSync } = await import('node:fs');
  const { WORK_PROJECTS } = await import('../src/content/workProjects.ts');
  for (const project of WORK_PROJECTS) {
    for (const [key, budget] of [['browsePreview', 900_000], ['showcaseVideo', 16_000_000], ['teaserPreview', 400_000]]) {
      const data = readFileSync(new URL(`../public${project.media[key]}`, import.meta.url));
      assert.ok(data.length < budget, `${project.slug} ${key} exceeds its delivery budget`);
      const atoms = [];
      for (let offset = 0; offset + 8 <= data.length;) {
        const size = data.readUInt32BE(offset);
        atoms.push(data.toString('ascii', offset + 4, offset + 8));
        if (size < 8) break;
        offset += size;
      }
      assert.ok(atoms.includes('moov') && atoms.includes('mdat'));
      assert.ok(atoms.indexOf('moov') < atoms.indexOf('mdat'), `${project.slug}: metadata must precede video`);
    }
  }
});

test('showcase declares its media type and switches to an independent codec after an error', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../src/components/WorkPage/WorkProjectView.tsx', import.meta.url), 'utf8');
  assert.match(source, /<source[\s\S]*type=/);
  assert.match(source, /onError=/);
  assert.match(source, /showcaseFallback/);
  assert.match(source, /setUseFallback\(true\)/);
  assert.match(source, /key=\{.*videoUrl/);
});

test('the project showcase player is muted by default', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../src/components/WorkPage/WorkProjectView.tsx', import.meta.url), 'utf8');
  assert.match(source, /<video\b[^>]*\bmuted\b/);
});
