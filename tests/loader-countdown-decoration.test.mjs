import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('countdown-only decoration shows the WEBERAISE logo and LOADING label, then fades at zero', () => {
  const loader = read('src/components/experience/Loader/Loader.tsx');
  const decoration = read('src/components/experience/Loader/LoaderCountdownDecoration.tsx');
  const completion = read('src/components/experience/Loader/LoaderCompletion.tsx');
  const css = read('src/components/experience/Loader/LoaderCountdownDecoration.module.css');

  assert.match(loader, /import \{ LoaderCountdownDecoration \} from '\.\/LoaderCountdownDecoration'/);
  assert.match(loader, /phase === 'loading'[\s\S]*<LoaderCountdownDecoration hidden=\{display === 0\} \/>/);
  assert.doesNotMatch(completion, /LoaderCountdownDecoration|>LOADING<|weberaise-horizontal-on-dark\.svg/);

  assert.match(decoration, /src="\/brand\/weberaise-horizontal-on-dark\.svg"/);
  assert.match(decoration, /className=\{styles\.logo\}/);
  assert.match(decoration, />LOADING<\/span>/);
  assert.match(decoration, /data-hidden=\{hidden \? 'true' : 'false'\}/);

  assert.match(css, /\.root\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0[^}]*pointer-events:\s*none/s);
  assert.doesNotMatch(css, /\.root\s*\{[^}]*animation:\s*loader-decoration-in/s);
  assert.match(css, /\.content\s*\{[^}]*animation:\s*loader-decoration-in\s+420ms/s);
  assert.match(css, /\.root\s*\{[^}]*transition:\s*opacity\s+560ms[^;]*,\s*filter\s+560ms/s);
  assert.match(css, /\.root\[data-hidden='true'\]\s*\{[^}]*opacity:\s*0[^}]*filter:\s*blur\(2px\)/s);
  assert.match(css, /\.logo\s*\{[^}]*left:\s*50%[^}]*top:\s*clamp\(28px,\s*5\.2vh,\s*58px\)[^}]*transform:\s*translateX\(-50%\)/s);
  assert.match(css, /\.label\s*\{[^}]*left:\s*50%[^}]*top:\s*calc\(50%[^}]*font:\s*7\d\d[^}]*var\(--font-hero\)/s);
  assert.match(css, /@keyframes loader-decoration-in/);
});
