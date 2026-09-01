import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const shellPath = new URL('../src/components/experience/ExperienceShell.tsx', import.meta.url);
const loaderPath = new URL('../src/components/experience/Loader/Loader.tsx', import.meta.url);

test('Hero is split from ExperienceShell and prewarmed by Loader', async () => {
  const [shell, loader] = await Promise.all([
    readFile(shellPath, 'utf8'),
    readFile(loaderPath, 'utf8'),
  ]);

  assert.match(shell, /import dynamic from ['"]next\/dynamic['"]/);
  assert.doesNotMatch(
    shell,
    /import\s+\{\s*Hero\s*\}\s+from\s+['"]@\/components\/experience\/Hero\/Hero['"]/,
  );
  assert.match(shell, /import\(['"]@\/components\/experience\/Hero\/Hero['"]\)/);
  assert.match(loader, /import\(['"]@\/components\/experience\/Hero\/Hero['"]\)/);
  assert.match(loader, /import\(['"]@\/webgl\/reveal\/createRevealEngine['"]\)/);
  assert.match(loader, /warmRevealEngine\(\)/);
});
