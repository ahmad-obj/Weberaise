The typography should occupy a **large, commanding portion of the viewport**.

Size intent:
- significantly larger than conventional website hero copy;
- not so oversized that users feel they need to zoom out;
- not reduced into ordinary/small hero typography;
- optimized to feel large rather than merely using an arbitrary huge `vw` value.

Responsive sizing must preserve this balance across desktop and mobile.

## 22.3 Composition / empty lower brand slot

Conceptual composition:

```text
WELCOME
TO
[ EMPTY ]
```

The `[ EMPTY ]` notation is **only a planning diagram**, not literal content or an outlined UI box.

The intended geometry is:
- `WELCOME / TO` forms the upper content of a unified typographic composition;
- beneath `TO`, a deliberate empty region remains on the **front layer**;
- the overall conceptual typography block is visually centered in the hero, accounting for the intentionally unused lower portion of the viewport;
- the hero should not simply center each line independently without considering the full composition.

The bottom portion of the screen should retain deliberate breathing room rather than typography consuming every available pixel.

---

# 23. BEHIND / REVEAL HERO LAYER

## 23.1 Opposite color system

Behind/reveal layer uses the exact inverse palette:
- background: **black**;
- typography: **white**.

## 23.2 Perfect registration requirement

The behind layer repeats:

```text
WELCOME
TO
```

with **exactly the same geometry as the front layer**.

This is a hard registration requirement.

The following must match 1:1 between layers:
- font family;
- font weight;
- font size;
- line height;
- letter spacing;
- horizontal position;
- vertical position;
- line breaks;
- responsive behavior;
- transforms;
- overall scale.

Only the palette changes:
- front: white background / black type;
- behind: black background / white type.

There must be no perceptible text jump when the fluid reveal crosses `WELCOME / TO`.

## 23.3 Weberaise brand content fills the front layer's empty slot

The region intentionally empty on the front layer is occupied on the behind layer by the approved **WEBERAISE brand lockup**.

This content should use:
- approved Weberaise W→arrow brand mark;
- approved `WEBERAISE` wordmark typography;
- final logo/wordmark proportions from the approved identity system.

Conceptual comparison:

Front layer:

```text
WELCOME
TO

```

Behind layer:

```text
WELCOME
TO
[ WEBERAISE MARK + WORDMARK ]
```

The brand content belongs to the hidden/reveal layer and is therefore discovered through the fluid reveal rather than being permanently present on the default white layer.

---

# 24. HERO TYPOGRAPHY PRINCIPLES

Hero typography direction:
- bold;
- modern;
- minimal;
- large;
- highly intentional;
- clean rather than decorative;
- premium rather than loud for its own sake.

Hard size principle:

> Typography should feel **optimally huge**, not absurdly huge and not conventionally small.

Avoid:
- giant letters that require zooming out to understand the layout;
- undersized agency-template hero copy;
- ornamental display type that conflicts with Weberaise's premium-tech identity;
- arbitrary typography scaling that breaks on intermediate viewport widths.

Exact font family and responsive sizing formula remain to be chosen during typography prototyping.

---

# 25. HERO INTERACTIVE REVEAL — CORE BEHAVIOR LOCKED

The hero uses an interactive **semi-fluid / viscous paint-trail reveal** inspired by the controlled reveal quality of **Nothin' / noth.in** and the **Lando Norris** website.

Its purpose is to reveal the black/white behind layer through the white/black front layer while keeping the interaction composed, premium, readable, and tightly tied to the user's pointer path.

Currently locked:
- two perfectly registered hero layers;
- front layer and reveal layer use inverse palettes;
- `WELCOME / TO` remains perfectly aligned across both layers;
- Weberaise brand lockup exists only in the hidden layer's lower slot;
- reveal is **pointer/mouse-trail driven** on desktop;
- the reveal should be **semi-fluid, highly viscous, thick, rounded, and paint-stroke/blob-like**;
- the reveal should follow the pointer path rather than behave like a free-running fluid field;
- a meaningful trail remains behind the pointer and fades away **slowly**, not instantly;
- outward spreading after the pointer passes must be restrained;
- overlapping passes should merge smoothly into a larger organic reveal region;
- the effect should feel like the pointer is **opening / tearing through the front layer with a heavy viscous liquid stroke**, not splashing water across the hero;
- the hidden layer is revealed only where the interactive mask has actually reached;
- visual quality should be comparable in spirit to the Nothin'/Lando references without copying their proprietary implementation;
- implementation must remain smooth and optimized.

**STILL NOT LOCKED — DO NOT GUESS:**
- exact brush radius in pixels/vw;
- exact trail lifetime / half-life;
- exact boundary softness;
- exact amount of edge irregularity/noise;
- exact amount of post-pointer settling/drift;
- whether the trail ever leaves a faint residual history before fully returning;
- exact pointer-speed response;
- exact mobile/touch adaptation;
- hero-to-next-section transition.

These remaining values should be chosen through a small visual prototype/tuning pass, using the dedicated research dossier as the technical foundation.

---

# 26. FLUID REVEAL REFERENCE RESEARCH — ACTIVE

## Target reference

**Reference website:** `https://noth.in/`

Goal:
- identify a proven implementation or codebase capable of delivering a fluid mask between two full-viewport hero layers;
- prefer adapting a technically strong public implementation over rebuilding fluid simulation from zero;
- preserve legal/licensing compatibility before production reuse;
- profile performance before integrating.

## Candidate reference slot

**Primary candidate:** Ksenia Kondrashova — `WebGL liquid masking`

Why it is relevant:
- explicitly uses a WebGL fluid simulation as a reveal/masking mechanism;
- reveals underlying visual content through a liquid field;
- its structure is much closer to Weberaise's required front-layer → hidden-layer masking than a generic image distortion shader;
- it is based on Pavel Dobryakov's well-known WebGL fluid simulation.

**Original demo:** `https://codepen.io/ksenia-k/pen/dyaeGgO`

**Readable code mirror/reference discovered:** `https://gist.github.com/djsnipa1/5332cb37da38b7b1c37365e5539c79a0`

**Underlying fluid simulation:** `https://github.com/PavelDoGreat/WebGL-Fluid-Simulation`

## Secondary reference

**Pavel Dobryakov — WebGL Fluid Simulation**

Use as:
- lower-level fluid engine reference;
- performance/configuration reference;
- basis if the masking demo needs to be rewritten into a cleaner React/Next/WebGL component.

Repository:
`https://github.com/PavelDoGreat/WebGL-Fluid-Simulation`

## Implementation research rule

Do **not** blindly paste third-party demo code into production.

Before implementation:
1. confirm license/reuse terms for the exact source used;
2. isolate the fluid simulation from demo-specific image/content code;
3. adapt output into a mask that composites the two Weberaise DOM/canvas layers;
4. cap simulation resolution independently from display resolution;
5. test pointer + touch behavior;
6. profile GPU/frame time on lower-end hardware;
7. provide reduced-motion / unsupported-WebGL fallback;
8. ensure the loader has initialized all required resources before the hero reveal begins.

**Status:** Candidate found; final adaptation architecture will be chosen after the user defines the exact fluid reveal behavior.

---

# 27. CHANGE LOG — HERO COMPOSITION UPDATE

## 2026-08-11 — Loader-to-hero and hero core layout
- Replaced the previous idea of fully collapsing the loader line.
- Locked partial horizontal collapse → 90° rotation → full-height vertical line.
- Locked duplication into twin vertical reveal boundaries.
- Locked outward movement of both lines until they exit the viewport.
- Locked traversal-based spatial reveal: hero appears only where the moving boundaries have passed.
- Added strict smoothness/performance requirements for this reveal.
- Locked two-layer hero architecture.
- Locked front layer: white background / black `WELCOME / TO` typography / intentionally empty lower brand slot.
- Locked behind layer: black background / white typography in exact 1:1 registration.
- Locked approved Weberaise mark + `WEBERAISE` wordmark into the behind layer's lower slot.
- Locked large, bold, modern, minimal hero typography direction with an "optimally huge" size target.
- Recorded fluid reveal concept while explicitly leaving interaction behavior unresolved.
- Began fluid reveal implementation research and recorded Ksenia Kondrashova's WebGL liquid masking demo + Pavel Dobryakov's WebGL Fluid Simulation as current technical candidates.

---

# 28. HERO REVEAL — VISCOUS PAINT-STROKE SPECIFICATION

**Status:** Core interaction character approved. Exact numeric tuning remains for prototype comparison.

This section is the canonical visual/behavioral specification for the interactive reveal inside the two-layer hero.

## 28.1 Effect classification

Do **not** describe or implement this as a conventional full-screen WebGL fluid simulation.

The intended effect is better described as:

> **A thick, rounded, semi-fluid viscous paint/blob trail that follows the pointer, opens the front layer locally, persists for a while, and slowly fades back.**

The visual target sits between:
- a soft paint stroke;
- a heavy liquid smear;
- an organic blob trail;
- a restrained fluid mask.

It should **not** sit in the visual category of:
- water ripples;
- splashes;
- smoke;
- free-running fluid turbulence;
- a small circular flashlight mask.

## 28.2 Pointer-focused behavior

The pointer is the primary source of the reveal on desktop.

The interaction must feel causally attached to the cursor path:
- pointer moves → a thick organic reveal is deposited along that path;
- the reveal follows the path closely;
- the mask should not continue spreading aggressively across unrelated areas;
- the effect should not create large waves or ripples beyond the path;
- any post-pointer motion should be subtle settling/viscous relaxation only.

The reveal should feel like the user is **dragging a heavy, controlled liquid opening through the front layer**.

## 28.3 Shape character — LOCKED

Preferred shape:
- **thick** rather than thin;
- **rounded** rather than slit-like;
- **blob / paint-stroke** rather than watery;
- soft organic contour without becoming blurry or shapeless;
- continuous path with no dotted gaps;
- smooth merging where the pointer crosses its own previous trail.

The base shape must not remain a visibly perfect circle around the pointer.

A rounded core is acceptable internally, but the visible reveal edge should gain enough organic deformation and path history that it reads as one viscous stroke rather than a cursor spotlight.

## 28.4 Reveal size philosophy

The reveal must be large enough that the visitor can naturally explore the hidden layer without having to scrub the mouse frantically over every letter.

