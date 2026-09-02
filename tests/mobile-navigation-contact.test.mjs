import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const navCssPath = new URL('../src/components/navigation/Navigation.module.css', import.meta.url);
const siteNavPath = new URL('../src/components/navigation/SiteNavigation.tsx', import.meta.url);
const talkPath = new URL('../src/components/navigation/GooeyTalkButton.tsx', import.meta.url);
const bubblePath = new URL('../src/components/navigation/TalkContactBubble.tsx', import.meta.url);
const sharedContactsPath = new URL('../src/content/contactDetails.ts', import.meta.url);
const contactEndingPath = new URL('../src/components/ServicesPage/ContactEnding.tsx', import.meta.url);

async function readOptional(url) {
  return readFile(url, 'utf8').catch(() => '');
}

function mediaBlock(source, query) {
  const start = source.indexOf(`@media ${query}`);
  assert.notEqual(start, -1, `Missing media query: ${query}`);
  const next = source.indexOf('@media ', start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

test('phone navigation remains a single row and compacts without hiding actions', async () => {
  const css = await readFile(navCssPath, 'utf8');
  const mobile = mediaBlock(css, '(max-width: 720px)');

  assert.match(mobile, /grid-template-columns:\s*auto\s+minmax\(0,\s*1fr\)\s+auto/);
  assert.doesNotMatch(mobile, /grid-template-rows:\s*auto\s+auto/);
  assert.doesNotMatch(mobile, /grid-row:\s*2/);
  assert.match(mobile, /env\(safe-area-inset-left/);
  assert.match(mobile, /env\(safe-area-inset-right/);
  assert.match(mobile, /white-space:\s*nowrap/);

  assert.match(css, /@media\s*\(max-width:\s*360px\)/);
  assert.match(css, /@media\s*\(max-width:\s*340px\)/);
});

test('LET’S TALK opens an accessible anchored contact bubble backed by shared contact data', async () => {
  const [siteNav, talk, bubble, contacts, contactEnding, css] = await Promise.all([
    readFile(siteNavPath, 'utf8'),
    readFile(talkPath, 'utf8'),
    readOptional(bubblePath),
    readOptional(sharedContactsPath),
    readFile(contactEndingPath, 'utf8'),
    readFile(navCssPath, 'utf8'),
  ]);

  assert.match(siteNav, /<GooeyTalkButton/);
  assert.match(talk, /useState/);
  assert.match(talk, /aria-expanded=\{open\}/);
  assert.match(talk, /aria-controls=/);
  assert.match(talk, /data-talk-pill/);
  assert.match(talk, /TalkContactBubble/);
  assert.match(talk, /keydown/);
  assert.match(talk, /Escape/);
  assert.match(talk, /pointerdown/);

  assert.match(bubble, /CONTACT_DETAILS/);
  assert.match(bubble, /role="dialog"/);
  assert.match(bubble, /item\.label/);
  assert.match(bubble, /item\.value/);
  assert.doesNotMatch(bubble, /\+92 325 9622759|instagram\.com\/weberaise|linkedin\.com\/company\/140193912/);

  assert.match(contacts, /CONTACT_DETAILS/);
  assert.match(contacts, /PHONE \/ WHATSAPP/);
  assert.match(contacts, /Instagram/);
  assert.match(contacts, /LinkedIn/);
  assert.match(contactEnding, /@\/content\/contactDetails/);

  assert.match(css, /\.talkShell\s*\{/);
  assert.match(css, /\.contactBubble\s*\{/);
  assert.match(css, /transform-origin:\s*top right/);
  assert.match(css, /backdrop-filter:/);
  assert.match(css, /data-open=['"]true['"]/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
