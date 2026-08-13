import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRibbonProgress,
  restoreRibbonLength,
} from '../src/components/MainSite/PostExploreNarrative/ribbonProgress.ts';

test('normalizes finite ribbon progress into a unit interval', () => {
  assert.equal(normalizeRibbonProgress(250, 1000), 0.25);
  assert.equal(normalizeRibbonProgress(-10, 1000), 0);
  assert.equal(normalizeRibbonProgress(1200, 1000), 1);
  assert.equal(normalizeRibbonProgress(50, 0), 0);
});

test('restores route-relative progress without dropping a completed opening', () => {
  assert.equal(restoreRibbonLength('0.42', 2000, 300, false), 840);
  assert.equal(restoreRibbonLength('bad', 2000, 300, false), 0);
  assert.equal(restoreRibbonLength('0.05', 2000, 300, true), 300);
  assert.equal(restoreRibbonLength(undefined, 2000, 300, true), 300);
});
