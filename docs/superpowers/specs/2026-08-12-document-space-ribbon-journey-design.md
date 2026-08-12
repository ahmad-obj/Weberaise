# Document-Space Ribbon Journey Design

## Status

Canonical replacement for the previous sticky-stage ribbon concept. This specification supersedes:

- `docs/superpowers/specs/2026-08-12-ribbon-trail-narrative-design.md`
- the current sticky `100svh` question/ribbon implementation in `PostExploreNarrative`

Latest explicit user direction always overrides this document.

## Goal

Create a post-EXPLORE journey where the page scrolls normally, questions occupy real document positions, and a blue ribbon appears to lead the viewer down the page. The visible ribbon head should remain within a soft vertical viewport band while the already-drawn trail and previously passed content naturally move upward with the document.

The experience must feel like the viewer is travelling along a path through the page, not watching a pinned animation stage.

## Core Mental Model

The document itself moves normally.

- Questions are real HTML content in normal document flow.
- The reassurance beat is also normal-flow content, not a viewport-pinned overlay.
- The ribbon exists in document space and scrolls with the page.
- The ribbon head is the only element whose visible position is indirectly controlled to remain near the viewport center.
- The ribbon head may move freely horizontally.
- The ribbon path already travelled remains visible behind the head.
- The future path remains invisible.
- Reverse scrolling retracts the ribbon.
- Question entrances do not reverse or replay after they have revealed once.

## Locked Interaction Decisions

1. Ribbon head uses a soft vertical viewport band, approximately `45vh–58vh`.
2. Nominal ribbon-head position is approximately `52vh`.
3. The head may drift within that band around question visits.
4. The ribbon subtly lingers around each question without slowing or hijacking actual page scrolling.
5. A question begins revealing slightly before the ribbon's closest approach.
6. Ribbon always maintains deliberate visual clearance from typography.
7. Once revealed, a question stays revealed permanently.
8. Reverse scroll retracts only the ribbon.
9. Path language is mostly vertical with occasional wide horizontal sweeps and smooth curves.
10. Question entrances have no exit animation.
11. Remaining micro-decisions should be made by the implementation rather than repeatedly asking the user.

## Why the Current Sticky Architecture Is Wrong

The current implementation uses:

- a tall scroll wrapper,
- a sticky `100svh` stage,
- absolutely positioned questions inside that viewport,
- percentage-based ribbon progress.

That architecture makes the questions look pinned and makes the path feel like a viewport animation. It cannot create the intended sensation of moving through a normal webpage while following a route.

The redesign must remove the sticky story-stage model entirely.

## Architecture

### 1. Normal-Flow Journey Section

The journey section is a tall normal-flow document region.

Questions and reassurance occupy authored vertical locations using real layout spacing rather than viewport `top`/`bottom` pinning.

Example conceptual order:

```text
EXPLORE completes

journey intro space

Need a website?

vertical travel

                         Need a redesign?

vertical travel

Need to look better online?

vertical travel

                    DONT WORRY. WE GOT YOU
```

Horizontal composition may use wrappers, alignment, grid, or offsets, but each stop must remain in normal document flow.

### 2. Document-Space SVG Ribbon

A single SVG spans the full journey section in document space.

Requirements:

- absolute relative to the journey section, not fixed/sticky to viewport;
- height tied to the measured journey content;
- blue stroke `#3B82F6`;
- rounded caps and joins;
- no travelling marker dot;
- no visible future path;
- travelled path remains visible;
- path itself scrolls upward naturally with the document.

The SVG path geometry must remain independently editable from scroll mechanics.

### 3. Geometry Source

Replace fixed viewport path definitions with a document-route model.

Recommended structure:

```text
journeyRoute.ts
  desktop route settings
  mobile route settings
  question visit preferences
  clearances
  horizontal sweep intent

buildJourneyPath.ts
  measures journey stops
  converts layout landmarks into SVG geometry
```

Question positions should be measured from the DOM so responsive layout changes do not require manually synchronizing two unrelated coordinate systems.

Each question should expose a semantic journey anchor such as:

```html
data-journey-stop="q1"
data-journey-stop="q2"
data-journey-stop="q3"
```

The route builder may use these measured rectangles plus art-direction settings to generate the final path.

## Path Shape Rules

The path should be predominantly downward-progressing in document Y.

Allowed:

- broad left/right sweeps;
- smooth cubic curves;
- local horizontal travel near a question;
- small vertical drift around visit moments.

Avoid:

- chaotic zig-zags;
- repeated large upward loops;
- dense scribbling;
- path crossing through typography;
- visually arbitrary curvature.

The route should remain sufficiently monotonic in Y for reliable document-Y to path-length lookup.

## Ribbon-Head Tracking

### Problem

A simple mapping of `scroll progress -> path progress` is insufficient because different path sections have different vertical and horizontal lengths. The head must visually remain around the viewport's center band regardless of local path curvature.

### Correct Mapping

At runtime:

1. Measure the journey section's document top.
2. Sample the active SVG path using `getTotalLength()` and `getPointAtLength()`.
3. Build a lookup table of sampled path positions containing at least:
   - path length,
   - local SVG Y,
   - corresponding document Y.
4. On scroll, compute a desired ribbon-head document Y.
5. Resolve the nearest path length for that desired Y.
6. Set `strokeDasharray` and `strokeDashoffset` so the stroke ends there.

Conceptually:

```text
targetDocumentY = journeyDocumentTop + journeyScrollOffset + desiredViewportHeadY
```

The exact formula must account for the SVG coordinate-to-document scaling.

Use a binary search or equivalent efficient lookup rather than scanning the entire sample table every frame.

## Soft Center Band

The ribbon head should normally appear around `52vh`, but may drift between approximately `45vh` and `58vh`.

The controller may vary the desired head Y based on proximity to journey stops.

Suggested art-direction behavior:

```text
normal travel     ~52vh
approach question ~54-56vh
closest visit     ~47-50vh
departure          ~51-53vh
```

These are tuning targets, not hard animation keyframes.

The result should feel organic and journey-like, not mechanically locked to a horizontal scanline.

## Subtle Linger Near Questions

Do not modify native scroll speed.

The linger effect should come from route geometry and head-band drift:

- the path becomes less vertically aggressive near a question;
- it spends more route length travelling horizontally beside the text;
- the head can drift slightly within the soft center band;
- the viewer therefore experiences more visual time near the question while scrolling normally.

No scroll-jacking, wheel interception, or artificial pause is allowed.

## Typography Safety Zones

The ribbon must never cross through or behind question typography.

For every measured question rectangle, create a safety region using responsive clearance.

Initial targets:

- desktop: approximately `70–110px` clearance;
- tablet: approximately `55–90px`;
- mobile: approximately `28–52px`.

The route should pass deliberately beside the question, not merely avoid collision by a few pixels.

## Question Layout

Questions are normal-flow HTML elements.

Suggested broad composition:

- Q1: left-aligned in the first major stop;
- Q2: right-aligned farther down;
- Q3: left-aligned farther down again;
- Q3 must have enough following space that it cannot clip against the viewport bottom during entrance.

They should scroll like ordinary page content after revealing.

No question remains pinned to the viewport.

## Question Entrance

Entrance happens once, slightly before the ribbon's closest approach.

Recommended visual treatment:

- whole block starts roughly `24px` below final position;
- opacity starts at `0`;
- block rises to final position;
- characters may use a very restrained stagger for refinement;
- no strong vertical stretching;
- no glitching;
- no exit animation.

Target duration range: approximately `700–900ms` under normal motion.

Use a premium easing consistent with the site.

### Trigger Logic

Do not trigger only by generic viewport intersection.

A question reveals when the ribbon head enters an approach region associated with that journey stop.

The reveal should begin slightly before closest approach.

### One-Time Reveal State

Once revealed, the question remains revealed for the lifetime of the mounted page.

Reverse scroll does not hide it.

The implementation may track this with an in-memory `Set` or an equivalent one-way state mechanism.

## EXPLORE Handoff

The current EXPLORE bottom-fill transition remains untouched.

After the experience state becomes `main`:

1. a short first ribbon segment begins drawing automatically from the top-left area;
2. no scroll is required for this opening segment;
3. once the user starts scrolling, the controller smoothly transitions into journey tracking;
4. over the early travel region, the head acquires its soft center band;
5. there must be no visible snap between automatic and scroll-driven modes.

Reverse scroll should never retract before the intentional automatic opening segment if the journey returns to its absolute start.

## Reassurance Endpoint

The journey eventually approaches:

`DONT WORRY. WE GOT YOU`

The reassurance is a real normal-flow journey stop. It must not be absolutely pinned to the viewport.

The ribbon should terminate or settle nearby with the same typography-clearance discipline used for questions. Its particle animation activates when the ribbon head enters the reassurance approach region; it should not appear as an unrelated viewport overlay.

The particle text behavior remains:

- Canvas-based;
- one particle color only: `#F5F7FA`;
- no blue particles;
- large, dense typography;
- interactive pointer repulsion;
- subtle idle drift;
- remains particles permanently;
- never converts to solid DOM typography;
- offscreen animation should pause where possible;
- reduced-motion mode should remain static and accessible.

After this beat, normal document flow continues into the Aurora statement and GROW ring.

## Responsive Strategy

Desktop and mobile may use different art-direction route settings, but both should be built against measured journey-stop rectangles.

Responsive path handling must not rely on scaling a single desktop route blindly.

Important cases:

- desktop wide;
- laptop short-height;
- tablet portrait;
- mobile portrait;
- orientation change;
- browser resize.

Path geometry and lookup tables must rebuild on meaningful layout changes.

Use `ResizeObserver` or an equivalent bounded rebuild strategy.

Avoid rebuild loops caused by tiny subpixel changes.

## Reduced Motion

Under `prefers-reduced-motion: reduce`:

- questions may reveal with simple opacity or immediately when approached;
- no character distortion;
- ribbon may still track scroll but should avoid extra intro flourish and head-band oscillation;
- particle text should remain readable with reduced/no idle motion;
- no behavior should depend on animation completing to expose semantic content.

## Accessibility

- questions remain semantic headings;
- SVG ribbon is decorative and `aria-hidden`;
- Canvas particle text has a semantic text equivalent for assistive technology;
- no interactive ribbon element enters the tab order;
- content remains understandable without motion.

## Performance

- no new WebGL context;
- no new general animation dependency;
- use GSAP/ScrollTrigger already in the project only where helpful;
- scroll frame work must avoid React state updates;
- path sampling occurs on build/rebuild, not every scroll frame;
- per-frame lookup should be bounded and cheap;
- use requestAnimationFrame or ScrollTrigger update batching;
- no layout-thrashing loop of alternating DOM reads and writes per frame;
- observers/listeners must be cleaned up on unmount.

## Proposed File Boundaries

```text
PostExploreNarrative/
  JourneyNarrative.tsx
  JourneyStop.tsx
  RibbonTrail.tsx
  journeyRoute.ts
  buildJourneyPath.ts
  pathLookup.ts
  ribbonController.ts
  questionReveal.ts
  ParticleReassurance.tsx
  PostExploreNarrative.tsx
  PostExploreNarrative.module.css
```

Responsibilities:

- `JourneyNarrative.tsx`: semantic normal-flow composition.
- `JourneyStop.tsx`: individual measured content stops.
- `RibbonTrail.tsx`: SVG rendering only.
- `journeyRoute.ts`: editable art-direction configuration.
- `buildJourneyPath.ts`: measured DOM landmarks to path geometry.
- `pathLookup.ts`: sampled document-Y to path-length mapping.
- `ribbonController.ts`: scroll/head-band progress only.
- `questionReveal.ts`: one-way entrance triggers only.

Geometry, controller logic, and typography animation must stay separable.

## Screenshot-Based Visual Verification — Required Completion Gate

Source-code correctness is not sufficient for this feature.

After implementation, actual screenshots must be captured at representative scroll positions and inspected visually before completion is claimed. A passing unit/source test suite does not waive this gate.

Minimum viewport sizes:

- `1440×900`
- `1280×720`
- `390×844`

Minimum journey checkpoints:

1. EXPLORE just completed; automatic ribbon start visible.
2. Early scroll; ribbon head acquiring center band.
3. Just before Q1 reveal.
4. Q1 revealed with ribbon passing nearby.
5. Q2 approach/visit.
6. Q3 approach/visit.
7. Between Q3 and reassurance.
8. Ribbon arriving beside `DONT WORRY. WE GOT YOU`.

The screenshot workflow must produce viewable image artifacts. The implementing agent must inspect those images rather than merely confirming that capture commands ran.

### Visual Rejection Criteria

Reject the implementation if screenshots or browser inspection show any of the following:

- ribbon head generally outside the `45–58vh` band after acquisition;
- ribbon feels pinned to viewport rather than belonging to document space;
- old travelled ribbon does not naturally scroll upward;
- questions appear fixed rather than normal-flow;
- question entrance happens noticeably disconnected from ribbon approach;
- ribbon crosses or sits behind text;
- future path is visible;
- Q3 clips or overflows;
- horizontal sweeps feel random or excessively busy;
- ribbon route is too dense;
- question entrance feels abrupt/fast;
- scrolling is hijacked or slowed;
- reverse scroll hides already-revealed questions;
- reassurance feels disconnected from trail endpoint;
- reassurance behaves like a viewport-pinned overlay;
- mobile path becomes cramped or visually incoherent.

### Visual Acceptance Statement

The experience is successful only when scrolling feels like following a route through a page, with the ribbon continually guiding the viewer toward the next message while the page itself still behaves like a normal webpage.

## Testing Strategy

Automated source/unit contracts should cover:

- no sticky journey-stage architecture;
- questions and reassurance exist in normal-flow wrappers;
- path geometry is generated independently from controller logic;
- path lookup uses sampled `getPointAtLength()` data;
- reverse scroll retracts stroke;
- auto-start floor is preserved;
- question reveal state is one-way;
- ribbon is decorative/hidden from accessibility tree;
- no blue particle colors remain in reassurance;
- resize cleanup and observer cleanup are present.

Browser/manual verification must cover the screenshot gate above.

## Out of Scope

This redesign does not change:

- loader choreography;
- loader-to-hero transition;
- hero fluid reveal;
- EXPLORE bottom-fill architecture;
- Aurora copy or palette;
- GROW ring concept;
- Services navbar-detach CTA concept;
- downstream placeholder homepage sections.

## Acceptance Criteria

1. Journey stage is not sticky or viewport-pinned.
2. Questions occupy real document-flow positions.
3. Reassurance occupies a real document-flow position.
4. Questions naturally scroll into and out of the viewport.
5. Ribbon exists in document space and scrolls with the journey.
6. Future path is invisible.
7. Travelled path remains visible.
8. Ribbon head normally stays within approximately `45–58vh` after acquisition.
9. Head may travel anywhere horizontally.
10. Scroll down extends ribbon.
11. Reverse scroll retracts ribbon.
12. Reverse scroll does not hide previously revealed questions.
13. Short ribbon opening draws automatically after EXPLORE/main.
14. Transition from opening to journey tracking is visually continuous.
15. Q1/Q2/Q3 reveal slightly before closest ribbon approach.
16. Questions have entrance animation only.
17. Ribbon maintains deliberate text clearance.
18. Path uses mostly vertical motion with smooth broad horizontal sweeps.
19. Question visits subtly linger without scroll-jacking.
20. Reassurance activates from ribbon approach, not generic pinned-state timing.
21. Reassurance uses only `#F5F7FA` particles.
22. Reassurance remains interactive particle Canvas and never solidifies.
23. Responsive path is rebuilt from actual measured stop geometry.
24. Reduced-motion and accessibility behavior are preserved.
25. Required screenshot checkpoints produce actual image artifacts and are visually reviewed.
26. Visual rejection criteria are all cleared before completion is claimed.
27. Loader, hero, Explore compositor, Aurora statement, and GROW ring remain outside this redesign scope.
