# Art-Directed Ribbon Journey + Shutter Text Design

## Status

Canonical refinement of the existing document-space ribbon journey. This specification keeps the successful normal-scroll/document-space architecture from `2026-08-12-document-space-ribbon-journey-design.md` but supersedes its generic route choreography, text-clearance assumptions, reassurance particle treatment, and ribbon styling.

Latest explicit user direction always overrides this document.

## Goal

Turn the post-EXPLORE ribbon from a functional guide line into a deliberately art-directed, continuous physical ribbon that playfully interacts with editorial artwork and typography while preserving the normal webpage journey behavior.

The ribbon must feel like one uninterrupted object from its automatic opening through its final tapered disappearance.

## Architecture That Stays Locked

The following successful behavior remains unchanged:

- page scroll is native and normal;
- questions occupy real document-flow positions;
- the ribbon exists in document space and scrolls upward with already-passed content;
- the drawing head generally remains within the existing soft viewport band around `45vh–58vh`;
- scroll down extends the ribbon;
- reverse scroll retracts it;
- question entrances happen once and do not reverse;
- no scroll-jacking;
- no fixed/sticky question stage;
- one canonical ribbon centerline controls the complete journey.

## New Global Ribbon Character

### Width

Increase the visible ribbon thickness to approximately `1.3×` the current stroke width.

The exact rendered width may be tuned by viewport, but the new ribbon must read materially stronger rather than merely one pixel thicker.

### Color

Replace the flat blue stroke with a restrained premium blue gradient derived from the Weberaise palette.

Suggested visual progression:

- `#2563EB` deep blue;
- `#3B82F6` primary Weberaise blue;
- `#60A5FA` controlled highlight;
- return toward `#3B82F6`.

The result should feel dimensional and polished, not neon, rainbow, chrome, or glow-heavy.

A very subtle edge/highlight treatment is acceptable if it helps the ribbon read as a physical strip.

### Curve language

There must be no abrupt corners or sharp tangent changes anywhere in the journey.

All route primitives must join with smooth tangent continuity. The ribbon may curve strongly, but it must never visually kink.

The route should feel hand-bent rather than mathematically perfect.

## One Ribbon Rule

Every visual event belongs to the same continuous journey:

- opening loop;
- Q1 artwork wrap;
- Q2 gentle bend;
- Q3 LOOK/OO tracing;
- reassurance oval;
- final taper.

These must not appear as detached circles, separate decorative strokes, or independently animated line fragments.

Implementation may render multiple masked/layered copies of the same centerline to create front/behind depth, but they must all derive from one canonical continuous route and use identical draw progress so the viewer perceives one physical ribbon.

## Route Primitive Model

The previous generic `opposite sweep -> safe side -> pass -> depart` builder is no longer sufficient.

The route system should become explicitly art-directed through reusable primitives such as:

- `flow` / broad spline travel;
- `ovalLoop`;
- `artworkWrap`;
- `gentleBend`;
- `glyphLoop`;
- `reassuranceLoop`;
- `taperEnd`.

The exact function names are implementation details, but route intent must remain isolated from scroll-control logic.

## Opening Sequence

### Automatic extension

After EXPLORE reaches `main`, the ribbon auto-draw should extend farther than the current opening segment.

During this automatic portion, before scroll-driven journey control takes over, it performs one playful loose loop.

Conceptually:

```text
-------------------(loose oval loop)------------------
```

The loop must not be a perfect circle. It should be slightly oval/asymmetric, like a physical strip was bent into a loop while continuing forward.

Requirements:

- loop is part of the same centerline;
- entry and exit tangents are smooth;
- auto-draw continues through the loop;
- no visible seam when scroll-driven control takes over;
- opening still acquires the existing soft center band after scroll begins.

## Question + Artwork Layout

Each question now has a paired visual artwork slot.

For this implementation phase, use designed placeholders only. These placeholders establish final geometry and layering; they are not final stock-photo content.

Layout pattern:

- Q1: text left, artwork right;
- Q2: artwork left, text right;
- Q3: text left, artwork right.

Artwork direction for the future is artistic/cartoonish/animated while still clearly communicating the associated business problem. The placeholder system must therefore support future animated illustrations without reworking journey geometry.

The placeholders should feel intentional and editorial rather than generic grey boxes.

## Q1 — `Need a website?`

### Composition

Text on left, artwork on right.

### Ribbon choreography

The ribbon approaches the artwork and performs an irregular wrap/loop around it.

The loop must have dimensional interaction:

1. approach from above/side;
2. slightly overlap an upper portion/corner in front of the artwork;
3. curve around the artwork;
4. a later section of the same loop may disappear behind the artwork near a side/lower corner;
5. re-emerge and continue toward Q2.

The wrap is not a mathematically perfect ellipse around the artwork.

### Depth model

Use a layered rendering model derived from the same canonical ribbon route:

- back ribbon layer;
- artwork plane;
- front ribbon layer.

Front/back visibility is controlled with masks/clips or equivalent, not by creating separate unrelated paths.

Draw progress must remain synchronized across both layers.

## Q2 — `Need a redesign?`

### Composition

Artwork on left, text on right.

### Ribbon choreography

This is intentionally the calmer beat between stronger interactions.

The ribbon should:

- arrive from the right-ish side of the composition;
- ease toward the center;
- make one broad, gentle bend;
- continue toward Q3.

No loop around the artwork.

No sudden S-turn.

No sharp directional change.

This section should provide visual breathing room.

## Q3 — `Need to look better online?`

### Composition

Text on left, artwork on right.

### Special typography interaction

The word is `LOOK`, not `LOOP`.

The two `O` glyphs in `LOOK` become intentional ribbon interaction targets.

This is an explicit exception to the previous global typography-clearance rule.

The ribbon should:

1. approach the sentence smoothly;
2. layer visibly over the word `LOOK`;
3. perform one imperfect trace loop around the first `O`;
4. flow directly into a second imperfect trace loop around the second `O`;
5. exit smoothly and continue the journey.

The OO loops are not detached effects. They are consecutive portions of the same centerline.

### Glyph measurement

The implementation should expose the two O characters as measurable DOM targets so the route can build against their actual rendered rectangles on desktop/mobile rather than relying on fixed pixel guesses.

The ribbon need not reproduce the exact glyph circumference; it should loosely trace them with a hand-bent physical-ribbon character while keeping `LOOK` legible.

## Reassurance — `DONT WORRY. WE GOT YOU`

### Remove particle system from this beat

The current `ParticleReassurance` visual is no longer used for this message.

The particle-specific presentation, gather behavior, cursor repulsion, and Canvas text are superseded for this beat.

### ShutterText visual behavior

Use the exact user-provided 21st.dev component behavior as the reference:

- text is split character-by-character;
- each main character begins blurred (`blur(10px)`) and transparent;
- main character resolves to sharp/opaque;
- top slice (0–35%) sweeps left -> right;
- middle slice (35–65%) sweeps right -> left;
- bottom slice (65–100%) sweeps left -> right;
- slice layers briefly appear and disappear during the sweep;
- character stagger is approximately `0.04s`;
- slice duration is approximately `0.7s`;
- main-character resolve duration is approximately `0.8s` with the source-style delayed reveal.

The component should be adapted to the existing Weberaise architecture rather than importing Tailwind/shadcn infrastructure.

### Dependency strategy

Current project uses CSS Modules and does not currently include Tailwind, shadcn, or Framer Motion.

For this feature:

- add `framer-motion`;
- do NOT add Tailwind;
- do NOT initialize shadcn;
- translate utility-class styling from the pasted component into Weberaise CSS/module classes;
- preserve the source animation behavior and Framer Motion mechanics.

### Trigger behavior

Do not use the generic source `auto`, viewport-scroll, click, or hover trigger for production reassurance.

The shutter animation should fire once when the ribbon reaches the reassurance approach region.

The ribbon controller/journey reveal state remains the source of truth.

Reduced motion should expose the final text immediately or with a simple opacity reveal.

### Weberaise styling

Keep the typography visually compatible with the existing large premium hero/post-explore type system.

Adapt slice colors to the Weberaise palette rather than keeping the source component's emerald accent.

Suggested treatment:

- main text: `#F5F7FA`;
- bright slice: `#60A5FA` or `#3B82F6`;
- middle slice: restrained light/near-white or muted blue-white.

Avoid making the effect look cyberpunk/glitchy.

## Reassurance Ribbon Loop

As the shutter text reveal happens, the ribbon performs a large loose oval around the whole reassurance composition.

Requirements:

- loop surrounds the overall text block rather than individual characters;
- shape is intentionally imperfect/organic;
- loop must not look like a perfect ellipse;
- the ribbon may approach close to the text but should not compromise legibility;
- the shutter animation and ribbon arrival should feel synchronized as one beat;
- the ribbon then exits the oval and moves only a short distance downward.

## Final Ribbon Taper

After the reassurance loop:

1. ribbon descends a short distance;
2. its visible width gradually narrows;
3. width visually resolves from full -> medium -> fine -> zero;
4. endpoint disappears cleanly with no blunt cap.

The logical centerline remains continuous through the taper.

Because SVG strokes do not natively support variable width along one path, implementation may render the final taper using a mask or a filled tapered end derived from the same canonical centerline. This is acceptable only if there is no visible seam or break.

The ribbon should feel like it gently runs out rather than fades like opacity.

## Layering Rules

The journey now intentionally uses depth.

Possible planes:

```text
front-ribbon portions
question/artwork/typography
back-ribbon portions
base ribbon/document
```

Rules:

- Q1 may alternate front -> behind artwork -> front;
- Q3 OO trace is intentionally in front of `LOOK`;
- reassurance oval should sit where it best frames the text without visual collision;
- depth changes must never make the centerline appear discontinuous;
- z-index changes are visual only; draw progress remains unified.

## Responsive Strategy

All special choreography must work from measured DOM geometry rather than fixed desktop-only coordinates.

Measure at least:

- Q1 artwork bounds;
- Q2 artwork bounds where useful for route composition;
- Q3 first O rectangle;
- Q3 second O rectangle;
- reassurance text/block bounds.

Desktop and mobile may use distinct primitive parameters.

On mobile:

- image/text layout may stack or compress intentionally;
- loops may become narrower/less dramatic;
- OO tracing must still target the actual O glyphs;
- ribbon head should preserve the journey-center behavior;
- no overflow clipping or path self-collision that makes the route unreadable.

## Accessibility

- questions remain semantic headings;
- reassurance remains semantic text even though animated;
- shutter slice layers are decorative/aria-hidden where necessary;
- artwork placeholders have appropriate semantics depending on whether they are decorative;
- ribbon remains decorative and aria-hidden;
- reduced-motion users see all text without depending on animation completion.

## Performance

- no new WebGL context;
- no Tailwind/shadcn runtime or build-system expansion;
- Framer Motion is the only new animation dependency for ShutterText;
- ribbon progress continues without React state updates per scroll frame;
- geometry rebuilds only on meaningful layout changes;
- all masked duplicate ribbon render layers share the same path and progress state;
- observers/listeners/animation controllers clean up on unmount.

## Proposed Component/Module Changes

Likely structure:

```text
src/components/ui/
  shutter-text.tsx

src/components/MainSite/PostExploreNarrative/
  JourneyNarrative.tsx
  JourneyStop.tsx
  JourneyArtwork.tsx
  RibbonTrail.tsx
  ribbonPrimitives.ts
  journeyRoute.ts
  buildJourneyPath.ts
  ribbonController.ts
  questionReveal.ts
  PostExploreNarrative.module.css
```

`ParticleReassurance.tsx` and `particleModel.ts` should be removed from the reassurance journey if no other site section uses them.

Responsibility boundaries:

- `shutter-text.tsx`: source-faithful shutter animation, controlled by an explicit active/reveal prop suitable for journey integration;
- `JourneyArtwork.tsx`: consistent responsive placeholder/future-artwork frame;
- `ribbonPrimitives.ts`: smooth route primitives such as loops/wraps/glyph traces/taper instructions;
- `buildJourneyPath.ts`: DOM measurement + composition of primitives into one canonical centerline;
- `RibbonTrail.tsx`: gradient/depth/taper rendering derived from that centerline;
- `ribbonController.ts`: scroll/head-band/draw progress only.

## Required Visual QA

The screenshot/browser review gate remains mandatory and expands to cover the new art direction.

Minimum checkpoints:

1. automatic opening with loose loop substantially drawn;
2. opening-to-scroll handoff with no seam;
3. Q1 before wrap;
4. Q1 front-overlap / behind-artwork / re-emergence states;
5. Q2 gentle center bend;
6. Q3 first O trace;
7. Q3 second O trace;
8. reassurance shutter animation during oval approach;
9. complete reassurance oval;
10. final tapered ribbon endpoint;
11. representative mobile versions of all major special interactions.

Reject implementation if:

- any ribbon segment visually breaks;
- loops look perfectly circular/mechanical;
- route contains hard corners/kinks;
- Q1 depth looks like disconnected line fragments;
- ribbon masks clip incorrectly while scrolling/reversing;
- Q3 loops miss the actual O glyphs;
- Q3 OO trace makes `LOOK` unreadable;
- Q2 becomes another busy loop instead of a breathing beat;
- shutter text looks materially different from the supplied source behavior;
- shutter effect replays on reverse scroll;
- reassurance oval feels detached from ribbon arrival;
- final endpoint has a blunt cap instead of tapering;
- gradient becomes garish/neon;
- mobile route becomes crowded or clips.

## Out of Scope

This refinement does not redesign:

- loader;
- hero typography/reveal;
- EXPLORE bottom-fill compositor;
- Aurora statement;
- GROW ring;
- later Services CTA/nav-detach concept;
- final artistic/cartoon artwork assets themselves.

## Acceptance Criteria

1. One continuous canonical ribbon route from opening to final endpoint.
2. Visible ribbon approximately 1.3× stronger than current.
3. Premium Weberaise-blue gradient treatment.
4. No sharp turns or tangent discontinuities.
5. Automatic opening extends farther and includes one loose oval loop.
6. Q1 has text-left/artwork-right layout.
7. Q1 ribbon wraps artwork with intentional front/behind/front depth.
8. Q2 has artwork-left/text-right layout.
9. Q2 ribbon uses a restrained broad bend without a loop.
10. Q3 has text-left/artwork-right layout.
11. Q3 ribbon deliberately traces the two O glyphs in `LOOK` consecutively.
12. OO loops are measured against actual glyph positions.
13. Three artwork placeholders are responsive and ready for later animated/cartoon imagery.
14. Particle reassurance is removed from this beat.
15. ShutterText reproduces the user-provided three-slice/blur/stagger behavior.
16. ShutterText uses Framer Motion without introducing Tailwind/shadcn.
17. ShutterText fires once from ribbon/journey approach state.
18. Ribbon performs an imperfect oval around the reassurance composition.
19. Ribbon continues briefly downward after reassurance.
20. Final ribbon visually tapers to zero width without a blunt ending.
21. Existing document-space scrolling and 45–58vh head behavior remain intact.
22. Reverse scrolling retracts ribbon without replaying text entrances.
23. Reduced-motion/accessibility behavior remains correct.
24. Required browser screenshots are captured and visually reviewed before completion is claimed.
