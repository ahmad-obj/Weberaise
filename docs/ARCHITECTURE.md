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
- solver-driven EXPLORE exit velocity/dye source;
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

### Current WEBERAISE interactive profile

Reference-derived solver semantics remain:

```text
full sim                       256 × 256
full dye                       512 × 512
pressure iterations            20
velocity retention @ 60 Hz     0.962
dye retention @ 60 Hz          0.988
reveal gain                    3.9
threshold                      0.50 → 0.51
```

The approved WEBERAISE scale adjustment is:

```text
full/lite radius parameter     0.00024
full/lite splat force          11800
reduced-motion radius          0.00032
```

Because the Gaussian uses squared distance, `0.00006 → 0.00024` is approximately a 2× linear footprint. Momentum was then scaled 2× (`5900 → 11800`). Pressure iterations, retention, threshold, gain, solver resolution, and input cadence remain unchanged.

---

## EXPLORE CTA

EXPLORE remains a small DOM button, but its affordance is now explicit rather than relying on tiny text alone.

Production contract:

```text
minimum width    126px
minimum height   44px
border           1px currentColor
corner radius    4px
source color     #fff
blend mode       difference
wrapper z-index  7
```

Hover/focus remains restrained:
- `2px` upward lift;
- faint interior wash;
- underline expands to full width;
- no glow, pill shape, blue gradient, bounce, or large scale change.

The active state compresses only to `.985`.

The wrapper sits above the reveal canvas and vignette. Difference blending produces black over white and white over revealed black automatically.

---

## Solver-driven EXPLORE exit

`heroExiting` no longer uses `bottomFill` or an analytic sine crest.

Normal-motion flow:

```text
EXPLORE click
    ↓
button acknowledgement / live input stops
    ↓
keep existing dye + residual velocity
    ↓
mode = fluidExit
    ↓
fullscreen velocity-drive pass
fullscreen bottom dye-source pass
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
last-frame 0.9997 → 1.0 safety seal
    ↓
0.06s fully-black hold
    ↓
main / ribbon experience
```

### Continuity across EXPLORE

The timeline intentionally does **not** call `engine.clear()`.

Existing interactive dye and velocity remain in the solver when `setMode('fluidExit')` begins. Pointer splats stop, but the material already on screen continues into the takeover. This avoids a reset/flash and makes the transition feel like one continuous material system.

### Exit source pass

`EXIT_SOURCE_FRAGMENT` is one deterministic fullscreen shader reused for two writes each solver frame:

1. a velocity-drive write;
2. a dye-source write.

Dye is injected only near the bottom. Velocity is driven across the full domain toward a bounded target field so the supplied material can actually travel to the top.

The current source uses four broad Gaussian x-profiles whose weighting morphs monotonically with exit progress. There is no time oscillation, sine, FBM, simplex, or hash noise.

Exit-only configuration lives in `src/webgl/reveal/exitFluid.ts`:

```text
sourceBandTop    0.14
dyeStrength      0.24
velocityBase     4.2
velocityPeak     8.0
lateralStrength  0.45
sealStart        0.9997
```

### Why the velocity drive is full-domain and bounded

Two earlier source variants were rejected by real solver reproduction:

1. **Additive velocity every RAF** accumulated too much momentum under `.962` retention.
2. **Velocity only in the bottom source band** could not transport dye beyond that band; the visible front stalled around the bottom ~14% of the viewport.

Production therefore drives velocity toward a target rather than adding a full target vector each frame:

```glsl
vec3 velocityTarget = vec3(lateralProfile, upward, 0.0);
float velocityDrive = mix(0.18, 0.26, drive);
vec3 velocityDriven = mix(base, velocityTarget, velocityDrive);
```

Dye remains additive only in the shaped bottom source band.

### Verified solver progression

A standalone real WebGL2 reproduction used the same:
- `256×256` velocity simulation;
- `512×512` dye field;
- RGBA16F targets;
- velocity retention `.962`;
- dye retention `.988`;
- 20 pressure iterations;
- production threshold/gain;
- `power2.inOut` progress over 96 frames (~1.6s at 60 Hz).

Observed thresholded coverage:

```text
frame 48 / ~0.80s   44.26%
frame 72 / ~1.20s   75.56%
frame 84 / ~1.40s   91.76%, front near top
frame 88 / ~1.47s   96.54%, top reached
frame 92             98.84%
frame 94             99.49%
frame 96 / ~1.60s   99.91%, top-row coverage 95.27%
```

The run completed with `gl.getError() === 0`.

### Exit compositor

The interactive threshold remains:

```text
dye.r × revealGain
→ smoothstep(edgeSoftness, edgeSoftness + edgeWidth)
```

During `fluidExit`, that thresholded field is rendered as black with normal canvas blending.

The completion seal begins only at:

```text
EXIT_FLUID_CONFIG.sealStart = 0.9997
```

and reaches full alpha at progress `1.0`. It is a last-frame handoff guard, not a visible moving layer. The solver dye reaches the top naturally before the seal materially contributes.

---

## Exit fallbacks

The solver exit is used only when:

```text
engine exists
AND quality.enableVelocity === true
AND prefers-reduced-motion is false
```

Otherwise the DOM exit layer is a plain black rectangle:

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

`fluidExit` adds exactly two fullscreen source writes per solver frame, then reuses the existing solver pipeline. Interactive reveal cost remains unchanged.

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

Fresh independent evidence for the current EXPLORE implementation:

- focused EXPLORE/fluid-exit mirrored-source contracts: `2/2` pass;
- isolated TypeScript interface compile for current exit config/timeline integration: pass with no diagnostics;
- real Chromium WebGL2 context: available;
- `EXT_color_buffer_float`: available;
- current `EXIT_SOURCE_FRAGMENT`: compile/link pass;
- current `COMPOSITE_FRAGMENT`: compile/link pass;
- standalone full solver reproduction: `glError=0`, natural top reach, 99.91% thresholded coverage by the final simulated frame;
- obsolete `bottomFillEmitter.ts` removed;
- analytic sine crest removed from production composite code.

The TypeScript harness is deliberately scoped to the new exit interfaces. It is not evidence for the complete Next.js repository typecheck.

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
