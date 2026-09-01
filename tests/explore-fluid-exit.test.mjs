import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('EXPLORE is an always-visible rounded adaptive CTA above the reveal compositor', () => {
  const css = read('src/app/globals.css');
  const component = read('src/components/experience/Hero/HeroExploreButton.tsx');
  const block = css.match(/\.hero-explore\s*\{([^}]*)\}/s)?.[1] ?? '';

  assert.match(block, /min-width:\s*152px/);
  assert.match(block, /min-height:\s*48px/);
  assert.match(block, /border-radius:\s*14px/);
  assert.match(block, /background:\s*rgba\(8,\s*10,\s*14,\s*\.78\)/);
  assert.match(block, /border:\s*1px solid rgba\(255,\s*255,\s*255,\s*\.26\)/);
  assert.match(block, /backdrop-filter:\s*blur\(12px\) saturate\(\.85\)/);
  assert.match(block, /box-shadow:[^;]*rgba\(0,\s*0,\s*0,\s*\.20\)/s);
  assert.doesNotMatch(block, /mix-blend-mode/);
  assert.match(css, /\.hero-explore:hover[^}]*translateY\(-2px\)/s);
  assert.match(css, /\.hero-explore:hover\s+\.hero-explore__icon[^}]*translateY\(2px\)/s);
  assert.match(css, /\.hero-explore:active[^}]*scale\(\.985\)/s);
  assert.match(css, /\[data-hero-explore\][^}]*z-index:\s*7/s);

  assert.match(component, /hero-explore__label/);
  assert.match(component, /hero-explore__icon/);
  assert.match(component, /<svg/);
  assert.match(component, /aria-hidden="true"/);
  assert.doesNotMatch(component, /hero-explore__rule/);
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
  assert.match(fluidShaders, /shapePhase\s*=\s*smoothstep\(0\.12,\s*0\.88,\s*progress\)/);
  assert.match(fluidShaders, /velocityDrive\s*=\s*mix\(0\.18,\s*0\.26,\s*drive\)/);
  assert.match(fluidShaders, /velocityDriven\s*=\s*mix\(base,\s*velocityTarget,\s*velocityDrive\)/);
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
  assert.doesNotMatch(timeline, /engine\.clear\(\)/);
  assert.doesNotMatch(timeline, /bottomFillState|setBottomFillProgress|setMode\('bottomFill'\)/);
});
