# Smooth Ribbon and Journey Composition Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Q1/Q2 visual hierarchy and animation, replace Q3 artwork with a large centered paired-O typography event, and redesign the ribbon as a smooth, dimensional, semantically paced continuous route.

**Architecture:** Correct final DOM layout first because ribbon geometry is measured from rendered artwork and glyphs. Then replace dense point smoothing with semantic cubic curve segments and named markers. Resolve markers to SVG arc length at runtime and map scroll positions to those lengths through explicit pacing anchors, allowing loops to receive more scroll budget than straight transitions while one canonical path still drives synchronized back/front/highlight copies.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, CSS Modules, GSAP 3.15.0, SVG cubic Bézier paths/gradients, Node test runner with `tsx`, Chromium DevTools Protocol, ImageMagick for visual reference comparison.

## Global Constraints

- Work only on `feature/signature-intro`; do not merge, close, or mutate PR #1.
- Preserve unrelated changes in `next-env.d.ts`, `tsconfig.json`, `package-lock.json`, `tsconfig.tsbuildinfo`, `AGENTS.md`, and `CLAUDE.md`.
- Follow `docs/superpowers/specs/2026-08-13-smooth-ribbon-composition-redesign.md` exactly.
- Keep native document scrolling, one-way content reveals, and reverse-scroll ribbon retraction.
- Keep one canonical centerline for back, front, base, highlight, and taper rendering.
- Remove Q3 artwork from the rendered journey; do not replace it with another illustration.
- Q3 is exactly two centered lines: `Need to LOOK` / `better online?`.
- Reassurance is exactly two indivisible lines: `DONT WORRY.` / `WE GOT YOU`.
- Use semantic scroll budgets; do not fix loop blipping by globally lengthening the page.
- No sharp joins, cusps, hooks, sudden reversals, unnecessary S-turns, bounce, physics, particles, or continuous shimmer.
- Required browser viewports: `1440×900`, `1280×720`, and `390×844`.
- Existing full-suite baseline contains nine unrelated assertions failing in three files; task-focused suites must be fully green and no new full-suite failure may appear.

## Phase and Review Strategy

The phases are deliberately sequential because layout changes invalidate measured path geometry. Do not run Q1/Q2 composition edits and route construction concurrently in the shared checkout.

| Phase | Deliverable | Review gate |
|---|---|---|
| 1 | RED contracts and repeatable captures | Tests fail for only the intended missing behavior |
| 2 | Final Q1/Q2 layout and Q3/reassurance typography | Static screenshots approved before any ribbon rewrite |
| 3 | Early, readable content motion | Trigger/mid/final screenshots show attention arriving before center |
| 4 | Smooth semantic ribbon centerline | Geometry tests and full-path static captures approved |
| 5 | Loop-aware scroll pacing | Recorded normal/fast scroll shows no blipped interaction |
| 6 | Gradient, highlight, depth, and taper finish | Base/front/highlight copies remain synchronized |
| 7 | Cross-viewport regression and handoff | Focused green, typecheck/build green, PR untouched |

Composition and geometry benefit from separate review perspectives, but implementation must stay serial. If collaborative execution is used, assign one implementer per phase and use a fresh reviewer after Phases 2, 4, and 5; never allow two agents to edit `PostExploreNarrative.module.css`, `buildJourneyPath.ts`, or `ribbonController.ts` simultaneously.

---

### Task 1: Lock the Redesign Contracts and Capture Baseline Evidence

**Files:**
- Modify: `tests/journey-artwork-integration.test.mjs`
- Modify: `tests/ribbon-loop-regression.test.mjs`
- Create: `tests/ribbon-curve-continuity.test.mjs`
- Create: `tests/ribbon-pacing.test.mjs`
- Create: `scripts/capture-journey-qa.mjs`

**Interfaces:**
- Produces source contracts for Q1/Q2-only artwork, exact line groups, early triggers, semantic markers, curve continuity, pacing budgets, and synchronized stroke layers.
- Produces a repeatable command such as `node scripts/capture-journey-qa.mjs --url http://127.0.0.1:3000 --out /tmp/weberaise-redesign-baseline-1440x900 --viewport 1440x900`.

- [ ] **Step 1: Add the Q1/Q2/Q3 static-layout contracts**

Update `journey-artwork-integration.test.mjs` to require Q1 and Q2 scenes, reject a rendered Q3 scene, and assert the exact line-group hooks:

```js
assert.match(narrative, /data-q3-line="lead"/);
assert.match(narrative, /data-q3-line="finish"/);
assert.match(narrative, /data-ribbon-glyph="look-o-1"/);
assert.match(narrative, /data-ribbon-glyph="look-o-2"/);
assert.doesNotMatch(narrative, /<JourneyArtwork id="q3"/);
assert.match(narrative, /data-reassurance-line="one"/);
assert.match(narrative, /data-reassurance-line="two"/);
```

Also require Q1/Q2 scene-level layout hooks `data-artwork-reference="q1-master"` and `data-artwork-reference="q2-master"` so browser QA can identify calibrated scenes.

- [ ] **Step 2: Add curve continuity tests**

Define the production-facing segment contract expected from the future curve builder:

```ts
type RibbonCurveSegment = {
  id: string;
  start: RibbonPoint;
  control1: RibbonPoint;
  control2: RibbonPoint;
  end: RibbonPoint;
};
```

Test adjacent segment tangents with:

```js
const exit = Math.atan2(segment.end.y - segment.control2.y, segment.end.x - segment.control2.x);
const enter = Math.atan2(next.control1.y - next.start.y, next.control1.x - next.start.x);
assert.ok(angleDelta(exit, enter) < 0.16, `${segment.id} → ${next.id} breaks tangent continuity`);
```

Require all semantic marker IDs from the design spec, one `M`, cubic `C` commands only, no zero-length control handles, and no strict self-crossing outside the intentional paired-O contact seam.

- [ ] **Step 3: Add pacing-map tests**

Expect these future interfaces:

```ts
type RibbonPacingAnchor = { scrollLocalY: number; pathLength: number; id: string };
buildRibbonPacingAnchors(args: {
  lookup: PathLookup;
  markers: Record<RibbonMarkerId, RibbonPoint>;
  stops: BuiltJourneyPath['stops'];
  viewportHeight: number;
}): RibbonPacingAnchor[];
resolvePacedLength(anchors: readonly RibbonPacingAnchor[], scrollLocalY: number): number;
```

Assert strictly increasing scroll positions/path lengths and minimum budgets:

```js
assert.ok(scrollBudget('q1Approach', 'q1WrapExit') >= viewportHeight * 0.52);
assert.ok(scrollBudget('q3Approach', 'q3SecondLoopComplete') >= viewportHeight * 0.42);
assert.ok(scrollBudget('reassuranceApproach', 'reassuranceLoopComplete') >= viewportHeight * 0.48);
assert.ok(scrollBudget('q1WrapExit', 'q2BendExit') <= viewportHeight * 0.36);
```

- [ ] **Step 4: Add early-trigger and stroke-synchronization contracts**

Require `BuiltJourneyStop` to expose `revealViewportRatio`, with Q1/Q2/Q3 `0.76` and reassurance `0.82`. Require `RibbonTrail.tsx` to render `data-ribbon-stroke="base"` and `data-ribbon-stroke="highlight"` for both front and back layers using the same `d`.

- [ ] **Step 5: Add a dependency-free CDP capture script**

Adapt the proven `/tmp` CDP capture approach into `scripts/capture-journey-qa.mjs`. It must:

1. connect to an explicit WebSocket target;
2. enter the main experience;
3. capture each beat at approach/trigger/mid/final positions;
4. emit JSON containing scroll Y, stop rectangles, reveal state, ribbon dash offsets, and screenshot filenames;
5. support the three required viewport sizes without external packages.

- [ ] **Step 6: Run RED and save baseline captures**

Run:

```bash
node --import=tsx --test \
  tests/journey-artwork-integration.test.mjs \
  tests/ribbon-loop-regression.test.mjs \
  tests/ribbon-curve-continuity.test.mjs \
  tests/ribbon-pacing.test.mjs
```

Expected: failures identify missing exact line groups, semantic curve builder, pacing map, early ratios, and highlight strokes. Existing loop safety assertions continue passing.

Capture the current implementation to `/tmp/weberaise-redesign-baseline-1440x900`, `/tmp/weberaise-redesign-baseline-1280x720`, and `/tmp/weberaise-redesign-baseline-390x844`; do not overwrite the August 13 baseline.

- [ ] **Step 7: Commit the contract phase**

```bash
git add tests/journey-artwork-integration.test.mjs tests/ribbon-loop-regression.test.mjs \
  tests/ribbon-curve-continuity.test.mjs tests/ribbon-pacing.test.mjs scripts/capture-journey-qa.mjs
git commit -m "test: lock smooth journey redesign contracts"
```

---

### Task 2: Rebuild Q1 Against the Master and Strengthen Q1/Q2 Layout

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/artwork/Q1ArtworkScene.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/artwork/Q2ArtworkScene.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Modify: `tests/journey-artwork-integration.test.mjs`

**Interfaces:**
- Q1/Q2 scene roots expose `data-artwork-reference`.
- Final layer transforms live in CSS custom properties so entrance motion can compose without replacing registration transforms.

- [ ] **Step 1: Separate final registration from entrance motion**

Change each scene layer to use a positioned wrapper and an inner image. The wrapper owns master registration; the inner image owns reveal motion:

```tsx
<span className={`${styles.artworkPlacement} ${className}`} data-artwork-layer={name}>
  <Image className={styles.artworkImage} ... />
</span>
```

This prevents animation transforms from shifting the carefully registered final coordinates.

- [ ] **Step 2: Add Q1/Q2 reference hooks**

```tsx
<div className={`${styles.artworkScene} ${styles.q1Scene}`} data-artwork-scene="q1" data-artwork-reference="q1-master">
```

Use the same pattern for `q2-master`.

- [ ] **Step 3: Register Q1 in a normalized master coordinate system**

Use the Q1 scene itself as a `100 × 100` coordinate plane. Start with these master-relative boxes and adjust only when the overlay measurement proves an error:

```css
.q1Island       { left: 8%;  top: 48%; width: 84%; }
.q1Storefront   { left: 29%; top: 25%; width: 45%; }
.q1Nav          { left: 4%;  top: 4%;  width: 43%; }
.q1ImageCard    { left: 4%;  top: 22%; width: 41%; }
.q1Cta          { left: 5%;  top: 54%; width: 20%; }
.q1BrowserLarge { right: 1%; top: 4%;  width: 39%; }
.q1BrowserSmall { right: 0%; top: 40%; width: 24%; }
```

Remove decorative rotations that are absent from the master. Use the supplied master overlay to verify:

- storefront footprint center is within `2%` of the platform upper-slab center;
- storefront bottom is within `3%` of the slab contact line;
- each surrounding layer center is within `4%` of its normalized master center;
- no layer is clipped.

- [ ] **Step 4: Increase and reposition the Q1 beat**

Add beat-specific classes rather than changing all questions globally:

```css
.journeyBeatQ1 {
  grid-template-columns: minmax(0, .88fr) minmax(430px, 1.12fr);
  gap: clamp(42px, 5.5vw, 92px);
}
.journeyBeatQ1 .journeyQuestion { font-size: clamp(52px, 6.05vw, 106px); }
.journeyBeatQ1 .journeyArtwork { width: 118%; transform: translateX(7%); }
```

At `1280×720`, cap the artwork width so the rightmost visible pixel stays at least `24px` inside the viewport.

- [ ] **Step 5: Strengthen and left-bias Q2**

Preserve the successful final layer assembly while enlarging the whole scene and moving it left:

```css
.journeyBeatQ2 {
  grid-template-columns: minmax(430px, 1.1fr) minmax(0, .9fr);
  gap: clamp(42px, 5.5vw, 92px);
}
.journeyBeatQ2 .journeyQuestion { font-size: clamp(50px, 5.9vw, 102px); }
.journeyBeatQ2 .journeyArtwork { width: 114%; transform: translateX(-8%); }
```

Q2 final shell/content alignment must remain within the current master-like resting geometry; only scene scale/placement changes here.

- [ ] **Step 6: Add mobile final-layout overrides**

At `≤720px`, remove desktop transforms from the beat container and use:

```css
.journeyBeatQ1 .journeyArtwork,
.journeyBeatQ2 .journeyArtwork { width: min(94vw, 540px); }
.journeyBeatQ1 .journeyArtwork { transform: translateX(3vw); }
.journeyBeatQ2 .journeyArtwork { transform: translateX(-3vw); }
```

Keep Q1 master registration unchanged inside the responsively scaled scene.

- [ ] **Step 7: Run static composition QA before motion or ribbon edits**

Force anchors to `data-revealed="true"` and capture Q1/Q2 at all required viewports. Produce a Q1 side-by-side montage with the supplied master:

```bash
magick /tmp/weberaise-artwork-handoff.B529bT/assets/Q1/master_reference.png \
  /tmp/weberaise-redesign-static/q1-1440x900.png +append \
  /tmp/weberaise-redesign-static/q1-master-comparison.png
```

Do not proceed until the registration tolerances in Step 3 and viewport-edge constraints pass.

- [ ] **Step 8: Run focused tests and commit**

```bash
node --import=tsx --test tests/journey-artwork-integration.test.mjs tests/post-explore-narrative.test.mjs
npm run typecheck
git add src/components/MainSite/PostExploreNarrative/artwork/ArtworkLayer.tsx \
  src/components/MainSite/PostExploreNarrative/artwork/Q1ArtworkScene.tsx \
  src/components/MainSite/PostExploreNarrative/artwork/Q2ArtworkScene.tsx \
  src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css \
  tests/journey-artwork-integration.test.mjs
git commit -m "feat: refine journey artwork composition"
```

---

### Task 3: Replace Q3 Artwork with Centered Typography and Lock Reassurance Lines

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/JourneyArtwork.tsx`
- Delete: `src/components/MainSite/PostExploreNarrative/artwork/Q3ArtworkScene.tsx`
- Delete: `public/artwork/journey/display/Q3/*.png`
- Delete: `public/artwork/journey/source/Q3/*.png`
- Modify: `public/artwork/journey/ASSET_MANIFEST.json`
- Modify: `src/components/MainSite/PostExploreNarrative/ShutterText.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Modify: `tests/journey-artwork-integration.test.mjs`
- Modify: `tests/shutter-text.test.mjs`

**Interfaces:**
- `LookQuestion()` renders exact line groups and measurable O glyphs.
- `ShutterText({ lines, active })` renders explicit non-wrapping line groups while maintaining one continuous character stagger index.

- [ ] **Step 1: Replace free-text parsing with an explicit Q3 lockup**

Implement:

```tsx
function LookQuestion() {
  return (
    <>
      <span className={styles.q3Line} data-q3-line="lead">
        Need to <span className={styles.lookWord}>L<span data-ribbon-glyph="look-o-1">O</span><span data-ribbon-glyph="look-o-2">O</span>K</span>
      </span>
      <span className={styles.q3Line} data-q3-line="finish">better online?</span>
    </>
  );
}
```

Do not derive the two-line arrangement from browser wrapping.

- [ ] **Step 2: Make Q3 a typography-only stop**

Replace the Q3 beat with:

```tsx
<JourneyStop id="q3" align="center">
  <div className={styles.journeyBeatQ3}>
    <h2 className={`${styles.journeyQuestion} ${styles.journeyQuestionQ3}`} data-journey-question>
      <LookQuestion />
    </h2>
  </div>
</JourneyStop>
```

Remove the Q3 dispatcher branch and delete unused served Q3 assets/component. Update the manifest to Q1/Q2 only.

- [ ] **Step 3: Add exact centered Q3 sizing**

```css
.journeyBeatQ3 { display: grid; place-items: center; width: 100%; }
.journeyQuestionQ3 {
  width: min(94vw, 1380px);
  font-size: clamp(76px, 8.4vw, 144px);
  line-height: .86;
  text-align: center;
}
.q3Line { display: block; white-space: nowrap; }
.lookWord { display: inline-block; white-space: nowrap; }
```

At `≤720px`, use `font-size: clamp(42px, 11.7vw, 64px)` and `width: 96vw`; both explicit lines must fit without clipping.

- [ ] **Step 4: Extend ShutterText to explicit lines**

Use:

```ts
type ShutterTextProps = { lines: readonly string[]; active: boolean };
```

Flatten characters only for stagger timing, but render line wrappers:

```tsx
{lines.map((line, lineIndex) => (
  <span className={styles.shutterLine} data-reassurance-line={lineIndex === 0 ? 'one' : 'two'}>
    {renderCharacters(line, priorCharacterCount)}
  </span>
))}
```

Call it with `lines={['DONT WORRY.', 'WE GOT YOU']}`. Apply `display:block; white-space:nowrap` to `.shutterLine`.

- [ ] **Step 5: Add responsive reassurance sizing**

Use container-query-independent CSS that fits both lines at 390px:

```css
.reassuranceHeading { width: min(94vw, 1500px); }
.shutterLine { display: block; white-space: nowrap; }
@media (max-width: 720px) {
  .reassuranceHeading { width: calc(100vw - 28px); font-size: clamp(25px, 7.45vw, 34px); }
}
```

- [ ] **Step 6: Run typography browser QA and tests**

At every required viewport, assert by DOM measurement that each Q3/reassurance line has one client rect and remains within the viewport. Capture Q3 with no artwork and reassurance before/after reveal.

```bash
node --import=tsx --test tests/journey-artwork-integration.test.mjs tests/shutter-text.test.mjs
npm run typecheck
```

- [ ] **Step 7: Commit the typography phase**

Stage the explicit files and deleted Q3 assets, then:

```bash
git commit -m "feat: center Q3 typography journey beat"
```

---

### Task 4: Move Q1/Q2/Q3 and Reassurance Reveals Earlier and Clarify Motion

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/ribbonController.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Modify: `tests/journey-artwork-integration.test.mjs`
- Modify: `tests/ribbon-trail-integration.test.mjs`

**Interfaces:**
- `BuiltJourneyStop = { localY; revealLocalY; revealViewportRatio; bandBias }`.
- Controller triggers reveal using the stop's explicit viewport ratio, independent of old ribbon-head Y approximation.

- [ ] **Step 1: Add early viewport ratios to built stops**

```ts
export type BuiltJourneyStop = {
  localY: number;
  revealLocalY: number;
  revealViewportRatio: number;
  bandBias: number;
};
```

Set Q1/Q2/Q3 to `0.76` and reassurance to `0.82`. Use stop/text top as `revealLocalY`, not a late center-derived position.

- [ ] **Step 2: Trigger from viewport position**

Replace `latestTargetDocumentY` comparison with:

```ts
const revealDocumentY = window.scrollY + viewportHeight * stop.revealViewportRatio;
if (revealDocumentY < rootDocumentTop + stop.revealLocalY) continue;
```

Pass `viewportHeight` into `revealReachedStops`. Keep the revealed set one-way.

- [ ] **Step 3: Make Q1 assembly clearly grouped**

Use inner-image motion with `1.15–1.35s` transitions and these delays:

- platform `0ms`;
- storefront `120ms`;
- nav/image `240ms`;
- large browser `350ms`;
- CTA/small browser `460ms`.

Use initial travel between `24px` and `42px`, opacity `0`, and scale no smaller than `.94`. Final transforms on placement wrappers never change.

- [ ] **Step 4: Make Q2 resolution clearly grouped**

Keep shell visible at trigger. Increase initial fragment displacement to `32–54px` and rotation to at most `7deg`. Use four overlapping groups at `0ms`, `140ms`, `280ms`, and `420ms`, duration `1.15s`, `cubic-bezier(.22,.61,.36,1)`. The final layout must remain exactly the Phase 2 resting state.

- [ ] **Step 5: Keep Q3 motion typographic and restrained**

Reveal the centered two-line heading as one focal unit through the existing question reveal (`translateY(24px) → 0`, opacity `0 → 1`). Do not animate individual Q3 characters apart from the ribbon tracing the O glyphs.

- [ ] **Step 6: Verify early attention timing**

At each viewport, capture the first revealed frame and assert:

- stop/text top is between `68%` and `82%` of viewport height;
- at least `55%` of the beat remains below the viewport midpoint when reveal starts;
- reassurance begins before its top reaches center;
- reverse scroll does not reset completed Q1/Q2 motion or ShutterText.

- [ ] **Step 7: Run tests and commit**

```bash
node --import=tsx --test tests/journey-artwork-integration.test.mjs tests/ribbon-trail-integration.test.mjs tests/shutter-text.test.mjs
npm run typecheck
git add src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts \
  src/components/MainSite/PostExploreNarrative/ribbonController.ts \
  src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css \
  tests/journey-artwork-integration.test.mjs tests/ribbon-trail-integration.test.mjs
git commit -m "feat: advance journey reveal timing"
```

---

### Task 5: Replace Dense Point Smoothing with Semantic Cubic Curves

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/ribbonCurveBuilder.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/journeyRoute.ts`
- Modify: `tests/ribbon-curve-continuity.test.mjs`
- Modify: `tests/ribbon-loop-regression.test.mjs`
- Modify: `tests/ribbon-route-geometry.test.mjs`
- Modify: `tests/ribbon-smoothness-regression.test.mjs`

**Interfaces:**
- `RibbonCurveBuilder` owns one ordered segment list and semantic marker map.
- `buildJourneyPath` returns `segments`, `markers`, and `d` from the same builder.

- [ ] **Step 1: Implement the cubic builder**

```ts
export type RibbonMarkerId =
  | 'openingExit' | 'q1Approach' | 'q1WrapFront' | 'q1WrapBack' | 'q1WrapExit'
  | 'q2BendExit' | 'q3Approach' | 'q3FirstLoopComplete' | 'q3SecondLoopComplete'
  | 'reassuranceApproach' | 'reassuranceLoopComplete' | 'taperEnd';

export class RibbonCurveBuilder {
  readonly segments: RibbonCurveSegment[] = [];
  readonly markers = {} as Record<RibbonMarkerId, RibbonPoint>;
  constructor(private current: RibbonPoint) {}
  cubic(id: string, control1: RibbonPoint, control2: RibbonPoint, end: RibbonPoint) {
    if (Math.hypot(control1.x - this.current.x, control1.y - this.current.y) < 0.01) {
      throw new Error(`Ribbon segment ${id} has a zero-length entry handle`);
    }
    if (Math.hypot(end.x - control2.x, end.y - control2.y) < 0.01) {
      throw new Error(`Ribbon segment ${id} has a zero-length exit handle`);
    }
    this.segments.push({ id, start: { ...this.current }, control1, control2, end });
    this.current = { ...end };
    return this;
  }
  mark(id: RibbonMarkerId) {
    this.markers[id] = { ...this.current };
    return this;
  }
  toPathD() {
    const first = this.segments[0]?.start ?? this.current;
    return [
      `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`,
      ...this.segments.map(({ control1, control2, end }) =>
        `C ${control1.x.toFixed(2)} ${control1.y.toFixed(2)} ${control2.x.toFixed(2)} ${control2.y.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`),
    ].join(' ');
  }
}
```

Reject zero-length handles in development/tests.

- [ ] **Step 2: Add tangent-preserving helpers**

Implement helpers that calculate the next entry handle from the previous exit direction:

```ts
function tangentHandle(point: RibbonPoint, direction: RibbonPoint, distance: number): RibbonPoint;
function ellipseCubics(center: RibbonPoint, rx: number, ry: number, startAngle: number, sweep: number): RibbonCurveSegment[];
```

Use the standard cubic ellipse constant `0.5522847498` for quarter arcs, then apply restrained asymmetry through radius/center offsets rather than random point perturbation.

- [ ] **Step 3: Rebuild opening and Q1**

Use four cubic arcs for the opening oval and one long tangent departure. Q1 uses:

1. long approach cubic;
2. upper/front cubic;
3. right/back cubic;
4. lower/front cubic;
5. long exit cubic.

Expose markers at the approach, front, back, and exit boundaries. Q1 front clip windows still mask the same canonical route.

- [ ] **Step 4: Rebuild Q2 as one calm gesture**

Use two long cubics sharing a tangent through the artwork/text corridor. X direction must remain monotonic from Q1's right-side exit toward Q3's centered approach. Remove the existing nine-point `appendGentleBend` sampling.

- [ ] **Step 5: Rebuild the centered paired-O route**

Measure the new uppercase O rectangles. Enter from upper-left, use four cubics per O, share the inner seam without a horizontal bridge, and exit on a downward-right tangent. Apply route config offsets:

```ts
q3: {
  glyphScaleX: 1.14,
  glyphScaleY: 1.08,
  offsetX: -0.03,
  offsetY: 0.02,
  approachClearance: 0.72,
}
```

Fractional offsets/clearance multiply glyph dimensions.

- [ ] **Step 6: Rebuild reassurance and taper departure**

Use four asymmetric cubic arcs around the measured two-line block. Continue from the loop on its actual tangent, then begin the existing taper after one short cubic descent. No vertical duplicate segment at the loop seam.

- [ ] **Step 7: Remove obsolete generic smoothing from production route generation**

`smoothRibbonPath` may remain temporarily for unrelated tests, but `buildJourneyPath` must use `RibbonCurveBuilder.toPathD()` exclusively. Dense point primitives must no longer construct the production centerline.

- [ ] **Step 8: Run geometry suites and static full-path QA**

```bash
node --import=tsx --test \
  tests/ribbon-curve-continuity.test.mjs \
  tests/ribbon-loop-regression.test.mjs \
  tests/ribbon-route-geometry.test.mjs \
  tests/ribbon-smoothness-regression.test.mjs \
  tests/ribbon-primitives.test.mjs \
  tests/ribbon-reassurance-end.test.mjs
```

Force the entire path visible and capture all three viewports. Reject any visible knee even if the numerical threshold passes.

- [ ] **Step 9: Commit the geometry phase**

```bash
git add src/components/MainSite/PostExploreNarrative/ribbonCurveBuilder.ts \
  src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts \
  src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts \
  src/components/MainSite/PostExploreNarrative/journeyRoute.ts \
  tests/ribbon-curve-continuity.test.mjs tests/ribbon-loop-regression.test.mjs \
  tests/ribbon-route-geometry.test.mjs tests/ribbon-smoothness-regression.test.mjs
git commit -m "refactor: author ribbon as smooth semantic curves"
```

---

### Task 6: Add Semantic Arc-Length Pacing and Smooth Scroll Scrub

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/pathLookup.ts`
- Create: `src/components/MainSite/PostExploreNarrative/ribbonPacing.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/ribbonController.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx`
- Modify: `tests/ribbon-pacing.test.mjs`
- Modify: `tests/path-lookup-loop.test.mjs`
- Modify: `tests/ribbon-trail-integration.test.mjs`

**Interfaces:**
- Path samples expose local X/Y as well as length/document Y.
- Marker resolution is ordered along path length.
- Controller uses `resolvePacedLength`, not `resolveLengthForDocumentY`, for post-opening draw progress.

- [ ] **Step 1: Extend path samples**

```ts
export type PathSample = {
  length: number;
  localX: number;
  localY: number;
  documentY: number;
};
```

Retain `resolveLengthForDocumentY` only for compatibility/taper calculations.

- [ ] **Step 2: Resolve semantic markers to ordered arc lengths**

Implement:

```ts
export function resolveMarkerLengths(
  lookup: PathLookup,
  orderedMarkers: readonly { id: RibbonMarkerId; point: RibbonPoint }[],
): Record<RibbonMarkerId, number>;
```

For each marker, find the nearest sample after the previously resolved length. This prevents the two adjacent O seams from resolving to an earlier loop.

- [ ] **Step 3: Build explicit pacing anchors**

Use the budgets from the spec and Task 1. Anchor scroll positions relative to actual stop geometry:

```ts
const budgets = {
  q1Wrap: viewportHeight * 0.55,
  q2Travel: viewportHeight * 0.32,
  q3Loops: viewportHeight * 0.44,
  reassuranceLoop: viewportHeight * 0.50,
};
```

Use these exact offsets from each interaction's first anchor:

```ts
const q1Offsets = {
  q1Approach: 0,
  q1WrapFront: viewportHeight * 0.16,
  q1WrapBack: viewportHeight * 0.34,
  q1WrapExit: viewportHeight * 0.55,
};
const q3Offsets = {
  q3Approach: 0,
  q3FirstLoopComplete: viewportHeight * 0.22,
  q3SecondLoopComplete: viewportHeight * 0.44,
};
const reassuranceOffsets = {
  reassuranceApproach: 0,
  reassuranceLoopComplete: viewportHeight * 0.50,
};
```

Place `q2BendExit` exactly `0.32 × viewportHeight` after `q1WrapExit`; use the remaining real stop-to-stop scroll distance before Q3 as open transition budget. If two authored anchors would overlap after real layout measurement, shift the later interaction and all following anchors downward together—never reduce an interaction's minimum budget. Return strictly monotonic anchors.

- [ ] **Step 4: Interpolate paced length**

Use binary search between anchors and cubic smoothstep interpolation only at segment boundaries:

```ts
export function resolvePacedLength(anchors: readonly RibbonPacingAnchor[], scrollLocalY: number) {
  const [lower, upper] = surroundingAnchors(anchors, scrollLocalY);
  const t = clamp((scrollLocalY - lower.scrollLocalY) / (upper.scrollLocalY - lower.scrollLocalY), 0, 1);
  const eased = t * t * (3 - 2 * t);
  return lerp(lower.pathLength, upper.pathLength, eased);
}
```

- [ ] **Step 5: Add short overwrite scrub**

Maintain `{ visibleLength }` and update through one GSAP quick/overwrite tween:

```ts
const scrubSeconds = window.innerWidth <= 720 ? 0.14 : 0.18;
gsap.to(drawState, {
  visibleLength: targetLength,
  duration: reducedMotion ? 0 : scrubSeconds,
  ease: 'power1.out',
  overwrite: true,
  onUpdate: () => setVisibleLength(drawState.visibleLength),
});
```

Kill the active scrub during cleanup. Reverse scrolling must target the lower mapped length immediately through the same mechanism.

- [ ] **Step 6: Test normal and accelerated input**

Drive Chromium with wheel-equivalent scroll increments:

- normal: `36–72px` every `50ms`;
- accelerated: `140–220px` every `50ms`.

Record dash offset each frame. Require at least eight distinct visible-progress samples through Q1's wrap and at least six through the paired O loops under normal input. No ordinary frame may consume more than `28%` of an interaction's arc length.

- [ ] **Step 7: Run pacing and regression suites**

```bash
node --import=tsx --test tests/ribbon-pacing.test.mjs tests/path-lookup-loop.test.mjs tests/ribbon-trail-integration.test.mjs
npm run typecheck
```

- [ ] **Step 8: Commit the pacing phase**

```bash
git add src/components/MainSite/PostExploreNarrative/pathLookup.ts \
  src/components/MainSite/PostExploreNarrative/ribbonPacing.ts \
  src/components/MainSite/PostExploreNarrative/ribbonController.ts \
  src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx \
  tests/ribbon-pacing.test.mjs tests/path-lookup-loop.test.mjs tests/ribbon-trail-integration.test.mjs
git commit -m "feat: pace ribbon interactions by arc length"
```

---

### Task 7: Add Dimensional Gradient, Highlight, Depth, and Final Taper Finish

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/RibbonTrail.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Modify: `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx`
- Modify: `tests/ribbon-art-direction.test.mjs`
- Modify: `tests/ribbon-trail-integration.test.mjs`
- Modify: `tests/ribbon-reassurance-end.test.mjs`

**Interfaces:**
- Each layer exposes a base and highlight path ref.
- Controller receives every draw path and applies identical dash array/offset.

- [ ] **Step 1: Render synchronized base and highlight paths**

Inside both front/back SVG layers render:

```tsx
<path className={`${styles.ribbonPath} ${styles.ribbonPathBase}`} data-ribbon-stroke="base" d={d} ... />
<path className={`${styles.ribbonPath} ${styles.ribbonPathHighlight}`} data-ribbon-stroke="highlight" d={d} ... />
```

Both use the same clip path on their layer. Pass all four path refs to `drawPaths`.

- [ ] **Step 2: Replace the flat gradient**

Use exact stops:

```tsx
<stop offset="0%" stopColor="#1D4ED8" />
<stop offset="34%" stopColor="#3B82F6" />
<stop offset="56%" stopColor="#93C5FD" />
<stop offset="72%" stopColor="#60A5FA" />
<stop offset="100%" stopColor="#2563EB" />
```

The highlight gradient uses transparent pale blue at both ends and `#DBEAFE` at its middle. Do not animate gradient coordinates.

- [ ] **Step 3: Apply restrained dimensional styling**

```css
.ribbonPathBase {
  stroke-width: var(--ribbon-width);
  filter: drop-shadow(0 0 7px rgb(59 130 246 / .22));
}
.ribbonPathHighlight {
  stroke-width: max(1.15px, calc(var(--ribbon-width) * .28));
  opacity: .62;
  filter: drop-shadow(0 0 2px rgb(219 234 254 / .28));
}
```

Keep `round` caps/joins. Mobile highlight opacity is `.52` and glow radius is reduced.

- [ ] **Step 4: Retune Q1 front clips against the registered scene**

Capture Q1 markers at front/back/front phases. Define clip rectangles from the platform/storefront/surrounding layer bounds so:

- upper approach is briefly in front;
- middle/right arc disappears behind the intended artwork plane;
- lower arc returns in front;
- both base and highlight switch depth together.

- [ ] **Step 5: Finish reassurance taper**

Use the same base gradient on the taper polygon and a narrow masked highlight taper. Verify width resolves continuously from full to zero with no blunt endpoint or detached highlight dot.

- [ ] **Step 6: Run styling/synchronization tests and captures**

```bash
node --import=tsx --test \
  tests/ribbon-art-direction.test.mjs \
  tests/ribbon-trail-integration.test.mjs \
  tests/ribbon-reassurance-end.test.mjs
npm run typecheck
```

Inspect high-resolution screenshots at 200% crop around every curve join, Q1 depth transition, paired O loops, and taper endpoint.

- [ ] **Step 7: Commit the finish phase**

```bash
git add src/components/MainSite/PostExploreNarrative/RibbonTrail.tsx \
  src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css \
  src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx \
  tests/ribbon-art-direction.test.mjs tests/ribbon-trail-integration.test.mjs \
  tests/ribbon-reassurance-end.test.mjs
git commit -m "feat: finish ribbon with dimensional gradient"
```

---

### Task 8: Full Browser Acceptance, Regression Verification, and Safe Handoff

**Files:**
- Modify only files for defects demonstrated by Phase 7 evidence.

**Interfaces:**
- Produces final screenshot/JSON evidence under `/tmp/weberaise-redesign-final-*`.
- Leaves PR #1 untouched and reports local branch SHA/dirty-file separation.

- [ ] **Step 1: Run every focused journey suite**

```bash
node --import=tsx --test \
  tests/journey-artwork-integration.test.mjs \
  tests/post-explore-narrative.test.mjs \
  tests/ribbon-art-direction.test.mjs \
  tests/ribbon-curve-continuity.test.mjs \
  tests/ribbon-loop-regression.test.mjs \
  tests/ribbon-pacing.test.mjs \
  tests/ribbon-primitives.test.mjs \
  tests/ribbon-reassurance-end.test.mjs \
  tests/ribbon-route-geometry.test.mjs \
  tests/ribbon-smoothness-regression.test.mjs \
  tests/ribbon-trail-integration.test.mjs \
  tests/path-lookup-loop.test.mjs \
  tests/shutter-text.test.mjs
```

Expected: zero focused failures.

- [ ] **Step 2: Run full project verification**

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Compare `npm test` assertion-level output with the recorded nine baseline failures. Do not report the suite as green unless every assertion passes.

- [ ] **Step 3: Capture all acceptance checkpoints**

At `1440×900`, `1280×720`, and `390×844`, capture:

- Q1 approach, platform, storefront settle, fragments mid, final, and all three depth phases;
- Q2 shell, group two, group three, final, and calm ribbon bend;
- Q3 before reveal, first-O midpoint, first loop complete, second-O midpoint, second loop complete, and exit;
- reassurance below-center trigger, shutter midpoint, oval midpoint, final phrase/oval, and taper endpoint;
- reverse-scroll persistence;
- reduced-motion final states.

- [ ] **Step 4: Validate DOM geometry numerically**

Require:

- Q1/Q2 artwork remains inside viewport with at least `14px` mobile and `24px` desktop clearance;
- Q3 line client rect count equals `2` and each rect is inside viewport;
- reassurance line client rect count equals `2`; `WE GOT YOU` has no internal line break;
- Q1 storefront/platform contact tolerances still pass;
- no ribbon path/highlight dash-offset difference exceeds `0.1px`;
- marker/pacing order remains monotonic after real font/image measurement.

- [ ] **Step 5: Inspect git scope**

```bash
git status --short --branch
git diff --name-only 4a0efca2b3044dc8cd27d84f48ed4185338d32fa..HEAD
git diff --check 4a0efca2b3044dc8cd27d84f48ed4185338d32fa..HEAD
```

Ensure unrelated generated/dirty files are not staged or committed.

- [ ] **Step 6: Commit only evidence-backed final corrections**

If browser acceptance required corrections, group them into one final commit:

```bash
git commit -m "fix: polish responsive journey choreography"
```

Do not create an empty final commit.

- [ ] **Step 7: Confirm PR #1 read-only state**

Read PR metadata and confirm `merged: false`. Do not push, merge, close, comment, relabel, or update the PR without a new explicit user request.

- [ ] **Step 8: Report handoff evidence**

Report:

- exact changed files and design outcomes;
- focused/full test results, typecheck, and build;
- screenshot directories and representative files;
- any remaining baseline failures or visual compromises;
- commit list and final SHA;
- branch ahead/behind state;
- confirmation that unrelated dirty files remain untouched;
- confirmation that PR #1 remains unmerged.

## Completion Gate

The redesign is complete only when Q1 visually matches its supplied master registration, Q1/Q2 hierarchy is stronger, Q3 contains no artwork and uses the exact centered two-line lockup, reassurance never breaks a word/character onto another line, reveals begin before center, the ribbon centerline has no visible sharp join, Q1/O/reassurance loops receive perceptible scroll budget, base/highlight/depth/taper remain synchronized, focused tests are green, typecheck/build pass, all required browser captures are inspected, and PR #1 remains unmerged.
