# Weberaise Work Page — Infinite Menu Sphere Rework Design

**Date:** 2026-08-14  
**Branch:** `feature/work-spherical-showcase`  
**Status:** Approved Phase 1 design; supersedes the sparse sphere portions of the earlier Work design.  
**Reference implementation:** ReactBits `InfiniteMenu`, using the exact source supplied by the user in conversation.

## 1. Purpose

Rebuild the Work browse sphere so it behaves and reads like the ReactBits Infinite Menu interaction rather than a sparse custom spherical gallery.

This phase is deliberately narrow:

- recreate the ReactBits sphere feel first;
- use Weberaise 4:3-ish rectangular website surfaces instead of circular discs;
- preserve dense repetition regardless of real project count;
- temporarily ignore project-opening/showcase transitions until the base sphere itself is accepted.

The acceptance standard is visual and behavioral similarity to ReactBits Infinite Menu. If the Weberaise rectangles were replaced by circles, the result should feel extremely close to the reference component.

## 2. Core correction from the first implementation

The previous implementation used only 12 stable directions derived from a minimal icosahedron seed. This caused sparse floating cards and made the scene read as cards around a sphere rather than a continuous spherical menu.

That architecture is rejected for Phase 1.

The new implementation follows the reference geometry model:

1. create a full icosahedron;
2. subdivide once;
3. spherize the resulting vertices to a fixed sphere radius;
4. create one instanced website surface per resulting vertex;
5. map project identities to instances using modulo repetition.

The sphere slot count is therefore independent of the project count.

## 3. Reference behavior to preserve

The supplied ReactBits source is the behavioral authority for this phase.

### 3.1 Dense icosphere distribution

Reference behavior:

- `IcosahedronGeometry()` creates the base polyhedron;
- `.subdivide(1)` increases vertex density;
- `.spherize(SPHERE_RADIUS)` projects all resulting vertices onto the sphere;
- all resulting vertices become instance positions.

Expected density is roughly 42 surface positions after one subdivision.

This is the density target for the first Weberaise rework. It may be tuned only if necessary after visual comparison, but project count must never reduce density.

### 3.2 Repetition rule

Reference shader mapping:

```glsl
int itemIndex = vInstanceId % uItemCount;
```

Weberaise must preserve the same semantic rule.

Examples:

- 1 project → the same project repeats across every sphere slot;
- 2 projects → alternating/repeating across all slots;
- 6 projects → repeated cyclically throughout the globe;
- 40+ projects → instances continue mapping through the project set using modulo logic.

No sparse mode exists.

### 3.3 Arcball interaction

The current custom arcball implementation is not authoritative for Phase 1.

The new implementation should closely reproduce the supplied reference behavior:

- same virtual-sphere projection concept;
- same pointer-delta interpolation;
- same rotation amplification;
- same quaternion accumulation;
- same pointer-rotation decay toward identity after release;
- same derived rotation axis and smooth rotation velocity;
- same time-scaled behavior around a 60fps target frame duration.

The goal is not merely "drag rotates sphere." The drag weight, momentum, easing and release feel should closely match ReactBits.

### 3.4 Magnetic nearest-item snap

When pointer interaction ends:

- determine the sphere vertex nearest the reference snap direction;
- map it to the active project through modulo project indexing;
- set that world-space vertex direction as the arcball snap target;
- smoothly rotate until that instance settles at the ideal front focus direction.

This should use the same distance-sensitive snap weighting pattern as the reference rather than a carousel-like fixed easing.

### 3.5 Dynamic camera response

The camera is part of the interaction, not a fixed observer.

Reference behavior to preserve:

- resting camera Z is `3 * scaleFactor`;
- while dragging, camera target Z increases based on rotation velocity plus an offset;
- the camera therefore pulls backward during energetic movement;
- after release it settles back inward;
- the effect contributes heavily to the perceived elasticity and depth of Infinite Menu.

The Weberaise version must implement this behavior before any custom tuning.

### 3.6 Depth scaling

Each surface scales according to its sphere-space Z depth.

Reference logic:

```text
s = abs(z / sphereRadius) * SCALE_INTENSITY + (1 - SCALE_INTENSITY)
finalScale = s * baseScale
```

This gives front/back-facing items a different perceived size and helps define the globe.

Weberaise should preserve this depth-response concept, tuned only for the rectangular 4:3 surface.

### 3.7 Depth alpha

The reference vertex shader computes alpha from normalized world-space Z.

The Weberaise sphere should preserve a comparable depth fade so rear/peripheral elements remain part of the globe without competing visually with the focused front field.

### 3.8 Velocity deformation

A major part of the reference feel is motion-responsive surface deformation.

The supplied shader:

- derives a stretch direction from the instance center and rotation axis;
- computes relative vertex strength;
- scales deformation using smooth rotation velocity;
- offsets world-space vertices during motion;
- then re-projects those deformed vertices back to the sphere radius.

This effect must be preserved conceptually and closely in mechanics.

It should remain subtle enough for websites to stay readable, but it must be present because it contributes materially to the fluid/elastic Infinite Menu character.

## 4. Weberaise surface primitive

The only major visual primitive change from ReactBits is the item geometry.

### 4.1 Shape

Locked choice: **A — 4:3-ish landscape rectangle**.

Target aspect ratio:

- approximately `1.30:1` to `1.35:1`;
- enough horizontal space to resemble a website viewport;
- compact enough that 40+ instances still form a convincing dense globe.

Do not use 16:9 or very wide browser-card proportions in Phase 1 because that would create collisions and weaken the spherical rhythm.

### 4.2 Corners

- mildly rounded only;
- no pill treatment;
- no heavy card chrome;
- surfaces should read as image/website canvases, not dashboard cards.

### 4.3 Rectangular mesh subdivision

A single four-vertex quad is insufficient if we want the same surface-conforming behavior as the reference.

The rectangle should be built as a small subdivided grid mesh, for example several columns and rows of vertices.

Every vertex then participates in the reference-style sphere reprojection:

```glsl
worldPosition.xyz = radius * normalize(worldPosition.xyz);
```

This lets the rectangular website surface curve subtly with the sphere rather than behaving as a rigid flat billboard.

The curvature must be visible enough to unify the sphere but not so strong that the preview becomes unreadable.

### 4.4 Surface orientation

Use the reference matrix construction model:

- position from the current rotated sphere vertex;
- orient each surface tangentially using target-to-style math;
- scale by depth response;
- translate relative to the sphere radius in the same conceptual order as the reference.

The result should feel embedded in the sphere surface.

## 5. Media behavior during Phase 1

The existing bounded preview media system may be reused, but it must adapt to the new dense instance model.

### 5.1 Project identity versus instance identity

Multiple instances can map to the same project.

The media system must therefore distinguish:

- `instanceId` / sphere slot;
- `projectIndex = instanceId % projectCount`.

Do not create a separate decoder for every repeated instance.

### 5.2 Live preview cap

Keep a bounded number of live website previews:

- active/front project gets first priority;
- a few nearest/high-priority instances may receive live textures;
- repeated copies of the same project may share/reuse the same decoded project media where practical;
- remaining sphere instances display sharp poster frames.

The dense sphere must not imply 42 simultaneous video decoders.

### 5.3 Development placeholders

The six placeholder projects remain available during Phase 1 so the effect is visible immediately.

Because repetition is now instance-driven, the six placeholders repeat across all sphere positions automatically.

The procedural preview fixture may remain for development, but it must not alter the sphere mechanics or density.

## 6. Active project behavior

Phase 1 preserves only the reference-like active-item behavior.

- The nearest front sphere instance determines the active project when not dragging.
- The active project identity is `nearestInstanceId % projectCount`.
- Browse metadata can continue showing project name/category.
- Metadata should fade or soften while the sphere is moving, comparable to the reference's active/inactive overlays.

Do not implement click expansion in Phase 1.

Click/tap may be temporarily disabled or no-op while the sphere is being evaluated.

## 7. Entrance behavior

The previously approved page opening remains:

1. `OUR WORKS` appears alone;
2. background/project media preparation happens invisibly;
3. text exits through a simple restrained transition;
4. the dense sphere enters with the ReactBits-style establishing motion;
5. interaction enables only after the entrance settles.

The sphere entrance must reveal the complete dense globe immediately, not gradually add sparse elements.

## 8. Responsive behavior

### Desktop

- full dense sphere;
- roughly reference-like camera/framing;
- fine-pointer drag;
- high-quality front preview;
- same overall interaction energy as ReactBits.

### Tablet / coarse pointer

- preserve same sphere model;
- no fallback carousel/list merely because pointer is coarse;
- touch drag uses the same arcball system;
- tune scale/camera only as required to avoid clipping.

### Mobile

- still a true dense sphere;
- same repeated instance principle;
- camera/framing can pull back slightly;
- live media count can be reduced;
- geometry density should remain high enough that it unmistakably reads as Infinite Menu.

Do not reduce mobile to 2–3 cards.

## 9. Reduced motion

Reduced motion must preserve content but remove aggressive kinetics.

- no inertia-heavy after-motion;
- much faster/near-immediate snapping;
- minimal velocity deformation;
- no automatic procedural/video movement unless directly initiated;
- sphere remains navigable and visually dense.

## 10. Performance rules

The rework must retain premium visual fidelity without unnecessary GPU/decoder cost.

Required principles:

- one instanced WebGL draw for the repeated rectangular geometry;
- bounded texture/video pool independent of sphere instance count;
- poster atlas or equivalent efficient project texture source;
- DPR cap appropriate to device capability;
- no DOM node per sphere instance;
- no one-video-element-per-instance architecture;
- pause render/media work when the page is hidden;
- no quality reduction visible on the active/front project.

## 11. Explicit removals from the current implementation

Phase 1 may delete or replace any of the following where they conflict with the reference:

- 12-slot sparse geometry;
- custom minimal icosahedron direction builder;
- current custom arcball mechanics;
- current custom fixed camera behavior;
- current sparse scaling/deformation logic;
- any interaction logic whose purpose exists only for the current project-opening bridge.

Do not preserve flawed code merely because it already exists.

## 12. Out of scope for Phase 1

The following are explicitly deferred:

- project click/open transition;
- full project showcase choreography;
- sphere-to-DOM bridge;
- full-video handoff;
- back/return animation;
- URL project state;
- final project copy/content design.

These will be redesigned only after the base sphere is visually accepted.

## 13. Testing strategy

### Geometry tests

Verify:

- one subdivision creates the expected dense vertex count;
- all instance positions lie on the target sphere radius;
- instance count remains constant regardless of project count;
- modulo mapping repeats project identities correctly;
- 1 project fills every slot;
- 6 projects repeat cyclically across the full slot set.

### Control tests

Verify:

- orientation quaternion remains normalized;
- pointer movement changes orientation;
- release decays toward rest;
- nearest-vertex snapping converges to the reference snap direction;
- camera target moves outward with significant rotation velocity and returns inward at rest.

### Mesh/shader tests

Verify:

- rectangular surface aspect is approximately 4:3;
- rectangular mesh contains interior/subdivision vertices, not only four corners;
- deformation preserves sphere-radius projection;
- depth scaling and alpha remain bounded;
- velocity deformation is disabled/reduced in reduced-motion mode.

### Media tests

Verify:

- repeated instances do not create unbounded decoders;
- active/front project receives live-preview priority;
- static copies use poster data cleanly;
- project repetition does not duplicate project metadata incorrectly.

## 14. Visual acceptance checklist

Phase 1 is accepted only if all are true:

- sphere looks densely filled like ReactBits Infinite Menu;
- one project still fills the entire sphere through repetition;
- six projects repeat naturally instead of producing only six visible surfaces;
- sphere reads as one continuous spherical system, not floating cards;
- 4:3 surfaces remain visibly website-like;
- surface curvature feels integrated with the globe;
- drag weight and release feel close to ReactBits;
- camera pulls back dynamically during energetic movement;
- magnetic snap settles smoothly on the nearest item;
- depth scale/fade matches the reference character;
- motion deformation is visible but controlled;
- no project-opening glitches can occur because project opening is disabled for this phase;
- desktop, touch and mobile all preserve the same conceptual sphere.

## 15. Phase 1 completion condition

The only completion question is:

> Does the Weberaise browse sphere now feel like ReactBits Infinite Menu with 4:3 website previews instead of circular photos?

If the answer is no, do not proceed to project-opening design.

If the answer is yes, Phase 2 begins by redesigning project selection/expansion on top of the accepted sphere.
