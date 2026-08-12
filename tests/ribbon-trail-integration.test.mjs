import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('ribbon auto-draw waits until the experience reaches main', () => {
  const component = read('src/components/MainSite/PostExploreNarrative/TrailNarrative.tsx');
  assert.match(component, /data-experience-state/);
  assert.match(component, /MutationObserver/);
  assert.match(component, /experienceState\s*===\s*'main'/);
});
