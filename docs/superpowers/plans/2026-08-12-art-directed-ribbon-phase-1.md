# Art-Directed Ribbon Journey — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic document-space route through Q3 with one continuous, premium, art-directed ribbon that includes the longer automatic opening loop, alternating question/artwork layouts, Q1 front/behind artwork wrap, calm Q2 bend, and measured double-O trace through `look`.

**Architecture:** Preserve the existing native-scroll/document-space controller and 45–58vh head band. Measured DOM targets feed pure route primitives that produce one canonical centerline `d`. Depth is rendered with **two sibling document-space SVG layers**: a back SVG below HTML content and a clipped front SVG above it; both draw the exact same `d` with identical progress, so Q1/Q3 depth never becomes separate ribbon geometry.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, GSAP 3.15.0, CSS Modules, SVG. No new dependency in Phase 1.

## Global Constraints

- Work on `feature/signature-intro`; do not merge PR #1.
- Preserve native page scrolling and the existing document-space journey architecture.
- Preserve `HEAD_BAND_MIN = 0.45`, `HEAD_BAND_MAX = 0.58`, `HEAD_NOMINAL = 0.52`.
- One canonical continuous centerline must own opening, Q1, Q2, Q3, and later Phase-2 continuation.
- No detached circles, separate decorative routes, or scroll-jacking.
- Increase ribbon width to approximately `1.3×` current: ~`5.2px` desktop and ~`3.9px` mobile.
- Gradient palette: `#2563EB → #3B82F6 → #60A5FA → #3B82F6`; restrained, not neon.
- No hard corners or tangent discontinuities.
- Q1: text left, artwork right; ribbon front → behind artwork → front.
- Q2: artwork left, text right; one broad restrained bend, no loop.
- Q3: text left, artwork right; ribbon traces the two actual `o` glyphs in `look` consecutively.
- Q3 OO trace is an intentional exception to old typography-clearance rules.
- Placeholders establish future animated/cartoon artwork geometry without fake client claims.
- Question reveals stay entrance-only and one-way.
- Phase 1 must not change loader, hero, EXPLORE compositor, Aurora, GROW ring, `ParticleReassurance`, `particleModel`, or `package.json`.
- TDD is mandatory: observe RED before production behavior changes.
- Browser/screenshot visual acceptance is mandatory before Phase 2 starts.

---

## Phase-1 File Map

**Create**
- `src/components/MainSite/PostExploreNarrative/JourneyArtwork.tsx`
- `src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts`
- `tests/ribbon-art-direction.test.mjs`
- `tests/ribbon-primitives.test.mjs`

**Modify**
- `JourneyNarrative.tsx`
- `JourneyStop.tsx` only if needed for child layout semantics
- `journeyRoute.ts`
- `buildJourneyPath.ts`
- `RibbonTrail.tsx`
- `ribbonController.ts`
- `PostExploreNarrative.module.css`
- `tests/post-explore-narrative.test.mjs`
- `tests/ribbon-route-geometry.test.mjs`
- `tests/ribbon-trail-integration.test.mjs`

---

### Task 1: Define the New Contracts First

**Files:**
- Create: `tests/ribbon-art-direction.test.mjs`
- Create: `tests/ribbon-primitives.test.mjs`
- Modify: `tests/post-explore-narrative.test.mjs`
- Modify: `tests/ribbon-trail-integration.test.mjs`

**Produces:** failing contracts for artwork anchors, Q3 glyph anchors, one-centerline/two-SVG rendering, primitive geometry, and synchronized controller progress.

- [ ] **Step 1: Add failing structural contracts**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const feature = 'src/components/MainSite/PostExploreNarrative';
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('art-directed journey owns artwork and primitive modules', () => {
  assert.equal(existsSync(resolve(root, feature, 'JourneyArtwork.tsx')), true);
  assert.equal(existsSync(resolve(root, feature, 'ribbonPrimitives.ts')), true);
});

test('journey exposes all artwork and actual look glyph targets', () => {
  const source = read(`${feature}/JourneyNarrative.tsx`);
  for (const id of ['q1', 'q2', 'q3']) assert.match(source, new RegExp(`data-ribbon-artwork=.${id}`));
  assert.match(source, /data-ribbon-glyph="look-o-1"/);
  assert.match(source, /data-ribbon-glyph="look-o-2"/);
});

test('depth uses sibling back/front SVG layers from one canonical d', () => {
  const source = read(`${feature}/RibbonTrail.tsx`);
  assert.match(source, /ribbonSvgBack/);
  assert.match(source, /ribbonSvgFront/);
  assert.match(source, /backPathRef/);
  assert.match(source, /frontPathRef/);
  assert.match(source, /linearGradient/);
  assert.doesNotMatch(source, /frontD|backD|secondaryD/);
});
```

- [ ] **Step 2: Add failing controller contracts**

```js
test('controller resolves once and applies the same length to every visible copy', () => {
  const source = read(`${feature}/ribbonController.ts`);
  assert.match(source, /measurementPath/);
  assert.match(source, /drawPaths/);
  assert.match(source, /for \(const .* of drawPaths\)/);
  assert.match(source, /openingLocalY/);
  assert.doesNotMatch(source, /openingLength:\s*number/);
});
```

- [ ] **Step 3: Run RED**

```bash
node --import=tsx --test \
  tests/ribbon-art-direction.test.mjs \
  tests/ribbon-primitives.test.mjs \
  tests/ribbon-trail-integration.test.mjs
```

Expected: FAIL because the new files/anchors/layers/interfaces do not exist.

- [ ] **Step 4: Commit RED contracts**

```bash
git add tests/ribbon-art-direction.test.mjs tests/ribbon-primitives.test.mjs tests/post-explore-narrative.test.mjs tests/ribbon-trail-integration.test.mjs
git commit -m "test: define art-directed ribbon contracts"
```

---

### Task 2: Add Responsive Artwork Beats and Q3 Glyph Anchors

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/JourneyArtwork.tsx`
- Modify: `JourneyNarrative.tsx`
- Modify: `PostExploreNarrative.module.css`
- Test: `tests/ribbon-art-direction.test.mjs`

**Produces:** `[data-ribbon-artwork="q1|q2|q3"]` and `[data-ribbon-glyph="look-o-1|look-o-2"]` with stable DOM rectangles.

- [ ] **Step 1: Re-run layout contract and confirm RED**

```bash
node --import=tsx --test tests/ribbon-art-direction.test.mjs
```

- [ ] **Step 2: Create `JourneyArtwork`**

```tsx
type JourneyArtworkProps = {
  id: 'q1' | 'q2' | 'q3';
  label: string;
};

export function JourneyArtwork({ id, label }: JourneyArtworkProps) {
  return (
    <figure className={styles.journeyArtwork} data-ribbon-artwork={id} aria-label={label}>
      <div className={styles.journeyArtworkSurface} aria-hidden="true">
        <span className={styles.journeyArtworkOrb} />
        <span className={styles.journeyArtworkGrid} />
      </div>
    </figure>
  );
}
```

Placeholder is editorial/dark and clearly temporary; no fake project image.

- [ ] **Step 3: Convert Q1/Q2/Q3 into alternating normal-flow beats**

Use `.journeyBeat` grid wrappers:
- Q1: question then artwork.
- Q2: artwork then question.
- Q3: question then artwork.

No absolute-positioned question layout.

- [ ] **Step 4: Measure the actual two `o` glyphs without duplicating the canonical sentence**

```tsx
const q3 = questions[2] ?? '';
const match = q3.match(/^(.*?)(look)(.*)$/i);

{match ? (
  <>
    {match[1]}
    <span data-look-word>
      l<span data-ribbon-glyph="look-o-1">o</span><span data-ribbon-glyph="look-o-2">o</span>k
    </span>
    {match[3]}
  </>
) : q3}
```

- [ ] **Step 5: Add responsive CSS**

```css
.journeyBeat {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.82fr);
  align-items: center;
  gap: clamp(48px, 8vw, 132px);
  width: min(100%, 1480px);
}

.journeyBeatTextRight {
  grid-template-columns: minmax(320px, 0.82fr) minmax(0, 1fr);
}

.journeyArtwork {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  margin: 0;
}
```

Mobile stacks deliberately while keeping artwork measurable.

- [ ] **Step 6: Verify layout contracts GREEN**

```bash
node --import=tsx --test tests/ribbon-art-direction.test.mjs
```

Primitive/layer contracts can remain red until later tasks.

- [ ] **Step 7: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative/JourneyArtwork.tsx src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css tests/ribbon-art-direction.test.mjs
git commit -m "feat: add journey artwork compositions"
```

---

### Task 3: Implement Pure Continuous Ribbon Primitives

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts`
- Test: `tests/ribbon-primitives.test.mjs`

**Produces:**

```ts
export type RibbonPoint = { x: number; y: number };
export type RibbonRect = { left: number; top: number; right: number; bottom: number; width: number; height: number };
export type RibbonWrapMarkers = { frontEntryY: number; backY: number; frontExitY: number };

export function appendFlow(points: RibbonPoint[], target: RibbonPoint, bendX?: number): void;
export function appendLooseOvalLoop(points: RibbonPoint[], center: RibbonPoint, radiusX: number, radiusY: number, skew?: number): void;
export function appendArtworkWrap(points: RibbonPoint[], rect: RibbonRect, side: 'left' | 'right', clearance: number): RibbonWrapMarkers;
export function appendGentleBend(points: RibbonPoint[], fromSide: 'left' | 'right', center: RibbonPoint, width: number): void;
export function appendGlyphLoop(points: RibbonPoint[], rect: RibbonRect, scaleX: number, scaleY: number): void;
export function smoothRibbonPath(points: readonly RibbonPoint[], tension?: number): string;
```

- [ ] **Step 1: Write executable tests**

Cover:
- oval loop appends an asymmetric loop and exits forward;
- `smoothRibbonPath()` emits one `M` followed by cubic `C` commands and no `L`/second `M`;
- Q1 markers satisfy `frontEntryY < backY < frontExitY`;
- glyph loop exits beyond its entry instead of becoming an isolated circle.

```js
test('smooth path is one cubic centerline', async () => {
  const { smoothRibbonPath } = await import('../src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts');
  const d = smoothRibbonPath([
    { x: 0, y: 0 }, { x: 80, y: 60 }, { x: 40, y: 130 }, { x: 120, y: 220 },
  ]);
  assert.match(d, /^M /);
  assert.match(d, / C /);
  assert.equal((d.match(/M /g) ?? []).length, 1);
  assert.doesNotMatch(d, / L /);
});
```

- [ ] **Step 2: Run RED**

```bash
node --import=tsx --test tests/ribbon-primitives.test.mjs
```

- [ ] **Step 3: Implement primitives as guide-point appenders**

Every primitive appends to one mutable point chain. No primitive returns an independent SVG `d`.

- [ ] **Step 4: Convert the complete point chain once**

Use one Catmull-Rom/cardinal-to-cubic conversion in `smoothRibbonPath()` so primitive boundaries share tangent continuity.

- [ ] **Step 5: Verify GREEN**

```bash
node --import=tsx --test tests/ribbon-primitives.test.mjs
```

- [ ] **Step 6: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts tests/ribbon-primitives.test.mjs
git commit -m "feat: add continuous ribbon route primitives"
```

---

### Task 4: Compose the Measured Opening/Q1/Q2/Q3 Route

**Files:**
- Modify: `journeyRoute.ts`
- Modify: `buildJourneyPath.ts`
- Modify: `tests/ribbon-route-geometry.test.mjs`
- Test: `tests/ribbon-primitives.test.mjs`

**Produces:**

```ts
export type RibbonClipRect = { x: number; y: number; width: number; height: number };

export type BuiltJourneyPath = {
  d: string;
  width: number;
  height: number;
  openingLocalY: number;
  stops: Record<JourneyStopId, BuiltJourneyStop>;
  frontClipRects: readonly RibbonClipRect[];
};
```

- [ ] **Step 1: Replace old generic-route tests with explicit config contracts**

```ts
export type JourneyRouteConfig = {
  edgeInset: number;
  sampleSpacing: number;
  opening: { lead: number; loopRadiusX: number; loopRadiusY: number; exitRun: number };
  q1: { clearance: number; wrapScale: number };
  q2: { bendWidth: number; bendBias: number };
  q3: { glyphScaleX: number; glyphScaleY: number };
  reassurance: JourneyVisit;
};
```

- [ ] **Step 2: Run route tests and confirm RED**

```bash
node --import=tsx --test tests/ribbon-route-geometry.test.mjs tests/ribbon-art-direction.test.mjs
```

- [ ] **Step 3: Read all geometry first**

Measure root, Q1/Q2/Q3 stops, Q1/Q2/Q3 artwork, and both O glyphs. Convert every rectangle to root-local coordinates before composing any route. No DOM writes during the read pass.

- [ ] **Step 4: Compose the automatic opening**

Start upper-left, travel farther than current, append one asymmetric loose oval, append an exit run, and set `openingLocalY` at the end of that opening primitive.

- [ ] **Step 5: Compose Q1 wrap from measured artwork**

Sequence: approach upper region → upper front overlap → outside wrap → behind-artwork middle/lower region → front re-emergence → smooth departure.

Return two `frontClipRects` covering only the intentional front windows.

- [ ] **Step 6: Compose Q2 breathing beat**

Use one broad `appendGentleBend()` based on Q2 composition center. No loop or rapid direction reversals.

- [ ] **Step 7: Compose Q3 from measured glyphs**

```ts
appendGlyphLoop(points, o1Rect, config.q3.glyphScaleX, config.q3.glyphScaleY);
appendGlyphLoop(points, o2Rect, config.q3.glyphScaleX, config.q3.glyphScaleY);
```

Add one front clip window over the OO interaction.

- [ ] **Step 8: Preserve reveal/head metadata**

Return `localY`, `revealLocalY`, `bandBias` for Q1/Q2/Q3/reassurance.

- [ ] **Step 9: Verify GREEN**

```bash
node --import=tsx --test \
  tests/ribbon-route-geometry.test.mjs \
  tests/ribbon-primitives.test.mjs \
  tests/ribbon-art-direction.test.mjs
```

- [ ] **Step 10: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative/journeyRoute.ts src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts tests/ribbon-route-geometry.test.mjs tests/ribbon-primitives.test.mjs tests/ribbon-art-direction.test.mjs
git commit -m "feat: art-direct ribbon path through questions"
```

---

### Task 5: Render Two Sibling SVG Depth Layers from the Same `d`

**Files:**
- Modify: `RibbonTrail.tsx`
- Modify: `JourneyNarrative.tsx`
- Modify: `PostExploreNarrative.module.css`
- Test: `tests/ribbon-art-direction.test.mjs`

**Produces refs:**

```ts
backSvgRef: RefObject<SVGSVGElement | null>;
backPathRef: RefObject<SVGPathElement | null>;
frontPathRef: RefObject<SVGPathElement | null>;
```

- [ ] **Step 1: Confirm rendering contract RED**

```bash
node --import=tsx --test tests/ribbon-art-direction.test.mjs
```

- [ ] **Step 2: Render back SVG below HTML content**

Back SVG is absolute, full-journey, `z-index:1`, pointer-events none, and owns the full canonical path used for measurement.

- [ ] **Step 3: Keep HTML content between the SVG layers**

`JourneyNarrative` orders siblings as:

```tsx
<RibbonBackLayer ... />
<div className={styles.journeyContent}>...</div>
<RibbonFrontLayer ... />
```

with `.journeyContent { position:relative; z-index:2; }`.

`RibbonBackLayer` and `RibbonFrontLayer` may be exported from `RibbonTrail.tsx`; both receive the same `d` prop.

- [ ] **Step 4: Render clipped front SVG above content**

Front SVG is absolute, `z-index:3`, pointer-events none, and clipPath-restricted to `frontClipRects`. It renders the exact same `d`.

- [ ] **Step 5: Define equivalent gradients in both sibling SVGs**

Use separate `useId()` IDs. Stops:

```tsx
<stop offset="0%" stopColor="#2563EB" />
<stop offset="42%" stopColor="#3B82F6" />
<stop offset="68%" stopColor="#60A5FA" />
<stop offset="100%" stopColor="#3B82F6" />
```

- [ ] **Step 6: Strengthen stroke**

```css
.journey { --ribbon-width: 5.2px; }
@media (max-width: 720px) { .journey { --ribbon-width: 3.9px; } }
```

Rounded cap/join; only faint physical polish.

- [ ] **Step 7: Verify GREEN**

```bash
node --import=tsx --test tests/ribbon-art-direction.test.mjs
```

- [ ] **Step 8: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative/RibbonTrail.tsx src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css tests/ribbon-art-direction.test.mjs
git commit -m "feat: render layered gradient ribbon"
```

---

### Task 6: Synchronize Both SVG Layers with One Scroll Resolution

**Files:**
- Modify: `ribbonController.ts`
- Modify: `JourneyNarrative.tsx`
- Modify: `tests/ribbon-trail-integration.test.mjs`

**Controller interface:**

```ts
type RibbonControllerOptions = {
  root: HTMLElement;
  svg: SVGSVGElement;
  measurementPath: SVGPathElement;
  drawPaths: readonly SVGPathElement[];
  openingLocalY: number;
  sampleSpacing: number;
  stops: BuiltJourneyPath['stops'];
  reducedMotion: boolean;
  onReveal: (id: JourneyStopId) => void;
};
```

- [ ] **Step 1: Confirm RED**

```bash
node --import=tsx --test tests/ribbon-trail-integration.test.mjs
```

- [ ] **Step 2: Derive opening floor from actual route Y**

```ts
const openingDocumentY = rootDocumentTop + openingLocalY;
const openingFloor = resolveLengthForDocumentY(lookup, openingDocumentY);
```

- [ ] **Step 3: Apply one visible length to all copies**

```ts
const setVisibleLength = (length: number) => {
  const clamped = clamp(length, 0, lookup.totalLength);
  for (const drawPath of drawPaths) {
    drawPath.style.strokeDasharray = `${lookup.totalLength}`;
    drawPath.style.strokeDashoffset = `${lookup.totalLength - clamped}`;
  }
};
```

- [ ] **Step 4: Preserve center-band/native-scroll/one-way reveal behavior unchanged**

Do not alter constants, passive scroll listener, opening floor semantics, or `revealedStops` behavior.

- [ ] **Step 5: Wire back/front refs**

Use back SVG/back path for lookup and `[backPath, frontPath]` for drawing.

- [ ] **Step 6: Verify GREEN**

```bash
node --import=tsx --test tests/ribbon-trail-integration.test.mjs tests/post-explore-narrative.test.mjs
```

- [ ] **Step 7: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative/ribbonController.ts src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx tests/ribbon-trail-integration.test.mjs tests/post-explore-narrative.test.mjs
git commit -m "feat: synchronize layered ribbon progress"
```

---

### Task 7: Phase-1 Visual Acceptance Gate

- [ ] **Step 1: Run fresh automated verification**

```bash
npm test
npm run typecheck
npm run build
```

If a command cannot run, record the limitation; do not claim it passed.

- [ ] **Step 2: Run the real app when available**

```bash
npm run dev
```

Harness may supplement debugging but does not replace real-app QA when the app can run.

- [ ] **Step 3: Capture desktop at `1440×900` and `1280×720`**

1. opening mid-loop;
2. opening complete/acquisition;
3. Q1 upper front overlap;
4. Q1 behind-artwork region;
5. Q1 front re-emergence;
6. Q2 calm bend;
7. Q3 first O;
8. Q3 second O.

- [ ] **Step 4: Capture mobile at `390×844`**

Inspect opening, Q1 depth, Q2 bend, both O loops.

- [ ] **Step 5: Reject Phase 1 for**

- any centerline break;
- back/front dash drift;
- stacking seam/pop;
- perfect/detached opening loop;
- tangent kink;
- flat Q1 circle instead of front/behind/front;
- busy Q2;
- missed/unreadable O trace;
- head outside 45–58vh after acquisition;
- mobile clipping/collapse;
- neon gradient.

- [ ] **Step 6: Debug failures systematically**

Identify DOM measurement vs primitive points vs spline vs clip rect vs stacking vs controller before editing. Add regression coverage first when feasible.

- [ ] **Step 7: Re-run after final visual fix**

```bash
npm test
npm run typecheck
```

- [ ] **Step 8: Commit accepted tuning**

```bash
git add src/components/MainSite/PostExploreNarrative tests
git commit -m "fix: tune art-directed ribbon journey"
```

## Phase-1 Completion Gate

Phase 1 is complete only when opening/Q1/Q2/Q3 are technically and visually accepted, one continuous route is visibly preserved through depth changes, the old reassurance remains untouched, and unavailable verification is not reported as passing.

Only then proceed to `docs/superpowers/plans/2026-08-12-art-directed-ribbon-phase-2.md`.
