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
- digit replacement now uses cadence-aware transition duration rather than one fixed animation duration;
- replacement motion is a soft crossfade with only ~5px vertical travel and very small scale change;
- 10→0 progressively slows, with 5→0 deliberately paced;
- the real countdown `0` holds for `700ms` before the completion phase begins;
- countdown `0` and completion `0` share `.loader-zero-glyph` font metrics and the same viewport-center registration;
- tagline is exactly `Need a website for business?`;
- completion line now uses `min(92vw, 1100px)` so it comfortably covers the tagline;
- existing `0` → line → tagline → vertical/twin-line choreography is preserved.

### Hero layout
- front/reveal typography share one registered composition;
- centered Inter Tight heavy typography;
- approved horizontal WEBERAISE lockup;
- shared typography/brand composition is now raised to approximately `-4.2vh` on desktop, with a gentler mobile offset;
- `EXPLORE` stays bottom-anchored and uses `mix-blend-mode: difference`, so it is black on the white hero and white wherever the black reveal crosses behind it;
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
- normal pointer radius is reduced to `0.078` desktop / `0.10` mobile;
- interpolation spacing is tightened so the smaller radius still produces a continuous stroke;
- pointer stop now triggers a short velocity-based afterglide after a ~48ms idle threshold;
- afterglide is bounded to about 3.8% viewport-space maximum carry;
- it advances only a smaller/weaker portion of the liquid surface, rather than moving the entire blob as a sphere;
- deterministic lateral wobble makes the advancing edge slightly irregular without spray/smoke;
- afterglide radius and strength decrease across ~340ms;
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

### New loader/inertia polish — red/green TDD
A focused pre-change reproduction was run against the previous values. All five new acceptance checks failed for the expected reasons: old pointer radius, missing cadence-driven transition helper, narrower line, lower hero offset, and fixed digit animation duration.

After the patch, the same focused checks produced:

```text
5 tests
5 pass
0 fail
```

### New pure TypeScript helpers
`countdownTiming.ts`, `inertia.ts`, and reveal sample types were compiled with TypeScript 5.8.3 in strict mode using ES2022 + bundler resolution.

Result: exit code `0`.

### Earlier reveal-core verification
The age-aware implicit liquid core previously verified:
- pure lifetime behavior: 2/2 pass;
- dependency-free TypeScript compile: pass;
- field/composite GLSL compile + link in Chromium WebGL2: pass;
- synthetic render: solid interior, rounded endpoint, geometric contraction, no fog halo.

## Verification still required on the user's network-enabled machine

The sandbox cannot clone/install the GitHub checkout because outbound DNS is unavailable. After pulling the latest branch, run:

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Then visually check:
- smaller reveal footprint still remains continuous;
- stopping after a fast motion produces only a small forward irregular lobe;
- slow stops produce essentially no inertia;
- digit changes feel smooth rather than abrupt;
- 10→0 progressively slows and `0` visibly rests before the line begins;
- the countdown zero does not jump when it becomes the completion zero;
- `Need a website for business?` is fully covered by the horizontal line width;
- shared hero composition is slightly higher;
- EXPLORE turns white wherever the black reveal crosses it.

Optional Nothin diagnostic:

```bash
npm run probe:nothin
```

## Visual acceptance checklist
- no smoke/fog tail;
- no broad translucent residue;
- proper rounded terminal blob;
- smaller normal reveal radius;
- small velocity-based inertial overrun only after meaningful motion;
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
