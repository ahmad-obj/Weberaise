## HistoryMask
Responsibilities:
- persistent reveal;
- frame-rate-independent decay;
- accumulation.

## MaskPostProcess
Responsibilities:
- slight flow warp;
- organic edge noise;
- optional low-resolution blur;
- threshold/smoothstep.

## HeroCompositor
Responsibilities:
- blend front/back hero states from one mask;
- remain pixel-synchronized.

## QualityController
Responsibilities:
- select simulation resolution;
- degrade optional passes;
- DPR cap.

## CapabilityFallback
Responsibilities:
- no-WebGL;
- reduced motion;
- low-power/mobile mode.

---

# 48. PROPOSED FRAME LOOP

```text
1. Read latest pointer target.
2. Smooth pointer.
3. Compute velocity.
4. Interpolate missing path samples.
5. Update flowmap texture.
6. Update persistent history mask.
7. Apply optional flow/noise/blur.
8. Composite front/back hero.
9. Render.
```

No DOM reads in this loop.

---

# 49. ORIGINAL SYNTHESIS — RECOMMENDED MASK FORMULA

A useful starting shader concept:

```glsl
// previous persistent reveal
float oldMask =
    texture2D(tHistory, warpedUv).r;

// current interpolated pointer brush
float newBrush =
    brushField(uv, pointer, radius);

// real-time persistence
float retained =
    oldMask * retention;

// merge new reveal with old trail
float history =
    max(retained, newBrush);

// add subtle organic breakup only around edge
float edgeNoise =
    fbm(uv * noiseScale + time * noiseVelocity)
    * noiseAmount;

// form clean reveal boundary
float mask =
    smoothstep(
        thresholdLow,
        thresholdHigh,
        history + edgeNoise
    );

// blend perfectly registered hero states
vec4 outputColor =
    mix(frontHero, backHero, mask);
```

Optional flow:

```glsl
vec2 flow =
    texture2D(tFlow, uv).rg * 2.0 - 1.0;

vec2 warpedUv =
    uv - flow * flowWarp;
```

This is the basic design foundation I recommend prototyping first.

---

# 50. WHY THIS SHOULD LOOK BETTER THAN A GENERIC FLUID DEMO

Because the effect is deliberately constrained.

We are not trying to maximize physics.

We are maximizing:
- shape quality;
- trail continuity;
- reveal readability;
- motion smoothness;
- performance;
- art direction.

A restrained feedback flow with persistent history should look closer to a polished brand interaction than a raw fluid simulator.

---

# 51. EXPERIMENT PLAN FOR LATER IMPLEMENTATION

When we enter development, create one isolated hero-reveal playground first.

Same front/back test content in every variant.

Build:

1. **A — OGL Flowmap + persistent history**
2. **B — History paint + noise**
3. **C — Metaball/SDF trail**
4. **D — Reduced Pavel fluid density mask**

Run side-by-side under:
- slow mouse;
- fast mouse;
- circular motion;
- sharp direction changes;
- idle;
- repeated crossings;
- touch simulation;
- 60 Hz;
- 120 Hz;
- mobile-size viewport.

Choose based on:
- visual quality;
- trail feel;
- stability;
- frame time;
- ease of tuning.

Do not choose based on theoretical complexity.

---

# 52. ACCEPTANCE CRITERIA FOR THE FINAL REVEAL

A candidate is acceptable only if:

- pointer-to-mask latency feels immediate;
- no visible broken trail occurs under fast movement;
- front/back typography remains pixel-aligned;
- trail persists long enough to read as a physical trace;
- trail eventually returns unless permanent mode is explicitly chosen;
- no obvious perfect-circle cursor remains visible;
- overlapping paths merge naturally;
- edge remains crisp enough around large typography;
- no full-screen frame hitch occurs on first interaction;
- desktop target sustains a smooth 60fps experience;
- mobile fallback remains visually intentional;
- resize cannot leave stale/misaligned reveal textures;
- reduced-motion mode works;
- loader successfully warms required assets/pipeline;
- no proprietary site code is copied without permission/license.

---

# 53. DEVELOPMENT PROMPT — FUTURE IMPLEMENTATION AGENT

Use the following as a starting technical brief when implementation begins:

> Build the WEBERAISE hero's two-layer interactive reveal as a GPU-composited, semi-fluid persistent trail. Do not implement a generic full-screen fluid simulation. Treat the effect as a grayscale mask between two perfectly registered hero states. Start with an OGL-style flowmap plus a separate ping-pong history mask. Pointer movement must be interpolated, velocity-aware, frame-rate-independent, and must leave a 2–3 second organic trail. Slightly advect the history using the flow field, apply restrained FBM/noise at the boundary, then create a clean edge using blur/smoothstep. Keep the revealed content itself perfectly sharp. Use low-resolution mask targets independent of display resolution and upscale during composition. Precompile shaders and allocate render targets during the existing real loader. Keep pointer state out of React rendering. Clamp DPR, capability-detect, provide lightweight trail/noise and reduced-motion fallbacks, and profile actual GPU frame time. The effect must never become a cursor spotlight, full fluid demo, watery ripple, smoke field, laggy blur, or chaotic splatter. Do not copy proprietary production code from Nothin' or Lando Norris; use licensed foundations and visual study only. Prototype flowmap-history, paint-history, metaball/SDF, and reduced full-fluid modes before final lock.

---

# 54. REFERENCE INDEX

## Foundation / docs
- NVIDIA GPU Gems — Fast Fluid Dynamics Simulation on the GPU  
  `https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu`

- Three.js WebGLRenderTarget  
  `https://threejs.org/docs/pages/WebGLRenderTarget.html`

- Three.js Render Targets manual  
  `https://threejs.org/manual/en/rendertargets.html`

- MDN WebGLFramebuffer  
  `https://developer.mozilla.org/en-US/docs/Web/API/WebGLFramebuffer`

## Open source / code foundations
- PavelDoGreat WebGL Fluid Simulation  
  `https://github.com/PavelDoGreat/WebGL-Fluid-Simulation`

- OGL  
  `https://github.com/oframe/ogl`

- OGL Flowmap source  
  `https://github.com/oframe/ogl/blob/master/src/extras/Flowmap.js`

- OGL Mouse Flowmap example  
  `https://oframe.github.io/ogl/examples/?src=mouse-flowmap.html`

- Drei TrailTexture  
  `https://drei.docs.pmnd.rs/loaders/trail-texture-use-trail-texture`

- Drei source  
  `https://github.com/pmndrs/drei/blob/master/src/core/TrailTexture.tsx`

## Reveal / shader references
- Ksenia Kondrashova — WebGL liquid masking  
  `https://codepen.io/ksenia-k/pen/dyaeGgO`

- Codrops — Dual-Scene Fluid X-Ray Reveal  
  `https://tympanus.net/codrops/2026/03/23/building-a-dual-scene-fluid-x-ray-reveal-effect-in-three-js/`

- Codrops — Dynamic Image Transitions / SDF reveal  
  `https://tympanus.net/codrops/2025/01/22/webgl-shader-techniques-for-dynamic-image-transitions/`

- Codrops — Drawing 2D Metaballs with WebGL2  
  `https://tympanus.net/codrops/2021/01/19/drawing-2d-metaballs-with-webgl2/`

- Codrops — Interactive Droplet Metaballs  
  `https://tympanus.net/codrops/2025/06/09/how-to-create-interactive-droplet-like-metaballs-with-three-js-and-glsl/`

## Production visual references
- Nothin'  
  `https://www.noth.in/`

- Lando Norris  
  `https://landonorris.com/`

- OFF+BRAND Lando Norris case study  
  `https://www.itsoffbrand.com/our-work/lando-norris`

- Webflow microinteraction study  
  `https://webflow.com/blog/microinteractions`

---

# 55. CURRENT DECISION STATUS

## Locked from user intent
- semi-fluid, not necessarily full physical fluid;
- more trail must remain behind pointer;
- smooth organic reveal;
- front/back hero registration is mandatory;
- performance/optimization is mandatory;
- research proven implementations before coding;
- Nothin' and Lando Norris are important visual references.

## Strong technical recommendation, not yet user-locked
**OGL-style flowmap + independent persistent history mask + restrained edge noise + dual-layer compositor.**

## Still intentionally unresolved
- exact pointer radius;
- exact trail half-life;
- whether trail completely disappears;
- exact edge softness;
- exact noise character;
- whether motion continues after pointer stops;
- final mobile behavior;
- exact implementation framework (OGL vs Three.js);
- final hero-to-next-section transition.

These should be decided from prototypes rather than guessed.

---

# 56. RESEARCH VERDICT

For WEBERAISE, the most important insight is:

> **The effect does not need to simulate more physics to look more premium. It needs better mask memory, better edge shaping, tighter registration, and controlled motion.**

The best design space lies between:
- a static paint mask;
- and a full Navier–Stokes fluid.

That middle ground — **feedback + flow + persistent history + organic thresholding** — is the most direct technical route toward the requested Nothin/Lando-adjacent semi-fluid reveal while preserving the longer trail and performance requirements.
