# Services Surface Wave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Services row color crossfade with an SVG Bézier surface wave that spatially inverts type, synchronizes with the Codrops hover pieces, and becomes the selected row's fullscreen source.

**Architecture:** Keep `ServicesPage.tsx` as the single GSAP/Flip orchestrator and add one decorative SVG layer inside each data-driven row. CSS owns the transform-only surface travel and difference-blended text contrast, while the existing combined pointer/focus state owns when the active attribute changes. Retain the existing cover and Flip reparenting without introducing another overlay system.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, inline SVG, GSAP, GSAP Flip, Node test runner with `tsx`, Chromium CDP visual QA.

## Global Constraints

- Stay on `feature/services-opening-grid` and do not edit protected homepage animation files.
- Preserve the true-black canvas, centered white same-node `SERVICES` handoff, exactly five services, inline numbering, and empty runway.
- Do not add dependencies, WebGL, glow, blur, particles, card UI, or a sixth service.
- Preserve the Codrops-derived title switch, block entrance/exit, cover stacking, physical primary-node reparenting, 4×2 desktop grid, 2×4 mobile grid, and close return.
- The surface must use transform motion rather than opacity or background-color interpolation.
- Preserve user-owned changes in `next-env.d.ts`, `tsconfig.json`, `package-lock.json`, and unrelated generated/untracked files.

---

### Task 1: Lock surface-wave and combined-input contracts

**Files:**
- Modify: `tests/services-page.test.mjs`

**Interfaces:**
- Consumes: existing `data-row-active`, `rowInteractionRefs`, and Services row markup.
- Produces: source contracts for `rowInversionSurface`, inline SVG/path geometry, transform-only active state, difference-blended text, and delayed interior choreography.

- [ ] **Step 1: Add failing contracts**

Require the component to render `styles.rowInversionSurface`, `viewBox="0 0 120 100"`, `preserveAspectRatio="none"`, `aria-hidden="true"`, and `focusable="false"`. Require CSS to use a transform from beyond the right edge to zero under `data-row-active`, `will-change: transform`, and `mix-blend-mode: difference` on the text cell. Forbid `background-color` and `color` transitions in the row transition declaration. Require a shared surface lead timing before title/piece entrance.

- [ ] **Step 2: Run the focused suite and verify red**

Run: `node --import=tsx --test tests/services-page.test.mjs`

Expected: FAIL because the SVG surface and difference-blend rules do not yet exist.

- [ ] **Step 3: Commit the approved design documents and failing contracts only**

Stage only the two Surface Wave documents and `tests/services-page.test.mjs`; leave existing production edits unstaged until implementation passes.

### Task 2: Render and style the physical white wave surface

**Files:**
- Modify: `src/components/ServicesPage/ServicesPage.tsx`
- Modify: `src/components/ServicesPage/ServicesPage.module.css`
- Test: `tests/services-page.test.mjs`

**Interfaces:**
- Consumes: `data-row-active`, `data-current`, and focus-visible state.
- Produces: `.rowInversionSurface`, a single white path, and spatial text inversion.

- [ ] **Step 1: Render one decorative SVG per service row**

Insert the SVG as the first visual child of each row, before the button and content. Use the approved `120 × 100` coordinate system and a path whose left edge contains several restrained cubic Bézier bends before closing around the right side.

- [ ] **Step 2: Replace color interpolation with transform-only travel**

Make the row `overflow: hidden` and `isolation: isolate`. Place the SVG at `z-index: 0`, wider than the row, offset left so its final curved edge is outside the row, and start it at `translate3d(101%, 0, 0)`. Move it to `translate3d(0, 0, 0)` under active/focus state using the premium easing over roughly `.66s`.

- [ ] **Step 3: Make title/number contrast follow the wave edge**

Keep `.cellText` above the surface with white foreground and `mix-blend-mode: difference`. Remove row foreground interpolation. Keep preview pieces above the surface without blend mode.

- [ ] **Step 4: Verify focused tests and typecheck**

Run:

```bash
node --import=tsx --test tests/services-page.test.mjs
npm run typecheck
```

Expected: both PASS.

### Task 3: Phase-align title/pieces and preserve interaction ownership

**Files:**
- Modify: `src/components/ServicesPage/ServicesPage.tsx`
- Modify: `src/components/ServicesPage/servicesMotion.ts`
- Test: `tests/services-page.test.mjs`

**Interfaces:**
- Consumes: `rowInteractionRefs`, `SERVICES_MOTION.hover`.
- Produces: `surfaceLead` timing used by the hover timeline and input-safe active-state transitions.

- [ ] **Step 1: Add one centralized surface lead constant**

Add `surfaceLead: 0.12` to `SERVICES_MOTION.hover` and assert it in the focused test.

- [ ] **Step 2: Offset interior choreography behind the wave**

Start block entrance at `surfaceLead * 0.65` and title exit at `surfaceLead`; retain all existing Codrops values after those offsets. Keep exit immediate so content clears while the surface withdraws.

- [ ] **Step 3: Preserve combined pointer/focus ownership**

Keep per-row `{ pointer, focus }` state. Enter only when neither source was previously active and exit only when both become inactive. Verify pointer leave cannot tear down a focused row.

- [ ] **Step 4: Ensure click establishes the final surface**

When a coarse-pointer or non-hovered row opens, set `data-row-active` and synchronously establish the surface's final transform before measuring the cover origin. Reduced motion must also snap to the final transform.

- [ ] **Step 5: Run focused tests and typecheck**

Run the same two commands from Task 2 and require PASS.

### Task 4: Browser-tune the wave as a motion sequence

**Files:**
- Modify if evidence requires: `src/components/ServicesPage/ServicesPage.module.css`
- Modify if evidence requires: `src/components/ServicesPage/servicesMotion.ts`

**Interfaces:**
- Consumes: the implemented row surface and existing CDP screenshot harness.
- Produces: approved early/mid/settled and exit frames across desktop and keyboard focus.

- [ ] **Step 1: Capture precise desktop wave frames**

At 1440×900, capture at approximately `0ms`, `100ms`, `220ms`, `420ms`, and `700ms` after entering a middle row, then equivalent exit frames. Verify the curved boundary is visible, content never becomes gray/illegible, and the surface does not leak outside row rules.

- [ ] **Step 2: Verify every title length**

Hover all five rows. Reject collision between the commerce title and preview pieces and verify the wave fully covers every row.

- [ ] **Step 3: Verify combined pointer and focus**

Focus a row, move pointer in and out, then blur while hovered. The active wave, mono title, and pieces must persist until both sources leave.

- [ ] **Step 4: Verify selected-row continuity**

Capture a middle-row open at `100–300ms`. Confirm the fully white row and expanding white cover form one continuous surface without a black seam or a surface reset.

### Task 5: Responsive, reduced-motion, and regression verification

**Files:**
- Modify if evidence requires: `src/components/ServicesPage/ServicesPage.module.css`
- Modify: `docs/superpowers/plans/2026-08-13-services-surface-wave.md`

**Interfaces:**
- Consumes: final implementation.
- Produces: verified responsive and production-ready refinement.

- [ ] **Step 1: Verify tablet and mobile**

At 834×1112 and 390×844, confirm the SVG adds no horizontal overflow, scales across wrapped rows, mobile tap opens normally, and the 2×4 grid remains fully visible.

- [ ] **Step 2: Verify reduced motion**

Confirm the final active/inactive surfaces establish immediately while content and dialog state remain correct.

- [ ] **Step 3: Repeat stress and accessibility flows**

Verify first/middle/last open, rapid double activation, four repeated open/close cycles, Escape, close button, focus restoration, resize after close, and DOM reparenting counts.

- [ ] **Step 4: Run final commands**

```bash
node --import=tsx --test tests/services-page.test.mjs
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: Services suite, typecheck, build, and diff check pass. Record the already-baselined homepage-only failures if the complete suite still reports them; do not edit protected homepage code.

- [ ] **Step 5: Mark this plan complete and commit the refinement**

Commit only intended Services files, tests, and plan updates as `fix: add surface-wave service inversion`.

