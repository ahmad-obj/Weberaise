# EXPLORE CTA + Fluid Exit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the hero EXPLORE control clearly actionable and replace the old sine-wave bottom fill with a solver-driven black fluid flood that rises from below and hands off seamlessly to the existing main/ribbon experience.

**Architecture:** Keep the CTA as a DOM/CSS concern, but move its wrapper above the reveal compositor and use difference blending for automatic black/white contrast. Replace `bottomFill` with a `fluidExit` mode inside the existing `RevealEngine`; a dedicated fullscreen source pass continuously injects bottom-band velocity and dye, then the existing advection + pressure pipeline produces the evolving front. The composite shader renders thresholded exit dye as black and uses only a final 6% global seal to guarantee a fully black handoff.

**Tech Stack:** Next.js 16.3, React 19.2.8, TypeScript 7.0.2, GSAP 3.15, custom WebGL2/GLSL ES 3.00, Node test runner + `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-01-explore-cta-fluid-exit-design.md`

## Global Constraints

- WEBERAISE interactive reveal constants and pointer behavior must not change.
- No glow, blue gradient, glassmorphism, pill button, bounce, or large CTA scale animation.
- No new animation or rendering dependency.
- No periodic sine/noise formula may control the visible exit edge.
- Reuse existing velocity, dye, pressure, divergence, and solver render targets; do not raise solver/dye resolution.
- `fluidExit` runs only for normal motion with a velocity-capable engine; reduced motion and WebGL failure use the DOM fallback.
- Exit must be fully black before the existing `onExploreComplete`/main-ribbon handoff fires.
- The final completion seal may begin only at exit progress `0.94` and must reach full black at `1.0`.
- The EXPLORE target must remain at least `44px` high for touch affordance.

---

## File Structure

### New

- `src/webgl/reveal/exitFluid.ts`
  - Owns the exit-fluid numeric configuration and progress clamp helper.
  - Keeps physics/coverage constants out of `RevealEngine.ts` and out of shader string literals where practical.
- `tests/explore-fluid-exit.test.mjs`
  - Focused source-contract tests for CTA affordance, engine mode, shader source pass, timeline selection, fallback, and removal of analytic bottom fill.

### Modified

- `src/app/globals.css`
  - EXPLORE frame/hover/active/focus treatment.
  - Raise EXPLORE wrapper above reveal canvas/vignette.
  - `fluidExit` canvas blend mode.
  - Simplify `.hero-exit-fill` into a plain reliable fallback.
- `src/webgl/reveal/fluid/shaders.ts`
  - Add `EXIT_SOURCE_FRAGMENT`.
- `src/webgl/reveal/shaders.ts`
  - Remove analytic sine crest and bottom-fill uniforms.
  - Add solver-dye exit compositing and completion seal.
- `src/webgl/reveal/RevealEngine.ts`
  - Add source program, `fluidExit` mode, exit progress API, per-frame source injection, and disposal.
- `src/experience/motion/exploreTimeline.ts`
  - Drive `fluidExit` for eligible engines.
  - Use DOM fill for reduced motion/engine failure.
  - Preserve button acknowledgement and existing completion callback.
- `tests/fluid-reveal.test.mjs`
  - Add shader/engine contracts for `fluidExit` and source pass.
- `tests/interaction-polish.test.mjs`
  - Replace the old black/normal EXPLORE contract with the framed difference-blended CTA contract.
- `tests/visual-contract.test.mjs`
  - Repair the stale pre-existing `splatForce: 5900` assertion to the already-approved `11800` profile.
  - Assert no analytic sine-wave exit remains.
- `docs/ARCHITECTURE.md`
  - Record `fluidExit` as a second solver-driven presentation mode.
- `docs/IMPLEMENTATION_STATUS.md`
  - Record the new CTA/exit behavior and verification boundary.

### Deleted

- `src/webgl/reveal/emitters/bottomFillEmitter.ts`
  - Becomes obsolete once GSAP drives `engine.setExitProgress()` directly.

---

### Task 1: Restore a truthful test baseline and add the new failing feature contract

**Files:**
- Create: `tests/explore-fluid-exit.test.mjs`
- Modify: `tests/visual-contract.test.mjs`

**Interfaces:**
- Consumes: current production branch state after the approved doubled reveal radius/force changes.
- Produces: a truthful baseline plus failing contracts that later tasks must satisfy.

- [ ] **Step 1: Repair the stale force assertion before using the suite as evidence**

Change the existing visual-contract test from the obsolete Nothin force value to the current approved WEBERAISE profile:

```js
assert.match(quality, /splatForce:\s*11800/);
```

Rename that test from wording that implies an untouched Nothin profile to wording such as:

```js
test('full quality profile preserves the approved WEBERAISE fluid profile', () => {
```

Do not change production code in this step.

- [ ] **Step 2: Run the existing reveal/visual contracts to verify the baseline is green**

Run:

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs tests/visual-contract.test.mjs
```

Expected: PASS. If another pre-existing assertion fails, stop and classify it as either stale expectation or real regression before touching the feature.

- [ ] **Step 3: Create the focused feature test with intentionally failing contracts**

Create `tests/explore-fluid-exit.test.mjs` with these initial assertions:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('EXPLORE is a framed difference-blended CTA above the reveal compositor', () => {
  const css = read('src/app/globals.css');
  assert.match(css, /\.hero-explore\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.hero-explore\s*\{[^}]*border:\s*1px solid currentColor/s);
  assert.match(css, /\.hero-explore\s*\{[^}]*border-radius:\s*4px/s);
  assert.match(css, /\.hero-explore\s*\{[^}]*color:\s*#fff[^}]*mix-blend-mode:\s*difference/s);
  assert.match(css, /\.hero-explore:hover[^}]*translateY\(-2px\)/s);
  assert.match(css, /\.hero-explore:active[^}]*scale\(\.985\)/s);
  assert.match(css, /\[data-hero-explore\][^}]*z-index:\s*7/s);
});

test('fluid exit replaces analytic bottomFill with a solver-driven source pass', () => {
  const engine = read('src/webgl/reveal/RevealEngine.ts');
  const fluidShaders = read('src/webgl/reveal/fluid/shaders.ts');
  const composite = read('src/webgl/reveal/shaders.ts');
  const timeline = read('src/experience/motion/exploreTimeline.ts');

  assert.match(engine, /'fluidExit'/);
  assert.match(engine, /setExitProgress\(/);
  assert.match(engine, /getExitProgress\(/);
  assert.match(engine, /exitSourceProgram/);
  assert.match(fluidShaders, /EXIT_SOURCE_FRAGMENT/);
  assert.match(composite, /uExitProgress/);
  assert.match(composite, /smoothstep\(0\.94,\s*1\.0,\s*uExitProgress\)/);
  assert.doesNotMatch(composite, /sin\s*\(/);
  assert.doesNotMatch(engine, /bottomFill/);
  assert.doesNotMatch(timeline, /bottomFillState|setBottomFillProgress|setMode\('bottomFill'\)/);
});
```

- [ ] **Step 4: Run the new test and verify RED for the intended reasons**

Run:

```bash
node --import=tsx --test tests/explore-fluid-exit.test.mjs
```

Expected: FAIL because the CTA is still transparent/normal-blended and `fluidExit`/`EXIT_SOURCE_FRAGMENT` do not yet exist.

- [ ] **Step 5: Commit the test baseline**

```bash
git add tests/visual-contract.test.mjs tests/explore-fluid-exit.test.mjs
git commit -m "test: define explore CTA and fluid exit contract"
```

---

### Task 2: Make EXPLORE clearly button-like without disturbing the hero

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tests/interaction-polish.test.mjs`
- Test: `tests/explore-fluid-exit.test.mjs`

**Interfaces:**
- Consumes: existing `HeroExploreButton` markup (`.hero-explore`, `.hero-explore__rule`) without requiring new React state.
- Produces: the final framed CTA visual contract; later timeline work continues fading the existing `[data-hero-explore]` wrapper.

- [ ] **Step 1: Update the existing interaction test to require the new CTA contract**

Replace the old assertions that require black text and `mix-blend-mode: normal` with:

```js
assert.match(css, /\.hero-explore[\s\S]*min-width:\s*126px/);
assert.match(css, /\.hero-explore[\s\S]*min-height:\s*44px/);
assert.match(css, /\.hero-explore[\s\S]*border:\s*1px solid currentColor/);
assert.match(css, /\.hero-explore[\s\S]*color:\s*#fff/);
assert.match(css, /\.hero-explore[\s\S]*mix-blend-mode:\s*difference/);
assert.match(css, /\[data-hero-explore\][\s\S]*z-index:\s*7/);
```

- [ ] **Step 2: Run the CTA tests and verify RED**

Run:

```bash
node --import=tsx --test tests/interaction-polish.test.mjs tests/explore-fluid-exit.test.mjs
```

Expected: FAIL on the old transparent/unframed styling.

- [ ] **Step 3: Implement the restrained CTA styling**

Replace the current `.hero-explore` block and related hover rules with this behavior:

```css
.hero-explore {
  position: absolute;
  left: 50%;
  bottom: clamp(22px, 4.5vh, 56px);
  transform: translateX(-50%);
  display: grid;
  place-items: center;
  gap: 7px;
  min-width: 126px;
  min-height: 44px;
  padding: 9px 18px 8px;
  border: 1px solid currentColor;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0);
  color: #fff;
  mix-blend-mode: difference;
  font: 700 11px/1 var(--font-body), Arial, sans-serif;
  letter-spacing: .18em;
  cursor: pointer;
  transition:
    transform 320ms cubic-bezier(.2,.8,.2,1),
    background-color 320ms cubic-bezier(.2,.8,.2,1);
}

.hero-explore__rule {
  width: 100%;
  height: 1px;
  background: currentColor;
  transform: scaleX(.42);
  transition: transform 320ms cubic-bezier(.2,.8,.2,1);
}

.hero-explore:hover,
.hero-explore:focus-visible {
  transform: translateX(-50%) translateY(-2px);
  background: rgba(255,255,255,.055);
}

.hero-explore:hover .hero-explore__rule,
.hero-explore:focus-visible .hero-explore__rule {
  transform: scaleX(1);
}

.hero-explore:active {
  transform: translateX(-50%) translateY(0) scale(.985);
}

.hero-explore:disabled {
  cursor: default;
}
```

Keep focus-visible outline support. Change the wrapper layer to:

```css
.hero-experience [data-hero-explore] {
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
}
```

Remove the old fallback override that forces EXPLORE to white/difference only for fallback; the new difference treatment is universal.

- [ ] **Step 4: Keep reduced-motion behavior intentional**

Extend the existing reduced-motion selector so CTA transforms/background transitions collapse to `1ms` without changing its static framed appearance:

```css
@media (prefers-reduced-motion: reduce) {
  .hero-explore,
  .hero-explore__rule {
    transition-duration: 1ms;
  }
}
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
node --import=tsx --test tests/interaction-polish.test.mjs tests/explore-fluid-exit.test.mjs
```

Expected: CTA assertions pass; fluid-exit assertions remain RED until later tasks. If running files together makes the overall command fail because the fluid-exit test still contains intentional RED assertions, run only the CTA-named test using Node's `--test-name-pattern` and confirm that named test passes.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css tests/interaction-polish.test.mjs
git commit -m "feat: strengthen explore button affordance"
```

---

### Task 3: Add a deterministic fullscreen exit-fluid source shader

**Files:**
- Create: `src/webgl/reveal/exitFluid.ts`
- Modify: `src/webgl/reveal/fluid/shaders.ts`
- Modify: `tests/fluid-reveal.test.mjs`
- Test: `tests/explore-fluid-exit.test.mjs`

**Interfaces:**
- Produces:
  - `EXIT_FLUID_CONFIG` with stable numeric parameters.
  - `clampExitProgress(progress: number): number`.
  - `EXIT_SOURCE_FRAGMENT` consuming `uTarget`, `uExitProgress`, `uVelocityPass`, `uSourceBandTop`, `uDyeStrength`, `uVelocityBase`, `uVelocityPeak`, and `uLateralStrength`.
- Consumed by: `RevealEngine` in Task 4.

- [ ] **Step 1: Add failing shader/config assertions**

Extend `tests/fluid-reveal.test.mjs`:

```js
test('fluid exit source is one deterministic fullscreen pass, not periodic wave math', async () => {
  const shaders = read('src/webgl/reveal/fluid/shaders.ts');
  const exit = await import('../src/webgl/reveal/exitFluid.ts');

  assert.match(shaders, /EXIT_SOURCE_FRAGMENT/);
  assert.match(shaders, /uVelocityPass/);
  assert.match(shaders, /uSourceBandTop/);
  assert.match(shaders, /gaussian/);
  assert.doesNotMatch(shaders, /sin\s*\(|fbm|simplex|hash\s*\(/i);

  assert.equal(exit.EXIT_FLUID_CONFIG.sourceBandTop, 0.14);
  assert.equal(exit.EXIT_FLUID_CONFIG.dyeStrength, 0.24);
  assert.equal(exit.EXIT_FLUID_CONFIG.velocityBase, 4.2);
  assert.equal(exit.EXIT_FLUID_CONFIG.velocityPeak, 7.0);
  assert.equal(exit.EXIT_FLUID_CONFIG.lateralStrength, 0.35);
  assert.equal(exit.EXIT_FLUID_CONFIG.sealStart, 0.94);
  assert.equal(exit.clampExitProgress(-1), 0);
  assert.equal(exit.clampExitProgress(2), 1);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs
```

Expected: FAIL because `exitFluid.ts` and `EXIT_SOURCE_FRAGMENT` do not exist.

- [ ] **Step 3: Create the exit-fluid configuration module**

Create `src/webgl/reveal/exitFluid.ts`:

```ts
export const EXIT_FLUID_CONFIG = {
  sourceBandTop: 0.14,
  dyeStrength: 0.24,
  velocityBase: 4.2,
  velocityPeak: 7.0,
  lateralStrength: 0.35,
  sealStart: 0.94,
} as const;

export function clampExitProgress(progress: number) {
  return Math.min(1, Math.max(0, progress));
}
```

Do not put duration/easing constants here; this file owns solver/material parameters only.

- [ ] **Step 4: Add `EXIT_SOURCE_FRAGMENT`**

Append a shader with this structure to `src/webgl/reveal/fluid/shaders.ts`:

```glsl
export const EXIT_SOURCE_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTarget;
uniform float uExitProgress;
uniform float uVelocityPass;
uniform float uSourceBandTop;
uniform float uDyeStrength;
uniform float uVelocityBase;
uniform float uVelocityPeak;
uniform float uLateralStrength;

float gaussian(float x, float center, float width) {
  float d = (x - center) / width;
  return exp(-(d * d));
}

void main() {
  vec3 base = texture(uTarget, vUv).xyz;
  float sourceBand = 1.0 - smoothstep(uSourceBandTop - 0.04, uSourceBandTop, vUv.y);
  float drive = smoothstep(0.0, 0.72, clamp(uExitProgress, 0.0, 1.0));

  float left = gaussian(vUv.x, 0.22, 0.24);
  float middle = gaussian(vUv.x, 0.58, 0.30);
  float right = gaussian(vUv.x, 0.84, 0.18);

  float verticalProfile = 0.92 + 0.16 * left - 0.08 * middle + 0.12 * right;
  float lateralProfile = (left - right) * uLateralStrength;
  float upward = mix(uVelocityBase, uVelocityPeak, drive) * verticalProfile;

  vec3 dyeInjection = vec3(sourceBand * uDyeStrength);
  vec3 velocityInjection = vec3(
    sourceBand * lateralProfile,
    sourceBand * upward,
    0.0
  );

  float velocityPass = step(0.5, uVelocityPass);
  vec3 injection = mix(dyeInjection, velocityInjection, velocityPass);
  outColor = vec4(base + injection, 1.0);
}`;
```

The exact broad Gaussian constants above are deliberate; do not introduce time oscillation or periodic functions.

- [ ] **Step 5: Run shader/config tests and verify GREEN**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs
```

Expected: PASS for the new source/config contract.

- [ ] **Step 6: Compile the shader in the existing WebGL probe/harness if available**

Run the repo probe if dependencies/browser are available:

```bash
npm run probe:nothin
```

If the probe does not yet include `EXIT_SOURCE_FRAGMENT`, add it to the same shader compilation list used for the reveal programs before treating this step as passed.

- [ ] **Step 7: Commit**

```bash
git add src/webgl/reveal/exitFluid.ts src/webgl/reveal/fluid/shaders.ts tests/fluid-reveal.test.mjs
git commit -m "feat: add fluid exit source pass"
```

---

### Task 4: Replace `bottomFill` with solver-driven `fluidExit` end-to-end

**Files:**
- Modify: `src/webgl/reveal/RevealEngine.ts`
- Modify: `src/webgl/reveal/shaders.ts`
- Modify: `src/experience/motion/exploreTimeline.ts`
- Modify: `src/app/globals.css`
- Delete: `src/webgl/reveal/emitters/bottomFillEmitter.ts`
- Modify: `tests/fluid-reveal.test.mjs`
- Modify: `tests/explore-fluid-exit.test.mjs`
- Modify: `tests/visual-contract.test.mjs`

**Interfaces:**
- Consumes:
  - `EXIT_SOURCE_FRAGMENT`.
  - `EXIT_FLUID_CONFIG` and `clampExitProgress`.
  - existing `RevealEngine.quality.enableVelocity`.
- Produces:
  - `RevealMode = 'reveal' | 'fluidExit' | 'disabled'`.
  - `RevealEngine.setExitProgress(progress: number): void`.
  - `RevealEngine.getExitProgress(): number`.
  - `runExploreTimeline` choosing solver exit vs DOM fallback.

- [ ] **Step 1: Strengthen the failing engine/timeline contract**

Add assertions to `tests/explore-fluid-exit.test.mjs`:

```js
assert.match(engine, /export type RevealMode = 'reveal' \| 'fluidExit' \| 'disabled'/);
assert.match(engine, /this\.mode === 'reveal' \|\| this\.mode === 'fluidExit'/);
assert.match(engine, /applyExitSource\(this\.velocity/);
assert.match(engine, /applyExitSource\(this\.dye/);
assert.match(timeline, /engine\.quality\.enableVelocity/);
assert.match(timeline, /!options\.reducedMotion/);
assert.match(timeline, /engine\.setMode\('fluidExit'\)/);
assert.match(timeline, /engine\.setExitProgress\(progress\.value\)/);
assert.match(timeline, /duration:\s*1\.6/);
assert.match(timeline, /duration:\s*0\.06/);
assert.match(css, /hero-reveal-canvas\[data-reveal-mode='fluidExit'\][^}]*mix-blend-mode:\s*normal/s);
```

Add/adjust `tests/fluid-reveal.test.mjs` to require `exitSourceProgram` disposal and continued solver stepping in `fluidExit`.

- [ ] **Step 2: Run and verify RED**

```bash
node --import=tsx --test tests/explore-fluid-exit.test.mjs tests/fluid-reveal.test.mjs
```

Expected: FAIL on engine/timeline/composite assertions.

- [ ] **Step 3: Convert the engine mode/API**

In `RevealEngine.ts`:

```ts
import { EXIT_FLUID_CONFIG, clampExitProgress } from './exitFluid';
import { EXIT_SOURCE_FRAGMENT, ... } from './fluid/shaders';

export type RevealMode = 'reveal' | 'fluidExit' | 'disabled';
```

Add fields:

```ts
private readonly exitSourceProgram: ProgramBundle;
private exitProgress = 0;
```

Compile the source program in the constructor:

```ts
this.exitSourceProgram = createProgram(gl, FLUID_VERTEX, EXIT_SOURCE_FRAGMENT);
```

Replace the bottom-fill methods with:

```ts
setExitProgress(progress: number) {
  this.exitProgress = clampExitProgress(progress);
}

getExitProgress() {
  return this.exitProgress;
}
```

`clear()` must reset `exitProgress = 0` in addition to clearing targets/input/timing.

- [ ] **Step 4: Add the two-pass exit source injection**

Add a method that reuses the same fullscreen geometry and ping-pong targets:

```ts
private applyExitSource(target: DoubleFluidTarget, velocityPass: boolean) {
  const gl = this.gl;
  const program = this.exitSourceProgram;
  this.drawProgram(program, target.write);
  bindTextureUnit(gl, program, 'uTarget', target.read.texture, 0);
  gl.uniform1f(getUniform(gl, program, 'uExitProgress'), this.exitProgress);
  gl.uniform1f(getUniform(gl, program, 'uVelocityPass'), velocityPass ? 1 : 0);
  gl.uniform1f(getUniform(gl, program, 'uSourceBandTop'), EXIT_FLUID_CONFIG.sourceBandTop);
  gl.uniform1f(getUniform(gl, program, 'uDyeStrength'), EXIT_FLUID_CONFIG.dyeStrength);
  gl.uniform1f(getUniform(gl, program, 'uVelocityBase'), EXIT_FLUID_CONFIG.velocityBase);
  gl.uniform1f(getUniform(gl, program, 'uVelocityPeak'), EXIT_FLUID_CONFIG.velocityPeak);
  gl.uniform1f(getUniform(gl, program, 'uLateralStrength'), EXIT_FLUID_CONFIG.lateralStrength);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  target.swap();
}
```

In `stepFluid(now)`:

```ts
if (this.mode === 'reveal') {
  this.applyPendingSplat();
} else if (this.mode === 'fluidExit') {
  if (this.quality.enableVelocity) this.applyExitSource(this.velocity, true);
  this.applyExitSource(this.dye, false);
}
```

Keep the existing advection/projection sequence after this branch.

Change the RAF condition from reveal-only to:

```ts
if (this.mode === 'reveal' || this.mode === 'fluidExit') this.stepFluid(now);
```

- [ ] **Step 5: Replace analytic fill compositing with dye-based black compositing**

In `src/webgl/reveal/shaders.ts` remove:

```glsl
uTime
uFillProgress
uFillEnabled
sin(...)
crest
fill
```

Add:

```glsl
uniform float uExitProgress;
uniform float uExitEnabled;
uniform float uExitSealStart;
```

Use this branch after computing the thresholded dye mask:

```glsl
if (uExitEnabled > 0.5) {
  float seal = smoothstep(uExitSealStart, 1.0, clamp(uExitProgress, 0.0, 1.0));
  float alpha = max(reveal, seal);
  outColor = vec4(0.0, 0.0, 0.0, alpha);
  return;
}
```

Keep the existing registered-brand difference composite unchanged for normal reveal mode.

Update `renderComposite` uniforms:

```ts
gl.uniform1f(getUniform(gl, program, 'uExitProgress'), this.exitProgress);
gl.uniform1f(getUniform(gl, program, 'uExitEnabled'), this.mode === 'fluidExit' ? 1 : 0);
gl.uniform1f(getUniform(gl, program, 'uExitSealStart'), EXIT_FLUID_CONFIG.sealStart);
```

Remove the old time/fill uniforms. `renderComposite` no longer needs a `time` argument unless another current caller genuinely uses it.

- [ ] **Step 6: Dispose the new program and remove old bottom-fill semantics**

Add:

```ts
gl.deleteProgram(this.exitSourceProgram.program);
```

Delete all `fillProgress`, `setBottomFillProgress`, `getBottomFillProgress`, and `'bottomFill'` references from `RevealEngine.ts`.

Delete:

```text
src/webgl/reveal/emitters/bottomFillEmitter.ts
```

- [ ] **Step 7: Drive the new mode from the EXPLORE timeline**

In `exploreTimeline.ts`, remove the `bottomFillState` import.

Use explicit durations:

```ts
const fluidDuration = 1.6;
const fallbackDuration = options.reducedMotion ? 0.24 : 0.9;
const finalBlackHold = options.reducedMotion ? 0 : 0.06;
const canFluidExit = Boolean(
  engine &&
  engine.quality.enableVelocity &&
  !options.reducedMotion
);
```

Initialization:

```ts
if (canFluidExit && engine) {
  engine.clear();
  engine.setExitProgress(0);
  engine.setMode('fluidExit');
} else {
  if (engine) engine.setMode('disabled');
  if (fallbackFill) {
    gsap.set(fallbackFill, {
      display: 'block',
      scaleY: 0,
      transformOrigin: '50% 100%',
    });
  }
}
```

Keep the button acknowledgement restrained:

```ts
timeline.to(button, {
  autoAlpha: 0,
  y: -4,
  duration: options.reducedMotion ? 0.06 : 0.2,
  ease: 'power2.out',
}, 0);
```

Fluid branch:

```ts
if (canFluidExit && engine) {
  timeline.to(progress, {
    value: 1,
    duration: fluidDuration,
    ease: 'power2.inOut',
    onUpdate: () => engine.setExitProgress(progress.value),
  }, 0.04);
} else if (fallbackFill) {
  timeline.to(fallbackFill, {
    scaleY: 1,
    duration: fallbackDuration,
    ease: 'power3.inOut',
  }, options.reducedMotion ? 0 : 0.04);
}

timeline.to({}, { duration: finalBlackHold });
```

On completion, if the engine is in fluid exit, force the driver to exactly `1` before invoking the existing callback:

```ts
if (canFluidExit && engine) engine.setExitProgress(1);
options.onComplete();
```

Do not change the navigation/hash handoff in `Hero.tsx`.

- [ ] **Step 8: Make the DOM fallback deliberately simple**

Change the canvas mode rule:

```css
.hero-reveal-canvas[data-reveal-mode='fluidExit'] { mix-blend-mode: normal; }
```

Remove the old `bottomFill` selector.

Change `.hero-exit-fill` to a plain black layer without the fake organic rounded crest:

```css
.hero-exit-fill {
  display: none;
  position: absolute;
  inset: 0;
  z-index: 8;
  background: var(--wr-black);
  pointer-events: none;
  will-change: transform;
}
```

- [ ] **Step 9: Update visual contracts to reject the old wave implementation**

In `tests/visual-contract.test.mjs` add:

```js
test('EXPLORE exit uses solver dye rather than an analytic sine crest', () => {
  const shader = read('src/webgl/reveal/shaders.ts');
  const engine = read('src/webgl/reveal/RevealEngine.ts');
  assert.match(shader, /uExitProgress/);
  assert.match(shader, /uExitEnabled/);
  assert.doesNotMatch(shader, /sin\s*\(/);
  assert.doesNotMatch(engine, /bottomFill/);
});
```

- [ ] **Step 10: Run focused tests and verify GREEN**

```bash
node --import=tsx --test \
  tests/explore-fluid-exit.test.mjs \
  tests/fluid-reveal.test.mjs \
  tests/interaction-polish.test.mjs \
  tests/visual-contract.test.mjs
```

Expected: all focused tests PASS with zero failures.

- [ ] **Step 11: Run typecheck before committing the integrated behavior**

```bash
npm run typecheck
```

Expected: exit `0`.

- [ ] **Step 12: Commit**

```bash
git add \
  src/webgl/reveal/RevealEngine.ts \
  src/webgl/reveal/shaders.ts \
  src/experience/motion/exploreTimeline.ts \
  src/app/globals.css \
  tests/fluid-reveal.test.mjs \
  tests/explore-fluid-exit.test.mjs \
  tests/visual-contract.test.mjs
git rm src/webgl/reveal/emitters/bottomFillEmitter.ts
git commit -m "feat: replace explore wipe with fluid exit"
```

---

### Task 5: Verify visual character, fallback behavior, and performance without retuning the interactive reveal

**Files:**
- Modify only if QA proves a named mismatch: `src/webgl/reveal/exitFluid.ts`
- Modify only if QA proves a named timing mismatch: `src/experience/motion/exploreTimeline.ts`
- Test: `tests/explore-fluid-exit.test.mjs`

**Interfaces:**
- Consumes: completed CTA + `fluidExit` implementation.
- Produces: visually accepted constants with no changes to normal reveal physics.

- [ ] **Step 1: Start the real site and verify the normal hero before clicking EXPLORE**

Run:

```bash
npm run dev
```

At `1920×1080` and `390×844`, verify before click:

- interactive reveal still has the approved doubled footprint and `11800` force;
- EXPLORE remains readable over both white and revealed black regions;
- CTA is visibly framed but not visually dominant;
- hover lift is approximately `2px`, rule expansion is smooth, active press is restrained;
- navigation and pointer interaction remain unaffected.

Do not change `quality.ts` during this task.

- [ ] **Step 2: Verify the GPU exit character on full and lite profiles**

Exercise:

1. Click EXPLORE with no prior reveal strokes.
2. Draw a large reveal stroke, then click EXPLORE.
3. Click EXPLORE after leaving the hero idle for several seconds.
4. Repeat at desktop, tablet, and a low-memory/mobile profile that selects `lite`.

Acceptance:

- material begins from the bottom;
- front has 2–4 broad asymmetric shoulders, not a repeating wave;
- no obvious circle chain or splat stamps;
- no smoke/flame/ocean-wave reading;
- takeover reaches the top within the `1.6s` driver window;
- the last seal is not perceptible as a separate flash;
- viewport is already fully black during the `0.06s` hold;
- main/ribbon state appears without a luminance flash.

- [ ] **Step 3: Apply only bounded exit-specific tuning if one of two named failures occurs**

If the fluid front **stalls below the top before the completion seal**, change only:

```ts
velocityPeak: 7.0 -> 8.0
```

Re-test before changing anything else. Do not exceed `9.0` without a new design decision.

If the front is **too vertically uniform/flat**, change only:

```ts
lateralStrength: 0.35 -> 0.45
```

Re-test before changing anything else. Do not add sine/time noise.

If neither named failure occurs, keep the design constants exactly as specified.

- [ ] **Step 4: Verify reduced motion**

With `prefers-reduced-motion: reduce`:

- EXPLORE remains framed/static.
- button transition durations collapse.
- engine fluid exit is not used.
- DOM black fill completes in approximately `0.24s`.
- no fluid source passes run during exit.
- handoff remains fully black.

- [ ] **Step 5: Verify forced WebGL fallback**

Force `createRevealEngine` to return `null` through the existing fallback/test mechanism or browser capability override. Verify:

- EXPLORE remains visible and clickable;
- DOM fill uses approximately `0.9s`;
- fallback has no rounded fake-wave crest;
- main/ribbon handoff still completes.

- [ ] **Step 6: Re-run focused tests after any tuning**

```bash
node --import=tsx --test \
  tests/explore-fluid-exit.test.mjs \
  tests/fluid-reveal.test.mjs \
  tests/interaction-polish.test.mjs \
  tests/visual-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit only if tuning changed code**

If constants changed within the bounded rules above:

```bash
git add src/webgl/reveal/exitFluid.ts src/experience/motion/exploreTimeline.ts tests/explore-fluid-exit.test.mjs
git commit -m "fix: tune fluid exit takeover"
```

If no tuning was needed, do not create an empty commit.

---

### Task 6: Synchronize architecture/status docs and run the full release gate

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/IMPLEMENTATION_STATUS.md`

**Interfaces:**
- Consumes: final verified behavior.
- Produces: documentation that matches production and a release-ready verification record.

- [ ] **Step 1: Update architecture documentation**

In `docs/ARCHITECTURE.md`, replace references to the authored `bottomFill` crest with this production model:

```text
heroInteractive:
  pointer -> latest sample/RAF -> persistent pressure-projected fluid -> difference composite

heroExiting:
  bottom source pass (velocity + dye) -> same advection/projection solver -> thresholded black composite -> final 6% seal -> main
```

Explicitly record:

- `fluidExit` uses the same solver targets as reveal;
- source cost is two fullscreen passes/frame;
- no periodic crest shader remains;
- reduced-motion/WebGL failure use a plain DOM black fill.

- [ ] **Step 2: Update implementation status**

In `docs/IMPLEMENTATION_STATUS.md`, record:

- framed/difference-blended EXPLORE CTA;
- fluid solver takeover on normal motion;
- simple fallback path;
- exact verification commands actually run and any environment limitations.

Do not claim browser/build/test evidence that was not actually executed.

- [ ] **Step 3: Run the complete test suite**

```bash
npm test
```

Expected: all tests pass, zero failures.

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```

Expected: exit `0`.

- [ ] **Step 5: Run production build**

```bash
npm run build
```

Expected: exit `0`.

- [ ] **Step 6: Check whitespace/patch integrity**

```bash
git diff --check
```

Expected: no output and exit `0`.

- [ ] **Step 7: Inspect final branch scope**

```bash
git status --short
git diff --stat origin/main...HEAD
git diff origin/main...HEAD -- \
  src/components/experience/Hero \
  src/experience/motion/exploreTimeline.ts \
  src/webgl/reveal \
  src/app/globals.css \
  tests \
  docs
```

Verify no unrelated page/service/work/footer changes entered this feature.

- [ ] **Step 8: Commit docs**

```bash
git add docs/ARCHITECTURE.md docs/IMPLEMENTATION_STATUS.md
git commit -m "docs: record explore fluid exit architecture"
```

- [ ] **Step 9: Do not merge automatically**

Leave `feature/hero-nothin-reveal-fidelity` intact for user review. Merge only after explicit user instruction.

---

## Final Acceptance Checklist

- [ ] EXPLORE has a visible 1px frame, 4px radius, 126px minimum width, 44px minimum height.
- [ ] EXPLORE uses `#fff` + `mix-blend-mode: difference` and sits above the reveal compositor.
- [ ] Hover is a 2px lift + faint wash + rule expansion; active press is `.985`; no glow/pill/bounce.
- [ ] `bottomFill` mode and `bottomFillEmitter.ts` are removed.
- [ ] `COMPOSITE_FRAGMENT` contains no sine-wave exit crest.
- [ ] `fluidExit` injects one velocity source pass + one dye source pass per solver frame.
- [ ] Existing advection/divergence/pressure/gradient passes remain the motion engine.
- [ ] Normal interactive reveal constants/pointer behavior remain unchanged.
- [ ] Final completion seal starts only at `0.94` and reaches fully black at `1.0`.
- [ ] Reduced motion bypasses fluid exit and uses the short DOM fill.
- [ ] WebGL failure uses the plain DOM fill.
- [ ] Full viewport is black before `onExploreComplete` changes state.
- [ ] Focused tests, full tests, typecheck, build, and `git diff --check` have fresh passing evidence before completion is claimed.
