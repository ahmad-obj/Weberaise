import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('controlled ShutterText preserves supplied three-slice behavior', () => {
  const componentPath = resolve(root, 'src/components/ui/shutter-text.tsx');
  assert.equal(existsSync(componentPath), true);
  const source = read('src/components/ui/shutter-text.tsx');

  assert.match(source, /AnimatePresence/);
  assert.match(source, /from ['"]framer-motion['"]/);
  assert.match(source, /blur\(10px\)/);
  assert.match(source, /0 0, 100% 0, 100% 35%, 0 35%/);
  assert.match(source, /0 35%, 100% 35%, 100% 65%, 0 65%/);
  assert.match(source, /0 65%, 100% 65%, 100% 100%, 0 100%/);
  assert.match(source, /staggerIndex \* 0\.03/);
  assert.match(source, /staggerIndex \* 0\.03 \+ 0\.12/);
  assert.match(source, /duration:\s*0\.7/);
  assert.match(source, /duration:\s*0\.8/);
  assert.match(source, /active:\s*boolean/);
  assert.match(source, /useReducedMotion/);
  assert.doesNotMatch(source, /role="button"|onClick|onMouseEnter|onMouseLeave|useInView|tabIndex/);
});

test('ShutterText is semantic and uses Weberaise colors instead of demo emerald', () => {
  const source = read('src/components/ui/shutter-text.tsx');
  const css = read('src/components/ui/shutter-text.module.css');

  assert.match(source, /aria-label=\{ariaLabel\}/);
  assert.match(source, /aria-hidden="true"/);
  assert.match(css, /#F5F7FA/i);
  assert.match(css, /#3B82F6|#60A5FA/i);
  assert.doesNotMatch(source + css, /emerald/i);
});

test('ShutterText renders explicit non-wrapping lines with one continuous stagger', () => {
  const source = read('src/components/ui/shutter-text.tsx');
  const css = read('src/components/ui/shutter-text.module.css');

  assert.match(source, /lines:\s*readonly string\[\]/);
  assert.match(source, /lines\.map/);
  assert.match(source, /priorCharacterCount/);
  assert.match(source, /data-reassurance-line=/);
  assert.match(css, /\.line\s*\{[^}]*display:\s*block;[^}]*white-space:\s*nowrap;/s);
  assert.doesNotMatch(source, /text\.split/);
});

test('framer-motion is the only new UI animation dependency', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies?.['framer-motion'], '12.43.0');
  assert.equal(pkg.dependencies?.['tailwindcss'], undefined);
  assert.equal(pkg.dependencies?.['@shadcn/ui'], undefined);
});
