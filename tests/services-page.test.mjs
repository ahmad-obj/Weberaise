import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const sourceExists = (relativePath) => fs.existsSync(path.join(root, relativePath));

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

test('services opening preserves the SERVICES word and docks it with GSAP Flip', () => {
  const component = read('src/components/ServicesPage/ServicesPage.tsx');
  assert.match(component, /SO, WHAT/);
  assert.match(component, /SERVICES/);
  assert.match(component, /DO WE PROVIDE\?/);
  assert.match(component, /SO, WHAT SERVICES DO WE PROVIDE\?/);
  assert.match(component, /Flip\.getState/);
  assert.match(component, /servicesLabelSlotRef/);
  assert.match(component, /appendChild\(servicesWord\)/);
  assert.match(component, /Flip\.from/);
  assert.doesNotMatch(component, /canvas|WebGL|shader/i);
});

test('service rows expand through physical block relocation with accessible controls', () => {
  const component = read('src/components/ServicesPage/ServicesPage.tsx');
  assert.match(component, /aria-expanded/);
  assert.match(component, /aria-controls/);
  assert.match(component, /role="dialog"/);
  assert.match(component, /aria-modal="true"/);
  assert.match(component, /previewGrid\.prepend\(\.\.\.primaryBlocks\)/);
  assert.match(component, /originBlocks\.append\(\.\.\.primaryBlocks\)/);
  assert.match(component, /event\.key === 'Escape'/);
  assert.match(component, /originButtonRef\.current\?\.focus/);
});

test('services styling includes responsive, focus-visible, and reduced-motion behavior', () => {
  const css = read('src/components/ServicesPage/ServicesPage.module.css');
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /:focus-visible/);
  assert.doesNotMatch(css, /#8b5cf6|purple|glassmorphism/i);
});
