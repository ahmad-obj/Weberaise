# EXPLORE CTA + Fluid Exit Design

## Context

The interactive hero reveal now uses a persistent pressure-projected WebGL2 fluid simulation. The previous EXPLORE affordance and exit transition predated that material system:

- EXPLORE was visually light: small transparent text plus a short rule, rendered below the reveal compositor.
- The exit used `bottomFill`, which stopped fluid simulation and drew a black analytic crest in the composite shader using two sine waves.
- That made the final interaction feel disconnected from the fluid reveal that preceded it.

This change makes EXPLORE clearly actionable while keeping the hero restrained, then makes the exit feel like the same digital material expanding from the bottom of the viewport.

## Goals

1. Make EXPLORE obviously clickable without turning it into a loud SaaS CTA.
2. Preserve the existing typography, monochrome palette, hero composition, navigation, and interaction hierarchy.
3. Replace the analytic sine-wave bottom fill with a real solver-driven fluid flood.
4. Reuse the existing velocity, dye, advection, divergence, pressure, and gradient passes rather than adding a separate animation engine.
5. Preserve the user's already-visible fluid state when EXPLORE is pressed so the takeover reads as one continuous material.
6. Keep the hero-to-main handoff fully black and seamless.
7. Preserve a simple, reliable fallback for reduced motion and WebGL failure.

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

The control remains visually stable when disabled during `heroExiting`; the GSAP exit timeline owns its disappearance.

## Fluid flood exit contract

### Mode

Replace `RevealMode = 'bottomFill'` with:

```ts
RevealMode = 'reveal' | 'fluidExit' | 'disabled'
```

The public exit API is:

```ts
setExitProgress(progress: number): void
getExitProgress(): number
```

`setExitProgress` clamps to `[0, 1]` and is the single timeline-controlled driver for the transition.

### Continuity rule

Pressing EXPLORE must **not** call `engine.clear()`.

The fluid already created by the user's pointer/autonomous interaction remains alive when the mode changes from `reveal` to `fluidExit`. Pointer deposition stops, but existing dye and residual velocity continue into the takeover.

This avoids a visual reset and makes the exit read as the same material expanding rather than a second unrelated animation.

### Solver lifecycle

In `fluidExit` mode the engine continues running the same pressure-projected simulation. Each frame:

1. Apply one fullscreen velocity-drive pass.
2. Apply one fullscreen bottom dye-source pass.
3. Advect velocity.
4. Advect dye.
5. Compute divergence.
6. Solve pressure using the quality profile's existing iteration count.
7. Subtract the pressure gradient.
8. Composite the thresholded dye as black over the hero.

No pointer splats run during exit.

### Exit source

`EXIT_SOURCE_FRAGMENT` is a single fullscreen program reused for the velocity target and dye target.

The two logical source behaviors deliberately differ:

- **Dye:** material is continuously supplied only near the bottom of solver space, around the bottom `14%`, producing a genuine bottom-origin flood.
- **Velocity:** a smooth bounded target field exists across the simulation domain so the supplied dye can actually be transported toward the top.

A bottom-band-only velocity source was rejected during real solver reproduction because dye rose only to roughly the source band's height and stalled. A per-frame additive velocity source was also rejected because retained velocity accumulated too aggressively.

The production velocity source therefore **drives toward** a target rather than adding a full target velocity every RAF:

```glsl
vec3 velocityTarget = vec3(lateralProfile, upward, 0.0);
float velocityDrive = mix(0.18, 0.26, drive);
vec3 velocityDriven = mix(base, velocityTarget, velocityDrive);
```

The target field uses four broad Gaussian horizontal profiles. Two deterministic profile arrangements are blended monotonically with exit progress:

```text
centers  ≈ 0.15, 0.38, 0.64, 0.88
widths   ≈ 0.18–0.24 UV
```

This creates a few broad asymmetric shoulders without a repeating wavelength. There is no `sin`, periodic crest, FBM, simplex, or hash noise.

Current exit-only configuration:

```text
sourceBandTop    0.14
dyeStrength      0.24
velocityBase     4.2
velocityPeak     8.0
lateralStrength  0.45
sealStart        0.9997
```

Existing interactive reveal retention, pressure iterations, threshold, gain, solver resolution, and pointer behavior remain unchanged.

### Composite

`COMPOSITE_FRAGMENT` has two explicit behaviors:

- `reveal`: existing difference-composite using thresholded dye and registered brand texture.
- `fluidExit`: threshold the solver dye using the same `revealGain`, `edgeSoftness`, and `edgeWidth`, then render `vec4(0, 0, 0, alpha)` with normal canvas blending.

The old `uTime`-driven sine crest and `uFillProgress/uFillEnabled` analytic fill are removed.

A final global seal exists only as a last-frame reliability guard:

```glsl
float seal = smoothstep(uExitSealStart, 1.0, uExitProgress);
float alpha = max(fluidMask, seal);
```

`uExitSealStart` is `0.9997`. It does not define the visible moving front. Real solver verification showed the dye naturally reaches the top before this seal materially contributes; the seal only guarantees that microscopic residual pinholes cannot expose the hero during the React state handoff.

### Canvas compositing

- `reveal` keeps `mix-blend-mode: difference`.
- `fluidExit` uses `mix-blend-mode: normal` because the canvas directly paints the black takeover.
- `disabled` remains invisible.

## Timeline contract

`runExploreTimeline` keeps responsibility for orchestration and navigation handoff.

On click:

1. Fade/lift the EXPLORE wrapper away over approximately `0.20s`.
2. For normal motion with a velocity-capable engine:
   - keep current dye/velocity state;
   - `engine.setExitProgress(0)`;
   - `engine.setMode('fluidExit')`;
   - animate progress `0 → 1` over `1.60s` with `power2.inOut`;
   - call `engine.setExitProgress(...)` on each update.
3. Hold the fully black frame for approximately `0.06s` before the existing `onComplete` handoff.

The visible spatial character comes from transported solver dye, not from a moving CSS/GLSL waveform.

## Verification-driven refinement

The initial paper design used a bottom-restricted velocity source and an early `0.94` completion seal. Real WebGL solver reproduction rejected that version:

- bottom-restricted velocity did not transport dye through the viewport;
- an additive source accumulated velocity too aggressively;
- a `0.94` seal would globally darken the viewport before the solver front naturally finished its travel.

The production design was therefore refined to:

- full-domain bounded velocity drive;
- bottom-only dye supply;
- four broad progress-morphing Gaussian profiles;
- `velocityPeak: 8.0`;
- `lateralStrength: 0.45`;
- `sealStart: 0.9997`.

A real 256/512 WebGL2 reproduction using 20 pressure iterations and production retention/threshold values showed approximately:

```text
~0.80s  44.26% thresholded coverage
~1.20s  75.56% thresholded coverage
~1.40s  91.76% coverage, front near top
~1.47s  96.54% coverage, top reached
~1.60s  99.91% coverage before final seal completion
```

The run completed with `gl.getError() === 0`.

## Reduced motion and WebGL fallback

Do not run the velocity-driven fluid exit when:

- `reducedMotion === true`, or
- no `RevealEngine` exists, or
- the selected quality profile has `enableVelocity === false`.

In those cases:

- disable the reveal canvas if an engine exists;
- use `.hero-exit-fill` as a plain black bottom-up rectangle;
- use approximately `0.24s` for reduced motion and `0.9s` for non-WebGL fallback.

The fallback has no rounded/organic top and does not pretend to be fluid.

## Performance constraints

- Exactly two extra fullscreen source writes per solver frame during `fluidExit`: one velocity target, one dye source.
- Reuse existing velocity/dye/pressure/divergence render targets.
- No additional large framebuffer allocation.
- No per-frame React state.
- No many-splat loop.
- No new library dependency.
- Continue using existing quality profiles; do not increase solver or dye resolution for exit.

## Testing contract

Source/static contracts verify:

- EXPLORE has border, minimum 44px height, difference blending, hover lift, active acknowledgement, and wrapper z-index above the reveal canvas.
- `bottomFill` and the analytic sine crest are removed from production reveal code.
- `RevealMode` includes `fluidExit` and exposes `setExitProgress/getExitProgress`.
- the shader suite exports `EXIT_SOURCE_FRAGMENT` and contains no periodic sine/noise exit formula.
- `fluidExit` keeps stepping the existing fluid solver.
- the timeline preserves current fluid state instead of calling `engine.clear()`.
- the timeline selects fluid exit only when normal motion + velocity-capable engine are available.
- reduced motion and engine failure use the DOM fallback.
- the completion seal reaches full opacity at progress `1` but begins only at `0.9997`.

Browser QA still needs to cover desktop, tablet, mobile, touch, reduced motion, forced fallback, and repeated navigation clicks on a complete project checkout. The main/ribbon state must begin on an already fully black viewport with no flash.

## Acceptance criteria

The change is accepted when:

1. EXPLORE reads immediately as a button but remains restrained and premium.
2. Hover/focus feedback is subtle and smooth, with no glow or exaggerated scaling.
3. Clicking EXPLORE produces a dense, broad, asymmetric fluid takeover rising from below.
4. Existing revealed material continues naturally into the exit rather than resetting.
5. The visible front does not look like a periodic wave, ocean, slime, smoke, or flame.
6. Solver dye reaches the top before the last-frame safety seal meaningfully contributes.
7. The exit is fully black before the existing main/ribbon handoff.
8. The current interactive reveal appearance and behavior remain unchanged before the click.
9. Reduced-motion and WebGL fallback remain reliable and intentionally simpler.
