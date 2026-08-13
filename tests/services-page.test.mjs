import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(process.cwd());
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const sourceExists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const moduleUrl = (relativePath) => pathToFileURL(path.join(root, relativePath)).href;
const { SERVICES } = await import(moduleUrl('src/components/ServicesPage/servicesModel.ts'));
const motionModuleUrl = moduleUrl('src/components/ServicesPage/servicesMotion.ts');

test('service model stays five-group and composes three transferred plus five supplemental pieces', () => {
  assert.equal(SERVICES.length, 5);
  for (const service of SERVICES) {
    assert.equal(service.primary.length, 3, service.id);
    assert.equal(service.secondary.length, 5, service.id);
    assert.equal(new Set([...service.primary, ...service.secondary]).size, 8, service.id);
  }

  const landing = SERVICES.find((service) => service.id === 'landing-pages');
  assert.deepEqual(landing?.secondary, [
    'Copy Direction',
    'Responsive Build',
    'Analytics & Tracking',
    'Campaign Support',
    'Iteration',
  ]);
});

test('motion blueprint preserves Codrops hover, takeover, and title-direction behavior', async () => {
  const {
    SERVICES_MOTION,
    getIntroExitX,
    getSupplementalStartDelay,
    getTitleExitY,
  } = await import(motionModuleUrl);
  assert.deepEqual(SERVICES_MOTION.hover.blocksIn, {
    duration: 0.4,
    ease: 'power3',
    scale: 0.8,
    xPercent: 20,
    stagger: -0.035,
  });
  assert.equal(SERVICES_MOTION.hover.titleOut.duration, 0.1);
  assert.equal(SERVICES_MOTION.hover.titleIn.duration, 0.5);
  assert.equal(SERVICES_MOTION.intro.rowRevealDuration, 0.42);
  assert.equal(SERVICES_MOTION.intro.rowRevealStagger, 0.1);
  assert.equal(SERVICES_MOTION.takeover.duration, 0.9);
  assert.equal(SERVICES_MOTION.takeover.ease, 'power4.inOut');
  assert.equal(SERVICES_MOTION.close.titleStagger, 0.03);
  assert.equal(getTitleExitY(99, 100), -100);
  assert.equal(getTitleExitY(100, 100), -100);
  assert.equal(getTitleExitY(101, 100), 100);
  assert.equal(getSupplementalStartDelay(3), 0.12);
  assert.equal(getIntroExitX(1440, 600, 'left'), -1044);
  assert.equal(getIntroExitX(1440, 900, 'right'), 1194);
});

test('services page establishes the dedicated route and locked service model', () => {
  assert.equal(sourceExists('src/app/services/page.tsx'), true);
  assert.equal(sourceExists('src/components/ServicesPage/servicesModel.ts'), true);
  const route = read('src/app/services/page.tsx');
  const model = read('src/components/ServicesPage/servicesModel.ts');
  assert.match(route, /ServicesPage/);
  for (const id of [
    'website-design-development',
    'website-redesign',
    'landing-pages',
    'ecommerce-business-systems',
    'optimization-support',
  ]) assert.match(model, new RegExp(id));
  assert.doesNotMatch(model, /PROJECT ONE|CLIENT|AWARD/);
});

test('opening preserves the SERVICES word as the same DOM node', () => {
  const component = read('src/components/ServicesPage/ServicesPage.tsx');
  const css = read('src/components/ServicesPage/ServicesPage.module.css');
  assert.match(component, /SO, WHAT/);
  assert.match(component, /SERVICES/);
  assert.match(component, /DO WE PROVIDE\?/);
  assert.match(component, /Flip\.getState\(servicesWord/);
  assert.match(component, /servicesLabelSlot\.appendChild\(servicesWord\)/);
  assert.match(component, /Flip\.from\(flipState/);
  assert.match(component, /Flip\.from\(flipState,\s*\{[\s\S]*?scale:\s*true/);
  assert.doesNotMatch(component, /Flip\.from\(flipState,\s*\{[\s\S]*?paused:\s*true/);
  assert.match(component, /dataset\.handoffActive\s*=\s*'true'/);
  assert.match(component, /delete page\.dataset\.handoffActive/);
  assert.match(component, /SERVICES_MOTION\.intro/);
  assert.doesNotMatch(component, /\.to\(servicesWord,\s*\{[\s\S]*?color:\s*'var\(--wr-blue\)'/);
  assert.match(css, /\.page\s*\{[\s\S]*?background:\s*var\(--wr-black\)/);
  assert.match(css, /\.intro\s*\{[\s\S]*?background:\s*var\(--wr-black\)/);
  assert.match(css, /\.servicesWord\[data-docked='true'\]\s*\{[\s\S]*?color:\s*var\(--wr-white\)[\s\S]*?var\(--font-hero\)/);
  assert.match(css, /\.servicesWord\[data-docked='true'\]\s*\{[\s\S]*?font-size:\s*clamp\(/);
  assert.match(css, /\.indexHeader\s*\{[\s\S]*?justify-content:\s*center/);
  assert.match(css, /\.servicesLabelSlot\s*\{[\s\S]*?justify-content:\s*center/);
  assert.match(css, /\.page\[data-handoff-active='true'\]\s+\.indexStage\s*\{[\s\S]*z-index:\s*310/);
  assert.match(css, /\.page\[data-handoff-active='true'\]\s+\.servicesWord\s*\{[\s\S]*z-index:\s*320/);
});

test('service index mirrors the Codrops menu-row geometry instead of a custom editorial dashboard', () => {
  const component = read('src/components/ServicesPage/ServicesPage.tsx');
  const css = read('src/components/ServicesPage/ServicesPage.module.css');

  assert.match(css, /--tile-gap:\s*1vw/);
  assert.match(css, /--tile-gap-large:\s*2vw/);
  assert.match(css, /--tile-size:\s*5vw/);
  assert.match(css, /--tile-size-large:\s*14vw/);
  assert.match(css, /\.content\s*\{[\s\S]*z-index:\s*100/);
  assert.match(css, /\.row\s*\{[\s\S]*grid-template-rows:\s*var\(--tile-size\)[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) auto/);
  assert.match(css, /\.row\[data-current='true'\][\s\S]*z-index:\s*11/);
  assert.match(css, /\.cover\s*\{[\s\S]*z-index:\s*10/);
  assert.match(css, /\.previewLayer\s*\{[\s\S]*z-index:\s*200/);
  assert.match(css, /\.rowTile\s*\{[\s\S]*opacity:\s*0/);
  assert.match(css, /\.rowTitle[\s\S]*clamp\(30px,\s*3\.2vw,\s*46px\)/);

  assert.doesNotMatch(component, /SELECT A SERVICE/);
  assert.doesNotMatch(component, /previewLead|previewHeader/);
  assert.doesNotMatch(css, /repeat\(12/);
});

test('row hover choreography follows the reference thumbnail and title-switch motion', () => {
  const component = read('src/components/ServicesPage/ServicesPage.tsx');
  const css = read('src/components/ServicesPage/ServicesPage.module.css');
  const layout = read('src/app/layout.tsx');

  assert.match(layout, /Geist_Mono/);
  assert.match(layout, /--font-technical/);
  assert.match(component, /styles\.rowIdentity/);
  assert.match(component, /styles\.rowNumber/);
  assert.match(component, /data-service-index/);
  assert.match(component, /data-long-title=\{service\.title\.length > 26/);
  assert.match(component, /SERVICES_MOTION\.hover\.blocksIn/);
  assert.match(css, /var\(--font-technical\)/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /\.rowIdentity\s*\{[\s\S]*?grid-template-columns:/);
  assert.match(css, /\.rowNumber\s*\{[\s\S]*?font:/);
  assert.doesNotMatch(css, /\.rowNumber\s*\{[^}]*position:\s*absolute/);
  assert.match(component, /row\.dataset\.rowActive\s*=\s*'true'/);
  assert.match(component, /delete row\.dataset\.rowActive/);
  assert.match(css, /\.row\[data-row-active='true'\]\s*\{[\s\S]*?background:\s*var\(--wr-white\)[\s\S]*?color:\s*var\(--wr-black\)/);
  assert.match(css, /\.row\s*\{[\s\S]*?transition:[\s\S]*?var\(--wr-ease-premium\)/);
  assert.match(component, /startAt:\s*\{\s*scale:\s*blocksIn\.scale,\s*xPercent:\s*blocksIn\.xPercent\s*\}/);
  assert.match(component, /duration:\s*titleOut\.duration[\s\S]*yPercent:\s*-100/);
  assert.match(component, /startAt:\s*\{\s*yPercent:\s*100,\s*rotation:\s*titleIn\.rotation\s*\}/);
  assert.match(component, /dataset\.switched\s*=\s*'true'/);
  assert.match(component, /delete title\.dataset\.switched/);
});

test('click transition mirrors Codrops cover stacking, Flip relocation, and 4x2 preview grid', () => {
  const component = read('src/components/ServicesPage/ServicesPage.tsx');
  const css = read('src/components/ServicesPage/ServicesPage.module.css');

  assert.match(component, /row\.dataset\.current\s*=\s*'true'/);
  assert.match(component, /const allNumbers = rowRefs\.current/);
  assert.match(component, /height:\s*Math\.max\(1,\s*row\.offsetHeight\s*-\s*1\)/);
  assert.match(component, /top:\s*rowRect\.top/);
  assert.match(component, /previewGrid\.prepend\(\.\.\.primaryBlocks\)/);
  assert.match(component, /Flip\.from\(flipState/);
  assert.match(component, /gsap\.utils\.random\(0,\s*200\)/);
  assert.match(component, /scale:\s*0[\s\S]*opacity:\s*1[\s\S]*stagger:\s*0\.04/);
  assert.match(css, /grid-template-columns:\s*repeat\(4,\s*var\(--tile-size-large\)\)/);
  assert.match(css, /grid-template-rows:\s*repeat\(2,\s*var\(--tile-size-large\)\)/);
  assert.match(css, /\.cover\s*\{[\s\S]*?background:\s*var\(--wr-white\)/);
  assert.match(css, /\.previewGrid\s+\.tileInner\s*\{[\s\S]*?background:\s*var\(--wr-black\)[\s\S]*?color:\s*var\(--wr-white\)/);
});

test('close transition shrinks the full preview grid, returns transferred blocks, and restores rows', () => {
  const component = read('src/components/ServicesPage/ServicesPage.tsx');

  assert.match(component, /closeButtonRefs/);
  assert.doesNotMatch(component, /const closeButtonRef = useRef<HTMLButtonElement/);
  assert.match(component, /<article[\s\S]*?<button[\s\S]*?aria-label="Close service details"[\s\S]*?<h2/);
  assert.match(component, /const gridItems = \[\.\.\.primaryBlocks, \.\.\.secondaryBlocks\]/);
  assert.match(component, /scale:\s*0,[\s\S]*opacity:\s*0,[\s\S]*stagger:\s*0\.04/);
  assert.match(component, /originBlocks\.prepend\(\.\.\.primaryBlocks\)/);
  assert.match(component, /height:\s*0,[\s\S]*top:\s*rowRect\.top\s*\+\s*row\.offsetHeight\s*\/\s*2/);
  assert.match(component, /stagger:\s*\{[\s\S]*each:\s*0\.03[\s\S]*from:\s*index/);
  assert.match(component, /event\.key === 'Escape'/);
  assert.match(component, /originButtonRef\.current\?\.focus/);
});

test('services styling keeps responsive, focus, and reduced-motion behavior', () => {
  const component = read('src/components/ServicesPage/ServicesPage.tsx');
  const css = read('src/components/ServicesPage/ServicesPage.module.css');
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /\.row:has\(\.rowButton:focus-visible\)/);
  assert.match(css, /\.preview\[data-active='true'\]\s*\{[^}]*padding:/);
  assert.match(component, /styles\.futureRunway/);
  assert.match(component, /className=\{styles\.futureRunway\}\s+aria-hidden="true"/);
  assert.match(css, /\.futureRunway\s*\{[\s\S]*?min-height:\s*clamp\(/);
  assert.match(css, /\.futureRunway\s*\{[\s\S]*?background:\s*var\(--wr-black\)/);
  assert.doesNotMatch(css, /#8b5cf6|purple|glassmorphism/i);
});
