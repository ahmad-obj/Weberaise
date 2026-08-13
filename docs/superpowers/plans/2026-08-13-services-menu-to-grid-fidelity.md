# Services Menu-to-Grid Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `/services` opening and menu-to-grid choreography so the same `SERVICES` word visibly becomes the page label and the service index, hover, takeover, 4×2 preview, and close sequences retain the live Codrops interaction language in Weberaise's visual system.

**Architecture:** Keep the route and data-driven React rendering, but separate testable motion values/directional logic into `servicesMotion.ts`. `ServicesPage.tsx` remains the imperative GSAP/Flip orchestrator, while CSS owns temporary handoff stacking, Codrops-like row geometry, a clearly distinct technical hover font, responsive grid geometry, and flat preview-piece motifs. The three row preview blocks remain the exact DOM nodes transferred into and out of the active preview.

**Tech Stack:** Next.js 16.3.0 App Router, React 19.2.8, TypeScript 7.0.2, GSAP 3.15.0, GSAP Flip, CSS Modules, Next/font (`Inter_Tight`, `Geist`, `Geist_Mono`), Node test runner with `tsx`.

## Global Constraints

- Work only on `feature/services-opening-grid`, verified from remote commit `36d91722907ad9cc7e35c591172b7bb1d7eb40fe` before the fidelity spec commit.
- Preserve user-owned worktree changes in `next-env.d.ts`, `tsconfig.json`, and `package-lock.json`.
- Do not edit homepage hero, loader, ribbon journey, post-Explore artwork, homepage WebGL, or floating navigation.
- Do not merge `main`, `feature/floating-navigation`, or `feature/signature-intro`.
- Keep exactly the five locked service groups and do not invent a sixth.
- Use GSAP + Flip and existing CSS Modules; add no dependency or UI framework.
- The same `SERVICES` DOM node must visibly travel from the intro to the permanent blue label.
- The fullscreen state is a pure 4×2 eight-piece composition on suitable desktop widths, with no lead paragraph, side column, accordion, or dashboard layout.
- Hover is an enhancement; click, tap, focus, Escape, and focus restoration must work without it.
- Preserve content/state under reduced motion and coarse pointers.
- Browser screenshots and interaction QA are acceptance evidence; passing source tests alone is insufficient.

---

## File map

- Modify `src/app/layout.tsx` — register `Geist_Mono` as `--font-technical` without changing existing font consumers.
- Modify `src/components/ServicesPage/servicesModel.ts` — retain five services, three primary blocks, and five concise secondary blocks; align Landing Pages with the approved eight-piece example.
- Create `src/components/ServicesPage/servicesMotion.ts` — Codrops-derived motion constants and pure title-direction/delay helpers.
- Modify `src/components/ServicesPage/ServicesPage.tsx` — intro handoff, row structure, hover/focus, guarded open/close, close-in-dialog semantics, cleanup, and same-node reparenting.
- Modify `src/components/ServicesPage/ServicesPage.module.css` — stacking, row/index proportions, technical title state, flat preview pieces, responsive/coarse-pointer/reduced-motion rules.
- Modify `tests/services-page.test.mjs` — imported behavior tests plus focused DOM/CSS contracts.
- Preserve `src/app/services/page.tsx`; route metadata already satisfies scope.
- Update `docs/superpowers/plans/2026-08-13-services-menu-to-grid-fidelity.md` checkboxes as each task completes.

### Task 1: Lock real motion and content behavior with failing tests

**Files:**
- Create: `src/components/ServicesPage/servicesMotion.ts`
- Modify: `src/components/ServicesPage/servicesModel.ts`
- Modify: `tests/services-page.test.mjs`

**Interfaces:**
- Produces: `SERVICES_MOTION` readonly constants.
- Produces: `getTitleExitY(targetTop: number, selectedTop: number): -100 | 100`.
- Produces: `getSupplementalStartDelay(primaryCount: number): number`.
- Preserves: `ServiceEntry`, `SERVICES`, `primary`, and `secondary` consumed by `ServicesPage.tsx`.

- [x] **Step 1: Add imported behavior tests before creating the motion module**

At the top of `tests/services-page.test.mjs`, import `pathToFileURL`, then load the TypeScript modules through the existing `node --import=tsx` test command:

```js
import { pathToFileURL } from 'node:url';

const moduleUrl = (relativePath) => pathToFileURL(path.join(root, relativePath)).href;
const { SERVICES } = await import(moduleUrl('src/components/ServicesPage/servicesModel.ts'));
const motionModuleUrl = moduleUrl('src/components/ServicesPage/servicesMotion.ts');
```

Add one model test and one motion test:

```js
test('service model stays five-group and composes three transferred plus five supplemental pieces', () => {
  assert.equal(SERVICES.length, 5);
  for (const service of SERVICES) {
    assert.equal(service.primary.length, 3, service.id);
    assert.equal(service.secondary.length, 5, service.id);
    assert.equal(new Set([...service.primary, ...service.secondary]).size, 8, service.id);
  }

  const landing = SERVICES.find((service) => service.id === 'landing-pages');
  assert.deepEqual(landing.secondary, [
    'Copy Direction',
    'Responsive Build',
    'Analytics & Tracking',
    'Campaign Support',
    'Iteration',
  ]);
});

test('motion blueprint preserves Codrops hover, takeover, and title-direction behavior', async () => {
  const { SERVICES_MOTION, getSupplementalStartDelay, getTitleExitY } = await import(motionModuleUrl);
  assert.deepEqual(SERVICES_MOTION.hover.blocksIn, {
    duration: 0.4,
    ease: 'power3',
    scale: 0.8,
    xPercent: 20,
    stagger: -0.035,
  });
  assert.equal(SERVICES_MOTION.hover.titleOut.duration, 0.1);
  assert.equal(SERVICES_MOTION.hover.titleIn.duration, 0.5);
  assert.equal(SERVICES_MOTION.takeover.duration, 0.9);
  assert.equal(SERVICES_MOTION.takeover.ease, 'power4.inOut');
  assert.equal(SERVICES_MOTION.close.titleStagger, 0.03);
  assert.equal(getTitleExitY(99, 100), -100);
  assert.equal(getTitleExitY(100, 100), -100);
  assert.equal(getTitleExitY(101, 100), 100);
  assert.equal(getSupplementalStartDelay(3), 0.12);
});
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --import=tsx --test tests/services-page.test.mjs
```

Expected: FAIL because `servicesMotion.ts` does not exist and Landing Pages still uses the old secondary labels.

- [x] **Step 3: Create the minimal motion module**

Create `servicesMotion.ts` with the exact tested public shape:

```ts
export const SERVICES_MOTION = {
  intro: {
    lineDuration: 0.92,
    lineStagger: 0.075,
    readingHold: 1.8,
    outerExitDuration: 0.72,
    servicesBeat: 0.18,
    handoffDuration: 0.96,
    rowRevealDuration: 0.72,
    rowRevealStagger: 0.065,
  },
  hover: {
    blocksIn: { duration: 0.4, ease: 'power3', scale: 0.8, xPercent: 20, stagger: -0.035 },
    blocksOut: { duration: 0.4, ease: 'power4', scale: 0.8 },
    titleOut: { duration: 0.1, ease: 'power1.in' },
    titleIn: { duration: 0.5, ease: 'expo', rotation: 15 },
  },
  takeover: { duration: 0.9, ease: 'power4.inOut', itemStagger: 0.04 },
  close: { duration: 0.5, ease: 'power4.inOut', titleStagger: 0.03 },
} as const;

export function getTitleExitY(targetTop: number, selectedTop: number): -100 | 100 {
  return targetTop > selectedTop ? 100 : -100;
}

export function getSupplementalStartDelay(primaryCount: number): number {
  return SERVICES_MOTION.takeover.itemStagger * primaryCount;
}
```

- [x] **Step 4: Update only the Landing Pages supplemental labels**

Replace its `secondary` array with:

```ts
secondary: ['Copy Direction', 'Responsive Build', 'Analytics & Tracking', 'Campaign Support', 'Iteration'],
```

Do not change the five group titles or IDs.

- [x] **Step 5: Run the focused test and verify GREEN**

Run the same focused command. Expected: all services tests PASS before production choreography changes.

- [x] **Step 6: Commit the behavior blueprint batch**

Stage only `servicesMotion.ts`, `servicesModel.ts`, and `tests/services-page.test.mjs` with commit message:

```text
test: lock services menu-grid choreography
```

### Task 2: Make the same `SERVICES` node visibly complete the intro handoff

**Files:**
- Modify: `src/components/ServicesPage/ServicesPage.tsx`
- Modify: `src/components/ServicesPage/ServicesPage.module.css`
- Modify: `tests/services-page.test.mjs`

**Interfaces:**
- Consumes: `SERVICES_MOTION.intro`.
- Produces DOM state: `data-handoff-active="true|false"` on the page only during the word/index overlap.
- Preserves refs: `servicesWordRef`, `introServicesSlotRef`, `servicesLabelSlotRef`.

- [ ] **Step 1: Add failing same-node visibility contracts**

Extend the opening test to require the temporary stacking state and cleanup:

```js
assert.match(component, /dataset\.handoffActive\s*=\s*'true'/);
assert.match(component, /delete page\.dataset\.handoffActive/);
assert.match(css, /\.page\[data-handoff-active='true'\]\s+\.indexStage\s*\{[\s\S]*z-index:\s*310/);
assert.match(component, /SERVICES_MOTION\.intro/);
```

Retain the existing checks for `Flip.getState(servicesWord)`, `appendChild(servicesWord)`, and `Flip.from`.

- [ ] **Step 2: Run focused test and verify RED**

Expected: FAIL because the current reparented word remains beneath `.intro` at z-index 300 and no handoff state exists.

- [ ] **Step 3: Refactor the intro timeline to use a nested handoff timeline**

Import `SERVICES_MOTION`. Keep entrance, hold, outer exits, and beat on the master timeline. At the handoff callback:

```ts
const flipState = Flip.getState(servicesWord, { simple: true });
page.dataset.handoffActive = 'true';
page.dataset.indexReady = 'true';
servicesLabelSlot.appendChild(servicesWord);
servicesWord.dataset.docked = 'true';

const flip = Flip.from(flipState, {
  duration: SERVICES_MOTION.intro.handoffDuration,
  ease: 'power4.inOut',
  absolute: true,
  paused: true,
});

const handoff = gsap.timeline({
  onComplete: () => {
    gsap.set(intro, { display: 'none' });
    delete page.dataset.handoffActive;
    revealIndexForInteraction();
  },
});

handoff
  .add(flip, 0)
  .to(rowTitles, {
    yPercent: 0,
    duration: SERVICES_MOTION.intro.rowRevealDuration,
    ease: 'power4.out',
    stagger: SERVICES_MOTION.intro.rowRevealStagger,
  }, 0.08)
  .to(intro, { autoAlpha: 0, duration: 0.22, ease: 'power2.out' }, 0.74);
```

Store and kill the nested handoff timeline on cleanup. In reduced motion, still append the exact same node before exposing the index.

- [ ] **Step 4: Add the temporary stacking rule**

Keep `.intro` at z-index 300 and normal `.indexStage` at z-index 1. Add:

```css
.page[data-handoff-active='true'] .indexStage {
  z-index: 310;
}
```

This lets the reparented word and revealing rows remain visible over the still-opaque intro without changing later cover/preview stacking.

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
node --import=tsx --test tests/services-page.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Browser checkpoint — opening and handoff**

At 1440×900, capture and inspect:

- settled three-line question;
- outer-line exit with `SERVICES` alone;
- handoff at approximately 30%, 60%, and 90%;
- final label/menu settle.

Reject the milestone if the word disappears, jumps, crossfades, leaves a ghost, or arrives before the rows. Repeat at 390×844 and with reduced motion.

- [ ] **Step 7: Commit the intro geometry batch**

Stage only the component, CSS, and updated test with commit message:

```text
fix: preserve services word through intro handoff
```

### Task 3: Rebuild the service row and hover/focus choreography

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/ServicesPage/ServicesPage.tsx`
- Modify: `src/components/ServicesPage/ServicesPage.module.css`
- Modify: `tests/services-page.test.mjs`

**Interfaces:**
- Produces CSS variable: `--font-technical` from `Geist_Mono`.
- Consumes: `SERVICES_MOTION.hover`.
- Produces row DOM: `data-service-index`, one clipped title node, and three transferable `data-primary-block` pieces.

- [ ] **Step 1: Add failing font, row, and pointer contracts**

Add assertions:

```js
const layout = read('src/app/layout.tsx');
assert.match(layout, /Geist_Mono/);
assert.match(layout, /--font-technical/);
assert.match(component, /data-service-index/);
assert.match(component, /SERVICES_MOTION\.hover\.blocksIn/);
assert.match(css, /var\(--font-technical\)/);
assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
assert.match(css, /\.rowIndex/);
```

- [ ] **Step 2: Run focused tests and verify RED**

Expected: FAIL because the technical font variable and refined row/index contracts are absent.

- [ ] **Step 3: Register Geist Mono without changing existing fonts**

Update `layout.tsx`:

```ts
import { Geist, Geist_Mono, Inter_Tight } from 'next/font/google';

const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-technical', display: 'swap' });
```

Add `geistMono.variable` to the existing `<html className>` string. Do not change `--font-body` or `--font-hero` assignments.

- [ ] **Step 4: Refine row markup without altering transfer identity**

Inside each title cell, add a decorative number:

```tsx
<span className={styles.rowIndex} data-service-index aria-hidden="true">
  {service.index}
</span>
```

Keep one title span and the existing primary block nodes. Give each primary block `data-grid-index={blockIndex}` and render a micro ordinal, label, and decorative signal so the same internal structure works in the row and fullscreen grid.

- [ ] **Step 5: Drive hover from centralized constants**

Replace duplicated numeric literals in `showRowPreview`/`hideRowPreview` with `SERVICES_MOTION.hover`. Preserve the exact sequence:

- primary pieces enter over 0.4s from scale 0.8/xPercent 20 with negative stagger;
- current title exits upward over 0.1s;
- `data-switched` is applied only while clipped;
- the same title enters from below with 15-degree energy over 0.5s;
- mouseleave/blur removes the state with the same title mechanism.

Guard pointer hover with `matchMedia('(hover: hover) and (pointer: fine)')`, while keyboard focus still runs the visible focus/preview state.

- [ ] **Step 6: Match the live row proportions and make the font switch unmistakable**

Keep 5vw preview pieces, 1vw gaps, thin borders, and the 27–43px title range as the desktop starting point. Use Inter Tight for normal titles and `var(--font-technical)` for `[data-switched='true']`, with controlled tracking and weight. Keep the alternate title inside the fixed clip height so font metric changes do not resize rows.

At rest, primary pieces remain effectively invisible. Remove the current mobile `opacity: 0.58` permanent-card presentation; coarse-pointer origin pieces may retain geometry while staying visually absent.

- [ ] **Step 7: Run tests and typecheck**

Run the focused service test and `npm run typecheck`. Expected: PASS.

- [ ] **Step 8: Browser checkpoint — resting and every hover**

At matched 1440×900:

- compare row height, border rhythm, title size, left edge, and right preview region against Codrops;
- hover every service, including the long commerce row;
- verify the technical face is visibly different at a glance;
- verify reverse/negative stagger and smooth leave;
- keyboard-tab every row and confirm a visible focus indication plus useful preview state;
- confirm no horizontal overflow at laptop/tablet widths.

- [ ] **Step 9: Commit the row/hover batch**

Use commit message:

```text
feat: restore Codrops-style services row hover
```

### Task 4: Tighten takeover, same-node grid transfer, dialog semantics, and close

**Files:**
- Modify: `src/components/ServicesPage/ServicesPage.tsx`
- Modify: `src/components/ServicesPage/ServicesPage.module.css`
- Modify: `tests/services-page.test.mjs`

**Interfaces:**
- Consumes: `SERVICES_MOTION.takeover`, `SERVICES_MOTION.close`, `getTitleExitY`, and `getSupplementalStartDelay`.
- Produces refs: `closeButtonRefs.current[index]` so the active dialog owns its close control.
- Preserves exact node movement: `originBlocks -> previewGrid -> originBlocks`.

- [ ] **Step 1: Add failing lifecycle and dialog contracts**

Require:

```js
assert.match(component, /closeButtonRefs/);
assert.match(component, /preview\.removeAttribute\('inert'\)/);
assert.match(component, /preview\.setAttribute\('inert',\s*''\)/);
assert.match(component, /getTitleExitY/);
assert.match(component, /getSupplementalStartDelay/);
assert.match(component, /data-grid-index/);
assert.match(css, /\.previewGrid \[data-grid-index='0'\]/);
assert.doesNotMatch(css, /\.previewGrid \.tileInner[\s\S]*border-radius:\s*calc/);
```

Retain existing assertions for selected-row z-index 11, cover z-index 10, preview z-index 200, row-derived cover geometry, `Flip.getState`, `previewGrid.prepend`, `Flip.from`, reparenting back, Escape, and focus restoration.

- [ ] **Step 2: Run focused tests and verify RED**

Expected: FAIL because close is a sibling of the dialogs, inert lifecycle is absent, pure helpers are not used, and preview pieces still use the rounded card rule.

- [ ] **Step 3: Move the close control inside each preview article**

Replace the shared close ref with `closeButtonRefs`. Render one close button as the first focusable child of each hidden preview article. On open, resolve `closeButtonRefs.current[index]`, remove `inert` from that article, reveal/focus its close button, and leave all other articles inert/hidden. On finish close, restore `inert`, `aria-hidden`, and `tabIndex=-1` before returning focus.

- [ ] **Step 4: Centralize open measurements before writes**

At activation, resolve all refs and read once:

```ts
const rowRect = row.getBoundingClientRect();
const selectedTop = rowRect.top;
const titleTops = allTitles.map((item) => item.getBoundingClientRect().top);
const rowHeight = row.offsetHeight;
```

Then set the guarded state, body overflow, row current z-index state, active dialog, cover origin, preview title start, supplemental opacity, and close start. Do not interleave new reads after reparenting.

- [ ] **Step 5: Preserve Codrops open sequencing with helper values**

Use `getTitleExitY(titleTops[position], selectedTop)` for directional exits. Capture primary pieces, physically prepend them into the active grid, and store the returned Flip animation for cleanup. Use `getSupplementalStartDelay(primaryBlocks.length)` for five supplemental pieces. Keep cover, titles, preview title, close control, and Flip at the same `start` label.

- [ ] **Step 6: Make eight pieces read as grid media, not SaaS cards**

Keep `repeat(4, var(--tile-size-large))` by `repeat(2, var(--tile-size-large))`. Remove rounded bordered-card styling in the fullscreen context. Add generic `data-grid-index='0'` through `'7'` motif rules using flat Weberaise surfaces, clipped blue/neutral rules, micro ordinals, and restrained pseudo-element geometry. Do not add fake metrics, clients, imagery, descriptions, gradients that read as AI decoration, or per-service layout branches.

- [ ] **Step 7: Preserve Codrops close order and reset repeat-cycle state**

Shrink all eight pieces over the close defaults with `0.04` stagger. Return the primary nodes on shrink completion. Begin cover collapse and row-title return at `start+=0.4`; fade the cover at `start+=0.9`. Clear `data-switched`, inline transforms, active/current flags, inert/ARIA state, and overflow before restoring focus.

On unmount, kill intro, handoff, hover, detail, and Flip animations; return any transferred nodes; restore body overflow; and remove stale handoff/current state.

- [ ] **Step 8: Run tests and typecheck**

Run the focused service test and `npm run typecheck`. Expected: PASS.

- [ ] **Step 9: Browser checkpoint — open/grid/close**

At 1440×900, inspect first, middle, and last rows:

- selected row remains above the expanding cover;
- cover starts at the exact clicked-row geometry;
- above/below titles move in correct directions;
- all three visible row pieces travel continuously into grid positions without cloning or jumping;
- five supplemental pieces arrive around them;
- title remains proportionate to the grid;
- close button and Escape follow the same close path;
- focus returns to the correct row;
- five repeated open/close cycles remain clean.

Capture matched open-mid, fullscreen, and close-mid comparisons against Codrops.

- [ ] **Step 10: Commit the takeover batch**

Use commit message:

```text
feat: refine services row-to-grid takeover
```

### Task 5: Complete responsive, coarse-pointer, reduced-motion, and regression QA

**Files:**
- Modify: `src/components/ServicesPage/ServicesPage.module.css`
- Modify: `src/components/ServicesPage/ServicesPage.tsx` only if browser QA reveals a state defect first reproduced by a failing test.
- Modify: `tests/services-page.test.mjs`

**Interfaces:**
- CSS breakpoints remain `900px` and `640px`.
- Mobile grid remains the same eight DOM pieces in a 2×4 arrangement.

- [ ] **Step 1: Add failing responsive geometry contracts**

Require the mobile height constraint and coarse-pointer treatment:

```js
assert.match(css, /--tile-size-large:\s*min\([^;]*16svh/);
assert.match(css, /@media \(hover: none\), \(pointer: coarse\)/);
assert.match(css, /grid-template-columns:\s*repeat\(2,\s*var\(--tile-size-large\)\)/);
assert.match(css, /grid-template-rows:\s*repeat\(4,\s*var\(--tile-size-large\)\)/);
```

- [ ] **Step 2: Run focused tests and verify RED**

Expected: FAIL until short-screen mobile and coarse-pointer rules are present.

- [ ] **Step 3: Implement responsive piece sizing**

At `max-width: 640px`, use:

```css
--tile-size-large: min(42vw, 16svh, 156px);
```

Keep two columns/four rows, reduce preview vertical gap, allow long service titles to wrap, and position the invisible primary origin geometry at the row's right so click-to-grid travel still has a coherent source without permanent mobile cards.

- [ ] **Step 4: Implement explicit coarse-pointer and reduced-motion presentation**

Coarse pointer: do not depend on hover, do not show permanent preview cards, keep row buttons full-size and titles readable.

Reduced motion: keep same-node intro and grid reparenting, ARIA/inert state, Escape, focus entry, and focus restoration; use near-zero transform durations and short opacity settling. Never hide information that exists in the default state.

- [ ] **Step 5: Run focused and full automated verification**

Run in order:

```bash
node --import=tsx --test tests/services-page.test.mjs
npm test
npm run typecheck
npm run build
```

Expected: all commands exit 0 with no new warning/error introduced by Services code.

- [ ] **Step 6: Browser matrix**

Capture and interact at:

- desktop 1440×900;
- laptop 1280×720;
- tablet 1024×768 and 768×1024;
- mobile 390×844;
- a short mobile viewport such as 390×667;
- desktop reduced motion;
- emulated coarse pointer/mobile.

At every relevant size, check initial intro, readable hold, handoff continuity, resting rows, long-title wrapping, click, eight-piece landing, close, Escape, focus return, repeat cycles, no horizontal overflow, and resize after a completed close.

- [ ] **Step 7: Inspect the final diff and protected-file scope**

Run:

```bash
git diff --check
git status --short
git diff --stat 36d91722907ad9cc7e35c591172b7bb1d7eb40fe
git diff --name-only 36d91722907ad9cc7e35c591172b7bb1d7eb40fe
```

Confirm no homepage animation file changed and user-owned `next-env.d.ts`, `tsconfig.json`, and `package-lock.json` were never staged.

- [ ] **Step 8: Commit final responsive/QA fixes only if files changed in this task**

Use commit message:

```text
fix: harden services menu-grid across viewports
```

## Browser QA checkpoints summary

1. Baseline captured before edits: Codrops and Weberaise at 1440×900 for rest, hover, open-mid, grid, and close-mid; Weberaise intro and broken handoff also captured.
2. After Task 2: intro and three handoff progress captures at desktop/mobile/reduced motion.
3. After Task 3: matched resting/hover captures and every-row hover/focus inspection.
4. After Task 4: first/middle/last open, fullscreen, close, Escape, focus, and repeat-cycle captures.
5. After Task 5: laptop/tablet/mobile/short-mobile/reduced-motion/coarse-pointer matrix and final matched desktop comparison.

## Self-review

- Spec coverage: every handoff requirement is assigned to an implementation task or browser checkpoint, including exact files, intro fixes, same-node Flip, row DOM, hover font/tile timelines, click/cover stacking, Flip reparenting, 4×2 grid, close, data, responsive, accessibility, tests, and browser QA.
- Placeholder scan: no `TBD`, `TODO`, “implement later,” or undefined neighboring interface remains.
- Type consistency: `SERVICES_MOTION`, `getTitleExitY`, `getSupplementalStartDelay`, `closeButtonRefs`, and existing `primary`/`secondary` names are consistent across tasks.
- Scope: only Services files, the root font registration, focused tests, and Services docs are in scope; protected homepage work remains untouched.
- Execution mode: inline execution in this active session is required because the task did not authorize subagent delegation.
