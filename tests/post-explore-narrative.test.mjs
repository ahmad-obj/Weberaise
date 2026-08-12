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

test('question motion preserves approved windows and Scroll Float geometry', () => {
  const motion = read('src/components/MainSite/PostExploreNarrative/questionMotion.ts');
  assert.match(motion, /enterStart:\s*0\.0/);
  assert.match(motion, /enterStart:\s*0\.3/);
  assert.match(motion, /enterStart:\s*0\.6/);
  assert.match(motion, /yPercent:\s*120/);
  assert.match(motion, /scaleY:\s*2\.3/);
  assert.match(motion, /scaleX:\s*0\.7/);
  assert.match(motion, /ScrollTrigger/);
  assert.match(motion, /filter:\s*'blur\(3px\)'/);
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

test('particle reassurance uses bounded Canvas lifecycle with no pointer interaction or idle loop', () => {
  const component = read('src/components/MainSite/PostExploreNarrative/ParticleReassurance.tsx');
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /ResizeObserver/);
  assert.match(component, /cancelAnimationFrame/);
  assert.match(component, /animationFrame\s*=\s*null/);
  assert.match(component, /aria-hidden="true"/);
  assert.doesNotMatch(component, /pointermove|pointerenter|pointerleave|mousemove/);
  assert.doesNotMatch(component, /Math\.random/);
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

test('growth ring uses CSS rotation with a stationary center', () => {
  const ring = read('src/components/MainSite/PostExploreNarrative/GrowthRing.tsx');
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  assert.match(ring, /ringTrack/);
  assert.match(ring, /ringCenter/);
  assert.match(ring, /aria-hidden="true"/);
  assert.match(css, /animation:\s*wrServiceRing\s+22s\s+linear\s+infinite/);
  assert.match(css, /\.ringCenter\s*\{/);
});

test('post-explore owns a continuous black handoff and reduced-motion fallbacks', () => {
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  assert.match(css, /\.root\s*\{[^}]*background:\s*var\(--wr-black\)/s);
  assert.match(css, /\.questionScroll\s*\{[^}]*height:\s*260svh/s);
  assert.match(css, /height:\s*280svh/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.ringTrack\s*\{[\s\S]*animation:\s*none/);
});
