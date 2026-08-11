# Interaction Polish Design

**Branch:** `feature/signature-intro`
**Status:** Approved by user on 2026-08-11

## Scope
Refine the already-approved signature intro without changing its overall architecture.

## Blob interaction
- Reduce pointer reveal radius from the current size to approximately `0.085` on desktop and `0.11` on mobile.
- Preserve the current solid implicit-liquid / metaball character and geometric dissolution.
- Add a short velocity-based inertial afterglide when pointer motion stops.
- Afterglide must be asymmetric and minor: only a small part of the liquid advances beyond the final cursor position.
- Faster pointer velocity creates slightly more carry; slow movement produces almost none.
- Afterglide duration target: roughly `300–450ms`, with progressively smaller/weaker emitted primitives.
- Add tiny deterministic lateral irregularity so the carry does not look like a straight rigid extrusion.
- Do not reintroduce global advection, fog, smoke, watery ripple behavior, or continuous autonomous movement.

## Loader digit motion and cadence
- Keep every countdown digit centered.
- Make digit-to-digit transitions smoother and less abrupt through a longer buttery crossfade with tiny scale/vertical motion.
- Slow the cadence progressively as zero approaches.
- Broad timing intent:
  - `100–30`: fast;
  - `30–10`: gradually slower;
  - `<10`: clearly slower;
  - `5→4→3→2→1→0`: increasingly deliberate.
- Hold `0` for roughly `600–750ms` before the line/tagline choreography begins.
- The countdown `0` and completion-animation `0` must occupy the exact same visual center, use the same effective font metrics/size, and hand off without a visible jump.

## Loader completion tagline
- Replace the tagline with exact copy: `Need a website for business?`
- Increase the horizontal line width so the line comfortably spans the full tagline on desktop and responsive layouts.
- Preserve existing masked rise/hold/drop choreography after the zero hold.

## Hero composition
- Raise the shared hero composition (`WELCOME / TO` plus hidden WEBERAISE lockup) another small amount, about `0.7–1vh` beyond the current offset.
- Front and reveal layers must remain perfectly registered.
- EXPLORE remains anchored near the bottom.

## EXPLORE inversion
- EXPLORE text and rule must read black on the white front hero and white wherever the black reveal is behind them.
- Implement with the same visual inversion logic used by the custom cursor, without duplicating the button or creating a separate reveal mask.

## Non-goals
- No changes to loader concept, radial vignette, intro opening architecture, current geometric reveal dissolution, Explore-to-main transition, or downstream homepage sections.
- No unrelated refactors.

## Acceptance criteria
1. Pointer blob is visibly smaller but remains thick enough to reveal meaningful portions of the hero.
2. Releasing/stopping a fast pointer produces a brief forward liquid carry beyond the final pointer position; slow pointer stops produce nearly no carry.
3. The carry ends within ~450ms and does not continue moving afterward.
4. Digit changes feel smoother than the current 160ms transition.
5. The final ten digits visibly decelerate, with the final five increasingly deliberate.
6. `0` remains stationary before completion choreography begins.
7. Countdown `0` and completion `0` align with no visible positional or sizing jump.
8. Tagline reads exactly `Need a website for business?` and its horizontal rule extends beyond the text width.
9. Shared hero content sits slightly higher than before while staying registered.
10. EXPLORE and its rule invert to white when the black reveal crosses underneath.
