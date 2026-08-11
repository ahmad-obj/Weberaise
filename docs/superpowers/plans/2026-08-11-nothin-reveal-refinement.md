# Nothin-inspired Reveal Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the existing Weberaise loader/hero/reveal so it matches the approved centered-loader, subtle-vignette, raised-composition, dense clean-blob behavior.

**Architecture:** Preserve the current one-route experience and persistent low-resolution WebGL history mask. Adjust loader positioning at the React/CSS layer and refine the shader field/composite thresholds rather than replacing the engine or adding another rendering framework.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, GSAP, WebGL2/GLSL.

## Global Constraints
- Preserve truthful 100→0 loader semantics.
- Preserve exact front/reveal typography registration.
- Reveal lifetime remains perceptually ~3–4 seconds.
- No smoky/foggy old trail.
- No watery ripples/splashes/full-screen turbulence.
- Keep adaptive quality/fallback behavior.

---

### Task 1: Center loader countdown

**Files:**
- Modify: `src/components/experience/Loader/LoaderCountdown.tsx`
- Modify: `src/components/experience/Loader/Loader.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/visual-contract.test.mjs`

**Interfaces:**
- Consumes: `value: number`
- Produces: centered current/previous countdown layers with no viewport-position dependency.

- [ ] Add a failing source-contract test asserting countdown no longer imports/uses `createCountdownPositions` and CSS centers the number at `50%/50%`.
- [ ] Simplify `LoaderCountdown` to a `value`-only component.
- [ ] Update `Loader` call site.
- [ ] Center both current and previous number layers in CSS.
- [ ] Run tests.

### Task 2: Add subtle hero depth and raise shared composition

**Files:**
- Modify: `src/app/globals.css`
- Test: `tests/visual-contract.test.mjs`

**Interfaces:**
- Consumes: existing `.hero-experience` and `.hero-composition`.
- Produces: shared upward transform and extremely faint radial edge vignette.

- [ ] Add failing source-contract assertions for a radial vignette overlay and shared composition translateY.
- [ ] Add a pseudo-element overlay above the reveal compositor with transparent center and <=3% black edge strength.
- [ ] Translate the shared composition upward with a clamped desktop value and smaller mobile override.
- [ ] Verify Explore positioning remains unchanged.
- [ ] Run tests.

### Task 3: Refine shader from fog to coherent blob erosion

**Files:**
- Modify: `src/webgl/reveal/shaders.ts`
- Modify: `src/webgl/reveal/quality.ts`
- Test: `tests/visual-contract.test.mjs`

**Interfaces:**
- Consumes: existing RevealEngine uniforms `uHalfLife`, `uAdvection`, `uNoiseAmount`.
- Produces: denser persistent history, low-frequency contour warp, narrow anti-aliased reveal threshold, minimal drift.

- [ ] Add failing assertions that high-frequency hash/floor noise is removed from reveal composition and the reveal threshold band is narrow/high.
- [ ] Reduce settling velocity amplitude and velocity injection influence.
- [ ] Preserve spatially graded splats but increase solid-core coherence.
- [ ] Replace temporal hash grain with low-frequency sinusoidal contour warp.
- [ ] Narrow `smoothstep` threshold so low-density history is invisible rather than fog-like.
- [ ] Increase half-life to retain ~3–4s visible lifetime after threshold tightening.
- [ ] Reduce advection materially.
- [ ] Increase full-quality mask resolution modestly.
- [ ] Run tests/typecheck/build where environment permits.

### Task 4: Persist approved decisions and verification notes

**Files:**
- Modify: `docs/reference/WEBERAISE_MASTER_PLANNING.parts/part-05.md`
- Modify: `docs/IMPLEMENTATION_STATUS.md`

- [ ] Append centered-loader, vignette, raised-composition and clean-blob dissolution decisions to the master plan.
- [ ] Record public Nothin implementation findings and clearly distinguish observed stack from proprietary source.
- [ ] Record verification evidence and any environment limitations.
