# Weberaise Work Sphere — No Tile Wiggle Design

**Date:** 2026-08-14  
**Branch:** `feature/work-spherical-showcase`  
**Status:** Approved behavior change; implementation pending.

## Goal

Remove the per-project elastic/wiggle deformation from the Work sphere to reduce unnecessary per-vertex GPU work while preserving the accepted Infinite Menu sphere behavior.

## Remove

The vertex-shader deformation path driven by rotational velocity:

- `uRotationAxisVelocity` usage for tile stretching;
- `uDeformation` usage for tile stretching;
- stretch-direction / relative-vertex / deformation-strength calculations;
- engine-side uniform plumbing that exists only to feed that deformation.

## Preserve exactly

- 42-instance once-subdivided icosphere density;
- modulo project repetition across all 42 slots;
- 4:3 subdivided website surfaces;
- sphere-surface reprojection/curvature;
- arcball drag behavior;
- sphere rotational inertia/release behavior;
- nearest-item magnetic snapping;
- dynamic camera pull-back and settle;
- depth-driven tile scaling;
- depth alpha/fade;
- `OUR WORKS` opening and 5 → 1 sphere entrance;
- bounded live-preview media behavior;
- desktop/tablet/mobile sphere behavior;
- reduced-motion behavior.

## Result

Project surfaces remain rigid relative to the sphere while the entire spherical system continues moving with the accepted inertia and snap behavior. The sphere should feel the same spatially, but individual project surfaces no longer wobble, stretch, or elastically distort during motion.

## Performance intent

This change removes rotational-velocity deformation math from every rendered surface vertex. It is an optimization and visual-stability change only; it must not reduce sphere density, preview quality, or interaction quality.

## Verification

Tests/source contracts must confirm:

- shader no longer contains `uRotationAxisVelocity`, `uDeformation`, `stretchDir`, or deformation-strength logic;
- engine no longer queries/sets deformation-only uniforms;
- sphere reprojection remains present: `worldPosition.xyz = radius * normalize(worldPosition.xyz)`;
- 42-slot geometry/repetition tests still pass;
- arcball/camera/snap tests remain unchanged and pass.
