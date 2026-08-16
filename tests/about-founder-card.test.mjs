import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const moduleUrl = (file) => pathToFileURL(path.join(root, file)).href;

test('founder tilt stays centered and reaches the React Bits-inspired amplitude', async () => {
  const { getFounderCardRotation } = await import(
    moduleUrl('src/components/AboutPage/founderCardMotion.ts')
  );

  assert.deepEqual(getFounderCardRotation(200, 250, 400, 500), {
    rotateX: 0,
    rotateY: 0,
  });
  assert.deepEqual(getFounderCardRotation(400, 0, 400, 500), {
    rotateX: 12,
    rotateY: 12,
  });
  assert.deepEqual(getFounderCardRotation(9999, -9999, 400, 500), {
    rotateX: 12,
    rotateY: 12,
  });
});

test('founder card combines strong tilt depth with the fixed custom reveal', () => {
  const component = read('src/components/AboutPage/FounderPortraitCard.tsx');
  const css = read('src/components/AboutPage/FounderPortraitCard.module.css');

  assert.match(css, /aspect-ratio:\s*4\s*\/\s*5/);
  assert.match(css, /overflow:\s*hidden/);
  assert.match(css, /perspective:\s*800px/);
  assert.match(css, /translateY\(27%\)/);
  assert.match(css, /translateZ\(72px\)/);
  assert.match(component, /getFounderCardRotation/);
  assert.match(component, /useMotionValue/);
  assert.match(component, /useSpring/);
  assert.match(component, /useReducedMotion/);
  assert.match(component, /rawScale/);
  assert.match(component, /rawScale\.set\(1\.07\)/);
  assert.match(component, /<motion\.img/);
  assert.match(component, /objectPosition/);
  assert.doesNotMatch(component, /from ['"]next\/image['"]/);
  assert.doesNotMatch(component, /useState\(/);
  assert.doesNotMatch(component, /onClick|tabIndex|role=["']button/i);
  assert.doesNotMatch(css, /cursor:\s*pointer/);
  assert.doesNotMatch(component, />\s*MORE\s*</i);
});

test('coarse pointers and reduced motion do not require reveal interaction', () => {
  const css = read('src/components/AboutPage/FounderPortraitCard.module.css');
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /@media \(pointer: coarse\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
