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

test('ribbon trail feature files replace the old Scroll Float question system', () => {
  for (const file of ['TrailNarrative.tsx', 'trailPath.ts', 'trailMotion.ts']) {
    assert.equal(existsSync(resolve(root, featureDir, file)), true, `${file} must exist`);
  }

  const composition = read(`${featureDir}/PostExploreNarrative.tsx`);
  assert.match(composition, /TrailNarrative/);
  assert.doesNotMatch(composition, /QuestionSequence/);
});

test('trail timing is normalized and reverse scroll keeps the automatic opening floor', () => {
  const motion = read(`${featureDir}/trailMotion.ts`);
  for (const contract of [
    /initial:\s*0\.09/,
    /q1:\s*0\.23/,
    /q2:\s*0\.47/,
    /q3:\s*0\.69/,
    /questionsFade:\s*0\.83/,
    /reassurance:\s*0\.94/,
  ]) assert.match(motion, contract);

  assert.match(motion, /getTotalLength\(\)/);
  assert.match(motion, /strokeDasharray/);
  assert.match(motion, /strokeDashoffset/);
  assert.match(motion, /Math\.max\(TRAIL_TIMING\.initial/);
  assert.match(motion, /ScrollTrigger/);
});

test('trail path geometry is isolated into editable desktop and mobile definitions', () => {
  const path = read(`${featureDir}/trailPath.ts`);
  assert.match(path, /TrailPathDefinition/);
  assert.match(path, /DESKTOP_TRAIL/);
  assert.match(path, /MOBILE_TRAIL/);
  assert.match(path, /viewBox/);
  assert.match(path, /d:/);
});

test('trail narrative uses fixed semantic question anchors and a decorative SVG', () => {
  const component = read(`${featureDir}/TrailNarrative.tsx`);
  const css = read(`${featureDir}/PostExploreNarrative.module.css`);

  assert.match(component, /aria-hidden="true"/);
  assert.match(component, /data-trail-path/);
  assert.match(component, /data-trail-question="0"/);
  assert.match(component, /data-trail-question="1"/);
  assert.match(component, /data-trail-question="2"/);
  assert.doesNotMatch(component, /data-question-char|questionChar/);

  assert.match(css, /\.trailScroll\s*\{[^}]*height:\s*500svh/s);
  assert.match(css, /height:\s*520svh/);
  assert.match(css, /\.trailQuestionOne\s*\{/);
  assert.match(css, /\.trailQuestionTwo\s*\{/);
  assert.match(css, /\.trailQuestionThree\s*\{/);
  assert.match(css, /\.trailQuestionThree\s*\{[^}]*top:\s*6[6-8]%/s);
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
