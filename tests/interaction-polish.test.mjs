import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createInertialAfterglide } from '../src/webgl/reveal/inertia.ts';
import { countdownDelay, FINAL_ZERO_HOLD_MS } from '../src/experience/loading/countdownTiming.ts';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('inertial afterglide advances a fast pointer briefly, decays, and stays bounded', () => {
  const emissions = createInertialAfterglide({
    x: 0.5,
    y: 0.5,
    vx: 1.4,
    vy: 0.2,
    radius: 0.085,
    strength: 1,
  });
  assert.ok(emissions.length >= 4 && emissions.length <= 8);
  assert.ok(emissions.at(-1).delayMs <= 450);
  assert.ok(emissions.some((entry) => entry.sample.x > 0.5));
  assert.ok(emissions.at(-1).sample.radius < emissions[0].sample.radius);
  assert.ok(emissions.at(-1).sample.strength < emissions[0].sample.strength);
});

test('inertial afterglide is negligible for a nearly stationary pointer', () => {
  const emissions = createInertialAfterglide({ x: 0.4, y: 0.4, vx: 0.03, vy: 0.02, radius: 0.085 });
  assert.equal(emissions.length, 0);
});

test('countdown cadence slows progressively toward zero and holds zero', () => {
  assert.ok(countdownDelay(70, 0, false) < countdownDelay(20, 0, false));
  assert.ok(countdownDelay(20, 0, false) < countdownDelay(9, 0, false));
  assert.ok(countdownDelay(5, 0, false) < countdownDelay(3, 0, false));
  assert.ok(countdownDelay(3, 0, false) < countdownDelay(1, 0, false));
  assert.ok(FINAL_ZERO_HOLD_MS >= 600 && FINAL_ZERO_HOLD_MS <= 750);
});

test('hero uses the smaller pointer radius and schedules inertia on idle', () => {
  const canvas = read('src/components/experience/Hero/HeroRevealCanvas.tsx');
  assert.match(canvas, /root\.clientWidth < 720 \? 0\.11 : 0\.085/);
  assert.match(canvas, /createInertialAfterglide/);
  assert.match(canvas, /afterglide/i);
});

test('loader zero shares typography contract with completion zero and transition is smoother', () => {
  const countdown = read('src/components/experience/Loader/LoaderCountdown.tsx');
  const completion = read('src/components/experience/Loader/LoaderCompletion.tsx');
  const css = read('src/app/globals.css');
  assert.match(countdown, /loader-zero-glyph/);
  assert.match(completion, /loader-zero-glyph/);
  assert.match(css, /loader-number-in\s+2(?:6|7|8|9)0ms|loader-number-in\s+3\d\dms/);
  assert.match(css, /\.loader-zero-glyph/);
});

test('loader completion copy and line width match the approved polish', () => {
  const completion = read('src/components/experience/Loader/LoaderCompletion.tsx');
  const css = read('src/app/globals.css');
  assert.match(completion, />Need a website for business\?<\/span>/);
  assert.match(css, /loader-completion__line[\s\S]*width:\s*min\((?:84|86)vw,\s*(?:960|980|1000)px\)/);
});

test('hero is raised further and EXPLORE uses difference inversion', () => {
  const css = read('src/app/globals.css');
  assert.match(css, /\.hero-composition[\s\S]*translateY\(clamp\(-38px,\s*-3\.6vh,\s*-24px\)\)/);
  assert.match(css, /\.hero-explore[\s\S]*mix-blend-mode:\s*difference/);
  assert.match(css, /\.hero-explore[\s\S]*color:\s*#fff/);
});
