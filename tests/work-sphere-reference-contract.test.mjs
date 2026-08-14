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

test('engine renders the fixed dense instance set with reference camera response', () => {
  const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
  assert.match(engine, /buildProjectSlots\(projects\.length, WORK_SPHERE\.radius\)/);
  assert.match(engine, /cameraTargetZ/);
  assert.match(engine, /stepCameraZ/);
  assert.match(engine, /drawElementsInstanced/);
  assert.match(engine, /this\.slots\.length/);
  assert.doesNotMatch(engine, /pickSlot|getSlotScreenBounds|setProjectOpening|onProjectActivate/);
});

test('rectangular website vertices are reprojected back onto the spherical radius', () => {
  const shaders = read('src/webgl/workSphere/shaders.ts');
  assert.match(shaders, /worldPosition\.xyz\s*=\s*radius\s*\*\s*normalize\(worldPosition\.xyz\)/);
  assert.match(shaders, /uRotationAxisVelocity/);
  assert.match(shaders, /smoothstep\(0\.5,\s*1\.0/);
  assert.match(shaders, /roundedRectSdf/);
});

test('16:10 website media is cropped into the 4:3 surface instead of stretched', () => {
  const shaders = read('src/webgl/workSphere/shaders.ts');
  assert.match(shaders, /fitWebsiteUv/);
  assert.match(shaders, /sourceAspect\s*=\s*1\.6/);
  assert.match(shaders, /targetAspect\s*=\s*4\.0\s*\/\s*3\.0/);
});

test('phase one pointer release cannot activate a project', () => {
  const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
  const canvas = read('src/components/WorkPage/WorkSphereCanvas.tsx');
  assert.doesNotMatch(engine, /onProjectActivate/);
  assert.doesNotMatch(canvas, /onProjectActivate/);
});
