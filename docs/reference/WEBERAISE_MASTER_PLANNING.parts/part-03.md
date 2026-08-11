Avoid both extremes:

### Too small — rejected
- tiny flashlight-sized mask;
- user must move very fast or repeatedly paint the same area;
- WEBERAISE hidden lockup becomes difficult to discover;
- interaction feels like work rather than a premium effect.

### Too large — rejected
- one pointer movement exposes most of the viewport;
- effect loses locality;
- hidden layer stops feeling discovered;
- mask begins behaving like a full-page transition instead of an interaction.

Target:
- **medium-large, generous reveal footprint**;
- thick enough to expose meaningful pieces of the large hero typography with one natural movement;
- still local enough that unreached portions remain genuinely front-layer white.

Exact radius is intentionally left for visual prototyping.

## 28.5 Viscosity and spreading — LOCKED

The effect should feel **high-viscosity**.

Required characteristics:
- trail remains cohesive;
- little outward diffusion;
- no broad watery expansion;
- no fast dispersion;
- no wave propagation across the screen;
- no strong curl/vortex behavior;
- no turbulent tendrils flying away from the cursor path.

The reveal can breathe/relax subtly after deposition, but it should largely preserve the path drawn by the user.

A useful mental model:

> **Heavy gel / thick paint**, not water.

## 28.6 Persistence / trail memory — LOCKED DIRECTION

The reveal must leave a meaningful trail behind the pointer.

The trail:
- must not disappear immediately behind the cursor;
- should remain long enough for the user to perceive and read the revealed hidden content;
- should fade back **slowly and smoothly**;
- should allow multiple nearby strokes to visually coexist and merge;
- should generally have older parts return before newer parts.

Working research range is roughly **2–3+ seconds of clearly perceptible history**, but exact lifetime is **not yet locked** and must be judged visually.

The decay should be time-based/frame-rate-independent so the real-world trail lifetime remains consistent on 60 Hz, 90 Hz, 120 Hz, etc.

## 28.7 Fade-back behavior

As the reveal disappears:
- no hard shrinking circles;
- no sudden opacity drop;
- no random holes popping open/closed;
- no frame-to-frame contour flicker;
- no visible stepping in the boundary.

Preferred behavior:
- older mask history gradually loses strength;
- edges contract/dissolve gently;
- the front white layer naturally restores itself;
- restoration should feel like the viscous opening is closing/healing, not a CSS fade being applied to the entire hero.

## 28.8 Organic edge behavior

The edge should be organic but restrained.

Desired:
- slight irregularity;
- slow, coherent deformation;
- subtle viscous softness;
- smooth blob merging;
- clean enough to preserve strong typography readability.

Rejected:
- noisy jagged perimeter;
- boiling edge;
- excessive turbulence;
- high-frequency noise;
- obvious procedural shader pattern;
- edge distortion that wobbles the typography itself.

Only the **mask boundary** should feel fluid. The actual front/back content must remain crisp and geometrically stable.

## 28.9 Strict reveal semantics

Hard rule:

> **Only portions of the hidden hero that the reveal mask has traversed may become visible.**

No global fade should expose the hidden layer.

The user's path is the reveal history.

Front and hidden layers remain perfectly registered underneath this mask.

## 28.10 Motion quality

The interaction must feel composed and intentional.

Requirements:
- immediate enough pointer response that the trail feels connected to the mouse;
- smoothing should remove jitter without creating noticeable lag;
- fast mouse movement must remain continuous through interpolation;
- no detached mask chasing far behind the pointer;
- no sudden radius changes;
- no abrupt velocity spikes;
- no visible simulation instability;
- overlapping masks merge cleanly;
- after pointer stop, motion settles instead of continuing to swim around.

## 28.11 Visual pleasure requirement — HARD DON'T

A technically correct effect is not sufficient.

The effect must be aesthetically pleasing in the context of the hero.

Reject any prototype that feels:
- messy;
- cheap;
- gimmicky;
- distracting;
- visually unpleasant;
- too game-like;
- too much like a stock WebGL demo;
- too watery;
- too weak/subtle to discover;
- too aggressive to read the hero.

The signature interaction must support the typography and brand composition rather than compete with them.

## 28.12 Reference behavior

Primary visual references:
- **Nothin' / noth.in** — controlled organic reveal/material language;
- **Lando Norris website** — localized pointer-driven organic reveal behavior.

These are **behavioral and quality references**, not assumed code sources.

Do not claim their exact production shader/algorithm unless independently verified.

## 28.13 Dedicated technical research dossier — REQUIRED READING

Before implementation or prototype architecture decisions, read:

**`WEBERAISE_WEBGL_REVEAL_RESEARCH.md`**

That document contains the technical research for:
- full GPU fluid foundations;
- OGL Flowmap;
- persistent ping-pong history masks;
- trail textures;
- SDF/blob approaches;
- 2D metaballs;
- light advection;
- edge noise/domain warping;
- dual-layer compositing;
- pointer interpolation;
- frame-rate-independent trail persistence;
- GPU warm-up during the real loader;
- mobile/low-end/reduced-motion fallbacks;
- licensing/reuse notes;
- Nothin' and Lando Norris reference-study limitations;
- candidate prototype modes;
- acceptance criteria.

### Current research recommendation — NOT YET A LOCKED IMPLEMENTATION CHOICE

The research currently favors:

> **Pointer history → persistent low-resolution mask → lightweight flowmap/advection → restrained organic edge noise → smooth threshold → two-layer compositor**

This is preferred over a full Navier–Stokes fluid solver because it better matches the desired:
- thick trail;
- higher viscosity;
- low outward spread;
- controlled persistence;
- smooth blob merging;
- better performance;
- easier art direction.

Do not hard-lock this architecture until the prototype comparison confirms that it produces the desired visual quality.

## 28.14 Prototype modes worth comparing later

When implementation begins, the preferred comparison set is:

1. **Viscous Flow Trail — primary candidate**  
   Persistent history + lightweight flow + restrained edge deformation.

2. **Organic Paint Trail**  
   Persistent brush/history + blur/threshold/noise, with essentially no advection.

3. **Metaball / SDF Blob Trail**  
   Strong rounded merging and deterministic blob character.

4. **Reduced Full-Fluid Density Mask**  
   Use only as the high-physics comparison to confirm whether extra simulation actually improves the result.

The final choice should be made on visual quality + frame time, not theoretical sophistication.

## 28.15 Performance requirements

The reveal is a hero-critical interaction and must be warmed during the existing real loader where practical.

Implementation priorities:
- initialize WebGL context before hero interaction begins;
- compile shaders before interaction;
- allocate render targets before interaction;
- keep simulation/mask resolution lower than display resolution;
- upscale mask smoothly;
- clamp DPR appropriately;
- keep pointer updates out of React rerender state;
- use GPU-friendly feedback passes;
- avoid full-resolution blur;
- avoid unnecessary fluid pressure passes;
- provide a lightweight fallback on weak devices;
- ensure no first-hover hitch;
- preserve quality while targeting smooth 60fps behavior on practical hardware.

## 28.16 HARD DON'TS — interactive reveal

Do not implement:
- full-screen watery fluid response;
- ripples propagating across the hero;
- splash effects;
- smoke-like turbulence;
- strong vortices/curl;
- fast outward diffusion;
- long autonomous fluid motion after the cursor stops;
- a perfect circular flashlight mask;
- a very small reveal footprint;
- a giant reveal footprint that exposes most of the page at once;
- a thin slit/tear as the primary shape;
- dotted/broken trails under fast movement;
- instant fade-out;
- permanent full accumulation unless later explicitly requested;
- blurry typography;
- laggy cursor tracking;
- irregular or popping edge shapes;
- low-resolution staircase artifacts;
- a visually unpleasant effect merely because it is technically impressive.

---

# 29. CHANGE LOG — VISCOUS REVEAL LOCK

## 2026-08-11 — Interactive hero reveal character
- Locked the hero interaction as a **semi-fluid, high-viscosity reveal**, not a conventional full-fluid simulation.
- Locked pointer/mouse trail as the primary desktop reveal source.
- Locked **thick rounded paint-stroke/blob** character over an elongated slit/tear.
- Locked restrained outward spreading and rejection of watery/ripple behavior.
- Locked a meaningful persistent trail that fades away slowly.
- Locked smooth merging of overlapping strokes.
- Locked the conceptual feel of dragging a heavy liquid opening through the white front layer.
- Locked strict local reveal semantics: hidden content appears only where the mask has reached.
- Added hard aesthetic requirement: reject technically correct but visually unpleasant/gimmicky implementations.
- Added required cross-reference to `WEBERAISE_WEBGL_REVEAL_RESEARCH.md` as the technical foundation for future implementation.
- Recorded the current research recommendation as **provisional**, pending prototype comparison.


---

# 30. INTERACTIVE REVEAL — LOCKED MOTION PARAMETERS

This section refines the previously locked semi-fluid hero reveal. It must be read together with:

- Section 28: interactive hero reveal system
- Section 29: viscous reveal character lock
- `WEBERAISE_WEBGL_REVEAL_RESEARCH.md`: technical research foundation, reference implementations, modes, performance notes, and prototype recommendations

The visual target remains a **thick, rounded, viscous paint-stroke / blob reveal**, not a watery fluid simulation.

## 30.1 Reveal footprint size — LOCKED DIRECTION

A single normal cursor pass must reveal a **meaningful amount of the hero typography**.

Target scale:
- roughly enough vertical coverage to expose about **one-half to two-thirds of the hero font height** in a normal pass;
- large enough that the user can understand/reveal the hidden layer without aggressively scrubbing the mouse;
- not so large that one casual movement exposes most of the hero.

The footprint should therefore feel **generous and deliberate**, not like a tiny flashlight cursor.

Implementation note:
- radius should be defined relative to responsive hero typography / viewport size, not a fixed desktop-only pixel value;
- exact numerical radius remains a prototype-tuning parameter, but the visual coverage requirement above is locked.

## 30.2 Trail lifetime — LOCKED DIRECTION

The reveal trail should remain visible for approximately **3–4 seconds** as the working target.

This timing should feel:
