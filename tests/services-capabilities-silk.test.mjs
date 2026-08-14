import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const moduleUrl = (file) => pathToFileURL(path.join(root, file)).href;

const { CAPABILITY_GROUPS } = await import(
  moduleUrl('src/components/ServicesPage/capabilitiesModel.ts')
);
const { SILK_COLORS, SILK_PRESET } = await import(
  moduleUrl('src/components/ui/SilkWavesBackground/silkPreset.ts')
);

test('capabilities preserve three organized disciplines and exact item order', () => {
  assert.deepEqual(
    CAPABILITY_GROUPS.map((group) => group.label),
    ['DESIGN', 'DEVELOPMENT', 'IMPROVEMENT'],
  );

  assert.deepEqual(CAPABILITY_GROUPS.map((group) => [...group.items]), [
    ['Art Direction', 'UI/UX', 'Responsive', 'Motion'],
    ['Frontend', 'CMS', 'Integrations', 'E-commerce'],
    ['Performance', 'SEO Foundations', 'Analytics', 'Iteration'],
  ]);

  assert.ok(CAPABILITY_GROUPS.every((group) => group.items.length === 4));
  assert.ok(CAPABILITY_GROUPS.every((group) =>
    group.items.every((item) => typeof item === 'string'),
  ));
});

test('silk preset matches the approved Weberaise-blue recipe', () => {
  assert.deepEqual(SILK_COLORS, [
    [1 / 255, 4 / 255, 10 / 255],
    [3 / 255, 19 / 255, 45 / 255],
    [10 / 255, 61 / 255, 145 / 255],
    [40 / 255, 120 / 255, 246 / 255],
  ]);

  assert.deepEqual(SILK_PRESET, {
    timeScale: 0.76,
    colorCount: 4,
    shape: [1.26, 0.28, 0.5, 0],
    surface: [2.4, 1.11, 0, 1],
    finish: [0, 0, 0, 0.05],
    transform: [1581, 0, 0, 0],
    space: [0, 0, 0, 0],
    cursor: [0, 2, 0.65, 0.46],
  });
});

test('silk render sizing caps DPR at two without pointer-specific quality branches', async () => {
  const math = await import(moduleUrl('src/components/ui/SilkWavesBackground/silkMath.ts'));
  assert.deepEqual(math.getRenderSize(1000, 500, 3), {
    width: 2000,
    height: 1000,
    dpr: 2,
  });
  assert.deepEqual(math.getRenderSize(400, 800, 1.5), {
    width: 600,
    height: 1200,
    dpr: 1.5,
  });
});

test('silk observer root margin is viewport-derived and browser-valid', async () => {
  const math = await import(moduleUrl('src/components/ui/SilkWavesBackground/silkMath.ts'));
  assert.equal(math.getTailRootMargin(900), '1440px 0px');
  assert.equal(math.getTailRootMargin(0), '0px 0px');
});

test('silk shader uses the approved packed WebGL1 contract', () => {
  const shader = read('src/components/ui/SilkWavesBackground/silkShaders.ts');

  assert.match(shader, /uniform vec3 u_colors\[8\]/);
  for (const name of [
    'u_scene', 'u_shape', 'u_surface', 'u_finish',
    'u_transform', 'u_space', 'u_cursor',
  ]) {
    assert.match(shader, new RegExp(`uniform vec4 ${name}`));
  }

  assert.match(shader, /#define u_resolution u_scene\.xy/);
  assert.match(shader, /grainHash/);
  assert.match(shader, /mixColour/);
  assert.match(shader, /vec3 shade\(/);
  assert.match(shader, /gl_FragColor/);
  assert.doesNotMatch(shader, /uniform vec2 uResolution/);
  assert.doesNotMatch(shader, /uniform float uTime/);
  assert.doesNotMatch(shader, /uniform vec2 uPointer/);
  assert.doesNotMatch(shader, /sampler2D/);
});

test('silk background owns one fullscreen-triangle raw-WebGL lifecycle with cursor off', () => {
  const source = read('src/components/ui/SilkWavesBackground/SilkWavesBackground.tsx');
  assert.match(source, /getContext\(['"]webgl['"]/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /cancelAnimationFrame/);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /webglcontextlost/);
  assert.match(source, /devicePixelRatio/);
  assert.match(source, /data-webgl-state/);
  assert.match(source, /SILK_COLORS/);
  assert.match(source, /SILK_PRESET/);
  assert.match(source, /uniform3fv/);
  assert.match(source, /uniform4f/);
  assert.match(source, /gl\.drawArrays\(gl\.TRIANGLES, 0, 3\)/);
  assert.match(source, /-1, -1,[\s\S]*3, -1,[\s\S]*-1, 3/);
  assert.doesNotMatch(source, /pointermove/i);
  assert.doesNotMatch(source, /pointerleave/i);
  assert.doesNotMatch(source, /finePointerQuery/);
  assert.doesNotMatch(source, /coarseQuery/);
  assert.doesNotMatch(source, /dampScalar/);
});

test('services route keeps one fixed silk background and tail after Works Bridge', () => {
  const route = read('src/app/services/page.tsx');
  assert.equal((route.match(/<SilkWavesBackground/g) ?? []).length, 1);
  assert.match(route, /<ServicesPage\s*\/>[\s\S]*<WorksBridge\s*\/>[\s\S]*<\/div>[\s\S]*<ServicesTailEnvironment\s*\/>/);
  assert.match(route, /activeTargetId="services-tail-environment"/);
});

test('tail preserves the subtle reveal and a blank future contact runway', () => {
  const tailSource = read('src/components/ServicesPage/ServicesTailEnvironment.tsx');
  const tailCss = read('src/components/ServicesPage/ServicesTailEnvironment.module.css');
  const shaderCss = read('src/components/ui/SilkWavesBackground/SilkWavesBackground.module.css');

  assert.match(tailSource, /id="services-tail-environment"/);
  assert.match(tailCss, /height:\s*40vh/);
  assert.match(tailCss, /linear-gradient/);
  assert.match(tailCss, /contactReserve/);
  assert.match(tailCss, /82svh/);
  assert.match(shaderCss, /position:\s*fixed/);
  assert.match(shaderCss, /inset:\s*0/);
  assert.match(shaderCss, /pointer-events:\s*none/);
  assert.doesNotMatch(tailSource, />\s*(LET.S TALK|HAVE SOMETHING|CONTACT)\s*</i);
});

test('capabilities are organized as repeatable two-column groups with one-column mobile fallback', () => {
  const source = read('src/components/ServicesPage/CapabilitiesSection.tsx');
  const css = read('src/components/ServicesPage/CapabilitiesSection.module.css');

  assert.match(source, /\/\/ CAPABILITIES\./);
  assert.match(source, /The disciplines we bring together to shape, build and improve digital experiences\./);
  assert.match(source, /CAPABILITY_GROUPS\.map/);
  assert.doesNotMatch(source, /data-position=/);
  assert.doesNotMatch(source, /href=|<button|<img|description/i);

  assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /column-gap:\s*clamp\(/);
  assert.match(css, /row-gap:\s*clamp\(/);
  assert.doesNotMatch(css, /data-position=/);
  assert.doesNotMatch(css, /margin-left:\s*(4|7|13|22|34|42|62)(%|vw)/);
  assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(css, /letter-spacing/);
  assert.match(css, /font-weight/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /pointer:\s*coarse/);
  assert.doesNotMatch(css, /position:\s*sticky/);
});

test('route stacking keeps the shader behind opaque upstream work', () => {
  const css = read('src/app/services/ServicesRoute.module.css');
  const shaderCss = read('src/components/ui/SilkWavesBackground/SilkWavesBackground.module.css');
  assert.match(css, /\.upstream[\s\S]*z-index:\s*2/);
  assert.match(css, /isolation:\s*isolate/);
  assert.match(shaderCss, /position:\s*fixed/);
  assert.match(shaderCss, /z-index:\s*0/);
});
