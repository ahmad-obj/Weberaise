# WEBERAISE Implementation Status

**Milestone:** hero fluid reveal + EXPLORE fluid exit polish  
**Branch:** `feature/hero-nothin-reveal-fidelity`  
**Base:** `main` @ `dff8870b357e9bc87fe1d87e1a0dc67ca9dcc74c`  
**Status:** production implementation is in the feature branch; focused contracts, isolated TypeScript integration, real WebGL shader compilation, and standalone solver sanity are complete. Full repository/build and full in-site QA remain required before merge.

## Scope

This branch preserves the WEBERAISE experience state sequence and normal site architecture while changing the hero material/interaction presentation.

Preserved:
- loader state machine and completion choreography;
- `WELCOME / TO` DOM typography;
- WEBERAISE hidden lockup registration;
- twin-line hero opening;
- navigation and route handoff;
- post-EXPLORE ribbon/main experience;
- Services, Work, About, and unrelated sections.

Changed within the hero boundary:
- pressure-projected interactive reveal replacing radial/metaball behavior;
- enlarged approved reveal footprint;
- stronger but restrained EXPLORE affordance;
- solver-driven EXPLORE takeover replacing the old analytic upward crest.

## Interactive reveal

The active reveal remains a persistent pressure-projected fluid field:

```text
latest pointer state / RAF
→ Gaussian velocity + dye splat
→ velocity advection
→ dye advection
→ divergence
→ Jacobi pressure solve
→ pressure-gradient subtraction
→ persistent dye
→ narrow threshold
→ WEBERAISE difference compositor
```

Input remains coalesced to at most one velocity + one dye splat per RAF.

### Approved current profile

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

Approved WEBERAISE scale adjustment:

```text
full/lite splat radius         0.00024
full/lite splat force          11800
reduced-motion radius          0.00032
```

Pressure, retention, threshold, solver resolution, and interactive input cadence were not increased with the scale adjustment.

## EXPLORE CTA

The previous EXPLORE treatment was only small text + a rule on a transparent hit area and could disappear visually against the hero.

Current production CTA:

```text
min width       126px
min height      44px
border          1px currentColor
corner radius   4px
source color    #fff
blend mode      difference
wrapper z       7
```

Interaction:
- restrained `2px` lift on hover/focus;
- faint interior wash;
- rule expands to full width;
- active scale `.985`;
- focus-visible outline retained;
- reduced motion collapses transition duration.

No glow, pill shape, blue gradient, bounce, or large CTA animation was added.

## EXPLORE exit replacement

Removed:
- `RevealMode = 'bottomFill'`;
- `setBottomFillProgress()` / `getBottomFillProgress()`;
- `src/webgl/reveal/emitters/bottomFillEmitter.ts`;
- analytic sine-wave crest in `COMPOSITE_FRAGMENT`;
- rounded fake-wave fallback top.

Repository code search currently returns no `bottomFill` references.

Current normal-motion exit:

```text
EXPLORE
→ button fades/acknowledges
→ engine.clear()
→ mode = fluidExit
→ bottom velocity source pass
→ bottom dye source pass
→ existing fluid advection + pressure projection
→ thresholded solver dye rendered as black
→ final seal from progress 0.94 → 1.0
→ 0.06s fully-black hold
→ existing main/ribbon state
```

The WebGL canvas switches to normal blend mode during `fluidExit`.

### Exit source configuration

New module:
- `src/webgl/reveal/exitFluid.ts`

Production constants:

```text
sourceBandTop    0.14
dyeStrength      0.24
velocityBase     4.2
velocityPeak     7.0
lateralStrength  0.35
sealStart        0.94
```

`EXIT_SOURCE_FRAGMENT` uses three broad Gaussian horizontal profiles for deterministic asymmetry. It contains no time oscillation, sine, FBM, simplex, or hash noise.

### Velocity-source stability correction

The first implementation followed the initial plan literally and **added** source velocity each frame. Standalone solver reproduction showed that was too aggressive:

```text
frame 5     thin bottom band
frame 15    roughly half screen
frame 30    effectively full screen
```

Root cause: the source added another `4.2–7.0` vertical velocity every frame while the field retained `.962` momentum, so the source boundary accumulated velocity instead of defining a stable inflow.

Production now bounds the source velocity:

```glsl
velocityTarget = vec3(lateralProfile, upward, 0.0)
velocityDriven = mix(base, velocityTarget, sourceBand)
```

Dye is still additive. Velocity in the source band converges to the desired profile rather than increasing without bound.

Standalone 60 Hz solver sanity after that correction:

```text
frame 30 / ~0.5s    41.9% black coverage
frame 60 / ~1.0s    70.1% black coverage
frame 84 / ~1.4s    91.6% black coverage
```

At frame 84 the front is already near the top with broad asymmetric shoulders, just before the `0.94` completion seal begins.

## Exit fallback behavior

Fluid exit eligibility:

```text
engine exists
&& engine.quality.enableVelocity
&& !reducedMotion
```

Otherwise:
- reduced motion → plain DOM black fill, about `0.24s`;
- engine/WebGL failure → plain DOM black fill, about `0.9s`.

The fallback layer is a simple full-screen black rectangle with no rounded or wave-shaped top.

## GPU impact

No new render targets were added.

Existing targets remain:

```text
velocity    double RGBA16F / LINEAR
pressure    double RGBA16F / NEAREST
dye         double RGBA16F / LINEAR
divergence  single RGBA16F / NEAREST
```

New program:
- `EXIT_SOURCE_FRAGMENT`.

During `fluidExit` only, the solver performs two additional fullscreen writes per frame:
1. velocity source;
2. dye source.

It then reuses the existing advection, divergence, pressure, and gradient passes.

Normal interactive reveal cost is unchanged.

## Files introduced / retired for this EXPLORE change

Added:
- `src/webgl/reveal/exitFluid.ts`
- `tests/explore-fluid-exit.test.mjs`
- `docs/superpowers/specs/2026-09-01-explore-cta-fluid-exit-design.md`
- `docs/superpowers/plans/2026-09-01-explore-cta-fluid-exit.md`

Modified:
- `src/app/globals.css`
- `src/webgl/reveal/fluid/shaders.ts`
- `src/webgl/reveal/shaders.ts`
- `src/webgl/reveal/RevealEngine.ts`
- `src/experience/motion/exploreTimeline.ts`
- reveal/interaction/visual contract tests
- architecture/status docs

Removed:
- `src/webgl/reveal/emitters/bottomFillEmitter.ts`

## Verification completed for current code

### Focused source contracts

An isolated harness using the current EXPLORE/engine/timeline source contracts reports:

```text
tests 2
pass 2
fail 0
```

The contracts cover:
- framed/difference-blended CTA;
- CTA layering above the reveal compositor;
- `fluidExit` engine mode/API;
- source program presence;
- solver execution in `fluidExit`;
- timeline eligibility/timing;
- absence of `bottomFill` orchestration;
- absence of analytic sine exit compositing.

### TypeScript integration

An isolated TypeScript harness containing the current `RevealEngine`, exit configuration, shader interfaces, timeline integration, and required type stubs compiles with:

```bash
tsc -p tsconfig.json --noEmit
```

Result: pass / no diagnostics.

This is **not** a claim that the complete repository `npm run typecheck` has run.

### Real Chromium WebGL2

Fresh real Chromium/Xvfb WebGL2 verification for the bounded production source:

```text
webgl2=ok
EXT_color_buffer_float=true
EXIT_SOURCE_FRAGMENT=ok
COMPOSITE_FRAGMENT=ok
```

Existing core fluid shaders/half-float solver had already been independently verified earlier on this branch.

### Standalone solver visual sanity

A real WebGL solver reproduction used:
- exit velocity source;
- exit dye source;
- velocity advection;
- dye advection;
- divergence;
- 20 pressure Jacobi iterations;
- pressure-gradient subtraction;
- production reveal threshold.

It verified:
- bottom-origin takeover;
- paced rise instead of instant fill;
- broad asymmetric front;
- no repeated sine wavelength;
- front naturally reaches near the top before the completion seal.

## Still required before merge

This runtime does not have a complete checked-out Next.js repository with installed project dependencies, so the following full-project claims are intentionally **not** made yet:

```bash
npm test
npm run typecheck
npm run build
git diff --check
npm run dev
```

Before merge, run those on a complete checkout and perform full in-site QA at:
- 1920×1080;
- 1440×900;
- 1280×800;
- tablet;
- 390×844/mobile.

Test EXPLORE:
1. immediately on hero entry;
2. after a large reveal stroke;
3. after idle/autonomous behavior;
4. on full and lite profiles;
5. with reduced motion;
6. with forced engine fallback.

Acceptance:
- CTA is clearly discoverable but visually restrained;
- interactive reveal before click is unchanged;
- exit starts from below;
- front has broad material irregularity, not a periodic wave;
- no sudden early full-screen boom;
- final seal is not perceived as a separate flash;
- viewport is completely black before the ribbon/main state appears.

## Merge gate

```text
[ ] npm test
[ ] npm run typecheck
[ ] npm run build
[ ] git diff --check
[ ] full desktop visual QA
[ ] lite/mobile performance
[ ] real touch/coarse-pointer behavior
[ ] reduced-motion exit
[ ] forced fallback exit
[ ] active-dye EXPLORE exit
[ ] seamless black main/ribbon handoff
[ ] no unrelated branch changes
```

Do not merge without explicit user instruction.
