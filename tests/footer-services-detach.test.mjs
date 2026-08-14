import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  clampServicesDetachProgress,
  servicesDetachPoint,
  servicesDetachScale,
} from '../src/components/MainSite/PostExploreNarrative/servicesDetachMotion.ts';

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

test('closing footer provides the approved sticky stage, headline, metadata and services dock', () => {
  const footer = read('src/components/MainSite/PostExploreNarrative/ClosingFooter.tsx');
  const narrative = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx');
  const css = read('src/components/MainSite/PostExploreNarrative/ClosingFooter.module.css');

  assert.match(footer, /data-closing-footer/);
  assert.match(footer, /data-closing-footer-stage/);
  assert.match(footer, /data-services-footer-dock/);
  assert.match(footer, /WHAT CAN WE/);
  assert.match(footer, /BUILD FOR YOU\?/);
  assert.match(footer, /WEBERAISE/);
  assert.match(footer, /© 2026/);
  assert.match(narrative, /<ClosingFooter \/>/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /height:\s*100svh/);
});

test('services detach path is deterministic, endpoint exact, and reversible by progress', () => {
  assert.equal(clampServicesDetachProgress(-1), 0);
  assert.equal(clampServicesDetachProgress(2), 1);

  const start = servicesDetachPoint(0, 180, 620);
  const end = servicesDetachPoint(1, 180, 620);
  const middleA = servicesDetachPoint(0.42, 180, 620);
  const middleB = servicesDetachPoint(0.42, 180, 620);

  assert.deepEqual(start, { x: 0, y: 0 });
  assert.ok(Math.abs(end.x - 180) < 0.001);
  assert.ok(Math.abs(end.y - 620) < 0.001);
  assert.deepEqual(middleA, middleB);
  assert.ok(middleA.y > 0 && middleA.y < 620);
});

test('services scales from navbar size to exactly 2x at the centered footer dock', () => {
  assert.equal(servicesDetachScale(0), 1);
  assert.equal(servicesDetachScale(0.5), 1.5);
  assert.equal(servicesDetachScale(1), 2);
});

test('detach controller waits for the main navbar when footer mounts before navigation', () => {
  const motion = read('src/components/MainSite/PostExploreNarrative/servicesDetachMotion.ts');

  assert.match(motion, /MutationObserver/);
  assert.match(motion, /tryConnect/);
  assert.doesNotMatch(
    motion,
    /if \(!origin \|\| !shell \|\| !footer \|\| !stage \|\| !dock\) return \(\) => undefined/,
  );
});

test('detach controller caches geometry and keeps scroll frames free of layout reads and React state', () => {
  const motion = read('src/components/MainSite/PostExploreNarrative/servicesDetachMotion.ts');

  assert.match(motion, /requestAnimationFrame/);
  assert.match(motion, /ResizeObserver/);
  assert.match(motion, /document\.fonts/);
  assert.match(motion, /translate3d/);
  assert.match(motion, /addEventListener\('scroll',[\s\S]*passive:\s*true/);
  assert.doesNotMatch(motion, /elementsFromPoint/);
  assert.doesNotMatch(motion, /setState|useState/);

  const updateStart = motion.indexOf('const updateFromScroll');
  const updateEnd = motion.indexOf('const scheduleScroll', updateStart);
  const scrollBlock = motion.slice(updateStart, updateEnd);
  assert.doesNotMatch(scrollBlock, /getBoundingClientRect|querySelector|querySelectorAll/);
});

test('hero navigation distinguishes page routes from in-page hash targets after Explore exit', () => {
  const hero = read('src/components/experience/Hero/Hero.tsx');

  assert.match(hero, /target\.startsWith\('#'\)/);
  assert.match(hero, /window\.location\.assign\(target\)/);
  assert.match(hero, /scrollIntoView/);
});

test('closing footer remains responsive, reduced-motion aware and does not restore placeholder sections', () => {
  const css = read('src/components/MainSite/PostExploreNarrative/ClosingFooter.module.css');
  const motion = read('src/components/MainSite/PostExploreNarrative/servicesDetachMotion.ts');
  const main = read('src/components/MainSite/MainSite.tsx');

  assert.match(css, /@media\s*\(max-width:/);
  assert.match(css, /clamp\(/);
  assert.match(motion, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(main, /id="(?:work|services|audit|about|process|proof|engagement|contact)"/);
});
