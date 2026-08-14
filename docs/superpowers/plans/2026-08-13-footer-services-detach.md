# Footer Services Detach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the final homepage closing section where the existing SERVICES navbar pill leaves its preserved navbar slot, follows a reversible scroll-scrubbed curved path, lands beneath `WHAT CAN WE / BUILD FOR YOU?`, and routes to `/services`.

**Architecture:** Keep the real SERVICES link owned by the navigation and add a transformable shell inside its existing layout slot. Append a self-contained `ClosingFooter` after `GrowthRing`; its sticky stage supplies the landing dock and initializes a small DOM controller that measures geometry only on setup/layout refresh, then performs arithmetic + one `translate3d(...) scale(...)` write per scroll frame. The original slot remains in flow because transforms do not affect layout, so WORK and ABOUT never move.

**Tech Stack:** Next.js 16.3, React 19.2, TypeScript 7, CSS Modules, requestAnimationFrame, ResizeObserver, Node test runner via `tsx`.

## Global Constraints

- Exact headline: `WHAT CAN WE` / `BUILD FOR YOU?`.
- Footer metadata: `WEBERAISE` left, `© 2026` right.
- Footer remains dark, spacious, typography-led, and visually minimal.
- Footer enters normally, then uses a short sticky `100svh` hold; no long scroll-jacking.
- The real SERVICES pill is the moving object; do not create a visible duplicate or cross-fade replacement.
- Original SERVICES slot remains occupied for the entire sequence; WORK and ABOUT must never shift or recenter.
- Existing pill flood hover remains active on the moving SERVICES pill.
- Motion is scroll-scrubbed and exactly reversible when scrolling upward.
- No rotation, opacity fade, bounce, overshoot, or elastic motion.
- Final scale increase stays subtle: target `1.12` unless browser tuning proves a nearby `1.10–1.15` value reads better.
- Canonical SERVICES destination becomes `/services` everywhere.
- No per-frame `getBoundingClientRect()`, DOM queries, `elementsFromPoint()`, or React state updates.
- Scroll work is passive-listener + rAF batched; only the detachable shell receives the per-frame transform write.
- Preserve recent navbar performance optimizations and all current ribbon/WebGL/hover quality.
- Reduced motion removes prolonged curved travel while keeping the same semantic origin/destination states.
- Do not restore deprecated placeholder homepage sections.

---

## File Map

- Create `src/components/MainSite/PostExploreNarrative/ClosingFooter.tsx` — final semantic footer/sticky stage and lifecycle hookup.
- Create `src/components/MainSite/PostExploreNarrative/ClosingFooter.module.css` — final composition, sticky range, responsive layout, dock reservation.
- Create `src/components/MainSite/PostExploreNarrative/servicesDetachMotion.ts` — cached geometry, path math, scroll/rAF controller, resize/font refresh.
- Modify `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx` — append `ClosingFooter` after the current purpose/GrowthRing section.
- Modify `src/components/navigation/CenterNavCluster.tsx` — wrap only SERVICES in a stable detachable shell while preserving the existing slot and flood markup.
- Modify `src/components/navigation/Navigation.module.css` — add only shell-specific positioning/compositor rules required by the detachment.
- Modify `src/components/navigation/navigationModel.ts` — set SERVICES href to `/services`.
- Modify `src/components/experience/Hero/Hero.tsx` — preserve Explore handoff for hash targets and route to `/services` for non-hash navigation.
- Create `tests/footer-services-detach.test.mjs` — structural, math, performance, reduced-motion, route, and integration regression coverage.
- Modify `tests/navigation.test.mjs` only where the canonical SERVICES destination expectation changes from the current hash behavior.

---

### Task 1: Lock the SERVICES shell and canonical route with failing tests

**Files:**
- Create: `tests/footer-services-detach.test.mjs`
- Modify later in GREEN phase: `src/components/navigation/CenterNavCluster.tsx`
- Modify later in GREEN phase: `src/components/navigation/navigationModel.ts`

**Interfaces:**
- Consumes: existing `data-nav-detach-anchor`, `data-pill-flood`, `CENTER_NAV_ITEMS`.
- Produces: `[data-services-detachable]` shell inside the SERVICES slot; SERVICES href `/services`.

- [ ] **Step 1: Write the failing structural tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('services keeps its detach anchor and gains one detachable shell without losing flood hover', () => {
  const center = read('src/components/navigation/CenterNavCluster.tsx');

  assert.match(center, /data-nav-detach-anchor=\{item\.key === 'services'/);
  assert.match(center, /data-services-detachable/);
  assert.match(center, /item\.key === 'services'/);
  assert.match(center, /data-pill-flood/);
});

test('services canonical destination is the services page', () => {
  const model = read('src/components/navigation/navigationModel.ts');
  assert.match(model, /key: 'services'[\s\S]*href: '\/services'/);
  assert.doesNotMatch(model, /key: 'services'[\s\S]*href: '#services'/);
});
```

- [ ] **Step 2: Run RED**

Run:
```bash
node --import=tsx --test tests/footer-services-detach.test.mjs
```
Expected: FAIL because `[data-services-detachable]` does not exist and SERVICES still targets `#services`.

- [ ] **Step 3: Add the detachable shell without changing slot geometry**

In `CenterNavCluster.tsx`, keep the current outer `navItemSlot` and wrap the existing SERVICES anchor only:

```tsx
const link = (
  <a
    className={`${styles.pill} ${styles.centerPill} ${styles.pillFlood}`}
    href={item.href}
    data-center-nav-link
    data-pill-flood
    onClick={/* preserve current handler */}
  >
    {/* preserve current pillFloodSurface/base/reveal markup exactly */}
  </a>
);

return (
  <span
    className={styles.navItemSlot}
    data-nav-item={item.key}
    data-nav-label={item.label}
    data-nav-detach-anchor={item.key === 'services' ? '' : undefined}
    key={item.key}
  >
    {item.key === 'services' ? (
      <span className={styles.servicesDetachable} data-services-detachable>
        {link}
      </span>
    ) : link}
  </span>
);
```

Add only the shell rule in `Navigation.module.css`:

```css
.servicesDetachable {
  position: relative;
  z-index: 2;
  display: inline-flex;
  transform: translate3d(0, 0, 0) scale(1);
  transform-origin: 50% 50%;
  will-change: transform;
}
```

Do not hide/collapse the outer slot. Because CSS transforms do not affect layout, the slot automatically remains the structural placeholder while the shell travels.

- [ ] **Step 4: Change only the SERVICES route**

In `navigationModel.ts`:

```ts
{ key: 'services', label: 'SERVICES', href: '/services' },
```

Keep WORK and ABOUT unchanged.

- [ ] **Step 5: Run GREEN**

Run:
```bash
node --import=tsx --test tests/footer-services-detach.test.mjs tests/navigation.test.mjs
```
Expected: new shell/route assertions PASS; if an old navigation assertion assumes `#services`, update only that stale expectation before continuing.

- [ ] **Step 6: Commit**

```bash
git add tests/footer-services-detach.test.mjs src/components/navigation/CenterNavCluster.tsx src/components/navigation/Navigation.module.css src/components/navigation/navigationModel.ts tests/navigation.test.mjs
git commit -m "feat: prepare services pill detachment"
```

---

### Task 2: Add the final sticky footer composition

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/ClosingFooter.tsx`
- Create: `src/components/MainSite/PostExploreNarrative/ClosingFooter.module.css`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx`
- Test: `tests/footer-services-detach.test.mjs`

**Interfaces:**
- Produces: `[data-closing-footer]`, `[data-closing-footer-stage]`, `[data-services-footer-dock]`.
- Consumes later: `createServicesDetachMotion()` from Task 3.

- [ ] **Step 1: Extend the test with footer structure/copy assertions**

```js
test('closing footer provides the approved sticky stage, headline, metadata and services dock', () => {
  const footer = read('src/components/MainSite/PostExploreNarrative/ClosingFooter.tsx');
  const narrative = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx');
  const css = read('src/components/MainSite/PostExploreNarrative/ClosingFooter.module.css');

  assert.match(footer, /data-closing-footer/);
  assert.match(footer, /data-closing-footer-stage/);
  assert.match(footer, /data-services-footer-dock/);
  assert.match(footer, /WHAT CAN WE/);
  assert.match(footer, /BUILD FOR YOU\?/);
  assert.match(footer, /WEBERAISE/);
  assert.match(footer, /© 2026/);
  assert.match(narrative, /<ClosingFooter \/>/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /height:\s*100svh/);
});
```

- [ ] **Step 2: Run RED**

Run:
```bash
node --import=tsx --test tests/footer-services-detach.test.mjs
```
Expected: FAIL because `ClosingFooter` files and markup do not exist.

- [ ] **Step 3: Implement the semantic footer**

Create `ClosingFooter.tsx` with this structure:

```tsx
'use client';

import { useLayoutEffect } from 'react';
import { createServicesDetachMotion } from './servicesDetachMotion';
import styles from './ClosingFooter.module.css';

export function ClosingFooter() {
  useLayoutEffect(() => createServicesDetachMotion(), []);

  return (
    <footer className={styles.root} data-closing-footer data-nav-theme="dark">
      <div className={styles.stage} data-closing-footer-stage>
        <div className={styles.heroCopy}>
          <h2 className={styles.heading}>
            <span>WHAT CAN WE</span>
            <span>BUILD FOR YOU?</span>
          </h2>
          <div className={styles.dock} data-services-footer-dock aria-hidden="true" />
        </div>

        <div className={styles.meta}>
          <span>WEBERAISE</span>
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  );
}
```

Task 3 creates the imported controller; until then this file may not typecheck, so do not run the full typecheck between Tasks 2 and 3.

- [ ] **Step 4: Implement the approved visual composition**

`ClosingFooter.module.css` must use these structural values:

```css
.root {
  position: relative;
  min-height: 180svh;
  background: var(--wr-black);
  color: var(--wr-text);
}

.stage {
  position: sticky;
  top: 0;
  height: 100svh;
  display: grid;
  place-items: center;
  overflow: clip;
  padding: clamp(28px, 4vw, 56px) var(--wr-page-pad);
}

.heroCopy {
  display: grid;
  justify-items: center;
  gap: clamp(32px, 5svh, 64px);
  width: min(96vw, 1600px);
}

.heading {
  margin: 0;
  font-family: var(--font-hero), Arial, sans-serif;
  font-size: clamp(64px, 9.2vw, 164px);
  font-weight: 850;
  line-height: .84;
  letter-spacing: -.065em;
  text-align: center;
}

.heading > span { display: block; }

.dock {
  width: clamp(92px, 8vw, 116px);
  height: var(--nav-pill-height, 42px);
  pointer-events: none;
}

.meta {
  position: absolute;
  left: var(--wr-page-pad);
  right: var(--wr-page-pad);
  bottom: clamp(20px, 3vw, 38px);
  display: flex;
  justify-content: space-between;
  font-family: var(--font-body), Arial, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
}
```

Add a narrow-screen rule that keeps the two-line hierarchy, reduces the headline clamp, and preserves readable metadata. Do not add gradients, cards, extra copy, or decorative effects.

- [ ] **Step 5: Append the footer after GrowthRing**

In `PostExploreNarrative.tsx`:

```tsx
import { ClosingFooter } from './ClosingFooter';
```

and render `<ClosingFooter />` after the existing `purposeSection` closes, still inside the root post-explore section.

- [ ] **Step 6: Run the structural tests**

```bash
node --import=tsx --test tests/footer-services-detach.test.mjs
```
Expected: footer structure/copy/layout assertions PASS; controller import may still be unresolved outside this focused source-reading test until Task 3.

- [ ] **Step 7: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative/ClosingFooter.tsx src/components/MainSite/PostExploreNarrative/ClosingFooter.module.css src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx tests/footer-services-detach.test.mjs
git commit -m "feat: add closing footer stage"
```

---

### Task 3: Implement deterministic reversible path math

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/servicesDetachMotion.ts`
- Test: `tests/footer-services-detach.test.mjs`

**Interfaces:**
- Produces: `clampServicesDetachProgress(value: number): number`.
- Produces: `servicesDetachPoint(progress: number, deltaX: number, deltaY: number): { x: number; y: number }`.
- Produces: `createServicesDetachMotion(): () => void`.

- [ ] **Step 1: Add real behavior tests for the exported path math**

```js
import {
  clampServicesDetachProgress,
  servicesDetachPoint,
} from '../src/components/MainSite/PostExploreNarrative/servicesDetachMotion.ts';

test('services detach path is deterministic, endpoint exact, and reversible by progress', () => {
  assert.equal(clampServicesDetachProgress(-1), 0);
  assert.equal(clampServicesDetachProgress(2), 1);

  const start = servicesDetachPoint(0, 180, 620);
  const end = servicesDetachPoint(1, 180, 620);
  const middleA = servicesDetachPoint(0.42, 180, 620);
  const middleB = servicesDetachPoint(0.42, 180, 620);

  assert.deepEqual(start, { x: 0, y: 0 });
  assert.ok(Math.abs(end.x - 180) < 0.001);
  assert.ok(Math.abs(end.y - 620) < 0.001);
  assert.deepEqual(middleA, middleB);
  assert.ok(middleA.y > 0 && middleA.y < 620);
});
```

- [ ] **Step 2: Run RED**

```bash
node --import=tsx --test tests/footer-services-detach.test.mjs
```
Expected: FAIL because the motion module/exports do not exist.

- [ ] **Step 3: Implement pure path helpers first**

Use cubic Bézier interpolation with no rotation:

```ts
export function clampServicesDetachProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

function cubic(a: number, b: number, c: number, d: number, t: number) {
  const inv = 1 - t;
  return inv ** 3 * a + 3 * inv ** 2 * t * b + 3 * inv * t ** 2 * c + t ** 3 * d;
}

export function servicesDetachPoint(progress: number, deltaX: number, deltaY: number) {
  const t = clampServicesDetachProgress(progress);
  return {
    x: cubic(0, deltaX * 0.14, deltaX * 0.82, deltaX, t),
    y: cubic(0, Math.max(72, deltaY * 0.22), deltaY * 0.74, deltaY, t),
  };
}
```

The control points intentionally create a gentle downward arc while leaving most horizontal correction gradual.

- [ ] **Step 4: Run GREEN for math only**

```bash
node --import=tsx --test tests/footer-services-detach.test.mjs
```
Expected: path math test PASS.

---

### Task 4: Add cached geometry + rAF scroll controller

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/servicesDetachMotion.ts`
- Test: `tests/footer-services-detach.test.mjs`

**Interfaces:**
- Consumes: `[data-nav-detach-anchor]`, `[data-services-detachable]`, `[data-closing-footer]`, `[data-closing-footer-stage]`, `[data-services-footer-dock]`.
- Produces: transform-only scroll behavior on `[data-services-detachable]`.

- [ ] **Step 1: Add performance-contract assertions before implementation**

```js
test('detach controller caches geometry and keeps scroll frames free of layout reads and React state', () => {
  const motion = read('src/components/MainSite/PostExploreNarrative/servicesDetachMotion.ts');

  assert.match(motion, /requestAnimationFrame/);
  assert.match(motion, /ResizeObserver/);
  assert.match(motion, /document\.fonts/);
  assert.match(motion, /translate3d/);
  assert.match(motion, /addEventListener\('scroll',[\s\S]*passive:\s*true/);
  assert.doesNotMatch(motion, /elementsFromPoint/);
  assert.doesNotMatch(motion, /setState|useState/);

  const updateStart = motion.indexOf('const updateFromScroll');
  const updateEnd = motion.indexOf('const scheduleScroll', updateStart);
  const scrollBlock = motion.slice(updateStart, updateEnd);
  assert.doesNotMatch(scrollBlock, /getBoundingClientRect|querySelector|querySelectorAll/);
});
```

- [ ] **Step 2: Run RED**

```bash
node --import=tsx --test tests/footer-services-detach.test.mjs
```
Expected: FAIL because the controller contract is not implemented yet.

- [ ] **Step 3: Implement setup and geometry refresh**

Inside `createServicesDetachMotion()` query the five stable elements once. Return a no-op cleanup if any are absent.

Cache this geometry shape:

```ts
type DetachGeometry = {
  sectionTop: number;
  travelRange: number;
  deltaX: number;
  deltaY: number;
};
```

`refreshGeometry()` performs all layout reads:

1. Read origin anchor rect.
2. Read footer outer rect.
3. Read sticky stage rect.
4. Read dock rect.
5. Convert the footer top to document coordinates with `window.scrollY`.
6. Derive the dock's destination viewport center from `dockRect - stageRect`, so it remains valid when the stage later pins at `top: 0`.
7. Compute `deltaX/deltaY` from the origin center to that pinned dock center.
8. Set `travelRange = max(1, footerHeight - innerHeight)`.

Do not read the currently transformed shell rect; use the stable outer detach anchor as the origin so refresh remains correct even when progress is nonzero.

- [ ] **Step 4: Implement scroll-only arithmetic**

`updateFromScroll()` must do only:

```ts
const progress = clampServicesDetachProgress(
  (window.scrollY - geometry.sectionTop) / geometry.travelRange,
);
const effective = reducedMotion ? (progress < 0.5 ? 0 : 1) : progress;
const point = servicesDetachPoint(effective, geometry.deltaX, geometry.deltaY);
const scale = reducedMotion ? 1 : 1 + effective * 0.12;
shell.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) scale(${scale})`;
```

Use one passive `scroll` listener that schedules at most one rAF. Do not mutate React state or attributes every frame.

- [ ] **Step 5: Add geometry invalidation without scroll-time reads**

Use:

```ts
const resizeObserver = new ResizeObserver(scheduleGeometry);
resizeObserver.observe(origin);
resizeObserver.observe(stage);
resizeObserver.observe(dock);

window.addEventListener('resize', scheduleGeometry, { passive: true });
document.fonts?.ready.then(scheduleGeometry).catch(() => undefined);
```

After each `refreshGeometry()`, immediately call `updateFromScroll()` so a resize while detached preserves the correct scroll position rather than snapping to origin.

Cleanup must cancel pending rAFs, disconnect the observer, remove listeners, and reset the shell inline transform to `translate3d(0, 0, 0) scale(1)`.

- [ ] **Step 6: Run focused GREEN**

```bash
node --import=tsx --test tests/footer-services-detach.test.mjs
```
Expected: all footer detach tests PASS.

- [ ] **Step 7: Run typecheck**

```bash
npm run typecheck
```
Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative/servicesDetachMotion.ts src/components/MainSite/PostExploreNarrative/ClosingFooter.tsx tests/footer-services-detach.test.mjs
git commit -m "feat: animate services into closing footer"
```

---

### Task 5: Make `/services` work correctly from the hero navigation

**Files:**
- Modify: `src/components/experience/Hero/Hero.tsx`
- Test: `tests/footer-services-detach.test.mjs`
- Test: `tests/navigation.test.mjs`

**Interfaces:**
- Consumes: `onNavigate('/services')` from `CenterNavCluster` while hero navigation is active.
- Preserves: current Explore exit timeline before navigation.

- [ ] **Step 1: Add failing route-vs-hash handoff test**

```js
test('hero navigation distinguishes page routes from in-page hash targets after Explore exit', () => {
  const hero = read('src/components/experience/Hero/Hero.tsx');

  assert.match(hero, /target\.startsWith\('#'\)/);
  assert.match(hero, /window\.location\.assign\(target\)/);
  assert.match(hero, /scrollIntoView/);
});
```

- [ ] **Step 2: Run RED**

```bash
node --import=tsx --test tests/footer-services-detach.test.mjs
```
Expected: FAIL because current hero completion always passes the target to `document.querySelector()`.

- [ ] **Step 3: Branch the existing completion behavior**

In `Hero.tsx`, after scroll lock has cleared:

```ts
if (!target.startsWith('#')) {
  window.location.assign(target);
  return;
}

const element = document.querySelector<HTMLElement>(target);
if (!element) return;

element.scrollIntoView({ behavior: 'auto', block: 'start' });
if (window.location.hash !== target) {
  window.history.replaceState(null, '', target);
}
```

Do not bypass the existing hero Explore exit animation. SERVICES still triggers the current transition first, then routes to `/services`.

- [ ] **Step 4: Run GREEN**

```bash
node --import=tsx --test tests/footer-services-detach.test.mjs tests/navigation.test.mjs
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/experience/Hero/Hero.tsx tests/footer-services-detach.test.mjs tests/navigation.test.mjs
git commit -m "fix: route hero services navigation correctly"
```

---

### Task 6: Responsive, reduced-motion, and integration regression pass

**Files:**
- Modify if needed: `src/components/MainSite/PostExploreNarrative/ClosingFooter.module.css`
- Modify if needed: `src/components/MainSite/PostExploreNarrative/servicesDetachMotion.ts`
- Test: `tests/footer-services-detach.test.mjs`
- Test: `tests/navigation.test.mjs`
- Test: `tests/navigation-performance.test.mjs`
- Test: `tests/navigation-unified-flood.test.mjs`

**Interfaces:**
- Verifies all previous tasks together; introduces no new architecture.

- [ ] **Step 1: Add final static regression assertions**

```js
test('closing footer remains responsive, reduced-motion aware and does not restore placeholder sections', () => {
  const css = read('src/components/MainSite/PostExploreNarrative/ClosingFooter.module.css');
  const motion = read('src/components/MainSite/PostExploreNarrative/servicesDetachMotion.ts');
  const main = read('src/components/MainSite/MainSite.tsx');

  assert.match(css, /@media\s*\(max-width:/);
  assert.match(css, /clamp\(/);
  assert.match(motion, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(main, /id="(?:work|services|audit|about|process|proof|engagement|contact)"/);
});
```

- [ ] **Step 2: Run the complete Node test suite**

```bash
npm test
```
Expected: 0 failures.

- [ ] **Step 3: Run strict TypeScript verification**

```bash
npm run typecheck
```
Expected: exit 0.

- [ ] **Step 4: Run production build**

```bash
npm run build
```
Expected: exit 0.

- [ ] **Step 5: Perform desktop browser QA**

Run:
```bash
npm run dev
```

Verify in Chrome at a desktop viewport:

1. Footer scrolls normally into view before pinning.
2. When the footer stage reaches the top, it holds briefly rather than for multiple screens.
3. SERVICES remains normal until pin start.
4. WORK and ABOUT never shift by even a pixel when SERVICES begins moving.
5. SERVICES follows a smooth curved path and lands centered under the headline.
6. SERVICES flood hover still works at origin, during practical hoverable travel positions, and when landed.
7. Final pill remains clickable and points to `/services`.
8. Scrolling upward returns the exact same pill to its original slot continuously.
9. No visible snap occurs at progress `0`, progress `1`, resize, or reverse direction.
10. Navbar/ribbon/WebGL scrolling remains visually smooth.

- [ ] **Step 6: Perform mobile browser QA**

Test at approximately `390x844` and one wider tablet/mobile layout:

1. Two-line headline remains readable and centered.
2. Dock remains below headline without colliding with metadata.
3. SERVICES path is recomputed for mobile nav geometry and lands exactly in the dock.
4. Original mobile SERVICES slot remains occupied; WORK/ABOUT do not jump.
5. Orientation/resize during the footer preserves correct current scroll progress.

- [ ] **Step 7: Verify reduced motion**

Enable `prefers-reduced-motion: reduce` in DevTools and verify:

- no prolonged curved travel;
- SERVICES resolves between origin/destination based on the same scroll range;
- CTA remains readable/clickable;
- no hidden content or broken navbar geometry.

- [ ] **Step 8: Final scope diff**

```bash
git diff --stat HEAD~4..HEAD
git diff HEAD~4..HEAD -- src/components/navigation src/components/MainSite/PostExploreNarrative src/components/experience/Hero/Hero.tsx tests
```

Confirm no ribbon, WebGL reveal, loader, artwork asset, GrowthRing implementation, or unrelated homepage system was modified.

- [ ] **Step 9: Final polish commit only if QA required tuning**

If browser QA required small numeric adjustments to footer height, headline clamp, path control points, or final scale, make those exact tuning changes and re-run Steps 2–7 before committing:

```bash
git add src/components/MainSite/PostExploreNarrative/ClosingFooter.module.css src/components/MainSite/PostExploreNarrative/servicesDetachMotion.ts tests/footer-services-detach.test.mjs
git commit -m "fix: polish closing services choreography"
```

If no tuning changes are needed, do not create an empty commit.

---

## Acceptance Checklist

- [ ] Final copy is exactly `WHAT CAN WE` / `BUILD FOR YOU?`.
- [ ] `WEBERAISE` and `© 2026` sit at the final bottom edge.
- [ ] Footer uses a short sticky hold, not long scroll locking.
- [ ] Real SERVICES pill moves; no visible duplicate exists.
- [ ] SERVICES slot remains structurally occupied throughout.
- [ ] WORK and ABOUT remain motionless during detachment.
- [ ] Curved path is smooth, subtle, no rotation/bounce/opacity fade.
- [ ] End scale is approximately `1.12` and responsive.
- [ ] Scroll-up reverses the exact choreography.
- [ ] SERVICES flood hover remains intact.
- [ ] SERVICES href is `/services` in hero, main nav, travel, and footer landing states.
- [ ] Hero Explore handoff supports `/services` without treating it as a selector.
- [ ] No per-frame layout reads, DOM hit-testing, or React state updates.
- [ ] Reduced-motion path is implemented.
- [ ] Full test/typecheck/build verification passes before completion is claimed.
- [ ] Desktop/mobile live-browser QA confirms physical alignment and smoothness.
