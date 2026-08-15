import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function readAvifSize(relativePath) {
  const buffer = fs.readFileSync(path.join(root, relativePath));

  assert.equal(buffer.subarray(4, 8).toString('ascii'), 'ftyp');
  assert.equal(buffer.subarray(8, 12).toString('ascii'), 'avif');

  const ispeOffset = buffer.indexOf(Buffer.from('ispe'));
  assert.ok(ispeOffset >= 0, `Missing AVIF ispe box in ${relativePath}`);

  return {
    width: buffer.readUInt32BE(ispeOffset + 8),
    height: buffer.readUInt32BE(ispeOffset + 12),
  };
}

test('about page stays compact and three-section people-first', () => {
  const page = read('src/components/AboutPage/AboutPage.tsx');
  const intro = read('src/components/AboutPage/AboutIntro.tsx');
  const founders = read('src/components/AboutPage/FoundersSection.tsx');
  const approach = read('src/components/AboutPage/AboutApproach.tsx');

  assert.match(page, /<AboutIntro\s*\/>[\s\S]*<FoundersSection[\s\S]*<AboutApproach\s*\/>/);
  assert.match(intro, /\/\/ ABOUT\./);
  assert.match(founders, /02 \/\/ THE PEOPLE/);
  assert.match(approach, /03 \/\/ HOW WE WORK/);
  assert.doesNotMatch(`${intro}\n${founders}\n${approach}`, /mission|vision|awards|testimonials|our history|timeline|join our team/i);
});

test('founders section is exactly two-profile shaped and responsive', () => {
  const section = read('src/components/AboutPage/FoundersSection.tsx');
  const css = read('src/components/AboutPage/AboutPage.module.css');

  assert.match(section, /readonly \[Founder, Founder\]/);
  assert.match(section, /founders\.map/);
  assert.match(css, /repeat\(2,\s*minmax\(260px,\s*380px\)\)/);
  assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*grid-template-columns:\s*1fr/);
  assert.doesNotMatch(section, /carousel|slider|swiper|infinite/i);
});

test('how we work ending stays compact and non-persuasive', () => {
  const source = read('src/components/AboutPage/AboutApproach.tsx');
  const css = read('src/components/AboutPage/AboutPage.module.css');

  assert.match(source, /01 \/ FOCUSED/);
  assert.match(source, /02 \/ COLLABORATIVE/);
  assert.match(source, /03 \/ DELIBERATE/);
  assert.match(source, /WEBERAISE/);
  assert.match(source, /new Date\(\)\.getFullYear\(\)/);
  assert.match(css, /min-height:\s*clamp\([^;]*68svh/);
  assert.doesNotMatch(source, /LET.S TALK|CONTACT US|START A PROJECT|BOOK A CALL/i);
});

test('about route mounts one Silk background scoped to the opening', () => {
  const route = read('src/app/about/page.tsx');

  assert.equal((route.match(/<SilkWavesBackground/g) ?? []).length, 1);
  assert.match(route, /activeTargetId="about-opening"/);
  assert.match(route, /<AboutPage\s+founders=\{FOUNDERS\}\s*\/>/);
});

test('founder data uses the approved two real identities, responsibilities and local portraits', () => {
  const data = read('src/components/AboutPage/aboutData.ts');

  assert.match(data, /name:\s*'Muhammad Ahmad'/);
  assert.match(data, /role:\s*'Design \/ Creative Direction \/ Frontend'/);
  assert.match(data, /revealTitle:\s*'DESIGN \/ DIRECTION \/ FRONTEND'/);
  assert.match(data, /imageSrc:\s*'\/about\/founders\/muhammad-ahmad-about\.avif'/);

  assert.match(data, /name:\s*'Ahmad Ali'/);
  assert.match(data, /role:\s*'Backend \/ Development \/ Systems'/);
  assert.match(data, /revealTitle:\s*'BACKEND \/ DEVELOPMENT \/ SYSTEMS'/);
  assert.match(data, /imageSrc:\s*'\/about\/founders\/ahmad-ali-about\.avif'/);

  assert.ok(fs.existsSync(path.join(root, 'public/about/founders/muhammad-ahmad-about.avif')));
  assert.ok(fs.existsSync(path.join(root, 'public/about/founders/ahmad-ali-about.avif')));
  assert.doesNotMatch(data, /placeholder|example|john doe|jane doe|founder one|founder two|tbd|todo/i);
});

test('founder portrait files are valid high-resolution AVIF resources', () => {
  const muhammad = readAvifSize('public/about/founders/muhammad-ahmad-about.avif');
  const ali = readAvifSize('public/about/founders/ahmad-ali-about.avif');

  assert.deepEqual(muhammad, { width: 840, height: 1050 });
  assert.deepEqual(ali, { width: 840, height: 1050 });
});
