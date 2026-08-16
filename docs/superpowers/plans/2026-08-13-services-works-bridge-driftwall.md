# Services Works Bridge DriftWall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the empty post-Services runway with a 120–140svh Works Bridge containing the locked editorial statement, a three-column autonomous React Bits–derived DriftWall, and one centered gooey `VIEW OUR WORK` link to `/work`.

**Architecture:** Keep the existing Services intro/MenuToGrid system untouched except for replacing its downstream `.futureRunway` with `<WorksBridge />`. Put perpetual wall motion in an isolated `DriftWall` component backed by pure motion helpers; keep teaser data in `worksBridgeModel.ts`; and add a generic `GooeyLink` primitive that matches the floating-navigation `GooeyTalkButton` behavior without merging the navigation branch.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript 7, CSS Modules, `requestAnimationFrame`, `ResizeObserver`, `IntersectionObserver`, CSS 3D transforms/masks, Node test runner via `tsx`.

## Global Constraints

- Work on `feature/services-opening-grid`; approved spec base is commit `b086d52b183791b8fd21a4bd2008e61014abeb3b` unless the branch has moved.
- Approved spec: `docs/superpowers/specs/2026-08-13-services-works-bridge-driftwall-design.md`.
- React Bits live reference: `https://reactbits.dev/components/drift-wall`.
- React Bits source: `https://github.com/DavidHDev/react-bits/blob/c7109dccb42e06592d1d9bc50bc87204697240e2/src/ts-default/Components/DriftWall/DriftWall.tsx` plus `DriftWall.css`.
- Exactly 3 columns; autonomous motion; no scroll-driven offsets; no sticky/pinning.
- Tiles are consistent ~4:3, visual-only, non-links, non-buttons, and absent from the tab order.
- Hovered tile becomes vivid/lifted; only its column damps to zero; other columns continue; the column smoothly resumes on leave.
- Use a long symmetric top/bottom dissolve into true black; no hard wall boundary.
- Real project images first; until supplied, use clearly named development assets under `public/work/placeholders/` with `placeholder: true` in the model.
- `VIEW OUR WORK` is the only `/work` action in the bridge.
- CTA must match the established navigation gooey language. Do not merge `feature/floating-navigation` in this task.
- Desktop target is approximately 1440×900 and 120–140svh total bridge height.
- Reduced motion stops autonomous movement/parallax but preserves the static composition and CTA.
- No WebGL, masonry, carousel controls, per-tile metadata, fake clients, fake metrics, or case-study claims.
- Do not modify `servicesMotion.ts`, `servicesModel.ts`, the same-node `SERVICES` handoff, MenuToGrid open/close choreography, or cover stacking.

---

## File Structure

**Create**
- `src/components/ServicesPage/WorksBridge.tsx`
- `src/components/ServicesPage/WorksBridge.module.css`
- `src/components/ServicesPage/worksBridgeModel.ts`
- `src/components/ui/DriftWall/DriftWall.tsx`
- `src/components/ui/DriftWall/DriftWall.module.css`
- `src/components/ui/DriftWall/driftWallMotion.ts`
- `src/components/ui/GooeyLink/GooeyLink.tsx`
- `src/components/ui/GooeyLink/GooeyLink.module.css`
- `src/components/ui/GooeyLink/gooeyParticles.ts`
- `tests/works-bridge.test.mjs`
- `public/work/placeholders/work-preview-01.svg` through `work-preview-06.svg`

**Modify**
- `src/components/ServicesPage/ServicesPage.tsx`
- `src/components/ServicesPage/ServicesPage.module.css`

---

### Task 1: Lock the teaser data and visual-only semantics

**Files:**
- Create: `src/components/ServicesPage/worksBridgeModel.ts`
- Create: `tests/works-bridge.test.mjs`
- Create: `public/work/placeholders/work-preview-01.svg` … `work-preview-06.svg`
- Create initial shell: `src/components/ServicesPage/WorksBridge.tsx`

**Interfaces:**

```ts
export type WorksBridgeItem = {
  id: string;
  image: string;
  placeholder: boolean;
};

export const WORKS_BRIDGE_ITEMS: readonly WorksBridgeItem[];
```

- [ ] **Step 1: Write failing model/link tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const moduleUrl = (file) => pathToFileURL(path.join(root, file)).href;
const { WORKS_BRIDGE_ITEMS } = await import(moduleUrl('src/components/ServicesPage/worksBridgeModel.ts'));

test('works teaser model is visual-only and six-slot', () => {
  assert.equal(WORKS_BRIDGE_ITEMS.length, 6);
  for (const item of WORKS_BRIDGE_ITEMS) {
    assert.deepEqual(Object.keys(item).sort(), ['id', 'image', 'placeholder']);
    assert.equal(item.placeholder, true);
    assert.match(item.image, /^\/work\/placeholders\/work-preview-0[1-6]\.svg$/);
  }
});

test('works bridge exposes exactly one /work target', () => {
  const source = read('src/components/ServicesPage/WorksBridge.tsx');
  assert.equal((source.match(/href=\"\/work\"/g) ?? []).length, 1);
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
node --import=tsx --test --test-name-pattern="works teaser model|one /work target" tests/works-bridge.test.mjs
```

Expected: FAIL because model/component do not exist.

- [ ] **Step 3: Create the model**

```ts
export const WORKS_BRIDGE_ITEMS = [
  { id: 'work-preview-01', image: '/work/placeholders/work-preview-01.svg', placeholder: true },
  { id: 'work-preview-02', image: '/work/placeholders/work-preview-02.svg', placeholder: true },
  { id: 'work-preview-03', image: '/work/placeholders/work-preview-03.svg', placeholder: true },
  { id: 'work-preview-04', image: '/work/placeholders/work-preview-04.svg', placeholder: true },
  { id: 'work-preview-05', image: '/work/placeholders/work-preview-05.svg', placeholder: true },
  { id: 'work-preview-06', image: '/work/placeholders/work-preview-06.svg', placeholder: true },
] as const satisfies readonly WorksBridgeItem[];
```

- [ ] **Step 4: Add six 1200×900 development SVGs**

Each file must visibly say `DEVELOPMENT PLACEHOLDER 0N`, contain only generic browser/UI geometry, and contain no invented client/company name. Minimum root:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" fill="#111"/>
  <rect x="90" y="80" width="1020" height="740" rx="20" fill="#f4f4f4"/>
  <text x="120" y="780" font-family="Arial, sans-serif" font-size="24" fill="#111">DEVELOPMENT PLACEHOLDER 01</text>
</svg>
```

Vary only generic layout blocks and the number for 02–06. These files are replaced one-for-one when real teaser crops arrive.

- [ ] **Step 5: Create minimal shell with exact approved copy and one `/work` link**

```tsx
import Link from 'next/link';

export function WorksBridge() {
  return (
    <section aria-labelledby="works-bridge-heading">
      <h2 id="works-bridge-heading">
        WE COULD KEEP<br />TELLING YOU.<br /><br />OR WE COULD<br />SHOW YOU.
      </h2>
      <Link href="/work">VIEW OUR WORK</Link>
    </section>
  );
}
```

- [ ] **Step 6: Re-run focused tests; expect PASS.**
- [ ] **Step 7: Commit**

```bash
git add src/components/ServicesPage/worksBridgeModel.ts src/components/ServicesPage/WorksBridge.tsx tests/works-bridge.test.mjs public/work/placeholders/
git commit -m "test: lock services works bridge contracts"
```

---

### Task 2: Implement pure DriftWall motion helpers

**Files:**
- Create: `src/components/ui/DriftWall/driftWallMotion.ts`
- Modify: `tests/works-bridge.test.mjs`

**Interfaces:**

```ts
export type DriftDirection = 'up' | 'down';
export function columnFactor(index: number, variance: number): number;
export function getBaseVelocity(index: number, speed: number, variance: number, direction: DriftDirection): number;
export function getVelocityTarget(baseVelocity: number, columnIndex: number, hoveredColumn: number): number;
export function getVelocityEase(dt: number, targetVelocity: number): number;
```

- [ ] **Step 1: Add failing tests**

```js
test('drift alternates and pauses only hovered column', async () => {
  const motion = await import(moduleUrl('src/components/ui/DriftWall/driftWallMotion.ts'));
  const v = [0, 1, 2].map((i) => motion.getBaseVelocity(i, 30, 0.22, 'up'));
  assert.ok(v[0] > 0);
  assert.ok(v[1] < 0);
  assert.ok(v[2] > 0);
  assert.notEqual(Math.abs(v[0]), Math.abs(v[2]));
  assert.equal(motion.getVelocityTarget(v[1], 1, 1), 0);
  assert.equal(motion.getVelocityTarget(v[0], 0, 1), v[0]);
  assert.equal(motion.getVelocityTarget(v[2], 2, 1), v[2]);
});

test('stopping damps faster than resuming', async () => {
  const { getVelocityEase } = await import(moduleUrl('src/components/ui/DriftWall/driftWallMotion.ts'));
  assert.ok(getVelocityEase(1 / 60, 0) > getVelocityEase(1 / 60, 30));
});
```

- [ ] **Step 2: Verify failure.**
- [ ] **Step 3: Implement helpers exactly**

```ts
export function columnFactor(index: number, variance: number): number {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
}

export function getBaseVelocity(index: number, speed: number, variance: number, direction: DriftDirection): number {
  const directionSign = direction === 'up' ? 1 : -1;
  const alternatingSign = index % 2 === 0 ? 1 : -1;
  return speed * columnFactor(index, variance) * directionSign * alternatingSign;
}

export function getVelocityTarget(baseVelocity: number, columnIndex: number, hoveredColumn: number): number {
  return columnIndex === hoveredColumn ? 0 : baseVelocity;
}

export function getVelocityEase(dt: number, targetVelocity: number): number {
  return 1 - Math.exp(-dt / (targetVelocity === 0 ? 0.16 : 0.28));
}
```

- [ ] **Step 4: Run focused tests; expect PASS.**
- [ ] **Step 5: Commit `feat: add drift wall motion model`.**

---

### Task 3: Build the autonomous DriftWall engine

**Files:**
- Create: `src/components/ui/DriftWall/DriftWall.tsx`
- Modify: `tests/works-bridge.test.mjs`

**Public interface:**

```ts
type DriftWallItem = { id: string; image: string };
type DriftWallProps = {
  items: readonly DriftWallItem[];
  columns?: number;
  speed?: number;
  variance?: number;
  tilt?: number;
  turn?: number;
  perspective?: number;
  depth?: number;
  parallax?: number;
  lift?: number;
  className?: string;
};
```

- [ ] **Step 1: Add failing structural test** verifying `requestAnimationFrame`, `ResizeObserver`, `IntersectionObserver`, `hoveredColRef`, `getVelocityTarget`, `alt=""`, and absence of `role="button"`, `tabIndex={0}`, and `href=`.
- [ ] **Step 2: Verify failure.**
- [ ] **Step 3: Port the reference ref architecture**

```ts
const containerRef = useRef<HTMLDivElement>(null);
const planeRef = useRef<HTMLDivElement>(null);
const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
const offsetsRef = useRef<number[]>([]);
const velocitiesRef = useRef<number[]>([]);
const hoveredColRef = useRef(-1);
const activeIdRef = useRef<string | null>(null);
const pointerRef = useRef({ x: 0, y: 0 });
const pointerDampedRef = useRef({ x: 0, y: 0 });
const lastTsRef = useRef<number | null>(null);
```

- [ ] **Step 4: Distribute items by modulo into exactly `columns` tracks** and calculate responsive geometry from the root width. Starting geometry:

```ts
const gap = width < 640 ? 8 : width < 900 ? 12 : 16;
const minTile = width < 640 ? 92 : 150;
const maxTile = width < 640 ? 132 : 270;
const tileWidth = Math.min(maxTile, Math.max(minTile, (width - gap * 2) / 3));
const tileHeight = tileWidth * 0.75;
```

- [ ] **Step 5: Build seamless copies**

```ts
const unit = tileHeight + gap;
const copyHeight = Math.max(unit, column.length * unit);
const copies = Math.max(2, Math.ceil((containerHeight * 1.7) / copyHeight) + 1);
```

Initialize offsets with `meta.copyHeight * ((index * 0.37) % 1)` and normalize every frame with positive modulo before applying `translate3d(0, -offset, 0)`.

- [ ] **Step 6: Preserve damped plane parallax** using starting values `tilt=10`, `turn=-10`, `depth=90`, `parallax=0.42`, `perspective=1400`.
- [ ] **Step 7: Detect active tile with `elementFromPoint(...).closest('[data-drift-tile]')`.** If pointer is in a gap, clear the active id and set `hoveredColRef.current = -1` so the column resumes.
- [ ] **Step 8: Apply per-column target velocity**

```ts
const target = getVelocityTarget(baseVelocities[c], c, hoveredColRef.current);
const ease = getVelocityEase(dt, target);
velocitiesRef.current[c] += (target - velocitiesRef.current[c]) * ease;
```

- [ ] **Step 9: Keep tiles decorative**

```tsx
<div className={styles.tile} data-drift-tile data-active={activeId === id ? 'true' : 'false'} data-col={columnIndex}>
  <span className={styles.tileInner}>
    <img src={item.image} alt="" draggable={false} decoding="async" />
    <span className={styles.overlay} aria-hidden="true" />
  </span>
</div>
```

- [ ] **Step 10: Add reduced-motion and offscreen lifecycle.** Use `matchMedia('(prefers-reduced-motion: reduce)')`. Use `IntersectionObserver({ rootMargin: '240px 0px' })`; run RAF only while near viewport and not reduced. Preserve offsets when stopping/restarting.
- [ ] **Step 11: Run focused tests and `npm run typecheck`; expect PASS.**
- [ ] **Step 12: Commit `feat: add autonomous services drift wall`.**

---

### Task 4: Add Weberaise wall styling and the long dissolve

**Files:**
- Create: `src/components/ui/DriftWall/DriftWall.module.css`
- Modify: `DriftWall.tsx`
- Modify: `tests/works-bridge.test.mjs`

- [ ] **Step 1: Add failing CSS contracts** for vertical mask, `4 / 3`, and active `translateZ(var(--dw-lift))`.
- [ ] **Step 2: Verify failure.**
- [ ] **Step 3: Implement root mask**

```css
.root {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  perspective: var(--dw-perspective, 1400px);
  perspective-origin: 50% 50%;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%);
}
```

- [ ] **Step 4: Implement restrained resting state**: tile opacity `0.82`, `saturate(0.9) brightness(0.9)`, black overlay `0.16`, radius `clamp(4px, .55vw, 8px)`.
- [ ] **Step 5: Implement active state**: opacity 1, `translateZ(var(--dw-lift, 42px))`, restrained shadow, `saturate(1.03) brightness(1)`, overlay opacity 0.
- [ ] **Step 6: Add no-mask fallback** using hidden `.fadeTop`/`.fadeBottom` overlays enabled only in `@supports not (mask-image: linear-gradient(#000, #000))`.
- [ ] **Step 7: Add reduced-motion CSS** removing track/plane `will-change` and active lift transitions while retaining the static masked wall.
- [ ] **Step 8: Run focused tests + typecheck; expect PASS.**
- [ ] **Step 9: Commit `feat: style services drift wall teaser`.**

---

### Task 5: Build the Works Bridge composition and replace `.futureRunway`

**Files:**
- Modify: `WorksBridge.tsx`
- Create: `WorksBridge.module.css`
- Modify: `ServicesPage.tsx`
- Modify: `ServicesPage.module.css`
- Modify: `tests/works-bridge.test.mjs`

- [ ] **Step 1: Add failing integration tests** asserting: `ServicesPage` imports/renders `<WorksBridge />`; `styles.futureRunway` and `.futureRunway` CSS are gone; `WorksBridge` contains exact copy; `columns={3}`; Works Bridge CSS contains neither `position: sticky` nor `position: fixed`.
- [ ] **Step 2: Verify failure.**
- [ ] **Step 3: Render final structure**

```tsx
<section className={styles.bridge} aria-labelledby="works-bridge-heading">
  <div className={styles.main}>
    <div className={styles.statementWrap}>
      <h2 id="works-bridge-heading" className={styles.statement}>
        <span>WE COULD KEEP</span>
        <span>TELLING YOU.</span>
        <span className={styles.statementBreak}>OR WE COULD</span>
        <span>SHOW YOU.</span>
      </h2>
    </div>
    <div className={styles.wallStage} aria-hidden="true">
      <DriftWall items={WORKS_BRIDGE_ITEMS} columns={3} speed={30} variance={0.22} tilt={10} turn={-10} perspective={1400} depth={90} parallax={0.42} lift={42} />
    </div>
  </div>
  <div className={styles.ctaWrap}>{/* GooeyLink in Task 6 */}</div>
</section>
```

- [ ] **Step 4: Apply desktop starting layout**

```css
.bridge {
  position: relative;
  min-height: clamp(1040px, 132svh, 1420px);
  padding: clamp(120px, 18svh, 190px) var(--wr-page-pad) clamp(90px, 12svh, 140px);
  background: var(--wr-black);
  color: var(--wr-white);
}
.main {
  width: min(100%, 1600px);
  min-height: clamp(640px, 84svh, 820px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, .72fr) minmax(0, 1.18fr);
  gap: clamp(40px, 5vw, 88px);
  align-items: center;
}
.statement {
  margin: 0;
  display: flex;
  flex-direction: column;
  font: 600 clamp(42px, 5.2vw, 82px)/.9 var(--font-hero), Arial, sans-serif;
  letter-spacing: -.055em;
  text-transform: uppercase;
}
.statementBreak { margin-top: .7em; }
.wallStage { width: 100%; height: clamp(560px, 78svh, 760px); min-width: 0; }
.ctaWrap { display: flex; justify-content: center; padding-top: clamp(72px, 9svh, 110px); }
```

- [ ] **Step 5: Replace `.futureRunway` at its existing downstream position.** Keep Works Bridge outside `.content`, `.cover`, and service preview stacking. Delete only `.futureRunway` desktop/mobile CSS rules.
- [ ] **Step 6: Responsive:** at `<=900px`, stack statement above wall; at `<=640px`, use 18px side padding, statement `clamp(34px, 11vw, 54px)`, wall `clamp(430px, 62svh, 590px)`. Keep `columns={3}`.
- [ ] **Step 7: Run Works Bridge tests plus existing Services opening/open/close contracts and typecheck.**
- [ ] **Step 8: Commit `feat: add services works bridge composition`.**

---

### Task 6: Add a generic navigation-style `GooeyLink`

**Files:**
- Create: `src/components/ui/GooeyLink/GooeyLink.tsx`
- Create: `GooeyLink.module.css`
- Create: `gooeyParticles.ts`
- Modify: `WorksBridge.tsx`
- Modify: `WorksBridge.module.css`
- Modify: `tests/works-bridge.test.mjs`

**Source-of-truth branch files:**
- `feature/floating-navigation:src/components/navigation/GooeyTalkButton.tsx`
- `feature/floating-navigation:src/components/navigation/Navigation.module.css`
- `feature/floating-navigation:src/components/navigation/gooeyParticles.ts`

**Public interface:**

```ts
type GooeyLinkProps = { href: string; label: string; className?: string };
```

- [ ] **Step 1: Add failing test** asserting `<GooeyLink href="/work" label="VIEW OUR WORK" />`, `next/link`, `data-active`, and `GOOEY_PARTICLES.map`.
- [ ] **Step 2: Verify failure.**
- [ ] **Step 3: Copy approved particle geometry exactly:**

```ts
export const GOOEY_PARTICLES = [
  { x: -22, y: -8, scale: 0.48, delay: 0 }, { x: -18, y: 12, scale: 0.34, delay: 20 },
  { x: -8, y: -18, scale: 0.3, delay: 35 }, { x: 6, y: -20, scale: 0.42, delay: 10 },
  { x: 20, y: -10, scale: 0.38, delay: 28 }, { x: 24, y: 7, scale: 0.5, delay: 5 },
  { x: 14, y: 17, scale: 0.32, delay: 42 }, { x: 0, y: 21, scale: 0.4, delay: 18 },
  { x: -13, y: 18, scale: 0.36, delay: 30 }, { x: 0, y: -12, scale: 0.28, delay: 48 },
] as const;
```

- [ ] **Step 4: Port pointer/focus ownership:** `pointerActive`, `focusActive`, `burstEpoch`, `active = pointerActive || focusActive`; render base label, goo field/core, active particle spans, hover label; keep the root a real `Link`.
- [ ] **Step 5: Port the approved CSS behavior**: white pill/black text on the black bridge, `blur(4px) contrast(18)`, core scale `0.72 -> 1`, 520ms particle burst, visible focus state, coarse-pointer fallback, reduced-motion particle removal. Rename keyframe to `wrGooeyLinkBurst` to avoid future collision.
- [ ] **Step 6: Replace temporary CTA with:**

```tsx
<GooeyLink href="/work" label="VIEW OUR WORK" className={styles.cta} />
```

- [ ] **Step 7: Run link/model tests + typecheck; expect PASS.**
- [ ] **Step 8: Commit `feat: add gooey work-page CTA`.**

---

### Task 7: Browser-tune motion, responsiveness, looping, and performance

**Files:** modify only `WorksBridge.module.css`, `DriftWall.tsx`, `DriftWall.module.css`, and tests when evidence requires it.

- [ ] **Step 1: Run `npm run dev`; compare `http://localhost:3000/services` beside `https://reactbits.dev/components/drift-wall` at 1440×900.** Stop page scrolling for 10 seconds: wall must continue moving.
- [ ] **Step 2: Hover a tile in each column for >=1s.** Active tile vivid/lifted; selected column damps to zero; other two continue; moving into a gap resumes; no position jump.
- [ ] **Step 3: Watch loops for 30 seconds.** Reject gaps/teleports/reset after hover. If a copy gap appears, raise copy multiplier `1.7 -> 1.9` before changing speed.
- [ ] **Step 4: Tune only within approved ranges:** speed 26–34px/s; variance .16–.28; lift 34–48px; rest opacity .76–.86; overlay .10–.20; mask opaque start 16–22%; opaque end 78–84%; total bridge 120–140svh.
- [ ] **Step 5: Verify 1440×900, 1280×800, 768×1024, 390×844.** No horizontal overflow; exactly 3 columns; stack at <=900px; CTA centered; dissolve complete at both edges.
- [ ] **Step 6: Verify reduced motion and offscreen pause.** Reduced motion: static staggered wall, no parallax. Offscreen >~240px: RAF updates cancelled; returning resumes from preserved offsets.
- [ ] **Step 7: Run:**

```bash
npm test
npm run typecheck
npm run build
```

If build fails for an unrelated pre-existing issue, reproduce the same failure at the task base commit before classifying it unrelated.

- [ ] **Step 8: Commit only evidence-driven tuning; no empty commit.** Suggested message: `fix: tune services works bridge motion`.

---

### Task 8: Final regression gate

- [ ] **Step 1: Re-test Services intro/MenuToGrid:** intro, same-node `SERVICES` flight, every row hover, wave inversion, first/middle/last open, 4×2 preview, close, Escape, focus return.
- [ ] **Step 2: Open/close at least 3 services, then scroll into Works Bridge.** Confirm no leaked body overflow or stale z-index/pointer state affects the bridge.
- [ ] **Step 3: Confirm no fake-proof content:**

```bash
grep -RniE "client|award|testimonial|case study|%" src/components/ServicesPage/WorksBridge.tsx src/components/ServicesPage/worksBridgeModel.ts public/work/placeholders || true
```

Expected: no fabricated client/award/metric/case-study claims.

- [ ] **Step 4: Confirm scope:**

```bash
git diff --name-only b086d52b183791b8fd21a4bd2008e61014abeb3b...HEAD
```

Expected changes only in WorksBridge/DriftWall/GooeyLink, teaser assets, Services runway insertion/removal, tests, and this plan. No homepage hero/ribbon or navigation-branch files.

- [ ] **Step 5: Final verification:**

```bash
npm test && npm run typecheck && npm run build
git status --short
git log --oneline --decorate -n 12
```

Do not report completion until browser QA and verification both pass.

---

## Spec Coverage Self-Review

- Seamless black continuation and exact statement: Task 5.
- 3-column React Bits autonomous motion: Tasks 2–4.
- No sticky/scroll-driven wall: Tasks 3, 5, 7.
- 4:3 tiles; subdued rest; vivid lift: Task 4.
- Hovered-column-only stop/resume: Tasks 2, 3, 7.
- Long top/bottom dissolve: Task 4.
- Visual-only tile semantics: Tasks 1, 3.
- Real-work-first/development asset discipline: Task 1.
- Single `/work` CTA: Tasks 1, 6.
- Navigation-style gooey CTA: Task 6.
- 120–140svh rhythm + responsive stack: Tasks 5, 7.
- Reduced motion + offscreen performance: Tasks 3, 4, 7.
- Existing Services choreography isolation: Tasks 5, 8.
- Automated + browser verification: Tasks 7, 8.

No unresolved design decisions remain. Browser tuning is limited to numeric ranges explicitly permitted by the approved design spec.