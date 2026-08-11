import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('test runner does not depend on Node being compiled with built-in TypeScript support', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.test, 'node --import=tsx --test tests/*.test.mjs');
  assert.equal(pkg.devDependencies.tsx, '4.23.1');
  assert.doesNotMatch(pkg.scripts.test, /experimental-strip-types/);
});

test('production TypeScript imports stay bundler-friendly instead of leaking test-runner .ts extensions', () => {
  const emitter = read('src/webgl/reveal/emitters/pointerEmitter.ts');
  const tracker = read('src/webgl/reveal/pointerTracker.ts');

  assert.match(emitter, /from ['"]\.\.\/math['"]/);
  assert.doesNotMatch(emitter, /from ['"][^'"]+\.ts['"]/);
  assert.match(tracker, /from ['"]\.\/emitters\/pointerEmitter['"]/);
  assert.doesNotMatch(tracker, /from ['"][^'"]+\.ts['"]/);
});

test('repository pins the Next version proven to start successfully with the current TypeScript toolchain', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies.next, '16.3.0');
});

test('test harness documentation no longer claims Node built-in strip-types is required', () => {
  const harness = read('scripts/build-testable-modules.mjs');
  assert.doesNotMatch(harness, /strip-types|built-in TypeScript support/i);
  assert.match(harness, /tsx/i);
});
