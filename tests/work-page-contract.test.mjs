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

test('sphere engine is direct WebGL with instanced rectangular rendering', () => {
  const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
  const shaders = read('src/webgl/workSphere/shaders.ts');
  assert.match(engine, /getContext\(['"]webgl2/);
  assert.match(engine, /drawElementsInstanced/);
  assert.match(engine, /getSlotScreenBounds/);
  assert.match(engine, /pointerdown/);
  assert.match(engine, /pointermove/);
  assert.match(engine, /setHoverSlot/);
  assert.match(shaders, /rounded/i);
  assert.doesNotMatch(shaders, /DiscGeometry/);
});

test('browse metadata is deliberately minimal', () => {
  const meta = read('src/components/WorkPage/WorkBrowseMeta.tsx');
  assert.match(meta, /category/);
  assert.doesNotMatch(meta, /brief|year|services/);
});

test('project showcase uses explicit full-video controls and minimal facts', () => {
  const showcase = read('src/components/WorkPage/ProjectShowcase.tsx');
  assert.match(showcase, /controls/);
  assert.match(showcase, /preload="metadata"/);
  assert.match(showcase, /Visit Website/);
  assert.match(showcase, /services/);
  assert.match(showcase, /year/);
  assert.doesNotMatch(showcase, /tech stack|testimonial|conversion rate/i);
});

test('quality and no-WebGL fallback are explicit', () => {
  const quality = read('src/webgl/workSphere/quality.ts');
  assert.match(quality, /dprCap/);
  assert.match(quality, /liveVideoSlots/);
  assert.match(read('src/components/WorkPage/WorkFallback.tsx'), /ProjectShowcase/);
});
