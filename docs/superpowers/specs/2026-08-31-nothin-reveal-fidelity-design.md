# Nothin Reveal Fidelity Rebuild — Research & Design Specification

**Date:** 2026-08-31  
**Branch:** `feature/hero-nothin-reveal-fidelity`  
**Base:** `main` @ `dff8870b357e9bc87fe1d87e1a0dc67ca9dcc74c`  
**Status:** Research/design only. No production reveal code changed in this pass.

## 1. Purpose

The current WEBERAISE hero is structurally successful: loader choreography, registered front/reveal typography, hero state machine, navigation, autonomous reveal introduction, pointer interaction, EXPLORE transition, and graceful fallback are all already integrated.

The problem is narrower but fundamental:

> The interactive liquid reveal is too round, too metaball-like, and too obviously composed from blobs. The desired target is the observable reveal character of `https://www.noth.in/`: more directional, more irregular, more fluidly connected, less circular, and less like a chain of shrinking discs.

This pass does **not** redesign the hero. It defines how to replace the reveal field-generation model while preserving the surrounding hero experience.

## 2. Source-of-truth boundary

### Repository baseline

New work must branch from current `main`, not the historical feature branches. The branch for this effort is:

`feature/hero-nothin-reveal-fidelity`

It was created directly from `main` commit:

`dff8870b357e9bc87fe1d87e1a0dc67ca9dcc74c`

### Nothin source archive

The user supplied a ZIP export of `www.noth.in` specifically so its delivered hero implementation could be studied.

In the current execution environment, the conversation attachment is registered, but the ZIP payload is not mounted into the readable filesystem. The only ZIP physically exposed under `/mnt/data` is the older WEBERAISE logo pack. Therefore this document does **not** claim that the newly supplied Nothin bundle's JavaScript or shader strings were directly inspected in this pass.

This distinction is important. Anything below labelled **confirmed WEBERAISE** comes directly from the current repository. Anything labelled **confirmed reference behavior** comes from observable Nothin behavior / prior repository research. Any statement about Nothin's exact internal simulation remains **unconfirmed until the supplied bundle or a runtime capture can be read**.

The repository already contains `scripts/probe-nothin-webgl.mjs` and `docs/reference/NOTHIN_RUNTIME_PROBE.md` for exactly that verification step. It instruments publicly delivered WebGL calls, shader sources, uniforms, texture allocations, framebuffer use and draw calls without copying proprietary shader code into WEBERAISE.

## 3. Historical context: how WEBERAISE arrived at the current effect

Two older Nothin-focused design documents matter:

- `docs/superpowers/specs/2026-08-11-nothin-reveal-refinement-design.md`
- `docs/superpowers/specs/2026-08-11-nothin-reveal-rebuild-design.md`

The first attempted to keep a persistent density/history approach while reducing smoke/fog behavior.

The second deliberately pivoted to an **age-aware implicit surface / metaball model**. Its objective was solid interiors, rounded endpoints, necking/pinch-off, no low-alpha fog, and geometric contraction during healing.

That second design succeeded at the problem it targeted: the current reveal is solid and clean rather than smoky.

However, the user's current visual judgment exposes the trade-off: the implicit-primitive approach over-corrected toward a rounded blob language. That is now the main mismatch with Nothin.

Therefore this specification **supersedes the previous Nothin reveal design only for mask generation and healing geometry**. It does not invalidate the hero composition or surrounding experience.

## 4. Current WEBERAISE reveal — exact architecture

### 4.1 Integration layer

`src/components/experience/Hero/HeroRevealCanvas.tsx`

Responsibilities:

- waits for fonts and the WEBERAISE brand image;
- creates the WebGL reveal engine;
- resizes it with the hero;
- creates a registered brand texture from the DOM layout;
- starts/stops the renderer with the hero lifecycle;
- emits one autonomous introduction stroke;
- translates pointer movement into normalized samples;
- schedules small post-pointer inertial satellite emissions;
- keeps pointer state outside React render state;
- provides a CSS fallback when WebGL cannot initialize.

Current desktop pointer parameters:

- radius: `0.078` normalized hero height;
- small-screen radius: `0.10`;
- interpolation spacing: `0.022`;
- max normalized velocity: `1.85`;
- sample strength: `1`.

### 4.2 Quality policy

`src/webgl/reveal/quality.ts`

Full profile currently uses approximately:

- mask short axis up to `512`;
- DPR cap `1.5`;
- primitive lifetime `3.6 s`;
- hold fraction `0.60`;
- maximum active primitives `420`;
- surface threshold `0.40`;
- contour warp `0.010`.

Lite mode lowers field resolution and active primitive count but keeps the same conceptual model.

### 4.3 Field representation

`src/webgl/reveal/RevealEngine.ts`

The current renderer owns **one low-resolution RGBA8 field target**.

Crucially, this target is not a persistent simulation state in the present implementation.

Every reveal frame:

1. Determine which time-stamped primitives are still alive.
2. Compute each primitive's current radius from age.
3. Clear the field framebuffer completely.
4. Upload all active primitives as instanced geometry.
5. Draw every primitive additively into the field.
6. Threshold the resulting scalar field in the final compositor.

So the visual state is reconstructed from the list of still-alive samples each frame.

There is no persistent velocity texture, no advected density texture, no evolving feedback field, and no pressure/divergence solve in the current engine.

### 4.4 Primitive shape

`src/webgl/reveal/shaders.ts`

Each input sample is fundamentally a radial primitive.

The field vertex shader allows only restrained directional stretching:

- velocity establishes a direction;
- maximum stretch is only about `12%`;
- the perpendicular axis is inversely squashed;
- support radius is expanded to encourage neighboring primitive overlap.

The fragment contribution is based on radial distance from the primitive center. Contributions from multiple primitives are additively accumulated.

The compositor then extracts a solid surface from the summed field using `smoothstep` around a threshold.

### 4.5 Healing

`src/webgl/reveal/liquidLifetime.ts`

A primitive:

- remains full-size through the hold phase;
- then contracts nonlinearly;
- finally disappears at the end of its lifetime.

The field itself is not decaying. **The circles that generate the field shrink.**

This distinction explains a large part of the current visual character.

### 4.6 Contour motion

The current compositor adds only a small threshold displacement made from three sine waves.

That movement is independent of the actual pointer flow or local velocity field. It animates the contour, but cannot fundamentally change the circular basis of the surface.

### 4.7 Inertial behavior

`src/webgl/reveal/inertia.ts`

After pointer movement ends, the system emits only a few smaller satellite primitives in the previous motion direction.

These satellites are useful for life/continuity, but they are still radial primitives and therefore add more rounded islands rather than generating true directional fluid deformation.

## 5. Root cause of the current “too roundy / blobby” appearance

This is not mainly a parameter problem.

The current implementation has several structural biases toward circles:

1. **Radial basis** — every sample begins as a circle/ellipse.
2. **Very limited anisotropy** — velocity stretches the shape by at most ~12%, so even fast strokes remain visually rounded.
3. **Additive metaball union** — neighboring radial fields naturally form smooth bulbous necks.
4. **Radial healing** — old geometry disappears by shrinking the same circles that created it.
5. **No advected state** — previous shape cannot be sheared, folded, pulled, or transported by evolving flow.
6. **No local velocity field** — contour movement has no spatial memory of how liquid entered a region.
7. **Synthetic satellites** — afterglide creates additional little blobs rather than deforming one continuous fluid mass.
8. **Contour warp is cosmetic** — threshold sine waves roughen the edge slightly, but the underlying level set remains a union of rounded kernels.

This means that increasing noise, changing the threshold, increasing primitive count, or tweaking lifetime cannot produce Nothin-level directional liquid behavior. Those changes may make the current blobs prettier, but they do not change their geometry family.

## 6. Reference behavior we are trying to match

The new target is not “more fluid” in the generic sense. It is specifically the visible character that makes Nothin feel different from WEBERAISE today.

### Required visual qualities

- The active reveal should not read as a circular brush head.
- Fast cursor movement should create directionally stretched, pulled, irregular geometry.
- A turn in pointer direction should bend and deform existing local mass rather than simply place another round stamp beside it.
- Narrow sections should be able to lengthen, shear, taper and reconnect.
- The contour should contain broader low-frequency irregularity, not just tiny edge noise.
- The surface should remain cohesive and premium, not turbulent smoke.
- The interior reveal remains solid/near-binary; the fluid field controls **where** the hidden state is visible, not its opacity as fog.
- Old regions should heal through evolving field loss/erosion, not obviously through a collection of individual shrinking circles.
- Motion should retain causal connection to the pointer.
- No broad water ripple propagation.
- No colorful fluid-demo appearance.
- No unstable high-frequency turbulence.

### Important conceptual shift

Current WEBERAISE:

`pointer samples → many age-aware radial primitives → additive field → threshold`

Target architecture:

`pointer input → evolving spatial field(s) → directional transport/deformation → thresholded liquid surface`

The second architecture lets the **field itself** remember and evolve shape.

## 7. Architecture options

### Option A — Tune the current metaball engine

Changes could include stronger velocity elongation, capsule geometry, asymmetric shrink, larger contour warp and more sophisticated noise.

**Pros:** lowest engineering risk, preserves current performance profile.  
**Cons:** still fundamentally composed from explicit primitives; likely remains recognizably blob/capsule based.

**Verdict:** rejected as the primary fidelity route. Useful only as fallback.

### Option B — Persistent density + velocity feedback field

Maintain low-resolution ping-pong render targets:

- scalar reveal/density/history;
- 2-channel velocity/flow field.

Pointer movement injects both density and directional momentum. Each frame the field is lightly advected by velocity, velocity dissipates, new input is merged, and the final density is thresholded into the binary reveal mask.

**Pros:** directional deformation, persistent shape memory, low enough complexity for hero use, controllable viscosity, natural non-circular strokes.  
**Cons:** more GPU passes and more tuning than current engine; can become smoky if density is used directly instead of thresholded cleanly.

**Verdict:** recommended minimum architecture if Nothin bundle/runtime evidence does not demonstrate a fuller solver.

### Option C — Reduced pressure-projected 2D fluid mask

Use a compact stable-fluid pipeline:

1. pointer splat to velocity/density;
2. velocity advection;
3. divergence;
4. limited pressure iterations;
5. pressure-gradient subtraction;
6. density/history advection;
7. controlled dissipation;
8. threshold density into a solid mask.

Optional vorticity should be zero or extremely restrained unless reference evidence requires it.

**Pros:** strongest ability to reproduce genuinely fluid elongation, bending and local shape evolution.  
**Cons:** additional framebuffer passes, tuning complexity and mobile GPU cost.

**Verdict:** preferred if direct bundle/runtime evidence shows Nothin is using a true fluid/feedback simulation or if Option B cannot visually match the reference.

## 8. Recommended design pending direct bundle verification

Use **Option B as the implementation baseline**, but structure the engine so the velocity pass can be upgraded to Option C without changing Hero React integration.

The important decision is not “full Navier-Stokes or not” yet. The important decision already supported by current evidence is:

> **Do not continue using the current clear-and-rebuild metaball field as the full-quality desktop reveal. Replace it with a persistent evolving GPU field.**

## 9. Proposed full-quality render pipeline

### 9.1 State textures

Use ping-pong targets at a resolution independent of display DPR.

Recommended conceptual state:

- `velocityA / velocityB`: RG or RGBA half-float when supported;
- `densityA / densityB`: scalar or RGBA half-float / normalized fallback;
- existing registered WEBERAISE brand texture;
- framebuffer targets reused for the entire hero lifecycle.

### 9.2 Pointer injection

Pointer sampling remains interpolated outside React.

However, instead of storing hundreds of long-lived radial primitives, each input batch is immediately injected into the GPU state.

Injection should be anisotropic:

- position from normalized pointer coordinates;
- direction from pointer velocity;
- momentum magnitude clamped;
- brush footprint wider perpendicular to motion and longer along motion;
- no visible disc when velocity is non-zero;
- stationary pointer may use a soft rounded source, but it should quickly become part of the evolving field.

### 9.3 Velocity evolution

At minimum:

- advect velocity by itself;
- apply strong damping/high viscosity;
- optionally apply very light diffusion/neighbor smoothing;
- avoid long-lived autonomous momentum.

If pressure projection is enabled:

- low-resolution divergence;
- small fixed pressure iteration count;
- gradient subtraction;
- no expensive physical perfection requirement.

The goal is believable local deformation, not scientific simulation.

### 9.4 Reveal/density evolution

Each frame:

- advect previous reveal history by the velocity field;
- merge new pointer injection;
- dissipate history using frame-time-correct retention;
- constrain spread so the reveal remains local;
- optionally apply a tiny erosion bias so healing contracts the surface instead of becoming transparent fog.

### 9.5 Surface extraction

Final reveal remains a clean thresholded surface:

`solid reveal = smoothstep(low, high, density)`

The threshold band should remain narrow enough that the interior is visually solid.

Any procedural noise must be low-frequency and applied to the field/threshold only near the contour. It must not distort the typography pixels themselves.

### 9.6 Compositing

Preserve the current successful compositing contract:

- normal hero typography stays crisp DOM;
- hidden inverse state remains perfectly registered;
- WEBERAISE lockup is sampled at the correct DOM-measured location;
- the canvas remains only the reveal/composite mechanism;
- the hero should not be rasterized wholesale into WebGL.

## 10. Components that should remain unchanged unless evidence requires otherwise

Do not casually rewrite:

- `ExperienceShell` state machine;
- truthful critical loader;
- loader → hero line choreography;
- shared `HeroTypography` geometry;
- front/reveal DOM registration;
- navigation integration;
- radial white-hero vignette;
- EXPLORE button behavior;
- bottom-fill transition semantics;
- main-page handoff;
- no-WebGL fallback contract.

This effort is a reveal-engine replacement, not another homepage rewrite.

## 11. Files expected to change during implementation

Primary:

- `src/webgl/reveal/RevealEngine.ts`
- `src/webgl/reveal/shaders.ts`
- `src/webgl/reveal/quality.ts`
- `src/components/experience/Hero/HeroRevealCanvas.tsx`

Likely new focused modules:

- `src/webgl/reveal/targets.ts`
- `src/webgl/reveal/fluid/advect.ts` or equivalent shader module
- `src/webgl/reveal/fluid/splat.ts`
- `src/webgl/reveal/fluid/velocity.ts`
- optional pressure/divergence modules if Option C is selected

Likely retired from the full-quality path:

- long-lived primitive reconstruction in `RevealEngine`;
- `liquidRadiusScale` as the primary healing mechanism;
- `createInertialAfterglide` satellite emission as the primary post-motion behavior.

These utilities may remain for lite/fallback mode if useful.

## 12. Quality profiles

### Full desktop

Persistent evolving field with velocity-driven deformation. Use the highest-fidelity Nothin-matching mode that remains performant.

### Lite / weak GPU / small screens

Use a reduced field:

- lower simulation resolution;
- fewer passes;
- no pressure projection if full mode uses it;
- faster velocity damping;
- same solid thresholded mask semantics.

### Reduced motion

Preserve discoverability but eliminate autonomous settling and long post-pointer motion. The reveal can use simplified persistent paint/history behavior.

### WebGL unavailable

Keep the intentional CSS fallback. Never show a blank/broken hero.

## 13. Performance requirements

The current project already warms the reveal engine during the loader. Preserve that principle.

Full-quality target:

- no shader compilation hitch on first pointer movement;
- render targets allocated before interactive state where practical;
- simulation resolution independent of display resolution;
- DPR cap affects compositor, not unnecessarily the fluid state;
- no React state update per pointer event;
- no DOM layout read inside the WebGL render loop;
- stop all hero GPU work when the hero lifecycle ends;
- no unnecessary full-resolution blur passes;
- stable behavior across 60/90/120 Hz through time-correct damping/dissipation;
- avoid allocating textures/buffers every frame.

## 14. Exact fidelity verification required before implementation lock

The supplied Nothin archive or the runtime probe must be used to answer these questions before choosing Option B vs C:

1. WebGL1 or WebGL2?
2. Three.js/OGL/custom renderer?
3. Number of unique programs involved in the hero interaction.
4. Number of framebuffer/render-target passes per active frame.
5. Does Nothin allocate persistent ping-pong targets?
6. Does it allocate a velocity target separate from a mask/density target?
7. Are float/half-float render textures used?
8. Are uniforms present for velocity, dissipation, pressure, divergence, curl, radius, threshold or resolution?
9. Is the visible reveal thresholded from a simulation texture or built directly from geometry?
10. Does pointer input inject direction/momentum or only scalar density?
11. How does the field behave after the pointer stops?
12. Does healing occur through scalar dissipation, geometric contraction, erosion, or a combination?
13. How large is the simulation target relative to viewport size?
14. Is final text/content rendered in WebGL or used only through compositing/masking?

The implementation plan must not claim an exact Nothin architecture until these are answered from the supplied bundle/runtime evidence.

## 15. Visual acceptance criteria

A full-quality rebuild is acceptable only if side-by-side comparison demonstrates:

1. A normal movement does not leave obviously circular repeated stamps.
2. Fast movement creates directional pulling rather than a chain of enlarged circles.
3. Curves in pointer motion create continuous bent liquid geometry.
4. The surface can locally taper and shear.
5. Shape changes have low-frequency fluid coherence rather than procedural edge jitter.
6. Hidden content remains completely crisp inside the reveal.
7. No smoky translucent halo exists outside the thresholded surface.
8. Old trails heal without visibly shrinking independent circular islands unless the reference genuinely produces them.
9. The reveal remains local and does not wash across unrelated hero regions.
10. Pointer response feels immediate but not mechanically attached like a flashlight.
11. Post-pointer motion is short, viscous and reference-like.
12. Overlapping paths reconnect naturally.
13. The autonomous introduction stroke uses the same surface system and does not look like a different effect.
14. EXPLORE still transitions cleanly into the existing bottom-fill/main handoff.
15. Full mode is visibly closer to Nothin than the current production metaball engine.

## 16. Non-goals

- copying Nothin's proprietary shader source verbatim;
- changing WEBERAISE typography or hero copy;
- changing the loader choreography;
- changing the page structure;
- making the hero a generic colorful fluid simulation;
- adding turbulence merely because the new architecture supports it;
- optimizing for physical accuracy over visual fidelity;
- weakening the site on mobile just to keep desktop-only simulation complexity.

## 17. Final conclusion

The present reveal's biggest weakness is architectural, not cosmetic.

WEBERAISE currently renders an elegant **implicit metaball surface**. That explains why it is smooth, cohesive and solid — and also why it feels rounder and more blobby than Nothin.

The next version should preserve everything successful around the hero while replacing the clear-and-reconstruct primitive field with a **persistent, directionally evolving GPU field**. Direct inspection of the supplied Nothin bundle/runtime should then determine how far that field needs to go toward a true pressure-projected fluid solver.

Until that final source verification is available, the safest implementation direction is:

> **persistent density/history + persistent velocity + pointer momentum injection + restrained advection + solid thresholded compositing**, designed so pressure projection can be added without changing the rest of the hero architecture.
