# Document-Space Ribbon Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sticky post-EXPLORE ribbon scene with a normal-flow document journey whose SVG trail scrolls with the page while its drawing head remains within a soft `45vh–58vh` viewport band and reveals each question once as it approaches.

**Architecture:** The journey becomes a tall normal-flow section containing semantic stops and an absolutely positioned document-space SVG. A pure route builder measures stop rectangles and emits a predominantly downward path; a sampled path lookup resolves document-Y to SVG path length; a controller maps native scroll to dash progress without React state; one-way reveal logic activates questions just before closest ribbon approach. Particle reassurance stays Canvas-based but becomes a normal-flow journey stop.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, GSAP 3.15 / ScrollTrigger, native SVG path APIs, ResizeObserver, MutationObserver, Canvas 2D.

## Global Constraints

- Work only on `feature/signature-intro`; do not merge PR #1.
- Loader, hero, WebGL reveal, EXPLORE bottom-fill, Aurora statement, and GROW ring are out of scope.
- No sticky or fixed journey stage.
- Ribbon head soft band: approximately `45vh–58vh`, nominally around `52vh`.
- Native scrolling must never be intercepted, slowed, or scroll-jacked.
- Questions reveal once, slightly before closest ribbon approach, and never animate out.
- Reverse scroll retracts only the ribbon; already revealed questions stay visible.
- Ribbon must keep deliberate clearance from question typography.
- Path language is predominantly downward with broad horizontal sweeps; no chaotic zig-zags or large upward loops.
- Future path is invisible; travelled path remains blue `#3B82F6`.
- Reassurance particles remain only `#F5F7FA`, interactive, dense, and never convert to solid text.
- No new WebGL context and no new general animation dependency.
- No React state updates per scroll frame.
- Required visual review viewport sizes: `1440×900`, `1280×720`, `390×844`.

---

## File Structure

### Create
- `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx` — normal-flow journey composition and lifecycle gate.
- `src/components/MainSite/PostExploreNarrative/JourneyStop.tsx` — semantic normal-flow question stop.
- `src/components/MainSite/PostExploreNarrative/RibbonTrail.tsx` — document-space SVG renderer only.
- `src/components/MainSite/PostExploreNarrative/journeyRoute.ts` — responsive art-direction constants and stop visit preferences.
- `src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts` — measured stop rectangles → monotonic SVG path string + stop landmarks.
- `src/components/MainSite/PostExploreNarrative/pathLookup.ts` — sampled SVG path lookup and document-Y → path-length resolver.
- `src/components/MainSite/PostExploreNarrative/ribbonController.ts` — auto-opening, native-scroll ribbon progression, center-band drift, resize rebuild, one-way reveal dispatch.
- `src/components/MainSite/PostExploreNarrative/questionReveal.ts` — entrance-only GSAP reveal helper.

### Modify
- `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx` — compose `JourneyNarrative` instead of `TrailNarrative`.
- `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css` — remove sticky/fixed-scene rules; add document-flow stops, SVG overlay, reveal styles, normal-flow reassurance.
- `src/components/MainSite/PostExploreNarrative/ParticleReassurance.tsx` — consume normal-flow activation without changing particle palette/model.
- `tests/post-explore-narrative.test.mjs` — replace old sticky-stage contracts with document-space journey contracts.
- `tests/ribbon-trail-integration.test.mjs` — preserve `main` lifecycle gate and assert new controller behavior.

### Delete after replacement is green
- `src/components/MainSite/PostExploreNarrative/TrailNarrative.tsx`
- `src/components/MainSite/PostExploreNarrative/trailPath.ts`
- `src/components/MainSite/PostExploreNarrative/trailMotion.ts`

---

### Task 1: Define the document-space journey contracts

**Files:**
- Modify: `tests/post-explore-narrative.test.mjs`
- Modify: `tests/ribbon-trail-integration.test.mjs`

**Interfaces:**
- Produces source-level contracts for files/functions implemented in Tasks 2–4.

- [ ] **Step 1: Replace old sticky ribbon tests with failing document-space contracts**

Add assertions that:

```js
for (const file of [
  'JourneyNarrative.tsx',
  'JourneyStop.tsx',
  'RibbonTrail.tsx',
  'journeyRoute.ts',
  'buildJourneyPath.ts',
  'pathLookup.ts',
  'ribbonController.ts',
  'questionReveal.ts',
]) {
  assert.equal(existsSync(resolve(root, featureDir, file)), true, `${file} must exist`);
}

const composition = read(`${featureDir}/PostExploreNarrative.tsx`);
assert.match(composition, /JourneyNarrative/);
assert.doesNotMatch(composition, /TrailNarrative/);

const css = read(`${featureDir}/PostExploreNarrative.module.css`);
assert.doesNotMatch(css, /\.trailStage\s*\{[^}]*position:\s*sticky/s);
assert.doesNotMatch(css, /\.trailQuestion(?:One|Two|Three)/);
assert.match(css, /\.journeyStop/);
assert.match(css, /\.ribbonSvg/);

const controller = read(`${featureDir}/ribbonController.ts`);
assert.match(controller, /0\.45/);
assert.match(controller, /0\.58/);
assert.match(controller, /0\.52/);
assert.match(controller, /strokeDashoffset/);
assert.match(controller, /Math\.max\([^\n]*opening/);

const lookup = read(`${featureDir}/pathLookup.ts`);
assert.match(lookup, /getPointAtLength\(/);
assert.match(lookup, /binary/i);

const builder = read(`${featureDir}/buildJourneyPath.ts`);
assert.match(builder, /getBoundingClientRect\(/);
assert.match(builder, /clearance/);
```

Update the lifecycle integration test to read `JourneyNarrative.tsx` and assert the existing `data-experience-state` + `MutationObserver` + `main` gate remain.

- [ ] **Step 2: Run focused tests and verify RED**

Run locally if the repository is available:

```bash
node --test tests/post-explore-narrative.test.mjs tests/ribbon-trail-integration.test.mjs
```

Expected: FAIL because `JourneyNarrative.tsx` and the new controller/path files do not exist and the current CSS still contains the sticky stage.

If the full checkout is unavailable in the execution harness, mirror these two tests plus the relevant current source files into a temporary local fixture and run the same Node test command against that fixture before production edits.

- [ ] **Step 3: Commit the red contracts**

```bash
git add tests/post-explore-narrative.test.mjs tests/ribbon-trail-integration.test.mjs
git commit -m "test: define document-space ribbon journey contracts"
```

---

### Task 2: Build measured route geometry and path lookup

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/journeyRoute.ts`
- Create: `src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts`
- Create: `src/components/MainSite/PostExploreNarrative/pathLookup.ts`
- Create: `src/components/MainSite/PostExploreNarrative/RibbonTrail.tsx`

**Interfaces:**
- `getJourneyRoute(viewportWidth: number): JourneyRouteConfig`
- `buildJourneyPath(root: HTMLElement, config: JourneyRouteConfig): BuiltJourneyPath`
- `buildPathLookup(path: SVGPathElement, svg: SVGSVGElement, journeyTop: number): PathLookup`
- `resolveLengthForDocumentY(lookup: PathLookup, targetDocumentY: number): number`
- `RibbonTrail` renders one SVG path with `data-ribbon-path`.

- [ ] **Step 1: Implement route configuration types and constants**

Use:

```ts
export type JourneyStopId = 'q1' | 'q2' | 'q3' | 'reassurance';

export type JourneyVisit = {
  id: JourneyStopId;
  side: 'left' | 'right';
  clearance: number;
  approachLead: number;
  bandBias: number;
};

export type JourneyRouteConfig = {
  edgeInset: number;
  openingLength: number;
  sampleSpacing: number;
  visits: readonly JourneyVisit[];
};
```

Desktop target clearances: `96, 108, 96, 88`. Mobile target clearances: `40, 44, 40, 36`. Keep `bandBias` bounded so the controller remains inside `45vh–58vh`.

- [ ] **Step 2: Implement the measured path builder**

`buildJourneyPath` must:

1. measure `[data-journey-stop]` elements with `getBoundingClientRect()`;
2. convert viewport rectangles to journey-local coordinates using the journey root rectangle;
3. create a top-left opening point;
4. create one approach/pass/depart triplet per stop with the configured clearance;
5. keep generated Y values non-decreasing;
6. emit a smooth cubic `d` string;
7. return stop landmark Y values used by reveal logic.

Return:

```ts
export type BuiltJourneyPath = {
  d: string;
  width: number;
  height: number;
  openingLocalY: number;
  stops: Record<JourneyStopId, { localY: number; revealLocalY: number }>;
};
```

- [ ] **Step 3: Implement sampled path lookup**

Use roughly one sample every `10–16px` of SVG path length, preserving only non-decreasing document-Y samples.

```ts
export type PathSample = {
  length: number;
  documentY: number;
};

export type PathLookup = {
  totalLength: number;
  samples: readonly PathSample[];
};
```

`resolveLengthForDocumentY` must use a lower-bound binary search and interpolate between neighboring samples.

- [ ] **Step 4: Implement SVG-only `RibbonTrail`**

Render:

```tsx
<svg className={styles.ribbonSvg} aria-hidden="true" data-ribbon-svg>
  <path className={styles.ribbonPath} data-ribbon-path d={pathD} />
</svg>
```

The SVG must be positioned against the entire journey section and must not be sticky/fixed.

- [ ] **Step 5: Run focused tests and verify geometry contracts turn GREEN**

Run:

```bash
node --test tests/post-explore-narrative.test.mjs
```

Expected: geometry/path-file assertions pass; composition/controller assertions may still fail until later tasks.

- [ ] **Step 6: Commit geometry unit**

```bash
git add src/components/MainSite/PostExploreNarrative/journeyRoute.ts \
  src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts \
  src/components/MainSite/PostExploreNarrative/pathLookup.ts \
  src/components/MainSite/PostExploreNarrative/RibbonTrail.tsx
git commit -m "feat: add measured document-space ribbon geometry"
```

---

### Task 3: Replace sticky composition with normal-flow journey stops

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/JourneyStop.tsx`
- Create: `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Modify: `src/components/MainSite/PostExploreNarrative/ParticleReassurance.tsx`

**Interfaces:**
- `JourneyStop({ id, children, align })` renders a semantic normal-flow stop with `data-journey-stop` and `data-revealed="false"`.
- `JourneyNarrative({ questions, reassurance })` owns root refs, measured path state, controller lifecycle, and reassurance activation.

- [ ] **Step 1: Implement normal-flow stop markup**

Question stops remain `<h2>` content and receive alignment classes instead of absolute `top` coordinates. Initial broad layout:

- Q1 left;
- Q2 right;
- Q3 left;
- reassurance centered.

Use real spacing/min-height on stop wrappers so vertical authored positions come from document layout.

- [ ] **Step 2: Move reassurance into normal flow**

`ParticleReassurance` must live inside the reassurance journey stop. Its containing section must no longer use absolute `top: 68%` or viewport-scene positioning. Preserve existing Canvas pointer interactions and one-color particle behavior.

- [ ] **Step 3: Rewrite CSS around document-space layout**

Required shape:

```css
.journey {
  position: relative;
  min-height: 430svh;
  background: var(--wr-black);
}

.ribbonSvg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.journeyContent {
  position: relative;
  z-index: 2;
}

.journeyStop {
  position: relative;
  display: flex;
  min-height: 92svh;
  align-items: center;
}
```

Use responsive paddings/alignment, not absolute question coordinates. `.ribbonPath` retains rounded blue stroke and dash animation properties.

Delete `.trailStage`, `.trailQuestions`, `.trailQuestionOne/Two/Three`, global question-fade behavior, and absolute reassurance scene placement.

- [ ] **Step 4: Compose `JourneyNarrative` from `PostExploreNarrative`**

Replace the `TrailNarrative` import/use only. Do not modify Aurora/GROW composition.

- [ ] **Step 5: Run source-contract tests**

```bash
node --test tests/post-explore-narrative.test.mjs tests/ribbon-trail-integration.test.mjs
```

Expected: normal-flow and file/composition contracts pass; controller-specific contracts may still fail until Task 4.

- [ ] **Step 6: Commit normal-flow composition**

```bash
git add src/components/MainSite/PostExploreNarrative/JourneyStop.tsx \
  src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx \
  src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx \
  src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css \
  src/components/MainSite/PostExploreNarrative/ParticleReassurance.tsx
git commit -m "feat: move ribbon narrative into normal document flow"
```

---

### Task 4: Implement center-band scroll controller and one-way reveals

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/questionReveal.ts`
- Create: `src/components/MainSite/PostExploreNarrative/ribbonController.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx`
- Modify: `tests/ribbon-trail-integration.test.mjs`

**Interfaces:**
- `revealJourneyStop(element: HTMLElement, reducedMotion: boolean): gsap.core.Tween | null`
- `createRibbonController(options: RibbonControllerOptions): () => void`

Use:

```ts
export type RibbonControllerOptions = {
  root: HTMLElement;
  svg: SVGSVGElement;
  path: SVGPathElement;
  openingLength: number;
  stops: BuiltJourneyPath['stops'];
  reducedMotion: boolean;
  onReveal: (id: JourneyStopId) => void;
};
```

- [ ] **Step 1: Implement entrance-only question reveal helper**

Normal motion:

```ts
gsap.fromTo(
  element,
  { autoAlpha: 0, y: 24 },
  { autoAlpha: 1, y: 0, duration: 0.82, ease: 'power3.out', clearProps: 'transform' },
);
```

If characters are split for stagger, keep it restrained and preserve a semantic whole-string heading. Reduced motion uses opacity only.

- [ ] **Step 2: Implement native-scroll head tracking**

Constants:

```ts
const HEAD_BAND_MIN = 0.45;
const HEAD_BAND_MAX = 0.58;
const HEAD_NOMINAL = 0.52;
```

Per update:

1. calculate root document top;
2. choose desired viewport Y between min/max, with a small smooth stop-proximity bias;
3. compute `targetDocumentY = window.scrollY + window.innerHeight * desiredViewportRatio`;
4. resolve path length through `resolveLengthForDocumentY`;
5. clamp to at least the automatic opening floor and at most total path length;
6. set dash offset directly;
7. reveal stops whose `revealLocalY` has been reached and are absent from an internal `Set`.

Do not use React state per frame.

- [ ] **Step 3: Implement automatic opening and seamless acquisition**

After `experienceState === 'main'`, animate dash progress from `0` to the configured opening floor over about `0.65s`. When native scroll tracking begins, use `Math.max(openingLength, resolvedLength)` so returning to the journey start never retracts below that opening segment.

- [ ] **Step 4: Add rebuild/cleanup behavior**

`JourneyNarrative` should rebuild path geometry + lookup after meaningful resize/orientation changes using a debounced `ResizeObserver`. Clean up RAF/ScrollTrigger/listeners/observer/tweens on unmount.

- [ ] **Step 5: Update integration contracts and run GREEN verification**

Ensure tests assert:

```js
assert.match(controller, /HEAD_BAND_MIN\s*=\s*0\.45/);
assert.match(controller, /HEAD_BAND_MAX\s*=\s*0\.58/);
assert.match(controller, /HEAD_NOMINAL\s*=\s*0\.52/);
assert.match(controller, /resolveLengthForDocumentY/);
assert.match(controller, /revealedStops/);
assert.match(controller, /Math\.max\([^\n]*opening/);
assert.doesNotMatch(controller, /preventDefault\(/);
```

Run:

```bash
node --test tests/post-explore-narrative.test.mjs tests/ribbon-trail-integration.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit controller**

```bash
git add src/components/MainSite/PostExploreNarrative/questionReveal.ts \
  src/components/MainSite/PostExploreNarrative/ribbonController.ts \
  src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx \
  tests/ribbon-trail-integration.test.mjs
git commit -m "feat: track ribbon head through the scrolling journey"
```

---

### Task 5: Remove obsolete sticky ribbon code and verify the complete feature

**Files:**
- Delete: `src/components/MainSite/PostExploreNarrative/TrailNarrative.tsx`
- Delete: `src/components/MainSite/PostExploreNarrative/trailPath.ts`
- Delete: `src/components/MainSite/PostExploreNarrative/trailMotion.ts`
- Modify: `tests/post-explore-narrative.test.mjs`

**Interfaces:**
- The new journey implementation is now the only ribbon system.

- [ ] **Step 1: Delete obsolete files and add absence assertions**

```js
for (const file of ['TrailNarrative.tsx', 'trailPath.ts', 'trailMotion.ts']) {
  assert.equal(existsSync(resolve(root, featureDir, file)), false, `${file} should be removed`);
}
```

- [ ] **Step 2: Run all dependency-light tests**

```bash
npm test
```

Expected: all tests pass with zero failures.

If dependencies are unavailable but the project test suite is dependency-light, run the equivalent Node test command directly. Do not claim the complete suite passes without observed output.

- [ ] **Step 3: Run typecheck and build when dependencies are available**

```bash
npm run typecheck
npm run build
```

Expected: both exit `0`.

- [ ] **Step 4: Perform required browser screenshot QA**

Run the site and capture the journey at:

- `1440×900`
- `1280×720`
- `390×844`

At checkpoints:

1. automatic start after EXPLORE;
2. center-band acquisition;
3. just before Q1;
4. Q1 revealed beside ribbon;
5. Q2 visit;
6. Q3 visit;
7. post-Q3 travel;
8. reassurance endpoint.

Inspect every capture against the canonical spec. Reject/tune if the head falls outside `45–58vh`, questions look pinned, trail does not scroll with the document, ribbon crosses typography, future trail is visible, sweeps feel random, Q3 clips, or reassurance feels detached.

- [ ] **Step 5: Commit cleanup / QA-safe state**

```bash
git add -A
git commit -m "refactor: retire sticky ribbon narrative"
```

---

## Completion Gate

Do not claim this feature complete until:

1. source-contract tests pass;
2. full `npm test` is observed passing where runnable;
3. `npm run typecheck` and `npm run build` are observed passing where dependencies permit;
4. actual screenshots are captured and visually inspected at all required viewports/checkpoints;
5. no visual rejection criterion from the canonical design spec remains;
6. PR #1 remains open and unmerged.
