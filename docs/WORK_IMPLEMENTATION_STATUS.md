# Weberaise Work Page — Phase 1 Infinite Menu Rework Status

**Branch:** `feature/work-spherical-showcase`  
**Design:** `docs/superpowers/specs/2026-08-14-work-infinite-menu-sphere-rework-design.md`  
**Plan:** `docs/superpowers/plans/2026-08-14-work-infinite-menu-sphere-rework.md`  
**Locked decisions:** `docs/superpowers/plans/2026-08-14-work-infinite-menu-sphere-rework-locked-decisions.md`  
**Date:** 2026-08-14

## Current Phase

Phase 1 is intentionally limited to the **browse sphere**. The previously built project-opening/showcase/return system was rejected and has been removed from the live implementation. Project selection/expansion will be redesigned only after the sphere itself is visually accepted.

## Implemented

### Opening and page shell
- dedicated `/work` route;
- `OUR WORKS` remains the only visible opening content;
- sphere/media preparation stays hidden behind that opening;
- dense sphere enters through the approved oversized-to-normal `5 → 1` establishing scale;
- full-viewport fixed canvas with no card-grid/container constraint;
- scroll remains locked while the sphere owns the viewport.

### Infinite Menu sphere core
- direct WebGL2 renderer with a single instanced draw;
- exact full icosahedron base from the supplied ReactBits Infinite Menu source;
- one shared-edge subdivision creates exactly **42 unique sphere positions**;
- every position is spherized to radius **2**;
- sphere density is completely independent of project count;
- project identity is `instanceId % projectCount`;
- one project therefore repeats across all 42 positions;
- six projects repeat cyclically across the full 42-position sphere;
- no sparse 12-slot mode remains.

### 4:3 website surfaces
- circular discs are replaced by a fixed **4:3** website surface;
- each surface is a 6 × 4 cell mesh: 35 vertices / 48 triangles / 144 indices;
- triangle winding faces +Z before tangent placement so front-facing instances survive WebGL back-face culling;
- surface base scale is locked at `0.34` for the first visual comparison;
- depth scaling follows the reference `abs(z / radius) * 0.6 + 0.4` model;
- every deformed rectangular-mesh vertex is re-projected to the instance sphere radius in the vertex shader, so tiles read as part of one sphere rather than rigid cards floating around it;
- corners are only mildly rounded;
- 16:10 website media is center-cropped into the 4:3 surface instead of stretched.

### Reference interaction mechanics
- dependency-free port of the supplied ReactBits arcball behavior;
- reference virtual-sphere pointer projection with radius 2;
- reference pointer delta intensity and angle amplification;
- quaternion accumulation and normalization;
- reference pointer-rotation release slerp;
- smoothed combined quaternion for rotation-axis/velocity derivation;
- reference snap direction `[0, 0, -1]`;
- nearest-vertex lookup uses inverse orientation, matching Infinite Menu;
- distance-sensitive magnetic snap behavior;
- camera resting Z is `3 * scaleFactor`;
- energetic drag adds `rotationVelocity * 80 + 2.5` to camera target Z;
- drag/rest camera damping follows the reference 7/5 time-scaled behavior;
- velocity-based surface deformation remains present;
- depth alpha follows the reference front/back fade character.

### Phase 1 interaction scope
- pointer/touch performs sphere drag only;
- pointer release only ends arcball interaction;
- project picking is removed;
- project activation is removed;
- old transition bridge is removed;
- old project showcase component is removed;
- old showcase placeholder styles are removed;
- old screen-projection bridge helper is removed;
- active metadata follows the sphere's nearest focused instance only; there is no hover-override path;
- arrow-key/semantic navigation snaps to sphere instances without opening projects.

### Media/performance
- all 42 instances can display project posters without creating 42 decoders;
- full desktop profile still caps live browse sources at three;
- repeated instances are **project-deduplicated** when allocating live preview sources;
- 1 project repeated 42× consumes at most 1 live source;
- 2 projects consume at most 2;
- 6+ projects consume at most 3 on the full desktop profile;
- procedural development previews use the same bounded live-texture slots;
- procedural placeholder texture updates are capped at 24fps;
- reduced-motion placeholder previews hold after their initial frame;
- hidden tabs pause RAF/media work.

### Responsive/accessibility
- desktop, tablet and mobile retain the same true 42-position sphere model;
- mobile changes camera/quality profile rather than degrading to 2–3 cards;
- reduced motion keeps the dense sphere but removes aggressive deformation/inertial behavior;
- no-WebGL fallback remains a usable static project gallery and no longer exposes the rejected Phase 2 showcase;
- canvas remains decorative to assistive technology;
- semantic project controls remain available for keyboard/screen-reader navigation and only snap the sphere in Phase 1.

### Development placeholders
- six clearly labeled `PLACEHOLDER 01`–`PLACEHOLDER 06` records remain so the dense repeated sphere can be inspected immediately;
- they are development fixtures, not client claims;
- the six identities repeat over all 42 sphere instances automatically;
- removing all fixtures still returns the page to the honest empty state.

## Verification Evidence

Full Next.js verification is not available in this execution environment because the repository cannot be cloned/network-installed here. Chromium is installed, but this container also fails to initialize EGL/SwiftShader, so browser WebGL shader compile/link could not be meaningfully executed.

Fresh isolated checks performed against the rewritten core:

- one-subdivision icosphere produces exactly 42 positions: **PASS**;
- every sphere position has radius 2: **PASS**;
- sphere density is independent of 1 / 6 / 17 project counts: **PASS**;
- 1-project and 6-project modulo repetition: **PASS**;
- 4:3 mesh has 35 vertices and 144 indices: **PASS**;
- front-facing mesh winding: **PASS**;
- arcball movement changes a normalized orientation quaternion: **PASS**;
- released pointer rotation settles: **PASS**;
- nearest-vertex magnetic snap converges to reference `-Z`: **PASS**;
- dynamic camera pulls outward under motion and returns toward rest: **PASS**;
- 42-slot keyboard wrapping: **PASS**;
- repeated-project live-source deduplication: **PASS**;
- desktop projection/framing simulation shows a dense field (roughly 18 instance centers within the expanded viewport region while the rest continue around/offscreen): **PASS**;
- source scan confirms no `createProjectQuad`, `onProjectActivate`, or `projectOpening` live references: **PASS**.

WebGL shader source now contains the required spherical reprojection/deformation/depth-alpha mechanics, but **GLSL compile/link is not claimed as verified** because the container cannot establish a WebGL/EGL context.

GitHub has no status checks attached to this branch, so CI provides no additional evidence.

## Required User-Machine Verification

After pulling this branch, run:

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Then inspect `/work` primarily against the ReactBits Infinite Menu reference. Phase 1 visual acceptance asks only:

> Does this now feel like ReactBits Infinite Menu with 4:3 website previews instead of circular photos?

Judge:
- sphere density/repetition;
- drag weight;
- release/inertia character;
- camera pull-back;
- snap behavior;
- spherical curvature;
- tile size/collision balance;
- depth scale/fade;
- velocity deformation;
- desktop/mobile framing.

Do **not** judge project opening yet: clicking/expansion is intentionally disabled until Phase 2 is separately designed.

## Parallel-Branch Constraint

Homepage, floating navigation, Services and Work continue independently. This Work branch must be reconciled against the final integration branch only after those parallel changes settle; do not copy stale homepage/navigation/Services files into Work.
