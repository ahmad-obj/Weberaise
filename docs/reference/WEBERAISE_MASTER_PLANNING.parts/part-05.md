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

# 2026-08-11 LOCKED REFINEMENT — CENTERED LOADER / HERO DEPTH / CLEAN BLOB REVEAL

These decisions override earlier loader-position and reveal-edge behavior where they conflict.

## Loader position — OVERRIDE LOCK
- The numeric countdown is now **always centered in the viewport**.
- Remove the earlier art-directed pseudo-random number positions.
- Preserve truthful real loading, every integer 100→0, no skipped integers, and the existing final centered `0` choreography.
- Current and outgoing number may overlap at the same center position for seamless handoff.

## White hero edge depth — LOCKED OPTION A
- Add an extremely faint **radial vignette** over the light hero surface.
- The center remains visually white/clean.
- Only the far perimeter receives a tiny black influence; target maximum visual strength is about 2–3%.
- It must read as barely perceptible depth, never as a visible gray frame, border, spotlight or dramatic vignette.

## Hero composition vertical position — LOCK
- Raise the entire shared hero composition slightly upward.
- Move `WELCOME / TO` and the hidden WEBERAISE lockup together as one registered unit.
- Do not independently offset the front/reveal copies.
- Desktop working target: approximately 2.5–3vh upward with sensible clamps.
- Mobile shift is smaller.
- `EXPLORE` remains anchored near the bottom and is not dragged upward with the typography/brand composition.

## Reveal character — OVERRIDE LOCK
The old trail must no longer read as smoke, fog, mist or vapor.

Target character is a **dense coherent liquid/blob mask**:
- thick and rounded;
- clear coherent silhouette;
- proper rounded blob termination at the end of a stroke;
- crisp but antialiased border;
- low-frequency organic contour movement only;
- almost no high-frequency grain/noise;
- very low advection/drift;
- no expanding haze around aging marks;
- overlapping marks merge naturally;
- visible lifetime remains roughly 3–4 seconds;
- old regions disappear by **clean contour contraction / erosion inward**, not by becoming progressively translucent smoke.

## Nothin reference findings
Reference site: `https://www.noth.in/`

Publicly verifiable implementation signals:
- developer Thomas Carré describes the project as built with **Webflow, GSAP, WebGL and custom shaders**;
- independent tech-stack detection also identifies **Three.js and Lenis**;
- therefore the reference reveal is treated as a shader-driven interactive compositor/mask, not as a CSS blur/fade effect.

The Weberaise implementation should reproduce the approved observable behavior and quality characteristics. Do not wholesale copy proprietary deployed source code merely because browser-delivered bundles may be inspectable.

---

# 2026-08-11 OVERRIDE LOCK — SOLID AGE-AWARE IMPLICIT LIQUID SURFACE

This section supersedes the earlier implementation direction that relied on a decaying feedback/history density mask.

## Why the previous model is rejected
The feedback-density model could be tuned to reduce noise, but its healing mechanism still depended on stored density losing strength over time. That produces a perceptual tendency toward translucent/fog-like disappearance and does not match the approved Nothin reference closely enough.

## New production model — LOCKED
The hero reveal is now modeled as a **solid age-aware implicit liquid surface**:

1. pointer/autonomous samples become time-stamped liquid primitives;
2. neighboring primitives contribute to one low-resolution implicit field;
3. contributions are combined additively so nearby primitives merge into smooth metaball-like necks;
4. the visible liquid surface is extracted with a narrow threshold/level set;
5. primitive opacity does not fade as the main healing mechanism;
6. each primitive keeps nearly full radius during a hold phase, then its radius contracts geometrically during healing;
7. as old radii shrink, bridges narrow naturally and may pinch apart into rounded islands;
8. detached remnants remain solid/rounded and shrink away without a smoke/fog residue.

## Hard visual requirements
- interior remains visually solid;
- only the narrow antialias band may be partially transparent;
- terminal stroke ends remain rounded blobs;
- oldest trail visibly retracts inward;
- no broad low-alpha halo;
- no temporal hash/grain;
- no screen-wide advection drift;
- small contour deformation is allowed only at the boundary;
- fast strokes remain continuous;
- overlapping strokes union organically;
- lifetime remains approximately 3–4 seconds;
- autonomous intro uses the exact same primitive/lifetime model.

## Performance architecture
- rebuild the low-resolution field from the bounded active primitive list each frame instead of running a multi-pass fluid solver;
- use instanced primitive quads and additive blending;
- full profile uses a bounded primitive count and adaptive field resolution suitable for integrated GPUs;
- lite/reduced-motion profiles preserve the same geometric healing behavior at lower cost;
- no-WebGL fallback remains intentional.

## Reference runtime inspection
A local diagnostic tool is permitted to inspect publicly delivered runtime WebGL characteristics from Nothin on the user's machine. It may record shader/program counts, shader strings for local analysis, uniforms, texture/framebuffer formats/dimensions and draw-call structure.

Captured proprietary shader text is **analysis-only**. Do not paste or transplant Nothin production shader code into Weberaise. Use the evidence to identify architectural techniques and independently reproduce the observable effect.

Tool/documentation:
- `scripts/probe-nothin-webgl.mjs`
- `docs/reference/NOTHIN_RUNTIME_PROBE.md`

---

# IMPLEMENTATION STATUS CROSS-REFERENCE

Implementation progress, verification evidence, and sandbox/build blockers are tracked separately in:

`docs/IMPLEMENTATION_STATUS.md`

This status document does not override design decisions in this master plan.