import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('work route uses the dedicated work page', () => {
  assert.match(read('src/app/work/page.tsx'), /WorkPage/);
});

test('opening is only OUR WORKS and never exposes fake loading UI', () => {
  const opening = read('src/components/WorkPage/WorkOpening.tsx');
  assert.match(opening, /OUR WORKS/);
  assert.doesNotMatch(opening, /spinner|percentage|loading projects/i);
});

test('work styling contains reduced-motion and scroll-lock contracts', () => {
  const css = read('src/components/WorkPage/WorkPage.module.css');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /work-page-scroll-locked/);
});

test('phase one browse route cannot open project showcase', () => {
  const page = read('src/components/WorkPage/WorkPage.tsx');
  const canvas = read('src/components/WorkPage/WorkSphereCanvas.tsx');
  assert.doesNotMatch(page, /ProjectTransitionBridge/);
  assert.doesNotMatch(page, /ProjectShowcase/);
  assert.doesNotMatch(page, /activateSlot/);
  assert.doesNotMatch(canvas, /onProjectActivate/);
});

test('phase one active project follows sphere focus without a hover override path', () => {
  const page = read('src/components/WorkPage/WorkPage.tsx');
  const canvas = read('src/components/WorkPage/WorkSphereCanvas.tsx');
  assert.doesNotMatch(page, /hoverSlotId|setHoverSlotId|onHoverSlotChange/);
  assert.doesNotMatch(canvas, /onHoverSlotChange/);
});

test('sphere engine stays direct WebGL with instanced rendering', () => {
  const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
  assert.match(engine, /getContext\(['"]webgl2/);
  assert.match(engine, /drawElementsInstanced/);
});

test('sphere adapter keeps callbacks live without recreating the WebGL engine for interactivity changes', () => {
  const adapter = read('src/components/WorkPage/WorkSphereCanvas.tsx');
  assert.match(adapter, /callbacksRef/);
  assert.doesNotMatch(adapter, /\[interactive, projectKey/);
});

test('work sphere adds no new runtime dependency', () => {
  assert.doesNotMatch(read('package.json'), /gl-matrix/);
  assert.doesNotMatch(read('src/webgl/workSphere/math.ts'), /from ['"]gl-matrix/);
});

test('browse metadata is deliberately minimal', () => {
  const meta = read('src/components/WorkPage/WorkBrowseMeta.tsx');
  assert.match(meta, /category/);
  assert.doesNotMatch(meta, /brief|year|services/);
});

test('quality profiles and no-WebGL fallback remain explicit without phase-two showcase behavior', () => {
  const quality = read('src/webgl/workSphere/quality.ts');
  const fallback = read('src/components/WorkPage/WorkFallback.tsx');
  assert.match(quality, /dprCap/);
  assert.match(quality, /liveVideoSlots/);
  assert.doesNotMatch(fallback, /ProjectShowcase/);
  assert.doesNotMatch(fallback, /setSelected|onClick/);
});
