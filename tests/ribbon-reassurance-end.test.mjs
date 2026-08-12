import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const feature = 'src/components/MainSite/PostExploreNarrative';
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('journey replaces particle reassurance with one-way controlled ShutterText', () => {
  const source = read(`${feature}/JourneyNarrative.tsx`);
  assert.match(source, /ShutterText/);
  assert.match(source, /reassuranceActive/);
  assert.match(source, /id === ['"]reassurance['"]/);
  assert.match(source, /data-reassurance-text/);
  assert.doesNotMatch(source, /ParticleReassurance/);
});

test('route builder measures reassurance and returns taper geometry from same journey', () => {
  const builder = read(`${feature}/buildJourneyPath.ts`);
  const primitives = read(`${feature}/ribbonPrimitives.ts`);
  assert.match(builder, /data-reassurance-text/);
  assert.match(builder, /taper:/);
  assert.match(builder, /polygonPoints/);
  assert.match(builder, /centerlineD/);
  assert.match(builder, /startLocalY/);
  assert.match(primitives, /appendReassuranceLoop/);
  assert.match(primitives, /buildTaperPolygon/);
});

test('back ribbon layer owns tapered end without opacity fade or a third SVG route', () => {
  const source = read(`${feature}/RibbonTrail.tsx`);
  assert.match(source, /taperRevealPathRef/);
  assert.match(source, /polygon/);
  assert.match(source, /taperRevealMask/);
  assert.match(source, /taper\.polygonPoints/);
  assert.match(source, /ribbonBackClip/);
  assert.doesNotMatch(source, /opacity.*taper|taper.*opacity/i);
  assert.equal((source.match(/<svg/g) ?? []).length, 2);
});

test('controller synchronizes taper reveal with reversible canonical visible length', () => {
  const source = read(`${feature}/ribbonController.ts`);
  assert.match(source, /taperStartLength/);
  assert.match(source, /taperTotalLength/);
  assert.match(source, /taperVisible/);
  assert.match(source, /taper\.revealPath/);
  assert.match(source, /strokeDashoffset/);
  assert.doesNotMatch(source, /taperComplete|hasTapered/);
});

test('obsolete particle reassurance files are removed after replacement', () => {
  assert.equal(existsSync(resolve(root, feature, 'ParticleReassurance.tsx')), false);
  assert.equal(existsSync(resolve(root, feature, 'particleModel.ts')), false);
});
