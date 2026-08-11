3. two target visuals;
4. final composition.

We can retain the architecture while simplifying the fluid pass.

## Weberaise modification

Instead of fast fading:
- use a longer history;
- reduce diffusion;
- keep a semi-fluid edge;
- keep revealed regions stable enough to leave a readable trail.

---

# 13. SDF BLOB REVEALS

Reference:
**Codrops — WebGL Shader Techniques for Dynamic Image Transitions**

`https://tympanus.net/codrops/2025/01/22/webgl-shader-techniques-for-dynamic-image-transitions/`

The tutorial demonstrates:
- circle SDFs;
- wavy/noisy boundaries;
- multiple circles;
- smooth merging;
- texture reveal.

## Core idea

A pointer history can be represented as a chain of circles.

For each history sample:

```glsl
float d = distance(uv, point[i]) - radius[i];
```

Combine with a smooth-min function.

Result:
- nearby circles merge into a continuous blob;
- no fluid simulation required;
- boundary can be warped with procedural noise.

## Why this is a great alternative

It gives "fluid-looking" geometry without fluid physics.

The trail can be:
- persistent;
- exact;
- deterministic;
- velocity-sensitive;
- easy to art-direct.

## Potential issue

Large arrays of pointer samples evaluated directly in a fragment shader can become expensive.

Solutions:
- limit history points;
- rasterize points into a low-res mask texture;
- use feedback texture rather than evaluating all points forever;
- spatially decimate samples.

---

# 14. 2D METABALL FIELD

Reference:
**Codrops — Drawing 2D Metaballs with WebGL2**

`https://tympanus.net/codrops/2021/01/19/drawing-2d-metaballs-with-webgl2/`

Metaballs are another strong fit.

A simple field can be conceptualized as:

```glsl
field += radiusSquared /
         (dx * dx + dy * dy + epsilon);
```

Then:

```glsl
mask = smoothstep(lowThreshold, highThreshold, field);
```

As points approach each other:
- their fields merge;
- the resulting boundary becomes liquid-like.

## Weberaise usage

Pointer trail samples become metaball centers.

Each sample stores:
- position;
- radius;
- age;
- strength.

Radius/strength can be influenced by pointer velocity.

## Strengths

- naturally blobby;
- trail merging looks good;
- controllable;
- no pressure simulation;
- easy to retain old points.

## Weaknesses

- too many live samples = shader cost;
- may look "bubbly" rather than viscous if circles are too obvious;
- requires careful spacing/interpolation.

---

# 15. 3D / RAYMARCHED METABALLS

Reference:
**Codrops — Interactive Droplet-like Metaballs with Three.js and GLSL**

`https://tympanus.net/codrops/2025/06/09/how-to-create-interactive-droplet-like-metaballs-with-three-js-and-glsl/`

This is useful for understanding smooth implicit blending, but **not recommended** as the primary Weberaise mask.

Why:
- raymarching a 3D implicit field is unnecessary for a flat hero reveal;
- we only need a 2D screen-space mask.

Use it for visual inspiration, not architecture.

---

# 16. NOISE / DOMAIN-WARP REVEAL

A reveal does not need fluid dynamics to feel organic.

A simple mask can be modified by:
- FBM noise;
- simplex/perlin-style noise;
- sine/cosine perturbation;
- curl-noise-derived UV offset;
- domain warping.

Example conceptual edge:

```glsl
float base = historyMask;
float noise = fbm(uv * 4.0 + time * 0.08);

float mask =
    smoothstep(
        0.42,
        0.58,
        base + noise * 0.08
    );
```

## Good use

Keep noise mainly around the **edge**.

Do not distort the whole revealed area.

We want:
- an organic boundary;
- stable typography;
- no watery wobble over already revealed text.

---

# 17. FLOWMAP + NOISE HYBRID — RECOMMENDED MODE

This is the current strongest candidate.

Pipeline:

```text
pointer events
   ↓
interpolated brush stamps
   ↓
flowmap velocity feedback
   ↓
persistent history feedback
   ↓
small flow-driven UV advection
   ↓
small FBM/noise edge warp
   ↓
blur + smoothstep
   ↓
final reveal mask
   ↓
front/back hero compositor
```

## Character

Think:

- viscous ink;
- soft liquid paint;
- restrained gel smear;
- not splashing water;
- not smoke;
- not a circular flashlight.

## Starting visual behavior

- pointer core leaves a wide soft stamp;
- faster movement stretches flow in movement direction;
- old trail remains for ~2–3 seconds;
- boundary slowly relaxes;
- only subtle drift after pointer stops;
- old trail does not aggressively swirl away;
- overlapping paths merge.

---

# 18. PERSISTENT PAINT MODE

This is the most controllable alternative.

No advection.

```text
pointer stamp
   ↓
feedback accumulation
   ↓
blur
   ↓
noise edge
   ↓
mask
```

History:

```glsl
history =
    max(previous * retention, brush);
```

## Result

Looks like:
- organic paint;
- soft liquid brush;
- persistent reveal.

## Pros

- very fast;
- extremely reliable;
- no chaotic movement;
- strongest control over trail lifetime.

## Cons

- less "alive" than flowmap;
- needs noise/warp to avoid feeling like a digital brush.

## Fit

Very strong fallback and potentially strong final mode if Nothin-like motion is subtle.

---

# 19. VISCOUS SMEAR MODE

Use flowmap but very little autonomous fluid motion.

```text
brush
  ↓
flowmap
  ↓
history sampled with slight flow offset
  ↓
mask
```

Recommended visual direction:
- medium-large brush;
- moderate flow influence;
- high persistence;
- very low turbulence.

This is likely the closest conceptual description of **semi-fluid reveal with trail left behind**.

---
