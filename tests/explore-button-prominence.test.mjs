import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const cssPath = new URL('../src/app/globals.css', import.meta.url);
const buttonPath = new URL('../src/components/experience/Hero/HeroExploreButton.tsx', import.meta.url);

function block(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 's'));
  assert.ok(match, `Missing CSS block: ${selector}`);
  return match[1];
}

test('EXPLORE has a strong but restrained resting control surface', async () => {
  const [css, button] = await Promise.all([
    readFile(cssPath, 'utf8'),
    readFile(buttonPath, 'utf8'),
  ]);

  const base = block(css, '.hero-explore');
  assert.match(base, /min-width:\s*152px/);
  assert.match(base, /min-height:\s*48px/);
  assert.match(base, /border-radius:\s*14px/);
  assert.match(base, /background:\s*rgba\(7,\s*9,\s*13,\s*\.84\)/);
  assert.match(base, /border:\s*1px solid rgba\(255,\s*255,\s*255,\s*\.36\)/);
  assert.match(base, /backdrop-filter:\s*blur\(12px\) saturate\(\.9\)/);
  assert.match(base, /0 12px 30px rgba\(0,\s*0,\s*0,\s*\.20\)/);
  assert.doesNotMatch(base, /mix-blend-mode/);

  const sheen = block(css, '.hero-explore::before');
  assert.match(sheen, /rgba\(255,255,255,\.09\)/);

  const hover = block(css, '.hero-explore:hover,\n.hero-explore:focus-visible');
  assert.match(hover, /translateY\(-2px\)/);
  assert.match(hover, /background:\s*rgba\(9,\s*11,\s*16,\s*\.92\)/);
  assert.match(hover, /border-color:\s*rgba\(255,255,255,\.52\)/);

  assert.match(css, /\.hero-explore:active\s*\{[^}]*scale\(\.985\)/s);
  assert.match(button, /hero-explore__icon/);
  assert.match(button, /<svg[^>]*viewBox="0 0 16 16"/);
});
