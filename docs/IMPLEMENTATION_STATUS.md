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
- existing `0` → line → tagline → vertical/twin-line choreography preserved.

### Hero layout
- front/reveal typography share one registered composition;
- centered Inter Tight heavy typography;
- approved horizontal WEBERAISE lockup;
- shared typography/brand composition shifted slightly upward;
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

The repo now contains a dependency-free runtime probe:

```bash
npm run probe:nothin
```

It launches local Chrome/Chromium through CDP and records publicly delivered WebGL characteristics under `.diagnostics/`, including program/shader metadata, uniform names, framebuffer/texture allocations and draw-call structure. Captured shader text is analysis-only and must not be transplanted into Weberaise.

Reference:
- `docs/reference/NOTHIN_RUNTIME_PROBE.md`

### Offline prototype
`prototype/reveal-engine.js` now mirrors the age-aware implicit-field model rather than the old density-feedback implementation.

## Verification evidence for the newest reveal core

### Pure lifetime model — red/green TDD
A standalone behavior test was first run without the implementation and failed with `ERR_MODULE_NOT_FOUND`. After implementing the lifetime helpers, the same test produced:

```text
2 tests
2 pass
0 fail
```

### Dependency-free TypeScript compile
The newest `RevealEngine.ts`, `shaders.ts`, `quality.ts`, `liquidLifetime.ts`, and reveal types were compiled together with TypeScript 5.8.3 using strict mode, ES2022, bundler resolution and DOM libs.

Result: exit code `0`.

### Actual GLSL compile/link
The newest field and composite shaders were compiled and linked in Chromium WebGL2 under Xvfb/SwiftShader.

Result:

```text
webgl2: true
field vertex: compile PASS
field fragment: compile PASS
field program: link PASS
composite vertex: compile PASS
composite fragment: compile PASS
composite program: link PASS
```

### Synthetic visual inspection
The actual implicit-field shaders were rendered through Chromium at several age snapshots. The result shows:
- solid filled liquid interior;
- rounded terminal blob;
- contour contraction instead of transparency fade;
- progressive necking/pinch behavior as old primitives shrink;
- no fog/smoke halo.

This validates the intended mechanism, but it is **not** a substitute for side-by-side comparison against the live Nothin site.

## Verification still required on the user's network-enabled machine

After pulling the latest branch:

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Then run the Nothin diagnostic in a normal headed browser environment:

```bash
npm run probe:nothin
```

Inspect:

```text
.diagnostics/nothin-webgl.json
.diagnostics/nothin-shaders.txt
```

Use those results for the next evidence-based tuning pass, especially:
- field/render-target resolution;
- pass count;
- texture formats;
- uniforms suggesting blur/threshold/SDF/metaball/feedback behavior;
- actual surface breakup/dissolve behavior.

## Visual acceptance checklist
- no smoke/fog tail;
- no broad translucent residue;
- proper rounded terminal blob;
- solid trail during hold stage;
- oldest region retracts geometrically;
- bridges may pinch naturally;
- detached remnants stay rounded;
- fast pointer path remains continuous;
- front/back typography registration remains exact;
- autonomous reveal still exposes the intended brand area;
- Explore transition still hands directly into black First Impression.

## Next design phase

Once this reveal is accepted, continue with **First Impression** art direction/copy/entrance, then Selected Work. Navigation remains intentionally undecided.
