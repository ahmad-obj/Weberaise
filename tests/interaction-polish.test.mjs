import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { countdownDelay, FINAL_ZERO_HOLD_MS } from '../src/experience/loading/countdownTiming.ts';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('countdown cadence slows progressively toward zero and holds zero', () => {
  assert.ok(countdownDelay(70, 0, false) < countdownDelay(20, 0, false));
  assert.ok(countdownDelay(20, 0, false) < countdownDelay(9, 0, false));
  assert.ok(countdownDelay(5, 0, false) < countdownDelay(3, 0, false));
  assert.ok(countdownDelay(3, 0, false) < countdownDelay(1, 0, false));
  assert.ok(FINAL_ZERO_HOLD_MS >= 600 && FINAL_ZERO_HOLD_MS <= 750);
});

test('hero keeps the approved tight pointer sampling geometry', () => {
  const canvas = read('src/components/experience/Hero/HeroRevealCanvas.tsx');
  assert.match(canvas, /root\.clientWidth < 720 \? 0\.10 : 0\.078/);
  assert.match(canvas, /maxSpacing:\s*0\.022/);
  assert.match(canvas, /maxVelocity:\s*1\.85/);
});

test('persistent loader zero remains Loader-owned across completion', () => {
  const loader = read('src/components/experience/Loader/Loader.tsx');
  const completion = read('src/components/experience/Loader/LoaderCompletion.tsx');
  const css = read('src/app/globals.css');
  assert.match(loader, /loader-zero-glyph/);
  assert.match(loader, /loader-persistent-zero/);
  assert.match(loader, /data-loader-zero/);
  assert.match(completion, /zeroRef/);
  assert.doesNotMatch(completion, /loader-zero-glyph/);
  assert.match(css, /\.loader-zero-glyph/);
});

test('loader completion copy and line width match the approved polish', () => {
  const completion = read('src/components/experience/Loader/LoaderCompletion.tsx');
  const css = read('src/app/globals.css');
  assert.match(completion, />Need a website for business\?<\/span>/);
  assert.match(css, /loader-completion__line[\s\S]*width:\s*min\(92vw,\s*1100px\)/);
});

test('hero keeps the raised composition and polished adaptive EXPLORE CTA', () => {
  const css = read('src/app/globals.css');
  const component = read('src/components/experience/Hero/HeroExploreButton.tsx');
  const block = css.match(/\.hero-explore\s*\{([^}]*)\}/s)?.[1] ?? '';

  assert.match(css, /\.hero-composition[\s\S]*translateY\(clamp\(-44px,\s*-4\.2vh,\s*-28px\)\)/);
  assert.match(block, /min-width:\s*152px/);
  assert.match(block, /min-height:\s*48px/);
  assert.match(block, /border-radius:\s*14px/);
  assert.match(block, /background:\s*rgba\(8,\s*10,\s*14,\s*\.78\)/);
  assert.match(block, /color:\s*#fff/);
  assert.match(block, /backdrop-filter:\s*blur\(12px\) saturate\(\.85\)/);
  assert.doesNotMatch(block, /mix-blend-mode/);
  assert.match(component, /hero-explore__icon/);
  assert.match(css, /\[data-hero-explore\][\s\S]*z-index:\s*7/);
  assert.match(css, /\.hero-reveal-canvas[\s\S]*mix-blend-mode:\s*difference/);
});
