import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('development Work data exposes six explicit placeholder projects', () => {
  const source = read('src/content/workProjects.ts');
  assert.match(source, /PLACEHOLDER 01/);
  assert.match(source, /PLACEHOLDER 06/);
  const names = source.match(/name: 'PLACEHOLDER \d\d'/g) ?? [];
  assert.equal(names.length, 6);
});

test('placeholder data points at generated poster, browse, and showcase media', () => {
  const source = read('src/content/workProjects.ts');
  assert.match(source, /\/work\/placeholders\/01\/poster\.svg/);
  assert.match(source, /\/work\/placeholders\/01\/browse\.mp4/);
  assert.match(source, /\/work\/placeholders\/showcase-poster\.svg/);
  assert.match(source, /\/work\/placeholders\/showcase\.mp4/);
});
