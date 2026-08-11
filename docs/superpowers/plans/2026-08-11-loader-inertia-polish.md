# Loader + Pointer Inertia Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the approved signature intro with a smaller inertial reveal footprint, buttery countdown pacing, perfectly registered zero handoff, updated loader tagline, slightly higher hero composition, and correct EXPLORE inversion.

**Architecture:** Keep the existing age-aware implicit liquid engine. Add/tune a pure inertial afterglide helper at the pointer-emitter boundary, keep countdown pacing in a pure timing module, and keep visual alignment/color behavior in shared CSS classes so front/reveal states remain registered without React color state.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, WebGL2, GSAP, Node test runner via `tsx`.

## Global Constraints
- Work only on `feature/signature-intro`; do not modify `main`.
- Preserve every integer from 100→0 and truthful critical-resource gating.
- Preserve the age-aware implicit liquid-surface engine and its clean geometric dissolution.
- Reduced-motion mode must disable pointer afterglide and keep loader timing short.
- Tagline copy must be exactly `Need a website for business?`.
- Countdown zero and completion zero must remain visually registered at viewport center.

---

### Task 1: Tighten pointer radius and inertial afterglide

**Files:**
- Modify: `src/webgl/reveal/inertia.ts`
- Modify: `src/components/experience/Hero/HeroRevealCanvas.tsx`
- Test: `tests/intro-polish.test.mjs`

**Interfaces:**
- Consumes: `RevealSample`, `createPointerTracker()`, `RevealEngine.emit()`.
- Produces: `createInertialAfterglide(options): InertialEmission[]` and tuned desktop/mobile pointer radius constants.

- [ ] Add tests proving speed below threshold yields no afterglide, faster velocity emits a short forward-only progression, radius/strength shrink over time, and total carry stays minor.
- [ ] Run the focused test and confirm it fails before any necessary implementation change.
- [ ] Tune pointer radius to `0.078` desktop and `0.10` mobile.
- [ ] Tune afterglide to ~320–380ms, bounded forward carry around 3–4 viewport-percent maximum, subtle deterministic lateral wobble, and progressively smaller/weaker emissions.
- [ ] Ensure new pointer movement cancels pending afterglide and reduced motion emits none.
- [ ] Run focused tests again.

### Task 2: Make countdown cadence and transitions buttery

**Files:**
- Modify: `src/experience/loading/countdownTiming.ts`
- Modify: `src/components/experience/Loader/LoaderCountdown.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/intro-polish.test.mjs`

**Interfaces:**
- Consumes: current countdown `value` and real-progress `target`.
- Produces: `countdownDelay()` plus `countdownTransitionMs()` used as CSS custom property.

- [ ] Add tests that delays increase monotonically toward zero, values 5→1 are deliberately slower, final zero hold is 700ms, and transition duration stays below the cadence while remaining smooth.
- [ ] Run focused tests and confirm missing transition-duration behavior fails.
- [ ] Add `countdownTransitionMs(value, reducedMotion)` to the timing module.
- [ ] Pass `--loader-digit-transition` from `LoaderCountdown` as an inline CSS custom property.
- [ ] Replace fixed 300ms digit animations with the custom duration and softer 5px travel / subtle scale.
- [ ] Keep early digits responsive while making 10→0 progressively slower.
- [ ] Run focused tests again.

### Task 3: Guarantee zero registration and completion copy

**Files:**
- Modify: `src/components/experience/Loader/LoaderCountdown.tsx`
- Modify: `src/components/experience/Loader/LoaderCompletion.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/intro-polish.test.mjs`

**Interfaces:**
- Produces: shared `.loader-zero-glyph` font metrics and exact viewport-center coordinates in both phases.

- [ ] Add structural tests requiring both zero elements to share `.loader-zero-glyph`, completion zero to use `left:50%`, `top:50vh`, and `translate(-50%,-50%)`, and tagline to equal exact approved copy.
- [ ] Ensure line width matches the tagline mask width (`min(92vw, 1100px)`).
- [ ] Preserve the 700ms countdown-zero hold before phase transition.
- [ ] Run focused tests.

### Task 4: Raise hero and keep EXPLORE self-inverting

**Files:**
- Modify: `src/app/globals.css`
- Test: `tests/intro-polish.test.mjs`

**Interfaces:**
- Produces: shared hero vertical offset and difference-blended EXPLORE styling.

- [ ] Add structural tests requiring the shared `.hero-composition` desktop offset to be slightly above the current `-3.6vh` target and `.hero-explore` to use white source color with `mix-blend-mode:difference`.
- [ ] Raise desktop composition to approximately `-4.2vh` with clamps; mobile to approximately `-2.9vh` with smaller clamps.
- [ ] Keep Explore bottom anchoring unchanged.
- [ ] Run focused tests.

### Task 5: Final verification and docs

**Files:**
- Modify: `docs/IMPLEMENTATION_STATUS.md`

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] If the sandbox cannot run dependency-backed verification, document that limitation and request the exact three commands in the user's checkout.
- [ ] Re-read the approved design checklist and confirm no unrelated intro behavior changed.
