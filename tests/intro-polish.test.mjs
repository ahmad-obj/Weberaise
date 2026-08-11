import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('pointer reveal uses the tighter approved radius and keeps inertia subtle', async () => {
  const canvas = read('src/components/experience/Hero/HeroRevealCanvas.tsx');
  assert.match(canvas, /root\.clientWidth < 720 \? 0\.10 : 0\.078/);

  const { createInertialAfterglide } = await import('../src/webgl/reveal/inertia.ts');
  assert.equal(createInertialAfterglide({ x: 0.5, y: 0.5, vx: 0.05, vy: 0, radius: 0.078 }).length, 0);

  const emissions = createInertialAfterglide({ x: 0.5, y: 0.5, vx: 1.8, vy: 0, radius: 0.078 });
  assert.ok(emissions.length >= 4 && emissions.length <= 7);
  assert.ok(emissions.at(-1).delayMs <= 380);
  assert.ok(emissions.every((entry) => entry.sample.x >= 0.5));
  assert.ok(Math.max(...emissions.map((entry) => entry.sample.x - 0.5)) <= 0.04);
  assert.ok(emissions[0].sample.radius > emissions.at(-1).sample.radius);
  assert.ok(emissions[0].sample.strength > emissions.at(-1).sample.strength);
});

test('countdown cadence and transition duration become progressively more deliberate near zero', async () => {
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
    assert.ok(transition >= 70);
    assert.ok(transition <= Math.max(90, delay * 1.35));
  }
});

test('loader zero handoff is registered and tagline line covers the approved copy', () => {
  const countdown = read('src/components/experience/Loader/LoaderCountdown.tsx');
  const completion = read('src/components/experience/Loader/LoaderCompletion.tsx');
  const css = read('src/app/globals.css');

  assert.match(countdown, /loader-zero-glyph/);
  assert.match(completion, /loader-zero-glyph/);
  assert.match(completion, />Need a website for business\?<\/span>/);
  assert.match(css, /\.loader-completion__zero\s*\{[^}]*left:\s*50%[^}]*top:\s*50vh[^}]*translate\(-50%,\s*-50%\)/s);
  assert.match(css, /\.loader-completion__line\s*\{[^}]*width:\s*min\(92vw,\s*1100px\)/s);
});

test('hero is nudged slightly higher and EXPLORE self-inverts over the reveal', () => {
  const css = read('src/app/globals.css');
  assert.match(css, /\.hero-composition\s*\{[^}]*translateY\(clamp\(-44px,\s*-4\.2vh,\s*-28px\)\)/s);
  assert.match(css, /\.hero-explore\s*\{[^}]*color:\s*#fff[^}]*mix-blend-mode:\s*difference/s);
});

test('digit animation duration is driven by the current countdown cadence', () => {
  const countdown = read('src/components/experience/Loader/LoaderCountdown.tsx');
  const css = read('src/app/globals.css');
  assert.match(countdown, /--loader-digit-transition/);
  assert.match(css, /animation:\s*loader-number-in\s*var\(--loader-digit-transition\)/);
  assert.match(css, /animation:\s*loader-number-out\s*var\(--loader-digit-transition\)/);
});
