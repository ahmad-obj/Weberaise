# Interaction Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish pointer inertia, loader timing/alignment, tagline width/copy, hero vertical position, and EXPLORE inversion without changing the existing signature-intro architecture.

**Architecture:** Keep the current implicit-surface reveal engine. Add a small pointer afterglide helper at the interaction layer that emits a short decaying sequence of normal reveal samples after pointer motion becomes idle. Keep loader truthfulness and state flow intact; only adjust countdown cadence/transition motion and make the completion zero share a single typography metric contract with the countdown zero.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, GSAP, WebGL2, Node test runner via tsx.

## Global Constraints
- Work only on `feature/signature-intro`; do not modify `main` directly.
- Preserve the current solid implicit-liquid reveal and geometric dissolution.
- No smoke/fog/global advection/watery ripple behavior.
- Countdown remains truthful and cannot reach zero before critical readiness.
- Tagline copy must be exactly `Need a website for business?`.
- Countdown zero and completion zero must be visually identical in center position and effective font metrics.
- EXPLORE stays one DOM button and inverts via compositing, not duplicated masks.

---

### Task 1: Pointer radius and inertial afterglide

**Files:**
- Create: `src/webgl/reveal/inertia.ts`
- Modify: `src/components/experience/Hero/HeroRevealCanvas.tsx`
- Test: `tests/interaction-polish.test.mjs`

**Interfaces:**
- Produces `createInertialAfterglide(options)` returning time-offset `RevealSample` emissions from the last pointer point/velocity.
- `HeroRevealCanvas` schedules/cancels afterglide on pointer idle/move/leave.

- [ ] **Step 1: Write failing tests** asserting desktop/mobile radius literals are reduced and inertia helper exists, decays, advances in velocity direction, and ends within 450ms.
- [ ] **Step 2: Run `npm test -- tests/interaction-polish.test.mjs` and confirm failure.**
- [ ] **Step 3: Implement `createInertialAfterglide`** with deterministic lateral wobble, 5–7 emissions, decaying radius/strength/velocity, max duration 0.42s, and near-zero output below a small speed threshold.
- [ ] **Step 4: Wire pointer idle scheduling** so every move cancels the pending afterglide, stores the latest point/velocity, and schedules carry after a short idle threshold; pointerleave cancels it.
- [ ] **Step 5: Change pointer radius** to approximately `0.085` desktop and `0.11` mobile.
- [ ] **Step 6: Run the focused test and full test suite.**

### Task 2: Butter-smooth loader cadence and zero handoff

**Files:**
- Create: `src/experience/loading/countdownTiming.ts`
- Modify: `src/components/experience/Loader/Loader.tsx`
- Modify: `src/components/experience/Loader/LoaderCountdown.tsx`
- Modify: `src/components/experience/Loader/LoaderCompletion.tsx`
- Modify: `src/experience/motion/loaderTimeline.ts`
- Modify: `src/app/globals.css`
- Test: `tests/interaction-polish.test.mjs`

**Interfaces:**
- Produces `countdownDelay(value, target, reducedMotion)` and `FINAL_ZERO_HOLD_MS`.
- Both zero renderers use shared CSS class `.loader-zero-glyph`.

- [ ] **Step 1: Add failing tests** for monotonic slowdown below 10, stronger slowdown below 5, zero hold >=600ms, shared zero class, and longer digit transition than 160ms.
- [ ] **Step 2: Run focused tests and confirm failure.**
- [ ] **Step 3: Implement countdown timing helper** with fast high numbers and progressive easing into zero.
- [ ] **Step 4: Update Loader** to use helper and delay `onCriticalReady` by the final zero hold after `display === 0` and readiness is true.
- [ ] **Step 5: Unify countdown/completion zero typography** through `.loader-zero-glyph` so both share font-size, line-height, letter-spacing, transform origin, and exact center anchoring.
- [ ] **Step 6: Smooth number transition CSS** to roughly 260–320ms crossfade with subtle y/scale movement and easing.
- [ ] **Step 7: Run focused and full tests.**

### Task 3: Tagline, line width, hero offset, EXPLORE inversion

**Files:**
- Modify: `src/components/experience/Loader/LoaderCompletion.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/interaction-polish.test.mjs`

**Interfaces:**
- No new runtime API.

- [ ] **Step 1: Add failing source-contract tests** for exact tagline copy, wider responsive line, additional upward hero offset, and `mix-blend-mode: difference` on EXPLORE.
- [ ] **Step 2: Run focused test and confirm failure.**
- [ ] **Step 3: Replace tagline copy** exactly.
- [ ] **Step 4: Widen completion line** to comfortably exceed tagline width while preserving responsive max width.
- [ ] **Step 5: Raise `.hero-composition`** another ~0.7–1vh desktop and a smaller increment mobile.
- [ ] **Step 6: Apply difference blending to `.hero-explore`** so text/rule invert against the reveal beneath it.
- [ ] **Step 7: Run focused and full tests.**

### Task 4: Final verification and documentation

**Files:**
- Modify: `docs/IMPLEMENTATION_STATUS.md`
- Modify: `docs/reference/WEBERAISE_MASTER_PLANNING.parts/part-05.md`

- [ ] **Step 1: Run `npm test`.**
- [ ] **Step 2: Run `npm run typecheck`.**
- [ ] **Step 3: Run `npm run build` if dependencies/environment permit.**
- [ ] **Step 4: Update docs with only verified claims and note any environment-limited checks.**
- [ ] **Step 5: Verify PR branch head and changed files from GitHub.**
