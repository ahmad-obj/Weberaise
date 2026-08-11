
Before copying exact demo code into production:
- confirm the exact demo's reuse/license terms;
- isolate the reusable technique from demo-specific code;
- prefer licensed upstream foundations where possible.

Use this as a **technique reference**, even if we ultimately implement a lighter custom mask.

---

# 8. OGL FLOWMAP — LEADING SEMI-FLUID CANDIDATE

Repository:
`https://github.com/oframe/ogl`

Official examples:
`https://oframe.github.io/ogl/examples/?src=mouse-flowmap.html`

Flowmap source:
`https://github.com/oframe/ogl/blob/master/src/extras/Flowmap.js`

License:
**Unlicense / public-domain dedication** in the current repository.

## Why OGL Flowmap is extremely relevant

The `Flowmap` helper is a compact ping-pong feedback field designed around pointer movement.

Its source exposes exactly the parameters useful for Weberaise:

```js
size
falloff
alpha
dissipation
mouse
velocity
```

Current source defaults include:

```text
size = 128
falloff = 0.3
alpha = 1
dissipation = 0.98
```

The source explicitly describes higher `dissipation` values closer to `1` as **slower fading**.

The fragment pass:
- samples the previous frame;
- multiplies it by dissipation;
- creates a soft pointer stamp;
- encodes velocity;
- mixes that stamp into the feedback texture.

## This is not full fluid dynamics

That is a benefit here.

It provides:
- memory;
- direction;
- smooth stamps;
- trail;
- feedback;
- lightweight render-target architecture.

It does **not** require a pressure solve.

## How to adapt it for a reveal

Instead of using the flow texture only to distort an image:

1. maintain a scalar reveal/history channel;
2. stamp pointer influence;
3. optionally advect/warp history using flow;
4. blur slightly;
5. add tiny noise at the boundary;
6. threshold using `smoothstep`;
7. use resulting value as the front/back mix mask.

## Weberaise suitability

**Excellent.**

This is currently the strongest foundation for the desired **semi-fluid rather than fully fluid** motion.

---

# 9. PERSISTENT HISTORY MASK — THE MOST IMPORTANT WEBERAISE MODIFICATION

The user wants **more trail left behind**.

A standard flowmap is primarily a movement field. We should add a separate reveal-history texture.

Conceptual update:

```glsl
float previous = texture2D(tHistory, uv).r;
float brush = currentPointerBrush(uv);

// time-corrected decay
float retained = previous * persistence;

// preserve old reveal while adding current brush
float history = max(retained, brush);
```

Then optionally flow/warp it:

```glsl
vec2 flow = texture2D(tFlow, uv).rg;
float warpedHistory =
    texture2D(tHistory, uv - flow * warpStrength).r;
```

Then form an organic mask:

```glsl
float n = fbm(uv * noiseScale + time * noiseSpeed);

float organicField =
    warpedHistory + n * edgeNoiseStrength;

float mask =
    smoothstep(thresholdLow, thresholdHigh, organicField);
```

Finally:

```glsl
vec3 result =
    mix(frontLayer, backLayer, mask);
```

## Why separate history from flow?

This lets us independently tune:

### Motion
How much the trail bends or drifts.

### Persistence
How long the trail remains visible.

### Edge organicity
How irregular the boundary feels.

This is much easier to art-direct than tying everything to one physical density field.

---

# 10. FRAME-RATE-INDEPENDENT PERSISTENCE

Do not use a fixed decay like `previous *= 0.99` without accounting for frame time.

At 120 Hz, that would fade roughly twice as fast in real time as at 60 Hz.

Prefer an exponential time-based decay:

```js
retention = Math.exp(-deltaSeconds / tau)
```

or compute a half-life:

```js
retention = Math.pow(0.5, deltaSeconds / halfLifeSeconds)
```

Suggested starting trail half-life for Weberaise:

```text
Desktop: 2.0 – 3.5 seconds
Mobile: 1.4 – 2.8 seconds
```

This is only the initial tuning range.

If the hero feels too transient:
- increase half-life.

If the whole hero eventually remains revealed:
- reduce half-life or cap accumulation.

---

# 11. TRAIL TEXTURE / CANVAS BRUSH APPROACH

## Drei `TrailTexture`

Docs:
`https://drei.docs.pmnd.rs/loaders/trail-texture-use-trail-texture`

Source:
`https://github.com/pmndrs/drei/blob/master/src/core/TrailTexture.tsx`

License:
**MIT**

The helper produces a `THREE.Texture` containing a pointer trail.

Relevant controls include:
- texture size;
- max age;
- radius;
- intensity;
- interpolation;
- smoothing;
- minimum pointer force;
- blend mode;
- easing.

## Why it matters

This is the simplest high-quality trail generator in the research set.

Pipeline:

```text
pointer
  ↓
2D trail texture
  ↓
shader
  ↓
blur/noise/threshold
  ↓
reveal mask
```

No fluid solver is required.

## Strengths

- cheap;
- stable;
- predictable;
- easy to leave longer trails;
- pointer interpolation already part of the concept;
- excellent low-end/mobile fallback;
- can still look liquid after shader warping.

## Weaknesses

- without extra processing it looks like a painted brush rather than liquid;
- no true velocity field;
- less naturally self-moving after pointer stops.

## Weberaise role

Excellent:
- fallback;
- prototype;
- possibly final if combined with noise + feedback + metaball-like smoothing.

---

# 12. CANVAS TRAIL → FEEDBACK FLUID DIFFUSION

A very relevant modern architecture is demonstrated in:

**Codrops — Building a Dual-Scene Fluid X-Ray Reveal Effect in Three.js**

Article:
`https://tympanus.net/codrops/2026/03/23/building-a-dual-scene-fluid-x-ray-reveal-effect-in-three-js/`

The author provides a WebGPU/TSL version and points to a **WebGL branch** in the project repository.

## Architecture

The tutorial uses:

```text
canvas mouse trail
      ↓
ping-pong fluid/feedback simulation
      ↓
grayscale mask

scene A ─┐
         ├→ final compositor
scene B ─┘
```

This is structurally almost identical to what Weberaise needs.

Important concept:
- input generation is separated from fluid diffusion;
- two visual scenes are separately rendered;
- the final mask chooses what is visible.

## Why it is useful

It proves a modular pattern:

1. input mask;
2. feedback simulation;
