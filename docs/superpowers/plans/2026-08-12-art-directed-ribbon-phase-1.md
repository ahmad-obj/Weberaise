# Art-Directed Ribbon Journey — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic document-space route through Q3 with one continuous, premium, art-directed ribbon that includes the longer automatic opening loop, alternating question/artwork layouts, Q1 front/behind artwork wrap, calm Q2 bend, and measured double-O trace through `look`.

**Architecture:** Preserve the existing native-scroll/document-space controller and 45–58vh head band. Split geometry into measured DOM targets plus pure route primitives, generate one canonical centerline, and render synchronized base/front copies of that same centerline only for depth. Phase 1 deliberately stops before changing the reassurance treatment so the new geometry can be visually accepted independently.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, GSAP 3.15.0, CSS Modules, SVG. No new dependency in Phase 1.

## Global Constraints

- Work on `feature/signature-intro`; do not merge PR #1.
- Preserve native page scrolling and existing document-space journey architecture.
- Preserve ribbon-head behavior: `HEAD_BAND_MIN = 0.45`, `HEAD_BAND_MAX = 0.58`, nominal `0.52`.
- One canonical continuous ribbon centerline must own opening, Q1, Q2, Q3, and later Phase-2 continuation.
- No detached decorative circles, secondary independent ribbon routes, or scroll-jacking.
- Increase rendered ribbon width to approximately `1.3×` the current stroke.
- Use Weberaise blue gradient derived from `#2563EB`, `#3B82F6`, `#60A5FA`; avoid neon/glow-heavy styling.
- No sharp corners or tangent discontinuities.
- Q1: text left, placeholder artwork right; ribbon wraps artwork with front → behind → front depth.
- Q2: placeholder artwork left, text right; route uses one restrained broad bend and no loop.
- Q3: text left, placeholder artwork right; ribbon traces the two actual `o` glyphs in `look` consecutively.
- Q3 OO trace is an intentional exception to old text-clearance rules.
- Artwork placeholders must establish future animated/cartoon illustration geometry without requiring later layout restructuring.
- Questions reveal once only; reverse scroll retracts ribbon but does not hide/replay questions.
- Phase 1 must not change loader, hero, EXPLORE compositor, Aurora statement, GROW ring, or reassurance effect.
- TDD: no production behavior change before a failing test exists and is observed.
- Visual browser/screenshot review is required before Phase 1 is considered complete.

---

## File Structure for Phase 1

**Create**
- `src/components/MainSite/PostExploreNarrative/JourneyArtwork.tsx` — responsive authored placeholder/future artwork shell.
- `src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts` — pure smooth-path primitives and spline conversion.
- `tests/ribbon-art-direction.test.mjs` — source/architecture contracts for one centerline, layouts, gradient/depth layers, and glyph targets.
- `tests/ribbon-primitives.test.mjs` — executable geometry contracts for smooth continuous primitives.

**Modify**
- `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx` — alternating text/artwork composition, Q3 glyph anchors, new refs/controller interface.
- `src/components/MainSite/PostExploreNarrative/JourneyStop.tsx` — keep normal-flow stop semantics while supporting two-column child composition if needed.
- `src/components/MainSite/PostExploreNarrative/journeyRoute.ts` — replace generic visit-only tuning with explicit art-direction parameters.
- `src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts` — measure artwork/glyph targets and compose the primitive route.
- `src/components/MainSite/PostExploreNarrative/RibbonTrail.tsx` — gradient/base/front rendering from the same `d`.
- `src/components/MainSite/PostExploreNarrative/ribbonController.ts` — synchronize dash progress across multiple visual copies and derive auto-opening floor from route geometry.
- `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css` — alternating editorial layouts, placeholders, stronger gradient ribbon layers.
- `tests/post-explore-narrative.test.mjs` — replace generic-route assumptions with Phase-1 canonical contracts.
- `tests/ribbon-route-geometry.test.mjs` — retain clearance regression where applicable and add measured-target route assertions.
- `tests/ribbon-trail-integration.test.mjs` — controller lifecycle and synchronized multi-path contracts.

**Do not modify in Phase 1**
- `ParticleReassurance.tsx`
- `particleModel.ts`
- `package.json`

---

### Task 1: Lock the Phase-1 Contracts in Failing Tests

**Files:**
- Create: `tests/ribbon-art-direction.test.mjs`
- Create: `tests/ribbon-primitives.test.mjs`
- Modify: `tests/post-explore-narrative.test.mjs`
- Modify: `tests/ribbon-trail-integration.test.mjs`

**Interfaces:**
- Consumes: current `JourneyNarrative`, `RibbonTrail`, `buildJourneyPath`, `ribbonController`.
- Produces: executable/source contracts that every later Phase-1 task must satisfy.

- [ ] **Step 1: Write failing architecture tests**

Add contracts equivalent to:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const feature = 'src/components/MainSite/PostExploreNarrative';
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('art-directed journey adds artwork and primitive modules', () => {
  assert.equal(existsSync(resolve(root, feature, 'JourneyArtwork.tsx')), true);
  assert.equal(existsSync(resolve(root, feature, 'ribbonPrimitives.ts')), true);
});

test('question composition alternates artwork and exposes both look O glyphs', () => {
  const source = read(`${feature}/JourneyNarrative.tsx`);
  assert.match(source, /data-ribbon-artwork="q1"/);
  assert.match(source, /data-ribbon-artwork="q2"/);
  assert.match(source, /data-ribbon-artwork="q3"/);
  assert.match(source, /data-ribbon-glyph="look-o-1"/);
  assert.match(source, /data-ribbon-glyph="look-o-2"/);
});

test('RibbonTrail renders one canonical d through synchronized depth layers', () => {
  const source = read(`${feature}/RibbonTrail.tsx`);
  assert.match(source, /linearGradient/);
  assert.match(source, /basePathRef/);
  assert.match(source, /frontPathRef/);
  assert.doesNotMatch(source, /frontD|backD|secondaryD/);
});
```

Update the old particle tests only if they accidentally assume reassurance/layout details changed in Phase 1; the particle treatment must still remain present.

- [ ] **Step 2: Add failing controller contracts**

Require the controller interface to own one measurement path and synchronize all visible paths:

```js
test('controller synchronizes one resolved length across all ribbon copies', () => {
  const source = read(`${feature}/ribbonController.ts`);
  assert.match(source, /measurementPath/);
  assert.match(source, /drawPaths/);
  assert.match(source, /for \(const path of drawPaths\)/);
  assert.match(source, /openingLocalY/);
  assert.doesNotMatch(source, /openingLength:\s*number/);
});
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
npm test -- tests/ribbon-art-direction.test.mjs tests/ribbon-primitives.test.mjs tests/ribbon-trail-integration.test.mjs
```

Expected: FAIL because `JourneyArtwork.tsx`, `ribbonPrimitives.ts`, glyph targets, multi-path refs, and `openingLocalY` controller interface do not exist yet.

- [ ] **Step 4: Commit the RED contracts**

```bash
git add tests/ribbon-art-direction.test.mjs tests/ribbon-primitives.test.mjs tests/post-explore-narrative.test.mjs tests/ribbon-trail-integration.test.mjs
git commit -m "test: define art-directed ribbon contracts"
```

---

### Task 2: Build the Artwork Layout and Measurable Q3 Glyph Targets

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/JourneyArtwork.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Test: `tests/ribbon-art-direction.test.mjs`

**Interfaces:**
- Consumes: existing `JourneyStop`, canonical question strings from `postExploreCopy.questions`.
- Produces: `[data-ribbon-artwork="q1|q2|q3"]`, `[data-ribbon-glyph="look-o-1|look-o-2"]`, stable responsive measured DOM rectangles.

- [ ] **Step 1: Keep the failing layout test isolated**

Run:

```bash
node --import=tsx --test tests/ribbon-art-direction.test.mjs
```

Expected: FAIL on missing artwork/glyph markup.

- [ ] **Step 2: Create the authored placeholder component**

Implement this interface:

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

The placeholder should be dark/editorial and visually intentional, but contain no fake client image or claim.

- [ ] **Step 3: Convert Q1/Q2/Q3 to alternating two-column compositions**

Use three normal-flow `.journeyBeat` wrappers:

```tsx
<div className={`${styles.journeyBeat} ${styles.journeyBeatTextLeft}`}>
  <h2 ...>{questions[0]}</h2>
  <JourneyArtwork id="q1" label="Website concept artwork placeholder" />
</div>
```

Q2 reverses the visual order. Q3 returns text left/artwork right.

- [ ] **Step 4: Expose the actual two `o` glyphs in `look`**

Do not duplicate the whole canonical sentence manually. Split the supplied question around `look` and render the word with measured spans:

```tsx
const q3 = questions[2] ?? '';
const match = q3.match(/^(.*?)(look)(.*)$/i);

<span>{match?.[1]}</span>
<span data-look-word>
  l<span data-ribbon-glyph="look-o-1">o</span><span data-ribbon-glyph="look-o-2">o</span>k
</span>
<span>{match?.[3]}</span>
```

If the copy no longer contains `look`, fall back to the unmodified string rather than crashing.

- [ ] **Step 5: Add responsive editorial CSS**

Desktop/tablet:

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
```

Mobile may stack, but preserve visual alternation by controlling `order` instead of absolute positioning. Artwork should use `aspect-ratio` and remain measurable.

- [ ] **Step 6: Run the focused test and verify GREEN for layout**

```bash
node --import=tsx --test tests/ribbon-art-direction.test.mjs
```

Expected: artwork/glyph contracts PASS; primitive/gradient/controller contracts may still fail.

- [ ] **Step 7: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative/JourneyArtwork.tsx src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css tests/ribbon-art-direction.test.mjs
git commit -m "feat: add journey artwork compositions"
```

---

### Task 3: Create Pure Smooth Ribbon Primitives

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts`
- Test: `tests/ribbon-primitives.test.mjs`

**Interfaces:**
- Produces:

```ts
export type RibbonPoint = { x: number; y: number };

export function appendFlow(points: RibbonPoint[], target: RibbonPoint, bendX?: number): void;
export function appendLooseOvalLoop(points: RibbonPoint[], center: RibbonPoint, radiusX: number, radiusY: number, skew?: number): void;
export function appendArtworkWrap(points: RibbonPoint[], rect: RibbonRect, side: 'left' | 'right', clearance: number): RibbonWrapMarkers;
export function appendGentleBend(points: RibbonPoint[], fromSide: 'left' | 'right', center: RibbonPoint, width: number): void;
export function appendGlyphLoop(points: RibbonPoint[], rect: RibbonRect, scaleX: number, scaleY: number): void;
export function smoothRibbonPath(points: readonly RibbonPoint[], tension?: number): string;
```

Where:

```ts
export type RibbonRect = { left: number; top: number; right: number; bottom: number; width: number; height: number };
export type RibbonWrapMarkers = { frontEntryY: number; backY: number; frontExitY: number };
```

- [ ] **Step 1: Write executable pure-geometry tests**

Test that:
- loose oval appends multiple guide points and ends beyond its start;
- loop radii are not identical by default;
- `smoothRibbonPath()` emits cubic `C` commands and no `L` commands;
- Q1 wrap markers are ordered `frontEntryY < backY < frontExitY`;
- glyph loop returns to a forward-progressing exit rather than terminating at its entry.

Example:

```js
test('smoothRibbonPath converts guide points into a cubic-only continuous path', async () => {
  const { smoothRibbonPath } = await import('../src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts');
  const d = smoothRibbonPath([
    { x: 0, y: 0 },
    { x: 80, y: 60 },
    { x: 40, y: 130 },
    { x: 120, y: 220 },
  ]);
  assert.match(d, /^M /);
  assert.match(d, / C /);
  assert.doesNotMatch(d, / L /);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --import=tsx --test tests/ribbon-primitives.test.mjs
```

Expected: FAIL because the module/functions do not exist.

- [ ] **Step 3: Implement guide-point primitives**

Use guide points, not independent SVG subpaths. All primitives append to one mutable point chain. `smoothRibbonPath` performs one Catmull-Rom/cardinal-to-cubic conversion across the complete chain so primitive boundaries share smooth tangents.

Do not let individual primitives return independent `d` strings.

- [ ] **Step 4: Verify GREEN**

```bash
node --import=tsx --test tests/ribbon-primitives.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts tests/ribbon-primitives.test.mjs
git commit -m "feat: add continuous ribbon route primitives"
```

---

### Task 4: Replace Generic Route Composition with Measured Art Direction

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/journeyRoute.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts`
- Modify: `tests/ribbon-route-geometry.test.mjs`
- Test: `tests/ribbon-primitives.test.mjs`

**Interfaces:**
- Consumes: artwork/glyph DOM anchors from Task 2; primitives from Task 3.
- Produces:

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

- [ ] **Step 1: Rewrite route-config tests first**

Require explicit art-direction parameters rather than `openingLength` and generic only-side visits. The config should expose values similar to:

```ts
export type JourneyRouteConfig = {
  edgeInset: number;
  sampleSpacing: number;
  opening: { lead: number; loopRadiusX: number; loopRadiusY: number; exitRun: number };
  q1: { clearance: number; wrapScale: number };
  q2: { bendWidth: number; bendBias: number };
  q3: { glyphScaleX: number; glyphScaleY: number };
  reassurance: JourneyVisit; // retained for Phase 2/current stop compatibility
};
```

- [ ] **Step 2: Run route tests and verify RED**

```bash
node --import=tsx --test tests/ribbon-route-geometry.test.mjs tests/ribbon-art-direction.test.mjs
```

Expected: FAIL against current generic `visits` builder.

- [ ] **Step 3: Measure all Phase-1 geometry from DOM**

In `buildJourneyPath.ts`, add bounded helpers that measure:
- root rect;
- Q1/Q2/Q3 stop rects;
- Q1/Q2/Q3 artwork rects;
- Q3 `look-o-1` and `look-o-2` glyph rects.

Convert every rect to root-local coordinates immediately after reading it. Do all DOM reads before route composition; do not mix reads/writes.

- [ ] **Step 4: Compose the opening loop**

Start at the upper-left edge, run farther than the current opening, append one asymmetric loose oval, then append an exit run. Set `openingLocalY` to the local Y at the end of the opening primitive so the controller can auto-draw through the loop.

- [ ] **Step 5: Compose Q1 artwork wrap**

Use the measured Q1 artwork rectangle. The route must:
- approach the upper region;
- cross a front window over/near an upper corner;
- wrap around the outer side;
- travel behind the artwork for the middle/lower region;
- re-emerge through a second front window;
- continue downward.

Populate `frontClipRects` only for the two intentional front windows. The base path remains behind artwork/content.

- [ ] **Step 6: Compose Q2 gentle bend**

Use measured Q2 beat/artwork center only to position one broad bend. Do not add an oval or multiple direction reversals.

- [ ] **Step 7: Compose Q3 measured OO loops**

For each measured O rect:

```ts
appendGlyphLoop(points, glyphRect, config.q3.glyphScaleX, config.q3.glyphScaleY);
```

Append first O then second O directly in the same guide-point chain. Add one front clip window covering the OO interaction so the upper ribbon copy appears over the text only there.

- [ ] **Step 8: Preserve stop metadata for reveal/head tracking**

Continue returning `localY`, `revealLocalY`, and `bandBias` for Q1/Q2/Q3/reassurance. The route may be more complex horizontally, but the controller must still receive monotonic-enough visit metadata.

- [ ] **Step 9: Run geometry tests and verify GREEN**

```bash
node --import=tsx --test tests/ribbon-route-geometry.test.mjs tests/ribbon-primitives.test.mjs tests/ribbon-art-direction.test.mjs
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative/journeyRoute.ts src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts tests/ribbon-route-geometry.test.mjs tests/ribbon-primitives.test.mjs tests/ribbon-art-direction.test.mjs
git commit -m "feat: art-direct ribbon path through questions"
```

---

### Task 5: Render Premium Gradient and Front/Behind Depth from One Centerline

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/RibbonTrail.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Modify: `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx`
- Test: `tests/ribbon-art-direction.test.mjs`

**Interfaces:**
- Consumes: `d`, `frontClipRects` from `BuiltJourneyPath`.
- Produces refs:

```ts
basePathRef: RefObject<SVGPathElement | null>;
frontPathRef: RefObject<SVGPathElement | null>;
```

Both paths use exactly the same `d`.

- [ ] **Step 1: Keep the gradient/depth test RED**

```bash
node --import=tsx --test tests/ribbon-art-direction.test.mjs
```

Expected: FAIL on gradient, front path, and synchronized-layer contracts.

- [ ] **Step 2: Render one SVG gradient**

Inside `RibbonTrail`, use `useId()` and:

```tsx
<linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width} y2={height}>
  <stop offset="0%" stopColor="#2563EB" />
  <stop offset="42%" stopColor="#3B82F6" />
  <stop offset="68%" stopColor="#60A5FA" />
  <stop offset="100%" stopColor="#3B82F6" />
</linearGradient>
```

- [ ] **Step 3: Render base and clipped front copies with identical `d`**

Base path sits below journey content. Front path uses a clipPath made from `frontClipRects` and sits above artwork/text. Both use the same gradient and rounded linecap/join.

No separate path geometry is allowed.

- [ ] **Step 4: Increase stroke width approximately 1.3×**

Current desktop is 4px and mobile 3px. Set target visual widths around:
- desktop: `5.2px`;
- mobile: `3.9px`.

Tune by CSS variable rather than hardcoding unrelated values in multiple selectors:

```css
.journey { --ribbon-width: 5.2px; }
@media (max-width: 720px) { .journey { --ribbon-width: 3.9px; } }
```

- [ ] **Step 5: Add restrained physical polish**

Use rounded caps/joins and at most a faint blue drop-shadow/outer glow. Do not add a large blurred duplicate that makes it neon.

- [ ] **Step 6: Wire path refs in `JourneyNarrative`**

Create `basePathRef` and `frontPathRef`, pass both to `RibbonTrail`, and preserve the existing SVG ref for document-space mapping.

- [ ] **Step 7: Verify focused tests GREEN**

```bash
node --import=tsx --test tests/ribbon-art-direction.test.mjs
```

Expected: PASS for rendering contracts.

- [ ] **Step 8: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative/RibbonTrail.tsx src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css tests/ribbon-art-direction.test.mjs
git commit -m "feat: render layered gradient ribbon"
```

---

### Task 6: Synchronize Scroll Progress Across All Ribbon Copies

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/ribbonController.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx`
- Modify: `tests/ribbon-trail-integration.test.mjs`

**Interfaces:**
- New controller options:

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

- [ ] **Step 1: Run the controller test and verify RED**

```bash
node --import=tsx --test tests/ribbon-trail-integration.test.mjs
```

Expected: FAIL because current controller accepts one `path` and numeric `openingLength`.

- [ ] **Step 2: Derive opening floor from document Y**

After building the path lookup, calculate:

```ts
const openingDocumentY = rootDocumentTop + openingLocalY;
const openingFloor = resolveLengthForDocumentY(lookup, openingDocumentY);
```

This makes the automatic draw reach the actual end of the opening loop regardless of its geometric length.

- [ ] **Step 3: Apply one visible length to every draw path**

```ts
const setVisibleLength = (length: number) => {
  const clamped = clamp(length, 0, lookup.totalLength);
  for (const drawPath of drawPaths) {
    drawPath.style.strokeDasharray = `${lookup.totalLength}`;
    drawPath.style.strokeDashoffset = `${lookup.totalLength - clamped}`;
  }
};
```

`measurementPath` is used for `getTotalLength`/lookup. It may also be the base visible path; geometry must still be one canonical `d`.

- [ ] **Step 4: Preserve existing center-band and one-way reveal behavior exactly**

Do not change `HEAD_BAND_MIN`, `HEAD_BAND_MAX`, `HEAD_NOMINAL`, passive scroll listener, or one-way `revealedStops` semantics.

- [ ] **Step 5: Wire the new options from `JourneyNarrative`**

Pass both base/front paths only when refs exist. Do not create the controller until geometry and all required DOM refs are available.

- [ ] **Step 6: Run focused tests and verify GREEN**

```bash
node --import=tsx --test tests/ribbon-trail-integration.test.mjs tests/post-explore-narrative.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative/ribbonController.ts src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx tests/ribbon-trail-integration.test.mjs tests/post-explore-narrative.test.mjs
git commit -m "feat: synchronize layered ribbon progress"
```

---

### Task 7: Phase-1 Browser/Screenshot Acceptance Gate

**Files:**
- Modify only if visual QA identifies a concrete defect: route config, primitive parameters, layout CSS, or clipping geometry.
- Do not start Phase 2 until this gate passes.

**Interfaces:**
- Consumes completed Phase-1 route and renderer.
- Produces visual acceptance evidence for opening/Q1/Q2/Q3.

- [ ] **Step 1: Run available automated verification**

```bash
npm test
npm run typecheck
npm run build
```

If dependency/network limitations prevent a command from running, record that exact limitation; do not claim it passed.

- [ ] **Step 2: Run the real app if available**

```bash
npm run dev
```

Use the actual Next app whenever dependencies are installed. Only use the dependency-free Chromium harness as a fallback, and explicitly label it as a harness.

- [ ] **Step 3: Capture at minimum these desktop checkpoints**

Viewports:
- `1440×900`
- `1280×720`

Screenshots/inspection points:
1. automatic opening mid-loop;
2. end of automatic loop before/at scroll takeover;
3. Q1 upper front overlap;
4. Q1 behind-artwork middle/lower wrap;
5. Q1 re-emergence;
6. Q2 gentle bend;
7. Q3 first O trace;
8. Q3 second O trace.

- [ ] **Step 4: Capture mobile checkpoints**

Viewport:
- `390×844`

Inspect opening, Q1 wrap, Q2 bend, both Q3 O traces.

- [ ] **Step 5: Reject the phase for any of these defects**

- any visible break in the centerline;
- opening loop looks like a perfect circle or detached ornament;
- front/back depth produces a seam or mismatched dash progress;
- route has hard corners/kinks;
- Q1 ribbon simply circles the image without believable front/behind depth;
- Q2 becomes busy or loop-like;
- either Q3 O loop misses the actual glyph;
- OO trace makes `look` unreadable;
- ribbon head leaves the `45–58vh` band after acquisition;
- placeholders collapse/overflow or become unmeasurable on mobile;
- gradient becomes neon/garish.

- [ ] **Step 6: If a defect is found, use systematic-debugging before editing**

Trace whether the defect originates in measured DOM geometry, primitive guide points, spline conversion, clip rectangles, CSS stacking, or controller synchronization. Add a regression test before the fix whenever the defect is machine-testable.

- [ ] **Step 7: Re-run automated tests after visual tuning**

```bash
npm test
npm run typecheck
```

- [ ] **Step 8: Commit accepted Phase-1 tuning**

```bash
git add src/components/MainSite/PostExploreNarrative tests
git commit -m "fix: tune art-directed ribbon journey"
```

## Phase-1 Completion Gate

Phase 1 is complete only when:
- the automated Phase-1 contracts are green;
- the opening/Q1/Q2/Q3 path is visually accepted at desktop and mobile sizes;
- one continuous route is visibly preserved through all depth changes;
- the old particle reassurance is still untouched and functional;
- no claim is made about full production build if the environment could not run it.

Only then proceed to `2026-08-12-art-directed-ribbon-phase-2.md`.
