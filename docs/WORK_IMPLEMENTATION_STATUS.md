# Weberaise Work Page — Phase 2 Project Expansion Status

**Branch:** `feature/work-spherical-showcase`  
**Phase 1 design:** `docs/superpowers/specs/2026-08-14-work-infinite-menu-sphere-rework-design.md`  
**No-wiggle design:** `docs/superpowers/specs/2026-08-14-work-sphere-no-tile-wiggle-design.md`  
**Phase 2 design:** `docs/superpowers/specs/2026-08-14-work-project-expansion-phase2-design.md`  
**Phase 2 plan:** `docs/superpowers/plans/2026-08-14-work-project-expansion-phase2.md`  
**Date:** 2026-08-14

## Current Phase

Phase 2 project opening/return is implemented on top of the accepted 42-instance Infinite Menu-style browse sphere. The rejected first-generation project bridge/showcase remains deleted; this implementation uses a new bounded WebGL → DOM ownership handoff.

## Browse Sphere Preserved

The Phase 1 sphere remains the base experience:

- 42 fixed once-subdivided icosphere positions at radius `2`;
- project repetition is independent of project count;
- 4:3 subdivided website surfaces;
- base surface scale `0.34`;
- ReactBits-style arcball, inertia, nearest snap and dynamic camera pull-back;
- depth scale/fade and spherical vertex reprojection;
- bounded/de-duplicated live-preview media pool;
- no per-tile velocity wiggle/stretch deformation;
- no continuous hover/picking loop.

## Phase 2 Implemented

### One-interaction activation

- pointer/touch hit-testing occurs only on activation attempts, not in RAF;
- exact physical `slotId` is preserved separately from repeated `projectIndex`;
- fine-pointer click travel threshold is `8px`;
- coarse-pointer threshold is `14px`;
- activation duration ceiling is `550ms`;
- drag release does not open a project;
- semantic keyboard controls use the same open orchestration.

### Resolve-to-front

Before DOM takes ownership:

- free interaction is disabled;
- the exact clicked slot is repeatedly recomputed in current world orientation and snapped toward reference front `[0,0,-1]`;
- resolve readiness requires front-alignment error `<= 0.0025`;
- rotational velocity must be `<= 0.0035`;
- camera must settle within `0.01` of `3 * scaleFactor`;
- on readiness the camera is set to exact rest, view/matrices are refreshed, and orientation is frozen for deterministic screen bounds.

This avoids handing DOM a rectangle that is still drifting because of sphere rotation or camera damping.

### WebGL → DOM ownership

- selected slot screen bounds are projected from the live model/view/projection state without canvas readback;
- a fixed DOM frame appears at the exact resolved bounds;
- the DOM poster crossfades over the WebGL preview while both occupy the same rectangle, masking any live-preview/poster frame mismatch;
- only after that crossfade does the selected WebGL slot hide;
- no screenshot, `readPixels`, `getImageData`, or 42 DOM mirrors are used.

### Expansion and sphere peel

- selected DOM preview expands to a responsive near-fullscreen 16:10 destination with small margins;
- object-fit/cropping reveals more of the source rather than stretching it;
- the other 41 WebGL instances use one global `uProjectOpenProgress` value;
- non-selected radius multiplier reaches `1.48`;
- non-selected scale multiplier reaches `0.68`;
- non-selected alpha fades fully out;
- no random per-item stagger or wiggle is reintroduced;
- after expansion completes, WebGL RAF and sphere preview media are stopped/paused.

### Normal project view

After expansion:

- normal document scrolling is unlocked;
- the top media frame reuses the exact destination geometry used by the transition;
- placeholder projects remain clearly marked as development placeholders;
- real projects use native video with `controls`, `preload="metadata"`, and `playsInline`;
- information remains deliberately compact: category/name, brief, Services, Year, Visit Website, Back to Work;
- no fake metrics, testimonials, long process timeline, or tech-stack dump is added.

### Return to sphere

Two snapshots are intentionally preserved:

1. `resolvedSnapshot` — stable face-on orientation used for DOM ↔ WebGL ownership;
2. `preOpenSnapshot` — exact sphere orientation/context before the project was opened.

Return sequence:

- project page first scrolls to its transition-top position;
- sphere renderer restarts hidden/receded;
- `resolvedSnapshot` is restored;
- DOM preview shrinks back to the exact face-on tile bounds;
- selected WebGL tile is revealed beneath it and DOM crossfades away;
- project DOM page stays hidden for the entire remaining return restoration;
- sphere layer briefly masks the internal orientation swap to `preOpenSnapshot`;
- surrounding sphere instances peel/fade back in;
- interaction resumes only after that restoration completes;
- programmatic focus is returned without triggering the semantic button's normal snap behavior, so focus restoration does not destroy the restored pre-open orientation.

### Fallback / accessibility / reduced motion

- no-WebGL fallback gallery opens the same normal DOM project view directly;
- Escape returns from `projectViewing`;
- semantic project controls remain keyboard accessible;
- focus moves into project content after expansion and returns after a normal sphere return;
- reduced motion keeps the same state/content flow with shorter transition durations and restrained spatial movement.

## State Machine

```text
opening
→ sphereEntering
→ sphereInteractive
→ projectResolving
→ projectExpanding
→ projectViewing
→ projectReturning
→ sphereInteractive
```

Invalid phase-skipping actions are guarded by the reducer.

## Regression Contracts Added / Updated

The branch now contains source/pure-behavior contracts for:

- Phase 2 state lifecycle and exact selection payload;
- activation thresholds and physical slot hit-testing;
- no continuous picking in the render frame;
- no canvas readback;
- resolve target refresh on every resolve frame;
- camera-stable handoff bounds;
- selected-slot masking and global peel shader state;
- continued absence of velocity wiggle/deformation;
- separate transition and normal-flow project components;
- WebGL stop during project viewing;
- deterministic resolved/pre-open snapshot return ownership;
- project page remaining hidden during the full return restoration;
- programmatic focus restoration not re-snapping the sphere;
- no unsupported CSS length multiplication in project layout;
- preservation of Phase 1 42-instance/reference contracts.

## Verification Boundary

Full repository execution is **not available in this environment**. A fresh local clone/test attempt is blocked by network resolution:

```text
fatal: unable to access 'https://github.com/manbtd0-cloud/Weberaise.git/':
Could not resolve host: github.com
```

Therefore the following are **not claimed as passing here**:

```bash
npm test
npm run typecheck
npm run build
npm run dev
```

Browser/WebGL visual QA is also not claimed from this environment. GitHub currently exposes no CI status checks for this branch, so there is no remote green suite to substitute for local execution.

What has been performed here is direct branch-source inspection after implementation, including the reducer lifecycle, activation/projection math, arcball semantics, renderer ownership boundaries, transition/view layering, no-wiggle shader preservation, no-readback/no-idle-picking contracts, return-context restoration, and CSS compatibility fixes.

## Required User-Machine Verification

After pulling this branch, run:

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Then inspect `/work` at minimum for:

- normal sphere behavior is unchanged from accepted Phase 1;
- project tiles do not wiggle/stretch;
- a stationary click/tap opens the clicked physical tile;
- dragging does not accidentally open;
- an off-center repeated tile resolves and opens from one interaction;
- resolve-to-DOM handoff does not jump, duplicate, or briefly disappear;
- remaining sphere tiles peel/fade fully away;
- expanded project media lands at near-fullscreen margins and normal scrolling works;
- WebGL is not visibly running behind the project view;
- Back/Escape returns through the face-on tile before the original sphere context returns;
- the project DOM page does not flash behind the sphere during return;
- exact pre-open orientation is not destroyed by focus restoration;
- mobile/coarse-pointer and reduced-motion paths remain usable;
- no-WebGL fallback remains usable.

## Parallel-Branch Constraint

Homepage, floating navigation, Services and Work continue independently. Do not merge/copy stale homepage/navigation/Services files into this Work branch. Reconcile only against the final integration branch when the parallel work is ready.
