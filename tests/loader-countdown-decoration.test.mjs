import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('countdown-only decoration shows the WEBERAISE logo and LOADING label, then fades at zero', () => {
  const loader = read('src/components/experience/Loader/Loader.tsx');
  const completion = read('src/components/experience/Loader/LoaderCompletion.tsx');
  const css = read('src/app/globals.css');

  assert.match(loader, /phase === 'loading'[\s\S]*loader-countdown-decoration/);
  assert.match(loader, /src="\/brand\/weberaise-horizontal-on-dark\.svg"/);
  assert.match(loader, /className="loader-countdown-decoration__logo"/);
  assert.match(loader, />LOADING<\/span>/);
  assert.match(loader, /data-hidden=\{display === 0 \? 'true' : 'false'\}/);
  assert.doesNotMatch(completion, /loader-countdown-decoration|>LOADING<|weberaise-horizontal-on-dark\.svg/);

  assert.match(css, /\.loader-countdown-decoration\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0[^}]*pointer-events:\s*none/s);
  assert.match(css, /\.loader-countdown-decoration__logo\s*\{[^}]*left:\s*50%[^}]*top:\s*clamp\([^}]*transform:\s*translateX\(-50%\)/s);
  assert.match(css, /\.loader-countdown-decoration__label\s*\{[^}]*left:\s*50%[^}]*top:\s*calc\(50%[^}]*font:[^}]*var\(--font-hero\)[^}]*font-weight|\.loader-countdown-decoration__label\s*\{[^}]*font:\s*7\d\d[^}]*var\(--font-hero\)/s);
  assert.match(css, /\.loader-countdown-decoration\[data-hidden='true'\]\s*\{[^}]*opacity:\s*0/s);
  assert.match(css, /@keyframes loader-decoration-in/);
});
