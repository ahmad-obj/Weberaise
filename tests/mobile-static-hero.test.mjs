import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const globalsPath = new URL('../src/app/globals.css', import.meta.url);
const navCssPath = new URL('../src/components/navigation/Navigation.module.css', import.meta.url);
const revealCanvasPath = new URL('../src/components/experience/Hero/HeroRevealCanvas.tsx', import.meta.url);

function mediaBlock(source, query) {
  const start = source.indexOf(`@media ${query}`);
  assert.notEqual(start, -1, `Missing media query: ${query}`);
  const next = source.indexOf('@media ', start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

test('mobile hero shows the existing black reveal layer directly with no interactive reveal surface', async () => {
  const css = await readFile(globalsPath, 'utf8');
  const mobile = mediaBlock(css, '(max-width: 720px)');

  assert.match(mobile, /\.hero-experience\s*\{[^}]*background:\s*var\(--wr-black\)[^}]*color:\s*var\(--wr-white\)/s);
  assert.match(mobile, /\.hero-layer--front\s*\{[^}]*display:\s*none/s);
  assert.match(mobile, /\.hero-layer--reveal\s*\{[^}]*clip-path:\s*none/s);
  assert.match(mobile, /\.hero-reveal-canvas,\s*\n\s*\.hero-cursor\s*\{[^}]*display:\s*none/s);
});

test('mobile hero navigation stays white against the static black background', async () => {
  const css = await readFile(navCssPath, 'utf8');
  const mobile = mediaBlock(css, '(max-width: 720px)');

  assert.match(mobile, /\.navRoot\[data-navigation-mode='hero'\]\s*\{[^}]*--nav-pill-bg:\s*#fff[^}]*--nav-pill-fg:\s*#000/s);
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
