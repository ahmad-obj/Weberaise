# Weberaise Signature Intro Architecture

## Design goal

The intro is one coordinated experience rather than a collection of independent animations. The homepage remains on one route and moves through an explicit state machine:

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

The Nothin-fidelity work changes only the **interactive reveal material model**. It does not redesign the loader, typography, hero opening, EXPLORE transition, navigation, or downstream homepage.

## Separation of responsibilities

### React / DOM

Owns:
- semantic content;
- hero and page layout;
- accessibility;
- experience state;
- lifecycle of intro components;
- normal scrollable website content.

The page is not a WebGL scene. Hero copy and downstream content remain normal HTML/CSS.

### GSAP

Owns finite authored choreography:
- loader completion;
- line contraction/rotation;
- twin-line hero opening;
- EXPLORE bottom-fill transition progress.

GSAP does not own pointer sampling or the fluid simulation loop.

### WebGL2 reveal engine

Owns only the signature reveal material:
- persistent half-float velocity field;
- persistent half-float dye/reveal field;
- divergence field;
- pressure ping-pong field;
- Gaussian input splats;
- advection;
- pressure projection;
- dye persistence/healing;
- hard reveal-mask extraction;
- final WEBERAISE difference compositing;
- authored EXPLORE bottom-fill mode.

The previous age-aware radial primitive/metaball system is retired from the production reveal path.

## Why the engine is now pressure-projected fluid

Direct inspection of the supplied Nothin production bundle confirmed that its reveal is generated from persistent fluid state rather than a union of CPU-generated circles.

The important visual distinction is architectural:

```text
old WEBERAISE
pointer history
→ radial primitives
→ additive metaball field
→ threshold
→ individual primitives shrink

current WEBERAISE
pointer movement
→ velocity + dye splats
→ persistent fluid transport
→ pressure projection
→ dye dissipation
→ narrow threshold
```

The old model structurally biased every surface toward circles, rounded necks and blob-like endpoints. The fluid model allows deposited material to stretch, shear, bend, taper, reconnect and split after input has moved away.

Organic contour shape therefore comes from the simulated field itself. The interactive reveal no longer uses procedural contour sine/noise to fake liquid irregularity.

## Hero composition

The visual hero still uses one shared `HeroTypography` structure for front and hidden states so `WELCOME / TO` remains pixel-registered.

Front state:
- white background;
- black typography;
- empty lower brand slot.

Reveal state:
- black background;
- identical white typography;
- approved horizontal WEBERAISE lockup in the lower brand slot.

The DOM remains the semantic/accessibility source. WebGL produces only the reveal/compositor layer.

## Difference compositor

The normal hero remains crisp DOM text. The WebGL canvas uses difference blending to reconstruct the inverse black/white hero only where the dye mask is open.

A viewport-aligned brand texture supplies the approved WEBERAISE lockup inside the hidden brand slot. The fluid simulation never rasterizes or blurs the hero typography itself.

Interactive surface extraction is deliberately simple:

```text
dye.r
× revealGain (3.9 baseline)
→ smoothstep(0.50, 0.51)
→ near-binary reveal alpha
```

There is no animated interactive contour warp. The shape comes from fluid transport.

## Fluid reveal data flow

```text
Pointer / touch / autonomous stroke
        ↓
PointerTracker interpolation
        ↓
RevealSample[]
        ↓
one-time Gaussian splats
   ↙                 ↘
velocity              dye
ping-pong              ping-pong
   ↓                     ↓
velocity advection     dye advection
   ↓                     │
divergence               │
   ↓                     │
pressure Jacobi solve    │
   ↓                     │
gradient subtraction ────┘
        ↓
persistent fluid state
        ↓
dye gain + narrow threshold
        ↓
WEBERAISE difference compositor
```

Full/lite solver order for one visible frame:

1. apply queued velocity and dye splats;
2. advect velocity through itself;
3. advect dye through the current velocity field;
4. compute velocity divergence;
5. clear pressure seed;
6. solve pressure with Jacobi iterations;
7. subtract the pressure gradient from velocity;
8. composite the current dye mask.

This intentionally follows the confirmed reference ordering.

## Full-quality baseline

The first fidelity baseline starts from the shipped Nothin values rather than immediately brand-tuning them:

- velocity/pressure simulation: `256 × 256`;
- dye field: `512 × 512`;
- pressure iterations: `20`;
- velocity retention at the 60 Hz reference frame: `0.962`;
- dye retention at the 60 Hz reference frame: `0.988`;
- curl/vorticity amplification: omitted (`curlStrength` was `0` in the reference);
- Gaussian splat radius parameter: `0.00006`;
- splat force: `5900`;
- reveal gain: `3.9`;
- threshold: `0.50 → 0.51`;
- display DPR cap: `2`.

These are fidelity reference values, not immutable brand constants. Any future tuning should respond to a named visual mismatch found in side-by-side comparison.

## Refresh-rate independence

The reference implementation applies frame-based dissipation. WEBERAISE preserves its 60 Hz visual behavior while converting retention to elapsed-time-corrected values:

```text
retention = baseRetention ^ (deltaSeconds × 60)
```

The reference-frame scale is bounded so a stalled/hidden tab cannot produce one enormous advection step.

When `document.hidden` is true, the engine resets its frame-time anchor instead of simulating elapsed background time.

## Input architecture

`HeroRevealCanvas` remains the lifecycle/input adapter. Pointer work does not enter React state.

Mouse, pen and touch pointer movement all feed the same tracker and `RevealSample[]` contract.

Fast path interpolation remains because it prevents gaps between browser pointer events. Interpolated samples are no longer visible geometry: they become one-time fluid splats.

Momentum normalization comes from using the displacement between consecutive interpolated samples. Splitting one physical pointer segment into more samples therefore divides its displacement rather than multiplying total injected motion.

Every new contact resets only input-history state. Existing dye/velocity remains alive. `pointerup`, `pointercancel` and `pointerleave` also reset input history so separate gestures cannot create a giant artificial delta.

## Residual motion and healing

There is no CPU-scheduled afterglide and no synthetic rogue satellite-droplet system.

Residual motion comes from velocity already stored in the fluid field. After pointer motion ends, that velocity may continue transporting dye briefly and then damps naturally through the configured retention.

Healing is dye dissipation, not circles shrinking. Aging material can taper, shear, separate or reconnect before falling below the narrow reveal threshold.

## Reduced/lite/fallback behavior

### Full

- simulation `256`;
- dye `512`;
- `20` pressure iterations;
- velocity enabled;
- pressure projection enabled.

### Lite

- simulation `128`;
- dye `256`;
- `10` pressure iterations;
- same fluid semantics and threshold behavior;
- velocity and pressure projection remain enabled.

### Reduced motion

- simulation `96`;
- dye `192`;
- velocity injection disabled;
- pressure iterations `0`;
- persistent dye still provides the reveal without authored fluid drift.

### Capability fallback

If WebGL2, `EXT_color_buffer_float`, or renderable `RGBA16F` targets are unavailable, `createRevealEngine()` returns `null` and the existing CSS reveal/fill fallback remains responsible for a usable hero.

## GPU resources

Full/lite fluid mode owns:

```text
velocity    double RGBA16F target, LINEAR
pressure    double RGBA16F target, NEAREST
dye        double RGBA16F target, LINEAR
divergence single RGBA16F target, NEAREST
```

Simulation resolution is independent of display resolution.

The engine compiles six primary programs:

- splat;
- advection;
- divergence;
- pressure Jacobi;
- pressure-gradient subtraction;
- final compositor.

A curl/vorticity pass is intentionally not compiled because the confirmed reference production setting was zero and therefore does not contribute to the desired material behavior.

## Loader warm-up

`criticalAssetRegistry` remains truthful and tracks hero-critical readiness only.

The existing `hero-code` critical task now warms the real fluid engine rather than merely importing the module. Warm-up:

- acquires WebGL2;
- validates the required float-color-buffer capability;
- compiles/links the fluid programs;
- allocates all persistent solver targets;
- validates framebuffer completeness;
- runs `prime()` for a zero-input pass graph;
- disposes the temporary engine.

This moves expensive first-use GPU setup into the loader instead of the user's first pointer interaction.

## EXPLORE transition compatibility

The same engine still exposes the existing external API used by the hero and `exploreTimeline.ts`.

When EXPLORE starts:

```text
engine.clear()
→ mode = bottomFill
→ fluid evolution is skipped
→ authored black crest progresses upward
→ fill reaches 1
→ main state
```

The bottom-fill crest remains a separate authored transition. It is not simulated fluid and is intentionally unaffected by the Nothin-fidelity rewrite.

## Performance strategy

- expensive physics runs at `128–256²`, not display resolution;
- visually important dye runs at `256–512²`;
- display DPR is profile-capped;
- no React state update occurs on pointer movement;
- no DOM layout read occurs inside the solver RAF;
- no CPU primitive history is rebuilt every frame;
- full mode omits an unnecessary zero-strength curl/vorticity pass;
- loader primes GPU resources before interaction;
- hidden-tab time is discarded instead of simulated;
- fluid evolution is skipped in bottom-fill mode;
- hero teardown disposes the GPU graph when leaving the intro;
- fallback behavior is explicit rather than allowing unsupported hardware to fail unpredictably.

## Verification boundary

The new core has been verified independently with:

- strict TypeScript compilation of the fluid engine/modules;
- real Chromium WebGL2 shader compile/link for all six programs;
- `EXT_color_buffer_float` presence;
- successful `RGBA16F` framebuffer completeness;
- one complete pressure-solver frame with `gl.getError() === 0`;
- synthetic interpolated S-curve rendering showing a connected, directionally deformed filament rather than a circle chain.

A full repository `npm test`, `npm run typecheck`, `npm run build`, and complete in-site side-by-side browser comparison remain mandatory before merging. Those gates could not be run in the current container because the runtime cannot resolve the GitHub repository for a complete checkout.

## Downstream site boundary

This branch does not redesign or modify Services, Work, About, navigation, the post-Explore ribbon narrative, or other normal homepage sections. The change is intentionally isolated to the signature hero reveal system and its tests/documentation.
