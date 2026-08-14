# Gentle Center Pill Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shared traveling center-nav hover plate with independent, gentler React Bits Pill Nav-inspired internal flood transitions while preserving all existing Weberaise navigation colors, layout, responsive behavior, destinations, and non-center interactions.

**Architecture:** Keep `CenterNavCluster` as the markup owner, but give each center anchor its own measured inverse surface and duplicate hover label. Refactor `createCenterHoverMotion` from one shared plate into per-link GSAP timelines that measure each pill, size its circle geometrically, animate forward on pointer/focus entry, and reverse on exit. Theme inversion remains entirely CSS-variable driven.

**Tech Stack:** Next.js/React, TypeScript, CSS Modules, GSAP, Node test runner.

## Global Constraints

- Work only on `feature/signature-intro`.
- Do not change logo behavior or `LET'S TALK` goo behavior.
- Do not change navigation destinations or center pill layout/spacing.
- Preserve `--nav-pill-bg` / `--nav-pill-fg` theme inversion and per-zone theme sampling.
- Preserve hero/main mounting, Explore handoff, mobile layout, keyboard focus, coarse-pointer behavior, and reduced-motion behavior.
- No homepage/ribbon/artwork production files may change.
- Hover-in target: approximately 0.46s, soft `power3.out`-style motion.
- Hover-out target: approximately 0.36s and implemented by reversing the same timeline.
- No spring, bounce, elastic overshoot, or traveling shared hover element.

---

### Task 1: Lock regression coverage for the approved motion model

**Files:**
- Modify: `tests/navigation.test.mjs`

**Interfaces:**
- Consumes: current navigation source text.
- Produces: static regression assertions that fail until per-pill flood markup/motion replaces the shared plate.

- [ ] **Step 1: Replace the shared-plate test with per-pill flood assertions**

Add assertions that `CenterNavCluster.tsx` contains `data-center-pill-surface`, `data-center-pill-label`, and `data-center-pill-label-hover`, and does not contain `data-center-hover-plate`.

Add assertions that `centerHoverMotion.ts` creates a GSAP timeline per link, uses measured width/height geometry, animates to a forward state around `0.46`, reverses around `0.36`, and does not query a shared hover plate.

Add CSS assertions that the internal surface uses `background: var(--nav-pill-fg)` and the hover label uses `color: var(--nav-pill-bg)`.

- [ ] **Step 2: Run the navigation test and verify RED**

Run:

```bash
node --test tests/navigation.test.mjs
```

Expected: FAIL specifically because the current component still exposes `data-center-hover-plate` and lacks the new per-pill surface/labels.

---

### Task 2: Replace shared plate markup with independent pill internals

**Files:**
- Modify: `src/components/navigation/CenterNavCluster.tsx`

**Interfaces:**
- Consumes: `CENTER_NAV_ITEMS`, existing `onNavigate` behavior, existing `data-nav-item` and `data-nav-detach-anchor` seams.
- Produces: each `.centerPill` anchor contains three descendants: `[data-center-pill-surface]`, `[data-center-pill-label]`, `[data-center-pill-label-hover]`.

- [ ] **Step 1: Remove the shared hover plate**

Delete the single `centerHoverPlate` span from the cluster.

- [ ] **Step 2: Add internal hover layers to each center anchor**

Inside each center pill anchor render:

```tsx
<span className={styles.centerPillSurface} data-center-pill-surface aria-hidden="true" />
<span className={styles.centerPillLabel} data-center-pill-label>{item.label}</span>
<span className={styles.centerPillLabelHover} data-center-pill-label-hover aria-hidden="true">{item.label}</span>
```

Keep click interception and destination behavior unchanged.

---

### Task 3: Implement the gentler measured flood timeline

**Files:**
- Modify: `src/components/navigation/centerHoverMotion.ts`

**Interfaces:**
- Consumes: each `[data-center-nav-link]` with its internal surface/base-label/hover-label descendants.
- Produces: `createCenterHoverMotion(root: HTMLElement, reducedMotion: boolean): () => void` with independent GSAP timelines per pill.

- [ ] **Step 1: Measure each pill and size its surface geometrically**

For each link, read `getBoundingClientRect()` and calculate a circle diameter large enough to cover the pill, following the React Bits geometry principle:

```ts
const radius = ((width * width) / 4 + height * height) / (2 * height);
const diameter = Math.ceil(radius * 2) + 2;
const delta = Math.ceil(radius - Math.sqrt(Math.max(0, radius * radius - (width * width) / 4))) + 1;
const originY = diameter - delta;
```

Set surface width/height/bottom and transform origin from those values.

- [ ] **Step 2: Build one paused timeline per pill**

Initial state:

```ts
gsap.set(surface, { xPercent: -50, scale: 0 });
gsap.set(baseLabel, { y: 0, opacity: 1 });
gsap.set(hoverLabel, { y: height + 12, opacity: 0 });
```

Timeline end state:

```ts
timeline.to(surface, { scale: 1.2, duration: 1, ease: 'none' }, 0);
timeline.to(baseLabel, { y: -(height + 6), duration: 1, ease: 'none' }, 0);
timeline.to(hoverLabel, { y: 0, opacity: 1, duration: 1, ease: 'none' }, 0);
```

The timeline itself remains normalized; entry/exit speed is controlled by `tweenTo`.

- [ ] **Step 3: Use gentle forward/reverse tweening**

Pointer/focus enter:

```ts
timeline.tweenTo(timeline.duration(), {
  duration: reducedMotion ? 0 : 0.46,
  ease: reducedMotion ? 'none' : 'power3.out',
  overwrite: 'auto',
});
```

Pointer/focus leave:

```ts
timeline.tweenTo(0, {
  duration: reducedMotion ? 0 : 0.36,
  ease: reducedMotion ? 'none' : 'power3.out',
  overwrite: 'auto',
});
```

Do not coordinate neighboring pills through shared state; independent reversal/entry gives the approved soft overlap.

- [ ] **Step 4: Re-layout on resize**

Use one `ResizeObserver` over the root and links. On resize, preserve each timeline's current progress, rebuild its measured geometry/timeline, then restore progress so resizing does not flash.

- [ ] **Step 5: Clean up listeners/tweens**

Remove pointer/focus listeners, disconnect observer, kill timelines and active tween refs on cleanup.

---

### Task 4: Style the internal flood without changing adaptive colors

**Files:**
- Modify: `src/components/navigation/Navigation.module.css`

**Interfaces:**
- Consumes: current `--nav-pill-bg` and `--nav-pill-fg` variables supplied by hero/main theme modes.
- Produces: clipped internal surface and two labels with correct stacking and adaptive inversion.

- [ ] **Step 1: Make only center pills clip their internal animation**

Keep `.pill` behavior unchanged globally. Set `.centerPill` to `position: relative; isolation: isolate; overflow: hidden;` while preserving current dimensions.

- [ ] **Step 2: Add surface geometry styles**

```css
.centerPillSurface {
  position: absolute;
  left: 50%;
  bottom: 0;
  z-index: 1;
  display: block;
  border-radius: 50%;
  background: var(--nav-pill-fg);
  pointer-events: none;
  will-change: transform;
}
```

- [ ] **Step 3: Add label layers**

The base and hover labels are centered, `white-space: nowrap`, and `will-change: transform, opacity`. Base label stays above pill background but below the inverse hover label; hover label uses `color: var(--nav-pill-bg)` so theme inversion remains automatic.

- [ ] **Step 4: Remove obsolete shared-plate CSS**

Delete `.centerHoverPlate` rules and remove it from transition selector groups. Do not alter `.gooCore`, `.gooParticle`, `.talkPill`, logo, or theme sampling rules.

- [ ] **Step 5: Keep coarse-pointer/reduced-motion CSS valid**

Remove `.centerHoverPlate` from coarse-pointer hiding. The JS reduced-motion path handles center-pills directly; existing coarse-pointer navigation remains usable.

---

### Task 5: Verify GREEN and scope hygiene

**Files:**
- Test: `tests/navigation.test.mjs`
- Verify production diff scope.

**Interfaces:**
- Consumes: Tasks 2–4 implementation.
- Produces: evidence that approved center motion is present without unrelated regressions.

- [ ] **Step 1: Run focused navigation tests**

```bash
node --test tests/navigation.test.mjs
```

Expected: all navigation tests PASS.

- [ ] **Step 2: Run project verification when runtime checkout permits**

```bash
npm test
npm run typecheck
npm run build
```

Expected: exit code 0 for each. If this tool environment cannot execute the repository runtime, report that limitation rather than claiming a pass.

- [ ] **Step 3: Audit changed production files**

Compare against the pre-feature commit. Production changes must be limited to:

```text
src/components/navigation/CenterNavCluster.tsx
src/components/navigation/centerHoverMotion.ts
src/components/navigation/Navigation.module.css
```

No `MainSite`, ribbon, artwork, Hero, ExperienceShell, SiteNavigation, GooeyTalkButton, or theme-hook production file may change.

- [ ] **Step 4: Commit implementation**

```bash
git add tests/navigation.test.mjs src/components/navigation/CenterNavCluster.tsx src/components/navigation/centerHoverMotion.ts src/components/navigation/Navigation.module.css
git commit -m "refine center nav pill hover motion"
```

Keep PR #1 open and unmerged.
