# EXPLORE CTA + Fluid Exit Design

## Context

The interactive hero reveal now uses a persistent pressure-projected WebGL2 fluid simulation. The current EXPLORE affordance and exit transition predate that material system:

- EXPLORE is visually light: small transparent text plus a short rule, rendered below the reveal compositor.
- The exit uses `bottomFill`, which stops fluid simulation and draws a black analytic crest in the composite shader using two sine waves.
- This makes the final interaction feel less intentional than the reveal that precedes it.

This change makes EXPLORE clearly actionable while keeping the hero restrained, then makes the exit feel like the same digital material expanding from the bottom of the viewport.

## Goals

1. Make EXPLORE obviously clickable without turning it into a loud SaaS CTA.
2. Preserve the existing typography, monochrome palette, hero composition, navigation, and interaction hierarchy.
3. Replace the analytic sine-wave bottom fill with a real solver-driven fluid flood.
4. Reuse the existing velocity, dye, advection, divergence, pressure, and gradient passes rather than adding a separate animation engine.
5. Keep the hero-to-main handoff fully black and seamless.
6. Preserve a simple, reliable fallback for reduced motion and WebGL failure.

## Non-goals

- No glow, blue gradient, glassmorphism, pill button, bounce, or large scale animation.
- No new animation dependency.
- No change to the interactive reveal constants or pointer behavior.
- No change to the post-EXPLORE ribbon/main experience.
- No periodic sine/noise formula controlling the visible exit edge.

## EXPLORE visual contract

EXPLORE becomes a restrained framed control:

- Minimum width: `126px`.
- Minimum height: `44px` so touch affordance remains adequate.
- Border: `1px solid currentColor`.
- Corner radius: `4px`.
- Interior: transparent at rest.
- Typography: keep the existing compact WEBERAISE body treatment (`700 11px/1 var(--font-body)`, `.18em` tracking).
- Keep the existing short rule beneath the label.
- Render the EXPLORE wrapper above the reveal canvas and vignette.
- Use white as the source color with `mix-blend-mode: difference`, producing black over white hero areas and white over black/revealed areas.

Hover/focus behavior:

- Lift by `2px` over roughly `320ms`.
- Add a very faint white source wash (`rgba(255,255,255,.055)`) that participates in difference blending.
- Expand the rule from its resting scale to `scaleX(1)`.
- Keep focus-visible outline support.
- Active press returns the lift and scales to approximately `.985` for a restrained click acknowledgement.

The control must remain visually stable when disabled during `heroExiting`; the GSAP exit timeline owns its disappearance.

## Fluid flood exit contract

### Mode

Replace `RevealMode = 'bottomFill'` with `RevealMode = 'fluidExit'`.

Replace the public fill API with:

```ts
setExitProgress(progress: number): void
getExitProgress(): number
```

`setExitProgress` clamps to `[0, 1]` and is the single timeline-controlled driver for the transition.

### Solver lifecycle

In `fluidExit` mode the engine continues running the same pressure-projected simulation. Each frame:

1. Inject one fullscreen bottom-source pass into velocity.
2. Inject one fullscreen bottom-source pass into dye.
3. Advect velocity.
4. Advect dye.
5. Compute divergence.
6. Solve pressure using the quality profile's existing iteration count.
7. Subtract the pressure gradient.
8. Composite the thresholded dye as opaque black over the hero.

No pointer splats run during exit.

### Exit source

Add a dedicated `EXIT_SOURCE_FRAGMENT` program in `src/webgl/reveal/fluid/shaders.ts`.

The source is a fixed smooth band in approximately the bottom `14%` of solver space. It is evaluated once per target per frame, not as dozens of Gaussian splats.

The velocity source is broadly upward with deterministic, non-periodic asymmetry made from three wide Gaussian x-lobes. Initial constants:

- source band top: `0.14` UV.
- upward velocity: ramp from about `4.2` to `7.0` solver cells/reference-frame as exit progress rises.
- lateral velocity magnitude: at most about `0.35` solver cells/reference-frame.
- lobe centers: approximately `0.22`, `0.58`, `0.84`.
- lobe widths: broad (`~0.18–0.30` UV), so the front forms a few large shoulders rather than many small waves.

There is no `sin`, periodic crest, FBM, simplex, or hash noise in the exit source. The source only seeds broad uneven momentum; advection and pressure projection create the evolving visible edge.

The dye source injects white scalar material into the same bottom band. Existing dye retention and reveal threshold semantics remain unchanged.

### Composite

`COMPOSITE_FRAGMENT` has two explicit behaviors:

- `reveal`: existing difference-composite using thresholded dye and registered brand texture.
- `fluidExit`: threshold the solver dye using the same `revealGain`, `edgeSoftness`, and `edgeWidth`, then render `vec4(0, 0, 0, alpha)` with normal blending.

Remove the existing `uTime`-driven sine crest and `uFillProgress/uFillEnabled` analytic fill.

For a guaranteed seamless handoff, the last `6%` of exit progress may apply a global black completion seal:

```glsl
float seal = smoothstep(0.94, 1.0, uExitProgress);
float alpha = max(fluidMask, seal);
```

This seal does not define a moving edge; it only closes residual pinholes after the solver has covered almost all of the viewport.

### Canvas compositing

- `reveal` mode keeps `mix-blend-mode: difference`.
- `fluidExit` mode uses `mix-blend-mode: normal` because the canvas is directly painting the black takeover.
- `disabled` remains invisible.

## Timeline contract

`runExploreTimeline` keeps responsibility for orchestration and navigation handoff.

On click:

1. Fade/lift the EXPLORE wrapper away in roughly `0.18–0.22s`.
2. For normal motion with a velocity-capable engine:
   - `engine.clear()`.
   - `engine.setExitProgress(0)`.
   - `engine.setMode('fluidExit')`.
   - animate progress `0 → 1` over approximately `1.60s` using a smooth in/out curve.
   - call `engine.setExitProgress(...)` on each update.
3. Hold the fully black frame for approximately `0.06s` before calling the existing `onComplete` handoff.

The motion should read as:

- first ~15%: material establishes from below;
- middle ~65%: broad confident upward advance;
- final ~20%: faster closure toward the top, followed by the completion seal if needed.

The exact spatial character comes from the fluid simulation, not a moving CSS/GLSL waveform.

## Reduced motion and WebGL fallback

Do not run the velocity-driven fluid exit when:

- `reducedMotion === true`, or
- no `RevealEngine` exists, or
- the selected quality profile has `enableVelocity === false`.

In those cases:

- disable the reveal canvas if an engine exists;
- use the existing `.hero-exit-fill` DOM layer as a plain black bottom-up fill;
- remove the current rounded/organic top styling so the fallback does not pretend to be fluid;
- use a short reduced-motion duration (`~0.24s`) and a restrained non-WebGL fallback duration (`~0.9s`).

The fallback exists for reliability/accessibility, not visual parity with the GPU fluid.

## Performance constraints

- Exactly two extra fullscreen source passes per solver frame during `fluidExit`: one velocity, one dye.
- Reuse existing velocity/dye/pressure/divergence render targets.
- No additional large framebuffer allocation.
- No per-frame React state.
- No many-splat loop.
- No new library dependency.
- Continue using existing quality profiles; do not increase solver or dye resolution for exit.

## Testing contract

Source/static contracts must verify:

- EXPLORE has border, minimum 44px height, difference blending, hover lift, active acknowledgement, and wrapper z-index above the reveal canvas.
- `bottomFill` and the analytic sine crest are removed from production reveal code.
- `RevealMode` includes `fluidExit` and exposes `setExitProgress/getExitProgress`.
- the shader suite exports `EXIT_SOURCE_FRAGMENT` and contains no periodic sine/noise exit formula.
- `fluidExit` keeps stepping the fluid solver.
- the timeline selects fluid exit only when normal motion + velocity-capable engine are available.
- reduced motion and engine failure use the DOM fallback.
- the final black completion seal reaches full opacity at progress `1`.

Browser QA must cover desktop, tablet, mobile, touch, reduced motion, forced fallback, and repeated navigation clicks. The main/ribbon state must begin on an already fully black viewport with no flash.

## Acceptance criteria

The change is accepted when:

1. EXPLORE reads immediately as a button but still looks restrained and premium.
2. Hover/focus feedback is subtle and smooth, with no glow or exaggerated scaling.
3. Clicking EXPLORE produces a dense, broad, asymmetric fluid takeover rising from below.
4. The visible front does not look like a periodic wave, ocean, slime, smoke, or flame.
5. The exit reaches fully black before the existing main/ribbon handoff.
6. The current interactive reveal appearance and behavior remain unchanged before the click.
7. Reduced-motion and WebGL fallback remain reliable and intentionally simpler.
