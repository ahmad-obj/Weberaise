import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('EXPLORE is a framed difference-blended CTA above the reveal compositor', () => {
  const css = read('src/app/globals.css');
  assert.match(css, /\.hero-explore\s*\{[^}]*min-width:\s*126px/s);
  assert.match(css, /\.hero-explore\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.hero-explore\s*\{[^}]*border:\s*1px solid currentColor/s);
  assert.match(css, /\.hero-explore\s*\{[^}]*border-radius:\s*4px/s);
  assert.match(css, /\.hero-explore\s*\{[^}]*color:\s*#fff[^}]*mix-blend-mode:\s*difference/s);
  assert.match(css, /\.hero-explore:hover[^}]*translateY\(-2px\)/s);
  assert.match(css, /\.hero-explore:active[^}]*scale\(\.985\)/s);
  assert.match(css, /\[data-hero-explore\][^}]*z-index:\s*7/s);
});

test('EXPLORE exit is solver-driven fluid rather than analytic bottomFill', () => {
  const engine = read('src/webgl/reveal/RevealEngine.ts');
  const fluidShaders = read('src/webgl/reveal/fluid/shaders.ts');
  const composite = read('src/webgl/reveal/shaders.ts');
  const timeline = read('src/experience/motion/exploreTimeline.ts');

  assert.match(engine, /export type RevealMode = 'reveal' \| 'fluidExit' \| 'disabled'/);
  assert.match(engine, /setExitProgress\(/);
  assert.match(engine, /getExitProgress\(/);
  assert.match(engine, /exitSourceProgram/);
  assert.match(engine, /this\.mode === 'reveal' \|\| this\.mode === 'fluidExit'/);
  assert.match(engine, /applyExitSource\(this\.velocity/);
  assert.match(engine, /applyExitSource\(this\.dye/);
  assert.match(fluidShaders, /EXIT_SOURCE_FRAGMENT/);
  assert.match(composite, /uExitProgress/);
  assert.match(composite, /uExitSealStart/);
  assert.match(composite, /smoothstep\(\s*uExitSealStart,\s*1\.0,\s*clamp\(uExitProgress/s);
  assert.doesNotMatch(composite, /sin\s*\(/);
  assert.doesNotMatch(engine, /bottomFill/);
  assert.match(timeline, /engine\.quality\.enableVelocity/);
  assert.match(timeline, /!options\.reducedMotion/);
  assert.match(timeline, /engine\.setMode\('fluidExit'\)/);
  assert.match(timeline, /engine\.setExitProgress\(progress\.value\)/);
  assert.match(timeline, /fluidDuration = 1\.6/);
  assert.match(timeline, /finalBlackHold = options\.reducedMotion \? 0 : 0\.06/);
  assert.doesNotMatch(timeline, /bottomFillState|setBottomFillProgress|setMode\('bottomFill'\)/);
});
