# Navigation Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recover the pre-navigation scroll/frame smoothness without changing any visible navigation quality, timing, geometry, color behavior, ribbon behavior, or WebGL quality.

**Architecture:** Remove scroll-frame DOM hit-testing from `useNavigationThemes` by caching the navigation probe coordinates and themed section rectangles during layout events, then resolve themes with arithmetic only during scroll. Keep the moving pill flood surface compositor-accelerated, but remove permanent `will-change` hints from stationary text/mark layers.

**Tech Stack:** Next.js/React, TypeScript, GSAP, CSS Modules, Node test runner.

## Global Constraints

- Work only on `feature/signature-intro`; do not merge PR #1.
- Preserve the exact five-pill flood interaction, colors, 0.46s enter / 0.36s leave motion, and dark/light theme inversion.
- Do not reduce WebGL, ribbon, artwork, typography, blur, resolution, animation frequency, or visual effects.
- Do not change hero/loader/ribbon/artwork files.
- Do not replace per-zone theme behavior with one global navbar theme.
- Scroll-time theme reads must not call `elementsFromPoint`, `getBoundingClientRect`, or query the DOM.

---

### Task 1: Add performance regression coverage

**Files:**
- Create: `tests/navigation-performance.test.mjs`

**Interfaces:**
- Consumes: `src/components/navigation/useNavigationTheme.ts`, `Navigation.module.css`.
- Produces: source-level regression guards for zero scroll-frame hit-testing and reduced idle `will-change` usage.

- [ ] **Step 1: Write the failing test**

Assert that `useNavigationTheme.ts` no longer contains `elementsFromPoint`, contains a cached region/probe model, and that the scroll read path uses cached numeric coordinates. Assert `.pillFloodBase` and `.pillFloodReveal` do not contain `will-change`, while `.pillFloodSurface` retains `will-change: transform`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/navigation-performance.test.mjs`
Expected: FAIL because the current theme hook still uses `elementsFromPoint` and the text/reveal layers still carry `will-change`.

### Task 2: Replace per-frame hit-testing with cached geometry

**Files:**
- Modify: `src/components/navigation/useNavigationTheme.ts`
- Test: `tests/navigation-performance.test.mjs`

**Interfaces:**
- Preserves: `useNavigationThemes(enabled, rootRef): NavigationThemes`.
- Adds internal cached zone probe positions and themed document-space regions.

- [ ] **Step 1: Cache zone probe centers and `[data-nav-theme]` rectangles during layout refreshes only**

Use `getBoundingClientRect()` only in a layout-refresh function triggered at mount, resize, themed-region ResizeObserver changes, font readiness, and window load.

- [ ] **Step 2: Make the scroll rAF arithmetic-only**

For each zone, add `window.scrollX/Y` to the cached viewport probe and resolve the last matching cached themed rectangle. Do not perform DOM queries or layout reads in the scroll callback.

- [ ] **Step 3: Avoid React updates when the theme is unchanged**

Keep a ref of the current theme record and call `setThemes` only when at least one zone changes.

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/navigation-performance.test.mjs`
Expected: PASS.

### Task 3: Reduce idle compositor pressure

**Files:**
- Modify: `src/components/navigation/Navigation.module.css`
- Test: `tests/navigation-performance.test.mjs`

**Interfaces:**
- Preserve `will-change: transform` only on `.pillFloodSurface`.
- Remove permanent `will-change` from `.pillFloodBase` and `.pillFloodReveal`.

- [ ] **Step 1: Remove nonessential permanent compositor hints**

Do not change transforms, easing, opacity behavior, colors, or clipping.

- [ ] **Step 2: Run focused navigation tests**

Run: `node --test tests/navigation-performance.test.mjs tests/navigation.test.mjs tests/navigation-unified-flood.test.mjs`
Expected: PASS.

### Task 4: Final verification and scope audit

**Files:**
- Verify only navigation performance files changed beyond the plan/test docs.

- [ ] **Step 1: Run type/syntax verification for the modified TypeScript source**
- [ ] **Step 2: Compare the branch against the pre-optimization head and confirm no hero/ribbon/artwork changes**
- [ ] **Step 3: Confirm PR #1 remains open and unmerged**
- [ ] **Step 4: Report that full live-browser FPS validation still requires the user's local/network-enabled checkout unless browser evidence is available in this runtime**
