import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { chooseRevealQuality } from '../src/webgl/reveal/quality.ts';
import {
  referenceFrameScale,
  retentionFromReferenceFrame,
} from '../src/webgl/reveal/math.ts';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('full profile starts from confirmed Nothin production values', () => {
  const full = chooseRevealQuality({
    width: 1440,
    height: 900,
    dpr: 2,
    reducedMotion: false,
    webgl2: true,
    deviceMemory: 8,
  });

  assert.equal(full.mode, 'full');
  assert.equal(full.simResolution, 256);
  assert.equal(full.dyeResolution, 512);
  assert.equal(full.pressureIterations, 20);
  assert.equal(full.velocityRetention60, 0.962);
  assert.equal(full.dyeRetention60, 0.988);
  assert.equal(full.splatRadius, 0.00006);
  assert.equal(full.splatForce, 5900);
  assert.equal(full.revealGain, 3.9);
  assert.equal(full.edgeSoftness, 0.5);
  assert.equal(full.edgeWidth, 0.01);
  assert.equal(full.enableVelocity, true);
});

test('reference-frame retention matches 60 Hz and is refresh-rate independent', () => {
  assert.ok(Math.abs(referenceFrameScale(1 / 60) - 1) < 1e-9);
  assert.ok(Math.abs(referenceFrameScale(1 / 120) - 0.5) < 1e-9);

  const at60 = retentionFromReferenceFrame(0.988, 1 / 60);
  const twoAt120 = retentionFromReferenceFrame(0.988, 1 / 120) ** 2;
  assert.ok(Math.abs(at60 - 0.988) < 1e-9);
  assert.ok(Math.abs(at60 - twoAt120) < 1e-9);
});

test('lite and reduced profiles preserve mask semantics at lower cost', () => {
  const lite = chooseRevealQuality({
    width: 390,
    height: 844,
    dpr: 3,
    reducedMotion: false,
    webgl2: true,
    deviceMemory: 2,
  });
  const reduced = chooseRevealQuality({
    width: 1440,
    height: 900,
    dpr: 2,
    reducedMotion: true,
    webgl2: true,
    deviceMemory: 8,
  });

  assert.equal(lite.mode, 'lite');
  assert.equal(lite.simResolution, 128);
  assert.equal(lite.dyeResolution, 256);
  assert.equal(lite.pressureIterations, 10);
  assert.equal(lite.edgeSoftness, 0.5);
  assert.equal(lite.edgeWidth, 0.01);

  assert.equal(reduced.mode, 'reduced');
  assert.equal(reduced.enableVelocity, false);
  assert.equal(reduced.pressureIterations, 0);
  assert.equal(reduced.edgeSoftness, 0.5);
  assert.equal(reduced.edgeWidth, 0.01);
});

test('fluid targets use renderable half-float ping-pong textures', () => {
  const source = read('src/webgl/reveal/fluid/renderTargets.ts');
  assert.match(source, /RGBA16F/);
  assert.match(source, /HALF_FLOAT/);
  assert.match(source, /framebufferTexture2D/);
  assert.match(source, /FRAMEBUFFER_COMPLETE/);
  assert.match(source, /swap\(\)/);
});

test('fluid shader suite contains splat, advection and pressure projection passes', () => {
  const source = read('src/webgl/reveal/fluid/shaders.ts');
  assert.match(source, /SPLAT_FRAGMENT/);
  assert.match(source, /ADVECTION_FRAGMENT/);
  assert.match(source, /DIVERGENCE_FRAGMENT/);
  assert.match(source, /PRESSURE_FRAGMENT/);
  assert.match(source, /GRADIENT_SUBTRACT_FRAGMENT/);
  assert.match(source, /exp\(-dot\(/);
  assert.doesNotMatch(source, /fbm|simplex|hash\s*\(|vorticity|uCurlStrength/i);
});

test('reveal engine owns persistent pressure-projected fluid state', () => {
  const engine = read('src/webgl/reveal/RevealEngine.ts');
  const shaders = read('src/webgl/reveal/shaders.ts');
  assert.match(engine, /velocity/);
  assert.match(engine, /dye/);
  assert.match(engine, /pressure/);
  assert.match(engine, /divergence/);
  assert.match(engine, /pressureIterations/);
  assert.match(engine, /pendingSplats/);
  assert.match(engine, /resetInputStream/);
  assert.match(engine, /EXT_color_buffer_float/);
  assert.doesNotMatch(engine, /LiquidPrimitive|liquidRadiusScale|drawArraysInstanced|primitives/);
  assert.match(shaders, /uDye/);
  assert.doesNotMatch(shaders, /FIELD_VERTEX|FIELD_FRAGMENT|uContourWarp/);
});
