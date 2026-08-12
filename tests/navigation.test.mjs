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

test('hero navigation is rendered before the reveal canvas and survives EXPLORE exit', () => {
  const hero = read('src/components/experience/Hero/Hero.tsx');

  assert.match(hero, /SiteNavigation/);
  assert.ok(
    hero.indexOf('<SiteNavigation') < hero.indexOf('<HeroRevealCanvas'),
    'hero nav must render below the difference compositor',
  );
  assert.match(hero, /heroInteractive/);
  assert.match(hero, /heroExiting/);

  const component = read(`${navDir}/SiteNavigation.tsx`);
  assert.match(component, /mode !== 'hero'/);
  assert.match(component, /gsap\.fromTo/);
});

test('center navigation uses one measured inverse hover plate across separate pills', () => {
  const component = read(`${navDir}/CenterNavCluster.tsx`);
  const motion = read(`${navDir}/centerHoverMotion.ts`);

  assert.match(component, /data-center-nav-cluster/);
  assert.match(component, /data-center-hover-plate/);
  assert.match(component, /data-nav-item=\{item\.key\}/);
  assert.match(read(`${navDir}/navigationModel.ts`), /key: 'services'/);
  assert.match(motion, /getBoundingClientRect\(\)/);
  assert.match(motion, /ResizeObserver/);
  assert.match(motion, /gsap\.to/);
});

test('services stays detach-ready and the center cluster does not clip item slots', () => {
  const css = read(`${navDir}/Navigation.module.css`);

  assert.doesNotMatch(css, /\.centerCluster\s*\{[^}]*overflow:\s*(hidden|clip)/s);
  assert.doesNotMatch(css, /\.navItemSlot\s*\{[^}]*transform:/s);
  assert.doesNotMatch(css, /\.navItemSlot\s*\{[^}]*filter:/s);
});
