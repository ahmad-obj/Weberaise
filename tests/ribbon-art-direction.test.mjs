import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const feature = 'src/components/MainSite/PostExploreNarrative';
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('art-directed journey owns artwork and primitive modules', () => {
  assert.equal(existsSync(resolve(root, feature, 'JourneyArtwork.tsx')), true);
  assert.equal(existsSync(resolve(root, feature, 'ribbonPrimitives.ts')), true);
});

test('journey exposes all artwork and actual look glyph targets', () => {
  const source = read(`${feature}/JourneyNarrative.tsx`);
  const artwork = read(`${feature}/JourneyArtwork.tsx`);
  for (const id of ['q1', 'q2', 'q3']) {
    assert.match(source, new RegExp(`JourneyArtwork\\s+id=[\"']${id}[\"']`));
  }
  assert.match(artwork, /data-ribbon-artwork=\{id\}/);
  assert.match(source, /data-ribbon-glyph="look-o-1"/);
  assert.match(source, /data-ribbon-glyph="look-o-2"/);
});

test('depth uses sibling back/front SVG layers from one canonical d', () => {
  const source = read(`${feature}/RibbonTrail.tsx`);
  assert.match(source, /ribbonSvgBack/);
  assert.match(source, /ribbonSvgFront/);
  assert.match(source, /backPathRef/);
  assert.match(source, /frontPathRef/);
  assert.match(source, /linearGradient/);
  assert.match(source, /frontClipRects/);
  assert.doesNotMatch(source, /frontD|backD|secondaryD/);
});

test('ribbon styling is stronger gradient blue rather than a flat stroke', () => {
  const css = read(`${feature}/PostExploreNarrative.module.css`);
  const source = read(`${feature}/RibbonTrail.tsx`);
  assert.match(css, /--ribbon-width:\s*5\.2px/);
  assert.match(css, /--ribbon-width:\s*3\.9px/);
  for (const color of ['#2563EB', '#3B82F6', '#60A5FA']) assert.match(source, new RegExp(color, 'i'));
});

test('q1 q2 q3 remain normal-flow editorial beats', () => {
  const source = read(`${feature}/JourneyNarrative.tsx`);
  const css = read(`${feature}/PostExploreNarrative.module.css`);
  assert.match(source, /journeyBeatTextLeft/);
  assert.match(source, /journeyBeatTextRight/);
  assert.match(css, /\.journeyBeat\s*\{[^}]*display:\s*grid/s);
  assert.doesNotMatch(css, /\.journeyQuestion\s*\{[^}]*position:\s*absolute/s);
});
