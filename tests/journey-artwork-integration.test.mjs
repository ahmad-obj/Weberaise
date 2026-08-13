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
  Q3: [
    '01_character.png',
    '02_spotlight_beam.png',
    '03_spotlight_floor_pool.png',
    '04_character_ground_shadow.png',
    '05_main_website_card.png',
    '06_profile_search_card.png',
    '07_brand_media_tile.png',
    '08_secondary_blue_tile.png',
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
  assert.equal(existsSync(resolve(root, artworkRoot, 'display', 'Q3', 'master_reference.png')), false);
});

test('JourneyArtwork dispatches to focused layered scene components', () => {
  const source = read(`${feature}/JourneyArtwork.tsx`);
  for (const component of ['Q1ArtworkScene', 'Q2ArtworkScene', 'Q3ArtworkScene']) {
    assert.match(source, new RegExp(component));
    assert.equal(existsSync(resolve(root, feature, 'artwork', `${component}.tsx`)), true, `${component}.tsx must exist`);
  }
  assert.equal(existsSync(resolve(root, feature, 'artwork', 'ArtworkLayer.tsx')), true);
});

test('each artwork scene exposes semantic layer and stable cluster targets', () => {
  const expectedLayers = {
    Q1ArtworkScene: ['island', 'storefront', 'nav', 'image-card', 'cta', 'browser-large', 'browser-small'],
    Q2ArtworkScene: ['browser-shell', 'nav', 'media', 'text-cluster', 'cta', 'profile-a', 'profile-b', 'search'],
    Q3ArtworkScene: ['beam', 'floor-pool', 'shadow', 'character', 'website-card', 'profile-card', 'brand-tile', 'secondary-tile'],
  };

  for (const [component, names] of Object.entries(expectedLayers)) {
    const source = read(`${feature}/artwork/${component}.tsx`);
    assert.match(source, /data-artwork-scene=/);
    assert.match(source, /data-artwork-cluster/);
    for (const name of names) assert.match(source, new RegExp(`name=["']${name}["']`), `${component} missing ${name}`);
  }
});

test('artwork motion is driven once by journey reveal state with reduced-motion final states', () => {
  const css = read(`${feature}/PostExploreNarrative.module.css`);
  for (const scene of ['q1', 'q2', 'q3']) {
    assert.match(css, new RegExp(`data-journey-stop=["']${scene}["'][^}]*data-revealed=["']true["']`));
  }
  assert.match(css, /\.q2Nav/);
  assert.match(css, /\.q2Search/);
  assert.match(css, /\.q2Cta/);
  assert.match(css, /\.q3Character/);
  assert.match(css, /\.q3WebsiteCard/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /transition:\s*none\s*!important/);
});
