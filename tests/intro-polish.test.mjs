import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('hero delegates residual motion to persistent fluid state', () => {
  const canvas = read('src/components/experience/Hero/HeroRevealCanvas.tsx');
  assert.match(canvas, /createPointerTracker/);
  assert.match(canvas, /engine\.emit\(samples\)/);
  assert.match(canvas, /engine\.resetInputStream\(\)/);
  assert.doesNotMatch(canvas, /createInertialAfterglide|afterglide|inertiaVelocity/);
});

test('hero waits for the actual fluid engine before installing interactive input', () => {
  const canvas = read('src/components/experience/Hero/HeroRevealCanvas.tsx');
  assert.match(canvas, /useState\(false\)/);
  assert.match(canvas, /setEngineReady\(true\)/);
  assert.match(canvas, /if \(!engineReady \|\| !root \|\| !engine/);
});

test('live input cancels the autonomous fluid stream before taking over displacement history', () => {
  const canvas = read('src/components/experience/Hero/HeroRevealCanvas.tsx');
  assert.match(canvas, /autonomousCancelled/);
  assert.match(canvas, /cancelAutonomousStroke/);
  assert.match(canvas, /takeOverFromAutonomous/);
  assert.match(canvas, /cancelAutonomousStroke\(\);\s*resetStream\(\);/s);
});

test('hero accepts touch pointer movement and resets stream boundaries between contacts', () => {
  const canvas = read('src/components/experience/Hero/HeroRevealCanvas.tsx');
  assert.doesNotMatch(canvas, /pointerType\s*===\s*['"]touch['"]\)\s*return/);
  assert.match(canvas, /addEventListener\('pointerdown',\s*begin/);
  assert.match(canvas, /addEventListener\('pointermove',\s*move/);
  assert.match(canvas, /addEventListener\('pointerup',\s*resetStream/);
  assert.match(canvas, /addEventListener\('pointercancel',\s*resetStream/);
  assert.match(canvas, /addEventListener\('pointerleave',\s*resetStream/);
  assert.match(canvas, /addEventListener\('pointerup',\s*leave/);
  assert.match(canvas, /addEventListener\('pointercancel',\s*leave/);
});

test('countdown cadence and transition duration become progressively slower without animation restarts', async () => {
  const timing = await import('../src/experience/loading/countdownTiming.ts');
  assert.equal(timing.FINAL_ZERO_HOLD_MS, 700);
  assert.equal(typeof timing.countdownTransitionMs, 'function');

  const values = [60, 30, 20, 10, 5, 4, 3, 2, 1];
  const delays = values.map((value) => timing.countdownDelay(value, 0, false));
  for (let index = 1; index < delays.length; index += 1) {
    assert.ok(delays[index] > delays[index - 1], `${values[index]} should be slower than ${values[index - 1]}`);
  }

  for (const value of [100, 60, 30, 10, 5, 1]) {
    const transition = timing.countdownTransitionMs(value, false);
    const delay = timing.countdownDelay(value, 0, false);
    assert.ok(transition >= 24);
    assert.ok(transition < delay, `${value} transition must finish before the next digit cadence`);
  }
});

test('loader keeps one physical zero across the phase handoff and GSAP exclusively owns tagline movement', () => {
  const loader = read('src/components/experience/Loader/Loader.tsx');
  const completion = read('src/components/experience/Loader/LoaderCompletion.tsx');
  const css = read('src/app/globals.css');
  const timeline = read('src/experience/motion/loaderTimeline.ts');

  assert.match(loader, /zeroRef/);
  assert.match(loader, /data-loader-zero/);
  assert.match(loader, /loader-persistent-zero-mask/);
  assert.match(loader, /<LoaderCompletion[^>]*zeroRef=\{zeroRef\}/s);
  assert.doesNotMatch(completion, /data-loader-zero/);
  assert.match(completion, /zeroRef/);
  assert.match(completion, /useLayoutEffect/);

  assert.match(completion, />Need a website for business\?<\/span>/);
  assert.match(css, /\.loader-persistent-zero\s*\{[^}]*left:\s*50%[^}]*top:\s*50vh[^}]*translate\(-50%,\s*-50%\)/s);
  assert.match(css, /\.loader-completion__tagline\s*\{[^}]*visibility:\s*hidden/s);
  assert.doesNotMatch(css, /\.loader-completion__tagline\s*\{[^}]*transform:\s*translateY\(130%\)/s);
  assert.match(timeline, /gsap\.set\(tagline,\s*\{[^}]*yPercent:\s*130[^}]*visibility:\s*'visible'/s);
  assert.match(timeline, /runLoaderCompletionTimeline\(\s*root:\s*HTMLElement,\s*zero:\s*HTMLElement/s);
});

test('persistent zero releases its countdown animation and is hidden after moving below the line', () => {
  const timeline = read('src/experience/motion/loaderTimeline.ts');

  assert.match(timeline, /gsap\.set\(zero,\s*\{[^}]*animation:\s*'none'[^}]*autoAlpha:\s*1/s);
  assert.match(timeline, /\.to\(zero,\s*\{\s*y:\s*zeroDrop,\s*duration:\s*0\.68\s*\}/s);
  assert.match(timeline, /\.set\(zero,\s*\{\s*autoAlpha:\s*0\s*\}/s);
});

test('loader line recenters before vertical expansion', () => {
  const css = read('src/app/globals.css');
  const timeline = read('src/experience/motion/loaderTimeline.ts');
  assert.match(css, /--loader-line-offset:\s*clamp\(48px,\s*5vw,\s*72px\)/);
  assert.match(css, /\.loader-completion__line\s*\{[^}]*width:\s*min\(92vw,\s*1100px\)/s);
  assert.match(timeline, /top:\s*'50%'/);
  assert.match(timeline, /window\.innerHeight \+ 24/);
});

test('EXPLORE is a real black front label underneath the reveal compositor', () => {
  const css = read('src/app/globals.css');
  assert.match(css, /\.hero-reveal-canvas\s*\{[^}]*z-index:\s*5/s);
  assert.match(css, /\.hero-explore\s*\{[^}]*color:\s*#000[^}]*mix-blend-mode:\s*normal/s);
  assert.match(css, /\[data-hero-explore\]\s*\{[^}]*z-index:\s*4/s);
});

test('digit changes use a stationary soft crossfade instead of vertical jump motion', () => {
  const countdown = read('src/components/experience/Loader/LoaderCountdown.tsx');
  const css = read('src/app/globals.css');
  assert.match(countdown, /--loader-digit-transition/);
  assert.match(css, /animation:\s*loader-number-in\s*var\(--loader-digit-transition\)/);
  assert.match(css, /animation:\s*loader-number-out\s*var\(--loader-digit-transition\)/);
  assert.match(css, /filter:\s*blur\(/);
  assert.doesNotMatch(css, /calc\(-50% \+ 5px\)|calc\(-50% - 5px\)/);
});
