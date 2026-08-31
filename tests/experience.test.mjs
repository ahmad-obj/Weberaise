import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INITIAL_EXPERIENCE_STATE,
  experienceReducer,
} from '../src/experience/state/experienceReducer.ts';
import { createProgressController } from '../src/experience/loading/progressController.ts';
import { createCountdownPositions } from '../src/experience/loading/countdownPositions.ts';
import {
  interpolateSegment,
  retentionForHalfLife,
  oldestFirstWeight,
} from '../src/webgl/reveal/math.ts';

test('experience reducer follows the approved intro state order', () => {
  let state = INITIAL_EXPERIENCE_STATE;
  for (const event of [
    'START_LOADING',
    'CRITICAL_READY',
    'LOADER_COMPLETE',
    'HERO_OPENED',
    'EXPLORE',
    'EXPLORE_COMPLETE',
  ]) {
    state = experienceReducer(state, { type: event });
  }
  assert.equal(state, 'main');
});

test('experience reducer ignores invalid backward transitions', () => {
  assert.equal(experienceReducer('heroInteractive', { type: 'START_LOADING' }), 'heroInteractive');
  assert.equal(experienceReducer('main', { type: 'EXPLORE' }), 'main');
});

test('countdown catches up one integer at a time and never reaches zero early', () => {
  const progress = createProgressController();
  progress.updateRealProgress(0.42);
  assert.equal(progress.snapshot().target, 58);
  assert.equal(progress.nextDisplay(), 99);
  assert.equal(progress.nextDisplay(), 98);

  progress.updateRealProgress(0.999);
  let value = progress.snapshot().display;
  while (value > 1) value = progress.nextDisplay();
  assert.equal(value, 1);
  assert.equal(progress.nextDisplay(), 1);

  progress.updateRealProgress(1);
  assert.equal(progress.snapshot().target, 0);
  assert.equal(progress.nextDisplay(), 0);
});

test('countdown positions are deterministic and stay inside safe viewport bounds', () => {
  const viewport = { width: 1440, height: 900 };
  const glyph = { width: 150, height: 110 };
  const first = createCountdownPositions(4137, 100, viewport, glyph);
  const second = createCountdownPositions(4137, 100, viewport, glyph);
  assert.deepEqual(first, second);
  assert.equal(first.length, 100);

  for (const point of first) {
    assert.ok(point.x >= 36 + glyph.width / 2);
    assert.ok(point.x <= viewport.width - 36 - glyph.width / 2);
    assert.ok(point.y >= 36 + glyph.height / 2);
    assert.ok(point.y <= viewport.height - 36 - glyph.height / 2);
  }

  for (let i = 1; i < first.length; i++) {
    const distance = Math.hypot(first[i].x - first[i - 1].x, first[i].y - first[i - 1].y);
    assert.ok(distance >= 90, `positions ${i - 1}/${i} clustered at ${distance}px`);
  }
});

test('interpolateSegment fills fast pointer gaps without exceeding max spacing', () => {
  const points = interpolateSegment({ x: 0, y: 0 }, { x: 100, y: 0 }, 18);
  assert.deepEqual(points.at(-1), { x: 100, y: 0 });
  let previous = { x: 0, y: 0 };
  for (const point of points) {
    assert.ok(Math.hypot(point.x - previous.x, point.y - previous.y) <= 18.001);
    previous = point;
  }
});

test('retention uses real elapsed time so half-life is refresh-rate independent', () => {
  assert.ok(Math.abs(retentionForHalfLife(2, 2) - 0.5) < 1e-9);
  const sixtyFrames = retentionForHalfLife(1 / 60, 3) ** 60;
  const oneTwentyFrames = retentionForHalfLife(1 / 120, 3) ** 120;
  assert.ok(Math.abs(sixtyFrames - oneTwentyFrames) < 1e-9);
});

test('oldest-first weight remains strong early and heals to zero at lifetime', () => {
  assert.equal(oldestFirstWeight(0, 4), 1);
  assert.ok(oldestFirstWeight(2, 4) > 0.7);
  assert.ok(oldestFirstWeight(3.5, 4) < 0.25);
  assert.equal(oldestFirstWeight(4, 4), 0);
});

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function readProject(path) {
  const full = resolve(root, path);
  assert.ok(existsSync(full), `${path} must exist`);
  return readFileSync(full, 'utf8');
}

test('homepage content preserves every approved skeleton section without invented proof', () => {
  const source = readProject('src/content/homepage.ts');
  for (const id of [
    'first-impression',
    'work',
    'services',
    'audit',
    'about',
    'process',
    'proof',
    'engagement',
    'contact',
  ]) {
    assert.match(source, new RegExp(`id: ['\"]${id}['\"]`));
  }
  assert.doesNotMatch(source, /\b\d+\+\s*(clients|projects|websites)\b/i);
  assert.doesNotMatch(source, /testimonial:\s*['\"][^'\"]+['\"]/i);
});

test('app shell keeps the main site on the same route and provides a black First Impression foundation', () => {
  const shell = readProject('src/components/experience/ExperienceShell.tsx');
  const first = readProject('src/components/MainSite/FirstImpression.tsx');
  assert.match(shell, /experienceReducer/);
  assert.match(shell, /main-stage/);
  assert.doesNotMatch(shell, /router\.push|location\.href/);
  assert.match(first, /first-impression/);
  assert.match(first, /first-impression--black/);
});

test('critical asset registry reports weighted real progress and only becomes ready at 100%', async () => {
  const { createCriticalAssetRegistry } = await import('../src/experience/loading/criticalAssetRegistry.ts');
  let resolveFont;
  let resolveHero;
  const font = new Promise((resolve) => { resolveFont = resolve; });
  const hero = new Promise((resolve) => { resolveHero = resolve; });

  const registry = createCriticalAssetRegistry([
    { id: 'font', weight: 1, run: () => font },
    { id: 'hero', weight: 3, run: () => hero },
  ]);

  const started = registry.start();
  assert.equal(registry.snapshot().progress, 0);
  resolveFont();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(registry.snapshot().progress, 0.25);
  assert.equal(registry.snapshot().ready, false);
  resolveHero();
  await started;
  assert.equal(registry.snapshot().progress, 1);
  assert.equal(registry.snapshot().ready, true);
});

test('loader source contains the truthful countdown and masked completion choreography', () => {
  const loader = readProject('src/components/experience/Loader/Loader.tsx');
  const completion = readProject('src/components/experience/Loader/LoaderCompletion.tsx');
  const timeline = readProject('src/experience/motion/loaderTimeline.ts');
  assert.match(loader, /createProgressController/);
  assert.match(loader, /createCriticalAssetRegistry|registry/);
  assert.match(completion, /data-loader-zero/);
  assert.match(completion, /data-loader-tagline/);
  assert.match(timeline, /rotation:\s*90/);
  assert.match(timeline, /scaleX/);
});

test('hero uses one shared typography structure for perfectly registered front and reveal layers', () => {
  const front = readProject('src/components/experience/Hero/HeroFrontLayer.tsx');
  const reveal = readProject('src/components/experience/Hero/HeroRevealLayer.tsx');
  assert.match(front, /HeroTypography/);
  assert.match(reveal, /HeroTypography/);
  assert.match(reveal, /weberaise-horizontal-on-dark\.svg/);
});

test('hero opening reveals only the area traversed by twin lines instead of fading globally', () => {
  const hero = readProject('src/components/experience/Hero/Hero.tsx');
  const timeline = readProject('src/experience/motion/heroOpenTimeline.ts');
  assert.match(hero, /data-hero-curtain-left/);
  assert.match(hero, /data-hero-curtain-right/);
  assert.match(hero, /data-hero-line-left/);
  assert.match(hero, /data-hero-line-right/);
  assert.match(timeline, /xPercent:\s*-100/);
  assert.match(timeline, /xPercent:\s*100/);
  assert.doesNotMatch(timeline, /opacity:\s*0/);
});

test('pointer emitter interpolates a thick continuous trail with bounded velocity', async () => {
  const { createPointerSamples } = await import('../src/webgl/reveal/emitters/pointerEmitter.ts');
  const samples = createPointerSamples(
    { x: 0.1, y: 0.4, time: 0 },
    { x: 0.9, y: 0.4, time: 0.016 },
    { maxSpacing: 0.035, radius: 0.105, maxVelocity: 1.8 },
  );
  assert.ok(samples.length > 10);
  assert.deepEqual({ x: samples.at(-1).x, y: samples.at(-1).y }, { x: 0.9, y: 0.4 });
  assert.ok(samples.every((sample) => sample.radius === 0.105));
  assert.ok(samples.every((sample) => Math.hypot(sample.vx, sample.vy) <= 1.8001));
});

test('pointer tracker converts raw normalized movement into reusable reveal samples without React state', async () => {
  const { createPointerTracker } = await import('../src/webgl/reveal/pointerTracker.ts');
  const tracker = createPointerTracker({ maxSpacing: 0.04, radius: 0.11, maxVelocity: 2 });
  const first = tracker.push({ x: 0.2, y: 0.3, time: 0 });
  const next = tracker.push({ x: 0.8, y: 0.3, time: 0.02 });
  assert.equal(first.length, 1);
  assert.ok(next.length > 8);
  assert.equal(next.at(-1).x, 0.8);
  tracker.reset();
  assert.equal(tracker.push({ x: 0.5, y: 0.5, time: 1 }).length, 1);
});

test('autonomous stroke uses the same reveal sample shape and stays deliberately short', async () => {
  const { createAutonomousStroke } = await import('../src/webgl/reveal/emitters/autonomousEmitter.ts');
  const samples = createAutonomousStroke({
    start: { x: 0.43, y: 0.68 },
    control: { x: 0.51, y: 0.61 },
    end: { x: 0.58, y: 0.66 },
    radius: 0.085,
    duration: 0.62,
    count: 18,
  });
  assert.equal(samples.length, 18);
  assert.ok(samples.every((sample) => sample.radius === 0.085));
  assert.ok(Math.hypot(samples.at(-1).x - samples[0].x, samples.at(-1).y - samples[0].y) < 0.25);
});

test('hero autonomous reveal preset crosses the lower brand band instead of the WELCOME/TO copy', async () => {
  const { createHeroAutonomousStroke } = await import('../src/webgl/reveal/emitters/autonomousEmitter.ts');
  const samples = createHeroAutonomousStroke();
  const averageY = samples.reduce((sum, sample) => sum + sample.y, 0) / samples.length;
  assert.ok(averageY > 0.80 && averageY < 0.84);
  assert.ok(Math.max(...samples.map((sample) => sample.x)) - Math.min(...samples.map((sample) => sample.x)) < 0.06);
});

test('quality profiles preserve the fluid model while degrading intentionally', async () => {
  const { chooseRevealQuality } = await import('../src/webgl/reveal/quality.ts');
  const full = chooseRevealQuality({ width: 1440, height: 900, dpr: 2, reducedMotion: false, webgl2: true, deviceMemory: 8 });
  const lite = chooseRevealQuality({ width: 390, height: 844, dpr: 3, reducedMotion: false, webgl2: true, deviceMemory: 2 });
  const fallback = chooseRevealQuality({ width: 390, height: 844, dpr: 3, reducedMotion: false, webgl2: false, deviceMemory: 4 });
  assert.equal(full.mode, 'full');
  assert.equal(full.simResolution, 256);
  assert.equal(full.dyeResolution, 512);
  assert.equal(full.pressureIterations, 20);
  assert.equal(full.dprCap, 2);
  assert.equal(lite.mode, 'lite');
  assert.equal(lite.simResolution, 128);
  assert.equal(lite.dyeResolution, 256);
  assert.ok(lite.pressureIterations < full.pressureIterations);
  assert.equal(fallback.mode, 'fallback');
});

test('reveal engine owns persistent pressure-projected fluid state', () => {
  const engine = readProject('src/webgl/reveal/RevealEngine.ts');
  const shaders = readProject('src/webgl/reveal/shaders.ts');
  assert.match(engine, /velocity/);
  assert.match(engine, /dye/);
  assert.match(engine, /pressure/);
  assert.match(engine, /divergence/);
  assert.match(engine, /pressureIterations/);
  assert.match(engine, /pendingSplats/);
  assert.match(engine, /resetInputStream/);
  assert.doesNotMatch(engine, /LiquidPrimitive|liquidRadiusScale|drawArraysInstanced|primitives/);
  assert.match(shaders, /uDye/);
  assert.doesNotMatch(shaders, /FIELD_VERTEX|FIELD_FRAGMENT|uContourWarp/);
});

test('interactive hero mounts one reveal engine, runs autonomous stroke once, and avoids pointer-driven React state', () => {
  const canvas = readProject('src/components/experience/Hero/HeroRevealCanvas.tsx');
  const hero = readProject('src/components/experience/Hero/Hero.tsx');
  const cursor = readProject('src/components/experience/Hero/HeroCursor.tsx');
  assert.match(hero, /HeroRevealCanvas/);
  assert.match(canvas, /autonomousPlayed/);
  assert.match(canvas, /createHeroAutonomousStroke/);
  assert.match(canvas, /image\.decode/);
  assert.match(canvas, /createPointerTracker/);
  assert.match(canvas, /data-reveal-fallback/);
  assert.doesNotMatch(canvas, /setState\s*\(/);
  assert.match(cursor, /hero-cursor/);
});

test('bottom fill clamps progress and reports completion only at full coverage', async () => {
  const { bottomFillState } = await import('../src/webgl/reveal/emitters/bottomFillEmitter.ts');
  assert.deepEqual(bottomFillState(-0.2), { progress: 0, complete: false });
  assert.deepEqual(bottomFillState(0.54), { progress: 0.54, complete: false });
  assert.deepEqual(bottomFillState(1.2), { progress: 1, complete: true });
});

test('EXPLORE uses the shared reveal engine and unlocks scrolling only after the black fill completes', () => {
  const hero = readProject('src/components/experience/Hero/Hero.tsx');
  const shell = readProject('src/components/experience/ExperienceShell.tsx');
  const timeline = readProject('src/experience/motion/exploreTimeline.ts');
  assert.match(hero, /HeroExploreButton/);
  assert.match(hero, /runExploreTimeline/);
  assert.match(shell, /EXPLORE/);
  assert.match(shell, /EXPLORE_COMPLETE/);
  assert.match(shell, /state !== 'main'/);
  assert.match(timeline, /setMode\('bottomFill'\)/);
  assert.match(timeline, /setBottomFillProgress/);
  assert.match(timeline, /onComplete/);
});
