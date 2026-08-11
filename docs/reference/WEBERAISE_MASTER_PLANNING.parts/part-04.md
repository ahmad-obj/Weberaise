- long enough for the user to perceive the path they created;
- long enough to reveal and read meaningful pieces of the hidden hero;
- short enough that the screen does not become permanently covered in the back layer;
- calm and premium rather than sluggish.

Exact milliseconds are not hard-locked until motion prototypes are reviewed, but the intended perceptual duration is **around 3–4 seconds**.

## 30.3 Healing behavior — LOCKED

The trail must **not disappear uniformly all at once**.

Instead, it should heal progressively according to age:
- the oldest portions begin closing first;
- newer portions remain exposed longer;
- the reveal therefore appears to repair itself behind the moving pointer;
- the closing edge should remain organic and viscous rather than looking like opacity fading on a flat texture.

Conceptual behavior:

`new stroke → persistent viscous trail → oldest region begins healing → healing follows the historical path → fully restored front layer`

This should create the impression that the white/front surface is slowly **resealing itself**.

## 30.4 Idle / mouse-stop behavior — LOCKED

When pointer movement stops, the reveal must **not freeze completely**.

The mask should retain subtle viscous settling motion:
- small internal relaxation;
- slight edge settling;
- very restrained shape adjustment;
- no aggressive drifting;
- no screen-wide flow;
- no continued splash/ripple generation.

The movement should feel like a heavy liquid or soft viscous material naturally settling after being disturbed.

The user's input remains the dominant cause of motion. Autonomous settling is secondary and subtle.

## 30.5 Initial hero state — LOCKED

When the loader-to-hero vertical reveal lines first expose the hero:

- the hero begins with **no cursor-created blob visible**;
- the front white layer is initially intact;
- the back black layer is not already exposed through a persistent mask.

The user should first see the clean intended hero composition.

## 30.6 Autonomous introductory blob — LOCKED

Immediately after the two vertical reveal lines finish moving outward and leave the screen, the hero reveal system performs **one autonomous introductory reveal gesture**.

Purpose:
- subtly demonstrate that the hero surface is interactive;
- introduce the viscous reveal language before the user moves the cursor;
- make the interaction feel alive without showing instructions or a tutorial label.

### Behavior

A small, short viscous stroke/blob appears as though **an unseen pointer briefly crossed the surface**.

It must use the **same reveal engine and physics** as the real mouse interaction:
- same viscosity;
- same edge character;
- same reveal composition;
- same settling behavior;
- same healing behavior;
- same trail lifetime logic;
- same fade/reseal process.

It must not look like a separate canned animation pasted on top of the hero.

### Size

The autonomous reveal should be intentionally smaller than a normal exploratory user stroke.

Target visual coverage:
- enough to reveal approximately **one or two letters** of the hidden back-layer content;
- not large enough to expose a major portion of the brand lockup or typography;
- clearly visible, but subtle.

### Position

Place it in the **middle-to-lower portion of the hero**, above the bottom edge and away from awkward overlaps.

The exact coordinates should be art-directed per breakpoint so that:
- it reveals a visually interesting piece of the hidden layer;
- it does not collide with critical UI;
- it remains effective on desktop and mobile;
- it does not obscure the main `WELCOME / TO` composition.

### Motion character

The gesture should resemble a small natural brush-pass / short blob trail, not a perfect circle popping into existence.

Recommended feel:
- short movement path;
- rounded thick body;
- smooth onset;
- subtle viscous settling;
- progressive healing from oldest part to newest;
- no abrupt start or stop.

### Frequency

This autonomous gesture occurs **once per hero entrance/reveal sequence**.

It is not a periodic ambient animation and should not repeatedly distract the user while they remain on the hero.

## 30.7 Interaction continuity after autonomous blob

The autonomous introductory reveal and real pointer reveal must share one visual system.

When the user begins moving the pointer:
- no mode switch should be perceptible;
- the mouse reveal should behave exactly like the autonomous sample demonstrated;
- if the user's trail overlaps the autonomous trail while it is still healing, the two masks should merge naturally;
- their age/healing histories should remain coherent.

## 30.8 Updated hard DON'Ts

Do not:
- make the pointer footprint too small to reveal meaningful typography;
- require frantic mouse movement to understand the hidden layer;
- make one pass so large that it reveals most of the hero;
- fade the entire trail uniformly;
- freeze the mask when pointer input stops;
- allow idle settling to become autonomous watery motion;
- create ripples during settling;
- make the autonomous intro blob a perfect expanding circle;
- make the autonomous blob visually different from the cursor-generated reveal;
- make the autonomous gesture too large;
- repeat the autonomous gesture periodically;
- trigger the autonomous blob before the vertical reveal lines have fully exited;
- introduce abrupt timing between the line reveal ending and the autonomous blob beginning;
- let the autonomous effect cause a first-use shader hitch or frame drop;
- compromise visual pleasantness merely to emphasize the effect.

## 30.9 Technical interpretation

The current research-backed implementation direction remains:

`pointer / autonomous path samples → persistent history mask → lightweight flow/advection → restrained edge deformation → age-based healing → dual-layer compositor`

The autonomous intro gesture should feed synthetic path samples into the **same input pipeline** used by the real pointer rather than using a separate animation implementation.

Age-based history is particularly important because the locked healing behavior requires older regions to reseal before newer ones.

The implementation agent must review `WEBERAISE_WEBGL_REVEAL_RESEARCH.md` before selecting the final engine or shader architecture.

---

# 31. CHANGE LOG — REVEAL BEHAVIOR REFINEMENT

## 2026-08-11 — Footprint, persistence, healing, settling, autonomous intro
- Locked reveal footprint target to approximately **1/2–2/3 of hero font height vertically per normal cursor pass**.
- Locked working trail lifetime to approximately **3–4 seconds**.
- Locked **oldest-first progressive healing** rather than uniform fade-out.
- Locked subtle **viscous settling motion** after pointer movement stops; no complete freeze.
- Locked clean initial hero state with no pre-existing reveal mask.
- Locked one **autonomous introductory viscous stroke/blob** immediately after the loader-to-hero vertical reveal lines leave the viewport.
- Locked autonomous blob to reveal roughly **1–2 letters** in the middle-to-lower hero region.
- Locked autonomous gesture to use the exact same reveal engine, viscosity, trail lifetime, settling, and healing behavior as real pointer interaction.
- Locked autonomous gesture to occur **once per hero entrance**, not periodically.
- Reaffirmed `WEBERAISE_WEBGL_REVEAL_RESEARCH.md` as required technical reference for implementation.

---

# HERO INTERACTION — ADDITIONAL LOCKED DECISIONS

## Hidden WEBERAISE lockup
Locked choice: **Horizontal lockup**
- approved Weberaise mark on the left;
- approved `WEBERAISE` wordmark on the right;
- centered as one combined lockup inside the hidden/reveal layer's lower brand slot;
- preserve exact proportions from the approved logo system.

## Cursor treatment
Locked choice: **Minimal custom dot cursor**
- small, restrained custom dot;
- reveal footprint intentionally much larger than cursor itself;
- no oversized circle/ring competing with the reveal;
- remain visible over both light and dark states.

## Reveal activation
Locked choice: **Always-active natural pointer reveal**
- follows normal pointer movement immediately;
- no click-and-hold or activation step;
- pointer interpolation remains mandatory for continuous trails.

## Ambient settling after hero establishes
Locked choice: **Subtle viscous settling only in existing revealed blobs/trails**
- existing reveal shapes continue a small amount of organic settling;
- no continuously spawning autonomous blobs after the initial intro stroke;
- no constant background fluid simulation;
- no visible swimming, rippling, smoke, or screen-wide turbulence;
- settling ends as each trail heals away.

---

# HERO TYPOGRAPHY / COMPOSITION — LOCKED DECISIONS

## Typography sizing / spacing
Locked choice: **Very large typography with controlled breathing room**.

- `WELCOME / TO` should dominate the viewport without feeling cramped.
- Keep line spacing visibly intentional and premium; not ultra-tight.
- Maintain the existing centered composition.
- Scale responsively so the type remains large on all breakpoints without causing clipping or making the user feel the page needs zooming out.

## Hidden WEBERAISE lockup size
Locked choice: **Huge lockup, nearly the same width as `WELCOME`**.

- Use the approved horizontal mark + `WEBERAISE` lockup.
- Treat the brand lockup as a major reveal element rather than a small secondary logo.
- Target a width visually close to the `WELCOME` line while preserving correct logo proportions and comfortable margins.
- It occupies the deliberately empty lower slot of the front layer.

## Autonomous intro blob path
Locked choice: **Short curved / diagonal viscous stroke**.

- Appears once after the loader-to-hero reveal lines fully leave the viewport.
- Traverses a short curved or diagonal path through the middle-lower hero region.
- Reveals approximately 1–2 letters / a small portion of the large hidden WEBERAISE lockup.
- Uses the exact same brush radius, viscosity, persistence, settling, and oldest-first healing system as the real cursor reveal.
- Must feel like a natural test stroke made by an unseen gesture, not like a decorative animation asset.

## 2026-08-11 change log
- Locked hero type sizing to very large with breathing room.
- Locked hidden horizontal WEBERAISE lockup to near-`WELCOME` width.
- Locked autonomous demonstration stroke to a short curved/diagonal path.

---

# HERO EXIT / EXPLORE TRANSITION — LOCKED SPEC

## Navigation context
- A nontraditional top navigation system will exist later, but its exact design is intentionally deferred.
- Do not let navbar decisions constrain the current hero transition design yet.

## Explore button
- The hero includes a minimal `EXPLORE` button positioned below the main `WELCOME / TO / [brand slot]` composition and near the lower portion of the viewport.
- Button styling must complement the premium minimal Weberaise visual language.
- Exact button styling is still to be designed later.
- `EXPLORE` is the explicit gateway from the intro/hero state into the main scrollable site experience.

## Hero is not scroll-driven
Locked behavior:
- While the intro hero is active, the page is viewport-locked and does **not** behave as a normal scroll section.
- Scrolling should not advance the site while the user is in the hero state.
- The interactive viscous reveal remains the primary hero interaction.
- The main website's scroll-based experience begins only after the user activates `EXPLORE`.

## Site architecture direction
Preferred architecture: **same route / same homepage state transition**, not a separate page reload.

Rationale:
- preserve a continuous cinematic transition;
- avoid route-loading or visual discontinuity;
- keep the next content preloaded and ready underneath;
- allow the hero exit mask to transition directly into the first scroll section.

Treat the homepage as two experience states:
1. **Intro/Hero state** — viewport locked, interactive reveal active, `EXPLORE` available.
2. **Main-site state** — normal scroll experience enabled, beginning with First Impression.

A separate route should only be reconsidered later if a concrete engineering constraint makes it clearly superior; it is not the current design direction.

## Explore click — transition choreography
On `EXPLORE` activation:

1. Prevent accidental scroll/input conflicts during the transition.
2. Gracefully retire/de-emphasize the hero's interactive pointer reveal and `EXPLORE` control.
3. From the **entire bottom edge of the viewport**, generate a solid black viscous mass using the same family of blob/mask behavior as the hero's pointer reveal.
4. This mass rises upward as though the viewport is being filled with a thick, high-viscosity liquid.
5. Unlike the interactive hero reveal, this transition mask does **not** expose the hidden inverse hero layer. Its filled region is simply pure/near-pure black.
6. The leading top edge should remain rounded and organically irregular, consistent with the established thick paint/blob language.
7. The black mass continues rising until it has traversed and covered the entire viewport.

## Visual character of the rising fill
The rising transition must feel like:
- thick viscous paint / gel filling upward;
- cohesive rather than splashing;
- gently irregular at the crest;
- low-turbulence;
- smooth and premium;
- continuous with the hero's established reveal language.

It must **not** feel like:
- a rectangular wipe;
- a generic CSS panel sliding upward;
- a water wave;
- a splash simulation;
- foam/bubbles;
- smoke;
- a chaotic fluid demo.

## Traversal rule
Hard requirement:
