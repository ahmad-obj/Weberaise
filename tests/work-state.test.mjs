import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../src/components/WorkPage/workState.ts', import.meta.url), 'utf8');

test('work state contains only phase one lifecycle states', () => {
  assert.match(source, /opening/);
  assert.match(source, /sphereEntering/);
  assert.match(source, /sphereInteractive/);
  assert.match(source, /empty/);
  assert.doesNotMatch(source, /projectOpening|projectShowcase|projectReturning/);
  assert.doesNotMatch(source, /OPEN_PROJECT|PROJECT_OPENED|RETURN_TO_SPHERE|SPHERE_RESTORED/);
});

test('empty project data retains an explicit terminal state', () => {
  assert.match(source, /EMPTY_PROJECTS/);
});
