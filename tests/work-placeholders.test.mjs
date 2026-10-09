import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Work data exposes the three supplied portfolio projects', () => {
  const source = read('src/content/workProjects.ts');
  for (const name of ['Sound Angels', 'PlayStation CD Collection', 'Porsche 911 GT3 R']) {
    assert.ok(source.includes(`name: '${name}'`));
  }
  assert.equal((source.match(/slug: '/g) ?? []).length, 3);
  assert.doesNotMatch(source, /placeholder: true/);
});

test('each supplied project uses a sphere preview and full showcase asset', () => {
  const source = read('src/content/workProjects.ts');
  assert.equal((source.match(/browsePreview: '[^']+\.mp4'/g) ?? []).length, 3);
  assert.equal((source.match(/showcasePoster: '[^']+showcase-poster\.webp'/g) ?? []).length, 3);
  assert.equal((source.match(/showcaseVideo: '[^']+\.mp4'/g) ?? []).length, 3);
});

test('sphere placeholders animate through procedural live textures instead of fake video requests', () => {
  const media = read('src/webgl/workSphere/mediaPool.ts');
  assert.match(media, /project\.placeholder/);
  assert.match(media, /renderPlaceholderFrame/);
  assert.match(media, /placeholderCanvas/);
});

test('procedural placeholder preview uploads are cadence capped', () => {
  const media = read('src/webgl/workSphere/mediaPool.ts');
  assert.match(media, /placeholderFrameIntervalMs/);
  assert.match(media, /1000\s*\/\s*24/);
});

test('reduced-motion placeholder previews hold after their first frame', () => {
  const media = read('src/webgl/workSphere/mediaPool.ts');
  assert.match(media, /!this\.allowPlayback\s*&&\s*live\.hasFrame/);
});
