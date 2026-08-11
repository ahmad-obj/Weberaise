# Nothin-Inspired Reveal Rebuild Design

## Goal

Replace the current density-feedback hero reveal with a solid, age-aware liquid mask whose visible behavior is substantially closer to the reference behavior on `noth.in`: cohesive filled blobs, clean contour motion, geometric contraction during healing, natural necking/pinch-off, and no smoky/foggy low-alpha trail.

## Evidence from the reference

Publicly available sources identify Nothin's implementation stack as Webflow + GSAP + Three.js/WebGL, with custom shader work credited by the developer. The exact proprietary production shader is not treated as reusable source code. We will inspect publicly delivered runtime characteristics only to understand architecture and rendering behavior.

## Core architecture

The current system stores a decaying scalar density field and thresholds it. That makes old trail energy progressively translucent and is the main reason the result can read as smoke/fog even with aggressive thresholding.

The replacement uses an **age-aware implicit surface / level-set model**:

1. Pointer samples are still interpolated outside React.
2. Each sample becomes a time-stamped liquid primitive with position, radius, velocity, strength, and birth time.
3. Consecutive primitives are rendered as overlapping rounded metaball/capsule contributions, creating a connected field.
4. Primitive radius remains almost unchanged for the persistence phase, then shrinks according to age during the healing phase.
5. The final surface is extracted with a narrow threshold band. Low field values are fully discarded instead of rendered translucently.
6. Small low-frequency contour deformation is applied only near the surface.
7. When shrinking primitives no longer overlap strongly enough, bridges naturally narrow and pinch apart into rounded islands.
8. Islands continue shrinking and disappear without leaving transparent residue.

This is not a full Navier-Stokes fluid solver. It is designed around the exact desired visual behavior and keeps the simulation controllable and performant.

## Lifetime model

Target perceptual life remains approximately 3–4 seconds.

The primitive lifetime is split into two stages:

- **Hold stage (~55–65% of life):** radius stays close to full size so the trail remains solid and readable.
- **Contraction stage (~35–45% of life):** radius eases down nonlinearly toward zero. The boundary therefore moves inward rather than fading in place.

Opacity is not used as the primary healing mechanism. Pixels are either inside the liquid surface or outside it, except for the narrow antialiasing band at the contour.

## Shape behavior

- Stroke ends must terminate as proper rounded blobs.
- Fast movement remains continuous through interpolated capsules/overlapping primitives.
- Adjacent strokes merge smoothly when their fields overlap.
- Narrow bridges can pinch off as old primitives shrink.
- Detached remnants stay rounded rather than becoming speckled noise.
- Velocity may slightly stretch or offset the field locally, but there is no broad advection drift.
- No turbulence, ripple propagation, smoke, grain cloud, or watery splash behavior.

## Surface character

The interior reveal is binary/solid.

The visible contour gets only subtle low-frequency movement. The contour deformation amplitude must be small relative to the primitive radius and should not create noisy hair-like edges. Temporal hash grain is prohibited.

## Quality profiles

### Full
- high enough field resolution to keep the contour clean on desktop;
- age-aware primitives;
- capsule/implicit union;
- subtle contour deformation;
- pinch-off behavior preserved.

### Lite
- lower field resolution;
- fewer active primitives;
- same shrink/healing model;
- reduced or disabled contour deformation.

### Reduced motion
- solid reveal remains available;
- no autonomous contour motion;
- shorter/simpler healing.

### No WebGL
- retain the existing intentional fallback rather than expose a broken canvas.

## Nothin runtime probe

Add a dependency-free local diagnostic script for the user's machine. It will launch an installed Chromium/Chrome executable through the Chrome DevTools Protocol and inject hooks before site scripts execute.

The probe may record publicly observable WebGL metadata such as:

- shader source strings passed to `shaderSource()` for analysis only;
- shader/program counts;
- uniform names requested by the application;
- framebuffer and texture allocation dimensions/formats;
- draw-call/program usage counts relevant to the hero interaction;
- WebGL1 vs WebGL2 usage.

The probe output is written locally as JSON/text under a gitignored diagnostics directory. It is used to compare architecture and parameter scale only. We do not copy proprietary shader code into Weberaise.

## Acceptance criteria

1. A stopped stroke ends as a visibly solid rounded blob.
2. Old trail remains visually solid through the hold phase.
3. Healing visibly contracts the boundary inward.
4. No low-alpha fog/smoke halo remains after the contour passes.
5. Thin bridges may naturally neck and pinch apart.
6. Detached remnants remain smooth/rounded until disappearance.
7. Fast pointer paths contain no dotted gaps.
8. Overlapping paths union smoothly.
9. Idle motion is subtle surface settling only; the entire field does not drift.
10. Autonomous intro stroke uses the exact same primitive/healing system.
11. Explore bottom-fill behavior remains unaffected unless later visual comparison calls for a separate refinement.
12. Final browser evaluation is performed side-by-side against Nothin's visible reveal behavior, not only by automated tests.

## Non-goals

- Reproducing Nothin's proprietary source code verbatim.
- Adding full fluid pressure/velocity simulation unless direct evidence demonstrates it is necessary.
- Changing the already approved centered loader, radial vignette, hero vertical offset, page-state architecture, or Explore flow in this pass.
