# Ribbon Runtime Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the temporary homepage tail and make the ribbon opening, rebuilds, and semantic scroll pacing continuous on first load and ordinary scrolling.

**Architecture:** `MainSite` will render only the finished post-explore experience. `JourneyNarrative` will wait for settled main-stage layout before its first geometry build. A pure progress model will restore normalized draw position across controller reconstruction, while one GSAP tween owns all SVG dash updates. Pacing anchors will enforce curve-specific maximum smoothstep slopes and add an explicit Q3 outside-exit checkpoint.

**Tech Stack:** Next.js 16, React 19, TypeScript, GSAP, SVG paths, Node test runner with `tsx`, Chromium DevTools Protocol.

## Global Constraints

- Work directly in the existing repository on `feature/signature-intro`.
- Preserve the approved ribbon geometry and all Q1/Q2/Q3 artwork decisions.
- Keep the aurora statement and GROW ring; remove every `section-shell` rendered after `PostExploreNarrative`.
- Do not merge PR #1.
- Do not stage or modify unrelated local files: `next-env.d.ts`, `tsconfig.json`, `AGENTS.md`, `CLAUDE.md`, `package-lock.json`, or `tsconfig.tsbuildinfo`.
- Use test-driven development: observe each new regression test fail before changing production code.

---

### Task 1: Remove the temporary homepage tail

**Files:**
- Modify: `tests/post-explore-narrative.test.mjs`
- Modify: `src/components/MainSite/MainSite.tsx`

**Interfaces:**
- Consumes: `PostExploreNarrative(): JSX.Element`.
- Produces: `MainSite(): JSX.Element` whose only child inside `[data-main-site]` is `PostExploreNarrative`.

- [ ] **Step 1: Write the failing page-boundary test**

Add a test that reads `MainSite.tsx`, requires `PostExploreNarrative`, and rejects the temporary content imports and section ids:

```js
test('MainSite ends after the finished post-explore narrative', () => {
  const main = read('src/components/MainSite/MainSite.tsx');
  assert.match(main, /<PostExploreNarrative\s*\/>/);
  for (const placeholder of ['selectedWork', 'services', 'principles', 'processSteps', 'engagementOptions', 'section-shell', 'TODO \/']) {
    assert.doesNotMatch(main, new RegExp(placeholder));
  }
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --import=tsx --test tests/post-explore-narrative.test.mjs`

Expected: FAIL because `MainSite.tsx` still imports and renders the placeholder sections.

- [ ] **Step 3: Reduce `MainSite` to the finished experience**

Remove the unused homepage-content imports and return:

```tsx
export function MainSite() {
  return (
    <main className="main-site" data-main-site>
      <PostExploreNarrative />
    </main>
  );
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --import=tsx --test tests/post-explore-narrative.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the page-boundary change**

```bash
git add tests/post-explore-narrative.test.mjs src/components/MainSite/MainSite.tsx
git commit -m "refactor: remove temporary homepage sections"
```

---

### Task 2: Preserve one continuous draw state through opening and rebuilds

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/ribbonProgress.ts`
- Create: `tests/ribbon-progress.test.mjs`
- Modify: `tests/ribbon-trail-integration.test.mjs`
- Modify: `src/components/MainSite/PostExploreNarrative/ribbonController.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx`

**Interfaces:**
- Produces: `normalizeRibbonProgress(visibleLength: number, totalLength: number): number`.
- Produces: `restoreRibbonLength(storedProgress: string | undefined, totalLength: number, openingFloor: number, openingPlayed: boolean): number`.
- Preserves: `createRibbonController(options): () => void`.

- [ ] **Step 1: Write failing pure progress tests**

Create `tests/ribbon-progress.test.mjs` with cases that require clamping and completed-opening floors:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRibbonProgress, restoreRibbonLength } from '../src/components/MainSite/PostExploreNarrative/ribbonProgress.ts';

test('normalizes finite ribbon progress into a unit interval', () => {
  assert.equal(normalizeRibbonProgress(250, 1000), 0.25);
  assert.equal(normalizeRibbonProgress(-10, 1000), 0);
  assert.equal(normalizeRibbonProgress(1200, 1000), 1);
  assert.equal(normalizeRibbonProgress(50, 0), 0);
});

test('restores route-relative progress without dropping a completed opening', () => {
  assert.equal(restoreRibbonLength('0.42', 2000, 300, false), 840);
  assert.equal(restoreRibbonLength('bad', 2000, 300, false), 0);
  assert.equal(restoreRibbonLength('0.05', 2000, 300, true), 300);
  assert.equal(restoreRibbonLength(undefined, 2000, 300, true), 300);
});
```

- [ ] **Step 2: Write failing controller and scheduler contracts**

Extend `tests/ribbon-trail-integration.test.mjs` to require:

```js
test('opening and scroll share one draw tween and persist rebuild progress', () => {
  const controller = read(`${featureDir}/ribbonController.ts`);
  assert.match(controller, /ribbonVisibleProgress/);
  assert.match(controller, /restoreRibbonLength/);
  assert.match(controller, /normalizeRibbonProgress/);
  assert.doesNotMatch(controller, /introTween|introState/);
  assert.equal((controller.match(/gsap\.to\(/g) ?? []).length, 1);
});

test('first geometry waits for the settled rebuild scheduler', () => {
  const narrative = read(`${featureDir}/JourneyNarrative.tsx`);
  const startJourney = narrative.slice(narrative.indexOf('const startJourney'), narrative.indexOf("if (shell && shell.dataset.experienceState"));
  assert.match(startJourney, /scheduleRebuild\(\)/);
  assert.doesNotMatch(startJourney, /\brebuild\(\)/);
});
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run: `node --import=tsx --test tests/ribbon-progress.test.mjs tests/ribbon-trail-integration.test.mjs`

Expected: FAIL because the progress module does not exist, the controller still has `introTween`/`introState`, and the first build is immediate.

- [ ] **Step 4: Implement the pure progress model**

Create `ribbonProgress.ts`:

```ts
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeRibbonProgress(visibleLength: number, totalLength: number) {
  if (!Number.isFinite(visibleLength) || !Number.isFinite(totalLength) || totalLength <= 0) return 0;
  return clamp(visibleLength / totalLength, 0, 1);
}

export function restoreRibbonLength(
  storedProgress: string | undefined,
  totalLength: number,
  openingFloor: number,
  openingPlayed: boolean,
) {
  const parsed = Number.parseFloat(storedProgress ?? '');
  const restored = Number.isFinite(parsed) ? clamp(parsed, 0, 1) * Math.max(0, totalLength) : 0;
  return clamp(openingPlayed ? Math.max(openingFloor, restored) : restored, 0, Math.max(0, totalLength));
}
```

- [ ] **Step 5: Make one tween own every visible-length update**

In `ribbonController.ts`:

- initialize `drawState.visibleLength` with `restoreRibbonLength(root.dataset.ribbonVisibleProgress, ...)`;
- make `applyVisibleLength` update all paths and then persist `normalizeRibbonProgress(clampedLength, lookup.totalLength).toString()`;
- mark `data-ribbon-opened="true"` once the one draw state reaches `openingFloor`;
- remove `introState` and `introTween`;
- add an optional duration to `scrubTo`, but retain exactly one `gsap.to(drawState, ...)` call;
- start the opening by targeting `openingFloor` for the remaining fraction of 0.82 seconds;
- let scroll events retarget that same tween to `Math.max(openingFloor, latestResolvedLength)`;
- clean up only `scrubTween` and pending animation frames.

- [ ] **Step 6: Settle the initial geometry before construction**

In `JourneyNarrative.tsx`, replace the immediate `rebuild()` inside `startJourney` with `scheduleRebuild()`. Keep observer installation synchronous so width changes reset the 120ms debounce before the first measurement.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run: `node --import=tsx --test tests/ribbon-progress.test.mjs tests/ribbon-trail-integration.test.mjs tests/post-explore-narrative.test.mjs`

Expected: PASS.

- [ ] **Step 8: Commit continuous draw ownership**

```bash
git add src/components/MainSite/PostExploreNarrative/ribbonProgress.ts tests/ribbon-progress.test.mjs tests/ribbon-trail-integration.test.mjs src/components/MainSite/PostExploreNarrative/ribbonController.ts src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx
git commit -m "fix: preserve ribbon draw state across rebuilds"
```

---

### Task 3: Bound ribbon pacing through every interaction

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/ribbonCurveBuilder.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/ribbonPacing.ts`
- Modify: `tests/ribbon-pacing.test.mjs`
- Modify: `tests/ribbon-loop-regression.test.mjs`

**Interfaces:**
- Adds marker: `RibbonMarkerId = 'q3OutsideExit'`.
- Produces: `CALM_MAX_PATH_PER_SCROLL_PX = 5`.
- Produces: `INTERACTION_MAX_PATH_PER_SCROLL_PX = 3.5`.
- Preserves: `buildRibbonPacingAnchors(input): RibbonPacingAnchor[]` and `resolvePacedLength(anchors, scrollLocalY): number`.

- [ ] **Step 1: Write failing semantic marker and speed-cap tests**

Update the marker fixture in `tests/ribbon-pacing.test.mjs` to include `q3OutsideExit` between `q3SecondLoopComplete` and `reassuranceApproach`. Add assertions that:

```js
assert.ok(byId.q1Approach.scrollLocalY >= 900 * 0.28);
assert.ok(byId.q3OutsideExit.pathLength > byId.q3SecondLoopComplete.pathLength);
assert.ok(byId.q3OutsideExit.pathLength < byId.reassuranceApproach.pathLength);
```

For each adjacent anchor pair, compute the smoothstep peak slope:

```js
const peakSlope = 1.5 * (upper.pathLength - lower.pathLength) /
  (upper.scrollLocalY - lower.scrollLocalY);
const interaction = ['q1WrapFront', 'q1WrapBack', 'q1WrapExit', 'q3FirstLoopComplete', 'q3SecondLoopComplete', 'reassuranceLoopComplete'].includes(upper.id);
assert.ok(peakSlope <= (interaction ? 3.5 : 5) + 1e-6);
```

- [ ] **Step 2: Add a production-route pacing regression**

In `tests/ribbon-loop-regression.test.mjs`, reuse the existing production `buildJourneyPath` fixture, sample its built cubic segments into a cumulative-length lookup, call `buildRibbonPacingAnchors`, and assert:

- Q1 approach begins at or after `viewportHeight * 0.28`;
- marker and anchor order is strictly monotonic;
- `q3OutsideExit` lies between paired-O completion and reassurance approach;
- every adjacent peak slope respects its segment limit.

- [ ] **Step 3: Run pacing tests and verify RED**

Run: `node --import=tsx --test tests/ribbon-pacing.test.mjs tests/ribbon-loop-regression.test.mjs`

Expected: FAIL because `q3OutsideExit` and speed floors do not exist and Q1 approach currently resolves near scroll position 1.

- [ ] **Step 4: Mark the Q3 outside exit in route geometry**

Add `q3OutsideExit` to `RibbonMarkerId` and mark it immediately after `q3-outside-exit` is constructed:

```ts
curveTo(builder, 'q3-outside-exit', q3Exit, { x: 0.12, y: 1 }, ...);
builder.mark('q3OutsideExit');
```

- [ ] **Step 5: Enforce maximum smoothstep slopes**

In `ribbonPacing.ts`, add the two exported limits and update `pushAnchor` to accept `maxPathPerScrollPx`. For every non-first anchor calculate:

```ts
const pathDelta = Math.max(0, markerLengths[id] - previous.pathLength);
const speedFloor = previous.scrollLocalY + pathDelta * 1.5 / maxPathPerScrollPx;
const scrollLocalY = Math.max(desiredScrollLocalY, previous.scrollLocalY + 1, speedFloor);
```

Use the interaction limit for Q1 wrap markers, both Q3 loop-completion markers, and reassurance-loop completion. Use the calm limit elsewhere.

- [ ] **Step 6: Give Q1 and the Q3 exit visible scroll budgets**

Set Q1 approach to:

```ts
const q1Start = Math.max(
  safeViewportHeight * 0.28,
  stops.q1.revealLocalY - safeViewportHeight * stops.q1.revealViewportRatio,
);
```

Insert `q3OutsideExit` after the second loop with a desired minimum of `q3Start + safeViewportHeight * 0.7`. Then compute reassurance start after that anchor.

- [ ] **Step 7: Run pacing and route tests and verify GREEN**

Run: `node --import=tsx --test tests/ribbon-pacing.test.mjs tests/ribbon-loop-regression.test.mjs tests/ribbon-route-geometry.test.mjs tests/ribbon-curve-continuity.test.mjs`

Expected: PASS.

- [ ] **Step 8: Commit bounded semantic pacing**

```bash
git add src/components/MainSite/PostExploreNarrative/ribbonCurveBuilder.ts src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts src/components/MainSite/PostExploreNarrative/ribbonPacing.ts tests/ribbon-pacing.test.mjs tests/ribbon-loop-regression.test.mjs
git commit -m "fix: bound ribbon pacing through narrative loops"
```

---

### Task 4: Verify the complete experience

**Files:**
- Modify only if a verification exposes an in-scope regression.

**Interfaces:**
- Consumes the completed homepage boundary, draw controller, progress model, and bounded pacing anchors.
- Produces browser evidence and a clean relevant diff.

- [ ] **Step 1: Run the focused ribbon and artwork suite**

Run:

```bash
node --import=tsx --test \
  tests/post-explore-narrative.test.mjs \
  tests/journey-artwork-integration.test.mjs \
  tests/path-lookup-loop.test.mjs \
  tests/ribbon-art-direction.test.mjs \
  tests/ribbon-curve-continuity.test.mjs \
  tests/ribbon-loop-regression.test.mjs \
  tests/ribbon-pacing.test.mjs \
  tests/ribbon-primitives.test.mjs \
  tests/ribbon-progress.test.mjs \
  tests/ribbon-reassurance-end.test.mjs \
  tests/ribbon-route-geometry.test.mjs \
  tests/ribbon-smoothness-regression.test.mjs \
  tests/ribbon-trail-integration.test.mjs \
  tests/shutter-text.test.mjs
```

Expected: all pass.

- [ ] **Step 2: Run static and production verification**

Run:

```bash
npm run typecheck -- --incremental false
npm run build
git diff --check
```

Expected: all exit zero.

- [ ] **Step 3: Capture desktop first-load behavior**

At 1280×720 in Chromium:

- reload from the loader and click EXPLORE once;
- record visible ribbon length every animation frame through the opening;
- assert route length does not rebuild during the opening;
- assert visible length never decreases by more than 0.5 units;
- scroll continuously in 32px increments through the narrative;
- assert no measured peak exceeds the declared segment speed plus scrub tolerance;
- capture Q1, Q2, Q3, reassurance, and the page ending after GROW.

- [ ] **Step 4: Verify reverse scroll and rebuild continuity**

At Q3, resize the viewport by 40px and assert normalized visible progress changes by no more than 0.05 before settling. Reverse-scroll to Q2 and assert the visible length decreases continuously without resetting to the opening floor.

- [ ] **Step 5: Capture the mobile journey**

Repeat first-load, continuous scroll, reassurance, and page-ending checks at 390×844. Confirm Q3 remains exactly two lines and reassurance lines remain inside the viewport.

- [ ] **Step 6: Review repository scope**

Run:

```bash
git status --short
git diff --stat HEAD~3..HEAD
git diff --check HEAD~3..HEAD
```

Confirm only the planned source, tests, and documentation are included; leave all pre-existing unrelated dirty files untouched.

- [ ] **Step 7: Request code review**

Review the complete delta for correctness, regression risk, and adherence to the approved design. Address any verified Critical, Important, or Minor findings and rerun the affected checks.
