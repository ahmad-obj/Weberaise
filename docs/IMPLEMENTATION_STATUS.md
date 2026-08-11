# Weberaise Implementation Status

**Milestone:** Signature intro + Explore handoff foundation  
**Branch:** `feature/signature-intro`  
**Date:** 2026-08-11

## Implemented

### Experience flow
- explicit one-route experience reducer;
- scroll locked throughout loader/hero;
- `EXPLORE` is the only transition into normal scroll state;
- First Impression is mounted/prepared before handoff.

### Loader
- real weighted critical-resource registry;
- every displayed integer can be traversed from 100→0;
- `0` is gated by true readiness;
- progress updates are React-observable so the countdown cannot remain asleep at `100` after assets complete;
- **all countdown integers are now fixed at viewport center**;
- no required blank frame between number handoffs;
- masked zero/tagline line choreography;
- line contracts partially, rotates, expands vertically, and hands off to twin-line opening.

### Hero opening/layout
- twin lines move outward with black curtains so only traversed regions expose the hero;
- no global opacity shortcut;
- front/reveal `WELCOME / TO` share one typography component;
- centered large Inter Tight direction is encoded in production CSS/font setup;
- approved horizontal WEBERAISE asset used in the hidden brand slot;
- shared typography/brand composition is shifted slightly upward as one registered unit;
- light hero receives an extremely faint radial edge vignette (~2.6% maximum black influence at the far perimeter).

### Interactive reveal
- WebGL2 low-resolution ping-pong history engine;
- continuous pointer interpolation;
- bounded velocity injection;
- thick rounded high-viscosity trail;
- explicit full/lightweight/no-WebGL quality profiles;
- pointer loop avoids React state;
- tiny custom cursor on fine pointers;
- once-only autonomous reveal uses same sample pipeline;
- first brand raster upload explicitly waits for image decode;
- **2026-08-11 refinement:** high-frequency temporal hash grain removed;
- **2026-08-11 refinement:** composite boundary tightened to a narrow high threshold (`0.40→0.47`) so low-density history is invisible instead of fog-like;
- **2026-08-11 refinement:** advection/settling and velocity injection reduced substantially;
- **2026-08-11 refinement:** splat solid core increased so stroke endings remain proper rounded blobs;
- **2026-08-11 refinement:** full-quality persistence increased to `2.75s` half-life so the clean threshold still yields roughly 3–4s visible lifetime;
- **2026-08-11 refinement:** full-quality history short axis raised up to 512px for cleaner contours.

### Nothin reference inspection
Public sources were inspected before the refinement:
- developer Thomas Carré publicly describes Nothin as built with Webflow, GSAP, WebGL and custom shaders;
- independent stack analysis identifies Three.js and Lenis as well;
- this supports treating the reference reveal as a custom shader-driven mask/compositor rather than CSS blur/fade.

The Weberaise implementation reproduces the approved observable qualities without wholesale copying proprietary deployed source.

### Explore handoff
- shared reveal engine switches to bottom-fill mode;
- bottom black crest rises without route navigation;
- scrolling remains locked until full coverage;
- black output becomes the actual First Impression foundation.

### Content integrity
- downstream semantic section structure preserved;
- fake metrics/testimonials/projects were not invented;
- unresolved proof, audit, imagery and contact workflows stay explicit TODOs.

## Verification evidence

### Earlier sandbox verification
Before the latest refinement pass, the dependency-free/prototype verification produced:

```text
22 tests
22 pass
0 fail
```

and the Chromium WebGL prototype capture reported zero console/page errors.

Those results apply to the pre-refinement tree and must not be treated as fresh verification of the newest shader/CSS changes.

### User-machine runtime evidence
The user successfully installed dependencies and started the actual Next.js application after upgrading to Next.js 16.3.0:

```text
Next.js 16.3.0 (Turbopack)
Ready
GET / 200
```

The first local verification attempt then exposed two toolchain issues:
- Node 24.18.0 on the user's Kali build has built-in TypeScript stripping disabled;
- two explicit `.ts` production import suffixes failed TypeScript/Next type checking.

Branch fixes already applied:
- tests now use `tsx` rather than Node built-in stripping;
- production imports returned to normal extensionless TypeScript imports.

The user has not yet supplied a fresh `npm test`, `npm run typecheck`, and `npm run build` result after those fixes and after the newest visual refinement pass. Therefore those checks remain pending.

## Current local verification request
After pulling the latest `feature/signature-intro`, run:

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Then visually inspect:
- countdown stays centered;
- edge vignette is barely perceptible;
- hero composition is slightly higher without breaking front/reveal registration;
- pointer trail has a clean coherent border;
- old marks contract/erode without smoke/fog;
- stroke endpoint remains a rounded blob;
- autonomous reveal and Explore handoff still behave correctly.

## Next design phase

After this refinement is accepted, return to **First Impression**:
- final copy;
- exact black-state entrance choreography;
- composition and typography;
- whether/when it transitions toward a lighter state;
- handoff into Selected Work.

Navigation remains intentionally undecided.
