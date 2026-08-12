import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const navDir = 'src/components/navigation';

test('floating navigation has three independent zones and canonical order', () => {
  for (const file of ['SiteNavigation.tsx', 'Navigation.module.css', 'navigationModel.ts']) {
    assert.equal(existsSync(resolve(root, navDir, file)), true, `${file} must exist`);
  }

  const model = read(`${navDir}/navigationModel.ts`);
  const labels = ['SERVICES', 'WORK', 'ABOUT'];
  let previous = -1;
  for (const label of labels) {
    const index = model.indexOf(label);
    assert.ok(index > previous, `${label} must follow the previous center item`);
    previous = index;
  }

  const component = read(`${navDir}/SiteNavigation.tsx`);
  assert.match(component, /data-nav-zone="logo"/);
  assert.match(component, /data-nav-zone="center"/);
  assert.match(component, /data-nav-zone="talk"/);
  assert.match(component, /LET(?:'|&apos;)S TALK/);
});

test('navigation root is visually barless and pills remain independent', () => {
  const css = read(`${navDir}/Navigation.module.css`);
  assert.match(css, /\.navRoot\s*\{[^}]*background:\s*transparent/s);
  assert.match(css, /\.pill\s*\{/);
  assert.match(css, /border-radius:\s*1[4-8]px/);
  assert.doesNotMatch(css, /\.centerCluster\s*\{[^}]*background:/s);
});
