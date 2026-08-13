# Smooth Ribbon and Journey Composition Redesign

## Status and Scope

This specification supersedes the Q1/Q2/Q3 composition, route-shape, reveal-timing, and ribbon-finish portions of the August 12–13 journey specs. The existing same-route post-EXPLORE architecture, native document scrolling, one canonical ribbon route, synchronized front/back depth copies, ShutterText concept, and final taper remain.

The redesign has five goals:

1. rebuild Q1 against the supplied master reference rather than arranging its separated pieces approximately;
2. strengthen Q1/Q2 scale, hierarchy, and early animation timing;
3. remove Q3 artwork and turn Q3 into a large centered typography/ribbon event;
4. replace the irregular point-smoothed ribbon with a small number of intentional, tangent-continuous gestures;
5. make loop pacing perceptible at ordinary scroll speeds while allowing straight travel to move more efficiently.

## Locked Visual Direction

### Overall rhythm

The journey alternates between designed focal beats and open black breathing room. The question and artwork must already be resolving while each beat is in the lower half of the viewport, so attention lands on the scene before it reaches center. Nothing important should first appear after the focal beat has passed the viewport midpoint.

Desktop order:

- Q1: enlarged question on the left; enlarged, master-registered artwork shifted right;
- Q2: enlarged artwork shifted left; enlarged right-aligned question;
- Q3: no artwork; one large centered two-line question;
- reassurance: centered two-line phrase with indivisible line groups.

Mobile retains the same narrative ordering but uses one-column Q1/Q2 compositions and the same explicit Q3/reassurance line groupings.

### Q1 — `Need a website?`

The question becomes approximately 10–14% larger than the current rendered size. The scene becomes approximately 16–20% larger and moves farther right, while remaining completely visible at 1280×720.

The seven layers must be registered against the Q1 master reference:

- platform is the scene foundation;
- storefront sits centered on the platform's upper slab, with no floating gap or lateral drift;
- nav strip and image card form the upper-left cluster;
- CTA sits directly below the image card;
- large browser card occupies the upper-right cluster;
- small browser card sits below and slightly right of the large card;
- relative scale and overlap follow the master, even when the overall scene is responsively scaled.

The animation is a readable assembly:

1. platform rises/fades first;
2. storefront settles directly onto the platform;
3. upper-left cluster enters together;
4. upper-right cluster enters together;
5. CTA and small browser card finish the composition.

The motion may be obvious, but it must use controlled translation, opacity, and small scale changes—no bounce, spring overshoot, or floating idle loop.

### Q2 — `Need a redesign?`

The question becomes approximately 8–12% larger. The artwork becomes approximately 10–14% larger and shifts left to make the composition feel deliberately anchored rather than centered in its grid cell.

The final assembly remains close to the supplied Q2 master and preserves the current successful clean state. The animation becomes clearer through grouped phases:

1. stable browser shell establishes the plane;
2. header and main media align;
3. text fragments and CTA resolve;
4. profile cards and search field dock last.

Initial displacements are increased enough to read at normal scrolling speed, while final transforms remain master-aligned. All groups overlap slightly so the sequence feels continuous rather than stepwise.

### Q3 — `Need to look better online?`

Remove the Q3 artwork component and all Q3 artwork from the rendered journey. Q3 becomes a centered typography event using an explicit two-line lockup:

```text
Need to LOOK
better online?
```

The text is substantially larger than Q1/Q2, centered horizontally, and constrained so both lines remain intact. `LOOK` stays as one nonbreaking inline group. Its two O glyphs remain separately measurable DOM targets.

The current consecutive paired-O ribbon idea is retained because it reads well. It is rebuilt for the centered lockup with:

- a slightly upper-left approach;
- a small intentional offset from the exact glyph outline;
- scale derived from the measured O rectangles;
- one continuous first-O loop flowing directly into the second-O loop;
- a clean tangent exit toward reassurance;
- no vertical stem through the word and no eyeglass bridge between the O glyphs.

### Reassurance — `DONT WORRY. WE GOT YOU`

The phrase uses two explicit indivisible lines:

```text
DONT WORRY.
WE GOT YOU
```

No individual character or word may wrap independently. Font size scales down at narrow widths instead of allowing `YOU` or its final character to fall onto another line.

The shutter reveal begins while the block is still below center—approximately when its top reaches 78–82% of viewport height. The surrounding ribbon gesture begins its approach at the same time and reaches the loop as the shutter slices resolve.

## Ribbon Shape System

### Geometry principles

The new ribbon must look deliberately art-directed, not hand-sketched and not mechanically perfect.

- Use a small number of long cubic Bézier gestures.
- Preserve tangent continuity at every gesture handoff.
- No polyline-like knees, hooks, cusps, or sudden reversals.
- Avoid unnecessary S-curves.
- Use asymmetric broad arcs rather than mathematically perfect circles for Q1 and reassurance.
- The paired O loops may be more regular because they trace typography, but their approach and exit remain flowing.
- Front/back depth remains two synchronized renderings of the same canonical centerline.

The route is authored as semantic curve segments instead of a dense array of staging points later passed through generic Catmull–Rom smoothing. Each semantic interaction exposes named markers for pacing and tests.

Required marker sequence:

1. `openingExit`
2. `q1Approach`
3. `q1WrapFront`
4. `q1WrapBack`
5. `q1WrapExit`
6. `q2BendExit`
7. `q3Approach`
8. `q3FirstLoopComplete`
9. `q3SecondLoopComplete`
10. `reassuranceApproach`
11. `reassuranceLoopComplete`
12. `taperEnd`

### Route choreography

- Opening: retain the existing loose opening oval, but join its exit to Q1 through one long tangent departure.
- Q1: approach from upper-left/above, form a broad wrap around the enlarged scene, pass behind a deliberate middle/right depth zone, reappear along the lower arc, and exit downward with no tight hook.
- Q2: one calm, monotonic sweep through the artwork/text gap. No artwork loop and no local S-turn.
- Q3: approach from upper-left, draw both centered O loops slowly enough to read, then leave on a downward-right tangent.
- Reassurance: enter early, draw one large loose surrounding oval, depart through its lower-right tangent, then taper over a short descent.

## Ribbon Progress and Scroll Pacing

The current path lookup forces geometric travel into monotonically increasing document Y. That compresses long lateral/looping sections and produces visible progress jumps. The redesign replaces that behavior with semantic pacing anchors.

At runtime, named geometric markers are resolved to actual SVG arc lengths. A monotonic map then relates scroll-document positions to those arc lengths. Each important curve receives deliberate scroll budget:

- Q1 approach and full depth wrap: about `0.55 × viewport height`;
- Q2 straight/broad bend travel: about `0.28–0.34 × viewport height`;
- paired O approach and both loops: about `0.44 × viewport height`;
- reassurance approach and surrounding loop: about `0.50 × viewport height`;
- long open transitions may advance faster, but never instantaneously.

The visible length follows the mapped target with a short scrub (`0.14–0.18s`) to absorb normal wheel/touchpad discontinuities. Scrub does not add autonomous motion and must follow reverse scrolling. Reduced motion uses immediate mapped progress.

The ribbon should reach each interaction before the related beat reaches viewport center. It may sit lower in the viewport during approach, then spend more scroll distance drawing the interaction.

## Reveal Timing

Reveal timing is decoupled from the ribbon head's old document-Y approximation but remains owned by the journey controller.

- Q1/Q2/Q3 reveal when the beat top reaches approximately `76%` of viewport height.
- Reassurance reveals when its text top reaches approximately `82%` of viewport height.
- A revealed beat stays revealed during reverse scrolling.
- Ribbon draw progress continues to retract with reverse scrolling.
- Reduced motion exposes final text/artwork immediately when the early trigger is crossed.

## Ribbon Finish

The ribbon uses a dimensional blue finish without becoming neon or glossy plastic:

- base gradient: deep blue `#1D4ED8` through `#3B82F6` to pale blue `#93C5FD`, returning to `#2563EB`;
- a narrower highlight stroke reuses the canonical path and draw progress;
- highlight opacity remains restrained and may vary through the gradient rather than animate continuously;
- soft blue shadow/glow is subtle and wider than the highlight;
- base, highlight, front copy, back copy, and taper remain perfectly synchronized;
- no looping shimmer animation is required.

## Responsive Behavior

Required acceptance viewports remain `1440×900`, `1280×720`, and `390×844`.

- Q1/Q2 preserve intentional edge bias on desktop and become stacked on mobile.
- Mobile artwork must not clip and must preserve the master-relative layer registration.
- Q3 remains centered and explicitly two lines at every required viewport.
- `LOOK` and both O targets remain on the first line.
- Reassurance remains exactly two intact lines at every required viewport.
- Ribbon width, highlight width, loop offsets, and curve clearance scale by route configuration rather than fixed desktop pixels.

## Accessibility and Motion

- Artwork remains decorative with empty alternative text.
- Meaning remains in real heading text.
- Reduced motion removes assembly transitions and ribbon scrub while showing meaningful final states.
- No animation may depend on pointer input.
- No content may become inaccessible when JavaScript timing is interrupted.

## Verification and Acceptance

Automated geometry contracts must assert:

- one continuous path;
- semantic markers are strictly ordered;
- tangent-angle discontinuity stays below the agreed threshold at joins;
- curvature does not spike into sharp knees;
- Q2 remains horizontally monotonic through its calm bend;
- paired O loops have no crossings, eyeglass bridge, or vertical word stem;
- pacing anchors are monotonic and allocate minimum scroll budget to Q1, O loops, and reassurance;
- Q3 has no rendered artwork;
- explicit Q3/reassurance line groups cannot wrap internally;
- early reveal thresholds are present;
- base/highlight paths share the same geometry and visible length.

Browser acceptance must capture approach, midpoint, and completion states for Q1, Q2, paired O loops, and reassurance at all three required viewports. Q1 additionally requires a master-reference overlay comparison and front/behind/front depth captures. Q2 requires initial/grouped-mid/final captures. Fast wheel/touchpad simulation must show no single-frame loop completion at ordinary deltas.

## Scope Constraints

- Work only on `feature/signature-intro`.
- Do not merge, close, or otherwise mutate PR #1.
- Preserve unrelated dirty/generated files.
- Do not redesign the hero, purpose section, growth ring, or downstream site.
- Do not reintroduce Q3 artwork.
- Do not add particle systems, physics, parallax, or continuous ambient motion.
- Do not solve pacing by lengthening the entire page indiscriminately; allocate scroll budget semantically.
