import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const featureDir = 'src/components/MainSite/PostExploreNarrative';

test('approved post-explore copy is canonical and ordered', () => {
  const source = read('src/content/homepage.ts');
  const phrases = ['Need a website?', 'Need a redesign?', 'Need to look better online?', 'DONT WORRY. WE GOT YOU', 'We build websites that', 'move businesses forward.', 'WEB DEVELOPMENT · SEO · BRANDING ·', 'GROW'];
  let previous = -1;
  for (const phrase of phrases) {
    const index = source.indexOf(phrase);
    assert.ok(index > previous, `${phrase} should follow the previous narrative beat`);
    previous = index;
  }
});

test('MainSite installs the post-explore narrative instead of FirstImpression', () => {
  const main = read('src/components/MainSite/MainSite.tsx');
  assert.match(main, /PostExploreNarrative/);
  assert.doesNotMatch(main, /FirstImpression/);
});

test('MainSite ends after the finished post-explore narrative', () => {
  const main = read('src/components/MainSite/MainSite.tsx');
  assert.match(main, /<PostExploreNarrative\s*\/>/);
  for (const placeholder of ['selectedWork', 'services', 'principles', 'processSteps', 'engagementOptions', 'section-shell', 'TODO /']) {
    assert.doesNotMatch(main, new RegExp(placeholder));
  }
});

test('document-space art-directed journey files are canonical', () => {
  for (const file of ['JourneyNarrative.tsx', 'JourneyStop.tsx', 'JourneyArtwork.tsx', 'RibbonTrail.tsx', 'ribbonPrimitives.ts', 'journeyRoute.ts', 'buildJourneyPath.ts', 'pathLookup.ts', 'ribbonController.ts', 'questionReveal.ts']) {
    assert.equal(existsSync(resolve(root, featureDir, file)), true, `${file} must exist`);
  }
  const composition = read(`${featureDir}/PostExploreNarrative.tsx`);
  assert.match(composition, /JourneyNarrative/);
  assert.doesNotMatch(composition, /TrailNarrative/);
});

test('journey remains normal flow with sibling document-space ribbon SVGs', () => {
  const component = read(`${featureDir}/JourneyNarrative.tsx`);
  const ribbon = read(`${featureDir}/RibbonTrail.tsx`);
  const css = read(`${featureDir}/PostExploreNarrative.module.css`);
  assert.match(component, /data-journey/);
  assert.match(component, /JourneyArtwork/);
  assert.match(ribbon, /data-ribbon-svg="back"/);
  assert.match(ribbon, /data-ribbon-svg="front"/);
  assert.match(ribbon, /aria-hidden="true"/);
  assert.match(css, /\.ribbonSvg\s*\{[^}]*position:\s*absolute/s);
  assert.match(css, /\.journeyBeat\s*\{[^}]*display:\s*grid/s);
  assert.doesNotMatch(css, /position:\s*sticky/);
});

test('route geometry measures real artwork glyph and reassurance targets', () => {
  const route = read(`${featureDir}/journeyRoute.ts`);
  const builder = read(`${featureDir}/buildJourneyPath.ts`);
  assert.match(route, /JourneyRouteConfig/);
  assert.match(route, /ribbonWidth/);
  assert.match(route, /taperLength/);
  assert.match(builder, /getBoundingClientRect\(/);
  assert.match(builder, /data-ribbon-artwork/);
  assert.match(builder, /data-ribbon-glyph/);
  assert.match(builder, /data-reassurance-text/);
  assert.match(builder, /builder\.ellipse\(['"]reassurance-loop['"]/);
  assert.doesNotMatch(builder, /strokeDashoffset/);
});

test('path lookup samples getPointAtLength and resolves document Y with binary search', () => {
  const lookup = read(`${featureDir}/pathLookup.ts`);
  assert.match(lookup, /getTotalLength\(\)/);
  assert.match(lookup, /getPointAtLength\(/);
  assert.match(lookup, /binary/i);
  assert.match(lookup, /documentY/);
  assert.match(lookup, /resolveLengthForDocumentY/);
});

test('controller maintains center band one-way reveals and reversible taper', () => {
  const controller = read(`${featureDir}/ribbonController.ts`);
  assert.match(controller, /HEAD_BAND_MIN\s*=\s*0\.45/);
  assert.match(controller, /HEAD_BAND_MAX\s*=\s*0\.58/);
  assert.match(controller, /HEAD_NOMINAL\s*=\s*0\.52/);
  assert.match(controller, /revealedStops/);
  assert.match(controller, /taperVisible/);
  assert.match(controller, /strokeDashoffset/);
  assert.doesNotMatch(controller, /preventDefault\(/);
});

test('question reveal is entrance-only and reduced-motion aware', () => {
  const reveal = read(`${featureDir}/questionReveal.ts`);
  assert.match(reveal, /autoAlpha:\s*0/);
  assert.match(reveal, /y:\s*24/);
  assert.match(reveal, /duration:\s*0\.82/);
  assert.match(reveal, /power3\.out/);
  assert.match(reveal, /reducedMotion/);
  assert.doesNotMatch(reveal, /reverse\(|onLeave|onLeaveBack/);
});

test('reassurance uses controlled ShutterText and no particle implementation', () => {
  const component = read(`${featureDir}/JourneyNarrative.tsx`);
  assert.match(component, /ShutterText/);
  assert.match(component, /reassuranceActive/);
  assert.match(component, /data-reassurance-text/);
  assert.equal(existsSync(resolve(root, featureDir, 'ParticleReassurance.tsx')), false);
  assert.equal(existsSync(resolve(root, featureDir, 'particleModel.ts')), false);
});

test('Aurora statement and GROW ring remain intact', () => {
  const component = read(`${featureDir}/AuroraStatement.tsx`);
  const ring = read(`${featureDir}/GrowthRing.tsx`);
  const css = read(`${featureDir}/PostExploreNarrative.module.css`);
  assert.match(component, /statementLead/);
  assert.match(component, /auroraText/);
  assert.match(ring, /ringTrack/);
  assert.match(ring, /ringCenter/);
  assert.match(css, /animation:\s*wrAurora\s+15s\s+linear\s+infinite/);
  assert.match(css, /animation:\s*wrServiceRing\s+22s\s+linear\s+infinite/);
});

test('post-explore owns continuous black handoff and reduced-motion fallback', () => {
  const css = read(`${featureDir}/PostExploreNarrative.module.css`);
  assert.match(css, /\.root\s*\{[^}]*background:\s*var\(--wr-black\)/s);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
