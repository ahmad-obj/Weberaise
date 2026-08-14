# Work Infinite Menu Sphere Rework — Locked Execution Decisions

This file is a normative addendum to `2026-08-14-work-infinite-menu-sphere-rework.md` and resolves the only ambiguities found during plan self-review.

## Geometry scale

- `SPHERE_RADIUS = 2`.
- `BASE_SURFACE_SCALE = 0.34` for the 4:3 website mesh.
- Depth scaling remains the ReactBits formula: `abs(z / SPHERE_RADIUS) * 0.6 + 0.4`.
- Do not tune `BASE_SURFACE_SCALE` before the first visual reference comparison. If the first comparison shows collision/under-density, change only this constant and record the reason.

## Entrance scale

The approved sphere establishing transition uses the ReactBits demo scale behavior:

```ts
const entranceScale = 5 + (1 - 5) * entranceProgress;
```

All 42 instances exist from initialization. Entrance progress changes only scene scale; it never changes topology, instance count, or project mapping.

## Repeated-project media deduplication

Live-preview assignment is instance-prioritized but project-deduplicated:

1. rank the 42 instances front-to-back;
2. walk the ranking in order;
3. select an instance only if its `projectIndex` has not already received a live source;
4. stop when the quality profile's live-slot cap is reached.

Therefore:

- 1 project → at most 1 live decoder/source even though it repeats 42 times;
- 2 projects → at most 2 live decoders/sources;
- 6+ projects on full desktop → at most 3 live decoders/sources;
- repeated copies without a live source use the sharp poster atlas.

The active/front instance always gets first priority.

## Phase 1 click behavior

Pointer/touch release is used only to finish arcball interaction. Phase 1 performs no picking and no project activation. Project showcase/bridge APIs remain removed until Phase 2 is separately designed and approved.
