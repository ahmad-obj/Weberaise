import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

test('loader wakes the countdown when real critical progress changes', () => {
  const loader = readFileSync(
    resolve(root, 'src/components/experience/Loader/Loader.tsx'),
    'utf8',
  );

  assert.match(loader, /setCriticalProgress\(snapshot\.progress\)/);
  assert.match(loader, /\[display, criticalProgress,/);
});
