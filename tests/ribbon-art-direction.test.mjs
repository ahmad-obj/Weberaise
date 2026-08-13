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
  for (const id of ['q1', 'q2']) {
    assert.match(source, new RegExp(`JourneyArtwork\\s+id=[\"']${id}[\"']`));
  }
  assert.doesNotMatch(source, /JourneyArtwork\s+id=["']q3["']/);
  assert.match(artwork, /data-ribbon-artwork=\{id\}/);
  assert.match(source, /data-ribbon-glyph="look-o-1"/);
  assert.match(source, /data-ribbon-glyph="look-o-2"/);
});

test('depth uses sibling back/front SVG layers from one canonical d', () => {
  const source = read(`${feature}/RibbonTrail.tsx`);
  assert.match(source, /ribbonSvgBack/);
  assert.match(source, /ribbonSvgFront/);
  assert.match(source, /backBasePathRef/);
  assert.match(source, /backHighlightPathRef/);
  assert.match(source, /frontBasePathRef/);
  assert.match(source, /frontHighlightPathRef/);
  assert.match(source, /linearGradient/);
  assert.match(source, /frontClipRects/);
  assert.doesNotMatch(source, /frontD|backD|secondaryD/);
});

test('Q1 depth clips are registered to the composed artwork planes', () => {
  const builder = read(`${feature}/buildJourneyPath.ts`);
  for (const layer of ['island', 'storefront', 'nav', 'image-card', 'cta', 'browser-small']) {
    assert.match(builder, new RegExp(`data-artwork-layer=["']${layer}["']`));
  }
  assert.match(builder, /q1UpperFrontClip/);
  assert.match(builder, /q1LowerFrontClip/);
  assert.match(builder, /frontClipRects\.push\(q1UpperFrontClip,\s*q1LowerFrontClip\)/);
});

test('ribbon uses the approved dimensional base and highlight treatment', () => {
  const css = read(`${feature}/PostExploreNarrative.module.css`);
  const source = read(`${feature}/RibbonTrail.tsx`);
  assert.match(css, /--ribbon-width:\s*5\.2px/);
  assert.match(css, /--ribbon-width:\s*3\.9px/);
  for (const [offset, color] of [
    ['0%', '#1D4ED8'],
    ['34%', '#3B82F6'],
    ['56%', '#93C5FD'],
    ['72%', '#60A5FA'],
    ['100%', '#2563EB'],
  ]) {
    assert.match(source, new RegExp(`offset=["']${offset}["']\\s+stopColor=["']${color}["']`, 'i'));
  }
  assert.match(source, /#DBEAFE/i);
  assert.match(css, /\.ribbonPathBase\s*\{[^}]*drop-shadow\(0 0 7px rgb\(59 130 246 \/ \.22\)\)/s);
  assert.match(css, /\.ribbonPathHighlight\s*\{[^}]*\.28[^}]*opacity:\s*\.62/s);
  assert.match(css, /@media\s*\(max-width:\s*720px\)[\s\S]*\.ribbonPathHighlight\s*\{[^}]*opacity:\s*\.52/s);
});

test('q1 q2 q3 remain normal-flow editorial beats', () => {
  const source = read(`${feature}/JourneyNarrative.tsx`);
  const css = read(`${feature}/PostExploreNarrative.module.css`);
  assert.match(source, /journeyBeatTextLeft/);
  assert.match(source, /journeyBeatTextRight/);
  assert.match(css, /\.journeyBeat\s*\{[^}]*display:\s*grid/s);
  assert.doesNotMatch(css, /\.journeyQuestion\s*\{[^}]*position:\s*absolute/s);
});
