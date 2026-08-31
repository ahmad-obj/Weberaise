# Weberaise Implementation Status

**Milestone:** Nothin-fidelity hero reveal rebuild  
**Branch:** `feature/hero-nothin-reveal-fidelity`  
**Base:** `main` @ `dff8870b357e9bc87fe1d87e1a0dc67ca9dcc74c`  
**Status:** reveal implementation and independent GPU verification complete; full repository/build and complete in-site visual QA still required before merge

## Scope preserved

This branch does not redesign the WEBERAISE website. It replaces the hero's interactive material model while preserving:

- experience state sequence;
- truthful loader and completion choreography;
- twin-line hero opening;
- `WELCOME / TO` DOM typography and registration;
- WEBERAISE brand lockup composition;
- hero vignette;
- navigation;
- EXPLORE CTA and bottom-fill handoff;
- post-Explore experience;
- CSS fallback;
- Services, Work, About and unrelated homepage sections.

## Confirmed Nothin reference

Direct inspection of the supplied Nothin production bundle confirmed:

```text
velocity / pressure sim        256 × 256
dye                            512 × 512
pressure iterations            20
velocity dissipation           0.962 / frame
dye dissipation                0.988 / frame
curl strength                  0
splat radius parameter         0.00006
splat force                    5900
reveal multiplier              3.9
threshold                      0.50 → 0.51
half-float targets             yes
DPR cap                        2
```

The reference uses a genuine pressure-projected 2D fluid field. It does not build the visible mask from shrinking metaball primitives.

Research:
- `docs/superpowers/specs/2026-08-31-nothin-reveal-fidelity-design.md`

Implementation plan:
- `docs/superpowers/plans/2026-08-31-nothin-fluid-reveal-rebuild.md`

## Production reveal replacement

Retired from the active reveal path:

- `LiquidPrimitive[]` history;
- instanced radial field geometry;
- additive metaball construction;
- geometric radius-contraction healing;
- `liquidRadiusScale()`;
- `createInertialAfterglide()`;
- rogue satellite droplets;
- interactive contour sine warp;
- primitive lifetime module/test.

Current full/lite pipeline:

```text
latest mouse / pen / touch / autonomous input
→ at most one Gaussian velocity+dye injection per RAF
→ velocity advection
→ dye advection
→ divergence
→ pressure Jacobi iterations
→ pressure-gradient subtraction
→ persistent dye
→ gain + 0.01-wide threshold
→ existing WEBERAISE difference compositor
```

Shape irregularity comes from field transport, not decorative boundary noise.

## Input fidelity and performance

A first implementation queued every interpolated pointer sample and could perform many full-screen splat passes in one frame. Review against Nothin's shipped `_step()` showed this was not reference-faithful and would over-deposit dye.

The current engine now follows Nothin's event model:

- `emit(samples)` keeps only `samples.at(-1)`;
- that sample waits as `pendingSample`;
- RAF computes displacement from the last sample that was actually applied;
- at most one velocity splat and one dye splat occur per frame;
- high-frequency mouse/pointer events therefore do not multiply GPU passes or dye strength.

`PointerTracker` may still condition DOM events before `emit()`, but interpolation no longer increases simulation deposition count.

## GPU implementation

New modules:

- `src/webgl/reveal/fluid/types.ts`
- `src/webgl/reveal/fluid/gl.ts`
- `src/webgl/reveal/fluid/renderTargets.ts`
- `src/webgl/reveal/fluid/shaders.ts`

`RevealEngine` owns:

```text
velocity    double RGBA16F / LINEAR
pressure    double RGBA16F / NEAREST
dye         double RGBA16F / LINEAR
divergence  single RGBA16F / NEAREST
```

Programs:

1. Gaussian splat;
2. advection;
3. divergence;
4. pressure Jacobi;
5. gradient subtraction;
6. final compositor.

Curl/vorticity is intentionally omitted because the inspected Nothin production value is `curlStrength = 0`.

## Quality profiles

### Full

```text
sim resolution             256
dye resolution             512
pressure iterations        20
DPR cap                    2
velocity retention @60Hz   0.962
dye retention @60Hz        0.988
splat radius               0.00006
splat force                5900
reveal gain                3.9
threshold                  0.50 → 0.51
velocity                   enabled
```

### Lite

```text
sim resolution             128
dye resolution             256
pressure iterations        10
DPR cap                    1.25
velocity                   enabled
same reveal semantics
```

### Reduced motion

```text
sim resolution             96
dye resolution             192
pressure iterations        0
DPR cap                    1
velocity injection         disabled
persistent dye             enabled
```

### Fallback

The actual hero canvas is the capability authority. If WebGL2 context creation, `EXT_color_buffer_float`, shader/FBO setup or RGBA16F framebuffer validation fails, `createRevealEngine()` returns `null` and the CSS fallback is used.

A throwaway WebGL probe context is no longer created before the real hero context, avoiding unnecessary context pressure on mobile browsers.

## Refresh-rate behavior

Nothin's dissipation constants are frame-based. WEBERAISE converts them to elapsed-time-corrected retention while matching the 60 Hz reference appearance.

A bounded reference-frame scale prevents extreme single-frame backtraces after a stall.

When `document.hidden` is true, `lastFrameTime` is reset. Background-tab elapsed time is not simulated on resume.

## Hero lifecycle fixes made during review

### Engine readiness race

The heavier fluid engine initializes asynchronously. A mutable `engineRef` alone was insufficient because the hero could enter `heroInteractive` just before initialization finished and the input effect would not rerun.

`HeroRevealCanvas` now sets one `engineReady` state transition after successful engine/layout setup. Interactive listeners and the autonomous teaser wait for that state.

Pointer movement itself does not update React state.

### Partial-engine fallback cleanup

If engine creation succeeds but required brand-layer setup cannot complete, the partial engine is disposed before CSS fallback is installed. GPU resources are not orphaned.

### Autonomous/live input isolation

Scripted teaser samples and live input previously risked sharing displacement history if the user interacted during the `0.64s` teaser.

Current behavior:
- autonomous timers are cancellable;
- first live user input cancels all remaining teaser timers;
- tracker/engine input history is reset before live input takes control;
- already deposited dye/velocity remains alive.

This prevents false long-distance momentum splats between scripted and user coordinates.

## Mouse, pen and touch

The old `pointerType === 'touch'` exclusion has been removed.

Mouse, pen and touch movement now use the same reveal path.

Input history resets on:
- `pointerdown`;
- `pointerup`;
- `pointercancel`;
- `pointerleave`.

This prevents separate contacts from becoming one huge movement vector.

CSS fallback also clears its active state on pointer up/cancel/leave, so a touch release cannot leave the fallback reveal stuck open.

Actual coarse-pointer/touch-device QA is still required before merge.

## Autonomous teaser

The existing short brand-region teaser remains:

- `createHeroAutonomousStroke()`;
- ~`0.64s` sequence;
- lower brand region;
- same `RevealSample` contract.

Its samples now become simulation input. Once user input begins, the remaining teaser is cancelled.

## EXPLORE compatibility

The external engine contract required by `exploreTimeline.ts` remains intact.

EXPLORE still performs:

```text
engine.clear()
engine.setBottomFillProgress(0)
engine.setMode('bottomFill')
```

Fluid evolution is skipped in `bottomFill`. The accepted authored black crest remains responsible for the transition into the main page.

## Loader GPU preflight

`Loader.tsx` still contains the `hero-code` critical task calling `warmRevealEngine()`.

This is now documented accurately as a **temporary-context preflight**:

- create a disposable canvas/context;
- construct the fluid graph;
- validate compatible float targets;
- compile/link programs;
- execute `prime()`;
- dispose.

It can detect an unsupported fluid path before the hero, but WebGL resources/programs are context-specific. It does **not** persistently warm the eventual hero canvas or eliminate all hero-context setup cost.

## Reveal tests

Added:
- `tests/fluid-reveal.test.mjs`

Removed:
- `tests/liquid-lifetime.test.mjs`

Current reveal contracts cover:
- confirmed full-profile constants;
- refresh-rate timing math;
- RGBA16F ping-pong resources;
- splat/advection/divergence/pressure/gradient shaders;
- pressure-projected engine ownership;
- one-latest-sample-per-RAF input coalescing;
- no metaball primitive engine;
- no interactive contour warp;
- no synthetic afterglide;
- actual-context capability authority;
- hidden-tab protection;
- engine-ready interaction gating;
- autonomous/live input isolation;
- mouse/touch stream reset boundaries;
- fallback touch cleanup;
- existing EXPLORE/loader contracts.

Some older non-production utility tests/helpers remain in the repository and are intentionally outside this reveal-material change unless the full repository gate proves they need cleanup.

## Independent verification completed

The local runtime cannot clone/fetch the complete GitHub repository because outbound GitHub DNS resolution is blocked. Full Next.js project commands therefore cannot honestly be reported as passing here.

The reveal core was reconstructed into an isolated verification harness.

### TypeScript

- quality/timing/render-target modules: compile pass;
- complete fluid `RevealEngine` and shader imports: compile pass at the earlier core checkpoint.

A final core compilation should be repeated after the latest input-coalescing/lifecycle edits before merge.

### Chromium WebGL2

Previously verified through a real Chromium WebGL2 context:

```text
WebGL2                         available
EXT_color_buffer_float       available
SPLAT_FRAGMENT               compile/link pass
ADVECTION_FRAGMENT           compile/link pass
DIVERGENCE_FRAGMENT          compile/link pass
PRESSURE_FRAGMENT            compile/link pass
GRADIENT_SUBTRACT_FRAGMENT   compile/link pass
COMPOSITE_FRAGMENT           compile/link pass
RGBA16F framebuffer          COMPLETE
pressure-solver frame        executed
gl.getError()                0
```

### Material sanity render

A synthetic interpolated S-curve through the fluid pass graph produced:
- connected elongated material;
- directional bending/shearing;
- tapering/irregular field shape;
- no visible circle-chain/metaball construction.

The shader/pass graph is unchanged by the later input-lifecycle fixes; final integration behavior still needs full-site QA.

## Required verification before merge

On a complete network-enabled checkout:

```bash
npm ci
npm test
npm run typecheck
npm run build
git diff --check
npm run dev
```

Then compare complete WEBERAISE against the supplied/local Nothin reference using identical paths:

```text
medium straight stroke
fast diagonal
slow 90° turn
S-curve
tight loop/self-overlap
fast stroke then 3-second decay
second stroke through an aging first stroke
user takeover during autonomous teaser
touch drag + lift + second touch
```

Also test:
- 1920×1080 / 1440×900 / 1280×800;
- tablet/mobile sizes;
- reduced motion;
- forced capability fallback;
- hidden tab → visible tab;
- EXPLORE while dye is active.

Do not retune the baseline constants until a specific side-by-side mismatch is identified.

## Merge gate

```text
[ ] npm test
[ ] npm run typecheck
[ ] npm run build
[ ] git diff --check
[ ] full desktop Nothin-family fidelity
[ ] acceptable lite/mobile performance
[ ] reduced-motion behavior
[ ] real touch/coarse-pointer behavior
[ ] fallback behavior
[ ] hidden-tab resume
[ ] autonomous/live takeover
[ ] EXPLORE handoff
[ ] no unrelated branch changes
```
