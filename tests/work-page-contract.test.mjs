import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('work route uses the dedicated work page', () => {
  assert.match(read('src/app/work/page.tsx'), /WorkPage/);
});

test('opening remains only OUR WORKS and never exposes fake loading UI', () => {
  const opening = read('src/components/WorkPage/WorkOpening.tsx');
  assert.match(opening, /OUR WORKS/);
  assert.doesNotMatch(opening, /spinner|percentage|loading projects/i);
});

test('Phase 2 uses bounded sphere activation and separate DOM project components', () => {
  const page = read('src/components/WorkPage/WorkPage.tsx');
  const canvas = read('src/components/WorkPage/WorkSphereCanvas.tsx');
  assert.match(page, /WorkProjectTransition/);
  assert.match(page, /WorkProjectView/);
  assert.match(canvas, /onProjectActivate/);
  assert.match(canvas, /captureTransitionSnapshot/);
  assert.match(canvas, /beginResolveToSlot/);
  assert.match(canvas, /setProjectOpenProgress/);
  assert.doesNotMatch(page, /ProjectTransitionBridge|ProjectShowcase|useRouter|router\.push/);
});

test('sphere adapter keeps callbacks live without recreating engine for interactivity changes', () => {
  const adapter = read('src/components/WorkPage/WorkSphereCanvas.tsx');
  assert.match(adapter, /callbacksRef/);
  assert.doesNotMatch(adapter, /\[interactive, projectKey/);
});

test('sphere engine remains direct instanced WebGL and picking is not part of RAF', () => {
  const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
  assert.match(engine, /getContext\(['"]webgl2/);
  assert.match(engine, /drawElementsInstanced/);
  assert.match(engine, /isActivationGesture/);
  const frameMatch = engine.match(/private frame[\s\S]*?private updateView/);
  assert.ok(frameMatch);
  assert.doesNotMatch(frameMatch[0], /hitTestProjectedSlots/);
});

test('programmatic focus restoration does not destroy the exact pre-open sphere orientation', () => {
  const page = read('src/components/WorkPage/WorkPage.tsx');
  assert.match(page, /suppressSemanticSnapRef/);
  assert.match(page, /if \(!suppressSemanticSnapRef\.current\)/);
  assert.match(page, /suppressSemanticSnapRef\.current\s*=\s*true[\s\S]*\.focus\(\)[\s\S]*suppressSemanticSnapRef\.current\s*=\s*false/);
});

test('work sphere adds no new runtime dependency', () => {
  assert.doesNotMatch(read('package.json'), /gl-matrix/);
  assert.doesNotMatch(read('src/webgl/workSphere/math.ts'), /from ['"]gl-matrix/);
});

test('fallback opens project content rather than exposing a dead gallery', () => {
  const fallback = read('src/components/WorkPage/WorkFallback.tsx');
  assert.match(fallback, /onSelect/);
  assert.match(fallback, /onClick/);
});

test('scroll lock and reduced motion remain explicit', () => {
  const css = read('src/components/WorkPage/WorkPage.module.css');
  assert.match(css, /work-page-scroll-locked/);
  assert.match(css, /prefers-reduced-motion/);
});
