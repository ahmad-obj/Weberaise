import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(?:ts|tsx|js|mjs|css|json)$/.test(entry.name)) files.push(full);
  }
  return files;
}

test('runtime source uses journey display assets only', async () => {
  const files = await walk(path.resolve('src'));
  const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
  assert.doesNotMatch(source, /\/artwork\/journey\/source\//);
  assert.doesNotMatch(source, /ASSET_MANIFEST\.json/);
  assert.match(source, /\/artwork\/journey\/display\/Q1/);
  assert.match(source, /\/artwork\/journey\/display\/Q2/);
});
