import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('sphere uses the reference radius density and entrance constants', () => {
  const constants = read('src/webgl/workSphere/constants.ts');
  assert.match(constants, /radius:\s*2/);
  assert.match(constants, /baseSurfaceScale:\s*0\.34/);
  assert.match(constants, /depthScaleIntensity:\s*0\.6/);
  assert.match(constants, /cameraRestZ:\s*3/);
  assert.match(constants, /entranceStartScale:\s*5/);
});

test('engine preserves the fixed dense instance set and reference camera response', () => {
  const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
  assert.match(engine, /buildProjectSlots\(projects\.length, WORK_SPHERE\.radius\)/);
  assert.match(engine, /cameraTargetZ/);
  assert.match(engine, /stepCameraZ/);
  assert.match(engine, /drawElementsInstanced/);
  assert.match(engine, /this\.slots\.length/);
  assert.doesNotMatch(engine, /readPixels|toDataURL|getImageData/);
});

test('website surfaces stay curved on the sphere without velocity wiggle deformation', () => {
  const shaders = read('src/webgl/workSphere/shaders.ts');
  const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
  const quality = read('src/webgl/workSphere/quality.ts');
  const types = read('src/webgl/workSphere/types.ts');

  assert.match(shaders, /worldPosition\.xyz\s*=\s*radius\s*\*\s*normalize\(worldPosition\.xyz\)/);
  assert.match(shaders, /smoothstep\(0\.5,\s*1\.0/);
  assert.match(shaders, /roundedRectSdf/);

  for (const source of [shaders, engine, quality, types]) {
    assert.doesNotMatch(source, /uRotationAxisVelocity|uDeformation|stretchDir|deformation:/);
  }
});

test('16:10 website media is cropped into the 4:3 surface instead of stretched', () => {
  const shaders = read('src/webgl/workSphere/shaders.ts');
  assert.match(shaders, /fitWebsiteUv/);
  assert.match(shaders, /sourceAspect\s*=\s*1\.6/);
  assert.match(shaders, /targetAspect\s*=\s*4\.0\s*\/\s*3\.0/);
});

test('Phase 2 activation remains one-shot and separate from the frame loop', () => {
  const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
  const canvas = read('src/components/WorkPage/WorkSphereCanvas.tsx');
  assert.match(engine, /onProjectActivate/);
  assert.match(canvas, /onProjectActivate/);
  const frameMatch = engine.match(/private frame[\s\S]*?private updateView/);
  assert.ok(frameMatch);
  assert.doesNotMatch(frameMatch[0], /hitTestProjectedSlots/);
});
