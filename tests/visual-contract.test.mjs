import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('loader countdown is fixed at viewport center instead of pseudo-random positions', () => {
  const component = read('src/components/experience/Loader/LoaderCountdown.tsx');
  const css = read('src/app/globals.css');
  assert.doesNotMatch(component, /createCountdownPositions|pointForValue|viewport/);
  assert.match(css, /\.loader-countdown__number\s*\{[^}]*left:\s*50%[^}]*top:\s*50%/s);
});

test('hero has a barely visible radial edge vignette above the reveal compositor', () => {
  const css = read('src/app/globals.css');
  assert.match(css, /\.hero-experience::after\s*\{/);
  assert.match(css, /radial-gradient\(/);
  assert.match(css, /rgba\(0,\s*0,\s*0,\s*0\.0(?:2|3)/);
  assert.match(css, /z-index:\s*6/);
});

test('front and reveal composition are raised together through the shared composition class', () => {
  const css = read('src/app/globals.css');
  assert.match(css, /\.hero-composition\s*\{[^}]*transform:\s*translateY\(/s);
});

test('reveal uses a solid implicit primitive field instead of feedback-density decay', () => {
  const shader = read('src/webgl/reveal/shaders.ts');
  const engine = read('src/webgl/reveal/RevealEngine.ts');

  assert.match(shader, /FIELD_VERTEX/);
  assert.match(shader, /FIELD_FRAGMENT/);
  assert.match(engine, /drawArraysInstanced/);
  assert.match(engine, /liquidRadiusScale/);
  assert.match(engine, /blendFunc\(gl\.ONE,\s*gl\.ONE\)/);

  assert.doesNotMatch(shader, /uPrevious|uHalfLife|uAdvection/);
  assert.doesNotMatch(shader, /retention\s*=/);
  assert.doesNotMatch(engine, /historyTargets|historyReadIndex|updateHistory/);
});

test('composite extracts a narrow hard liquid surface with contour-only deformation', () => {
  const shader = read('src/webgl/reveal/shaders.ts');
  assert.match(shader, /uSurfaceThreshold/);
  assert.match(shader, /uContourWarp/);
  assert.match(shader, /fwidth\(field\)/);
  assert.doesNotMatch(shader, /float hash\s*\(/);
  assert.doesNotMatch(shader, /floor\(vUv/);
});

test('full quality profile encodes age-aware lifetime and bounded primitive count', () => {
  const quality = read('src/webgl/reveal/quality.ts');
  assert.match(quality, /lifetime:\s*3\.6/);
  assert.match(quality, /holdFraction:\s*0\.6/);
  assert.match(quality, /maxPrimitives:\s*420/);
  assert.match(quality, /surfaceThreshold:\s*0\.4/);
  assert.match(quality, /maskShortAxis:\s*Math\.min\(512/);
});

test('post-explore root owns the seamless black handoff from EXPLORE', () => {
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  const shell = read('src/components/experience/ExperienceShell.tsx');
  assert.match(css, /\.root\s*\{[^}]*background:\s*var\(--wr-black\)/s);
  assert.match(shell, /state\s*!==\s*'main'/);
  assert.match(shell, /EXPLORE_COMPLETE/);
});

test('post-explore effects include reduced-motion handling without adding Motion', () => {
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  const pkg = read('package.json');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(pkg, /"motion"\s*:|"framer-motion"\s*:/);
});
