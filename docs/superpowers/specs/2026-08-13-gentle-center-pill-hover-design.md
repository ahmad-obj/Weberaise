# Gentle Center Pill Hover Design

## Goal

Replace only the center navigation hover choreography (`SERVICES`, `WORK`, `ABOUT`) with a gentler React Bits Pill Nav-inspired internal flood transition while preserving the current Weberaise navigation layout, responsive behavior, destinations, theme inversion, hero/main mounting, logo, and `LET'S TALK` effect.

## Approved direction

Use Approach A from the design discussion: each center pill owns its own internal inverse surface instead of sharing one traveling hover plate.

The reference behavior is the React Bits Pill Nav: an internal circular surface expands through the pill while the base label moves out and an inverse-color label enters. Weberaise should use the same interaction principle but slower, softer, and less theatrical.

## Locked invariants

- Keep the center pills in their current positions and dimensions.
- Keep `SERVICES`, `WORK`, and `ABOUT` order and destinations unchanged.
- Keep the existing per-zone dark/light theme sampling exactly intact.
- In dark zones: white pill / black text at rest; hover becomes black internal surface / white hover label.
- In light zones: black pill / white text at rest; hover becomes white internal surface / black hover label.
- Theme changes while scrolling must continue to propagate through CSS variables; the hover surface and hover label must inherit those same variables rather than hard-code colors.
- Keep hero navigation behavior, Explore handoff, persistent main navigation, responsive layout, focus accessibility, coarse-pointer behavior, and reduced-motion support.
- Do not modify the logo zone.
- Do not modify the `LET'S TALK` goo system.
- Do not touch homepage/ribbon/artwork code outside the navigation subsystem.

## Hover choreography

Each center anchor contains:

1. the normal/base label;
2. a clipped internal circular inverse surface;
3. a duplicate hover label above that surface.

The pill itself provides the clipping boundary.

### Pointer/focus enter

- The circular inverse surface begins near the lower-middle of the pill and expands until it covers the pill.
- The base label translates upward by roughly one pill height with a small extra offset.
- The hover label begins below the visible pill and rises into the centered resting position.
- The hover label becomes fully opaque as it arrives.
- Target duration: approximately `0.46s`.
- Easing: soft `power3.out`-style motion; no spring, bounce, overshoot, or elastic behavior.

### Pointer/focus leave

- Reverse the same timeline rather than running a separate unrelated exit animation.
- Target reverse duration: approximately `0.36s`.
- The surface retreats downward and the original label returns naturally.
- Direct movement between neighboring pills may overlap briefly because each pill owns an independent timeline; there should be no traveling shared object and no snap.

## Geometry

Use measured pill width/height to size the internal circle sufficiently to cover the pill. Follow the geometric principle used by React Bits rather than using an arbitrary fixed diameter, so `SERVICES`, `WORK`, and `ABOUT` fill cleanly despite different widths and responsive sizing.

Recalculate geometry on resize and after fonts are ready when practical. Existing `ResizeObserver` behavior may be reused/adapted.

## Reduced motion and coarse pointers

- Reduced motion: avoid large label travel; use an immediate or very short state change while preserving readable contrast.
- Coarse pointers: do not depend on hover for navigation; normal links remain fully usable. Existing active/tap behavior may remain.
- Keyboard focus should invoke the same hover state as pointer enter and reverse when focus leaves the center cluster.

## Implementation boundary

Expected production changes are limited to:

- `src/components/navigation/CenterNavCluster.tsx`
- `src/components/navigation/centerHoverMotion.ts`
- `src/components/navigation/Navigation.module.css`

Expected test changes:

- `tests/navigation.test.mjs`

No other production file should need modification.

## Acceptance criteria

1. No shared `data-center-hover-plate` element remains.
2. Every center pill has its own internal hover surface and duplicate hover label.
3. Hover-in is visibly gentler than the former `0.32s` traveling plate.
4. Hover-out is a reverse of the same interaction and slower/gentler than the former `0.16s` shrink/fade.
5. Moving between center pills does not cause a shared plate to slide or resize across gaps.
6. Current dark/light adaptive color inversion remains driven by `--nav-pill-bg` and `--nav-pill-fg`.
7. Logo and `LET'S TALK` implementation are unchanged.
8. Existing mobile, focus, reduced-motion, hero/main, and navigation-destination tests remain valid.
9. No homepage/ribbon/artwork files are modified.
