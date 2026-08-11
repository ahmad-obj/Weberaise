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

test('reveal compositor uses a coherent contour instead of temporal hash-grain fog', () => {
  const shader = read('src/webgl/reveal/shaders.ts');
  assert.doesNotMatch(shader, /float hash\s*\(/);
  assert.doesNotMatch(shader, /floor\(vUv \* 260\.0\)/);
  assert.match(shader, /contourWarp/);
  assert.match(shader, /smoothstep\(0\.40,\s*0\.47,/);
});

test('full reveal quality favors clean contour persistence over advection', () => {
  const quality = read('src/webgl/reveal/quality.ts');
  assert.match(quality, /halfLife:\s*2\.75/);
  assert.match(quality, /advection:\s*0\.003/);
  assert.match(quality, /maskShortAxis:\s*Math\.min\(512/);
});
