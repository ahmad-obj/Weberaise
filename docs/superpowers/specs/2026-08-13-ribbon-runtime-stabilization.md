# Ribbon Runtime Stabilization Design

**Date:** 2026-08-13

## Objective

Make the approved ribbon journey feel continuous on the first visit and during ordinary scrolling, while removing the temporary homepage sections that currently extend the page below the finished narrative.

## Confirmed problems

Real-browser instrumentation at 1280×720 confirmed three independent failures:

- The first geometry is measured before the unlocked main layout settles. The scrollbar then changes the journey width, causing a second geometry build while the opening is drawing. The measured route changed from 9346.82 to 9281.05 units and the visible ribbon reset to zero.
- The opening tween and scroll scrub tween can write the same stroke dash offset concurrently. The opening recording contained multiple backward frames before the route recovered.
- Semantic pacing puts the Q1 approach almost immediately after scroll position zero and gives long interaction curves too little scroll budget. A 32px scroll step produced path advances of approximately 835 units near Q1 and 702 units near Q3.

## Page boundary

`PostExploreNarrative` remains complete, including:

- Q1, Q2, Q3, and reassurance;
- the existing aurora statement;
- the existing GROW service ring.

All `section-shell` content rendered after `PostExploreNarrative` in `MainSite.tsx` is temporary placeholder/TODO content and will be removed. The homepage will end after the purpose/GROW section.

## Runtime design

### Stable first measurement

When the experience reaches `main`, `JourneyNarrative` will install its resize observer immediately but debounce the initial build through the same settled-layout scheduler used for later rebuilds. This consolidates the main-stage visibility change and scrollbar-width change into one geometry measurement.

### One draw owner

`ribbonController` will have one mutable visible-length state and one GSAP tween at any time. The separate opening state/tween will be removed.

The opening is a normal target sent to the same draw tween used for scroll updates. A scroll update may retarget that tween, but no second animation callback may write the SVG paths directly.

### Rebuild continuity

Every applied draw frame will persist normalized visible progress on the journey root. A new controller created after a resize or geometry rebuild will translate that normalized progress onto the new route length before it renders anything. Completed opening state remains one-way through `data-ribbon-opened`.

This prevents rebuilds from falling back to zero or to the opening floor.

Every controller construction also resolves the live document scroll before choosing its first tween target. A restored page or a fast scroll during the settled-measurement delay therefore catches up immediately instead of waiting at the opening floor for another scroll event. Only a genuine top-of-page opening keeps the longer authored opening duration.

### Authored marker identity and bounded semantic pacing

Pacing remains semantic and reversible. Marker progress is recorded from the authored cubic segment boundaries instead of rediscovered later from repeated SVG coordinates. This prevents an early route point from being mistaken for Q1's approach/front wrap and prevents shared loop seams from being confused with later passes.

Each adjacent anchor pair receives enough scroll distance to cap the maximum derivative of the existing smoothstep interpolation.

- Calm approach and travel segments: maximum 5 path units per scroll pixel.
- Q1 wrap and Q3 O loops: maximum 3.5 path units per scroll pixel.
- The much larger reassurance oval: maximum 6.5 path units per scroll pixel so it remains visible but still completes before the retained GROW section.
- The Q1 approach cannot complete before 0.28 viewport heights of scroll.
- A new `q3OutsideExit` marker separates the paired-O loops from the journey toward reassurance.

The explicit interaction budgets remain minimums. The speed cap may extend them when a large curve needs more screen time.

## Reduced motion and reverse scrolling

Reduced motion applies the resolved target immediately. Normal motion uses the single short scrub. Scroll mapping remains reversible; content reveals remain entrance-only.

## Verification

Automated tests must prove:

- no placeholder homepage sections render after `PostExploreNarrative`;
- the initial geometry uses the settled rebuild scheduler;
- the controller has one draw tween, persists normalized progress, and restores it on reconstruction;
- controller creation at nonzero scroll targets the live paced length even before the opening flag is set;
- all marker lengths and scroll anchors remain monotonic;
- pacing consumes authored marker progress rather than coordinate-nearest marker recovery;
- Q3 outside exit is ordered between the second O loop and reassurance;
- calculated maximum pacing slopes respect the calm and interaction limits;
- existing artwork, path continuity, reassurance, reduced-motion, and reverse-scroll contracts remain passing.

Real-browser verification must cover first-load EXPLORE, continuous normal-speed scrolling, Q1→Q2, Q3→reassurance, reverse scrolling, a mid-journey resize, 1280×720 desktop, and 390×844 mobile.

## Out of scope

- No redesign of the approved ribbon geometry, Q1/Q2 compositions, Q3 typography, reassurance typography, aurora statement, or GROW ring.
- No merge of PR #1.
- No staging or modification of unrelated local files.
