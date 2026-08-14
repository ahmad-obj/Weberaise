import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('sphere transition shader peels non-selected instances without restoring wiggle', () => {
  const shader = read('src/webgl/workSphere/shaders.ts');
  assert.match(shader, /uSelectedSlotId/);
  assert.match(shader, /uProjectOpenProgress/);
  assert.match(shader, /worldPosition\.xyz\s*=\s*radius\s*\*\s*normalize\(worldPosition\.xyz\)/);
  assert.doesNotMatch(shader, /uDeformation|uRotationAxisVelocity|stretchDir/);
});

test('transition and project view remain separate DOM responsibilities', () => {
  const transition = read('src/components/WorkPage/WorkProjectTransition.tsx');
  const view = read('src/components/WorkPage/WorkProjectView.tsx');
  assert.match(transition, /getWorkProjectDestination/);
  assert.match(transition, /gsap/);
  assert.match(transition, /onOwnership/);
  assert.match(transition, /onProgress/);
  assert.match(view, /Back to Work/);
  assert.match(view, /Services/);
  assert.match(view, /Year/);
  assert.doesNotMatch(view, /testimonial|conversion rate|tech stack|process timeline/i);
});

test('project viewing stops WebGL and return uses resolved snapshot before pre-open snapshot', () => {
  const page = read('src/components/WorkPage/WorkPage.tsx');
  assert.match(page, /resolvedSnapshotRef/);
  assert.match(page, /preOpenSnapshotRef/);
  assert.match(page, /\.stop\(\)/);
  assert.match(page, /projectViewing/);
  assert.match(page, /projectReturning/);
  assert.doesNotMatch(page, /router\.push|useRouter|ProjectTransitionBridge|ProjectShowcase/);
});

test('transition path does not use canvas readback or continuous picking', () => {
  const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
  assert.doesNotMatch(engine, /readPixels|toDataURL|getImageData/);
  const frameMatch = engine.match(/private frame[\s\S]*?private updateView/);
  assert.ok(frameMatch);
  assert.doesNotMatch(frameMatch[0], /hitTestProjectedSlots/);
});

test('expanded project layout avoids unsupported CSS length multiplication', () => {
  const css = read('src/components/WorkPage/WorkPage.module.css');
  assert.doesNotMatch(css, /calc\([^)]*\*\s*1\.6/);
});
