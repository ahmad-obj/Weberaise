import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { shouldDrawWorkFrame } from '../src/webgl/workSphere/frameInvalidation.ts';

test('WorkSphere redraw invalidation preserves all visual-change causes', () => {
  assert.equal(shouldDrawWorkFrame({ transformChanged: false, mediaChanged: false, force: false }), false);
  assert.equal(shouldDrawWorkFrame({ transformChanged: true, mediaChanged: false, force: false }), true);
  assert.equal(shouldDrawWorkFrame({ transformChanged: false, mediaChanged: true, force: false }), true);
  assert.equal(shouldDrawWorkFrame({ transformChanged: false, mediaChanged: false, force: true }), true);
});

test('WorkSphere keeps RAF cadence and invalidates every visible-state path', async () => {
  const [engine, media, page] = await Promise.all([
    readFile(new URL('../src/webgl/workSphere/WorkSphereEngine.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/webgl/workSphere/mediaPool.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/WorkPage/WorkPage.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(engine, /const mediaChanged = this\.mediaPool\.uploadReadyFrames\(\);/);
  assert.match(engine, /shouldDrawWorkFrame\(\{ transformChanged, mediaChanged, force: this\.forceRender \}\)/);
  assert.match(engine, /this\.scheduleFrame\(\);\n\s*};/);
  assert.match(engine, /setEntranceProgress\(progress: number\)[\s\S]*?this\.forceRender = true;/);
  assert.match(engine, /getResolveStatus\(\)[\s\S]*?this\.freezeOrientation = true;\n\s*this\.forceRender = true;/);

  assert.match(media, /uploadReadyFrames\(\): boolean/);
  assert.match(media, /changed = true;/);
  assert.match(media, /return changed;/);

  assert.match(page, /<WorkOpening[\s\S]*?ready=\{!projects\.length \|\| sphereReady \|\| capabilityFailed\}/);
  assert.match(page, /state\.phase !== 'sphereEntering'[\s\S]*?sphere\.setEntranceProgress\(0\)/);
});
