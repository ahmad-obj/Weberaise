
---

# 37. IDLE BEHAVIOR MODES

We need to choose this later, but the engine should support multiple modes.

## Mode 1 — Decay
Trail fades away after pointer passes.

## Mode 2 — Slow decay
Recommended starting mode.

Trail remains for several seconds, then gently returns.

## Mode 3 — Permanent accumulation
Anything revealed remains revealed until hero reset.

Probably not recommended because the hidden layer would eventually replace the whole hero.

## Mode 4 — Partial floor
Trail fades to a low residual value but not completely.

Can create a subtle history of interaction.

## Mode 5 — Auto-clearing after inactivity
Trail persists while interacting, then clears after a delay.

Potentially elegant.

---

# 38. DIFFERENT VISUAL MODES TO PROTOTYPE

The research suggests we should prototype at least these four modes side-by-side before locking implementation.

## Prototype A — Viscous Flow Trail **(recommended)**
- flowmap;
- persistent history;
- small edge noise;
- slow decay;
- limited drift.

Target:
Nothin/Lando-adjacent premium organic mask without full fluid chaos.

## Prototype B — Organic Paint
- persistent brush history;
- blur;
- SDF/noise edge;
- no flow.

Target:
cleaner, calmer, most performant.

## Prototype C — Metaball Trail
- pointer history points;
- smooth field merging;
- noise;
- age decay.

Target:
visibly blobby / more playful.

## Prototype D — Reduced Full Fluid
- Pavel-like density mask;
- modest curl;
- low-resolution pressure solve;
- long density lifetime.

Target:
most physically fluid.

---

# 39. TECHNIQUE COMPARISON MATRIX

| Technique | Fluidity | Trail control | GPU cost | Determinism | Mobile fit | Weberaise fit |
|---|---:|---:|---:|---:|---:|---:|
| Full Navier–Stokes fluid | 10/10 | 6/10 | High | Medium | Medium | 7/10 |
| OGL Flowmap + history | 8/10 | 10/10 | Low–Medium | High | High | **10/10** |
| TrailTexture + shader | 5/10 | 10/10 | Low | Very high | Very high | 9/10 |
| SDF circle chain | 6/10 | 10/10 | Low–Medium | Very high | High | 8.5/10 |
| 2D metaballs | 8/10 | 9/10 | Medium | High | High | 9/10 |
| Noise-only cursor blob | 5/10 | 7/10 | Very low | Very high | Very high | 7.5/10 |
| 3D raymarched metaballs | 10/10 visual depth | 7/10 | High | Medium | Low | 4/10 |
| CSS/SVG fallback | 2–4/10 | 7/10 | Very low | Very high | Very high | fallback only |

---

# 40. RECOMMENDED STARTING PARAMETERS

These are **prototype values**, not locked art direction.

## Mask / simulation
```text
Desktop mask resolution: 384 px short-axis target
Mobile mask resolution: 192–256 px
DPR cap: 1.5 initially
```

## Trail
```text
desktop half-life: ~2.2–3.2 s
mobile half-life: ~1.6–2.5 s
```

## Brush
```text
radius: ~8–14% of short viewport dimension
falloff: soft but not blurry
input alpha: 0.7–1.0
```

## Flow
```text
flow strength: low–medium
autonomous drift after stop: very low
curl/turbulence: minimal
```

## Noise
```text
edge UV amplitude: ~0.005–0.025
noise speed: slow
noise scale: medium
```

## Edge
```text
smoothstep band: narrow
fully revealed center: 1.0
fully hidden outside: 0.0
```

---

# 41. DYNAMIC QUALITY SCALING

Quality can change without altering layout.

Measure moving average frame time.

Concept:

```text
if GPU frame time remains high:
    reduce mask resolution
    disable secondary blur pass
    reduce noise octaves
    reduce flow update frequency
```

Do not:
- suddenly change trail radius;
- visibly change visual style;
- hard-toggle effects mid-interaction.

Quality shifts should be subtle and preferably occur before interaction begins.

---

# 42. DO'S — TECHNICAL

- Use one normalized screen coordinate system.
- Use pointer interpolation.
- Use a low-resolution simulation mask.
- Use ping-pong textures for feedback.
- Use time-based decay.
- Keep mask and color composition separate.
- Precompile shaders during loader.
- Reinitialize/render targets safely on resize.
- Keep WebGL pointer state outside React render state.
- Pause/update less when page is hidden.
- Stop animation loop when hero is far offscreen unless persistence is needed.
- Profile real mobile hardware.
- Clamp DPR.
- Use capability detection.
- Keep DOM/layout reads out of the frame loop.
- Measure layout only on initial ready/resize/font-ready.
- Use the same hero geometry source for front/back registration.
- Keep content crisp; distort the mask, not the typography.
- Provide reduced-motion fallback.
- Confirm licenses before copying third-party implementation code.

---

# 43. DON'TS — TECHNICAL

- Do not run a full 1024/2048 fluid simulation for a cursor mask.
- Do not run dozens of pressure iterations unless the visual result proves they are necessary.
- Do not use a fixed per-frame decay that changes with monitor refresh rate.
- Do not upload large new textures every pointer event.
- Do not call React `setState` for every pointer sample.
- Do not perform DOM rasterization every frame.
- Do not blur the full-resolution hero.
- Do not make the reveal mask and the hero use different coordinate systems.
- Do not create two independent animations that can drift out of sync.
- Do not let pointer gaps form dotted trails.
- Do not let noise destroy the edge silhouette.
- Do not use strong fluid turbulence around large typography.
- Do not force full-quality fluid on weak phones.
- Do not introduce first-interaction shader compilation.
- Do not copy proprietary production code just because a browser downloaded it.
- Do not claim a reference site's exact implementation unless verified by official/public source.

---

# 44. DON'TS — VISUAL

- No "flashlight circle".
- No obvious perfect circular cursor.
- No chaotic rainbow fluid.
- No water-ripple effect over text.
- No smoke simulation covering the composition.
- No goo that stretches excessively across the entire viewport.
- No immediate trail disappearance.
- No trail so permanent that the hidden hero inevitably takes over the whole screen.
- No irregular frame-to-frame edge popping.
- No low-resolution staircase edge.
- No blur over the actual letters.
- No lag between pointer and reveal.
- No mask that outruns the cursor by a large amount.
- No autonomous movement strong enough to feel disconnected from user input.
- No generic CodePen look left unrefined.

---

# 45. SOURCE / LICENSING TABLE

| Reference | Role | License / reuse status |
|---|---|---|
| NVIDIA GPU Gems Ch. 38 | Fluid theory / GPU architecture | Documentation/reference |
| Pavel WebGL Fluid Simulation | Full fluid implementation | MIT |
| OGL | Minimal WebGL + Flowmap | Current repo: Unlicense/public domain dedication |
| Drei TrailTexture | Pointer trail texture | MIT |
| Ksenia WebGL Liquid Masking | Masking technique reference | Verify exact demo terms before copying |
| Codrops Dual-Scene Fluid X-Ray | Modern dual-scene architecture | Use tutorial/repo per exact demo license |
| Codrops SDF Image Transition | SDF/noise/merge technique | Use tutorial/repo per exact demo license |
| Lando Norris production site | Visual behavior reference | Proprietary production content; do not copy wholesale |
| Nothin' production site | Visual behavior reference | No open production repo located; treat as reference |

---

# 46. RESEARCH CONFIDENCE LEVELS

## High confidence / direct source
- OGL Flowmap source behavior and parameters.
- OGL licensing.
- Pavel repository and MIT license.
- NVIDIA fluid foundation.
- Three.js render target behavior.
- Drei TrailTexture controls and MIT license.
- Codrops authors' own described demo architectures.
- OFF+BRAND's stated Lando production services/stack capabilities.
- Webflow's description of the Lando cursor reveal.
- Nothin' live-site credits.

## Inference / not verified
- Exact shader implementation used by Lando Norris.
- Exact reveal algorithm used by Nothin'.
- Whether either production site uses Pavel, OGL Flowmap, TrailTexture, or metaballs internally.

These should **not** be stated as facts during development.

---

# 47. PROPOSED WEBERAISE ENGINE ARCHITECTURE

Recommended modules:

```text
HeroRevealController
├── PointerTracker
├── TrailInput
├── FlowField
├── HistoryMask
├── MaskPostProcess
├── HeroCompositor
├── QualityController
└── CapabilityFallback
```

## PointerTracker
Responsibilities:
- normalized pointer/touch coordinates;
- velocity;
- smoothing;
- interpolation input.

## TrailInput
Responsibilities:
- produce brush samples;
- radius/force;
- pointer history.

## FlowField
Responsibilities:
- lightweight OGL-style directional feedback;
- no full pressure solver.
