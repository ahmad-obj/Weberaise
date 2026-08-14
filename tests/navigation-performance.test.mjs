import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

function cssBlock(css, className) {
  const match = css.match(new RegExp(`\\.${className}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'));
  assert.ok(match, `Expected .${className} CSS block`);
  return match[1];
}

test('scroll-time navigation theme sampling uses cached geometry only', () => {
  const hook = read('src/components/navigation/useNavigationTheme.ts');

  assert.doesNotMatch(hook, /elementsFromPoint/);
  assert.match(hook, /type ThemeRegion/);
  assert.match(hook, /refreshGeometry/);
  assert.match(hook, /window\.scrollX/);
  assert.match(hook, /window\.scrollY/);

  const readThemes = hook.match(/const readThemes = \(\) => \{([\s\S]*?)\n\s*\};/);
  assert.ok(readThemes, 'Expected readThemes callback');
  assert.doesNotMatch(
    readThemes[1],
    /getBoundingClientRect|querySelector|querySelectorAll|elementsFromPoint/,
    'scroll rAF must not perform DOM queries or layout reads',
  );
});

test('navigation theme state updates only when a zone theme actually changes', () => {
  const hook = read('src/components/navigation/useNavigationTheme.ts');

  assert.match(hook, /currentThemesRef/);
  assert.match(hook, /themesEqual/);
  assert.match(hook, /setThemes\(next\)/);
  assert.doesNotMatch(hook, /setThemes\(\(current\)/);
});

test('idle pill text and mark layers do not request permanent compositor promotion', () => {
  const css = read('src/components/navigation/Navigation.module.css');

  assert.match(cssBlock(css, 'pillFloodSurface'), /will-change:\s*transform/);
  assert.doesNotMatch(cssBlock(css, 'pillFloodBase'), /will-change/);
  assert.doesNotMatch(cssBlock(css, 'pillFloodReveal'), /will-change/);
});
