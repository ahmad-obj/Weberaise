# Ribbon Trail Narrative Design

## Goal
Replace the current Scroll Float question choreography with a single pinned story canvas where an editable Weberaise-blue SVG ribbon is progressively drawn by scroll. The trail visually visits three fixed questions, all three questions remain anchored in place, and the path ends near the particle reassurance.

## Scope
In scope:
- replace `QuestionSequence` + `questionMotion` behavior with the ribbon narrative;
- fixed question placement;
- reversible SVG stroke drawing;
- initial automatic ribbon segment after EXPLORE;
- trail visit thresholds for Q1/Q2/Q3;
- collective question fade near the end;
- `DONT WORRY. WE GOT YOU` particle changes: one color only, ~2x typography scale, ~1.5x particle density, persistent interactive particles;
- maintain Aurora statement and GROW ring downstream.

Out of scope:
- changing loader, hero, cursor reveal, or EXPLORE liquid transition;
- final Services navbar-detach/footer interaction;
- final artistic path geometry. The first path is intentionally simple and temporary.

## Narrative behavior
After the existing EXPLORE liquid fill reaches full black, the new `TrailNarrative` is already the first homepage scene.

1. The viewport is a pinned `100svh` story canvas.
2. A short ribbon segment starts at the upper-left edge and auto-draws from 0% to `INITIAL_PROGRESS = 0.09` without user scroll.
3. Once that opening completes, further progress is controlled by scrolling.
4. Scrolling downward extends the ribbon.
5. Scrolling upward retracts the ribbon, but never below `INITIAL_PROGRESS`.
6. The invisible future path is never shown.
7. The trail approaches, but does not cross through, each question.
8. Q1 appears near the trail at the top-left.
9. Q2 appears at the middle-right.
10. Q3 appears at the lower-left, with enough bottom clearance to avoid clipping.
11. Questions reveal locally with a restrained `translateY(24px) -> 0` + opacity transition and then stay fixed.
12. Near the end, all three questions fade together.
13. The ribbon continues to its final endpoint near `DONT WORRY. WE GOT YOU`.
14. The reassurance remains particles permanently and is cursor-interactive.

## Trail progress model
Use normalized progress values so geometry and choreography stay decoupled.

```ts
export const TRAIL_TIMING = {
  initial: 0.09,
  q1: 0.23,
  q2: 0.47,
  q3: 0.69,
  questionsFade: 0.83,
  reassurance: 0.94,
  end: 1,
} as const;
```

These values are implementation defaults, not final art direction.

## Architecture
Use SVG + GSAP ScrollTrigger.

Reasons:
- `stroke-dasharray` / `stroke-dashoffset` gives precise progressive drawing;
- path geometry can be edited independently of animation logic;
- reverse scroll is natural because draw progress is deterministic;
- cheap to render and easy to make responsive;
- no new dependency is required.

Create focused units:

```text
PostExploreNarrative/
├── TrailNarrative.tsx
├── trailPath.ts
├── trailMotion.ts
├── ParticleReassurance.tsx
├── PostExploreNarrative.tsx
└── PostExploreNarrative.module.css
```

Remove the old `QuestionSequence.tsx` and `questionMotion.ts` once the replacement is integrated and verified.

## Editable path model
The path must not be buried in the React component.

`trailPath.ts` exports desktop and mobile definitions separately:

```ts
export type TrailPathDefinition = {
  viewBox: string;
  d: string;
};

export const DESKTOP_TRAIL: TrailPathDefinition;
export const MOBILE_TRAIL: TrailPathDefinition;
```

Use a normalized SVG viewBox so later changes are simple path edits.

Temporary desktop path should:
- enter from the upper-left edge;
- curve near Q1;
- sweep toward Q2 on the right;
- return down-left toward Q3;
- finish near the reassurance region.

Mobile gets its own simplified path to avoid forced desktop scaling.

## Ribbon visual
- color: `#3B82F6`;
- desktop stroke width: about 4px;
- mobile stroke width: about 3px;
- `fill="none"`;
- `stroke-linecap="round"`;
- `stroke-linejoin="round"`;
- no moving marker;
- no visible guide path;
- no excessive glow;
- the already-travelled path is the only visible stroke.

## Initial automatic draw
The opening 9% is time-driven, not scroll-driven.

On mount in the main experience:
- determine path length;
- initialize visible progress to 0;
- animate to 0.09 over about `650ms` with a calm ease;
- only after this settles does scroll progress become authoritative;
- if the user has already scrolled by then, the effective progress becomes `max(initial, scrollMappedProgress)`.

The reverse-scroll floor always stays at 0.09.

Reduced motion:
- show the initial 9% immediately;
- keep scroll-driven stroke updates but remove local text rise motion.

## Fixed question layout
Questions are absolutely positioned inside the sticky stage and never travel with page scroll.

Desktop defaults:
- Q1: top-left, approximately `left: clamp(28px, 5vw, 84px); top: clamp(72px, 12vh, 132px)`;
- Q2: middle-right, approximately `right: clamp(28px, 5vw, 84px); top: 46%`;
- Q3: lower-left, approximately `left: clamp(28px, 7vw, 118px); top: 68%`.

Q3 must maintain at least ~120px of visual clearance from the bottom edge at common short-desktop sizes.

Mobile positions are tighter but preserve the same spatial story.

## Question reveal behavior
Each question is ordinary semantic text, not per-character Scroll Float text.

Before its visit threshold:
```text
opacity: 0
transform: translateY(24px)
```

After threshold:
```text
opacity: 1
transform: translateY(0)
```

Reverse scroll reverses this state when the corresponding progress threshold is crossed.

Near `questionsFade = 0.83`, all three fade together as a group. Reverse scrolling restores them together before the threshold.

No glitch, no character distortion, no individual exit motion.

## Particle reassurance revision
Keep the React Bits Particle Text interaction model as the reference:
- Canvas 2D text rasterization;
- particles gather to glyph targets;
- persistent render loop while visible;
- pointer repulsion;
- subtle return to text shape;
- pause offscreen;
- reduced-motion static particle formation.

Reference:
- https://reactbits.dev/text-animations/particle-text
- https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ParticleText/ParticleText.tsx

Required Weberaise adaptation:
- one particle color only: `#F5F7FA`;
- remove `#60A5FA` and `#3B82F6` particle selection completely;
- reassurance typography target approximately 2x current visual scale;
- particle sampling density approximately 1.5x current density;
- increase particle budget proportionally but keep mobile bounded;
- no solid DOM-text takeover;
- pointer interaction remains;
- no mouse click behavior required.

Recommended performance caps:
- desktop max particles: ~4000;
- mobile max particles: ~2200;
- DPR cap remains <= 1.5;
- offscreen `requestAnimationFrame` pauses via IntersectionObserver.

## Reassurance activation
Particle text can remain mounted, but its visual emphasis begins when trail progress approaches `0.94`.

Use a lightweight opacity transition on the particle container tied to trail progress; do not rebuild the particle field every scroll tick.

## Scroll scene height
Use roughly `500svh` desktop and `520svh` mobile for the temporary path. This is deliberately independent of path geometry so later path refinements do not require animation rewrites.

## Accessibility
- each question is semantic whole text and announced once;
- SVG is decorative (`aria-hidden="true"`);
- particle canvas is decorative with one semantic whole-string equivalent;
- no decorative element enters the tab order;
- reduced motion preserves all content and order.

## Acceptance criteria
- ribbon auto-draws a small opening segment after EXPLORE without scrolling;
- future path remains invisible;
- scroll extends and retracts the visible trail smoothly;
- reverse scroll never retracts below the initial segment;
- path geometry lives in `trailPath.ts` and can be edited without changing animation logic;
- questions are fixed in place and never follow the viewport through transforms;
- Q3 does not overflow or clip;
- trail visually visits Q1, Q2, Q3, then reassurance;
- questions fade as one group near the end;
- particle reassurance uses only white particles;
- reassurance particles remain interactive and never solidify;
- particle text is materially larger and denser than the current version;
- Aurora statement and GROW ring remain unchanged;
- loader, hero, EXPLORE liquid, and Services-nav-detach concept remain untouched.
