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

test('capabilities preserve the approved three disciplines and twelve names', () => {
  assert.deepEqual(
    CAPABILITY_GROUPS.map((group) => group.label),
    ['DESIGN', 'DEVELOPMENT', 'IMPROVEMENT'],
  );
  assert.deepEqual(
    CAPABILITY_GROUPS.flatMap((group) => group.items.map((item) => item.name)),
    [
      'Art Direction', 'UI/UX', 'Responsive', 'Motion',
      'Frontend', 'CMS', 'Integrations', 'E-commerce',
      'Performance', 'SEO Foundations', 'Analytics', 'Iteration',
    ],
  );
  assert.ok(CAPABILITY_GROUPS.every((group) => group.items.length === 4));
  assert.ok(CAPABILITY_GROUPS.flatMap((group) => group.items).every(
    (item) => ['left', 'mid', 'right'].includes(item.position),
  ));
});

test('silk render sizing clamps DPR and pointer damping is stable', async () => {
  const math = await import(moduleUrl('src/components/ui/SilkWavesBackground/silkMath.ts'));
  assert.deepEqual(math.getRenderSize(1000, 500, 3, false), {
    width: 1500,
    height: 750,
    dpr: 1.5,
  });
  assert.deepEqual(math.getRenderSize(400, 800, 3, true), {
    width: 480,
    height: 960,
    dpr: 1.2,
  });
  const next = math.dampScalar(0, 1, 1 / 60);
  assert.ok(next > 0 && next < 1);
});

test('silk observer root margin is viewport-derived and browser-valid', async () => {
  const math = await import(moduleUrl('src/components/ui/SilkWavesBackground/silkMath.ts'));
  assert.equal(math.getTailRootMargin(900), '1440px 0px');
  assert.equal(math.getTailRootMargin(0), '0px 0px');
});

test('silk background owns one raw-WebGL RAF lifecycle and safe fallbacks', () => {
  const source = read('src/components/ui/SilkWavesBackground/SilkWavesBackground.tsx');
  assert.match(source, /getContext\(['"]webgl['"]/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /cancelAnimationFrame/);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /devicePixelRatio/);
  assert.match(source, /data-webgl-state/);
});

test('silk shader is black-blue, broad and procedural rather than a copied image effect', () => {
  const shader = read('src/components/ui/SilkWavesBackground/silkShaders.ts');
  assert.match(shader, /uResolution/);
  assert.match(shader, /uTime/);
  assert.match(shader, /uPointer/);
  assert.match(shader, /fbm|noise/);
  assert.match(shader, /37\.0, 99\.0, 235\.0/);
  assert.doesNotMatch(shader, /sampler2D/);
});

test('services route mounts one fixed silk background and tail after Works Bridge', () => {
  const route = read('src/app/services/page.tsx');
  assert.equal((route.match(/<SilkWavesBackground/g) ?? []).length, 1);
  assert.match(route, /<ServicesPage\s*\/>[\s\S]*<WorksBridge\s*\/>[\s\S]*<\/div>[\s\S]*<ServicesTailEnvironment\s*\/>/);
  assert.match(route, /activeTargetId="services-tail-environment"/);
});

test('tail reveals silk gradually and reserves blank contact runway', () => {
  const source = read('src/components/ServicesPage/ServicesTailEnvironment.tsx');
  const css = read('src/components/ServicesPage/ServicesTailEnvironment.module.css');
  assert.match(source, /id="services-tail-environment"/);
  assert.match(source, /contactReserve/);
  assert.match(css, /linear-gradient/);
  assert.match(css, /40vh/);
  assert.match(css, /contactReserve/);
  assert.match(css, /min-height:\s*clamp\([^;]*82svh/);
  assert.doesNotMatch(source, />\s*(LET.S TALK|HAVE SOMETHING|CONTACT)\s*</i);
});

test('capabilities section is semantic, names-only and editorial rather than card-based', () => {
  const source = read('src/components/ServicesPage/CapabilitiesSection.tsx');
  const css = read('src/components/ServicesPage/CapabilitiesSection.module.css');
  assert.match(source, /\/\/ CAPABILITIES\./);
  assert.match(source, /The disciplines we bring together to shape, build and improve digital experiences\./);
  assert.match(source, /CAPABILITY_GROUPS\.map/);
  assert.match(source, /data-position=/);
  assert.doesNotMatch(source, /href=|<button|<img|description/i);
  assert.match(css, /min-height:\s*clamp\([^;]*148svh/);
  assert.match(css, /data-position='left'/);
  assert.match(css, /data-position='mid'/);
  assert.match(css, /data-position='right'/);
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
