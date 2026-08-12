import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

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

test('MainSite installs the new narrative instead of FirstImpression', () => {
  const main = read('src/components/MainSite/MainSite.tsx');
  assert.match(main, /PostExploreNarrative/);
  assert.doesNotMatch(main, /FirstImpression/);
});

test('questions accumulate before one shared fade and keep Scroll Float entrance geometry', () => {
  const motion = read('src/components/MainSite/PostExploreNarrative/questionMotion.ts');
  assert.match(motion, /enterStart:\s*0(?:\.0+)?/);
  assert.match(motion, /enterStart:\s*0\.25/);
  assert.match(motion, /enterStart:\s*0\.48/);
  assert.match(motion, /GROUP_FADE_START\s*=\s*0\.82/);
  assert.match(motion, /GROUP_FADE_END\s*=\s*0\.98/);
  assert.match(motion, /yPercent:\s*120/);
  assert.match(motion, /scaleY:\s*2\.3/);
  assert.match(motion, /scaleX:\s*0\.7/);
  assert.match(motion, /ScrollTrigger/);
  assert.match(motion, /visuals/);
  assert.doesNotMatch(motion, /firstExitSpan|finalExitAt|EXIT_STAGGER/);
});

test('question layout uses top-left middle-right bottom-left and doubles scroll distance', () => {
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  assert.match(css, /\.questionScroll\s*\{[^}]*height:\s*520svh/s);
  assert.match(css, /data-question-index='0'[\s\S]*top:\s*15svh/);
  assert.match(css, /data-question-index='0'[\s\S]*left:\s*max\(/);
  assert.match(css, /data-question-index='1'[\s\S]*right:\s*max\(/);
  assert.match(css, /data-question-index='1'[\s\S]*top:\s*50%/);
  assert.match(css, /data-question-index='2'[\s\S]*bottom:\s*11svh/);
  assert.match(css, /height:\s*560svh/);
});

test('question DOM keeps whole-string accessible text and decorative characters', () => {
  const component = read('src/components/MainSite/PostExploreNarrative/QuestionSequence.tsx');
  assert.match(component, /className="sr-only"/);
  assert.match(component, /aria-hidden="true"/);
  assert.match(component, /data-question-index/);
  assert.match(component, /data-question-char/);
  assert.doesNotMatch(component, /Math\.random/);
});

test('particle profiles remain inside the approved performance budget', () => {
  const model = read('src/components/MainSite/PostExploreNarrative/particleModel.ts');
  assert.match(model, /maxParticles:\s*2700/);
  assert.match(model, /dprCap:\s*1\.5/);
  assert.match(model, /scatterMin:\s*70/);
  assert.match(model, /scatterMax:\s*110/);
  assert.match(model, /maxParticles:\s*1500/);
  assert.match(model, /dprCap:\s*1\.35/);
  assert.match(model, /scatterMin:\s*45/);
  assert.match(model, /scatterMax:\s*75/);
  assert.doesNotMatch(model, /Math\.random/);
});

test('particle reassurance stays as an interactive live particle canvas', () => {
  const component = read('src/components/MainSite/PostExploreNarrative/ParticleReassurance.tsx');
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  assert.match(component, /pointerRepel/);
  assert.match(component, /repelRadius/);
  assert.match(component, /idleDrift/);
  assert.match(component, /pointerenter/);
  assert.match(component, /pointermove/);
  assert.match(component, /pointerleave/);
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /ResizeObserver/);
  assert.match(component, /cancelAnimationFrame/);
  assert.doesNotMatch(component, /reassuranceResolved|particleSettled/);
  assert.match(css, /\.particleCanvas\s*\{[^}]*pointer-events:\s*auto/s);
  assert.doesNotMatch(css, /particleTextFrame\[data-particle-settled/);
});

test('Aurora is limited to the business-outcome phrase and Weberaise palette', () => {
  const component = read('src/components/MainSite/PostExploreNarrative/AuroraStatement.tsx');
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  assert.match(component, /statementLead/);
  assert.match(component, /auroraText/);
  for (const color of ['#f5f7fa', '#60a5fa', '#3b82f6', '#2563eb']) {
    assert.ok(css.toLowerCase().includes(color), `${color} missing from Aurora palette`);
  }
  assert.match(css, /animation:\s*wrAurora\s+15s\s+linear\s+infinite/);
});

test('growth ring is larger bolder and uses high-contrast service text', () => {
  const ring = read('src/components/MainSite/PostExploreNarrative/GrowthRing.tsx');
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  assert.match(ring, /ringTrack/);
  assert.match(ring, /ringCenter/);
  assert.match(ring, /aria-hidden="true"/);
  assert.match(css, /--ring-size:\s*clamp\(280px,/);
  assert.match(css, /\.ringChar\s*\{[^}]*font-size:\s*14px[^}]*font-weight:\s*800[^}]*color:\s*var\(--wr-text\)/s);
  assert.match(css, /animation:\s*wrServiceRing\s+22s\s+linear\s+infinite/);
});

test('post-explore owns a continuous black handoff and reduced-motion fallbacks', () => {
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  assert.match(css, /\.root\s*\{[^}]*background:\s*var\(--wr-black\)/s);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.ringTrack\s*\{[\s\S]*animation:\s*none/);
});
