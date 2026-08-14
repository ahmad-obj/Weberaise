import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const moduleUrl = (file) => pathToFileURL(path.join(root, file)).href;

test('contact ending uses direct non-persuasive section copy', () => {
  const source = read('src/components/ServicesPage/ContactEnding.tsx');

  assert.match(source, /\/\/ CONTACT\./);
  assert.match(source, />\s*CONTACT US\s*</);
  assert.doesNotMatch(source, /dream|idea|project|ready|transform|grow|build together|let.s talk/i);
  assert.doesNotMatch(source, /href=[^>]*CONTACT US|<button[^>]*>[\s\S]*CONTACT US/i);
});

test('contact details model never embeds placeholder channels', async () => {
  const model = await import(moduleUrl('src/components/ServicesPage/contactDetails.ts'));
  const details = model.CONTACT_DETAILS;

  assert.ok(Array.isArray(details));
  for (const item of details) {
    assert.ok(['email', 'phone', 'whatsapp', 'social'].includes(item.kind));
    assert.equal(typeof item.label, 'string');
    assert.equal(typeof item.value, 'string');
    assert.equal(typeof item.href, 'string');
    assert.ok(item.label.trim().length > 0);
    assert.ok(item.value.trim().length > 0);
    assert.ok(item.href.trim().length > 0);
    assert.doesNotMatch(`${item.value} ${item.href}`, /example|placeholder|your-|000000|todo|tbd/i);
  }
});

test('contact ending is organized and responsive rather than scattered', () => {
  const css = read('src/components/ServicesPage/ContactEnding.module.css');

  assert.match(css, /min-height:\s*clamp\([^;]*(88|90)svh/);
  assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*grid-template-columns:\s*1fr/);
  assert.doesNotMatch(css, /margin-left:\s*\d+(%|vw)/);
  assert.doesNotMatch(css, /position:\s*sticky/);
  assert.doesNotMatch(css, /position:\s*fixed/);
});

test('services tail mounts contact ending after capabilities without creating another shader', () => {
  const tail = read('src/components/ServicesPage/ServicesTailEnvironment.tsx');
  const tailCss = read('src/components/ServicesPage/ServicesTailEnvironment.module.css');
  const route = read('src/app/services/page.tsx');

  assert.match(tail, /<CapabilitiesSection\s*\/>[\s\S]*<ContactEnding\s*\/>/);
  assert.doesNotMatch(tail, /contactReserve/);
  assert.doesNotMatch(tailCss, /\.contactReserve/);
  assert.equal((route.match(/<SilkWavesBackground/g) ?? []).length, 1);
  assert.match(tailCss, /height:\s*40vh/);
});

test('contact footer remains minimal', () => {
  const source = read('src/components/ServicesPage/ContactEnding.tsx');

  assert.match(source, /WEBERAISE/);
  assert.match(source, /new Date\(\)\.getFullYear\(\)/);
  assert.doesNotMatch(source, /LOCAL TIME|BASED IN|NEWSLETTER|PRIVACY|TERMS/i);
});
