# Ribbon Trail Narrative Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Scroll Float question scene with a reversible, scroll-drawn SVG ribbon that visits three fixed questions and ends near a larger, denser, single-color interactive particle reassurance.

**Architecture:** `TrailNarrative` owns a pinned `100svh` scene and one decorative SVG path. `trailPath.ts` owns editable desktop/mobile path geometry; `trailMotion.ts` owns normalized timing, auto-draw, scroll mapping, question state and group fade. Particle reassurance remains Canvas 2D but becomes one-color, larger and denser while retaining pointer interaction and offscreen pausing.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 7, GSAP 3.15.0 + ScrollTrigger, SVG, Canvas 2D, CSS Modules.

## Global Constraints
- Work only on `feature/signature-intro`; do not merge PR #1.
- Do not modify loader, hero, cursor reveal, EXPLORE button, `bottomFill`, or `exploreTimeline.ts`.
- Ribbon color is `#3B82F6`.
- Initial auto-drawn ribbon floor is `0.09`.
- Scroll down extends; scroll up retracts; visible progress never falls below `0.09` after the opening auto-draw.
- Q1 top-left, Q2 middle-right, Q3 lower-left with safe bottom clearance.
- Questions do not move with scroll after their local reveal.
- Questions fade together near the end.
- Particle reassurance uses only `#F5F7FA` particles.
- Particle reassurance remains particles permanently and remains pointer-interactive.
- Particle target scale is about 2x current; sampling density about 1.5x current.
- Aurora statement and GROW ring remain unchanged.
- No new dependency.

---

### Task 1 — Lock ribbon contracts with tests

**Files:**
- Modify: `tests/post-explore-narrative.test.mjs`

- [ ] Add failing source contracts asserting:
  - `TrailNarrative.tsx`, `trailPath.ts`, `trailMotion.ts` exist;
  - `TrailNarrative` replaces `QuestionSequence` in `PostExploreNarrative.tsx`;
  - `TRAIL_TIMING.initial === 0.09` and q1/q2/q3/fade/reassurance thresholds exist;
  - SVG path uses `strokeDasharray`/`strokeDashoffset` or equivalent path-length drawing;
  - trail motion clamps progress with `Math.max(TRAIL_TIMING.initial, ...)` after intro completion;
  - current `QuestionSequence.tsx` / `questionMotion.ts` are no longer used;
  - particle source contains no `GLOW_BLUE`, `ACCENT_BLUE`, `#60A5FA`, or `#3B82F6` color-selection logic;
  - particle canvas still has pointer enter/move/leave listeners;
  - CSS contains desktop `500svh`, mobile `520svh`, fixed Q1/Q2/Q3 anchors and no question overflow.

- [ ] Run targeted test before implementation and confirm failure because ribbon files do not exist.

### Task 2 — Build editable trail path + motion controller

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/trailPath.ts`
- Create: `src/components/MainSite/PostExploreNarrative/trailMotion.ts`

**Interfaces:**
```ts
export type TrailPathDefinition = { viewBox: string; d: string };
export const DESKTOP_TRAIL: TrailPathDefinition;
export const MOBILE_TRAIL: TrailPathDefinition;

export const TRAIL_TIMING = {
  initial: 0.09,
  q1: 0.23,
  q2: 0.47,
  q3: 0.69,
  questionsFade: 0.83,
  reassurance: 0.94,
  end: 1,
} as const;

export function createTrailMotion(root: HTMLElement, reducedMotion: boolean): () => void;
```

- [ ] Implement simple temporary desktop/mobile paths using normalized SVG coordinates.
- [ ] Implement path length initialization using `getTotalLength()`.
- [ ] Set `strokeDasharray = pathLength` and initial dash offset to full length.
- [ ] Auto-draw to 9% over ~650ms unless reduced motion.
- [ ] Bind ScrollTrigger to the trail scroll host after initialization and map scroll progress to `[0.09, 1]`.
- [ ] Reverse scroll naturally retracts because dash offset is derived from current normalized scroll progress.
- [ ] Toggle question visited states at q1/q2/q3 thresholds and group-fade state at `0.83`.
- [ ] Toggle reassurance-active state at `0.94`.
- [ ] Cleanup timeline, ScrollTrigger and media/resize listeners.

### Task 3 — Replace Scroll Float questions with fixed TrailNarrative

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/TrailNarrative.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Delete after replacement: `QuestionSequence.tsx`, `questionMotion.ts`

- [ ] `TrailNarrative` renders one sticky stage containing:
  - decorative responsive SVG path;
  - Q1/Q2/Q3 semantic headings;
  - no character splitting.
- [ ] Use `matchMedia('(max-width: 720px)')` or CSS-driven dual SVG definitions to choose mobile path without rerender loops.
- [ ] Fixed anchors:
  - Q1 top-left;
  - Q2 middle-right;
  - Q3 lower-left at ~66–68% vertical position and safe clearance.
- [ ] Questions use local opacity + `translateY(24px)` reveal only.
- [ ] Once revealed they remain fixed; no ongoing scroll transform.
- [ ] All questions fade together through a parent state near 0.83.
- [ ] Scroll host: 500svh desktop, 520svh mobile.
- [ ] Remove obsolete Scroll Float source files after integration.

### Task 4 — Revise ParticleReassurance

**Files:**
- Modify: `ParticleReassurance.tsx`
- Modify: `particleModel.ts`
- Modify: `PostExploreNarrative.module.css`

- [ ] Remove all blue particle constants and branching; every particle uses `#F5F7FA`.
- [ ] Increase target typography scale approximately 2x while preserving viewport fit with a maximum-width measurement pass.
- [ ] Increase sampling density about 1.5x by reducing sampling step from 3px toward 2px and raising bounded particle caps.
- [ ] Desktop particle cap about 4000; mobile about 2200; DPR <= 1.5.
- [ ] Keep pointer repel and subtle idle drift.
- [ ] Keep continuous particle rendering only while visible; pause offscreen.
- [ ] Do not introduce solid text takeover.
- [ ] Use `data-reassurance-active` from the parent narrative to fade the particle scene in near trail progress 0.94 without regenerating particles every scroll frame.

### Task 5 — Integration verification and documentation

**Files:**
- Modify: `tests/post-explore-narrative.test.mjs`
- Modify if needed: `tests/visual-contract.test.mjs`

- [ ] Verify changed-file scope contains only post-Explore narrative/docs/tests.
- [ ] Verify no loader/hero/EXPLORE source changed.
- [ ] Run source-contract tests.
- [ ] Run `npm test`, `npm run typecheck`, `npm run build` when a full local repo/runtime is available.
- [ ] Browser QA at 390x844, 768x1024, 1366x768, 1440x900:
  - initial 9% auto-draw;
  - path hidden ahead of progress;
  - reverse scroll retracts but keeps floor;
  - Q3 fully visible;
  - path visits all three questions;
  - group fade happens together;
  - reassurance uses only white particles;
  - particle text is visibly larger/denser and remains interactive;
  - Aurora/GROW remain unchanged.
