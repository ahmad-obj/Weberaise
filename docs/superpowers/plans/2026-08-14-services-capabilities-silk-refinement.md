# Services Capabilities + Silk Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current approximate Silk background with the exact approved Silk shader mechanics using a Weberaise-blue palette, and replace the scattered Capabilities layout with an organized two-column-by-two-row structure per discipline while preserving the fixed-canvas transition and blank future Contact CTA reserve.

**Architecture:** Keep the current route-level architecture intact: one fixed `SilkWavesBackground` behind the Services tail, one `ServicesTailEnvironment` controlling the black-to-Silk handoff and future Contact reserve, and one semantic `CapabilitiesSection`. Refine only the shader internals/preset and the capability data/layout. Do not touch the Services menu choreography or Works Bridge.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, CSS Modules, plain WebGL1, Node test runner + `tsx`.

## Global Constraints

- Work on `feature/services-opening-grid`; current planning baseline is commit `e044e11f86945233d70a204bea3b9347febe4749` or later.
- Authoritative design refinement: `docs/superpowers/specs/2026-08-14-services-capabilities-silk-refinement-design.md`.
- Exact approved fragment-shader source: `docs/superpowers/references/2026-08-14-silk-shader-source.glsl.md`.
- Preserve one fixed viewport Silk canvas shared by Capabilities and the future Contact CTA.
- Preserve the existing subtle black-to-Silk transition after `VIEW OUR WORK`.
- Preserve the existing blank Contact reserve; do not design or implement Contact CTA content.
- Do not alter `ServicesPage`, service row interaction, MenuToGrid takeover, DriftWall, or `VIEW OUR WORK` behavior.
- Shader must use plain WebGL1, one fullscreen triangle, no WebGL library.
- Cursor interaction is fully off.
- DPR is capped at `2`.
- Pause RAF while the document is hidden; retain reduced-motion, IntersectionObserver, context-loss, and fallback behavior.
- Shader palette, low to high: `#01040A`, `#03132D`, `#0A3D91`, `#2878F6`.
- Packed uniforms: `u_scene=(width,height,time*0.76,4)`, `u_shape=(1.26,.28,.50,0)`, `u_surface=(2.40,1.11,0,1)`, `u_finish=(0,0,0,.05)`, `u_transform=(1581,0,0,0)`, `u_space=(0,0,0,0)`, `u_cursor=(0,2,.65,.46)`.
- Capabilities remain exactly: DESIGN — Art Direction, UI/UX, Responsive, Motion; DEVELOPMENT — Frontend, CMS, Integrations, E-commerce; IMPROVEMENT — Performance, SEO Foundations, Analytics, Iteration.
- Desktop/suitable tablet: each group is an organized 2-column × 2-row grid; no scatter offsets.
- Mobile: collapse capability grid to one column at the browser-tuned breakpoint, approximately 680-760px.
- Capability hover remains typography-only and restrained.

---

## File Structure

**Modify:**

- `src/components/ui/SilkWavesBackground/silkShaders.ts` — replace the simplified shader with the approved packed-uniform Silk shader and retain a minimal fullscreen-triangle vertex shader.
- `src/components/ui/SilkWavesBackground/SilkWavesBackground.tsx` — upload the new packed uniforms, switch geometry to one fullscreen triangle, remove pointer plumbing, retain lifecycle/fallback logic.
- `src/components/ui/SilkWavesBackground/silkMath.ts` — simplify render sizing to a universal DPR cap of 2; keep valid pixel root-margin helper; remove pointer damping helper if unused.
- `src/components/ServicesPage/capabilitiesModel.ts` — remove positional metadata; keep only structured discipline/index/name data.
- `src/components/ServicesPage/CapabilitiesSection.tsx` — remove `data-position`; preserve semantic group/list structure.
- `src/components/ServicesPage/CapabilitiesSection.module.css` — replace scattered percentage offsets with a consistent 2×2 grid and responsive single-column fallback.
- `tests/services-capabilities-silk.test.mjs` — rewrite contracts around the exact shader, fixed preset, no cursor listeners, DPR cap 2, and organized capability grid.

**Do not modify unless browser QA reveals a real defect:**

- `src/components/ServicesPage/ServicesTailEnvironment.tsx`
- `src/components/ServicesPage/ServicesTailEnvironment.module.css`
- `src/app/services/page.tsx`
- `src/app/services/ServicesRoute.module.css`
- `src/components/ServicesPage/WorksBridge*`
- `src/components/ServicesPage/ServicesPage*`

---

### Task 1: Lock the new shader preset and render-size contracts with failing tests

**Files:**
- Modify: `tests/services-capabilities-silk.test.mjs`
- Modify later in task: `src/components/ui/SilkWavesBackground/silkMath.ts`
- Create later in task: `src/components/ui/SilkWavesBackground/silkPreset.ts`

**Interfaces:**
- Produces: `SILK_COLORS`, `SILK_PRESET`, and `getRenderSize(width, height, devicePixelRatio)` for later shader integration.
- Preserves: `getTailRootMargin(viewportHeight)`.

- [ ] **Step 1: Replace the old DPR/pointer-damping test with preset/render-size tests that must fail on the current code**

Add this import near the existing model import:

```js
const { SILK_COLORS, SILK_PRESET } = await import(
  moduleUrl('src/components/ui/SilkWavesBackground/silkPreset.ts')
);
```

Replace the existing `silk render sizing clamps DPR and pointer damping is stable` test with:

```js
test('silk preset matches the approved blue recipe and packed uniforms', () => {
  assert.deepEqual(SILK_COLORS, [
    [1 / 255, 4 / 255, 10 / 255],
    [3 / 255, 19 / 255, 45 / 255],
    [10 / 255, 61 / 255, 145 / 255],
    [40 / 255, 120 / 255, 246 / 255],
  ]);
  assert.equal(SILK_PRESET.timeScale, 0.76);
  assert.deepEqual(SILK_PRESET.shape, [1.26, 0.28, 0.5, 0]);
  assert.deepEqual(SILK_PRESET.surface, [2.4, 1.11, 0, 1]);
  assert.deepEqual(SILK_PRESET.finish, [0, 0, 0, 0.05]);
  assert.deepEqual(SILK_PRESET.transform, [1581, 0, 0, 0]);
  assert.deepEqual(SILK_PRESET.space, [0, 0, 0, 0]);
  assert.deepEqual(SILK_PRESET.cursor, [0, 2, 0.65, 0.46]);
});

test('silk render sizing uses one DPR ceiling of two', async () => {
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
```

Delete assertions for `dampScalar` and the coarse-pointer argument.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
```

Expected: FAIL because `silkPreset.ts` does not exist and/or `getRenderSize` still requires the old coarse-pointer behavior.

- [ ] **Step 3: Add the minimal preset module**

Create `src/components/ui/SilkWavesBackground/silkPreset.ts`:

```ts
export const SILK_COLORS = [
  [1 / 255, 4 / 255, 10 / 255],
  [3 / 255, 19 / 255, 45 / 255],
  [10 / 255, 61 / 255, 145 / 255],
  [40 / 255, 120 / 255, 246 / 255],
] as const;

export const SILK_PRESET = {
  timeScale: 0.76,
  colorCount: 4,
  shape: [1.26, 0.28, 0.5, 0] as const,
  surface: [2.4, 1.11, 0, 1] as const,
  finish: [0, 0, 0, 0.05] as const,
  transform: [1581, 0, 0, 0] as const,
  space: [0, 0, 0, 0] as const,
  cursor: [0, 2, 0.65, 0.46] as const,
} as const;
```

- [ ] **Step 4: Simplify render sizing and remove unused pointer math**

Change `silkMath.ts` to:

```ts
export function getRenderSize(
  width: number,
  height: number,
  devicePixelRatio: number,
) {
  const dpr = Math.min(Math.max(devicePixelRatio || 1, 1), 2);

  return {
    width: Math.max(1, Math.round(width * dpr)),
    height: Math.max(1, Math.round(height * dpr)),
    dpr,
  };
}

export function getTailRootMargin(viewportHeight: number) {
  const margin = Math.max(0, Math.round(viewportHeight * 1.6));
  return `${margin}px 0px`;
}
```

Remove `dampScalar` entirely after confirming no other import uses it.

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
npm run typecheck
```

Expected: preset/render-size/root-margin tests PASS; typecheck PASS or reveal only the expected temporary integration compile errors that are immediately addressed in Task 2. Do not commit if typecheck has unrelated/new errors.

- [ ] **Step 6: Commit**

```bash
git add tests/services-capabilities-silk.test.mjs \
  src/components/ui/SilkWavesBackground/silkMath.ts \
  src/components/ui/SilkWavesBackground/silkPreset.ts
git commit -m "test: lock services silk preset"
```

---

### Task 2: Replace the approximate GLSL with the exact approved Silk shader contract

**Files:**
- Modify: `src/components/ui/SilkWavesBackground/silkShaders.ts`
- Modify: `tests/services-capabilities-silk.test.mjs`
- Reference: `docs/superpowers/references/2026-08-14-silk-shader-source.glsl.md`

**Interfaces:**
- Produces fragment uniforms: `u_colors[8]`, `u_scene`, `u_shape`, `u_surface`, `u_finish`, `u_transform`, `u_space`, `u_cursor`.
- Keeps vertex attribute: `aPosition`.

- [ ] **Step 1: Rewrite the shader contract test first**

Replace the old test named `silk shader is black-blue, broad and procedural rather than a copied image effect` with:

```js
test('silk shader uses the approved packed WebGL1 contract', () => {
  const shader = read('src/components/ui/SilkWavesBackground/silkShaders.ts');

  for (const uniform of [
    'u_colors[8]',
    'u_scene',
    'u_shape',
    'u_surface',
    'u_finish',
    'u_transform',
    'u_space',
    'u_cursor',
  ]) {
    assert.match(shader, new RegExp(uniform.replace(/[\[\]]/g, '\\$&')));
  }

  assert.match(shader, /#define u_resolution u_scene\.xy/);
  assert.match(shader, /vec3 shade\(/);
  assert.match(shader, /grainHash/);
  assert.match(shader, /mixColour/);
  assert.match(shader, /gl_FragColor/);
  assert.doesNotMatch(shader, /uniform vec2 uResolution/);
  assert.doesNotMatch(shader, /uniform float uTime/);
  assert.doesNotMatch(shader, /uniform vec2 uPointer/);
  assert.doesNotMatch(shader, /sampler2D/);
});
```

- [ ] **Step 2: Run focused test and confirm RED**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
```

Expected: shader contract test FAIL because current shader still exposes `uResolution/uTime/uPointer` and the simplified ridge implementation.

- [ ] **Step 3: Replace only the fragment shader source**

Keep this vertex shader:

```ts
export const SILK_VERTEX_SHADER = `
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;
```

Set `SILK_FRAGMENT_SHADER` to the exact GLSL body in:

```text
docs/superpowers/references/2026-08-14-silk-shader-source.glsl.md
```

Do not simplify functions, remove the mediump fallback, change palette logic, or hard-code Weberaise colours into GLSL. Colours remain uniforms.

- [ ] **Step 4: Run the focused test**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
```

Expected: shader-contract test PASS; integration tests may still fail until Task 3 updates `SilkWavesBackground.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/SilkWavesBackground/silkShaders.ts tests/services-capabilities-silk.test.mjs
git commit -m "feat: adopt approved silk shader source"
```

---

### Task 3: Rewire WebGL integration to the packed uniforms and remove cursor behavior

**Files:**
- Modify: `src/components/ui/SilkWavesBackground/SilkWavesBackground.tsx`
- Modify: `tests/services-capabilities-silk.test.mjs`

**Interfaces:**
- Consumes: `SILK_COLORS`, `SILK_PRESET`, `getRenderSize`, `getTailRootMargin`.
- Produces: one fixed WebGL1 background with exact preset values and no pointer listeners.

- [ ] **Step 1: Add failing integration assertions**

Expand `silk background owns one raw-WebGL RAF lifecycle and safe fallbacks` with:

```js
assert.match(source, /SILK_COLORS/);
assert.match(source, /SILK_PRESET/);
assert.match(source, /uniform3fv/);
assert.match(source, /uniform4f/);
assert.match(source, /gl\.drawArrays\(gl\.TRIANGLES, 0, 3\)/);
assert.doesNotMatch(source, /pointermove/);
assert.doesNotMatch(source, /pointerleave/);
assert.doesNotMatch(source, /finePointerQuery/);
assert.doesNotMatch(source, /dampScalar/);
```

Add a source check for fullscreen-triangle geometry:

```js
assert.match(source, /-1, -1,[\s\S]*3, -1,[\s\S]*-1, 3/);
```

- [ ] **Step 2: Run focused test and confirm RED**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
```

Expected: FAIL because current integration draws 6 vertices, listens to pointer events, and uploads only three old uniforms.

- [ ] **Step 3: Replace the `Uniforms` type**

Use:

```ts
type Uniforms = {
  colors: WebGLUniformLocation;
  scene: WebGLUniformLocation;
  shape: WebGLUniformLocation;
  surface: WebGLUniformLocation;
  finish: WebGLUniformLocation;
  transform: WebGLUniformLocation;
  space: WebGLUniformLocation;
  cursor: WebGLUniformLocation;
};
```

Import:

```ts
import { SILK_COLORS, SILK_PRESET } from './silkPreset';
import { getRenderSize, getTailRootMargin } from './silkMath';
```

- [ ] **Step 4: Switch geometry to one fullscreen triangle**

Replace the 6-vertex rectangle data with:

```ts
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    -1, -1,
     3, -1,
    -1,  3,
  ]),
  gl.STATIC_DRAW,
);
```

Keep the same `aPosition` attribute pointer.

- [ ] **Step 5: Resolve packed uniform locations**

Use:

```ts
uniforms = {
  colors: requireUniform(gl, program, 'u_colors[0]'),
  scene: requireUniform(gl, program, 'u_scene'),
  shape: requireUniform(gl, program, 'u_shape'),
  surface: requireUniform(gl, program, 'u_surface'),
  finish: requireUniform(gl, program, 'u_finish'),
  transform: requireUniform(gl, program, 'u_transform'),
  space: requireUniform(gl, program, 'u_space'),
  cursor: requireUniform(gl, program, 'u_cursor'),
};
```

Build an 8-colour flat array once after program creation:

```ts
const activeColors = SILK_COLORS.flat();
const last = SILK_COLORS[SILK_COLORS.length - 1];
const colorData = new Float32Array([
  ...activeColors,
  ...last,
  ...last,
  ...last,
  ...last,
]);
```

The array must contain exactly 24 floats.

- [ ] **Step 6: Upload all static and frame uniforms explicitly**

After `gl.useProgram(program)` and before drawing, upload static recipe vectors:

```ts
gl.uniform3fv(uniforms.colors, colorData);
gl.uniform4f(uniforms.shape, ...SILK_PRESET.shape);
gl.uniform4f(uniforms.surface, ...SILK_PRESET.surface);
gl.uniform4f(uniforms.finish, ...SILK_PRESET.finish);
gl.uniform4f(uniforms.transform, ...SILK_PRESET.transform);
gl.uniform4f(uniforms.space, ...SILK_PRESET.space);
gl.uniform4f(uniforms.cursor, ...SILK_PRESET.cursor);
```

`draw(timeSeconds)` becomes:

```ts
const draw = (timeSeconds: number) => {
  gl.useProgram(program);
  gl.uniform4f(
    uniforms.scene,
    canvas.width,
    canvas.height,
    timeSeconds * SILK_PRESET.timeScale,
    SILK_PRESET.colorCount,
  );
  gl.drawArrays(gl.TRIANGLES, 0, 3);
};
```

Do not multiply time by `0.76` both in `tick` and `draw`; do it exactly once.

- [ ] **Step 7: Remove all cursor-specific runtime code**

Delete:

```text
pointerX
pointerY
pointerTargetX
pointerTargetY
finePointerQuery
onPointerMove
onPointerLeave
window pointermove listener
window pointerleave listener
```

Also remove the `coarseQuery` dependency from `resize` because `getRenderSize` no longer needs it.

Keep reduced-motion and visibility lifecycle logic.

- [ ] **Step 8: Keep reduced motion deterministic**

Continue rendering a fixed time for reduced motion. Keep `4.25` unless browser review demonstrates a visibly poor frame; this is not a motion-tuning task.

- [ ] **Step 9: Run tests/typecheck**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
npm run typecheck
```

Expected: focused tests PASS and TypeScript PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/ui/SilkWavesBackground/SilkWavesBackground.tsx \
  tests/services-capabilities-silk.test.mjs
git commit -m "feat: wire services silk packed uniforms"
```

---

### Task 4: Remove scatter metadata and lock organized capability data

**Files:**
- Modify: `src/components/ServicesPage/capabilitiesModel.ts`
- Modify: `src/components/ServicesPage/CapabilitiesSection.tsx`
- Modify: `tests/services-capabilities-silk.test.mjs`

**Interfaces:**
- Produces: each `CapabilityGroup.items` as an exact four-string tuple in visual/read order.

- [ ] **Step 1: Rewrite model test to reject positional metadata**

Change the capability test to:

```js
test('capabilities preserve three organized disciplines and exact item order', () => {
  assert.deepEqual(
    CAPABILITY_GROUPS.map((group) => group.label),
    ['DESIGN', 'DEVELOPMENT', 'IMPROVEMENT'],
  );

  assert.deepEqual(CAPABILITY_GROUPS.map((group) => group.items), [
    ['Art Direction', 'UI/UX', 'Responsive', 'Motion'],
    ['Frontend', 'CMS', 'Integrations', 'E-commerce'],
    ['Performance', 'SEO Foundations', 'Analytics', 'Iteration'],
  ]);

  assert.ok(CAPABILITY_GROUPS.every((group) => group.items.length === 4));
  assert.ok(CAPABILITY_GROUPS.every((group) =>
    group.items.every((item) => typeof item === 'string'),
  ));
});
```

- [ ] **Step 2: Update the section source contract**

In the Capabilities section test, replace:

```js
assert.match(source, /data-position=/);
```

with:

```js
assert.doesNotMatch(source, /data-position=/);
```

- [ ] **Step 3: Run focused test and confirm RED**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
```

Expected: FAIL because items are still objects containing `position`.

- [ ] **Step 4: Simplify `capabilitiesModel.ts`**

Use:

```ts
export type CapabilityGroup = {
  index: '01' | '02' | '03';
  label: 'DESIGN' | 'DEVELOPMENT' | 'IMPROVEMENT';
  items: readonly [string, string, string, string];
};

export const CAPABILITY_GROUPS = [
  {
    index: '01',
    label: 'DESIGN',
    items: ['Art Direction', 'UI/UX', 'Responsive', 'Motion'],
  },
  {
    index: '02',
    label: 'DEVELOPMENT',
    items: ['Frontend', 'CMS', 'Integrations', 'E-commerce'],
  },
  {
    index: '03',
    label: 'IMPROVEMENT',
    items: ['Performance', 'SEO Foundations', 'Analytics', 'Iteration'],
  },
] as const satisfies readonly CapabilityGroup[];
```

Remove `CapabilityPosition` and `CapabilityItem`.

- [ ] **Step 5: Simplify `CapabilitiesSection.tsx` rendering**

Change the item map to:

```tsx
<ul className={styles.list}>
  {group.items.map((item) => (
    <li className={styles.item} key={item}>
      <span className={styles.name}>{item}</span>
    </li>
  ))}
</ul>
```

Do not change copy, heading semantics, group labels, or accessibility structure.

- [ ] **Step 6: Run focused tests and typecheck**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ServicesPage/capabilitiesModel.ts \
  src/components/ServicesPage/CapabilitiesSection.tsx \
  tests/services-capabilities-silk.test.mjs
git commit -m "refactor: organize services capability data"
```

---

### Task 5: Replace scatter CSS with a disciplined 2×2 capability grid

**Files:**
- Modify: `src/components/ServicesPage/CapabilitiesSection.module.css`
- Modify: `tests/services-capabilities-silk.test.mjs`

**Interfaces:**
- Desktop: `.list` is a 2-column × 2-row grid.
- Mobile: `.list` is one column.

- [ ] **Step 1: Add failing CSS structure assertions**

Replace the old `data-position` CSS assertions with:

```js
assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
assert.match(css, /column-gap:\s*clamp\(/);
assert.match(css, /row-gap:\s*clamp\(/);
assert.doesNotMatch(css, /data-position=/);
assert.doesNotMatch(css, /margin-left:\s*(4|22|34|42|62)%/);
assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*grid-template-columns:\s*1fr/);
```

Keep assertions for `letter-spacing`, `font-weight`, `prefers-reduced-motion`, coarse pointer, and no sticky positioning.

- [ ] **Step 2: Run focused test and confirm RED**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
```

Expected: FAIL because the stylesheet still uses scatter offsets.

- [ ] **Step 3: Replace `.list` and `.item` layout rules**

Use the desktop baseline:

```css
.list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: clamp(56px, 8vw, 140px);
  row-gap: clamp(34px, 5svh, 58px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.item {
  min-width: 0;
  color: rgb(255 255 255 / 88%);
}

.name {
  display: inline-block;
  max-width: 100%;
  font: 520 clamp(40px, 4.7vw, 76px)/.94 var(--font-hero), Arial, sans-serif;
  letter-spacing: -.052em;
  transition:
    transform 300ms cubic-bezier(.22, 1, .36, 1),
    letter-spacing 300ms cubic-bezier(.22, 1, .36, 1),
    font-weight 300ms cubic-bezier(.22, 1, .36, 1),
    color 300ms ease;
}
```

Delete every `[data-position='...']` rule at desktop/tablet/mobile breakpoints.

- [ ] **Step 4: Keep group rhythm spacious but systematic**

Retain the existing intro and group structure, but tune the group spacing around this range:

```css
.groups {
  display: grid;
  gap: clamp(108px, 14svh, 164px);
}

.groupLabel {
  margin-bottom: clamp(46px, 6svh, 68px);
}
```

Do not add dividers/cards just to create organization. The grid alignment is the organizing device.

- [ ] **Step 5: Restrain hover so alignment remains intact**

Use:

```css
@media (hover: hover) and (pointer: fine) {
  .item:hover .name {
    color: #fff;
    font-weight: 620;
    letter-spacing: -.06em;
    transform: translateX(3px);
  }
}
```

Do not change grid placement on hover.

- [ ] **Step 6: Add a clean one-column mobile fallback**

At `720px` as the first implementation breakpoint:

```css
@media (max-width: 720px) {
  .section {
    min-height: 0;
    padding: clamp(104px, 14svh, 136px) 18px clamp(104px, 14svh, 140px);
  }

  .intro {
    width: 100%;
    margin-bottom: clamp(82px, 11svh, 116px);
  }

  .list {
    grid-template-columns: 1fr;
    row-gap: clamp(28px, 4.6svh, 42px);
  }

  .name {
    font-size: clamp(36px, 11vw, 50px);
    line-height: .96;
  }
}
```

If 720px browser QA makes 768px tablet unnecessarily stack, adjust only after checking the actual 768×1024 view.

- [ ] **Step 7: Keep touch/reduced-motion rules**

Preserve:

```css
@media (pointer: coarse) {
  .name { transition: none; }
}

@media (prefers-reduced-motion: reduce) {
  .name { transition-duration: 1ms; }
  .item:hover .name { transform: none; }
}
```

- [ ] **Step 8: Run focused test and typecheck**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/ServicesPage/CapabilitiesSection.module.css tests/services-capabilities-silk.test.mjs
git commit -m "feat: organize services capabilities grid"
```

---

### Task 6: Protect the transition, fixed-canvas lifecycle, and blank Contact reserve against regression

**Files:**
- Modify only if tests reveal a real regression: `src/components/ServicesPage/ServicesTailEnvironment.module.css`
- Modify only if tests reveal a real regression: `src/components/ui/SilkWavesBackground/SilkWavesBackground.module.css`
- Modify: `tests/services-capabilities-silk.test.mjs`

**Interfaces:**
- Tail transition stays ~40vh.
- Silk root stays fixed and behind content.
- Contact reserve remains blank.

- [ ] **Step 1: Strengthen structural tests without changing production code first**

Keep/add assertions:

```js
assert.match(tailCss, /height:\s*40vh/);
assert.match(tailCss, /linear-gradient/);
assert.match(tailCss, /contactReserve/);
assert.match(tailCss, /82svh/);
assert.match(shaderCss, /position:\s*fixed/);
assert.match(shaderCss, /inset:\s*0/);
assert.match(shaderCss, /pointer-events:\s*none/);
assert.doesNotMatch(tailSource, />\s*(LET.S TALK|HAVE SOMETHING|CONTACT)\s*</i);
```

- [ ] **Step 2: Run focused test**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
```

Expected: PASS without production changes. If it fails, investigate the actual regression before editing.

- [ ] **Step 3: Do not commit a no-op production change**

If tests pass, fold the test-only change into the final verification commit or previous test commit. Do not touch tail/shader CSS merely to create a commit.

---

### Task 7: Full automated verification

**Files:** none unless failures identify defects.

- [ ] **Step 1: Run the focused Services-tail tests**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
```

Expected: all tests PASS, zero failures.

- [ ] **Step 2: Run the full repository tests**

```bash
npm test
```

Expected: zero failures.

- [ ] **Step 3: Run TypeScript verification**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 5: Search for removed scatter/pointer implementation remnants**

Run:

```bash
grep -RniE "data-position|CapabilityPosition|pointerTarget|finePointerQuery|dampScalar|uResolution|uTime|uPointer" \
  src/components/ServicesPage/CapabilitiesSection.tsx \
  src/components/ServicesPage/capabilitiesModel.ts \
  src/components/ServicesPage/CapabilitiesSection.module.css \
  src/components/ui/SilkWavesBackground || true
```

Expected: no obsolete implementation matches. References inside historical docs are irrelevant and should not be included in this grep.

- [ ] **Step 6: Verify diff scope**

```bash
git diff --stat <baseline>...HEAD
git diff <baseline>...HEAD -- \
  src/components/ui/SilkWavesBackground \
  src/components/ServicesPage/CapabilitiesSection.tsx \
  src/components/ServicesPage/CapabilitiesSection.module.css \
  src/components/ServicesPage/capabilitiesModel.ts \
  tests/services-capabilities-silk.test.mjs
```

Expected: only the approved shader/capabilities/refinement files plus documentation changes.

---

### Task 8: Browser art-direction QA and minimal tuning

**Files:** tune only the already-approved shader preset/layout files; do not expand scope.

- [ ] **Step 1: Launch local dev server**

```bash
npm run dev
```

Open `/services` and scroll from `VIEW OUR WORK` through the full Capabilities section and blank Contact reserve.

- [ ] **Step 2: Verify shader behavior at 1440×900**

Check all of the following:

```text
- no WebGL/IntersectionObserver console errors
- Works CTA still ends against convincing plain black
- black develops gradually into Silk over the existing transition
- Silk stays fixed to viewport while content scrolls
- flow resembles the supplied Silk reference rather than the old ridge approximation
- palette reads blue/navy, never purple
- brightest folds remain blue, not cyan-white
- cursor movement causes absolutely no shader reaction
- motion continues when page scroll stops
- tab hide pauses RAF and return resumes without a visual reset
- no visible rectangular shader boundary
```

If the shader feels too bright, first lower the high palette stop slightly; do **not** change shader mathematics. If it feels too dark, first raise the third/fourth blue stops slightly. Do not reintroduce pointer behavior or warp.

- [ ] **Step 3: Verify capability organization at 1440×900**

Each discipline must visually read as:

```text
LABEL
left item        right item
left item        right item
```

Check:

```text
- Art Direction aligns with Responsive
- UI/UX aligns with Motion
- Frontend aligns with Integrations
- CMS aligns with E-commerce
- Performance aligns with Analytics
- SEO Foundations aligns with Iteration
- no capability appears detached from its group
- groups have enough breathing room but do not feel randomly sparse
- heading remains subordinate to the service masthead
- hover shift is tiny and does not visually break columns
```

- [ ] **Step 4: Verify 1280×800 and 768×1024**

At 1280×800 keep 2 columns unless text collision occurs.

At 768×1024 decide based on actual rendered `SEO Foundations` width:

- if the 2-column grid remains comfortable, keep it;
- if it becomes cramped, move the one-column breakpoint upward from 720px to a value within 680-760px only.

Do not create a third intermediate scatter layout.

- [ ] **Step 5: Verify 390×844 mobile**

Check:

```text
- one-column capability sequence
- no indentation tricks
- no horizontal overflow
- readable large type without clipping
- shader remains blue-oriented and performant
- transition still reads as gradual black-to-Silk
```

- [ ] **Step 6: Verify reduced motion**

Enable `prefers-reduced-motion: reduce` and confirm:

```text
- Silk renders a deterministic static frame
- no RAF-driven visible movement
- no capability hover translation
- content remains visually deliberate
```

- [ ] **Step 7: Verify fallback/context loss**

Disable WebGL or trigger context loss in devtools if practical. Confirm fallback remains dark blue/black, text remains readable, and page structure does not collapse.

- [ ] **Step 8: Make only evidence-based tuning changes**

Allowed tuning after browser evidence:

```text
- four blue palette stops
- Capabilities font size within the approved range
- group/list row/column gaps
- one-column breakpoint within ~680-760px
- section vertical spacing
```

Do not tune the supplied shader formulas, preset vectors, cursor state, or transition concept unless the user explicitly changes direction.

- [ ] **Step 9: Re-run automated verification after any visual tuning**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
npm test
npm run typecheck
npm run build
```

Expected: all green.

- [ ] **Step 10: Final refinement commit**

```bash
git add src/components/ui/SilkWavesBackground \
  src/components/ServicesPage/CapabilitiesSection.tsx \
  src/components/ServicesPage/CapabilitiesSection.module.css \
  src/components/ServicesPage/capabilitiesModel.ts \
  tests/services-capabilities-silk.test.mjs
git commit -m "fix: refine services silk and capabilities layout"
```

Only create this final commit if browser QA caused real tuning changes; otherwise do not create an empty/no-op commit.

---

## Final Acceptance Checklist

Implementation is complete only when all of these are true:

```text
SHADER
[ ] exact approved Silk fragment shader source is used
[ ] one fullscreen WebGL1 triangle
[ ] palette = #01040A / #03132D / #0A3D91 / #2878F6 unless browser-approved tuning adjusts only these stops
[ ] packed uniform vectors match the approved preset
[ ] cursor presence = 0; no pointer listeners remain
[ ] DPR cap = 2
[ ] fixed viewport canvas preserved
[ ] hidden-tab pause preserved
[ ] valid IntersectionObserver rootMargin preserved
[ ] reduced-motion static frame preserved
[ ] fallback/context-loss path preserved

CAPABILITIES
[ ] no position/scatter metadata exists
[ ] exact 12 capability names remain
[ ] each desktop/tablet discipline is a clear 2x2 grid
[ ] mobile is one clean column
[ ] no cards/pills/dividers were introduced as substitute structure
[ ] hover stays typographic and restrained
[ ] no horizontal overflow

PAGE INTEGRATION
[ ] Works Bridge unchanged
[ ] Work CTA unchanged
[ ] black-to-Silk transition remains subtle
[ ] Contact reserve remains blank
[ ] shader continues through that reserve for later CTA design

VERIFICATION
[ ] focused Services-tail tests pass
[ ] full npm test passes
[ ] npm run typecheck passes
[ ] npm run build passes
[ ] browser QA completed at 1440x900, 1280x800, 768x1024, 390x844
[ ] reduced motion checked
[ ] WebGL fallback checked
```
