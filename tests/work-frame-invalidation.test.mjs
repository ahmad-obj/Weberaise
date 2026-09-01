import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldDrawWorkFrame } from '../src/webgl/workSphere/frameInvalidation.ts';

test('WorkSphere redraw invalidation preserves all visual-change causes', () => {
  assert.equal(shouldDrawWorkFrame({ transformChanged: false, mediaChanged: false, force: false }), false);
  assert.equal(shouldDrawWorkFrame({ transformChanged: true, mediaChanged: false, force: false }), true);
  assert.equal(shouldDrawWorkFrame({ transformChanged: false, mediaChanged: true, force: false }), true);
  assert.equal(shouldDrawWorkFrame({ transformChanged: false, mediaChanged: false, force: true }), true);
});
