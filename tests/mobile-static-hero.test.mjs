import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const mobileHeroCssPath = new URL('../src/components/experience/Hero/HeroMobileStatic.module.css', import.meta.url);
const mobileNavCssPath = new URL('../src/components/navigation/NavigationMobile.module.css', import.meta.url);
const heroPath = new URL('../src/components/experience/Hero/Hero.tsx', import.meta.url);
const revealCanvasPath = new URL('../src/components/experience/Hero/HeroRevealCanvas.tsx', import.meta.url);

async function readOptional(url) {
  return readFile(url, 'utf8').catch(() => '');
}

test('mobile hero shows the existing black reveal layer directly with no interactive reveal surface', async () => {
  const [css, hero] = await Promise.all([
    readOptional(mobileHeroCssPath),
    readFile(heroPath, 'utf8'),
  ]);

  assert.match(hero, /HeroMobileStatic\.module\.css/);
  assert.match(hero, /mobileStyles\.mobileStaticHero/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /background:\s*var\(--wr-black\)/);
  assert.match(css, /color:\s*var\(--wr-white\)/);
  assert.match(css, /hero-layer--front[^}]*display:\s*none/s);
  assert.match(css, /hero-layer--reveal[^}]*clip-path:\s*none/s);
  assert.match(css, /hero-reveal-canvas[^}]*display:\s*none/s);
  assert.match(css, /hero-cursor[^}]*display:\s*none/s);
});

test('mobile hero navigation stays white against the static black background', async () => {
  const css = await readOptional(mobileNavCssPath);

  assert.match(css, /data-navigation-mode=['"]hero['"]/);
  assert.match(css, /--nav-pill-bg:\s*#fff/);
  assert.match(css, /--nav-pill-fg:\s*#000/);
});

test('phone loads skip reveal-engine initialization instead of merely hiding the canvas', async () => {
  const source = await readFile(revealCanvasPath, 'utf8');

  assert.match(source, /MOBILE_STATIC_HERO_QUERY\s*=\s*'\(max-width:\s*720px\)'/);
  assert.match(source, /window\.matchMedia\(MOBILE_STATIC_HERO_QUERY\)\.matches/);
  assert.ok(
    source.indexOf('window.matchMedia(MOBILE_STATIC_HERO_QUERY).matches') < source.indexOf('createRevealEngine(canvas'),
    'mobile guard must run before reveal-engine creation',
  );
});
