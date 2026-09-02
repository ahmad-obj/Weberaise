import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('final center navigation targets the dedicated routes', () => {
  const model = read('src/components/navigation/navigationModel.ts');
  assert.match(model, /label:\s*'SERVICES',\s*href:\s*'\/services'/);
  assert.match(model, /label:\s*'WORK',\s*href:\s*'\/work'/);
  assert.match(model, /label:\s*'ABOUT',\s*href:\s*'\/about'/);
  assert.doesNotMatch(model, /href:\s*'#(?:work|about)'/);
});

test('lets talk opens the shared contact directory instead of navigating away', () => {
  const talk = read('src/components/navigation/GooeyTalkButton.tsx');
  const bubble = read('src/components/navigation/TalkContactBubble.tsx');

  assert.match(talk, /type="button"/);
  assert.match(talk, /aria-expanded=\{open\}/);
  assert.match(talk, /TalkContactBubble/);
  assert.doesNotMatch(talk, /href="\/services#contact"/);
  assert.match(bubble, /@\/content\/contactDetails/);
});

test('secondary routes reuse the current SiteNavigation with route layering', () => {
  const navigation = read('src/components/navigation/SiteNavigation.tsx');
  const css = read('src/components/navigation/Navigation.module.css');
  assert.match(navigation, /type NavigationLayer = 'experience' \| 'route'/);
  assert.match(navigation, /layer\?: NavigationLayer/);
  assert.match(navigation, /data-navigation-layer=\{layer\}/);
  assert.match(css, /\[data-navigation-layer='route'\]\s*\{[^}]*z-index:\s*150/s);

  for (const path of ['src/app/services/page.tsx', 'src/app/work/page.tsx', 'src/app/about/page.tsx']) {
    const route = read(path);
    assert.match(route, /SiteNavigation/);
    assert.match(route, /<SiteNavigation mode="main" layer="route" \/>/);
  }
});

test('Services contact is a real deep-link target and hash handoff waits for intro unlock', () => {
  const contact = read('src/components/ServicesPage/ContactEnding.tsx');
  const route = read('src/app/services/page.tsx');
  const handoffPath = 'src/components/ServicesPage/ServicesHashHandoff.tsx';
  assert.equal(existsSync(resolve(root, handoffPath)), true, 'ServicesHashHandoff must exist');
  const handoff = read(handoffPath);

  assert.match(contact, /<section[^>]*id="contact"/s);
  assert.match(route, /ServicesHashHandoff/);
  assert.match(route, /<ServicesHashHandoff \/>/);
  assert.match(handoff, /window\.location\.hash !== '#contact'/);
  assert.match(handoff, /document\.body\.style\.overflow === 'hidden'/);
  assert.match(handoff, /data-index-interactive/);
  assert.match(handoff, /requestAnimationFrame/);
  assert.match(handoff, /getElementById\('contact'\)/);
  assert.match(handoff, /scrollIntoView/);
});

test('production contact data contains no invented placeholder email', () => {
  const details = read('src/content/contactDetails.ts');
  assert.doesNotMatch(details, /example@gmail\.com/i);
  assert.doesNotMatch(details, /mailto:example@gmail\.com/i);
  assert.match(details, /\+92 325 9622759/);
  assert.match(details, /instagram\.com\/weberaise/);
  assert.match(details, /linkedin\.com\/company\/140193912/);
});
