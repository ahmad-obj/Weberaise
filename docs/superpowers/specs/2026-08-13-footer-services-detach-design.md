# Footer Services Detach Design

## Goal
Create the final homepage section as a controlled, premium closing sequence where the existing `SERVICES` navigation pill physically leaves its navbar position, travels into the footer, settles beneath the closing statement, and reverses the exact path when the user scrolls upward.

## Locked visual direction
The final composition uses the approved large minimal statement:

`WHAT CAN WE`
`BUILD FOR YOU?`

The SERVICES pill settles centered beneath the statement and becomes the final services CTA. Minimal footer metadata sits near the bottom edge: `WEBERAISE` on the left and `© 2026` on the right. The section remains typography-led, spacious, dark, and premium.

## Scroll choreography
- The footer enters normally with the rest of the page.
- Its inner stage becomes sticky for a short final hold rather than a long scroll-jacked sequence.
- The SERVICES pill stays completely normal in the navbar until the final stage has meaningfully entered the viewport.
- During the pinned portion, the real SERVICES pill peels out from its exact navigation position and follows a smooth downward curved path toward a dedicated landing dock below the headline.
- The pill enlarges only slightly during travel/settle; no bounce, spin, overshoot, or theatrical elastic motion.
- At the final scroll position the pill is visually centered in its footer dock and remains fully interactive.
- Scrolling upward reverses the exact motion continuously. The pill lifts from the footer, follows the same path backward, and visually reattaches to the navbar.
- The sequence is scrubbed by scroll progress; there is no one-way state that gets stuck after first execution.

## Navbar behavior
The SERVICES item already exposes `data-nav-detach-anchor`; this remains the stable origin seam.

When the SERVICES pill moves:
- its original navbar slot remains occupied by an invisible structural placeholder;
- WORK and ABOUT do not shift, slide, or recenter;
- the center navigation geometry therefore remains unchanged throughout the sequence;
- the moving object is the same interactive SERVICES pill, not a replacement or cross-faded duplicate.

The existing flood hover system stays active on the moving pill. Logo, WORK, ABOUT, and LET'S TALK remain unaffected.

## Recommended implementation architecture
Use a self-contained `ClosingFooter` section appended after the current GrowthRing inside `PostExploreNarrative`.

The section uses a tall outer scroll range with a `position: sticky` 100svh inner stage. This creates the short controlled hold without adding a ScrollTrigger dependency.

The SERVICES link stays owned by React inside the navigation. Add a detachable motion shell inside its existing slot. The slot preserves navbar width while the shell receives the scroll-driven transform.

A small controller coordinates the footer and nav through stable DOM data attributes:
- origin: `[data-nav-detach-anchor]`
- moving shell: `[data-services-detachable]`
- footer section: `[data-closing-footer]`
- footer dock: `[data-services-footer-dock]`

At geometry refresh, measure the origin shell and footer dock. During the active scroll range, compute a normalized progress and apply a `translate3d(...) scale(...)` transform to the moving shell. Use a cubic Bezier-style interpolation with a gentle downward arc rather than a straight diagonal.

Because both the navbar and sticky footer stage are stable in viewport coordinates during the choreography, the scroll loop should perform arithmetic and transform writes only. Geometry reads happen only on setup/resize/font/layout refresh, not every scroll frame.

## Motion character
- Smooth, composed, premium.
- Short pin duration; the user should not feel trapped in the footer.
- Curved travel path with most horizontal correction happening gradually rather than snapping near the end.
- Slight scale increase only, approximately 1.0 to ~1.1–1.15 depending on final responsive tuning.
- No rotation.
- No opacity fade on the real pill.
- The footer headline does not need a competing complex entrance; the detached SERVICES pill is the hero motion.

## Responsive behavior
Desktop and mobile use the same physical continuity.

On each layout size:
- origin and destination are measured from actual rendered geometry;
- the route is recalculated on resize/orientation/font completion;
- the final CTA remains centered beneath the statement;
- headline sizing uses responsive `clamp()` typography and retains the two-line hierarchy where space permits;
- on narrow screens the footer metadata remains readable without crowding the CTA.

## Reduced motion
For `prefers-reduced-motion: reduce`, preserve the semantic state change without the long curved travel. The SERVICES pill transitions between origin and footer destination with minimal or immediate transform progress tied to the same scroll range. No content is hidden and the CTA remains accessible.

## Navigation destination
The SERVICES CTA represents navigation to the dedicated Services page. Its canonical destination should be `/services` once this footer choreography is implemented, so the same physical button has one meaning before, during, and after detachment.

## Performance constraints
- No per-frame `getBoundingClientRect()`.
- No per-frame DOM queries or `elementsFromPoint()`.
- No React state updates on every scroll frame.
- Use one passive scroll listener plus requestAnimationFrame batching, or equivalent existing scroll infrastructure.
- Only the detachable shell gets the transform write.
- Preserve the recent navbar performance optimizations.
- No reduction to visual quality, ribbon quality, WebGL quality, or current hover quality.

## Testing requirements
Regression coverage must verify:
- SERVICES retains the stable detach anchor;
- a dedicated detachable shell exists only for SERVICES;
- the footer provides a stable destination dock;
- the slot remains in layout while the shell moves;
- motion is reversible from scroll progress rather than one-time state;
- scroll-time code avoids layout reads/DOM hit-testing;
- `/services` is the canonical SERVICES destination;
- existing flood hover markup remains on the moving pill;
- reduced-motion handling exists;
- no deprecated placeholder homepage sections are restored.

## Out of scope
- Detaching WORK, ABOUT, logo, or LET'S TALK.
- Reworking the current ribbon, hero, loader, GrowthRing, or question journey.
- Adding project statistics, testimonials, pricing, or extra footer marketing copy.
- Long cinematic scroll locking.
