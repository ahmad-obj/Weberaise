import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const featureDir = 'src/components/MainSite/PostExploreNarrative';

test('document-space ribbon journey files replace the sticky trail controller', () => {
  for (const file of [
    'JourneyNarrative.tsx',
    'JourneyStop.tsx',
    'RibbonTrail.tsx',
    'journeyRoute.ts',
    'buildJourneyPath.ts',
    'pathLookup.ts',
    'ribbonController.ts',
    'questionReveal.ts',
  ]) {
    assert.equal(existsSync(resolve(root, featureDir, file)), true, `${file} must exist`);
  }
});

test('ribbon auto-draw still waits until the experience reaches main', () => {
  const component = read(`${featureDir}/JourneyNarrative.tsx`);
  assert.match(component, /data-experience-state/);
  assert.match(component, /MutationObserver/);
  assert.match(component, /experienceState\s*===\s*'main'/);
});

test('ribbon controller owns the soft center band and never scroll-jacks', () => {
  const controller = read(`${featureDir}/ribbonController.ts`);
  assert.match(controller, /HEAD_BAND_MIN\s*=\s*0\.45/);
  assert.match(controller, /HEAD_BAND_MAX\s*=\s*0\.58/);
  assert.match(controller, /HEAD_NOMINAL\s*=\s*0\.52/);
  assert.match(controller, /resolveLengthForDocumentY/);
  assert.match(controller, /revealedStops/);
  assert.match(controller, /strokeDashoffset/);
  assert.doesNotMatch(controller, /preventDefault\(/);
});

test('controller resolves once and applies the same length to every visible copy', () => {
  const controller = read(`${featureDir}/ribbonController.ts`);
  assert.match(controller, /measurementPath/);
  assert.match(controller, /drawPaths/);
  assert.match(controller, /for \(const .* of drawPaths\)/);
  assert.match(controller, /openingLocalY/);
  assert.doesNotMatch(controller, /openingLength:\s*number/);
});
