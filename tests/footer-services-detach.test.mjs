import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('services keeps its detach anchor and gains one detachable shell without losing flood hover', () => {
  const center = read('src/components/navigation/CenterNavCluster.tsx');

  assert.match(center, /data-nav-detach-anchor=\{item\.key === 'services'/);
  assert.match(center, /data-services-detachable/);
  assert.match(center, /item\.key === 'services'/);
  assert.match(center, /data-pill-flood/);
});

test('services canonical destination is the services page', () => {
  const model = read('src/components/navigation/navigationModel.ts');
  assert.match(model, /key: 'services'[\s\S]*href: '\/services'/);
  assert.doesNotMatch(model, /key: 'services'[\s\S]*href: '#services'/);
});
