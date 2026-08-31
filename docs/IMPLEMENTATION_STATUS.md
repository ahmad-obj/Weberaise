# Weberaise Implementation Status

**Milestone:** Nothin-fidelity hero reveal rebuild  
**Branch:** `feature/hero-nothin-reveal-fidelity`  
**Base:** `main` @ `dff8870b357e9bc87fe1d87e1a0dc67ca9dcc74c`  
**Status:** implemented at reveal-core level; full Next.js regression/deployed visual QA still required before merge

## Scope

This branch changes the WEBERAISE signature hero reveal only.

Preserved:
- experience reducer/state sequence;
- truthful loader;
- loader completion choreography;
- twin-line hero opening;
- registered `WELCOME / TO` DOM typography;
- approved WEBERAISE brand lockup composition;
- hero vignette;
- EXPLORE CTA;
- EXPLORE bottom-fill transition;
- post-Explore handoff;
- no-WebGL CSS fallback;
- Services / Work / About / navigation / ribbon sections.

## Reference investigation

The supplied Nothin site archive was inspected directly. Its shipped bundle confirms that the signature reveal is based on a real 2D fluid pipeline rather than a CPU metaball/primitive field.

Confirmed reference characteristics used as the WEBERAISE baseline:

```text
velocity / pressure simulation   256 × 256
dye field                        512 × 512
pressure iterations              20
velocity retention / frame       0.962 at 60 Hz
dye retention / frame            0.988 at 60 Hz
curl strength                     0
splat force                       5900
Gaussian radius parameter         0.00006
reveal gain                       3.9
threshold                         0.50 → 0.51
half-float render targets         yes
DPR cap in reference              2
```

Reference research/spec:
- `docs/superpowers/specs/2026-08-31-nothin-reveal-fidelity-design.md`

Execution plan:
- `docs/superpowers/plans/2026-08-31-nothin-fluid-reveal-rebuild.md`

## Current interactive reveal architecture

The old production model has been removed from the active reveal path.

Removed:
- `LiquidPrimitive[]` CPU history;
- instanced rounded field contributions;
- additive metaball construction;
- radius-contraction healing;
- `liquidRadiusScale()`;
- `createInertialAfterglide()`;
- synthetic rogue satellite droplets;
- interactive contour sine warp;
- primitive lifetime module/test.

Current full/lite model:

```text
Pointer / touch / autonomous input
→ PointerTracker interpolation
→ one-time Gaussian velocity + dye splats
→ velocity advection
→ dye advection
→ divergence
→ pressure Jacobi solve
→ pressure-gradient subtraction
→ persistent dye field
→ gain + narrow threshold
→ existing WEBERAISE difference compositor
```

The visible contour is produced by the simulated dye field itself rather than by procedural boundary noise.

## GPU implementation

New focused modules:

- `src/webgl/reveal/fluid/types.ts`
- `src/webgl/reveal/fluid/gl.ts`
- `src/webgl/reveal/fluid/renderTargets.ts`
- `src/webgl/reveal/fluid/shaders.ts`

`RevealEngine.ts` now owns:

```text
velocity    double RGBA16F
pressure    double RGBA16F
dye        double RGBA16F
divergence single RGBA16F
```

Fluid shader programs:

1. Gaussian splat;
2. advection;
3. divergence;
4. pressure Jacobi;
5. pressure-gradient subtraction;
6. final WEBERAISE composite.

Curl/vorticity is intentionally omitted because the directly inspected Nothin production setting is `curlStrength = 0`.

## Quality profiles

### Full

```text
simulation resolution     256
dye resolution            512
pressure iterations       20
display DPR cap           2
velocity retention 60 Hz  0.962
dye retention 60 Hz       0.988
splat radius              0.00006
splat force               5900
reveal gain               3.9
threshold start           0.50
threshold width           0.01
velocity enabled          yes
```

### Lite

```text
simulation resolution     128
dye resolution            256
pressure iterations       10
display DPR cap           1.25
same retention / threshold semantics
velocity enabled          yes
```

### Reduced motion

```text
simulation resolution     96
dye resolution            192
pressure iterations       0
display DPR cap           1
velocity injection        disabled
persistent dye reveal     enabled
```

### Fallback

If WebGL2 or the required renderable half-float path cannot initialize, `createRevealEngine()` returns `null` and the existing CSS reveal/fill fallback is used.

## Timing improvement over the reference

Nothin's shipped dissipation values are frame-based. WEBERAISE retains the same 60 Hz appearance but converts them to elapsed-time-corrected retention.

This prevents 120 Hz displays from healing materially faster than 60 Hz displays.

Long hidden-tab gaps are not simulated. The frame-time anchor resets while `document.hidden` is true.

## Pointer / touch behavior

The previous synthetic afterglide path is gone.

Current behavior:
- pointer interpolation spacing remains `0.022`;
- tracker max velocity remains `1.85`;
- existing sample radius values remain as input-contract data but full fluid mode uses the solver `splatRadius`;
- interpolated displacement is split across splats so path interpolation does not multiply total momentum;
- residual movement comes from the persistent velocity texture;
- new pointer/touch contact resets interpolation and engine delta history only;
- persistent fluid state is not cleared between contacts;
- mouse, pen and touch pointer movement use the same simulation input path;
- `pointerup`, `pointercancel` and `pointerleave` reset stream history to prevent discontinuity jumps.

## Autonomous reveal

The existing short autonomous hero stroke remains.

It still:
- uses `createHeroAutonomousStroke()`;
- runs over approximately `0.64s`;
- crosses the intended lower brand region;
- uses the same `RevealSample` input contract.

Its samples now deposit dye/velocity into the real simulation instead of becoming visible circle primitives.

## EXPLORE compatibility

The public `RevealEngine` contract used by the hero is preserved.

Before EXPLORE bottom-fill:

```text
engine.clear()
engine.setBottomFillProgress(0)
engine.setMode('bottomFill')
```

In `bottomFill` mode the expensive fluid solver is skipped. The existing authored black crest remains responsible for the hero-to-main transition.

## Loader warm-up

`warmRevealEngine()` now validates the actual fluid path rather than only importing the reveal module.

Warm-up uses a small display canvas while allocating the real quality-profile solver resources. It:
- constructs the engine;
- verifies WebGL2 and `EXT_color_buffer_float`;
- allocates RGBA16F targets;
- compiles/links fluid programs;
- runs `prime()`;
- disposes the temporary engine.

The existing loader `hero-code` critical task and weight are preserved.

## Tests changed with the architecture

Added:
- `tests/fluid-reveal.test.mjs`

Removed:
- `tests/liquid-lifetime.test.mjs`

Updated reveal-related contracts now assert:
- Nothin baseline quality constants;
- refresh-rate-independent timing math;
- half-float ping-pong targets;
- splat/advection/divergence/pressure/gradient shader suite;
- persistent fluid ownership in `RevealEngine`;
- no metaball primitive engine;
- no interactive contour warp;
- no synthetic afterglide;
- touch input lifecycle/reset boundaries;
- existing EXPLORE and loader behavior remains intact.

Several stale historical loader/hero assertions were also aligned with the already-approved current `main` behavior rather than modifying working production UI to satisfy obsolete tests.

## Verification evidence completed in this environment

The current environment cannot obtain a complete GitHub checkout through the local container because external repository DNS resolution is blocked. Therefore a full project `npm test`, Next typecheck and Next build cannot honestly be claimed here.

The new reveal core was independently reconstructed into a verification harness and checked directly.

### TypeScript

- fluid quality/timing/render-target modules: compile pass;
- full `RevealEngine` + shader imports: compile pass.

### Real Chromium WebGL2

Verified through Chromium's DevTools runtime:

```text
WebGL2 context                      available
EXT_color_buffer_float            available
SPLAT_FRAGMENT                    compile/link pass
ADVECTION_FRAGMENT                compile/link pass
DIVERGENCE_FRAGMENT               compile/link pass
PRESSURE_FRAGMENT                 compile/link pass
GRADIENT_SUBTRACT_FRAGMENT        compile/link pass
COMPOSITE_FRAGMENT                compile/link pass
RGBA16F framebuffer               COMPLETE
full pressure-solver frame        executed
final gl.getError()               0
```

### Synthetic material sanity test

A sequence of interpolated splats was rendered through the actual fluid pass graph using an S-shaped path.

Observed result:
- connected elongated material;
- directional deformation;
- bending/shearing through the path;
- tapering/irregular edge behavior;
- no visible chain-of-circular-metaballs construction.

This confirms the core geometry model has moved into the intended Nothin-like directional-fluid family.

## Verification still required before merge

On a normal network-enabled checkout of this branch:

```bash
npm ci
npm test
npm run typecheck
npm run build
git diff --check
npm run dev
```

Then compare the complete WEBERAISE hero against the supplied/local Nothin reference with the same deliberate paths:

```text
straight medium-speed stroke
fast diagonal stroke
slow 90° turn
S-curve
tight loop/self-overlap
fast stroke then 3-second stop
second stroke through an aging first stroke
touch drag on a coarse-pointer device
```

Acceptance:
- no circle-chain construction;
- movement direction stretches/deforms the surface;
- dye continues moving briefly after pointer stops;
- velocity damps rather than swimming indefinitely;
- reveal interior remains solid;
- edge remains narrow and clean;
- no animated contour-noise crawl;
- no fog halo;
- healing occurs through dye loss/deformation rather than shrinking circles;
- hero text/logo registration remains exact;
- touch gestures do not jump between contacts;
- EXPLORE handoff remains seamless;
- no performance regression outside the hero.

Do not retune the baseline constants until this comparison identifies a specific mismatch.

## Merge gate

This branch should not merge into `main` until all of the following are true:

```text
[ ] npm test passes
[ ] npm run typecheck passes
[ ] npm run build passes
[ ] git diff --check passes
[ ] full desktop hero visually matches the Nothin material family
[ ] lite/mobile hero remains responsive
[ ] reduced-motion path remains usable
[ ] touch drag works without inter-gesture jumps
[ ] forced fluid capability failure uses CSS fallback cleanly
[ ] hidden-tab resume is stable
[ ] EXPLORE transition remains correct
[ ] branch diff contains no unrelated site changes
```
