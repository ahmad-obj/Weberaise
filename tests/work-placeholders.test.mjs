import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('development Work data exposes six explicit placeholder projects', () => {
  const source = read('src/content/workProjects.ts');
  assert.match(source, /placeholder\?: boolean/);
  assert.match(source, /name: 'PLACEHOLDER 01'/);
  assert.match(source, /name: 'PLACEHOLDER 06'/);
  const names = source.match(/name: 'PLACEHOLDER \d\d'/g) ?? [];
  assert.equal(names.length, 6);
  const flags = source.match(/placeholder: true/g) ?? [];
  assert.equal(flags.length, 6);
});

test('placeholder data uses the explicit procedural media sentinel', () => {
  const source = read('src/content/workProjects.ts');
  assert.match(source, /placeholder:\/\/procedural-preview/);
  assert.match(source, /placeholder:\/\/procedural-showcase/);
});

test('sphere placeholders animate through procedural live textures instead of fake video requests', () => {
  const media = read('src/webgl/workSphere/mediaPool.ts');
  assert.match(media, /project\.placeholder/);
  assert.match(media, /renderPlaceholderFrame/);
  assert.match(media, /placeholderCanvas/);
});

test('expanded placeholder exposes an explicit play pause showcase simulation', () => {
  const showcase = read('src/components/WorkPage/ProjectShowcase.tsx');
  assert.match(showcase, /project\.placeholder/);
  assert.match(showcase, /placeholderShowcase/);
  assert.match(showcase, /Play full placeholder showcase/);
});
