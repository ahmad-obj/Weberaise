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
    else if (/\.(?:ts|tsx|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

test('technical font is not used or registered', async () => {
  const files = await walk(path.resolve('src'));
  const usages = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    if (file.endsWith(path.join('src', 'app', 'layout.tsx'))) continue;
    if (source.includes('--font-technical') || source.includes('Geist_Mono')) usages.push(file);
  }
  assert.deepEqual(usages, []);

  const layout = await readFile(path.resolve('src/app/layout.tsx'), 'utf8');
  assert.doesNotMatch(layout, /Geist_Mono|geistMono|--font-technical/);
});
