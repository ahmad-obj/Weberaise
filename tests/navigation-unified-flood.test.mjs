import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const navDir = 'src/components/navigation';

test('all navbar pills share one flood contract with guaranteed corner coverage', () => {
  const site = read(`${navDir}/SiteNavigation.tsx`);
  const center = read(`${navDir}/CenterNavCluster.tsx`);
  const talk = read(`${navDir}/GooeyTalkButton.tsx`);
  const motion = read(`${navDir}/centerHoverMotion.ts`);
  const css = read(`${navDir}/Navigation.module.css`);

  assert.match(site, /data-pill-flood/);
  assert.match(site, /data-pill-flood-surface/);
  assert.match(site, /data-pill-flood-base/);
  assert.match(site, /data-pill-flood-reveal/);
  assert.match(center, /data-pill-flood/);
  assert.match(talk, /data-pill-flood/);

  assert.match(site, /createCenterHoverMotion/);
  assert.match(site, /createCenterHoverMotion\(root, reducedMotion\)/);
  assert.doesNotMatch(center, /createCenterHoverMotion/);

  assert.match(motion, /querySelectorAll<HTMLElement>\('\[data-pill-flood\]'\)/);
  assert.match(motion, /Math\.hypot\(width \* 0\.5, height\)/);
  assert.match(motion, /FLOOD_OVERSCAN/);
  assert.match(motion, /0\.46/);
  assert.match(motion, /0\.36/);
  assert.match(motion, /tweenTo/);

  assert.match(css, /\.pillFloodSurface\s*\{[^}]*background:\s*var\(--nav-pill-fg\)/s);
  assert.match(css, /\.pillFloodReveal\s*\{[^}]*color:\s*var\(--nav-pill-bg\)/s);

  assert.doesNotMatch(talk, /GOOEY_PARTICLES|data-goo-particle|useState/);
  assert.doesNotMatch(css, /\.gooField|\.gooParticle|@keyframes\s+wrNavGooBurst/);
});
