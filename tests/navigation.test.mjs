import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const navDir = 'src/components/navigation';

test('floating navigation has three independent zones and canonical order', () => {
  for (const file of ['SiteNavigation.tsx', 'Navigation.module.css', 'navigationModel.ts']) {
    assert.equal(existsSync(resolve(root, navDir, file)), true, `${file} must exist`);
  }

  const model = read(`${navDir}/navigationModel.ts`);
  const labels = ['SERVICES', 'WORK', 'ABOUT'];
  let previous = -1;
  for (const label of labels) {
    const index = model.indexOf(label);
    assert.ok(index > previous, `${label} must follow the previous center item`);
    previous = index;
  }

  const component = read(`${navDir}/SiteNavigation.tsx`);
  assert.match(component, /data-nav-zone="logo"/);
  assert.match(component, /data-nav-zone="center"/);
  assert.match(component, /data-nav-zone="talk"/);
  assert.match(read(`${navDir}/GooeyTalkButton.tsx`), /LET(?:'|&apos;)S TALK/);
});

test('navigation root is visually barless and pills remain independent', () => {
  const css = read(`${navDir}/Navigation.module.css`);
  assert.match(css, /\.navRoot\s*\{[^}]*background:\s*transparent/s);
  assert.match(css, /\.pill\s*\{/);
  assert.match(css, /border-radius:\s*1[4-8]px/);
  assert.doesNotMatch(css, /\.centerCluster\s*\{[^}]*background:/s);
});

test('hero navigation is rendered before the reveal canvas and survives EXPLORE exit', () => {
  const hero = read('src/components/experience/Hero/Hero.tsx');

  assert.match(hero, /SiteNavigation/);
  assert.ok(
    hero.indexOf('<SiteNavigation') < hero.indexOf('<HeroRevealCanvas'),
    'hero nav must render below the difference compositor',
  );
  assert.match(hero, /heroInteractive/);
  assert.match(hero, /heroExiting/);

  const component = read(`${navDir}/SiteNavigation.tsx`);
  assert.match(component, /mode !== 'hero'/);
  assert.match(component, /gsap\.fromTo/);
});

test('center navigation uses one measured inverse hover plate across separate pills', () => {
  const component = read(`${navDir}/CenterNavCluster.tsx`);
  const motion = read(`${navDir}/centerHoverMotion.ts`);

  assert.match(component, /data-center-nav-cluster/);
  assert.match(component, /data-center-hover-plate/);
  assert.match(component, /data-nav-item=\{item\.key\}/);
  assert.match(read(`${navDir}/navigationModel.ts`), /key: 'services'/);
  assert.match(motion, /getBoundingClientRect\(\)/);
  assert.match(motion, /ResizeObserver/);
  assert.match(motion, /gsap\.to/);
});

test('services stays detach-ready and the center cluster does not clip item slots', () => {
  const css = read(`${navDir}/Navigation.module.css`);

  assert.doesNotMatch(css, /\.centerCluster\s*\{[^}]*overflow:\s*(hidden|clip)/s);
  assert.doesNotMatch(css, /\.navItemSlot\s*\{[^}]*transform:/s);
  assert.doesNotMatch(css, /\.navItemSlot\s*\{[^}]*filter:/s);
});

test('lets talk uses a deterministic hover-triggered monochrome goo system', () => {
  const button = read(`${navDir}/GooeyTalkButton.tsx`);
  const particles = read(`${navDir}/gooeyParticles.ts`);
  const css = read(`${navDir}/Navigation.module.css`);

  assert.match(button, /LET(?:'|&apos;)S TALK/);
  assert.match(button, /onPointerEnter/);
  assert.match(button, /onFocus/);
  assert.match(button, /data-goo-particle/);
  assert.doesNotMatch(particles, /Math\.random/);
  assert.match(css, /blur\(/);
  assert.match(css, /contrast\(/);
  assert.match(css, /background:\s*var\(--nav-pill-fg\)/);
});

test('main navigation is mounted only in main state and current narrative declares nav theme', () => {
  const shell = read('src/components/experience/ExperienceShell.tsx');
  const narrative = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx');

  assert.match(shell, /state === 'main' && <SiteNavigation mode="main" \/>/);
  assert.match(narrative, /data-nav-theme="dark"/);
});

test('main navigation theme changes through css variables rather than blend mode', () => {
  const css = read(`${navDir}/Navigation.module.css`);
  const hook = read(`${navDir}/useNavigationTheme.ts`);

  assert.match(css, /data-nav-theme='dark'/);
  assert.match(css, /data-nav-theme='light'/);
  assert.match(hook, /getBoundingClientRect\(\)/);
  assert.match(hook, /requestAnimationFrame/);
  assert.doesNotMatch(css, /data-navigation-mode='main'[\s\S]{0,300}mix-blend-mode:\s*difference/);
});

test('hero and main navigation share geometry and main mode does not replay entrance motion', () => {
  const component = read(`${navDir}/SiteNavigation.tsx`);
  const css = read(`${navDir}/Navigation.module.css`);

  assert.match(component, /data-navigation-mode=\{mode\}/);
  assert.match(component, /mode !== 'hero'/);
  assert.match(css, /--nav-pill-height/);
  assert.match(css, /--nav-pill-radius/);
  assert.doesNotMatch(component, /mode === 'main'[\s\S]{0,240}gsap\.fromTo/);
});

test('navigation preserves all destinations on mobile and supports reduced motion', () => {
  const css = read(`${navDir}/Navigation.module.css`);

  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*\(pointer:\s*coarse\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /grid-column:\s*1\s*\/\s*-1/);
  assert.doesNotMatch(css, /\.centerZone\s*\{[^}]*transform:/s);
});

test('goo transform motion is not overwritten by main theme transitions', () => {
  const css = read(`${navDir}/Navigation.module.css`);
  assert.match(css, /\.gooCore\s*\{[\s\S]*transform 280ms/);
  assert.doesNotMatch(css, /\.pill,\s*\.centerHoverPlate,\s*\.gooCore/);
});

test('services exposes a stable future detach seam without implementing detachment', () => {
  const component = read(`${navDir}/CenterNavCluster.tsx`);
  const css = read(`${navDir}/Navigation.module.css`);

  assert.match(component, /data-nav-detach-anchor/);
  assert.match(component, /item\.key === 'services'/);
  assert.doesNotMatch(component, /footer|detachServices|IntersectionObserver/i);
  assert.doesNotMatch(css, /\.centerCluster\s*\{[^}]*overflow:\s*(hidden|clip)/s);
  assert.doesNotMatch(css, /\.navItemSlot\s*\{[^}]*transform:/s);
  assert.doesNotMatch(css, /\.navItemSlot\s*\{[^}]*contain:\s*paint/s);
});

test('hero nav links use the existing explore handoff before scrolling to hidden main targets', () => {
  const hero = read('src/components/experience/Hero/Hero.tsx');
  const siteNav = read(`${navDir}/SiteNavigation.tsx`);
  const center = read(`${navDir}/CenterNavCluster.tsx`);
  const talk = read(`${navDir}/GooeyTalkButton.tsx`);

  assert.match(hero, /pendingTargetRef/);
  assert.match(hero, /onNavigate=\{handleHeroNavigate\}/);
  assert.match(hero, /onExplore\(\)/);
  assert.match(hero, /scrollIntoView/);
  assert.match(hero, /experience-scroll-locked/);
  assert.match(hero, /requestAnimationFrame/);
  assert.match(siteNav, /interactive= true|interactive = true/);
  assert.match(siteNav, /inert=\{!interactive \? true : undefined\}/);
  assert.match(center, /event\.preventDefault\(\)/);
  assert.match(center, /onNavigate\(item\.href\)/);
  assert.match(talk, /event\.preventDefault\(\)/);
  assert.match(talk, /onNavigate\('#contact'\)/);
});

test('main mode samples background theme independently under logo center and talk zones', () => {
  const hook = read(`${navDir}/useNavigationTheme.ts`);
  const siteNav = read(`${navDir}/SiteNavigation.tsx`);
  const css = read(`${navDir}/Navigation.module.css`);

  assert.match(hook, /elementsFromPoint/);
  assert.match(hook, /logo/);
  assert.match(hook, /center/);
  assert.match(hook, /talk/);
  assert.match(siteNav, /themes\.logo/);
  assert.match(siteNav, /themes\.center/);
  assert.match(siteNav, /themes\.talk/);
  assert.match(css, /\[data-nav-theme='dark'\]/);
  assert.match(css, /\[data-nav-theme='light'\]/);
});

test('selective integration does not restore deprecated homepage sections', () => {
  const main = read('src/components/MainSite/MainSite.tsx');
  assert.doesNotMatch(main, /id="(?:work|services|audit|about|process|proof|engagement|contact)"/);
});
