- only regions physically traversed by the black viscous mask become black;
- there must be no premature full-screen fade-to-black;
- no mismatch between the visible crest and the actual composited mask;
- no abrupt reveal/cut hidden behind an animation overlay.

## Shared reveal-engine principle
Preferred technical direction:
- reuse the same underlying mask/viscous system where practical;
- switch from the hero's pointer-driven emitter to a **bottom-edge fill emitter**;
- avoid building a completely unrelated second visual engine unless profiling/prototyping proves necessary.

Reference technical research:
- `WEBERAISE_WEBGL_REVEAL_RESEARCH.md`

## Destination — LOCKED OPTION A
Once the black viscous fill reaches the top and fully covers the hero:

**The black state is not discarded. It becomes the actual visual foundation/background of the next section.**

The first main-scroll section — **First Impression** — should emerge directly from this black state.

Consequences:
- no second unnecessary transition merely to remove the black cover;
- no intermediate blank/loading screen;
- the hero exit has a visual purpose and becomes part of the next section's composition;
- the transition can hand off seamlessly into the first scrollable content.

The exact First Impression entrance choreography and its final light/dark composition are still to be designed next.

## Scroll activation
- Main-page scrolling becomes enabled only when the hero exit transition has reached its safe handoff/completion point.
- The user should never be able to partially scroll the page while the hero-to-main transition is mid-animation.
- The first scroll position should feel intentional, with First Impression starting as the natural continuation of the completed black fill.

## Performance requirements
- The next section must already be prepared before `EXPLORE` is clicked; do not start a visible route/content load after click.
- The black fill must remain smooth under the same performance constraints as the hero reveal.
- Avoid unnecessary full-resolution simulation passes.
- No shader compilation / framebuffer allocation hitch on click; required GPU resources should be prepared during the existing real loading/warm-up flow where possible.
- Transition timing should be driven by visual quality and continuity, not an arbitrary long delay.

## Hard DON'Ts
- No route/page reload flash.
- No plain rectangular wipe.
- No abrupt full-screen black cut.
- No huge watery wave.
- No splashing or bubbles.
- No strong turbulence.
- No laggy/botchy crest.
- No visible mask/content desynchronization.
- No scroll input advancing content while transition is still running.
- No delayed loading of First Impression after `EXPLORE` is clicked.
- No throwaway black intermediate screen followed by another unrelated transition.

## 2026-08-11 change log — Explore / hero exit
- Locked `EXPLORE` as the explicit hero-to-main-site trigger.
- Locked hero as non-scroll-driven intro state.
- Locked main website scrolling to begin only after Explore transition.
- Preferred same-route/two-state homepage architecture over separate page navigation.
- Locked bottom-edge viscous black fill as hero exit transition.
- Locked physical traversal masking: only traversed regions become black.
- Locked reuse of the same viscous visual language / mask engine where practical.
- Locked **Option A**: fully risen black fill becomes the actual background/foundation of First Impression rather than an intermediate throwaway screen.

---

# IMPLEMENTATION STATUS CROSS-REFERENCE

Implementation progress, verification evidence, and sandbox/build blockers are tracked separately in:

`docs/IMPLEMENTATION_STATUS.md`

This status document does not override design decisions in this master plan.
