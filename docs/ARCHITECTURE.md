# WEBERAISE Signature Intro Architecture

## Experience boundary

The homepage remains one explicit state machine:

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

This branch changes the hero material system and the EXPLORE handoff while preserving the rest of the experience boundary. Typography, navigation, downstream ribbon/main content, routes, and normal page sections remain DOM-owned.

---

## Responsibility split

### React / DOM

Owns:
- semantic content and accessibility;
- hero/page layout;
- experience state;
- loader/countdown decoration;
- pointer/touch event wiring;
- EXPLORE button markup;
- normal site content.

Hero typography and the WEBERAISE lockup remain crisp DOM assets. The site is not converted into a WebGL scene.

### GSAP

Owns finite authored choreography:
- loader completion;
- line contraction/rotation;
- twin-line hero opening;
- EXPLORE acknowledgement;
- `fluidExit` progress (`0 → 1`);
- reduced-motion / engine-failure DOM fallback timing.

GSAP does not simulate fluid state.

### WebGL2 reveal engine

Owns:
- persistent velocity field;
- persistent dye field;
- divergence field;
- pressure solve;
- interactive Gaussian deposition;
- advection and elapsed-time-correct dissipation;
- solver-driven EXPLORE exit source;
- reveal/exit mask extraction;
- registered WEBERAISE difference compositor.

The previous CPU radial-primitive/metaball model and the later analytic sine-wave EXPLORE crest are both retired.

---

## Interactive hero reveal

The supplied Nothin production bundle confirmed that the reference reveal uses persistent pressure-projected 2D fluid rather than shrinking metaball primitives.

Current WEBERAISE interactive flow:

```text
mouse / pen / touch / autonomous input
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
registered WEBERAISE difference compositor
```

The visible boundary gets its deformation from transport and pressure-projected velocity. There is no interactive sine/noise contour warp, CPU afterglide, or synthetic satellite-droplet system.

### Input coalescing

`HeroRevealCanvas` may emit multiple conditioned samples between browser frames, but `RevealEngine.emit()` retains only `samples.at(-1)`. Displacement is measured from the last sample actually applied by the engine.

Therefore interactive deposition is bounded to:

```text
≤ 1 velocity splat / RAF
≤ 1 dye splat / RAF
```

This preserves the Nothin-style input cadence and prevents high-frequency pointer hardware from multiplying GPU passes or dye strength.

### Current WEBERAISE scale profile

The original inspected reference baseline was:

```text
sim                           256 × 256
dye                          512 × 512
pressure iterations          20
velocity retention @ 60 Hz   0.962
dye retention @ 60 Hz        0.988
radius parameter             0.00006
splat force                  5900
reveal gain                  3.9
threshold                    0.50 → 0.51
```

The approved WEBERAISE presentation now intentionally enlarges the interactive footprint while preserving the material model:

```text
full/lite radius parameter   0.00024
full/lite splat force        11800
```

Because the Gaussian uses squared distance, `0.00006 → 0.00024` is approximately a 2× linear footprint. Momentum was then scaled 2× (`5900 → 11800`). Pressure iterations, retention, threshold, gain, solver resolution, and input cadence remain unchanged.

---

## EXPLORE CTA

EXPLORE remains a small DOM button, but its affordance is now explicit rather than relying on tiny text alone.

Approved contract:

```text
minimum width    126px
minimum height   44px
border           1px currentColor
corner radius    4px
source color     #fff
blend mode       difference
wrapper z-index  7
```

Hover/focus is deliberately restrained:
- `2px` upward lift;
- faint interior wash;
- underline expands to full width;
- no glow, pill shape, blue gradient, bounce, or large scale change.

The active state compresses only to `.985`.

The wrapper sits above the reveal canvas/vignette so the CTA remains discoverable even when the hero is partially revealed. Difference blending automatically produces black over white and white over black.

---

## Solver-driven EXPLORE exit

`heroExiting` no longer uses `bottomFill` or an analytic sine crest.

Normal-motion flow:

```text
EXPLORE click
    ↓
button acknowledgement / input stops
    ↓
engine.clear()
    ↓
mode = fluidExit
    ↓
fullscreen bottom source → velocity target
fullscreen bottom source → dye addition
    ↓
existing velocity advection
    ↓
existing dye advection
    ↓
divergence
    ↓
existing pressure solve
    ↓
pressure-gradient subtraction
    ↓
thresholded dye rendered as black
    ↓
final 0.94 → 1.0 completion seal
    ↓
0.06s fully-black hold
    ↓
main / ribbon experience
```

### Exit source pass

`EXIT_SOURCE_FRAGMENT` is one deterministic fullscreen shader reused for two writes each solver frame:

1. velocity source pass;
2. dye source pass.

It uses three broad Gaussian x-profiles to create a non-uniform but coherent front. There is no time oscillation, sine, FBM, simplex, or hash noise.

Exit-only configuration lives in `src/webgl/reveal/exitFluid.ts`:

```text
sourceBandTop    0.14
dyeStrength      0.24
velocityBase     4.2
velocityPeak     7.0
lateralStrength  0.35
sealStart        0.94
```

### Why source velocity is bounded

The first source prototype added another `4.2–7.0` vertical velocity every frame. In a real standalone solver reproduction that accumulated under the `.962` retention and made the viewport effectively fill in roughly the first third of the intended transition.

The production source therefore treats the bottom band as a **bounded inflow boundary**:

```glsl
velocityTarget = vec3(lateralProfile, upward, 0.0)
velocityDriven = mix(base, velocityTarget, sourceBand)
```

Dye remains additive, but source-band velocity converges to the configured target instead of growing without bound.

Standalone solver sanity at 60 Hz showed approximately:

```text
frame 30 / ~0.5s    ~42% black coverage
frame 60 / ~1.0s    ~70% black coverage
frame 84 / ~1.4s    ~92% black coverage, front near top
```

This leaves the configured final seal to close only the small residual area instead of hiding an under-driven simulation.

### Exit compositor

The interactive threshold is still derived from dye:

```text
dye.r × revealGain
→ smoothstep(edgeSoftness, edgeSoftness + edgeWidth)
```

During `fluidExit`, that thresholded field is rendered as black with normal canvas blending.

A uniform final seal begins only at:

```text
EXIT_FLUID_CONFIG.sealStart = 0.94
```

and reaches full alpha at progress `1.0`. This guarantees a seamless black handoff before React changes to `main` without reintroducing a visible procedural crest.

---

## Exit fallbacks

The solver exit is used only when:

```text
engine exists
AND quality.enableVelocity === true
AND prefers-reduced-motion is false
```

Otherwise the existing DOM exit layer is used as a plain black rectangle:

- reduced motion: about `0.24s`;
- engine/WebGL failure: about `0.9s`.

The fallback has no rounded top and no fake wave geometry.

---

## GPU resources and performance

Full/lite modes own:

```text
velocity    double RGBA16F / LINEAR
pressure    double RGBA16F / NEAREST
dye         double RGBA16F / LINEAR
divergence  single RGBA16F / NEAREST
```

No render targets were added for `fluidExit`.

Programs now include:
1. Gaussian splat;
2. exit source;
3. advection;
4. divergence;
5. pressure Jacobi;
6. gradient subtraction;
7. final compositor.

`fluidExit` adds exactly two fullscreen source writes per solver frame—one velocity, one dye—then reuses the existing solver pipeline.

Interactive reveal cost remains unchanged.

Other protections remain:
- display DPR cap independent of solver resolution;
- no React render loop for pointer motion;
- no per-frame CPU primitive history;
- no zero-effect curl/vorticity passes;
- hidden-tab elapsed time discarded;
- owned GPU resources/programs disposed on teardown.

---

## Refresh-rate and lifecycle behavior

Reference-frame retention is converted to elapsed-time-correct retention:

```text
retention = baseRetention ^ (deltaSeconds × 60)
```

The reference-frame scale is bounded so a stalled frame cannot create an extreme backtrace.

When `document.hidden` is true, the frame-time anchor is cleared instead of simulating the background interval on resume.

Mouse, pen, and touch share the same interactive fluid path. Stream displacement history resets across pointer contact boundaries without clearing persistent fluid state.

The autonomous teaser yields immediately to live user input and does not share stale displacement history with it.

`engineReady` remains the one React state transition that prevents interactive listeners from racing a still-null engine ref.

---

## Loader GPU preflight

`warmRevealEngine()` remains a disposable-context compatibility/shader preflight. It validates that the browser can create the fluid graph and compatible half-float targets, execute a prime frame, and dispose cleanly.

It is not persistent warming of the eventual hero context; WebGL resources are context-specific.

---

## Verification boundary

Fresh independent evidence for the current exit implementation:

- focused EXPLORE/fluid-exit source contracts: `2/2` pass in the isolated harness;
- isolated TypeScript compile of current engine + timeline integration: pass;
- real Chromium WebGL2 context: available;
- `EXT_color_buffer_float`: available;
- bounded `EXIT_SOURCE_FRAGMENT`: compile/link pass;
- current `COMPOSITE_FRAGMENT`: compile/link pass;
- standalone pressure-solver exit render verified paced bottom-to-top coverage and broad asymmetric shoulders;
- repository code search: no production `bottomFill` references remain.

Full project commands are still required on a complete checkout before merge:

```bash
npm test
npm run typecheck
npm run build
git diff --check
npm run dev
```

Full in-site QA must cover desktop, tablet/mobile, reduced motion, forced engine fallback, active-dye EXPLORE, and the seamless black handoff into the ribbon/main state.

---

## Downstream boundary

This work does not redesign Services, Work, About, the post-EXPLORE ribbon system, normal navigation architecture, or unrelated homepage sections. No merge is performed without explicit user instruction.
