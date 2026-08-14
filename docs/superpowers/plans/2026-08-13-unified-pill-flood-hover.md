# Unified Pill Flood Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix incomplete flood coverage on narrow center pills and apply the same adaptive flood hover to logo and LET’S TALK.

**Architecture:** Keep the existing navigation structure and theme variables. Generalize the existing flood controller so every flood-enabled pill exposes the same surface/base/reveal contract; size the surface from the bottom-center to the farthest top corner using `Math.hypot(width * 0.5, height)` plus overscan. Remove the legacy goo particle choreography from LET’S TALK rather than stacking animations.

**Tech Stack:** React, TypeScript, CSS Modules, GSAP, Node test runner.

## Global Constraints
- Preserve `feature/signature-intro` as the authoritative homepage branch.
- Preserve `--nav-pill-bg` / `--nav-pill-fg` background-sensitive color conversion.
- Preserve current navigation geometry, breakpoints, destinations, hero handoff, and section theme sampling.
- Do not touch ribbon, artwork, loader, hero reveal, or post-Explore content.
- Keep 0.46s enter / 0.36s leave with `power3.out`.

---

### Task 1: Lock the regression contract

**Files:**
- Modify: `tests/navigation.test.mjs`

**Interfaces:**
- Consumes: current navigation files.
- Produces: assertions for guaranteed corner coverage and one shared flood contract across logo/center/talk pills.

- [ ] **Step 1: Replace the center-only flood test with assertions that require `Math.hypot(width * 0.5, height)`, an overscan constant, and flood data attributes on logo, center pills, and LET’S TALK. Also assert legacy goo particles are no longer rendered.**

- [ ] **Step 2: Run `node --test tests/navigation.test.mjs`.**
Expected: FAIL against current code because logo/talk do not expose the flood contract and the controller still uses the previous radius formula.

### Task 2: Generalize flood markup

**Files:**
- Modify: `src/components/navigation/CenterNavCluster.tsx`
- Modify: `src/components/navigation/SiteNavigation.tsx`
- Modify: `src/components/navigation/GooeyTalkButton.tsx`

**Interfaces:**
- Every flood-enabled anchor exposes `data-pill-flood`, one `data-pill-flood-surface`, one `data-pill-flood-base`, and one `data-pill-flood-reveal` node.

- [ ] **Step 1: Update center pills to the generic data contract while preserving labels and click behavior.**
- [ ] **Step 2: Add the same flood surface and duplicated Weberaise mark to the logo pill.**
- [ ] **Step 3: Replace LET’S TALK particle markup/state with the same flood surface + base/reveal labels; preserve click routing.**

### Task 3: Fix geometry and unify motion

**Files:**
- Modify: `src/components/navigation/centerHoverMotion.ts`
- Modify: `src/components/navigation/Navigation.module.css`

**Interfaces:**
- `createCenterHoverMotion(root, reducedMotion)` remains the public controller entry point to avoid unnecessary integration churn.
- Internally it targets `[data-pill-flood]` rather than center-only links.

- [ ] **Step 1: Measure each pill and compute `radius = Math.hypot(width * 0.5, height) + FLOOD_OVERSCAN`; set diameter `radius * 2`, position the circle so its center sits at the pill bottom-center, and animate scale 0→1.**
- [ ] **Step 2: Keep 0.46s enter / 0.36s leave, interrupted-distance scaling, focus/pointer parity, ResizeObserver, and font-ready relayout.**
- [ ] **Step 3: Generalize CSS classes so surface/background and reveal content continue using `var(--nav-pill-fg)` / `var(--nav-pill-bg)`. Remove obsolete goo styling and preserve mobile/reduced-motion behavior.**

### Task 4: Verify and audit scope

**Files:**
- Test: `tests/navigation.test.mjs`

- [ ] **Step 1: Run `node --test tests/navigation.test.mjs`; expected 0 failures.**
- [ ] **Step 2: Run available typecheck/build if the environment supports the full repository checkout; otherwise state the limitation explicitly.**
- [ ] **Step 3: Compare from the pre-change head and confirm only navigation files, the test, and Superpowers docs changed.**
- [ ] **Step 4: Keep PR #1 open and unmerged.**
