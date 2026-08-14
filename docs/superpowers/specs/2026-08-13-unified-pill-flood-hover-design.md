# Unified Pill Flood Hover Design

## Goal
Unify the navbar hover language across the Weberaise logo pill, SERVICES, WORK, ABOUT, and LET’S TALK, while fixing incomplete top-corner coverage on narrow center pills.

## Root cause
The current flood uses a circle sized with the React Bits pill geometry and a final scale of 1.18. On wider SERVICES this covers the clipped pill, but on narrower WORK/ABOUT the resulting circle does not reach both top corners. The visible old-color wedges are therefore a geometry issue, not a theme/color issue.

## Geometry fix
For every flood-enabled pill, measure the rendered width and height. Treat the pill’s bottom-center as the flood origin. Compute the minimum radius required to reach either top corner as `hypot(width / 2, height)`, then add a small overscan margin before setting the flood circle diameter. This guarantees full corner coverage regardless of pill aspect ratio.

## Unified behavior
- One flood controller owns all flood-enabled navbar pills.
- Logo, SERVICES, WORK, ABOUT, and LET’S TALK use the same 0.46s enter / 0.36s leave timing and `power3.out` easing.
- Existing background-sensitive CSS variables remain authoritative: surface uses `--nav-pill-fg`, revealed content uses `--nav-pill-bg`.
- Center pills retain the vertical base-label-out / inverted-label-in choreography.
- Logo uses the same flood surface, with the Weberaise mark swapping to the inverted color inside the flood.
- LET’S TALK uses the same flood surface and label swap; the prior goo-particle burst is removed rather than stacked with the new effect.
- Direct pointer movement between neighboring pills remains independently reversible, allowing a brief natural overlap.

## Non-goals
- No navbar geometry, spacing, breakpoint, destination, hero handoff, theme sampling, or page-content changes.
- No changes to ribbon, Q1/Q2 artwork, loader, hero reveal, or post-Explore journey.
- No new animation dependency.

## Accessibility
- Keyboard focus drives the same active state as pointer hover.
- Reduced motion resolves directly to the final/rest state without travel.
- Existing focus-visible outlines remain.

## Verification
- Regression test must fail on the old geometry/controller and pass on the new one.
- Test must assert all five pills expose the same flood contract.
- Test must assert the geometry uses `Math.hypot(width * 0.5, height)` plus overscan.
- Test must assert adaptive color variables are preserved.
- Diff audit must confirm no homepage/ribbon/artwork files change.
