# Weberaise Signature Intro Architecture

## Experience boundary

The homepage remains one explicit experience state machine:

```text
boot
→ loading
→ loaderCompletion
→ heroOpening
→ heroInteractive
→ heroExiting
→ main
```

Scrolling remains locked until `main`.

The Nothin-fidelity branch changes only the **interactive reveal material model and its input/GPU lifecycle**. Loader choreography, hero typography, twin-line opening, navigation, EXPLORE, post-hero content and downstream routes remain architecturally separate.

## Responsibility split

### React / DOM

Owns:
- semantic content and accessibility;
- hero/page layout;
- experience state;
- intro lifecycle;
- pointer/touch event wiring;
- normal website content.

Hero typography remains DOM-rendered. The website is not converted into a WebGL scene.

### GSAP

Owns finite authored choreography:
- loader completion;
- line contraction/rotation;
- twin-line opening;
- EXPLORE bottom-fill progress.

It does not run the fluid solver.

### WebGL2 reveal engine

Owns:
- persistent velocity field;
- persistent dye field;
- divergence field;
- pressure solve;
- Gaussian input deposition;
- advection;
- time-correct dissipation;
- final hard reveal mask;
- WEBERAISE difference compositor;
- bottom-fill render mode.

The previous CPU radial-primitive/metaball model is retired.

---

## Why the reveal architecture changed

The supplied Nothin production bundle confirms that its reveal is generated from persistent 2D fluid state, not a union of rounded CPU primitives.

Previous WEBERAISE:

```text
pointer history
→ many radial primitives
→ additive metaball field
→ threshold
→ each primitive shrinks with age
```

Current WEBERAISE:

```text
latest pointer state
→ Gaussian velocity + dye splat
→ persistent transport
→ pressure projection
→ dye dissipation
→ narrow threshold
```

The old representation structurally produced round heads, bulbous joins and circle-like healing. The new representation allows deposited material to stretch, shear, bend, taper and split after the pointer has moved away.

The interactive boundary therefore receives its irregularity from fluid transport itself. No procedural sine/noise contour deformation is used for the reveal edge.

---

## Hero composition

`HeroTypography` remains shared by the front and hidden DOM layers, preserving exact `WELCOME / TO` registration.

Front state:
- white background;
- black typography;
- empty lower brand slot.

Hidden state:
- black background;
- identical white typography;
- approved WEBERAISE lockup.

The WebGL canvas continues to use `mix-blend-mode: difference`. A viewport-aligned brand texture reconstructs the approved lockup only inside the reveal mask.

Interactive mask extraction is deliberately simple:

```text
dye.r × 3.9
→ smoothstep(0.50, 0.51)
→ near-binary reveal alpha
```

Typography itself is not rasterized into the fluid simulation.

---

## Confirmed fluid pipeline

Full/lite data flow:

```text
mouse / pen / touch / autonomous sample
        ↓
latest sample retained until next RAF
        ↓
one Gaussian velocity splat + one dye splat at most per frame
        ↓
velocity advection
        ↓
dye advection
        ↓
divergence
        ↓
Jacobi pressure solve
        ↓
pressure-gradient subtraction
        ↓
persistent dye field
        ↓
gain + narrow threshold
        ↓
WEBERAISE difference compositor
```

The order intentionally follows the inspected Nothin runtime.

### Why input is frame-coalesced

Nothin does not execute a fluid splat for every DOM event. Mouse/touch events update the latest pointer state; the animation loop injects at most once per frame.

WEBERAISE now follows the same rule:

- `HeroRevealCanvas` may still use `PointerTracker` as an event-conditioning layer;
- `RevealEngine.emit()` keeps only `samples.at(-1)`;
- multiple pointer events/interpolated samples before the next RAF collapse into one pending sample;
- displacement is measured from the last **actually applied** sample;
- one velocity and one dye splat are therefore the maximum interactive deposition cost per render frame.

This avoids both GPU pass explosion and dye over-deposition on high-frequency pointer hardware.

---

## Full-quality fidelity baseline

Initial values come from the inspected Nothin production bundle:

```text
velocity/pressure simulation   256 × 256
dye field                      512 × 512
pressure iterations            20
velocity retention @ 60 Hz     0.962
dye retention @ 60 Hz          0.988
curl strength                  0
Gaussian radius parameter      0.00006
splat force                    5900
reveal gain                    3.9
threshold                      0.50 → 0.51
display DPR cap                2
```

Curl/vorticity shaders are intentionally omitted. The inspected reference has the machinery but its production `curlStrength` is zero, so those passes do not provide the target material behavior.

These are fidelity baseline values, not immutable brand constants. Future tuning should be tied to a named mismatch seen in side-by-side QA.

---

## Refresh-rate independence

The reference uses frame-based dissipation. WEBERAISE preserves the 60 Hz appearance but makes retention elapsed-time aware:

```text
retention = baseRetention ^ (deltaSeconds × 60)
```

The reference-frame scale is bounded to prevent a stalled frame from creating an extreme backtrace.

When `document.hidden` is true, the frame-time anchor is cleared. Background-tab time is not simulated on return.

---

## Input lifecycle

Mouse, pen and touch pointer movement share the same simulation path.

Stream history is reset on:
- new `pointerdown` contact;
- `pointerup`;
- `pointercancel`;
- `pointerleave`.

Resetting the input stream does **not** clear persistent dye/velocity. It only prevents a later contact from being interpreted as one giant movement vector.

### Autonomous teaser vs live input

The short autonomous brand stroke still exists, but scripted and user input are never allowed to fight over the same displacement history.

- teaser waits until the real hero engine is ready;
- user input immediately cancels all remaining autonomous timers;
- engine/tracker input history is reset before live control begins;
- already deposited fluid remains visible and evolves normally.

This prevents false momentum jumps when a user interacts during the teaser.

### Engine readiness

GPU initialization is asynchronous relative to hero phase changes. `HeroRevealCanvas` therefore promotes successful initialization into one `engineReady` React state transition.

Pointer listeners and the autonomous teaser wait for `engineReady`. This prevents the interactive phase from racing past a still-null mutable `engineRef`.

Pointer movement itself remains outside React state.

---

## Residual motion and healing

There is no CPU afterglide or synthetic satellite-droplet mechanism.

Residual motion is genuine field momentum. After input stops, existing velocity may transport dye briefly and then damps through velocity retention.

Healing is dye dissipation. Old revealed regions can narrow, deform or split before falling below the hard threshold instead of shrinking as individual circles.

---

## GPU resources

Full/lite mode owns:

```text
velocity    double RGBA16F, LINEAR
pressure    double RGBA16F, NEAREST
dye         double RGBA16F, LINEAR
divergence  single RGBA16F, NEAREST
```

The engine validates:
- actual WebGL2 context creation on the hero canvas;
- `EXT_color_buffer_float`;
- `RGBA16F` framebuffer completeness.

No separate disposable probe context is created before the real hero context. If construction fails, `createRevealEngine()` returns `null` and the CSS fallback is used.

Programs:
- splat;
- advection;
- divergence;
- pressure Jacobi;
- gradient subtraction;
- final compositor.

---

## Quality tiers

### Full

```text
sim 256
dye 512
pressure iterations 20
DPR cap 2
velocity enabled
```

### Lite

```text
sim 128
dye 256
pressure iterations 10
DPR cap 1.25
velocity enabled
```

The same fluid semantics and reveal threshold are retained.

### Reduced motion

```text
sim 96
dye 192
pressure iterations 0
DPR cap 1
velocity injection disabled
persistent dye enabled
```

### Fallback

If the required WebGL/half-float path fails, the existing CSS reveal remains usable. CSS fallback pointer state is cleared on pointer up/cancel/leave so touch contacts cannot leave it stuck open.

---

## Loader GPU preflight

The loader's `hero-code` critical task calls `warmRevealEngine()`.

This is a **disposable-context compatibility/shader preflight**, not persistent warming of the eventual hero canvas.

It verifies on a temporary canvas that the browser can:
- create the fluid engine;
- compile/link the pass graph;
- allocate compatible half-float targets;
- execute `prime()`;
- dispose cleanly.

WebGL compiled state/resources are context-specific, so the later hero canvas still creates its own actual context/programs/targets. The preflight catches unsupported paths early; it does not guarantee zero setup cost when the hero mounts.

---

## EXPLORE compatibility

The public reveal-engine contract used by the hero remains intact.

EXPLORE does:

```text
engine.clear()
→ mode = bottomFill
→ fluid evolution skipped
→ existing authored black crest progresses upward
→ main state
```

The sine terms in the bottom-fill crest are intentionally unrelated to the interactive liquid edge. They remain part of the accepted authored exit transition.

---

## Performance strategy

- pressure/velocity physics stays at 128–256²;
- dye stays at 256–512²;
- display DPR is capped independently;
- maximum interactive deposition is one velocity + one dye splat per RAF;
- pointer movement causes no React render loop;
- no DOM layout read occurs inside the solver RAF;
- no CPU primitive history is rebuilt per frame;
- zero-strength curl/vorticity passes are omitted;
- hidden-tab elapsed time is discarded;
- fluid evolution is skipped during bottom fill;
- partial engine initialization is disposed before fallback;
- full hero teardown disposes all owned GPU targets/programs.

---

## Verification boundary

Completed independently in this environment:

- TypeScript compilation of the fluid core/engine;
- real Chromium WebGL2 compile/link of all six shaders;
- `EXT_color_buffer_float` availability;
- complete `RGBA16F` framebuffer;
- one pressure-solver frame with `gl.getError() === 0`;
- synthetic S-curve render showing connected directional deformation rather than a circle chain.

Still required before merge on a complete network-enabled checkout:

```bash
npm ci
npm test
npm run typecheck
npm run build
git diff --check
```

Then perform the complete WEBERAISE-vs-Nothin in-site comparison on desktop, mobile/touch, reduced motion, hidden-tab resume and fallback conditions.

---

## Downstream boundary

This branch does not redesign Services, Work, About, navigation, ribbon sections or other normal homepage content. The implementation remains isolated to the signature hero reveal, reveal-related tests and its documentation.
