import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const feature = 'src/components/MainSite/PostExploreNarrative';
const artworkRoot = 'public/artwork/journey';
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const layers = {
  Q1: [
    '01_island_platform.png',
    '02_storefront.png',
    '03_floating_nav_strip.png',
    '04_image_content_card.png',
    '05_cta_chip.png',
    '06_browser_content_card_large.png',
    '07_browser_content_card_small.png',
  ],
  Q2: [
    '01_browser_base_shell.png',
    '02_nav_header_strip.png',
    '03_image_media_block.png',
    '04_text_layout_fragments_cluster.png',
    '05_oversized_cta.png',
    '06_profile_card_a.png',
    '07_profile_card_b.png',
    '08_detached_search_input.png',
  ],
};

test('all separated artwork layers are preserved as source and display assets', () => {
  for (const [scene, names] of Object.entries(layers)) {
    for (const name of names) {
      assert.equal(existsSync(resolve(root, artworkRoot, 'source', scene, name)), true, `missing source ${scene}/${name}`);
      assert.equal(existsSync(resolve(root, artworkRoot, 'display', scene, name)), true, `missing display ${scene}/${name}`);
    }
  }
  assert.equal(existsSync(resolve(root, artworkRoot, 'ASSET_MANIFEST.json')), true);
  assert.equal(existsSync(resolve(root, artworkRoot, 'display', 'Q1', 'master_reference.png')), false);
  assert.equal(existsSync(resolve(root, artworkRoot, 'display', 'Q2', 'master_reference.png')), false);
  assert.equal(existsSync(resolve(root, artworkRoot, 'source', 'Q3')), false, 'Q3 source art must be removed from the journey bundle');
  assert.equal(existsSync(resolve(root, artworkRoot, 'display', 'Q3')), false, 'Q3 display art must be removed from the journey bundle');
});

test('JourneyArtwork dispatches only to the Q1 and Q2 layered scenes', () => {
  const source = read(`${feature}/JourneyArtwork.tsx`);
  for (const component of ['Q1ArtworkScene', 'Q2ArtworkScene']) {
    assert.match(source, new RegExp(component));
    assert.equal(existsSync(resolve(root, feature, 'artwork', `${component}.tsx`)), true, `${component}.tsx must exist`);
  }
  assert.doesNotMatch(source, /Q3ArtworkScene/);
  assert.equal(existsSync(resolve(root, feature, 'artwork', 'Q3ArtworkScene.tsx')), false, 'Q3 scene component must be removed');
  assert.equal(existsSync(resolve(root, feature, 'artwork', 'ArtworkLayer.tsx')), true);
});

test('each artwork scene exposes semantic layer and stable cluster targets', () => {
  const expectedLayers = {
    Q1ArtworkScene: ['island', 'storefront', 'nav', 'image-card', 'cta', 'browser-large', 'browser-small'],
    Q2ArtworkScene: ['browser-shell', 'nav', 'media', 'text-cluster', 'cta', 'profile-a', 'profile-b', 'search'],
  };

  for (const [component, names] of Object.entries(expectedLayers)) {
    const source = read(`${feature}/artwork/${component}.tsx`);
    assert.match(source, /data-artwork-scene=/);
    assert.match(source, /data-artwork-cluster/);
    for (const name of names) assert.match(source, new RegExp(`name=["']${name}["']`), `${component} missing ${name}`);
  }
});

test('Q1 and Q2 scenes declare their supplied master references', () => {
  assert.match(read(`${feature}/artwork/Q1ArtworkScene.tsx`), /data-artwork-reference=["']q1-master["']/);
  assert.match(read(`${feature}/artwork/Q2ArtworkScene.tsx`), /data-artwork-reference=["']q2-master["']/);
});

test('artwork placement is isolated from image reveal motion', () => {
  const layer = read(`${feature}/artwork/ArtworkLayer.tsx`);
  const css = read(`${feature}/PostExploreNarrative.module.css`);
  assert.match(layer, /<span[^>]+data-artwork-layer=\{name\}/s);
  assert.match(layer, /className=\{styles\.artworkImage\}/);
  assert.match(css, /\.artworkPlacement\s*\{/);
  assert.match(css, /\.artworkImage\s*\{/);
});

test('Q1 and Q2 use stronger beat-specific hierarchy with viewport-safe edge bias', () => {
  const narrative = read(`${feature}/JourneyNarrative.tsx`);
  const css = read(`${feature}/PostExploreNarrative.module.css`);
  assert.match(narrative, /styles\.journeyBeatQ1/);
  assert.match(narrative, /styles\.journeyBeatQ2/);
  assert.match(css, /\.journeyBeatQ1[\s\S]*font-size:\s*clamp\(52px,\s*6\.05vw,\s*106px\)/);
  assert.match(css, /\.journeyBeatQ1[\s\S]*translateX\(-5\.5%\)/);
  assert.match(css, /\.journeyBeatQ2[\s\S]*font-size:\s*clamp\(50px,\s*5\.9vw,\s*102px\)/);
  assert.match(css, /\.journeyBeatQ2[\s\S]*translateX\(-1%\)/);
  assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*\.journeyBeatQ2 \.journeyArtwork\s*\{\s*width:\s*min\(86vw,\s*540px\);\s*transform:\s*translateX\(0\);\s*\}/);
});

test('Q3 is an exact centered two-line typography event with measurable O glyphs', () => {
  const narrative = read(`${feature}/JourneyNarrative.tsx`);
  const shutter = read('src/components/ui/shutter-text.tsx');
  const builder = read(`${feature}/buildJourneyPath.ts`);
  assert.match(narrative, /data-q3-line="lead"/);
  assert.match(narrative, /data-q3-line="finish"/);
  assert.match(narrative, /data-ribbon-glyph="look-o-1"/);
  assert.match(narrative, /data-ribbon-glyph="look-o-2"/);
  assert.doesNotMatch(narrative, /<JourneyArtwork id="q3"/);
  assert.match(narrative, /lines=\{\[['"]DONT WORRY\.['"],\s*['"]WE GOT YOU['"]\]\}/);
  assert.match(shutter, /data-reassurance-line=\{lineIndex === 0 \? ['"]one['"] : ['"]two['"]\}/);
  assert.doesNotMatch(builder, /data-ribbon-artwork=["']q3["']/);
});

test('Q1 and Q2 artwork motion is driven once by journey reveal state with reduced-motion final states', () => {
  const css = read(`${feature}/PostExploreNarrative.module.css`);
  for (const scene of ['q1', 'q2']) {
    assert.match(css, new RegExp(`data-journey-stop=["']${scene}["'][^}]*data-revealed=["']true["']`));
  }
  assert.match(css, /\.q2Nav/);
  assert.match(css, /\.q2Search/);
  assert.match(css, /\.q2Cta/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /transition:\s*none\s*!important/);
  assert.match(css, /\.q1Scene \.artworkImage[\s\S]*transition-duration:\s*1\.3s/);
  assert.match(css, /\.q2Scene[^}]*\.artworkImage[\s\S]*transition-duration:\s*1\.15s/);
  for (const delay of ['0ms', '120ms', '240ms', '350ms', '460ms']) {
    assert.match(css, new RegExp(`transition-delay:\\s*${delay}`), `Q1 must include the ${delay} group`);
  }
  for (const delay of ['0ms', '140ms', '280ms', '420ms']) {
    assert.match(css, new RegExp(`transition-delay:\\s*${delay}`), `Q2 must include the ${delay} group`);
  }
});

test('journey stops expose early viewport reveal ratios', () => {
  const builder = read(`${feature}/buildJourneyPath.ts`);
  const controller = read(`${feature}/ribbonController.ts`);
  const css = read(`${feature}/PostExploreNarrative.module.css`);
  assert.match(builder, /revealViewportRatio:\s*0\.76/g);
  assert.match(builder, /revealViewportRatio:\s*0\.82/);
  assert.match(controller, /stop\.revealViewportRatio/);
  assert.match(css, /\.journeyLead\s*\{[^}]*height:\s*60svh/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)[\s\S]*\.journeyLead\s*\{\s*height:\s*52svh/);
});

test('front and back ribbon layers render synchronized base and highlight strokes', () => {
  const source = read(`${feature}/RibbonTrail.tsx`);
  assert.ok((source.match(/data-ribbon-stroke="base"/g) ?? []).length >= 2, 'base stroke must exist in both depth layers');
  assert.ok((source.match(/data-ribbon-stroke="highlight"/g) ?? []).length >= 2, 'highlight stroke must exist in both depth layers');
});
