# Post-Explore Narrative Revision

**Branch:** `feature/signature-intro`  
**Status:** Approved by user on 2026-08-12  
**Overrides:** Conflicting question-exit, question-placement, Particle Text settlement, and growth-ring sizing details in `2026-08-12-post-explore-narrative-design.md` and its implementation plan.

## Question scene

- The three questions accumulate instead of replacing each other.
- Q1 appears top-left and stays visible.
- Q2 appears middle-right while Q1 remains visible.
- Q3 appears bottom-left while Q1 and Q2 remain visible.
- No question receives an individual exit after entering.
- After all three are present together, all three fade out in one shared transition.
- Scroll-controlled question motion is slowed to approximately `0.5x` the previous perceived speed by doubling the sticky scene scroll distance from `260svh` to `520svh` on desktop and from `280svh` to `560svh` on mobile.
- Scroll Float character entrance geometry remains the reference: per-character rise from below, `yPercent: 120`, `scaleY: 2.3`, `scaleX: 0.7`, then resolve to natural readable type.

Current normalized entrance windows:
- Q1: `0.00–0.18`
- Q2: `0.25–0.43`
- Q3: `0.48–0.66`
- all-visible hold: approximately `0.66–0.82`
- shared fade: `0.82–0.98`

## Particle reassurance

Locked copy remains `DONT WORRY. WE GOT YOU`.

The canvas must **not** solidify or crossfade into normal DOM typography after gathering. It remains visibly constructed from particles.

Use the React Bits Particle Text interaction model as the behavior reference:
- https://reactbits.dev/text-animations/particle-text
- https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ParticleText/ParticleText.tsx

Required behavior:
- particles gather into readable glyph positions;
- after gathering, the canvas remains live while visible;
- subtle idle particle drift remains;
- pointer movement repels nearby particles and they ease back into the glyph shape;
- no solid DOM-text visual replacement;
- canvas pauses when offscreen;
- reduced motion renders a static particle-formed message with no continuous loop or pointer interaction;
- keep Weberaise's bounded particle/DPR profiles instead of React Bits' larger stock limits.

## Growth ring legibility

The `WEB DEVELOPMENT · SEO · BRANDING ·` ring remains around stationary `GROW`, but legibility takes priority over the previous delicate treatment.

- desktop ring diameter: approximately `280–320px`;
- mobile: approximately `210–240px`;
- service characters: about `14px`, weight `800`, high-contrast Weberaise text color on desktop;
- mobile characters: about `11px`, still weight `800`;
- center `GROW` is correspondingly larger;
- rotation remains calm at approximately one revolution every `22s`.

## Unchanged scope

- Existing loader/hero/viscous reveal/EXPLORE transition remains untouched.
- Aurora statement behavior remains unchanged.
- Final Home → Services navbar-detach interaction remains out of scope.
