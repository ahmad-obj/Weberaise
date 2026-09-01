# WEBERAISE Implementation Status

**Milestone:** hero fluid reveal + EXPLORE fluid exit polish  
**Branch:** `feature/hero-nothin-reveal-fidelity`  
**Base:** `main` @ `dff8870b357e9bc87fe1d87e1a0dc67ca9dcc74c`  
**Status:** production implementation is in the feature branch. Focused source contracts, isolated TypeScript interface verification, real Chromium shader compilation, and a standalone full solver reproduction have been completed. Full repository/build and full in-site QA remain required before merge.

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

```text
full sim                       256 × 256
full dye                       512 × 512
pressure iterations            20
velocity retention @ 60 Hz     0.962
dye retention @ 60 Hz          0.988
reveal gain                    3.9
threshold                      0.50 → 0.51
full/lite splat radius         0.00024
full/lite splat force          11800
reduced-motion radius          0.00032
```

Pressure, retention, threshold, solver resolution, and interactive input cadence were not increased with the approved scale adjustment.

## EXPLORE CTA

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

Current normal-motion exit:

```text
EXPLORE
→ button fades/acknowledges
→ preserve current dye + residual velocity
→ mode = fluidExit
→ full-domain bounded velocity-drive pass
→ bottom dye-source pass
→ existing fluid advection + pressure projection
→ thresholded solver dye rendered as black
→ last-frame seal from progress 0.9997 → 1.0
→ 0.06s fully-black hold
→ existing main/ribbon state
```

The WebGL canvas switches to normal blend mode during `fluidExit`.

### Continuity correction

The production timeline intentionally does **not** call `engine.clear()` when EXPLORE is pressed.

Existing user/autonomous dye and residual velocity remain alive as the mode changes to `fluidExit`. This prevents a reset/flash and makes the exit feel like the same material taking over the viewport.

### Exit source configuration

New module:
- `src/webgl/reveal/exitFluid.ts`

Current production constants:

```text
sourceBandTop    0.14
dyeStrength      0.24
velocityBase     4.2
velocityPeak     8.0
lateralStrength  0.45
sealStart        0.9997
```

`EXIT_SOURCE_FRAGMENT` uses four broad Gaussian horizontal profiles and monotonically morphs between two profile arrangements as progress advances. It contains no time oscillation, sine, FBM, simplex, or hash noise.

### Solver-source corrections found during verification

Two initial source variants were rejected by real WebGL solver reproduction:

1. **Additive target velocity each RAF** accumulated too much momentum under the `.962` velocity retention.
2. **Velocity limited to the bottom 14% source band** could not transport the dye through the viewport; the visible material stalled around that region.

Production now uses:

- dye supplied only from the bottom band;
- a full-domain velocity target field;
- a bounded convergence factor instead of additive velocity growth.

Core production behavior:

```glsl
vec3 velocityTarget = vec3(lateralProfile, upward, 0.0);
float velocityDrive = mix(0.18, 0.26, drive);
vec3 velocityDriven = mix(base, velocityTarget, velocityDrive);
```

The completion seal was also moved from the originally planned `0.94` to `0.9997`. A `0.94` seal would begin globally darkening the viewport while the natural fluid front was still visibly travelling. `0.9997` leaves the visible transition solver-driven and acts only as a final handoff guard.

## Verified solver progression

A real standalone WebGL2 reproduction used:
- 256×256 velocity;
- 512×512 dye;
- RGBA16F targets;
- `.962` velocity retention;
- `.988` dye retention;
- divergence;
- 20 pressure Jacobi iterations;
- pressure-gradient subtraction;
- production gain/threshold;
- current exit source and `power2.inOut` progress over 96 frames.

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

The solver run completed with:

```text
glError=0
```

This verifies that the visible flood itself reaches the top before the last-frame safety seal finishes.

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
1. velocity target drive;
2. dye source.

It then reuses the existing advection, divergence, pressure, and gradient passes. Normal interactive reveal cost is unchanged.

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
- architecture/status/design docs

Removed:
- `src/webgl/reveal/emitters/bottomFillEmitter.ts`

## Verification completed for current code

### Focused source contracts

Fresh mirrored-source run:

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
- bounded full-domain velocity drive;
- preservation of existing fluid state (`engine.clear()` absent from exit timeline);
- timeline eligibility/timing;
- absence of `bottomFill` orchestration;
- absence of analytic sine exit compositing.

### TypeScript interface verification

An isolated TypeScript harness containing the current exit configuration, timeline integration, RevealEngine-facing interface, and required stubs compiles with:

```bash
tsc -p tsconfig.json --noEmit
```

Result: pass / no diagnostics.

This verifies the new exit interfaces only. It is **not** a claim that complete-repository `npm run typecheck` has run.

### Real Chromium WebGL2

Fresh real Chromium verification:

```text
webgl2=ok
EXT_color_buffer_float=true
EXIT_SOURCE_FRAGMENT=ok
COMPOSITE_FRAGMENT=ok
```

### Full standalone solver reproduction

Fresh current-source reproduction completed all 96 simulated frames with:

```text
glError=0
99.91% thresholded coverage at final frame
natural top reach around frame 88
```

## Still required before merge

This runtime does not have a complete checked-out Next.js repository with installed project dependencies, so the following full-project claims are intentionally **not** made:

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
- existing revealed fluid continues into the exit without reset;
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
