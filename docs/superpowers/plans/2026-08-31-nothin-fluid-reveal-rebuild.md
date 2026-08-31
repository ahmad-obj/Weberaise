# Nothin-Fidelity Fluid Reveal Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace WEBERAISE's age-aware metaball hero reveal with an independently implemented pressure-projected 2D fluid mask that reproduces the material behavior confirmed in the supplied Nothin production bundle while preserving the existing WEBERAISE hero composition and EXPLORE handoff.

**Architecture:** Keep `HeroRevealCanvas` as the input/lifecycle adapter and preserve the public `RevealEngine` API used by `Hero.tsx` and `exploreTimeline.ts`. Replace the CPU primitive list + one RGBA8 field target with persistent half-float velocity, dye, pressure, and divergence render targets. Pointer/autonomous samples remain interpolated, but each sample is deposited once as Gaussian velocity+dye splats; the GPU field then evolves through advection, divergence, a pressure solve, gradient subtraction, dye dissipation, and a narrow threshold inside the existing WEBERAISE difference compositor.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, native WebGL2 / GLSL ES 3.00, GSAP 3.15.0, Node test runner with `tsx`.

**Spec:** `docs/superpowers/specs/2026-08-31-nothin-reveal-fidelity-design.md`

## Global Constraints

- Work only on `feature/hero-nothin-reveal-fidelity`, branched from `main` @ `dff8870b357e9bc87fe1d87e1a0dc67ca9dcc74c`.
- Preserve `ExperienceShell`, truthful loader choreography, `HeroTypography`, front/reveal registration, navigation, hero vignette, EXPLORE timing, bottom-fill semantics, and the post-hero handoff.
- Full-quality fidelity baseline: simulation `256×256`, dye `512×512`, pressure iterations `20`, velocity retention `0.962` per 60 Hz reference frame, dye retention `0.988` per 60 Hz reference frame, curl strength `0`, Gaussian radius parameter `0.00006`, splat force `5900`, reveal gain `3.9`, threshold start `0.5`, threshold width `0.01`.
- Match Nothin's 60 Hz visual timing while making dissipation/advection timing refresh-rate independent.
- Organicity comes from the evolving fluid field. Do not add FBM, simplex, hash, or sine contour noise to the interactive reveal.
- Do not copy Nothin's minified production source verbatim. Implement standard stable-fluid operations independently from the confirmed architecture and equations.
- No colorful fluid rendering, ripple propagation, splashes, strong curl/vorticity, smoke/fog alpha tails, or synthetic rogue afterglide droplets in full mode.
- Keep pointer work outside React render state.
- Keep the intentional CSS fallback when the required WebGL path cannot initialize.
- `npm test`, `npm run typecheck`, `npm run build`, `git diff --check`, and browser/WebGL QA are required before completion.

---

## File Structure Locked for This Rebuild

### Existing files to modify

- `src/webgl/reveal/quality.ts` — replace primitive/lifetime knobs with fluid profiles.
- `src/webgl/reveal/math.ts` — add reference-frame timing conversion.
- `src/webgl/reveal/shaders.ts` — retain final WEBERAISE compositor/bottom fill, but consume dye instead of an implicit field.
- `src/webgl/reveal/RevealEngine.ts` — orchestrate fluid passes while preserving the external hero contract.
- `src/webgl/reveal/createRevealEngine.ts` — capability validation and real solver warm-up.
- `src/components/experience/Hero/HeroRevealCanvas.tsx` — retain interpolation/autonomous input, remove synthetic afterglide, reset input history correctly.
- `tests/experience.test.mjs` — replace primitive-engine assertions once the engine rewrite exists.
- `tests/visual-contract.test.mjs` — replace metaball/contour-warp contracts with fluid contracts.
- `tests/intro-polish.test.mjs` — replace rogue-patch behavior with fluid-native residual-motion integration.
- `tests/interaction-polish.test.mjs` — remove inertia-only tests/import while keeping loader/hero polish tests.
- `docs/ARCHITECTURE.md` — describe the verified fluid architecture after implementation.
- `docs/IMPLEMENTATION_STATUS.md` — record verified production state after implementation.

### New focused files

- `src/webgl/reveal/fluid/types.ts` — render-target and pending-splat types.
- `src/webgl/reveal/fluid/gl.ts` — shader/program/uniform helpers and fullscreen geometry.
- `src/webgl/reveal/fluid/renderTargets.ts` — RGBA16F framebuffer allocation, ping-pong swapping, clear/dispose.
- `src/webgl/reveal/fluid/shaders.ts` — splat, advection, divergence, pressure-Jacobi, gradient-subtraction shaders.
- `tests/fluid-reveal.test.mjs` — deterministic fluid configuration/timing/source-contract tests.

### Files to delete once no references remain

- `src/webgl/reveal/liquidLifetime.ts`
- `src/webgl/reveal/inertia.ts`
- `tests/liquid-lifetime.test.mjs`

`RevealSample`, `pointerEmitter`, `pointerTracker`, `autonomousEmitter`, and `bottomFillEmitter` remain. Their samples become one-time simulation inputs rather than visible long-lived geometry.

---

### Task 1: Lock Fluid Profiles and Refresh-Rate-Independent Timing

**Files:**
- Modify: `src/webgl/reveal/quality.ts`
- Modify: `src/webgl/reveal/math.ts`
- Create: `tests/fluid-reveal.test.mjs`

**Interfaces:**
- Produces `RevealQualityMode = 'full' | 'lite' | 'reduced' | 'fallback'`.
- Produces `RevealQuality` with `simResolution`, `dyeResolution`, `pressureIterations`, `dprCap`, `velocityRetention60`, `dyeRetention60`, `splatRadius`, `splatForce`, `revealGain`, `edgeSoftness`, `edgeWidth`, `enableVelocity`.
- Produces `referenceFrameScale(deltaSeconds, referenceHz = 60): number`.
- Produces `retentionFromReferenceFrame(baseRetention, deltaSeconds, referenceHz = 60): number`.

- [ ] **Step 1: Write the failing profile/timing tests.**

Create `tests/fluid-reveal.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { chooseRevealQuality } from '../src/webgl/reveal/quality.ts';
import {
  referenceFrameScale,
  retentionFromReferenceFrame,
} from '../src/webgl/reveal/math.ts';

test('full profile starts from confirmed Nothin production values', () => {
  const full = chooseRevealQuality({
    width: 1440,
    height: 900,
    dpr: 2,
    reducedMotion: false,
    webgl2: true,
    deviceMemory: 8,
  });

  assert.equal(full.mode, 'full');
  assert.equal(full.simResolution, 256);
  assert.equal(full.dyeResolution, 512);
  assert.equal(full.pressureIterations, 20);
  assert.equal(full.velocityRetention60, 0.962);
  assert.equal(full.dyeRetention60, 0.988);
  assert.equal(full.splatRadius, 0.00006);
  assert.equal(full.splatForce, 5900);
  assert.equal(full.revealGain, 3.9);
  assert.equal(full.edgeSoftness, 0.5);
  assert.equal(full.edgeWidth, 0.01);
  assert.equal(full.enableVelocity, true);
});

test('reference-frame retention matches 60 Hz and is refresh-rate independent', () => {
  assert.ok(Math.abs(referenceFrameScale(1 / 60) - 1) < 1e-9);
  assert.ok(Math.abs(referenceFrameScale(1 / 120) - 0.5) < 1e-9);

  const at60 = retentionFromReferenceFrame(0.988, 1 / 60);
  const twoAt120 = retentionFromReferenceFrame(0.988, 1 / 120) ** 2;
  assert.ok(Math.abs(at60 - 0.988) < 1e-9);
  assert.ok(Math.abs(at60 - twoAt120) < 1e-9);
});

test('lite and reduced profiles preserve mask semantics at lower cost', () => {
  const lite = chooseRevealQuality({
    width: 390,
    height: 844,
    dpr: 3,
    reducedMotion: false,
    webgl2: true,
    deviceMemory: 2,
  });
  const reduced = chooseRevealQuality({
    width: 1440,
    height: 900,
    dpr: 2,
    reducedMotion: true,
    webgl2: true,
    deviceMemory: 8,
  });

  assert.equal(lite.mode, 'lite');
  assert.equal(lite.simResolution, 128);
  assert.equal(lite.dyeResolution, 256);
  assert.equal(lite.pressureIterations, 10);
  assert.equal(lite.edgeSoftness, 0.5);
  assert.equal(lite.edgeWidth, 0.01);

  assert.equal(reduced.mode, 'reduced');
  assert.equal(reduced.enableVelocity, false);
  assert.equal(reduced.pressureIterations, 0);
  assert.equal(reduced.edgeSoftness, 0.5);
  assert.equal(reduced.edgeWidth, 0.01);
});
```

- [ ] **Step 2: Run the focused test and verify RED.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs
```

Expected: FAIL because the fluid properties/timing helpers do not exist.

- [ ] **Step 3: Add timing helpers to `math.ts`.**

```ts
export function referenceFrameScale(deltaSeconds: number, referenceHz = 60): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return 0;
  return Math.min(2, deltaSeconds * Math.max(1, referenceHz));
}

export function retentionFromReferenceFrame(
  baseRetention: number,
  deltaSeconds: number,
  referenceHz = 60,
): number {
  const base = Math.min(1, Math.max(0, baseRetention));
  return Math.pow(base, referenceFrameScale(deltaSeconds, referenceHz));
}
```

The two-reference-frame clamp limits one visible simulation step after a stall. Hidden-tab handling in Task 6 prevents long background gaps from being simulated at all.

- [ ] **Step 4: Replace the primitive quality shape in `quality.ts`.**

```ts
export type RevealQualityMode = 'full' | 'lite' | 'reduced' | 'fallback';

export type RevealQuality = {
  mode: RevealQualityMode;
  simResolution: number;
  dyeResolution: number;
  pressureIterations: number;
  dprCap: number;
  velocityRetention60: number;
  dyeRetention60: number;
  splatRadius: number;
  splatForce: number;
  revealGain: number;
  edgeSoftness: number;
  edgeWidth: number;
  enableVelocity: boolean;
};
```

Use these exact initial profiles:

```ts
const FULL = {
  mode: 'full', simResolution: 256, dyeResolution: 512,
  pressureIterations: 20, dprCap: 2,
  velocityRetention60: 0.962, dyeRetention60: 0.988,
  splatRadius: 0.00006, splatForce: 5900,
  revealGain: 3.9, edgeSoftness: 0.5, edgeWidth: 0.01,
  enableVelocity: true,
} as const;

const LITE = {
  mode: 'lite', simResolution: 128, dyeResolution: 256,
  pressureIterations: 10, dprCap: 1.25,
  velocityRetention60: 0.962, dyeRetention60: 0.988,
  splatRadius: 0.00006, splatForce: 5900,
  revealGain: 3.9, edgeSoftness: 0.5, edgeWidth: 0.01,
  enableVelocity: true,
} as const;

const REDUCED = {
  mode: 'reduced', simResolution: 96, dyeResolution: 192,
  pressureIterations: 0, dprCap: 1,
  velocityRetention60: 0, dyeRetention60: 0.985,
  splatRadius: 0.00008, splatForce: 0,
  revealGain: 3.9, edgeSoftness: 0.5, edgeWidth: 0.01,
  enableVelocity: false,
} as const;
```

Return fallback with zero simulation dimensions, zero pressure iterations, DPR 1, and `enableVelocity: false`.

- [ ] **Step 5: Run this task's complete gate.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs
npm run typecheck
```

Expected: PASS. Existing tests are intentionally untouched in this task, so no stale engine assertion is made red before the engine task that replaces it.

- [ ] **Step 6: Commit.**

```bash
git add src/webgl/reveal/quality.ts src/webgl/reveal/math.ts tests/fluid-reveal.test.mjs
git commit -m "test: lock Nothin fluid reveal profile"
```

---

### Task 2: Add Half-Float Fluid Render-Target Infrastructure

**Files:**
- Create: `src/webgl/reveal/fluid/types.ts`
- Create: `src/webgl/reveal/fluid/gl.ts`
- Create: `src/webgl/reveal/fluid/renderTargets.ts`
- Modify: `tests/fluid-reveal.test.mjs`

**Interfaces:**
- `createProgram(gl, vertexSource, fragmentSource): ProgramBundle`
- `getUniform(gl, bundle, name): WebGLUniformLocation | null`
- `createFullscreenGeometry(gl): { vao: WebGLVertexArrayObject; buffer: WebGLBuffer }`
- `createFluidTarget(gl, width, height, filter): FluidTarget`
- `createDoubleFluidTarget(gl, width, height, filter): DoubleFluidTarget`
- `clearFluidTarget(gl, target): void`
- `disposeFluidTarget(gl, target): void`
- `disposeDoubleFluidTarget(gl, target): void`

- [ ] **Step 1: Add the failing source contract.**

Append to `tests/fluid-reveal.test.mjs`:

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('fluid targets use renderable half-float ping-pong textures', () => {
  const source = read('src/webgl/reveal/fluid/renderTargets.ts');
  assert.match(source, /RGBA16F/);
  assert.match(source, /HALF_FLOAT/);
  assert.match(source, /framebufferTexture2D/);
  assert.match(source, /FRAMEBUFFER_COMPLETE/);
  assert.match(source, /swap\(\)/);
});
```

- [ ] **Step 2: Run and verify RED.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs
```

Expected: FAIL because `renderTargets.ts` does not exist.

- [ ] **Step 3: Create `fluid/types.ts`.**

```ts
export type FluidTarget = {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
};

export type DoubleFluidTarget = {
  read: FluidTarget;
  write: FluidTarget;
  swap(): void;
};

export type FluidSplat = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  strength: number;
};
```

- [ ] **Step 4: Move reusable WebGL helpers into `fluid/gl.ts`.**

Extract the existing `compileShader`, program linking, cached uniform lookup, and fullscreen quad allocation from `RevealEngine.ts`. Preserve compile/link error throwing. Use a fullscreen triangle-pair quad with attribute location `0`.

- [ ] **Step 5: Implement `createFluidTarget()`.**

Allocate:

```ts
gl.texImage2D(
  gl.TEXTURE_2D,
  0,
  gl.RGBA16F,
  width,
  height,
  0,
  gl.RGBA,
  gl.HALF_FLOAT,
  null,
);
```

Set `CLAMP_TO_EDGE`; use the requested `LINEAR` or `NEAREST`; attach to `COLOR_ATTACHMENT0`; call `checkFramebufferStatus`; throw unless `FRAMEBUFFER_COMPLETE`; immediately clear to `(0,0,0,0)`.

- [ ] **Step 6: Implement ping-pong swapping and disposal.**

`swap()` swaps the `read` and `write` object references only. Disposal deletes each framebuffer and texture exactly once.

- [ ] **Step 7: Run this task's gate.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
git add src/webgl/reveal/fluid tests/fluid-reveal.test.mjs
git commit -m "feat: add fluid render target infrastructure"
```

---

### Task 3: Implement the Independent Fluid Shader Suite and Dye Composite Contract

**Files:**
- Create: `src/webgl/reveal/fluid/shaders.ts`
- Modify: `src/webgl/reveal/shaders.ts`
- Modify: `tests/fluid-reveal.test.mjs`
- Modify: `tests/visual-contract.test.mjs`

**Interfaces:**
- `fluid/shaders.ts` exports `FLUID_VERTEX`, `SPLAT_FRAGMENT`, `ADVECTION_FRAGMENT`, `DIVERGENCE_FRAGMENT`, `PRESSURE_FRAGMENT`, `GRADIENT_SUBTRACT_FRAGMENT`.
- `src/webgl/reveal/shaders.ts` retains `FULLSCREEN_VERTEX` and `COMPOSITE_FRAGMENT` for final WEBERAISE compositing.

- [ ] **Step 1: Replace the stale visual contract and add fluid shader contracts before implementation.**

In `tests/visual-contract.test.mjs`, replace the two old tests that require `FIELD_VERTEX/FIELD_FRAGMENT`, `liquidRadiusScale`, `uSurfaceThreshold`, and `uContourWarp` with:

```js
test('reveal source is a pressure-projected persistent fluid, not implicit primitives', () => {
  const fluid = read('src/webgl/reveal/fluid/shaders.ts');
  assert.match(fluid, /SPLAT_FRAGMENT/);
  assert.match(fluid, /ADVECTION_FRAGMENT/);
  assert.match(fluid, /DIVERGENCE_FRAGMENT/);
  assert.match(fluid, /PRESSURE_FRAGMENT/);
  assert.match(fluid, /GRADIENT_SUBTRACT_FRAGMENT/);
  assert.match(fluid, /exp\(-dot\(/);
  assert.doesNotMatch(fluid, /fbm|simplex|hash\s*\(|vorticity|uCurlStrength/i);
});

test('interactive composite thresholds dye without animated contour noise', () => {
  const shader = read('src/webgl/reveal/shaders.ts');
  assert.match(shader, /uDye/);
  assert.match(shader, /uRevealGain/);
  assert.match(shader, /uEdgeSoftness/);
  assert.match(shader, /uEdgeWidth/);
  assert.doesNotMatch(shader, /uContourWarp|contourWave/);
});
```

Also append the same pass-name contract to `tests/fluid-reveal.test.mjs` so the focused reveal suite owns the low-level requirement.

- [ ] **Step 2: Run and verify RED.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs tests/visual-contract.test.mjs
```

Expected: FAIL because the fluid shader suite does not exist and the composite still consumes `uField`.

- [ ] **Step 3: Implement the Gaussian splat shader independently.**

The splat fragment must implement this behavior with WEBERAISE names/GLSL ES 3.00 syntax:

```glsl
vec2 p = vUv - uPoint;
p.x *= uAspectRatio;
float weight = exp(-dot(p, p) / uRadius);
vec3 base = texture(uTarget, vUv).xyz;
outColor = vec4(base + weight * uColor, 1.0);
```

- [ ] **Step 4: Implement advection with manual bilinear sampling.**

Core semantics:

```glsl
vec2 coord = vUv - uDtFrames * texture(uVelocity, vUv).xy * uTexelSize;
vec4 result = uDissipation * bilerp(uSource, coord, uTexelSize);
outColor = result;
```

`uDtFrames` is the clamped reference-frame scale, not raw seconds.

- [ ] **Step 5: Implement divergence, Jacobi pressure, and gradient subtraction.**

Use centered neighbor differences:

```text
divergence = 0.5 * (rightVelocity.x - leftVelocity.x + topVelocity.y - bottomVelocity.y)
pressure = 0.25 * (leftPressure + rightPressure + topPressure + bottomPressure - divergence)
velocity -= 0.5 * vec2(rightPressure - leftPressure, topPressure - bottomPressure)
```

- [ ] **Step 6: Replace implicit-field composite uniforms.**

Delete `FIELD_VERTEX` and `FIELD_FRAGMENT` from `src/webgl/reveal/shaders.ts`. Interactive composite inputs become:

```glsl
uniform sampler2D uDye;
uniform sampler2D uBrand;
uniform float uRevealGain;
uniform float uEdgeSoftness;
uniform float uEdgeWidth;
```

Interactive mask:

```glsl
float dye = texture(uDye, vUv).r;
float raw = dye * uRevealGain;
float reveal = smoothstep(uEdgeSoftness, uEdgeSoftness + uEdgeWidth, raw);
```

Keep the existing difference-source/brand reconstruction and keep the approved EXPLORE bottom-fill crest. The no-sine rule applies to the interactive liquid edge, not the separate authored exit fill.

- [ ] **Step 7: Run this task's gate.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs tests/visual-contract.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
git add src/webgl/reveal/fluid/shaders.ts src/webgl/reveal/shaders.ts tests/fluid-reveal.test.mjs tests/visual-contract.test.mjs
git commit -m "feat: add Nothin-style fluid shader passes"
```

---

### Task 4: Replace `RevealEngine` Internals With the Persistent Fluid Solver

**Files:**
- Modify: `src/webgl/reveal/RevealEngine.ts`
- Modify: `tests/fluid-reveal.test.mjs`
- Modify: `tests/experience.test.mjs`

**Interfaces:**
- Preserve `constructor(canvas, quality)`.
- Preserve `resize(width, height, dpr)`.
- Preserve `setLayers(layers)`.
- Preserve `emit(samples)`.
- Add `resetInputStream(): void`.
- Preserve `setMode(mode)`.
- Preserve `setBottomFillProgress(progress)` / `getBottomFillProgress()`.
- Preserve `clear()`, `start()`, `stop()`, `dispose()`.
- Add `prime(): void` for loader warm-up.

- [ ] **Step 1: Replace stale engine assertions and add failing solver ownership tests.**

In `tests/experience.test.mjs`, replace the old quality test with assertions for the Task 1 profile and replace `reveal engine rebuilds a bounded implicit field...` with:

```js
test('reveal engine owns persistent pressure-projected fluid state', () => {
  const engine = readProject('src/webgl/reveal/RevealEngine.ts');
  const shaders = readProject('src/webgl/reveal/shaders.ts');
  assert.match(engine, /velocity/);
  assert.match(engine, /dye/);
  assert.match(engine, /pressure/);
  assert.match(engine, /divergence/);
  assert.match(engine, /pressureIterations/);
  assert.match(engine, /pendingSplats/);
  assert.match(engine, /resetInputStream/);
  assert.doesNotMatch(engine, /LiquidPrimitive|liquidRadiusScale|drawArraysInstanced|primitives/);
  assert.match(shaders, /uDye/);
  assert.doesNotMatch(shaders, /FIELD_VERTEX|FIELD_FRAGMENT|uContourWarp/);
});
```

Append the equivalent source-ownership assertions to `tests/fluid-reveal.test.mjs`.

- [ ] **Step 2: Run and verify RED.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs tests/experience.test.mjs
```

Expected: FAIL because `RevealEngine` still uses primitives.

- [ ] **Step 3: Rebuild constructor ownership around the fluid pass graph.**

Create programs for:

```text
splat
advection
divergence
pressure
pressure-gradient subtraction
composite
```

Do not create curl/vorticity programs. The confirmed production `curlStrength` is `0`, so omitting those no-op turbulence passes preserves the intended behavior and reduces cost.

After obtaining WebGL2, require `EXT_color_buffer_float`. Also allocate one test RGBA16F target through `createFluidTarget()`; framebuffer incompleteness must throw so `createRevealEngine()` can use the CSS fallback.

- [ ] **Step 4: Allocate persistent target sets.**

At construction/initial solver setup:

```text
velocity:   double RGBA16F, simResolution², LINEAR
pressure:   double RGBA16F, simResolution², NEAREST
dye:        double RGBA16F, dyeResolution², LINEAR
divergence: single RGBA16F, simResolution², NEAREST
```

Simulation dimensions are profile-fixed squares. Display canvas dimensions remain responsive/DPR-capped separately.

- [ ] **Step 5: Convert `emit()` into one-time splat queuing.**

Add:

```ts
private pendingSplats: FluidSplat[] = [];
private lastInputPoint: { x: number; y: number } | null = null;
```

For every incoming interpolated sample:

```ts
const previous = this.lastInputPoint;
const dx = previous ? sample.x - previous.x : 0;
const dy = previous ? sample.y - previous.y : 0;
this.pendingSplats.push({
  x: sample.x,
  y: 1 - sample.y,
  dx,
  dy: -dy,
  strength: sample.strength,
});
this.lastInputPoint = { x: sample.x, y: sample.y };
```

This is the interpolation normalization rule: splitting one real segment into `N` samples splits its displacement into `N` increments, so total injected momentum remains approximately proportional to the original displacement instead of multiplying force by `N`.

- [ ] **Step 6: Implement input reset.**

```ts
resetInputStream() {
  this.lastInputPoint = null;
}
```

This must not clear dye/velocity state. It only prevents re-entry from creating a giant pointer delta.

- [ ] **Step 7: Implement Gaussian velocity+dye splats.**

For each pending splat in full/lite mode:

```text
velocity uColor = (dx * splatForce, dy * splatForce, 0)
dye uColor = (strength, strength, strength)
uPoint = (x, y)
uRadius = quality.splatRadius
uAspectRatio = cssWidth / cssHeight
```

Draw velocity into `velocity.write`, swap; draw dye into `dye.write`, swap. Reduced mode skips the velocity splat and deposits dye only. Empty `pendingSplats` after application.

- [ ] **Step 8: Implement one solver frame in confirmed Nothin order.**

Track `lastFrameTime: number | null`. On visible frames:

```ts
const deltaSeconds = lastFrameTime === null
  ? 0
  : Math.min(1 / 30, Math.max(0, now - lastFrameTime));
const dtFrames = referenceFrameScale(deltaSeconds, 60);
const velocityDissipation = retentionFromReferenceFrame(
  quality.velocityRetention60,
  deltaSeconds,
  60,
);
const dyeDissipation = retentionFromReferenceFrame(
  quality.dyeRetention60,
  deltaSeconds,
  60,
);
```

Full/lite pass order:

```text
1. apply pending velocity+dye splats
2. advect velocity through velocity; swap
3. advect dye through current velocity; swap
4. compute divergence
5. clear pressure.read to zero
6. run Jacobi pressure `pressureIterations` times, swapping each iteration
7. subtract pressure gradient from velocity; swap
8. render composite from dye.read
```

This intentionally follows the shipped reference ordering where dye advection precedes the current frame's pressure projection.

Reduced mode:

```text
1. apply dye splats
2. decay dye with the advection pass using zero velocity
3. render composite
```

- [ ] **Step 9: Make `clear()` reset all persistent state.**

Clear velocity read/write, pressure read/write, dye read/write, divergence, pending splats, and input history.

- [ ] **Step 10: Preserve bottom-fill behavior without running the solver.**

When `mode === 'bottomFill'`, skip fluid evolution and render only the existing composite/bottom-fill path. `exploreTimeline.ts` already calls `clear()` before switching modes.

- [ ] **Step 11: Implement `prime()`.**

`prime()` runs one zero-input solver pass synchronously against the allocated targets and performs one composite draw without starting RAF. This forces first-use shader/FBO driver validation during loader warm-up.

- [ ] **Step 12: Dispose all fluid resources.**

Delete all programs, framebuffers, textures, fullscreen geometry, and brand texture exactly once.

- [ ] **Step 13: Run this task's gate.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs tests/experience.test.mjs tests/visual-contract.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 14: Commit.**

```bash
git add src/webgl/reveal/RevealEngine.ts tests/fluid-reveal.test.mjs tests/experience.test.mjs
git commit -m "feat: replace metaball reveal with fluid solver"
```

---

### Task 5: Remove Synthetic Afterglide and Let Persistent Fluid State Own Residual Motion

**Files:**
- Modify: `src/components/experience/Hero/HeroRevealCanvas.tsx`
- Modify: `tests/intro-polish.test.mjs`
- Modify: `tests/interaction-polish.test.mjs`
- Delete: `src/webgl/reveal/inertia.ts`
- Delete: `src/webgl/reveal/liquidLifetime.ts`
- Delete: `tests/liquid-lifetime.test.mjs`

**Interfaces:**
- `HeroRevealCanvas` retains `createPointerTracker()` and `createHeroAutonomousStroke()`.
- Pointer/autonomous input calls `engine.emit(samples)`.
- Pointer discontinuities call `engine.resetInputStream()`.
- No CPU timer-based afterglide remains.

- [ ] **Step 1: Replace inertia expectations with a failing fluid-native integration contract.**

Replace the first test in `tests/intro-polish.test.mjs` with:

```js
test('hero delegates residual motion to persistent fluid state', () => {
  const canvas = read('src/components/experience/Hero/HeroRevealCanvas.tsx');
  assert.match(canvas, /createPointerTracker/);
  assert.match(canvas, /engine\.emit\(samples\)/);
  assert.match(canvas, /engine\.resetInputStream\(\)/);
  assert.doesNotMatch(canvas, /createInertialAfterglide|afterglide|inertiaVelocity/);
});
```

In `tests/interaction-polish.test.mjs`, remove the `createInertialAfterglide` import and the two inertia-only tests. Preserve the countdown/loader/hero-layout tests unchanged.

- [ ] **Step 2: Run and verify RED.**

```bash
node --import=tsx --test tests/intro-polish.test.mjs tests/interaction-polish.test.mjs
```

Expected: FAIL because `HeroRevealCanvas` still schedules afterglide.

- [ ] **Step 3: Remove afterglide scheduling from `HeroRevealCanvas`.**

Delete the `createInertialAfterglide` import and all state/timers/functions named `idleTimer`, `afterglideTimers`, `lastSample`, `inertiaVelocity`, `cancelAfterglide`, `scheduleAfterglide`.

Pointer move becomes:

```ts
const samples = tracker.push(point);
engine.emit(samples);
```

- [ ] **Step 4: Reset both interpolation and engine delta history on pointer leave/cleanup.**

```ts
const leave = () => {
  tracker.reset();
  engine.resetInputStream();
};
```

Call both resets in effect cleanup too.

- [ ] **Step 5: Keep interpolation constants unchanged for the first reference comparison.**

Keep `maxSpacing: 0.022`, `maxVelocity: 1.85`, and the existing `RevealSample.radius` values. Full fluid mode ignores `sample.radius`; it uses `quality.splatRadius = 0.00006`. Do not make splat radius responsive in this fidelity-baseline task.

- [ ] **Step 6: Preserve autonomous timing and isolate its input history.**

Before scheduling `createHeroAutonomousStroke()` samples, call `engine.resetInputStream()`. Keep the current `0.64s` sequence and existing sample locations. The samples are now deposited into the simulation rather than becoming geometry.

- [ ] **Step 7: Delete primitive-only modules/tests and prove they are unreferenced.**

```bash
rg "createInertialAfterglide|liquidRadiusScale|isLiquidPrimitiveAlive" src tests
```

Expected after deletion: no matches.

- [ ] **Step 8: Run this task's gate.**

```bash
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit.**

```bash
git add -A src/webgl/reveal src/components/experience/Hero tests
git commit -m "refactor: use fluid state for hero inertia"
```

---

### Task 6: Harden Capability Detection, Loader Warm-Up, Resize, and Hidden-Tab Resume

**Files:**
- Modify: `src/webgl/reveal/createRevealEngine.ts`
- Modify: `src/webgl/reveal/RevealEngine.ts`
- Modify: `tests/fluid-reveal.test.mjs`
- Modify: `tests/experience.test.mjs`

**Interfaces:**
- `createRevealEngine()` returns `null` when WebGL2 or renderable RGBA16F is unavailable.
- `warmRevealEngine()` creates a small full-profile engine, allocates all solver resources, calls `prime()`, and disposes.

- [ ] **Step 1: Add failing warm-up/capability contracts.**

Append to `tests/fluid-reveal.test.mjs`:

```js
test('loader warm-up primes the real fluid pass graph', () => {
  const create = read('src/webgl/reveal/createRevealEngine.ts');
  assert.match(create, /warmRevealEngine/);
  assert.match(create, /64/);
  assert.match(create, /prime\(\)/);
  assert.match(create, /return null/);
});

test('engine bounds hidden-tab resume instead of simulating a huge timestep', () => {
  const engine = read('src/webgl/reveal/RevealEngine.ts');
  assert.match(engine, /document\.hidden/);
  assert.match(engine, /lastFrameTime\s*=\s*null/);
});
```

- [ ] **Step 2: Run and verify RED.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs
```

- [ ] **Step 3: Make actual engine construction the capability authority.**

`createRevealEngine()` may use a lightweight WebGL2 check, but `RevealEngine` must validate `EXT_color_buffer_float` and RGBA16F framebuffer completeness on its real context. Any failure throws and is caught by `createRevealEngine()` which returns `null`.

- [ ] **Step 4: Expand warm-up to allocate and prime the full solver graph.**

```ts
const engine = createRevealEngine(canvas, {
  width: 64,
  height: 64,
  dpr: 1,
  reducedMotion: false,
  deviceMemory: 8,
});
if (!engine) return;
engine.resize(64, 64, 1);
engine.prime();
engine.dispose();
```

Keep the existing Loader `hero-code` critical task and weight unchanged; it already imports `warmRevealEngine()`.

- [ ] **Step 5: Keep simulation targets profile-fixed across responsive layout changes.**

`resize()` updates display canvas dimensions, CSS width/height/aspect, and registered brand texture. It does not recreate 256/512 (or lite/reduced) solver targets on ordinary hero resizing.

- [ ] **Step 6: Bound hidden-tab lifecycle.**

At the start of RAF:

```ts
if (document.hidden) {
  this.lastFrameTime = null;
  this.raf = requestAnimationFrame(this.frame);
  return;
}
```

The first visible frame after a hidden period uses `deltaSeconds = 0`; subsequent frames resume normal time-correct evolution.

- [ ] **Step 7: Run this task's gate.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs tests/experience.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
git add src/webgl/reveal/createRevealEngine.ts src/webgl/reveal/RevealEngine.ts tests/fluid-reveal.test.mjs tests/experience.test.mjs
git commit -m "perf: warm and harden fluid reveal engine"
```

---

### Task 7: Establish the Browser Fidelity Baseline Against Nothin

**Files:**
- Modify only when a named mismatch is demonstrated: `src/webgl/reveal/quality.ts`
- Modify only when a named mismatch is demonstrated: `src/webgl/reveal/RevealEngine.ts`
- Modify only when a named mismatch is demonstrated: `src/webgl/reveal/fluid/shaders.ts`

**Interfaces:**
- No new public interfaces. This task validates the solver before brand-specific tuning.

- [ ] **Step 1: Run the full automated gate before visual tuning.**

```bash
npm ci
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: every command exits `0`.

- [ ] **Step 2: Run WEBERAISE locally and test the full profile first.**

```bash
npm run dev
```

Use `1440×900`, DPR between 1 and 2, before testing smaller profiles.

- [ ] **Step 3: Execute the same pointer paths on the supplied/local Nothin reference and WEBERAISE.**

```text
A. straight medium-speed horizontal stroke
B. fast diagonal stroke
C. slow 90-degree turn
D. S-curve
E. tight loop/self-overlap
F. fast stroke then stop and watch for 3 seconds
G. cross an aging first stroke with a second stroke
```

Acceptance for the full baseline:

```text
- no visible chain-of-circles construction
- directional stretching/bending from fluid transport
- deposited dye can deform after input has moved away
- brief residual field motion without synthetic droplets
- velocity damps quickly instead of swimming indefinitely
- near-binary solid reveal interior
- narrow clean boundary
- no animated contour-noise crawl
- no fog halo
- aging areas taper/split through dye decay instead of circles shrinking
```

- [ ] **Step 4: Keep fidelity constants unchanged unless a specific mismatch is documented.**

Initial constants remain:

```text
splatForce 5900
splatRadius 0.00006
velocityRetention60 0.962
dyeRetention60 0.988
pressureIterations 20
revealGain 3.9
edgeSoftness 0.5
edgeWidth 0.01
```

Do not retune them merely because the new effect differs from the old WEBERAISE metaballs.

- [ ] **Step 5: Diagnose input normalization before changing fluid constants.**

If interpolation appears to over-inject momentum, log/inspect the sum of incremental `dx/dy` across one pointer event. It should approximately equal the original event displacement. Correct coordinate/delta normalization first; only change `splatForce` after that contract is verified.

- [ ] **Step 6: Verify lifecycle/fallback matrix.**

Test:

```text
1920×1080
1440×900
1280×800
768×1024
390×844
360×800
prefers-reduced-motion: reduce
touch/coarse pointer
forced WebGL capability failure
hidden tab → visible tab
EXPLORE while dye is active
browser reload
```

- [ ] **Step 7: Verify performance in this order.**

If 20-pressure-pass full mode is not practical on target integrated graphics:

```text
1. lower display dprCap first
2. then trial simResolution 192 / dyeResolution 384
3. preserve the pressure-projected model and 20 iterations until those two measures are evaluated
```

Do not fall back to circles/metaballs as a performance shortcut in full mode.

- [ ] **Step 8: Commit only evidence-backed fidelity corrections.**

If source changes were required:

```bash
git add src/webgl/reveal
git commit -m "fix: align fluid reveal baseline with reference"
```

If no correction was required, make no commit for this task and record the successful QA evidence in Task 8 documentation.

---

### Task 8: Update Architecture/Status Documentation and Run the Final Regression Gate

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/IMPLEMENTATION_STATUS.md`

**Interfaces:**
- Documentation describes only the verified implementation from Tasks 1–7.

- [ ] **Step 1: Replace the old reveal architecture in `docs/ARCHITECTURE.md`.**

Document this actual flow:

```text
Pointer/autonomous RevealSample[]
→ one-time Gaussian splats
→ persistent half-float velocity + dye
→ velocity advection
→ dye advection
→ divergence
→ pressure Jacobi solve (20 iterations in full mode)
→ pressure-gradient subtraction
→ dye gain + 0.01-wide threshold
→ existing WEBERAISE difference compositor
```

Explicitly state that curl/vorticity amplification is omitted because the confirmed Nothin production setting is zero.

- [ ] **Step 2: Replace stale implementation-status claims.**

Remove statements describing:

```text
implicit primitive field
LiquidPrimitive CPU history
geometric circle contraction
metaball pinch-off
rogue satellite afterglide
surfaceThreshold/contourWarp profile
```

Record the verified full/lite/reduced profiles, capability behavior, warm-up behavior, automated test results, and Task 7 visual comparison outcome.

- [ ] **Step 3: Run final verification.**

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: all exit `0`.

- [ ] **Step 4: Verify branch scope.**

```bash
git diff --stat main...HEAD
git diff --name-only main...HEAD
```

Allowed production scope:

```text
src/webgl/reveal/**
src/components/experience/Hero/HeroRevealCanvas.tsx
reveal-related tests
docs/ARCHITECTURE.md
docs/IMPLEMENTATION_STATUS.md
research/spec/plan docs already committed on this branch
```

No Services, Work, About, navigation, ribbon, or unrelated homepage files should be modified.

- [ ] **Step 5: Commit documentation.**

```bash
git add docs/ARCHITECTURE.md docs/IMPLEMENTATION_STATUS.md
git commit -m "docs: record fluid hero reveal architecture"
```

---

## Final Acceptance Gate

Implementation is complete only when every item is true:

```text
[ ] full reveal uses persistent velocity+dye fluid state
[ ] full baseline uses 256 sim / 512 dye / 20 pressure iterations
[ ] velocity/dye retention match 0.962/0.988 at 60 Hz and are time-corrected
[ ] pointer interpolation deposits one-time Gaussian splats rather than persistent CPU geometry
[ ] no LiquidPrimitive list remains
[ ] no liquidRadiusScale healing remains
[ ] no createInertialAfterglide remains
[ ] no interactive contour sine/noise remains
[ ] reveal mask uses gain 3.9, threshold start 0.5, width 0.01
[ ] existing WEBERAISE typography/logo difference compositor remains registered
[ ] EXPLORE bottom fill remains behaviorally unchanged
[ ] CSS fallback remains usable
[ ] reduced-motion path remains usable
[ ] hidden-tab resume is bounded
[ ] npm test passes
[ ] npm run typecheck passes
[ ] npm run build passes
[ ] git diff --check passes
[ ] side-by-side paths are in the same directional-liquid family as Nothin
[ ] no unrelated site sections/routes are changed
```
