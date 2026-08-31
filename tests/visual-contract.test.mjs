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

test('reveal source is a pressure-projected persistent fluid, not implicit primitives', () => {
  const fluid = read('src/webgl/reveal/fluid/shaders.ts');
  assert.match(fluid, /SPLAT_FRAGMENT/);
  assert.match(fluid, /ADVECTION_FRAGMENT/);
  assert.match(fluid, /DIVERGENCE_FRAGMENT/);
  assert.match(fluid, /PRESSURE_FRAGMENT/);
  assert.match(fluid, /GRADIENT_SUBTRACT_FRAGMENT/);
  assert.match(fluid, /exp\(-dot\(/);
  assert.doesNotMatch(fluid, /fbm|simplex|hash\s*\(|vorticity|uCurlStrength/i);
});

test('interactive composite thresholds dye without animated contour noise', () => {
  const shader = read('src/webgl/reveal/shaders.ts');
  assert.match(shader, /uDye/);
  assert.match(shader, /uRevealGain/);
  assert.match(shader, /uEdgeSoftness/);
  assert.match(shader, /uEdgeWidth/);
  assert.doesNotMatch(shader, /uContourWarp|contourWave/);
});

test('full quality profile encodes the confirmed Nothin fluid baseline', () => {
  const quality = read('src/webgl/reveal/quality.ts');
  assert.match(quality, /simResolution:\s*256/);
  assert.match(quality, /dyeResolution:\s*512/);
  assert.match(quality, /pressureIterations:\s*20/);
  assert.match(quality, /velocityRetention60:\s*0\.962/);
  assert.match(quality, /dyeRetention60:\s*0\.988/);
  assert.match(quality, /splatForce:\s*5900/);
  assert.match(quality, /revealGain:\s*3\.9/);
});

test('post-explore root owns the seamless black handoff from EXPLORE', () => {
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  const shell = read('src/components/experience/ExperienceShell.tsx');
  assert.match(css, /\.root\s*\{[^}]*background:\s*var\(--wr-black\)/s);
  assert.match(shell, /state\s*!==\s*'main'/);
  assert.match(shell, /EXPLORE_COMPLETE/);
});

test('post-explore effects include reduced-motion handling without adding the separate Motion package', () => {
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  const pkg = read('package.json');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(pkg, /"motion"\s*:/);
});
