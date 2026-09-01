# EXPLORE CTA + Fluid Exit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make EXPLORE visibly actionable without over-designing it, then replace the old sine-wave upward wipe with a solver-driven black fluid flood that rises from below and hands off seamlessly to the existing ribbon/main experience.

**Architecture:** Keep the CTA entirely in DOM/CSS, raise it above the reveal compositor, and use difference blending for automatic contrast. Replace `bottomFill` with a `fluidExit` mode in the existing `RevealEngine`; one fullscreen source pass is applied to velocity and one to dye each solver frame, then the existing advection + pressure pipeline creates the front. The compositor renders exit dye as black and uses only a final `0.94 → 1.0` global seal to guarantee a fully black handoff.

**Tech Stack:** Next.js 16.3, React 19.2.8, TypeScript 7.0.2, GSAP 3.15, custom WebGL2 / GLSL ES 3.00, Node test runner + `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-01-explore-cta-fluid-exit-design.md`

## Global Constraints

- Do not change the approved interactive reveal pointer behavior, radius, force, dissipation, pressure iterations, threshold, or timing.
- No glow, blue gradient, glassmorphism, pill CTA, bounce, or large scale animation.
- No new animation/rendering dependency.
- No `sin`, periodic wave, FBM, simplex, or hash noise may control the visible exit front.
- Reuse existing velocity/dye/pressure/divergence render targets; do not raise simulation resolution.
- `fluidExit` runs only when motion is normal and the engine has velocity enabled.
- Reduced motion and engine failure use the existing DOM fallback layer, simplified to a plain black fill.
- Viewport must be fully black before `onExploreComplete` fires.
- EXPLORE must remain at least `44px` high.
- Do not merge this branch without explicit user instruction.

---

## File Map

**Create**
- `src/webgl/reveal/exitFluid.ts` — exit-only solver constants + progress clamp.
- `tests/explore-fluid-exit.test.mjs` — focused CTA/exit source contract.

**Modify**
- `src/app/globals.css`
- `src/webgl/reveal/fluid/shaders.ts`
- `src/webgl/reveal/shaders.ts`
- `src/webgl/reveal/RevealEngine.ts`
- `src/experience/motion/exploreTimeline.ts`
- `tests/fluid-reveal.test.mjs`
- `tests/interaction-polish.test.mjs`
- `tests/visual-contract.test.mjs`
- `docs/ARCHITECTURE.md`
- `docs/IMPLEMENTATION_STATUS.md`

**Delete**
- `src/webgl/reveal/emitters/bottomFillEmitter.ts`

---

### Task 1: Restore a truthful test baseline and define the new RED contract

**Files:**
- Create: `tests/explore-fluid-exit.test.mjs`
- Modify: `tests/visual-contract.test.mjs`

**Interfaces:**
- Consumes: current approved reveal profile.
- Produces: a clean baseline plus failing CTA/exit tests.

- [ ] **Step 1: Repair the stale force assertion**

The current visual contract still expects the superseded `5900` force. Change it to:

```js
assert.match(quality, /splatForce:\s*11800/);
```

Rename that test so it does not claim the profile is an untouched Nothin baseline:

```js
test('full quality profile preserves the approved WEBERAISE fluid profile', () => {
```

- [ ] **Step 2: Verify the existing reveal baseline**

Run:

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs tests/visual-contract.test.mjs
```

Expected: PASS before new feature assertions are added.

- [ ] **Step 3: Create `tests/explore-fluid-exit.test.mjs`**

Use:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('EXPLORE is a framed difference-blended CTA above the reveal compositor', () => {
  const css = read('src/app/globals.css');
  assert.match(css, /\.hero-explore\s*\{[^}]*min-width:\s*126px/s);
  assert.match(css, /\.hero-explore\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.hero-explore\s*\{[^}]*border:\s*1px solid currentColor/s);
  assert.match(css, /\.hero-explore\s*\{[^}]*border-radius:\s*4px/s);
  assert.match(css, /\.hero-explore\s*\{[^}]*color:\s*#fff[^}]*mix-blend-mode:\s*difference/s);
  assert.match(css, /\.hero-explore:hover[^}]*translateY\(-2px\)/s);
  assert.match(css, /\.hero-explore:active[^}]*scale\(\.985\)/s);
  assert.match(css, /\[data-hero-explore\][^}]*z-index:\s*7/s);
});

test('EXPLORE exit is solver-driven fluid rather than analytic bottomFill', () => {
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
  assert.match(composite, /uExitSealStart/);
  assert.match(composite, /smoothstep\(uExitSealStart,\s*1\.0,\s*clamp\(uExitProgress/);
  assert.doesNotMatch(composite, /sin\s*\(/);
  assert.doesNotMatch(engine, /bottomFill/);
  assert.doesNotMatch(timeline, /bottomFillState|setBottomFillProgress|setMode\('bottomFill'\)/);
});
```

- [ ] **Step 4: Verify RED**

Run:

```bash
node --import=tsx --test tests/explore-fluid-exit.test.mjs
```

Expected: FAIL because the current CTA is unframed/normal-blended and `fluidExit` does not exist.

- [ ] **Step 5: Commit**

```bash
git add tests/visual-contract.test.mjs tests/explore-fluid-exit.test.mjs
git commit -m "test: define explore CTA and fluid exit contract"
```

---

### Task 2: Upgrade EXPLORE affordance without changing hero composition

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tests/interaction-polish.test.mjs`
- Test: `tests/explore-fluid-exit.test.mjs`

**Interfaces:**
- Uses the existing `HeroExploreButton` markup and existing GSAP wrapper `[data-hero-explore]`.
- Produces no new React state or component API.

- [ ] **Step 1: Change the existing interaction contract to the new CTA design**

Replace the old assertions requiring `color:#000` and `mix-blend-mode:normal` with:

```js
assert.match(css, /\.hero-explore[\s\S]*min-width:\s*126px/);
assert.match(css, /\.hero-explore[\s\S]*min-height:\s*44px/);
assert.match(css, /\.hero-explore[\s\S]*border:\s*1px solid currentColor/);
assert.match(css, /\.hero-explore[\s\S]*color:\s*#fff/);
assert.match(css, /\.hero-explore[\s\S]*mix-blend-mode:\s*difference/);
assert.match(css, /\[data-hero-explore\][\s\S]*z-index:\s*7/);
```

- [ ] **Step 2: Verify CTA RED**

Run only the CTA contract while the fluid-exit contract remains intentionally RED:

```bash
node --import=tsx --test --test-name-pattern="EXPLORE is a framed" tests/explore-fluid-exit.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Implement the CTA styling**

Replace the current EXPLORE styling with:

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
  background: rgba(255,255,255,0);
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
```

Keep the existing focus-visible outline. Change the wrapper to:

```css
.hero-experience [data-hero-explore] {
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
}
```

Remove the old fallback-only EXPLORE color override; difference blending is now universal.

- [ ] **Step 4: Preserve reduced-motion behavior**

Add `.hero-explore` to the reduced-motion transition-duration collapse so its static framed appearance remains but hover movement is effectively disabled.

- [ ] **Step 5: Verify CTA GREEN**

Run:

```bash
node --import=tsx --test --test-name-pattern="EXPLORE is a framed" tests/explore-fluid-exit.test.mjs
node --import=tsx --test tests/interaction-polish.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css tests/interaction-polish.test.mjs
git commit -m "feat: strengthen explore button affordance"
```

---

### Task 3: Add the deterministic exit-fluid source module and shader

**Files:**
- Create: `src/webgl/reveal/exitFluid.ts`
- Modify: `src/webgl/reveal/fluid/shaders.ts`
- Modify: `tests/fluid-reveal.test.mjs`

**Interfaces:**
- Produces `EXIT_FLUID_CONFIG`, `clampExitProgress()`, and `EXIT_SOURCE_FRAGMENT`.
- `RevealEngine` consumes them in Task 4.

- [ ] **Step 1: Add the failing source/config test**

Append to `tests/fluid-reveal.test.mjs`:

```js
test('fluid exit source is deterministic fullscreen injection without periodic wave math', async () => {
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

- [ ] **Step 2: Verify RED**

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs
```

Expected: FAIL on missing module/shader.

- [ ] **Step 3: Create `src/webgl/reveal/exitFluid.ts`**

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

- [ ] **Step 4: Add `EXIT_SOURCE_FRAGMENT` to `fluid/shaders.ts`**

Use one shader for both targets via `uVelocityPass`:

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

  vec3 injection = mix(dyeInjection, velocityInjection, step(0.5, uVelocityPass));
  outColor = vec4(base + injection, 1.0);
}`;
```

Do not add time oscillation.

- [ ] **Step 5: Verify GREEN and shader compilation**

Run:

```bash
node --import=tsx --test tests/fluid-reveal.test.mjs
npm run probe:nothin
```

If the probe's compile list does not include the new shader, add `EXIT_SOURCE_FRAGMENT` to that existing compile list before counting this step as verified.

- [ ] **Step 6: Commit**

```bash
git add src/webgl/reveal/exitFluid.ts src/webgl/reveal/fluid/shaders.ts tests/fluid-reveal.test.mjs
git commit -m "feat: add fluid exit source pass"
```

---

### Task 4: Replace `bottomFill` with `fluidExit` across engine, compositor, timeline, and fallback

**Files:**
- Modify: `src/webgl/reveal/RevealEngine.ts`
- Modify: `src/webgl/reveal/shaders.ts`
- Modify: `src/experience/motion/exploreTimeline.ts`
- Modify: `src/app/globals.css`
- Modify: `tests/fluid-reveal.test.mjs`
- Modify: `tests/explore-fluid-exit.test.mjs`
- Modify: `tests/visual-contract.test.mjs`
- Delete: `src/webgl/reveal/emitters/bottomFillEmitter.ts`

**Interfaces:**
- Produces `RevealMode = 'reveal' | 'fluidExit' | 'disabled'`.
- Produces `setExitProgress(progress: number)` and `getExitProgress()`.
- `runExploreTimeline` drives only `setExitProgress` and does not know solver internals.

- [ ] **Step 1: Strengthen engine/timeline RED assertions**

Add:

```js
assert.match(engine, /export type RevealMode = 'reveal' \| 'fluidExit' \| 'disabled'/);
assert.match(engine, /this\.mode === 'reveal' \|\| this\.mode === 'fluidExit'/);
assert.match(engine, /applyExitSource\(this\.velocity/);
assert.match(engine, /applyExitSource\(this\.dye/);
assert.match(timeline, /engine\.quality\.enableVelocity/);
assert.match(timeline, /!options\.reducedMotion/);
assert.match(timeline, /engine\.setMode\('fluidExit'\)/);
assert.match(timeline, /engine\.setExitProgress\(progress\.value\)/);
assert.match(timeline, /fluidDuration = 1\.6/);
assert.match(timeline, /finalBlackHold = options\.reducedMotion \? 0 : 0\.06/);
```

Verify RED:

```bash
node --import=tsx --test tests/explore-fluid-exit.test.mjs tests/fluid-reveal.test.mjs
```

- [ ] **Step 2: Convert `RevealEngine` mode/API**

Import:

```ts
import { EXIT_FLUID_CONFIG, clampExitProgress } from './exitFluid';
import { EXIT_SOURCE_FRAGMENT, ... } from './fluid/shaders';
```

Change:

```ts
export type RevealMode = 'reveal' | 'fluidExit' | 'disabled';
```

Add:

```ts
private readonly exitSourceProgram: ProgramBundle;
private exitProgress = 0;
```

Compile:

```ts
this.exitSourceProgram = createProgram(gl, FLUID_VERTEX, EXIT_SOURCE_FRAGMENT);
```

Replace bottom-fill API:

```ts
setExitProgress(progress: number) {
  this.exitProgress = clampExitProgress(progress);
}

getExitProgress() {
  return this.exitProgress;
}
```

`clear()` must also reset `this.exitProgress = 0`.

- [ ] **Step 3: Add source injection to the existing solver**

Add:

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

At the start of `stepFluid(now)`:

```ts
if (this.mode === 'reveal') {
  this.applyPendingSplat();
} else if (this.mode === 'fluidExit') {
  if (this.quality.enableVelocity) this.applyExitSource(this.velocity, true);
  this.applyExitSource(this.dye, false);
}
```

Leave the existing advection → divergence → pressure → gradient sequence unchanged.

RAF condition becomes:

```ts
if (this.mode === 'reveal' || this.mode === 'fluidExit') this.stepFluid(now);
```

- [ ] **Step 4: Replace analytic crest compositing**

In `src/webgl/reveal/shaders.ts`, delete `uTime`, `uFillProgress`, `uFillEnabled`, `edgeDamping`, `crest`, and the sine expressions.

Add:

```glsl
uniform float uExitProgress;
uniform float uExitEnabled;
uniform float uExitSealStart;
```

After the existing dye threshold:

```glsl
if (uExitEnabled > 0.5) {
  float seal = smoothstep(
    uExitSealStart,
    1.0,
    clamp(uExitProgress, 0.0, 1.0)
  );
  float alpha = max(reveal, seal);
  outColor = vec4(0.0, 0.0, 0.0, alpha);
  return;
}
```

Keep the normal registered-brand difference composite unchanged for `reveal`.

Update engine uniforms:

```ts
gl.uniform1f(getUniform(gl, program, 'uExitProgress'), this.exitProgress);
gl.uniform1f(getUniform(gl, program, 'uExitEnabled'), this.mode === 'fluidExit' ? 1 : 0);
gl.uniform1f(getUniform(gl, program, 'uExitSealStart'), EXIT_FLUID_CONFIG.sealStart);
```

Delete the old fill/time uniform writes.

- [ ] **Step 5: Finish engine cleanup**

Delete all `fillProgress`, `setBottomFillProgress`, `getBottomFillProgress`, and `'bottomFill'` references.

Dispose:

```ts
gl.deleteProgram(this.exitSourceProgram.program);
```

Delete `src/webgl/reveal/emitters/bottomFillEmitter.ts`.

- [ ] **Step 6: Rewrite `runExploreTimeline` orchestration**

Remove the `bottomFillState` import.

Use:

```ts
const progress = { value: 0 };
const fluidDuration = 1.6;
const fallbackDuration = options.reducedMotion ? 0.24 : 0.9;
const finalBlackHold = options.reducedMotion ? 0 : 0.06;
const canFluidExit = Boolean(
  engine && engine.quality.enableVelocity && !options.reducedMotion
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

Button acknowledgement:

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

On completion:

```ts
if (canFluidExit && engine) engine.setExitProgress(1);
options.onComplete();
```

Do not change navigation/hash logic in `Hero.tsx`.

- [ ] **Step 7: Simplify CSS mode/fallback**

Replace:

```css
.hero-reveal-canvas[data-reveal-mode='bottomFill']
```

with:

```css
.hero-reveal-canvas[data-reveal-mode='fluidExit'] { mix-blend-mode: normal; }
```

Make fallback a plain full layer:

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

Remove its rounded top.

- [ ] **Step 8: Update visual contracts**

Add to `tests/visual-contract.test.mjs`:

```js
test('EXPLORE exit uses solver dye rather than an analytic sine crest', () => {
  const shader = read('src/webgl/reveal/shaders.ts');
  const engine = read('src/webgl/reveal/RevealEngine.ts');
  assert.match(shader, /uExitProgress/);
  assert.match(shader, /uExitSealStart/);
  assert.doesNotMatch(shader, /sin\s*\(/);
  assert.doesNotMatch(engine, /bottomFill/);
});
```

- [ ] **Step 9: Verify integrated GREEN**

Run:

```bash
node --import=tsx --test \
  tests/explore-fluid-exit.test.mjs \
  tests/fluid-reveal.test.mjs \
  tests/interaction-polish.test.mjs \
  tests/visual-contract.test.mjs
npm run typecheck
```

Expected: all focused tests pass and typecheck exits `0`.

- [ ] **Step 10: Commit**

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

### Task 5: Visual/performance QA with bounded exit-only tuning

**Files:**
- Modify only if a named QA failure occurs: `src/webgl/reveal/exitFluid.ts`
- Modify only if timing itself is wrong: `src/experience/motion/exploreTimeline.ts`

**Interfaces:**
- Must not touch `src/webgl/reveal/quality.ts`.
- Tuning is restricted to exit-specific constants.

- [ ] **Step 1: Run the real site**

```bash
npm run dev
```

Verify at `1920×1080`, `1440×900`, `1280×800`, tablet, and `390×844`:

- CTA is immediately visible as a control.
- It remains restrained relative to WELCOME/TO and the WEBERAISE lockup.
- Difference blending keeps it readable over white and revealed black.
- Hover lift is subtle; no glow/bounce/pill reading.
- Interactive reveal before click is visually unchanged.

- [ ] **Step 2: Exercise fluid exit from different hero states**

Test:

1. click EXPLORE immediately;
2. draw a large reveal stroke, then click;
3. leave the hero idle, then click;
4. repeat on full and lite profiles.

Acceptance:

- material originates from below;
- front forms roughly 2–4 broad asymmetric shoulders;
- no repeating wavelength;
- no visible Gaussian circle stamps;
- no ocean-wave/slime/smoke/flame reading;
- front reaches the top during the `1.6s` driver;
- last seal is not visible as a separate flash;
- black hold is continuous into main/ribbon state.

- [ ] **Step 3: Apply only the defined corrective tuning if needed**

If the front **stalls below the top** before the seal, change only:

```ts
velocityPeak: 7.0 -> 8.0
```

Re-test. Do not exceed `9.0` without a new design decision.

If the front is **too flat/uniform**, change only:

```ts
lateralStrength: 0.35 -> 0.45
```

Re-test. Do not add time oscillation/noise.

If neither named issue exists, leave constants unchanged.

- [ ] **Step 4: Verify reduced motion**

With `prefers-reduced-motion: reduce`:

- CTA remains framed.
- fluid exit is bypassed.
- engine is disabled for the exit.
- DOM black fill completes in approximately `0.24s`.
- no fluid source passes are required.

- [ ] **Step 5: Verify forced engine fallback**

Force the existing reveal engine creation path to fail/return `null` using the repo's existing fallback mechanism. Verify:

- CTA remains clickable;
- plain DOM black fill uses approximately `0.9s`;
- no rounded fake crest remains;
- handoff remains black.

- [ ] **Step 6: Re-run focused verification after any tuning**

```bash
node --import=tsx --test \
  tests/explore-fluid-exit.test.mjs \
  tests/fluid-reveal.test.mjs \
  tests/interaction-polish.test.mjs \
  tests/visual-contract.test.mjs
```

- [ ] **Step 7: Commit only if QA tuning changed code**

```bash
git add src/webgl/reveal/exitFluid.ts src/experience/motion/exploreTimeline.ts
git commit -m "fix: tune fluid exit takeover"
```

Skip this commit if no tuning was necessary.

---

### Task 6: Synchronize docs and run the full release gate

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/IMPLEMENTATION_STATUS.md`

- [ ] **Step 1: Update architecture documentation**

Record the production flows explicitly:

```text
heroInteractive:
  pointer -> latest sample/RAF -> persistent pressure-projected fluid -> difference composite

heroExiting:
  bottom source pass (velocity + dye) -> same solver -> thresholded black composite -> final 6% seal -> main
```

Also record:

- two extra fullscreen passes/frame during `fluidExit`;
- no new render targets;
- no periodic crest shader;
- reduced motion/WebGL failure use the plain DOM fill.

- [ ] **Step 2: Update implementation status**

Document the CTA, fluid exit, fallback behavior, exact verification performed, and any environment limitations. Do not report unrun commands as passing.

- [ ] **Step 3: Run the full gate**

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: every command exits `0`; `git diff --check` prints nothing.

- [ ] **Step 4: Inspect final scope**

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

Verify no unrelated site sections entered this work.

- [ ] **Step 5: Commit docs**

```bash
git add docs/ARCHITECTURE.md docs/IMPLEMENTATION_STATUS.md
git commit -m "docs: record explore fluid exit architecture"
```

- [ ] **Step 6: Stop for user review**

Do not merge. Leave `feature/hero-nothin-reveal-fidelity` ready for explicit review/merge instruction.

---

## Final Acceptance Checklist

- [ ] EXPLORE: `126px` minimum width, `44px` minimum height, `1px` frame, `4px` radius.
- [ ] EXPLORE: `#fff` source color + `mix-blend-mode:difference` above reveal/vignette.
- [ ] Hover: `2px` lift + faint interior wash + rule expansion; active press `.985`.
- [ ] No `bottomFill` production mode or `bottomFillEmitter.ts` remains.
- [ ] No sine-wave exit crest remains in `COMPOSITE_FRAGMENT`.
- [ ] `fluidExit` performs one velocity-source + one dye-source fullscreen pass per solver frame.
- [ ] Existing advection/divergence/pressure/gradient pipeline drives the front.
- [ ] Normal interactive reveal behavior remains unchanged.
- [ ] Completion seal is configured by `EXIT_FLUID_CONFIG.sealStart === 0.94` and passed as `uExitSealStart`.
- [ ] Reduced motion and engine failure use the plain DOM fill.
- [ ] Viewport is fully black before `onExploreComplete`.
- [ ] Focused tests, full tests, typecheck, build, and `git diff --check` have fresh passing evidence before completion is claimed.
