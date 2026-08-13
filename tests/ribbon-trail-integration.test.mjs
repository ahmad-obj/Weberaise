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
  const narrative = read(`${featureDir}/JourneyNarrative.tsx`);
  assert.match(controller, /measurementPath/);
  assert.match(controller, /drawPaths/);
  assert.match(controller, /for \(const .* of drawPaths\)/);
  assert.match(controller, /openingLocalY/);
  assert.doesNotMatch(controller, /openingLength:\s*number/);
  for (const ref of ['backBasePathRef', 'backHighlightPathRef', 'frontBasePathRef', 'frontHighlightPathRef']) {
    assert.match(narrative, new RegExp(ref));
  }
  assert.match(narrative, /drawPaths:\s*\[\s*backBasePath,\s*backHighlightPath,\s*frontBasePath,\s*frontHighlightPath\s*\]/s);
});

test('reveals use each stop viewport ratio instead of the animated ribbon head', () => {
  const controller = read(`${featureDir}/ribbonController.ts`);
  assert.match(controller, /revealReachedStops\s*=\s*\(viewportHeight:\s*number\)/);
  assert.match(controller, /revealDocumentY\s*=\s*window\.scrollY\s*\+\s*viewportHeight\s*\*\s*stop\.revealViewportRatio/);
  assert.match(controller, /if\s*\(revealDocumentY\s*<\s*rootDocumentTop\s*\+\s*stop\.revealLocalY\)/);
  assert.match(controller, /revealedStops\.has\(id\)/);
});

test('controller paces semantic arc length through one short overwrite scrub', () => {
  const controller = read(`${featureDir}/ribbonController.ts`);
  const narrative = read(`${featureDir}/JourneyNarrative.tsx`);
  assert.match(controller, /buildRibbonPacingAnchors/);
  assert.match(controller, /resolvePacedLength/);
  assert.match(controller, /window\.innerWidth\s*<=\s*720\s*\?\s*0\.14\s*:\s*0\.18/);
  assert.match(controller, /overwrite:\s*true/);
  assert.match(controller, /scrubTween\?\.kill\(\)/);
  assert.match(narrative, /markerProgress:\s*geometry\.markerProgress/);
});

test('controller restores document-relative progress and reveals after a geometry rebuild', () => {
  const controller = read(`${featureDir}/ribbonController.ts`);
  assert.match(controller, /scrollLocalY\s*=\s*Math\.max\(0,\s*window\.scrollY\s*-\s*rootDocumentTop\)/);
  assert.match(controller, /resolvePacedLength\(pacingAnchors,\s*scrollLocalY\)/);
  assert.doesNotMatch(controller, /initialScrollY/);
  assert.doesNotMatch(controller, /travel\s*>\s*1/);
  assert.match(controller, /scrubTo\(Math\.max\(openingFloor,\s*latestResolvedLength\)\);\s*revealReachedStops\(viewportHeight\);/s);
  assert.match(controller, /const initialScrollState\s*=\s*resolveScrollState\(\)/);
  assert.match(controller, /resolveInitialRibbonDraw\([\s\S]*pacedLength:\s*latestResolvedLength[\s\S]*scrollLocalY:\s*initialScrollState\.scrollLocalY/s);
  assert.match(controller, /scrubTo\(initialDraw\.targetLength,\s*initialDraw\.duration\);\s*revealReachedStops\(initialScrollState\.viewportHeight\);/s);
});

test('opening and scroll share one draw tween and persist rebuild progress', () => {
  const controller = read(`${featureDir}/ribbonController.ts`);
  assert.match(controller, /ribbonVisibleProgress/);
  assert.match(controller, /restoreRibbonLength/);
  assert.match(controller, /normalizeRibbonProgress/);
  assert.doesNotMatch(controller, /introTween|introState/);
  assert.equal((controller.match(/gsap\.to\(/g) ?? []).length, 1);
});

test('first geometry waits for the settled rebuild scheduler', () => {
  const narrative = read(`${featureDir}/JourneyNarrative.tsx`);
  const startJourney = narrative.slice(
    narrative.indexOf('const startJourney'),
    narrative.indexOf("if (shell && shell.dataset.experienceState"),
  );
  assert.match(startJourney, /scheduleRebuild\(\)/);
  assert.doesNotMatch(startJourney, /\brebuild\(\)/);
});
