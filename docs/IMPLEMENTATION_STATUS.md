# Weberaise Implementation Status

**Milestone:** Signature intro + Explore handoff foundation  
**Branch:** `feature/signature-intro`  
**Date:** 2026-08-11

## Implemented

### Experience flow
- one-route experience reducer;
- loader/hero scroll lock;
- `EXPLORE` is the only transition into normal scrolling;
- First Impression is prepared before the handoff.

### Loader
- truthful weighted critical-resource registry;
- every integer 100→0 is traversable;
- `0` is gated by actual critical readiness;
- registry progress is React-observable, fixing the earlier stuck-at-100 bug;
- all countdown numbers are fixed at viewport center;
- digit cadence now slows progressively toward zero;
- each digit transition finishes before the next cadence tick, avoiding repeated animation restarts;
- digit replacement is now a stationary opacity/blur crossfade with no vertical jump or scale hop;
- the real countdown `0` holds for `700ms` before the completion phase begins;
- countdown `0` and completion `0` share `.loader-zero-glyph` font metrics and the same viewport-center registration;
- tagline is exactly `Need a website for business?`;
- tagline starts pre-hidden in CSS at `translateY(130%)`, preventing the pre-GSAP first-paint flicker;
- horizontal line uses `min(92vw, 1100px)` and a reduced `48px–72px` offset so it sits closer to the centered zero/tagline;
- before rotating vertical, the line animates to exact `top: 50%`;
- vertical scale is computed against `window.innerHeight + 24`, giving a small overscan so the vertical line clears the full viewport height;
- existing `0` → line → tagline → vertical/twin-line choreography is otherwise preserved.

### Hero layout
- front/reveal typography share one registered composition;
- centered Inter Tight heavy typography;
- approved horizontal WEBERAISE lockup;
- shared typography/brand composition is raised to approximately `-4.2vh` on desktop, with a gentler mobile offset;
- `EXPLORE` is now a real black front label placed below the reveal compositor (`z-index: 4` vs canvas `z-index: 5`);
- the same difference compositor that reveals the black hero therefore inverts the black label to white only where the liquid passes over it;
- no separate white-only Explore state is required in the normal WebGL path;
- no-WebGL fallback retains difference blending explicitly;
- light hero has an extremely faint radial edge vignette (~2–3% black at the far perimeter only).

### Interactive reveal — current architecture
The earlier ping-pong feedback-density implementation has been replaced.

Current production model:
- WebGL2 low-resolution **implicit liquid field**;
- active pointer/autonomous samples stored as bounded time-stamped liquid primitives;
- primitives are rendered as instanced rounded field contributions;
- additive field union produces smooth metaball-like merging/necks;
- visible surface is extracted through a narrow level-set threshold;
- primitive opacity does not fade as the main healing mechanism;
- primitives stay near full radius during the hold stage, then geometrically shrink;
- aging therefore moves the contour inward rather than turning the trail into fog;
- thin connections may naturally neck/pinch apart into rounded remnants;
- terminal stroke remains a proper rounded blob;
- subtle low-frequency threshold displacement affects only the contour;
- no temporal hash grain, history dissipation, broad advection or smoke-like low-alpha field;
- full/lite/fallback quality profiles remain explicit;
- autonomous intro uses the same engine;
- bottom-fill Explore mode remains separate inside the same compositor.

### Pointer footprint + inertia polish
- normal pointer radius remains `0.078` desktop / `0.10` mobile;
- interpolation spacing remains tightened for continuity;
- pointer stop uses a short recent-velocity memory so the browser's final near-zero pointer event does not erase the intended inertial cue;
- the main blob does **not** translate after the pointer stops;
- only `2–4` small rogue satellite patches continue forward;
- satellites start ahead of the cursor path instead of forming a second connected cursor sphere;
- maximum carry is about `5%` viewport-space and typical fast-motion carry is lower;
- small deterministic lateral offsets make the satellites irregular rather than symmetric;
- satellite radii stay below ~42% of the main pointer radius;
- satellite strength stays above the current implicit-surface threshold so the effect remains actually visible;
- the sequence finishes in roughly `300ms`;
- slow movement below the speed threshold produces no afterglide;
- any new pointer input immediately cancels pending inertial emissions;
- reduced-motion mode disables afterglide.

Current full profile:
- field short axis: adaptive up to `512px`;
- display DPR cap: `1.5`;
- lifetime: `3.6s`;
- hold fraction: `0.60`;
- max active primitives: `420`;
- surface threshold: `0.40`;
- contour warp: `0.010`.

### Nothin reference inspection
Public evidence confirms Nothin uses WebGL/custom shaders; GSAP's showcase material also identifies Three.js/WebGL/Webflow.

The repo contains a dependency-free runtime probe:

```bash
npm run probe:nothin
```

It launches local Chrome/Chromium through CDP and records publicly delivered WebGL characteristics under `.diagnostics/`, including program/shader metadata, uniform names, framebuffer/texture allocations and draw-call structure. Captured shader text is analysis-only and must not be transplanted into Weberaise.

Reference:
- `docs/reference/NOTHIN_RUNTIME_PROBE.md`

### Offline prototype
`prototype/reveal-engine.js` mirrors the age-aware implicit-field model rather than the old density-feedback implementation.

## Verification evidence

### Latest loader/inertia correction
A focused pre-change reproduction confirmed the loader digit animation duration was longer than the early countdown cadence, explaining the repeated restart/jumpy feel.

After the latest correction:
- focused timing/inertia contract script: **PASS**;
- strict TypeScript compile of updated `countdownTiming.ts`, `inertia.ts`, and reveal sample types: **PASS**;
- GitHub source inspection confirms the pre-hidden tagline, reduced line offset, line recenter-before-rotation, 24px vertical overscan, and black Explore-under-compositor stacking are present.

### Earlier reveal-core verification
The age-aware implicit liquid core previously verified:
- pure lifetime behavior: 2/2 pass;
- dependency-free TypeScript compile: pass;
- field/composite GLSL compile + link in Chromium WebGL2: pass;
- synthetic render: solid interior, rounded endpoint, geometric contraction, no fog halo.

## Verification still required on the user's network-enabled machine

After pulling the latest branch, run:

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Then visually check:
- EXPLORE is black on the untouched white hero and white only inside the liquid reveal;
- horizontal loader line sits closer to the zero/tagline;
- tagline never flashes before its intended entrance;
- rotated vertical line reaches past both top and bottom viewport edges;
- a fast mouse stop produces only a few visible rogue forward patches rather than moving the entire blob;
- slow stops produce essentially no inertia;
- digit changes crossfade softly without vertical jumping;
- 10→0 progressively slows and `0` visibly rests before the line begins;
- countdown zero does not jump when it becomes the completion zero.

Optional Nothin diagnostic:

```bash
npm run probe:nothin
```

## Visual acceptance checklist
- no smoke/fog tail;
- no broad translucent residue;
- proper rounded terminal blob;
- smaller normal reveal radius;
- visible but sparse velocity-based rogue patches after meaningful motion;
- main blob remains anchored when pointer stops;
- solid trail during hold stage;
- oldest region retracts geometrically;
- bridges may pinch naturally;
- detached remnants stay rounded;
- fast pointer path remains continuous;
- front/back typography registration remains exact;
- countdown/completion zero registration remains exact;
- autonomous reveal still exposes the intended brand area;
- Explore transition still hands directly into black First Impression.

## Next design phase

Once this intro refinement is accepted, continue with **First Impression** art direction/copy/entrance, then Selected Work. Navigation remains intentionally undecided.
