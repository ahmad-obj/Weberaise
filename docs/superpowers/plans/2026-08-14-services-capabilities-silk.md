# Services Capabilities + Silk Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved Kue-inspired Capabilities section after the Works Bridge, backed by one fixed, dark Silk Waves-style WebGL canvas, with a seamless black-to-silk handoff and blank downstream runway reserved for the later Contact CTA.

**Architecture:** Keep the Services opening/index and Works Bridge untouched. Mount one route-level fixed decorative shader behind the Services tail, conceal it under existing opaque upstream sections, then expose it through a transparent `ServicesTailEnvironment` with a long black gradient veil. The shader is an original raw-WebGL implementation matching the approved Silk art direction; Capabilities stays semantic normal-flow content with CSS-authored asymmetric spacing and restrained hover typography.

**Tech Stack:** Next.js 16.3, React 19.2.8, TypeScript 7, CSS Modules, raw WebGL 1, Node test runner via `tsx`.

## Global Constraints

- Work only on branch `feature/services-opening-grid`.
- Do not change the approved Services opening/index choreography or Works Bridge behavior.
- No new npm dependency for the shader; use raw WebGL already available in browsers.
- React Bits Pro Silk Waves is a visual reference only; do not copy inaccessible proprietary source.
- One fixed shader canvas is shared by Capabilities and the future Contact CTA.
- Shader is predominantly true black with broad, slow Weberaise-blue silk folds.
- Pointer influence is extremely weak; no trails, ripples, click reactions, or per-capability shader reactions.
- Black-to-shader handoff is approximately 30–40vh and must not expose a rectangular component edge.
- Capabilities target approximately 130–160svh on desktop.
- Exact content groups are DESIGN, DEVELOPMENT, IMPROVEMENT with the approved 12 capability names.
- Capability names are informational text only; no cards, links, descriptions, icons, pills, or imagery.
- Reduced motion freezes the shader and removes meaningful hover motion.
- WebGL failure must render a deliberate static dark-blue fallback.
- Leave an empty downstream runway for the later Contact CTA; do not design or add Contact copy now.

---

## File Structure

Create:

- `src/components/ServicesPage/capabilitiesModel.ts` — exact capability data and authored alignment metadata.
- `src/components/ServicesPage/CapabilitiesSection.tsx` — semantic section markup only.
- `src/components/ServicesPage/CapabilitiesSection.module.css` — Kue-inspired editorial layout, responsive simplification, hover typography.
- `src/components/ServicesPage/ServicesTailEnvironment.tsx` — downstream composition, black-to-silk veil, Capabilities, blank Contact runway.
- `src/components/ServicesPage/ServicesTailEnvironment.module.css` — transparent tail layering and transition/runway sizing.
- `src/components/ui/SilkWavesBackground/silkShaders.ts` — original vertex/fragment shader source.
- `src/components/ui/SilkWavesBackground/silkMath.ts` — deterministic DPR sizing and damping helpers.
- `src/components/ui/SilkWavesBackground/SilkWavesBackground.tsx` — WebGL lifecycle, RAF, resize, visibility, pointer bias, reduced motion, failure fallback.
- `src/components/ui/SilkWavesBackground/SilkWavesBackground.module.css` — fixed canvas/fallback styling.
- `tests/services-capabilities-silk.test.mjs` — contracts for data, shader lifecycle, route integration, transition, semantics, responsive/reduced-motion rules.

Modify:

- `src/app/services/page.tsx` — mount one fixed `SilkWavesBackground` and the `ServicesTailEnvironment` after Works Bridge.
- `src/app/services/ServicesRoute.module.css` — establish route stacking so opaque upstream sections conceal the fixed shader while the transparent tail reveals it.

---

### Task 1: Capability data contract and failing tests

**Files:**
- Create: `src/components/ServicesPage/capabilitiesModel.ts`
- Create: `tests/services-capabilities-silk.test.mjs`

**Interfaces:**
- Produces `CAPABILITY_GROUPS` with type `CapabilityGroup`.
- `CapabilityGroup` contains `index`, `label`, and four `items`.
- Each item contains `name` and `position` where `position` is `'left' | 'mid' | 'right'`.

- [ ] **Step 1: Write the failing data contract test**

```js
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
```

- [ ] **Step 2: Run the test and verify it fails because the model does not exist**

Run:

```bash
npm test -- --test-name-pattern="capabilities preserve"
```

Expected: FAIL with module/file-not-found for `capabilitiesModel.ts`.

- [ ] **Step 3: Add the minimal exact model**

```ts
export type CapabilityPosition = 'left' | 'mid' | 'right';

export type CapabilityItem = {
  name: string;
  position: CapabilityPosition;
};

export type CapabilityGroup = {
  index: '01' | '02' | '03';
  label: 'DESIGN' | 'DEVELOPMENT' | 'IMPROVEMENT';
  items: readonly [CapabilityItem, CapabilityItem, CapabilityItem, CapabilityItem];
};

export const CAPABILITY_GROUPS = [
  {
    index: '01',
    label: 'DESIGN',
    items: [
      { name: 'Art Direction', position: 'left' },
      { name: 'UI/UX', position: 'right' },
      { name: 'Responsive', position: 'mid' },
      { name: 'Motion', position: 'right' },
    ],
  },
  {
    index: '02',
    label: 'DEVELOPMENT',
    items: [
      { name: 'Frontend', position: 'mid' },
      { name: 'CMS', position: 'left' },
      { name: 'Integrations', position: 'right' },
      { name: 'E-commerce', position: 'mid' },
    ],
  },
  {
    index: '03',
    label: 'IMPROVEMENT',
    items: [
      { name: 'Performance', position: 'right' },
      { name: 'SEO Foundations', position: 'left' },
      { name: 'Analytics', position: 'mid' },
      { name: 'Iteration', position: 'right' },
    ],
  },
] as const satisfies readonly CapabilityGroup[];
```

- [ ] **Step 4: Run the data contract test**

Run:

```bash
npm test -- --test-name-pattern="capabilities preserve"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ServicesPage/capabilitiesModel.ts tests/services-capabilities-silk.test.mjs
git commit -m "test: define services capabilities contract"
```

---

### Task 2: Original Silk shader primitive with lifecycle controls

**Files:**
- Create: `src/components/ui/SilkWavesBackground/silkShaders.ts`
- Create: `src/components/ui/SilkWavesBackground/silkMath.ts`
- Create: `src/components/ui/SilkWavesBackground/SilkWavesBackground.tsx`
- Create: `src/components/ui/SilkWavesBackground/SilkWavesBackground.module.css`
- Modify: `tests/services-capabilities-silk.test.mjs`

**Interfaces:**
- `getRenderSize(width: number, height: number, devicePixelRatio: number, coarse: boolean): { width: number; height: number; dpr: number }`
- `dampScalar(current: number, target: number, dt: number, timeConstant?: number): number`
- `SilkWavesBackground({ activeTargetId }: { activeTargetId: string })`
- Shader uniforms: `uResolution`, `uTime`, `uPointer`.

- [ ] **Step 1: Add failing math and lifecycle source tests**

Append:

```js
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
  assert.doesNotMatch(source, /setState\([^)]*requestAnimationFrame/);
});

test('silk shader is black-blue, broad and procedural rather than a copied image effect', () => {
  const shader = read('src/components/ui/SilkWavesBackground/silkShaders.ts');
  assert.match(shader, /uResolution/);
  assert.match(shader, /uTime/);
  assert.match(shader, /uPointer/);
  assert.match(shader, /fbm|noise/);
  assert.match(shader, /0\.145|37\.0\s*\/\s*255\.0/);
  assert.doesNotMatch(shader, /sampler2D/);
});
```

- [ ] **Step 2: Run the new tests and confirm failure**

Run:

```bash
npm test -- --test-name-pattern="silk"
```

Expected: FAIL because Silk files do not exist.

- [ ] **Step 3: Implement deterministic render sizing and damping**

```ts
export function getRenderSize(
  width: number,
  height: number,
  devicePixelRatio: number,
  coarse: boolean,
) {
  const cap = coarse ? 1.2 : 1.5;
  const dpr = Math.min(Math.max(devicePixelRatio || 1, 1), cap);
  return {
    width: Math.max(1, Math.round(width * dpr)),
    height: Math.max(1, Math.round(height * dpr)),
    dpr,
  };
}

export function dampScalar(
  current: number,
  target: number,
  dt: number,
  timeConstant = 0.28,
) {
  const ease = 1 - Math.exp(-Math.max(0, dt) / timeConstant);
  return current + (target - current) * ease;
}
```

- [ ] **Step 4: Add original shader sources**

Use a fullscreen quad vertex shader and an original fragment shader built from low-frequency value noise/fBM, domain warping, broad sine ridges and restrained black/blue lighting. Keep the exact public uniform contract:

```ts
export const SILK_VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const SILK_FRAGMENT_SHADER = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amp * noise(p);
    p = p * 2.01 + vec2(19.1, 7.7);
    amp *= 0.5;
  }
  return value;
}

void main() {
  vec2 resolution = max(uResolution, vec2(1.0));
  vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
  p += uPointer * 0.025;

  float t = uTime * 0.055;
  float warpA = fbm(p * 0.72 + vec2(t, -t * 0.42));
  float warpB = fbm(p * 1.12 + vec2(warpA * 0.55) + vec2(-t * 0.31, t * 0.22));
  float axis = p.x * 1.16 + p.y * 0.34 + warpA * 0.82 + warpB * 0.24;
  float fold = sin(axis * 3.05 + t * 1.1);
  float ridge = pow(max(0.0, 1.0 - abs(fold)), 4.2);
  float shoulder = pow(max(0.0, 1.0 - abs(sin(axis * 1.53 - 1.1))), 2.6);
  float depth = smoothstep(0.18, 0.82, warpB);

  vec3 black = vec3(0.0);
  vec3 deepBlue = vec3(8.0, 20.0, 52.0) / 255.0;
  vec3 blue = vec3(37.0, 99.0, 235.0) / 255.0;
  vec3 glow = vec3(96.0, 165.0, 250.0) / 255.0;

  float body = clamp(shoulder * 0.16 + depth * 0.09, 0.0, 0.24);
  float highlight = clamp(ridge * (0.22 + depth * 0.24), 0.0, 0.34);
  vec3 color = mix(black, deepBlue, body);
  color = mix(color, blue, highlight);
  color = mix(color, glow, ridge * ridge * 0.055);

  float vignette = 1.0 - smoothstep(0.46, 1.24, length(p * vec2(0.72, 0.94)));
  color *= mix(0.72, 1.0, vignette);
  gl_FragColor = vec4(color, 1.0);
}
`;
```

This is intentionally an original shader and not React Bits Pro source.

- [ ] **Step 5: Implement the fixed WebGL background lifecycle**

`SilkWavesBackground.tsx` must:

1. create exactly one `<canvas>`;
2. initialize `webgl` context and compile/link the two shader strings;
3. upload a six-vertex fullscreen quad;
4. cache uniform locations for `uResolution`, `uTime`, `uPointer`;
5. resize using `ResizeObserver` + `getRenderSize` with DPR caps 1.5 desktop / 1.2 coarse;
6. track normalized pointer target only on fine pointer and damp it toward target with `dampScalar`;
7. observe `activeTargetId` with `IntersectionObserver` and only run RAF while the Services tail is near the viewport;
8. stop RAF when `document.hidden` is true;
9. render one deterministic frame and stop for `prefers-reduced-motion: reduce`;
10. set `data-webgl-state="ready" | "fallback"` so CSS can expose a static fallback when context/shader setup fails;
11. clean up RAF, observers, media listeners, pointer listeners, buffers and program on unmount.

The render loop must mutate refs/local values only; never use React state per frame.

- [ ] **Step 6: Add fixed canvas/fallback CSS**

```css
.root {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: #000;
}

.canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.root[data-webgl-state='fallback'] {
  background:
    radial-gradient(80% 70% at 18% 26%, rgb(37 99 235 / 14%), transparent 58%),
    radial-gradient(65% 80% at 82% 68%, rgb(59 130 246 / 9%), transparent 62%),
    #000;
}

.root[data-webgl-state='fallback'] .canvas { display: none; }
```

- [ ] **Step 7: Run shader tests**

Run:

```bash
npm test -- --test-name-pattern="silk"
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/SilkWavesBackground tests/services-capabilities-silk.test.mjs
git commit -m "feat: add services silk background"
```

---

### Task 3: Services tail composition and seamless black-to-silk handoff

**Files:**
- Create: `src/components/ServicesPage/ServicesTailEnvironment.tsx`
- Create: `src/components/ServicesPage/ServicesTailEnvironment.module.css`
- Modify: `src/app/services/page.tsx`
- Modify: `src/app/services/ServicesRoute.module.css`
- Modify: `tests/services-capabilities-silk.test.mjs`

**Interfaces:**
- `ServicesTailEnvironment()` renders `id="services-tail-environment"`.
- `SilkWavesBackground` receives `activeTargetId="services-tail-environment"`.
- Tail contains a transition veil, Capabilities mount point, and `.contactReserve` with no content.

- [ ] **Step 1: Add failing route/layering tests**

Append:

```js
test('services route mounts one fixed silk background and tail after Works Bridge', () => {
  const route = read('src/app/services/page.tsx');
  assert.equal((route.match(/<SilkWavesBackground/g) ?? []).length, 1);
  assert.match(route, /<ServicesPage\s*\/>[\s\S]*<WorksBridge\s*\/>[\s\S]*<ServicesTailEnvironment\s*\/>/);
  assert.match(route, /activeTargetId="services-tail-environment"/);
});

test('tail reveals silk gradually and reserves blank contact runway', () => {
  const source = read('src/components/ServicesPage/ServicesTailEnvironment.tsx');
  const css = read('src/components/ServicesPage/ServicesTailEnvironment.module.css');
  assert.match(source, /id="services-tail-environment"/);
  assert.match(source, /aria-hidden="true"/);
  assert.match(css, /linear-gradient/);
  assert.match(css, /40vh|38vh|36vh|35vh|30vh/);
  assert.match(css, /contactReserve/);
  assert.match(css, /min-height:\s*clamp\([^;]*svh/);
  assert.doesNotMatch(source, /LET.S TALK|HAVE SOMETHING|CONTACT/i);
});
```

- [ ] **Step 2: Run and verify failure**

```bash
npm test -- --test-name-pattern="services route mounts one fixed silk|tail reveals silk"
```

Expected: FAIL because tail integration does not exist.

- [ ] **Step 3: Add tail shell**

```tsx
import { CapabilitiesSection } from './CapabilitiesSection';
import styles from './ServicesTailEnvironment.module.css';

export function ServicesTailEnvironment() {
  return (
    <div id="services-tail-environment" className={styles.tail}>
      <div className={styles.transitionVeil} aria-hidden="true" />
      <CapabilitiesSection />
      <div className={styles.contactReserve} aria-hidden="true" />
    </div>
  );
}
```

`CapabilitiesSection` may initially be a minimal temporary semantic stub only until Task 4; do not add final layout here.

- [ ] **Step 4: Add transition/runway CSS**

Use transparent tail layering over the fixed shader:

```css
.tail {
  position: relative;
  z-index: 2;
  min-height: 220svh;
  color: var(--wr-white);
  background: transparent;
  isolation: isolate;
}

.transitionVeil {
  position: absolute;
  inset: 0 0 auto;
  height: 40vh;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    #000 0%,
    rgb(0 0 0 / 96%) 16%,
    rgb(0 0 0 / 72%) 48%,
    rgb(0 0 0 / 28%) 78%,
    transparent 100%
  );
}

.contactReserve {
  min-height: clamp(620px, 82svh, 900px);
}
```

- [ ] **Step 5: Mount one shader at the route root**

Update `page.tsx` to this shape:

```tsx
<div className={styles.route}>
  <SilkWavesBackground activeTargetId="services-tail-environment" />
  <div className={styles.upstream}>
    <ServicesPage />
    <WorksBridge />
  </div>
  <ServicesTailEnvironment />
</div>
```

The upstream wrapper must remain above the shader and preserve existing opaque backgrounds.

- [ ] **Step 6: Establish route stacking without disturbing old runway suppression**

Keep the existing selector that suppresses the old Services `.futureRunway`, and add:

```css
.route {
  position: relative;
  min-height: 100svh;
  background: var(--wr-black);
  isolation: isolate;
}

.upstream {
  position: relative;
  z-index: 2;
}
```

Do not remove the existing `.route :global(main > section[aria-label='Services'] > div[aria-hidden='true']:last-child)` rule.

- [ ] **Step 7: Run route/tail tests and typecheck**

```bash
npm test -- --test-name-pattern="services route mounts one fixed silk|tail reveals silk"
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/services src/components/ServicesPage/ServicesTailEnvironment* tests/services-capabilities-silk.test.mjs
git commit -m "feat: add services silk tail environment"
```

---

### Task 4: Kue-inspired Capabilities composition and restrained hover typography

**Files:**
- Create/replace: `src/components/ServicesPage/CapabilitiesSection.tsx`
- Create: `src/components/ServicesPage/CapabilitiesSection.module.css`
- Modify: `tests/services-capabilities-silk.test.mjs`

**Interfaces:**
- Consumes `CAPABILITY_GROUPS`.
- Renders section `aria-labelledby="services-capabilities-heading"`.
- Exact intro label: `// CAPABILITIES.`
- Exact framing sentence: `The disciplines we bring together to shape, build and improve digital experiences.`

- [ ] **Step 1: Add failing semantic/layout tests**

Append:

```js
test('capabilities section is semantic, names-only and editorial rather than card-based', () => {
  const source = read('src/components/ServicesPage/CapabilitiesSection.tsx');
  const css = read('src/components/ServicesPage/CapabilitiesSection.module.css');
  assert.match(source, /\/\/ CAPABILITIES\./);
  assert.match(source, /The disciplines we bring together to shape, build and improve digital experiences\./);
  assert.match(source, /CAPABILITY_GROUPS\.map/);
  assert.match(source, /data-position=/);
  assert.doesNotMatch(source, /href=|<button|<img|description/i);
  assert.match(css, /min-height:\s*clamp\([^;]*(140|145|150)svh/);
  assert.match(css, /data-position='left'/);
  assert.match(css, /data-position='mid'/);
  assert.match(css, /data-position='right'/);
  assert.match(css, /letter-spacing/);
  assert.match(css, /font-weight/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /pointer:\s*coarse/);
  assert.doesNotMatch(css, /position:\s*sticky/);
});
```

- [ ] **Step 2: Run and verify failure**

```bash
npm test -- --test-name-pattern="capabilities section is semantic"
```

Expected: FAIL until final component/CSS exist.

- [ ] **Step 3: Implement semantic markup**

Use this structure:

```tsx
import { CAPABILITY_GROUPS } from './capabilitiesModel';
import styles from './CapabilitiesSection.module.css';

export function CapabilitiesSection() {
  return (
    <section className={styles.section} aria-labelledby="services-capabilities-heading">
      <header className={styles.intro}>
        <p className={styles.kicker}>// CAPABILITIES.</p>
        <h2 id="services-capabilities-heading" className={styles.heading}>
          The disciplines we bring together to shape, build and improve digital experiences.
        </h2>
      </header>

      <div className={styles.groups}>
        {CAPABILITY_GROUPS.map((group) => (
          <section className={styles.group} key={group.label} aria-labelledby={`capability-${group.index}`}>
            <h3 id={`capability-${group.index}`} className={styles.groupLabel}>
              <span>{group.index}</span>
              <span aria-hidden="true">//</span>
              <span>{group.label}</span>
            </h3>
            <ul className={styles.list}>
              {group.items.map((item) => (
                <li className={styles.item} data-position={item.position} key={item.name}>
                  <span className={styles.name}>{item.name}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Implement desktop editorial composition**

Use normal document flow, one capability per visual row, and position metadata only for horizontal authorship:

```css
.section {
  position: relative;
  z-index: 1;
  width: min(100%, 1600px);
  min-height: clamp(1120px, 148svh, 1540px);
  margin: 0 auto;
  padding: clamp(120px, 16svh, 180px) var(--wr-page-pad) clamp(90px, 11svh, 130px);
}

.intro {
  width: min(760px, 64vw);
  margin-bottom: clamp(90px, 13svh, 150px);
}

.kicker {
  margin: 0 0 24px;
  font: 650 11px/1 var(--font-body), Arial, sans-serif;
  letter-spacing: .14em;
  color: rgb(255 255 255 / 64%);
}

.heading {
  margin: 0;
  font: 600 clamp(26px, 3vw, 48px)/1.06 var(--font-hero), Arial, sans-serif;
  letter-spacing: -.04em;
  text-wrap: balance;
}

.groups { display: grid; gap: clamp(110px, 15svh, 170px); }

.groupLabel {
  display: flex;
  gap: 10px;
  margin: 0 0 clamp(46px, 6svh, 72px);
  font: 650 11px/1 var(--font-body), Arial, sans-serif;
  letter-spacing: .13em;
  color: rgb(255 255 255 / 58%);
}

.list {
  display: grid;
  gap: clamp(30px, 4.3svh, 52px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.item { width: max-content; max-width: 100%; }
.item[data-position='left'] { margin-left: 4%; }
.item[data-position='mid'] { margin-left: 34%; }
.item[data-position='right'] { margin-left: 62%; }

.name {
  display: inline-block;
  font: 520 clamp(42px, 5.2vw, 84px)/.92 var(--font-hero), Arial, sans-serif;
  letter-spacing: -.055em;
  transition:
    transform 320ms cubic-bezier(.22, 1, .36, 1),
    letter-spacing 320ms cubic-bezier(.22, 1, .36, 1),
    font-weight 320ms cubic-bezier(.22, 1, .36, 1),
    color 320ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .item:hover .name {
    transform: translateX(5px);
    font-weight: 620;
    letter-spacing: -.064em;
    color: #fff;
  }
}
```

- [ ] **Step 5: Add responsive simplification**

Tablet: reduce offsets to approximately 0 / 22% / 42%.

Mobile (`max-width: 640px`): keep a primarily vertical sequence and use only small indents, approximately 0 / 7vw / 13vw. Reduce heading/name sizes and group gaps, but retain generous vertical rhythm and no horizontal overflow.

Add coarse pointer and reduced-motion blocks so hover transitions are removed or effectively static:

```css
@media (pointer: coarse) {
  .name { transition: none; }
}

@media (prefers-reduced-motion: reduce) {
  .name { transition-duration: 1ms; }
  .item:hover .name { transform: none; }
}
```

- [ ] **Step 6: Run semantic/layout tests and typecheck**

```bash
npm test -- --test-name-pattern="capabilities section is semantic|capabilities preserve"
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ServicesPage/CapabilitiesSection* src/components/ServicesPage/capabilitiesModel.ts tests/services-capabilities-silk.test.mjs
git commit -m "feat: add services capabilities composition"
```

---

### Task 5: Full verification and browser art-direction pass

**Files:**
- Modify only files from Tasks 2–4 if QA reveals defects.

**Interfaces:**
- No new public interface.

- [ ] **Step 1: Run all automated tests**

```bash
npm test
```

Expected: all existing Services/Works Bridge tests plus the new Silk/Capabilities tests PASS.

- [ ] **Step 2: Run TypeScript**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: successful Next.js production build.

- [ ] **Step 4: Browser QA at 1440×900**

Run:

```bash
npm run dev
```

Verify `/services`:

- existing Services opening/index and service previews remain unchanged;
- Works Bridge remains unchanged;
- after `VIEW OUR WORK`, true black holds briefly before silk becomes perceptible;
- black-to-silk handoff takes roughly 30–40vh and shows no rectangular boundary;
- shader remains viewport-fixed while Capabilities scrolls;
- shader stays mostly black with broad, slow blue folds;
- pointer influence is barely perceptible;
- `// CAPABILITIES.` and framing sentence are readable;
- DESIGN / DEVELOPMENT / IMPROVEMENT are clear structural anchors;
- all 12 names appear once and reading order remains obvious;
- asymmetric placements feel authored rather than random;
- hover is a subtle typographic response only;
- after Capabilities there is blank shader-backed runway, with no Contact copy yet.

- [ ] **Step 5: Responsive QA**

Check approximately 1280×800, 768×1024, 390×844:

- no horizontal overflow;
- tablet offsets remain legible;
- mobile becomes a controlled vertical sequence;
- shader quality remains acceptable and DPR is capped;
- coarse/touch pointers do not simulate hover.

- [ ] **Step 6: Motion/failure QA**

Verify:

- `prefers-reduced-motion: reduce` freezes the background into a deliberate frame and neutralizes typographic movement;
- background tab pauses RAF and resumes cleanly;
- WebGL-disabled/context-failure path shows the static dark-blue fallback;
- shader stops/throttles when the Services tail is far outside the viewport and resumes without a visible reset.

- [ ] **Step 7: Tune only within approved ranges**

Permitted art-direction tuning without reopening design:

- transition veil: 30–40vh;
- Capabilities height: 130–160svh;
- Silk time scale: approximately 0.035–0.075 equivalent shader-time multiplier;
- pointer displacement: 0–0.03 normalized units;
- desktop DPR cap: 1.25–1.5;
- coarse/mobile DPR cap: 1.0–1.2;
- authored item offsets, type scale, group gap, shader blue intensity/contrast.

Do not introduce new interaction systems, cards, per-capability imagery, scroll-scrubbed shader motion, or Contact CTA content.

- [ ] **Step 8: Final commit after QA fixes**

```bash
git add src/app/services src/components/ServicesPage src/components/ui/SilkWavesBackground tests/services-capabilities-silk.test.mjs
git commit -m "feat: complete services capabilities silk environment"
```

## Self-review

- Spec coverage: seamless handoff, fixed shared shader, dark Silk art direction, weak pointer influence, reduced motion, failure fallback, performance throttling, Kue-style Capabilities composition, responsive behavior, and blank Contact runway all have implementation/test tasks.
- Placeholder scan: no TODO/TBD implementation placeholders are required; the blank Contact runway is intentional product scope, not unfinished implementation.
- Type consistency: `CAPABILITY_GROUPS`, `SilkWavesBackground({ activeTargetId })`, `getRenderSize`, `dampScalar`, and `services-tail-environment` are defined once and consumed consistently.
- Scope: final Contact CTA design/copy/interaction is explicitly excluded.
