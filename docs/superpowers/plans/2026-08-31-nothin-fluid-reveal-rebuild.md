# Nothin-Fidelity Fluid Reveal Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace WEBERAISE's age-aware metaball hero reveal with an independently implemented pressure-projected 2D fluid mask that reproduces the material behavior confirmed in the supplied Nothin production bundle while preserving the existing WEBERAISE hero composition and EXPLORE handoff.

**Architecture:** Keep `HeroRevealCanvas` as the input/lifecycle adapter and keep the public `RevealEngine` API used by `Hero.tsx` and `exploreTimeline.ts`. Replace `RevealEngine`'s CPU primitive list + one RGBA8 field target with persistent half-float velocity, dye, pressure, and divergence render targets. Pointer/autonomous samples are interpolated exactly as today, but they are deposited once as Gaussian velocity+dye splats; the GPU field then evolves through advection, divergence, a 20-iteration pressure solve, gradient subtraction, dye dissipation, and a narrow threshold in the existing WEBERAISE difference compositor.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, native WebGL2 / GLSL ES 3.00, GSAP 3.15.0, Node test runner with `tsx`.

**Spec:** `docs/superpowers/specs/2026-08-31-nothin-reveal-fidelity-design.md`

## Global Constraints

- Work only on `feature/hero-nothin-reveal-fidelity`, which was branched from `main` @ `dff8870b357e9bc87fe1d87e1a0dc67ca9dcc74c`.
- Preserve `ExperienceShell`, loader choreography, `HeroTypography`, front/reveal registration, navigation, hero vignette, EXPLORE timing, bottom-fill semantics, and the post-hero handoff.
- Full-quality reference values begin at: simulation `256×256`, dye `512×512`, pressure iterations `20`, velocity retention `0.962` per 60 Hz reference frame, dye retention `0.988` per 60 Hz reference frame, curl strength `0`, splat radius denominator `0.00006`, splat force `5900`, reveal gain `3.9`, threshold start `0.5`, threshold width `0.01`.
- Match Nothin's 60 Hz appearance but make advection/dissipation frame-rate independent.
- Organicity must come from the evolving fluid field. Do not add FBM/simplex/hash/sine contour noise to the interactive reveal.
- Do not copy Nothin's minified production source verbatim. Implement the standard fluid operations independently from the confirmed architecture/math.
- No colorful fluid rendering, ripple propagation, splashes, strong curl/vorticity, smoke/fog alpha tails, or synthetic rogue afterglide droplets in full mode.
- Keep pointer work outside React render state.
- Keep the intentional no-WebGL/CSS fallback.
- `npm test`, `npm run typecheck`, `npm run build`, and browser/WebGL QA are required before completion.

---

## File Structure Locked for This Rebuild

### Existing files to modify

- `src/webgl/reveal/quality.ts` — replace primitive/lifetime quality knobs with fluid simulation profiles.
- `src/webgl/reveal/math.ts` — add frame-reference timing conversion helpers.
- `src/webgl/reveal/shaders.ts` — keep final WEBERAISE composite/bottom-fill shader; replace implicit-field assumptions with dye-mask uniforms.
- `src/webgl/reveal/RevealEngine.ts` — become the orchestration layer for the fluid pass graph while preserving its external API.
- `src/webgl/reveal/createRevealEngine.ts` — capability probe + warm-up for half-float fluid resources.
- `src/components/experience/Hero/HeroRevealCanvas.tsx` — keep interpolation/autonomous input but remove CPU afterglide and reset fluid input history on pointer leave.
- `tests/experience.test.mjs` — replace old implicit-field architecture assertions.
- `tests/visual-contract.test.mjs` — replace metaball/contour-warp contracts with fluid pipeline contracts.
- `tests/intro-polish.test.mjs` — remove old rogue-patch expectations and assert fluid-native residual motion path.
- `tests/interaction-polish.test.mjs` — remove inertia unit tests/imports while retaining loader-specific coverage.
- `docs/ARCHITECTURE.md` — update reveal architecture after implementation is verified.
- `docs/IMPLEMENTATION_STATUS.md` — record the new production reveal state after verification.

### New focused files

- `src/webgl/reveal/fluid/types.ts` — render-target and pending-splat types.
- `src/webgl/reveal/fluid/gl.ts` — shader/program/uniform helpers and fullscreen-quad allocation.
- `src/webgl/reveal/fluid/renderTargets.ts` — RGBA16F framebuffer allocation, double-FBO swapping, resize/clear/dispose.
- `src/webgl/reveal/fluid/shaders.ts` — Gaussian splat, advection, divergence, pressure-Jacobi, and gradient-subtraction shaders.
- `tests/fluid-reveal.test.mjs` — deterministic configuration, timing, shader-contract, and orchestration tests.

### Files to delete once all references are removed

- `src/webgl/reveal/liquidLifetime.ts`
- `src/webgl/reveal/inertia.ts`
- `tests/liquid-lifetime.test.mjs`

`RevealSample`, `pointerEmitter`, `pointerTracker`, `autonomousEmitter`, and `bottomFillEmitter` stay. Their sample geometry remains useful as an input stream; it simply stops being the visible geometry model.

---

### Task 1: Replace Primitive Quality Knobs With Nothin-Fidelity Fluid Profiles

**Files:**
- Modify: `src/webgl/reveal/quality.ts`
- Modify: `src/webgl/reveal/math.ts`
- Create: `tests/fluid-reveal.test.mjs`
- Modify: `tests/experience.test.mjs`

**Interfaces:**
- Produces `RevealQualityMode = 'full' | 'lite' | 'reduced' | 'fallback'`.
- Produces `RevealQuality` with `simResolution`, `dyeResolution`, `pressureIterations`, `dprCap`, `velocityRetention60`, `dyeRetention60`, `splatRadius`, `splatForce`, `revealGain`, `edgeSoftness`, `edgeWidth`, and `enableVelocity`.
- Produces `referenceFrameScale(deltaSeconds, referenceHz = 60): number`.
- Produces `retentionFromReferenceFrame(baseRetention, deltaSeconds, referenceHz = 60): number`.

- [ ] **Step 1: Write failing fluid-profile and timing tests.**

Create `tests/fluid-reveal.test.mjs` with:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { chooseRevealQuality } from '../src/webgl/reveal/quality.ts';
import {
  referenceFrameScale,
  retentionFromReferenceFrame,
} from '../src/webgl/reveal/math.ts';

test('full reveal profile starts from confirmed Nothin production values', () => {
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

test('reference-frame timing preserves Nothin at 60 Hz and stays refresh-rate independent', () => {
  assert.ok(Math.abs(referenceFrameScale(1 / 60) - 1) < 1e-9);
  assert.ok(Math.abs(referenceFrameScale(1 / 120) - 0.5) < 1e-9);

  const at60 = retentionFromReferenceFrame(0.988, 1 / 60);
  const twoAt120 = retentionFromReferenceFrame(0.988, 1 / 120) ** 2;
  assert.ok(Math.abs(at60 - 0.988) < 1e-9);
  assert.ok(Math.abs(at60 - twoAt120) < 1e-9);
});

test('lite and reduced profiles preserve the same mask semantics at lower GPU cost', () => {
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

- [ ] **Step 2: Run the focused tests and confirm RED.**

Run:

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs
```

Expected: FAIL because the fluid properties and timing helpers do not exist yet.

- [ ] **Step 3: Implement frame-reference timing math.**

Add to `src/webgl/reveal/math.ts`:

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

The `2`-reference-frame clamp prevents hidden-tab/resume from advecting the field across an enormous synthetic timestep.

- [ ] **Step 4: Replace the quality interface and profile values.**

Use this shape in `quality.ts`:

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

Profiles:

```ts
// full
{
  mode: 'full', simResolution: 256, dyeResolution: 512,
  pressureIterations: 20, dprCap: 2,
  velocityRetention60: 0.962, dyeRetention60: 0.988,
  splatRadius: 0.00006, splatForce: 5900,
  revealGain: 3.9, edgeSoftness: 0.5, edgeWidth: 0.01,
  enableVelocity: true,
}

// lite
{
  mode: 'lite', simResolution: 128, dyeResolution: 256,
  pressureIterations: 10, dprCap: 1.25,
  velocityRetention60: 0.962, dyeRetention60: 0.988,
  splatRadius: 0.00006, splatForce: 5900,
  revealGain: 3.9, edgeSoftness: 0.5, edgeWidth: 0.01,
  enableVelocity: true,
}

// reduced motion
{
  mode: 'reduced', simResolution: 96, dyeResolution: 192,
  pressureIterations: 0, dprCap: 1,
  velocityRetention60: 0, dyeRetention60: 0.985,
  splatRadius: 0.00008, splatForce: 0,
  revealGain: 3.9, edgeSoftness: 0.5, edgeWidth: 0.01,
  enableVelocity: false,
}
```

Fallback uses zero simulation dimensions and `enableVelocity: false`.

- [ ] **Step 5: Replace old primitive-profile assertions in `tests/experience.test.mjs`.**

Delete expectations for `lifetime`, `holdFraction`, `maxPrimitives`, `surfaceThreshold`, and `maskShortAxis`. Assert the new profile values instead.

- [ ] **Step 6: Run focused + experience tests.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs tests/experience.test.mjs
```

Expected: PASS for all quality/timing tests; old engine-architecture test may still be red until Task 4, so temporarily run the named pure/profile tests if Node's runner cannot isolate without a pattern.

- [ ] **Step 7: Commit.**

```bash
git add src/webgl/reveal/quality.ts src/webgl/reveal/math.ts tests/fluid-reveal.test.mjs tests/experience.test.mjs
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
- `createFullscreenGeometry(gl): { vao, buffer }`
- `createFluidTarget(gl, width, height, filter): FluidTarget`
- `createDoubleFluidTarget(gl, width, height, filter): DoubleFluidTarget`
- `clearFluidTarget(gl, target): void`
- `disposeFluidTarget(gl, target): void`
- `disposeDoubleFluidTarget(gl, target): void`

- [ ] **Step 1: Add source-contract tests for half-float target ownership.**

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
  assert.doesNotMatch(source, /depthBuffer|stencilBuffer/);
});
```

- [ ] **Step 2: Run focused test and confirm RED.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs
```

Expected: FAIL because the new files do not exist.

- [ ] **Step 3: Create the fluid target types.**

`fluid/types.ts`:

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

- [ ] **Step 4: Extract WebGL program/quad helpers from `RevealEngine` into `fluid/gl.ts`.**

Move the existing shader compilation/link/uniform caching behavior without changing error semantics. Keep one fullscreen quad at locations `[-1, -1]..[1, 1]` and attribute location `0`.

- [ ] **Step 5: Implement RGBA16F framebuffer allocation.**

`createFluidTarget()` must:

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

Use `CLAMP_TO_EDGE`; use the requested `LINEAR` or `NEAREST` filter; attach to `COLOR_ATTACHMENT0`; throw if the framebuffer is incomplete; clear to transparent zero immediately.

- [ ] **Step 6: Implement double-target swapping and disposal.**

`swap()` must swap object references only—no texture copies.

- [ ] **Step 7: Run tests.**

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

### Task 3: Implement the Independent Fluid Shader Suite

**Files:**
- Create: `src/webgl/reveal/fluid/shaders.ts`
- Modify: `src/webgl/reveal/shaders.ts`
- Modify: `tests/fluid-reveal.test.mjs`
- Modify: `tests/visual-contract.test.mjs`

**Interfaces:**
- Exports `FLUID_VERTEX`, `SPLAT_FRAGMENT`, `ADVECTION_FRAGMENT`, `DIVERGENCE_FRAGMENT`, `PRESSURE_FRAGMENT`, `GRADIENT_SUBTRACT_FRAGMENT`.
- Existing `shaders.ts` continues to export `FULLSCREEN_VERTEX` and `COMPOSITE_FRAGMENT` for the WEBERAISE final compositor.

- [ ] **Step 1: Add failing shader-contract tests.**

```js
test('fluid shader suite contains the pressure-projected pass graph and no decorative turbulence', () => {
  const fluid = read('src/webgl/reveal/fluid/shaders.ts');
  assert.match(fluid, /SPLAT_FRAGMENT/);
  assert.match(fluid, /ADVECTION_FRAGMENT/);
  assert.match(fluid, /DIVERGENCE_FRAGMENT/);
  assert.match(fluid, /PRESSURE_FRAGMENT/);
  assert.match(fluid, /GRADIENT_SUBTRACT_FRAGMENT/);
  assert.match(fluid, /exp\(-dot\(/);
  assert.match(fluid, /uDissipation/);
  assert.doesNotMatch(fluid, /fbm|simplex|hash\s*\(|vorticity|uCurlStrength/i);
});

test('interactive composite uses Nothin-style dye gain and narrow threshold without contour noise', () => {
  const composite = read('src/webgl/reveal/shaders.ts');
  assert.match(composite, /uDye/);
  assert.match(composite, /uRevealGain/);
  assert.match(composite, /uEdgeSoftness/);
  assert.match(composite, /uEdgeWidth/);
  assert.doesNotMatch(composite, /uContourWarp|contourWave/);
});
```

- [ ] **Step 2: Run tests and confirm RED.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs tests/visual-contract.test.mjs
```

- [ ] **Step 3: Implement the Gaussian splat shader independently.**

Required behavior:

```glsl
vec2 p = vUv - uPoint;
p.x *= uAspectRatio;
float weight = exp(-dot(p, p) / uRadius);
vec3 base = texture(uTarget, vUv).xyz;
outColor = vec4(base + weight * uColor, 1.0);
```

Do not paste the archived shader text verbatim; use this standard Gaussian formula with WEBERAISE naming/GLSL ES 3.00 syntax.

- [ ] **Step 4: Implement advection with manual bilinear sampling.**

Required semantics:

```glsl
vec2 coord = vUv - uDtFrames * texture(uVelocity, vUv).xy * uTexelSize;
vec4 result = uDissipation * bilerp(uSource, coord, uTexelSize);
outColor = result;
```

`uDtFrames` is `deltaSeconds * 60` clamped by `referenceFrameScale()`.

- [ ] **Step 5: Implement divergence, Jacobi pressure, and pressure-gradient subtraction.**

Use standard centered neighbor differences:

```text
divergence = 0.5 * (rightX - leftX + topY - bottomY)
pressure = 0.25 * (left + right + top + bottom - divergence)
velocity -= 0.5 * vec2(rightPressure - leftPressure, topPressure - bottomPressure)
```

- [ ] **Step 6: Remove implicit field shaders from `src/webgl/reveal/shaders.ts`.**

Delete `FIELD_VERTEX` and `FIELD_FRAGMENT`. Change the composite inputs from `uField/uSurfaceThreshold/uContourWarp` to:

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

Keep the existing WEBERAISE difference-source/brand logic and keep the existing authored bottom-fill crest. The prohibition on sine contour animation applies to the interactive mask, not the separately approved EXPLORE fill crest.

- [ ] **Step 7: Replace old metaball assertions in `tests/visual-contract.test.mjs`.**

Require `uDye`, narrow threshold uniforms, absence of `FIELD_VERTEX/FIELD_FRAGMENT`, absence of `uContourWarp`, and presence of pressure/advection source modules.

- [ ] **Step 8: Run tests/typecheck.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs tests/visual-contract.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit.**

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
- Preserve: `constructor(canvas, quality)`.
- Preserve: `resize(width, height, dpr)`.
- Preserve: `setLayers(layers)`.
- Preserve: `emit(samples)`.
- Add: `resetInputStream(): void`.
- Preserve: `setMode(mode)`.
- Preserve: `setBottomFillProgress(progress)` / `getBottomFillProgress()`.
- Preserve: `clear()`, `start()`, `stop()`, `dispose()`.
- Add: `prime(): void` for loader warm-up.

- [ ] **Step 1: Add failing engine source-contract tests.**

```js
test('RevealEngine owns persistent velocity dye pressure and divergence state', () => {
  const engine = read('src/webgl/reveal/RevealEngine.ts');
  assert.match(engine, /velocity/);
  assert.match(engine, /dye/);
  assert.match(engine, /pressure/);
  assert.match(engine, /divergence/);
  assert.match(engine, /pressureIterations/);
  assert.match(engine, /pendingSplats/);
  assert.match(engine, /resetInputStream/);
  assert.doesNotMatch(engine, /LiquidPrimitive|liquidRadiusScale|drawArraysInstanced|primitives/);
});
```

Update the old `experience.test.mjs` architecture test to assert the same fluid ownership and to reject `FIELD_VERTEX`, `FIELD_FRAGMENT`, and `liquidRadiusScale`.

- [ ] **Step 2: Run focused tests and confirm RED.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs tests/experience.test.mjs
```

- [ ] **Step 3: Rebuild the constructor around the fluid pass graph.**

Create programs for:

```text
splat
advection
 divergence
pressure
pressure-gradient subtraction
composite
```

Do not create curl/vorticity programs because the confirmed production value is `curlStrength = 0`; omitting mathematically no-op turbulence passes preserves the intended behavior while reducing GPU cost.

Require `EXT_color_buffer_float` after acquiring WebGL2. If the extension is absent or a test RGBA16F framebuffer is incomplete, throw so `createRevealEngine()` falls back intentionally.

- [ ] **Step 4: Allocate exact full-profile target classes.**

On `resize()`/initialization:

```text
velocity:   double RGBA16F, simResolution², LINEAR
pressure:   double RGBA16F, simResolution², NEAREST
dye:        double RGBA16F, dyeResolution², LINEAR
divergence: single RGBA16F, simResolution², NEAREST
```

Simulation dimensions stay square like the reference; canvas display size remains responsive and DPR-capped separately.

- [ ] **Step 5: Convert `emit(samples)` from geometry retention to one-time splat queuing.**

Store only pending GPU deposits:

```ts
private pendingSplats: FluidSplat[] = [];
private lastInputPoint: { x: number; y: number } | null = null;
```

For every interpolated sample:

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

This is the key normalization rule: interpolating one segment into `N` samples divides the original displacement across those samples naturally. The total injected momentum remains approximately proportional to the real pointer displacement instead of multiplying force by the interpolation count.

- [ ] **Step 6: Implement `resetInputStream()`.**

```ts
resetInputStream() {
  this.lastInputPoint = null;
}
```

It must not clear the fluid field; it only prevents a future re-entry point from generating a giant synthetic delta.

- [ ] **Step 7: Implement pointer splat application.**

For each pending splat when `enableVelocity` is true:

```text
velocity color = vec3(dx * splatForce, dy * splatForce, 0)
dye color = vec3(strength, strength, strength)
point = normalized fluid coordinates
radius = quality.splatRadius
aspect = cssWidth/cssHeight
```

Render into `.write`, swap, then do dye splat and swap. Clear `pendingSplats` after application.

Reduced-motion mode skips the velocity splat and deposits dye only.

- [ ] **Step 8: Implement one frame of fluid evolution in confirmed reference order.**

Use `deltaSeconds = clamp((now - lastFrameTime), 0, 1/30)` and:

```ts
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

Full/lite order:

```text
1. apply pending velocity+dye splats
2. advect velocity through velocity; swap
3. advect dye through current velocity; swap
4. compute divergence
5. clear pressure.read to zero
6. run pressure Jacobi `pressureIterations` times, swapping each iteration
7. subtract pressure gradient from velocity; swap
8. render composite from dye.read
```

This deliberately follows Nothin's observed ordering where dye advection occurs before the current frame's pressure projection.

Reduced mode:

```text
1. apply dye splats
2. decay dye by running advection shader with zero velocity and dye retention
3. render composite
```

- [ ] **Step 9: Make `clear()` clear every persistent field.**

Clear velocity read/write, pressure read/write, dye read/write, divergence; clear `pendingSplats`; reset input stream.

- [ ] **Step 10: Preserve bottom-fill mode.**

When `mode === 'bottomFill'`, skip the expensive solver and render the composite/bottom-fill only. `exploreTimeline.ts` already calls `clear()` before switching modes, so no fluid state needs to survive the exit.

- [ ] **Step 11: Implement `prime()`.**

`prime()` executes one zero-input solver frame against the currently allocated tiny targets without scheduling RAF. It exists only to force driver validation/first draw during loader warm-up.

- [ ] **Step 12: Dispose all programs, textures, framebuffers, buffers, and VAOs.**

No fluid target may survive `dispose()`.

- [ ] **Step 13: Run tests/typecheck.**

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

### Task 5: Integrate Fluid-Native Pointer Motion and Remove Synthetic Afterglide

**Files:**
- Modify: `src/components/experience/Hero/HeroRevealCanvas.tsx`
- Modify: `tests/intro-polish.test.mjs`
- Modify: `tests/interaction-polish.test.mjs`
- Delete: `src/webgl/reveal/inertia.ts`
- Delete: `src/webgl/reveal/liquidLifetime.ts`
- Delete: `tests/liquid-lifetime.test.mjs`

**Interfaces:**
- `HeroRevealCanvas` continues using `createPointerTracker()` and `createHeroAutonomousStroke()`.
- It calls `engine.emit(samples)` and `engine.resetInputStream()`.
- No CPU timer-based afterglide remains.

- [ ] **Step 1: Replace stale inertia tests with failing fluid-native input tests.**

In `tests/intro-polish.test.mjs`, replace the first inertia test with:

```js
test('hero delegates residual motion to the persistent fluid field', () => {
  const canvas = read('src/components/experience/Hero/HeroRevealCanvas.tsx');
  assert.match(canvas, /createPointerTracker/);
  assert.match(canvas, /engine\.emit\(samples\)/);
  assert.match(canvas, /engine\.resetInputStream\(\)/);
  assert.doesNotMatch(canvas, /createInertialAfterglide|afterglide|inertiaVelocity/);
});
```

In `tests/interaction-polish.test.mjs`, remove the `createInertialAfterglide` import and its two tests. Keep loader/countdown/hero layout tests intact.

- [ ] **Step 2: Run focused tests and confirm RED while old afterglide remains.**

```bash
node --import=tsx --test tests/intro-polish.test.mjs tests/interaction-polish.test.mjs
```

- [ ] **Step 3: Remove afterglide scheduling from `HeroRevealCanvas`.**

Delete:

```text
createInertialAfterglide import
idleTimer
afterglideTimers
lastSample
inertiaVelocity
cancelAfterglide()
scheduleAfterglide()
```

Pointer move becomes only:

```ts
const samples = tracker.push(point);
engine.emit(samples);
```

- [ ] **Step 4: Reset both CPU interpolation and engine delta history on pointer leave.**

```ts
const leave = () => {
  tracker.reset();
  engine.resetInputStream();
};
```

Call the same reset in the effect cleanup.

- [ ] **Step 5: Preserve the current interpolation density for the first visual baseline.**

Keep `maxSpacing: 0.022` and `maxVelocity: 1.85`. `radius` stays in `RevealSample` for compatibility with autonomous/pointer helpers but is ignored by full fluid mode; use the existing desktop/mobile radius values until those legacy fields are later removed in a separate cleanup.

Do **not** make the splat radius responsive in this task. The full solver uses the confirmed `0.00006` Gaussian radius from the quality profile so the first comparison is meaningful.

- [ ] **Step 6: Preserve autonomous stroke timing.**

`playAutonomousStroke()` continues emitting the same sequence over `0.64s`; each emitted sample is now deposited into the fluid field. Before starting the autonomous sequence, call `engine.resetInputStream()` so its first point cannot inherit pointer history.

- [ ] **Step 7: Delete primitive-only modules and test.**

Delete `inertia.ts`, `liquidLifetime.ts`, `liquid-lifetime.test.mjs`. Confirm no source/tests import them:

```bash
rg "createInertialAfterglide|liquidRadiusScale|isLiquidPrimitiveAlive" src tests
```

Expected: no matches.

- [ ] **Step 8: Run tests/typecheck.**

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

### Task 6: Harden Capability Detection, Loader Warm-Up, Resize, and Tab Resume

**Files:**
- Modify: `src/webgl/reveal/createRevealEngine.ts`
- Modify: `src/webgl/reveal/RevealEngine.ts`
- Modify: `src/components/experience/Loader/Loader.tsx` only if the existing warm task needs a renamed export; otherwise leave unchanged.
- Modify: `tests/fluid-reveal.test.mjs`
- Modify: `tests/experience.test.mjs`

**Interfaces:**
- `createRevealEngine()` returns `null` when WebGL2 or renderable RGBA16F is unavailable.
- `warmRevealEngine()` creates a tiny full-profile engine, allocates all solver resources, calls `prime()`, and disposes.

- [ ] **Step 1: Add warm-up/capability source contracts.**

```js
test('reveal warm-up primes the actual fluid pass graph and capability failure falls back', () => {
  const create = read('src/webgl/reveal/createRevealEngine.ts');
  assert.match(create, /warmRevealEngine/);
  assert.match(create, /prime\(\)/);
  assert.match(create, /return null/);
});
```

- [ ] **Step 2: Update `createRevealEngine()`.**

Do not probe WebGL2 with an unrelated canvas and then open a second context blindly. Let `RevealEngine` own actual capability validation; `createRevealEngine()` chooses a profile from `webgl2: true` only after a lightweight `canvas.getContext('webgl2')` availability check on the target canvas or simply catches constructor failure and returns `null`.

The constructor must reject missing `EXT_color_buffer_float` / incomplete RGBA16F targets.

- [ ] **Step 3: Expand `warmRevealEngine()`.**

Use `64×64`, DPR 1, full/non-reduced profile; call:

```ts
engine.resize(64, 64, 1);
engine.prime();
engine.dispose();
```

The existing Loader task already imports `warmRevealEngine()` as `hero-code`; keep that integration and weight unchanged.

- [ ] **Step 4: Handle resize without carrying incompatible field dimensions.**

Simulation targets are profile-fixed squares; normal responsive resize only updates canvas display dimensions, aspect uniform, and brand texture. Do not reallocate fluid targets on every layout resize unless the chosen quality profile itself changes—which does not happen during one mounted hero lifecycle.

- [ ] **Step 5: Handle tab resume safely.**

In the RAF loop, if `document.hidden` is true, render nothing and set `lastFrameTime = null`. On the first visible frame, initialize the clock and render with zero evolution timestep before continuing normally. This prevents the field from stepping through seconds/minutes of hidden time.

- [ ] **Step 6: Run tests/typecheck.**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs tests/experience.test.mjs
npm run typecheck
```

- [ ] **Step 7: Commit.**

```bash
git add src/webgl/reveal/createRevealEngine.ts src/webgl/reveal/RevealEngine.ts tests/fluid-reveal.test.mjs tests/experience.test.mjs
git commit -m "perf: warm and harden fluid reveal engine"
```

---

### Task 7: Browser-Level Fluid Validation and Fidelity Baseline

**Files:**
- Modify only if evidence requires: `src/webgl/reveal/quality.ts`
- Modify only if evidence requires: `src/webgl/reveal/RevealEngine.ts`
- Modify only if evidence requires: `src/webgl/reveal/fluid/shaders.ts`

**Interfaces:**
- No new public interface. This task validates the implementation against the reference before brand-specific tuning.

- [ ] **Step 1: Run the full automated gate first.**

```bash
npm ci
npm test
npm run typecheck
npm run build
git diff --check
```

All must exit 0 before visual tuning.

- [ ] **Step 2: Run WEBERAISE locally.**

```bash
npm run dev
```

Test desktop first at `1440×900`, DPR 1–2.

- [ ] **Step 3: Compare the exact interaction family against the supplied/local Nothin reference.**

Perform these motions on both:

```text
A. straight medium-speed horizontal stroke
B. fast diagonal stroke
C. slow 90-degree turn
D. S-curve
E. tight loop/self-overlap
F. stop after fast movement and watch 3 seconds
G. cross an aging stroke with a new stroke
```

Accept only if WEBERAISE now exhibits:

```text
- no visible chain-of-circles construction
- directional stretching/bending from fluid transport
- old dye deforms after deposition
- brief residual field motion without synthetic droplets
- residual velocity damps quickly
- near-binary solid reveal interior
- narrow clean boundary
- no contour-wave crawl
- no fog halo
- old regions taper/split through dye decay rather than circles shrinking
```

- [ ] **Step 4: Keep the first baseline at confirmed Nothin values.**

Do not change `5900 / 0.00006 / 0.962 / 0.988 / 20 / 3.9 / 0.5 / 0.01` merely because the effect is visually new. Change a value only for a named mismatch caused by WEBERAISE's different input normalization/compositor.

- [ ] **Step 5: If pointer interpolation makes momentum too strong, correct input normalization—not fluid constants.**

Because `emit()` injects per-interpolated-segment `dx/dy`, total impulse should already equal the original segment displacement. If visual force is still mismatched, inspect pointer coordinate normalization before modifying `splatForce`.

- [ ] **Step 6: Verify lifecycle/fallback matrix.**

Check:

```text
1920×1080
1440×900
1280×800
768×1024
390×844
360×800
prefers-reduced-motion: reduce
touch/coarse pointer
WebGL failure/fallback
hidden tab → visible tab
EXPLORE during active/aging dye
browser reload
```

- [ ] **Step 7: Verify performance.**

On full desktop, confirm the interactive hero remains smooth with 20 pressure iterations. If full mode is not practical on target integrated graphics, first reduce `dprCap` (display cost does not change simulation shape); next evaluate full `simResolution=192`, `dyeResolution=384`; do not reduce pressure iterations or change the mask model before those two measures.

- [ ] **Step 8: Commit only evidence-based fidelity corrections, if any.**

Example commit form:

```bash
git add src/webgl/reveal
 git commit -m "fix: align fluid reveal input scaling with reference"
```

Skip this commit if the baseline needs no correction.

---

### Task 8: Update Architecture/Status Documentation and Run Final Regression Gate

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/IMPLEMENTATION_STATUS.md`
- Modify: `tests/visual-contract.test.mjs` if documentation/source contracts changed during final tuning.

**Interfaces:**
- Documentation must describe the actual verified implementation, not the historical metaball architecture.

- [ ] **Step 1: Rewrite the WebGL architecture section.**

`docs/ARCHITECTURE.md` must describe:

```text
Pointer/autonomous RevealSample[]
→ one-time Gaussian splats
→ persistent half-float velocity + dye
→ velocity advection
→ dye advection
→ divergence
→ 20-pass pressure projection (full)
→ gradient subtraction
→ dye gain + 0.01-wide threshold
→ existing WEBERAISE difference compositor
```

Explicitly state that curl/vorticity amplification is omitted because the confirmed reference setting is zero.

- [ ] **Step 2: Replace outdated implementation-status claims.**

Remove claims about:

```text
implicit primitive field
bounded LiquidPrimitive list
geometric circle contraction
metaball pinch-off
rogue satellite afterglide
surfaceThreshold/contourWarp profile
```

Record actual profile values and verification results.

- [ ] **Step 3: Run complete verification again.**

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: all pass.

- [ ] **Step 4: Confirm branch contains no unrelated changes.**

```bash
git diff --stat main...HEAD
git diff --name-only main...HEAD
```

Expected changed scope: reveal engine/modules, hero reveal adapter, reveal-related tests, and reveal documentation only. Loader file should be unchanged unless the warm-up export signature genuinely required it.

- [ ] **Step 5: Commit documentation.**

```bash
git add docs/ARCHITECTURE.md docs/IMPLEMENTATION_STATUS.md tests/visual-contract.test.mjs
git commit -m "docs: record fluid hero reveal architecture"
```

---

## Final Acceptance Gate

The branch is implementation-complete only when all of the following are true:

```text
[ ] full-quality reveal uses persistent velocity+dye fluid state
[ ] full baseline uses 256 sim / 512 dye / 20 pressure iterations
[ ] velocity/dye retention match 0.962/0.988 at 60 Hz and are time-corrected
[ ] pointer interpolation deposits one-time Gaussian splats rather than persistent CPU geometry
[ ] no LiquidPrimitive list remains
[ ] no liquidRadiusScale healing remains
[ ] no createInertialAfterglide remains
[ ] no interactive contour sine/noise remains
[ ] reveal threshold uses gain 3.9, start 0.5, width 0.01
[ ] existing WEBERAISE typography/logo difference compositor remains registered
[ ] EXPLORE bottom fill remains behaviorally unchanged
[ ] fallback remains usable
[ ] reduced motion remains usable
[ ] hidden-tab resume is bounded
[ ] automated test/type/build gates pass
[ ] side-by-side paths are in the same directional-liquid family as Nothin
[ ] no unrelated site section/navigation/work/services/about changes are present
```
