import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const featureDir = 'src/components/MainSite/PostExploreNarrative';

test('approved post-explore copy is canonical and ordered', () => {
  const source = read('src/content/homepage.ts');
  const phrases = [
    'Need a website?',
    'Need a redesign?',
    'Need to look better online?',
    'DONT WORRY. WE GOT YOU',
    'We build websites that',
    'move businesses forward.',
    'WEB DEVELOPMENT · SEO · BRANDING ·',
    'GROW',
  ];

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

test('document-space journey files replace the sticky ribbon system', () => {
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

  const composition = read(`${featureDir}/PostExploreNarrative.tsx`);
  assert.match(composition, /JourneyNarrative/);
  assert.doesNotMatch(composition, /TrailNarrative/);
});

test('journey is normal document flow rather than a sticky viewport stage', () => {
  const component = read(`${featureDir}/JourneyNarrative.tsx`);
  const css = read(`${featureDir}/PostExploreNarrative.module.css`);

  assert.match(component, /data-journey/);
  assert.match(component, /data-journey-stop/);
  assert.match(component, /data-ribbon-svg/);
  assert.match(component, /aria-hidden="true"/);

  assert.match(css, /\.journey\s*\{/);
  assert.match(css, /\.journeyStop\s*\{/);
  assert.match(css, /\.ribbonSvg\s*\{[^}]*position:\s*absolute/s);
  assert.doesNotMatch(css, /\.trailStage\s*\{[^}]*position:\s*sticky/s);
  assert.doesNotMatch(css, /\.trailQuestion(?:One|Two|Three)/);
  assert.doesNotMatch(css, /\.reassuranceSection\s*\{[^}]*position:\s*absolute/s);
});

test('route geometry is measured from real stop rectangles and keeps clearance isolated from controller logic', () => {
  const route = read(`${featureDir}/journeyRoute.ts`);
  const builder = read(`${featureDir}/buildJourneyPath.ts`);

  assert.match(route, /JourneyRouteConfig/);
  assert.match(route, /clearance/);
  assert.match(route, /approachLead/);
  assert.match(route, /bandBias/);
  assert.match(builder, /getBoundingClientRect\(/);
  assert.match(builder, /data-journey-stop/);
  assert.match(builder, /clearance/);
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

test('ribbon controller maintains soft center band reverse floor and one-way reveals', () => {
  const controller = read(`${featureDir}/ribbonController.ts`);
  assert.match(controller, /HEAD_BAND_MIN\s*=\s*0\.45/);
  assert.match(controller, /HEAD_BAND_MAX\s*=\s*0\.58/);
  assert.match(controller, /HEAD_NOMINAL\s*=\s*0\.52/);
  assert.match(controller, /resolveLengthForDocumentY/);
  assert.match(controller, /strokeDasharray/);
  assert.match(controller, /strokeDashoffset/);
  assert.match(controller, /revealedStops/);
  assert.match(controller, /Math\.max\([^\n]*opening/);
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

test('particle profiles increase density while staying bounded', () => {
  const model = read(`${featureDir}/particleModel.ts`);
  assert.match(model, /maxParticles:\s*4000/);
  assert.match(model, /dprCap:\s*1\.5/);
  assert.match(model, /maxParticles:\s*2200/);
  assert.match(model, /dprCap:\s*1\.35/);
  assert.doesNotMatch(model, /Math\.random/);
});

test('particle reassurance is one-color larger denser and remains interactive', () => {
  const component = read(`${featureDir}/ParticleReassurance.tsx`);
  const css = read(`${featureDir}/PostExploreNarrative.module.css`);

  assert.match(component, /const WHITE = '#F5F7FA'/);
  assert.doesNotMatch(component, /GLOW_BLUE|ACCENT_BLUE|#60A5FA|#3B82F6/);
  assert.match(component, /pointerRepel/);
  assert.match(component, /repelRadius/);
  assert.match(component, /idleDrift/);
  assert.match(component, /pointerenter/);
  assert.match(component, /pointermove/);
  assert.match(component, /pointerleave/);
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /ResizeObserver/);
  assert.match(component, /const step = 2/);
  assert.doesNotMatch(component, /reassuranceResolved|particleSettled/);

  assert.match(css, /\.particleTextFrame\s*\{[^}]*font-size:\s*clamp\(96px,/s);
  assert.match(css, /\.particleCanvas\s*\{[^}]*pointer-events:\s*auto/s);
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

test('post-explore owns a continuous black handoff and reduced-motion fallbacks', () => {
  const css = read(`${featureDir}/PostExploreNarrative.module.css`);
  assert.match(css, /\.root\s*\{[^}]*background:\s*var\(--wr-black\)/s);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
