# Services Capabilities + Silk Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current approximate Silk background with the exact approved Silk shader mechanics using a Weberaise-blue palette, and replace the scattered Capabilities layout with an organized two-column-by-two-row structure per discipline while preserving the fixed-canvas transition and blank future Contact CTA reserve.

**Architecture:** Keep the current route composition unchanged: one fixed `SilkWavesBackground` behind one `ServicesTailEnvironment`, with `CapabilitiesSection` as normal-flow semantic content and a blank downstream Contact reserve. Refine shader source/preset/runtime as one atomic unit so no commit leaves the browser with mismatched GLSL uniforms. Separately simplify capability data and layout from positional scatter to a repeatable grid.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, CSS Modules, plain WebGL1, Node test runner + `tsx`.

## Global Constraints

- Work on `feature/services-opening-grid` from commit `e044e11f86945233d70a204bea3b9347febe4749` or later.
- Authoritative refinement spec: `docs/superpowers/specs/2026-08-14-services-capabilities-silk-refinement-design.md`.
- Approved fragment source: `docs/superpowers/references/2026-08-14-silk-shader-source.glsl.md`.
- Do not touch Services MenuToGrid choreography, service preview behavior, DriftWall, Works copy, or `VIEW OUR WORK` behavior.
- Do not design or implement the final Contact CTA. Preserve the blank Contact reserve.
- Keep one fixed viewport shader canvas shared by Capabilities and the future Contact CTA.
- Preserve the current long black-to-Silk transition after Works.
- Plain WebGL1 only; one fullscreen triangle; no WebGL library.
- Cursor interaction is fully off.
- Device pixel ratio ceiling is exactly `2`.
- Pause RAF while `document.hidden`; preserve reduced-motion, IntersectionObserver, valid pixel `rootMargin`, context-loss, and fallback behavior.
- Shader colours low→high: `#01040A`, `#03132D`, `#0A3D91`, `#2878F6`.
- Packed preset: `u_scene=(width,height,seconds*0.76,4)`, `u_shape=(1.26,.28,.50,0)`, `u_surface=(2.40,1.11,0,1)`, `u_finish=(0,0,0,.05)`, `u_transform=(1581,0,0,0)`, `u_space=(0,0,0,0)`, `u_cursor=(0,2,.65,.46)`.
- Exact capability groups/names stay unchanged.
- Desktop/suitable tablet: each discipline is one organized 2-column × 2-row grid.
- Mobile: one clean column at a browser-tuned breakpoint in the ~680–760px range.
- Capability hover is typography-only and restrained.

---

## File Structure

**Create:**
- `src/components/ui/SilkWavesBackground/silkPreset.ts` — one source of truth for palette and packed uniform values.

**Modify:**
- `src/components/ui/SilkWavesBackground/silkMath.ts` — DPR cap 2 and root-margin helper only.
- `src/components/ui/SilkWavesBackground/silkShaders.ts` — approved fragment shader + existing minimal vertex shader.
- `src/components/ui/SilkWavesBackground/SilkWavesBackground.tsx` — fullscreen triangle, packed uniforms, no pointer runtime, retained lifecycle.
- `src/components/ServicesPage/capabilitiesModel.ts` — remove scatter position metadata.
- `src/components/ServicesPage/CapabilitiesSection.tsx` — remove `data-position` usage.
- `src/components/ServicesPage/CapabilitiesSection.module.css` — organized 2×2 groups and mobile stack.
- `tests/services-capabilities-silk.test.mjs` — contracts for exact shader/preset/runtime/layout.

**Do not modify unless a failing verification proves necessary:**
- `src/components/ServicesPage/ServicesTailEnvironment.tsx`
- `src/components/ServicesPage/ServicesTailEnvironment.module.css`
- `src/components/ui/SilkWavesBackground/SilkWavesBackground.module.css`
- `src/app/services/page.tsx`
- `src/app/services/ServicesRoute.module.css`
- any `WorksBridge*` or existing `ServicesPage*` file.

---

### Task 1: Lock the blue Silk preset and DPR contract

**Files:**
- Create: `src/components/ui/SilkWavesBackground/silkPreset.ts`
- Modify: `src/components/ui/SilkWavesBackground/silkMath.ts`
- Modify: `src/components/ui/SilkWavesBackground/SilkWavesBackground.tsx` only to update the `getRenderSize` call signature; do not change GLSL runtime yet.
- Modify: `tests/services-capabilities-silk.test.mjs`

**Interfaces:**
- Produces `SILK_COLORS`, `SILK_PRESET`.
- Produces `getRenderSize(width, height, devicePixelRatio)`.
- Preserves `getTailRootMargin(viewportHeight)`.

- [ ] **Step 1: Write failing preset/render-size tests**

Add:

```js
const { SILK_COLORS, SILK_PRESET } = await import(
  moduleUrl('src/components/ui/SilkWavesBackground/silkPreset.ts')
);
```

Replace the old DPR/pointer-damping test with:

```js
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
```

Keep the existing root-margin regression test.

- [ ] **Step 2: Verify RED**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
```

Expected: FAIL because `silkPreset.ts` is missing and old DPR caps are 1.5/1.2.

- [ ] **Step 3: Create `silkPreset.ts`**

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

- [ ] **Step 4: Simplify `silkMath.ts`**

Replace it with:

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

Remove `dampScalar` only after Task 2 removes its final import/use.

- [ ] **Step 5: Keep the app type-correct before committing**

In `SilkWavesBackground.tsx`, change only the render-size call from four arguments to three:

```ts
const renderSize = getRenderSize(
  rect.width || window.innerWidth,
  rect.height || window.innerHeight,
  window.devicePixelRatio,
);
```

Do not yet remove `coarseQuery`; Task 2 removes all pointer/coarse-only runtime together.

- [ ] **Step 6: Verify GREEN**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
npm run typecheck
```

Expected: focused tests PASS and typecheck exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/SilkWavesBackground/silkPreset.ts \
  src/components/ui/SilkWavesBackground/silkMath.ts \
  src/components/ui/SilkWavesBackground/SilkWavesBackground.tsx \
  tests/services-capabilities-silk.test.mjs
git commit -m "test: lock services silk preset"
```

---

### Task 2: Atomically replace shader source and WebGL runtime

**Files:**
- Modify: `src/components/ui/SilkWavesBackground/silkShaders.ts`
- Modify: `src/components/ui/SilkWavesBackground/SilkWavesBackground.tsx`
- Modify: `src/components/ui/SilkWavesBackground/silkMath.ts`
- Modify: `tests/services-capabilities-silk.test.mjs`
- Reference: `docs/superpowers/references/2026-08-14-silk-shader-source.glsl.md`

**Interfaces:**
- Fragment uniforms: `u_colors[8]`, `u_scene`, `u_shape`, `u_surface`, `u_finish`, `u_transform`, `u_space`, `u_cursor`.
- Geometry: one fullscreen triangle using `aPosition`.
- Runtime: no pointer listeners/state.

- [ ] **Step 1: Write failing shader/runtime tests**

Replace the old simplified shader test with:

```js
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
```

Expand the lifecycle test:

```js
assert.match(source, /SILK_COLORS/);
assert.match(source, /SILK_PRESET/);
assert.match(source, /uniform3fv/);
assert.match(source, /uniform4f/);
assert.match(source, /gl\.drawArrays\(gl\.TRIANGLES, 0, 3\)/);
assert.match(source, /-1, -1,[\s\S]*3, -1,[\s\S]*-1,\s*3/);
assert.doesNotMatch(source, /pointermove/);
assert.doesNotMatch(source, /pointerleave/);
assert.doesNotMatch(source, /finePointerQuery/);
assert.doesNotMatch(source, /dampScalar/);
```

- [ ] **Step 2: Verify RED**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
```

Expected: FAIL against the old `uResolution/uTime/uPointer`, 6-vertex rectangle, and pointer listeners.

- [ ] **Step 3: Replace the fragment shader source exactly**

Keep the existing minimal vertex shader:

```ts
export const SILK_VERTEX_SHADER = `
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;
```

Replace `SILK_FRAGMENT_SHADER` with the GLSL body stored in:

```text
docs/superpowers/references/2026-08-14-silk-shader-source.glsl.md
```

Do not rewrite its noise, palette, OKLab, cursor branches, grain, precision fallback, or post-processing formulas. Cursor remains disabled by uniforms, not by editing the shader body.

- [ ] **Step 4: Replace the runtime `Uniforms` type**

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

Imports become:

```ts
import { getRenderSize, getTailRootMargin } from './silkMath';
import { SILK_COLORS, SILK_PRESET } from './silkPreset';
import { SILK_FRAGMENT_SHADER, SILK_VERTEX_SHADER } from './silkShaders';
```

- [ ] **Step 5: Switch to one fullscreen triangle**

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

The final draw call is:

```ts
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

- [ ] **Step 6: Resolve packed uniforms**

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

Construct 8 deterministic colours once:

```ts
const lastColor = SILK_COLORS[SILK_COLORS.length - 1];
const colorData = new Float32Array([
  ...SILK_COLORS.flat(),
  ...lastColor,
  ...lastColor,
  ...lastColor,
  ...lastColor,
]);
```

Assert manually while coding that `colorData.length === 24`.

- [ ] **Step 7: Upload static preset uniforms once after program creation**

```ts
gl.uniform3fv(uniforms.colors, colorData);
gl.uniform4f(uniforms.shape, ...SILK_PRESET.shape);
gl.uniform4f(uniforms.surface, ...SILK_PRESET.surface);
gl.uniform4f(uniforms.finish, ...SILK_PRESET.finish);
gl.uniform4f(uniforms.transform, ...SILK_PRESET.transform);
gl.uniform4f(uniforms.space, ...SILK_PRESET.space);
gl.uniform4f(uniforms.cursor, ...SILK_PRESET.cursor);
```

- [ ] **Step 8: Upload only `u_scene` per frame**

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

Multiply by `0.76` exactly once here.

- [ ] **Step 9: Remove all pointer/coarse runtime from Silk**

Delete:

```text
pointerX
pointerY
pointerTargetX
pointerTargetY
coarseQuery
finePointerQuery
onPointerMove
onPointerLeave
window pointermove listener
window pointerleave listener
```

Delete the `dampScalar` import and then delete `dampScalar` from `silkMath.ts`.

Do not remove pointer code from unrelated components such as DriftWall.

- [ ] **Step 10: Preserve lifecycle behavior**

Keep:

```text
ResizeObserver
IntersectionObserver with getTailRootMargin(window.innerHeight)
document visibilitychange handling
prefers-reduced-motion media query
webglcontextlost fallback
RAF stop/start logic
fixed reduced-motion frame
```

Current reduced-motion static time `4.25` can remain.

- [ ] **Step 11: Verify GREEN before commit**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
npm run typecheck
```

Then run the app once because mismatched GLSL uniforms are runtime-only:

```bash
npm run dev
```

Open `/services` and confirm no shader compile/link/missing-uniform error appears in the console.

- [ ] **Step 12: Commit**

```bash
git add src/components/ui/SilkWavesBackground/silkShaders.ts \
  src/components/ui/SilkWavesBackground/SilkWavesBackground.tsx \
  src/components/ui/SilkWavesBackground/silkMath.ts \
  tests/services-capabilities-silk.test.mjs
git commit -m "feat: adopt approved services silk shader"
```

---

### Task 3: Remove scatter metadata from capabilities

**Files:**
- Modify: `src/components/ServicesPage/capabilitiesModel.ts`
- Modify: `src/components/ServicesPage/CapabilitiesSection.tsx`
- Modify: `tests/services-capabilities-silk.test.mjs`

**Interfaces:**
- `CapabilityGroup.items` becomes an exact four-string tuple in visual/read order.

- [ ] **Step 1: Write the failing model contract**

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

Update the source contract:

```js
assert.doesNotMatch(source, /data-position=/);
```

- [ ] **Step 2: Verify RED**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
```

Expected: FAIL because items are still `{name, position}` objects.

- [ ] **Step 3: Simplify the model**

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

Delete `CapabilityPosition` and `CapabilityItem`.

- [ ] **Step 4: Simplify rendering**

```tsx
<ul className={styles.list}>
  {group.items.map((item) => (
    <li className={styles.item} key={item}>
      <span className={styles.name}>{item}</span>
    </li>
  ))}
</ul>
```

Keep the existing semantic `<section>`, `<h3>`, `<ul>`, and exact copy.

- [ ] **Step 5: Verify GREEN**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ServicesPage/capabilitiesModel.ts \
  src/components/ServicesPage/CapabilitiesSection.tsx \
  tests/services-capabilities-silk.test.mjs
git commit -m "refactor: remove capability scatter metadata"
```

---

### Task 4: Replace scatter CSS with a repeatable 2×2 discipline grid

**Files:**
- Modify: `src/components/ServicesPage/CapabilitiesSection.module.css`
- Modify: `tests/services-capabilities-silk.test.mjs`

**Interfaces:**
- Desktop/suitable tablet `.list`: 2 columns.
- Mobile `.list`: 1 column.

- [ ] **Step 1: Write failing layout assertions**

Replace old position assertions with:

```js
assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
assert.match(css, /column-gap:\s*clamp\(/);
assert.match(css, /row-gap:\s*clamp\(/);
assert.doesNotMatch(css, /data-position=/);
assert.doesNotMatch(css, /margin-left:\s*(4|7|13|22|34|42|62)(%|vw)/);
assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*grid-template-columns:\s*1fr/);
```

Keep checks for `letter-spacing`, `font-weight`, `prefers-reduced-motion`, coarse pointer, and absence of sticky/fixed section positioning.

- [ ] **Step 2: Verify RED**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
```

- [ ] **Step 3: Replace the list/item/name baseline**

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

Delete every `[data-position='left'|'mid'|'right']` rule from all breakpoints.

- [ ] **Step 4: Make whitespace systematic**

Use this starting rhythm:

```css
.groups {
  display: grid;
  gap: clamp(108px, 14svh, 164px);
}

.groupLabel {
  display: flex;
  gap: 10px;
  margin: 0 0 clamp(46px, 6svh, 68px);
}
```

Keep the existing technical label styling. Do not add capability cards, item borders, or pills.

- [ ] **Step 5: Restrain hover to typography only**

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

- [ ] **Step 6: Add one clean mobile mode**

Start with 720px:

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

Keep touch/reduced-motion behavior:

```css
@media (pointer: coarse) {
  .name { transition: none; }
}

@media (prefers-reduced-motion: reduce) {
  .name { transition-duration: 1ms; }
  .item:hover .name { transform: none; }
}
```

- [ ] **Step 7: Verify GREEN**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
npm run typecheck
```

- [ ] **Step 8: Commit**

```bash
git add src/components/ServicesPage/CapabilitiesSection.module.css \
  tests/services-capabilities-silk.test.mjs
git commit -m "feat: organize services capabilities grid"
```

---

### Task 5: Protect fixed-canvas transition and future Contact reserve

**Files:**
- Modify: `tests/services-capabilities-silk.test.mjs`
- Production files only if this test exposes an actual regression.

**Interfaces:**
- Fixed canvas remains behind content.
- Transition veil remains ~40vh.
- Contact reserve remains blank and ~82svh desktop baseline.

- [ ] **Step 1: Strengthen regression assertions**

```js
const tailSource = read('src/components/ServicesPage/ServicesTailEnvironment.tsx');
const tailCss = read('src/components/ServicesPage/ServicesTailEnvironment.module.css');
const shaderCss = read('src/components/ui/SilkWavesBackground/SilkWavesBackground.module.css');

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

Expected: PASS without production edits. If it fails, investigate the exact regression; do not change tail structure merely to satisfy a brittle regex.

- [ ] **Step 3: Commit only if the test file changed**

```bash
git add tests/services-capabilities-silk.test.mjs
git commit -m "test: protect services tail integration"
```

---

### Task 6: Full automated verification

**Files:** none unless verification finds a defect.

- [ ] **Step 1: Focused tests**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
```

Expected: zero failures.

- [ ] **Step 2: Full test suite**

```bash
npm test
```

Expected: zero failures.

- [ ] **Step 3: TypeScript**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 4: Production build**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 5: Obsolete-code scan**

```bash
grep -RniE "data-position|CapabilityPosition|pointerTarget|finePointerQuery|dampScalar|uResolution|uTime|uPointer" \
  src/components/ServicesPage/CapabilitiesSection.tsx \
  src/components/ServicesPage/capabilitiesModel.ts \
  src/components/ServicesPage/CapabilitiesSection.module.css \
  src/components/ui/SilkWavesBackground || true
```

Expected: no obsolete implementation matches.

- [ ] **Step 6: Scope check**

Use the commit immediately before implementation as `<baseline>`:

```bash
git diff --stat <baseline>...HEAD
git diff --name-only <baseline>...HEAD
```

Expected production changes only in:

```text
src/components/ui/SilkWavesBackground/*
src/components/ServicesPage/capabilitiesModel.ts
src/components/ServicesPage/CapabilitiesSection.tsx
src/components/ServicesPage/CapabilitiesSection.module.css
tests/services-capabilities-silk.test.mjs
```

Documentation commits are expected separately. No Works/Services choreography file should appear.

---

### Task 7: Browser art-direction QA and evidence-based tuning

**Files:** tune only approved shader palette/layout files if browser evidence requires it.

- [ ] **Step 1: Launch**

```bash
npm run dev
```

Open `/services` and scroll from `VIEW OUR WORK` through the full Capabilities section and blank reserve.

- [ ] **Step 2: 1440×900 shader check**

Confirm:

```text
no WebGL/IntersectionObserver console error
Works CTA still resolves on true black
black fades gradually into Silk
canvas remains viewport-fixed
flow resembles approved Silk source, not old ridge approximation
palette is clearly blue/navy, not purple
bright folds remain blue rather than white/cyan
cursor has zero visible effect
motion continues when scroll stops
no rectangular canvas edge appears
```

Tuning rule: if colour needs adjustment, change only `SILK_COLORS` first. Do not change shader formulas or packed preset vectors without explicit user direction.

- [ ] **Step 3: 1440×900 capability check**

Each group must visibly read:

```text
01 // GROUP
left item                  right item
left item                  right item
```

Specifically verify alignment pairs:

```text
Art Direction ↕ Responsive
UI/UX         ↕ Motion
Frontend      ↕ Integrations
CMS           ↕ E-commerce
Performance   ↕ Analytics
SEO Foundations ↕ Iteration
```

Also verify no capability feels detached, spacing is generous but repeatable, and hover does not disturb the column structure.

- [ ] **Step 4: 1280×800 and 768×1024**

Keep 2 columns at 1280.

At 768, inspect `SEO Foundations`. If the 2-column layout is comfortable, keep it. If cramped, move the stack breakpoint upward only within approximately 680–760px. Do not invent another staggered mode.

- [ ] **Step 5: 390×844**

Confirm one-column sequence, no indentation, no horizontal overflow, readable large type, and stable shader performance.

- [ ] **Step 6: Reduced motion**

Confirm shader is a deterministic static frame and capability hover translation is removed/reduced as specified.

- [ ] **Step 7: Tab visibility and fallback**

Switch tabs for several seconds and return; confirm no reset/jump/error. Disable WebGL or trigger context loss if practical; confirm dark fallback and readable content.

- [ ] **Step 8: 30-second runtime check**

Leave the Capabilities view stationary for at least 30 seconds. Confirm smooth continuous Silk evolution, no visible time discontinuity, no console spam, and no obvious frame degradation.

- [ ] **Step 9: Re-run all verification after any tuning**

```bash
node --import=tsx --test tests/services-capabilities-silk.test.mjs
npm test
npm run typecheck
npm run build
```

- [ ] **Step 10: Final tuning commit only if real tuning occurred**

```bash
git add src/components/ui/SilkWavesBackground \
  src/components/ServicesPage/CapabilitiesSection.module.css \
  tests/services-capabilities-silk.test.mjs
git commit -m "fix: tune services silk capabilities"
```

Do not create an empty/no-op final commit.

---

## Final Acceptance Checklist

```text
SHADER
[ ] approved fragment source is used
[ ] one fullscreen WebGL1 triangle
[ ] blue palette is #01040A / #03132D / #0A3D91 / #2878F6 unless user-approved browser tuning changes only these stops
[ ] packed preset vectors match the approved source prompt
[ ] cursor presence = 0 and no pointer listeners remain
[ ] DPR cap = 2
[ ] fixed viewport canvas preserved
[ ] hidden-tab RAF pause preserved
[ ] valid pixel IntersectionObserver rootMargin preserved
[ ] reduced-motion static frame preserved
[ ] fallback/context-loss path preserved

CAPABILITIES
[ ] scatter position metadata removed
[ ] all 12 names remain exactly once
[ ] each desktop/suitable-tablet discipline is 2×2
[ ] mobile is one clean column
[ ] no cards/pills were introduced
[ ] hover remains subtle typography only
[ ] no horizontal overflow

PAGE
[ ] Works Bridge unchanged
[ ] VIEW OUR WORK unchanged
[ ] black-to-Silk transition remains subtle
[ ] Contact reserve remains blank and shader-backed

VERIFICATION
[ ] focused tests pass
[ ] full npm test passes
[ ] npm run typecheck passes
[ ] npm run build passes
[ ] browser QA: 1440×900, 1280×800, 768×1024, 390×844
[ ] reduced motion checked
[ ] fallback checked
[ ] 30-second runtime check completed
```
