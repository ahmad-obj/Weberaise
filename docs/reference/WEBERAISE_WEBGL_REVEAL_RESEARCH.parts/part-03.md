
# 20. FULL-FLUID INK MODE

Use a reduced Pavel-style fluid simulation.

Controls:
- low/moderate curl;
- high density persistence;
- low velocity persistence if we want the reveal to settle;
- mask-specific accumulation.

This is the premium/high-cost mode.

Use only if visual comparison shows the flowmap hybrid cannot achieve the needed organic behavior.

---

# 21. VELOCITY-REACTIVE REVEAL

Pointer velocity should influence the reveal, but subtly.

Possible mappings:

### Radius
Slow pointer:
- slightly wider, rounder pool.

Fast pointer:
- slightly narrower or elongated trail.

### Force
Fast pointer:
- stronger directional flow.

### Edge noise
Do **not** make noise amplitude strongly velocity-reactive. That can create ugly jagged splashes.

Suggested velocity use:

```text
velocity → directional flow strength
velocity → limited radius variation
velocity → limited trail opacity/intensity
```

Clamp everything.

---

# 22. INTERPOLATION — CRITICAL FOR SMOOTH TRAILS

Browser pointer events are not guaranteed to arrive every visual pixel.

Fast mouse movement can produce:

```text
●      ●      ●
```

instead of a continuous path.

We must interpolate between samples.

Algorithm:

```js
const distance = length(current - previous);
const steps = ceil(distance / maxStampSpacing);

for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    stamp(lerp(previous, current, t));
}
```

This prevents:
- dotted masks;
- broken trails;
- reveal holes.

Use coalesced pointer events where available, but still retain interpolation.

---

# 23. MASK EDGE DESIGN

The edge makes or breaks the effect.

## Too hard
Feels like:
- clip-path;
- vector mask;
- cursor spotlight.

## Too soft
Feels:
- blurry;
- low-resolution;
- muddy.

## Recommended

Use:
1. low-res organic field;
2. optional blur;
3. `smoothstep` threshold.

Concept:

```glsl
float mask =
    smoothstep(0.46, 0.58, organicField);
```

Tune until:
- center is fully revealed;
- boundary has a narrow soft gradient;
- text remains crisp inside revealed area.

Important:
**The content itself should not be blurred. Only the mask edge may be soft.**

---

# 24. DUAL-LAYER COMPOSITING OPTIONS

The Weberaise hero has two perfectly registered layers.

There are several implementation choices.

## Option A — Full WebGL compositor

Render both hero visual states to textures/targets, then:

```glsl
mix(frontTexture, backTexture, mask)
```

### Pros
- perfect per-pixel reveal;
- single synchronized compositor;
- no DOM clipping mismatch;
- easiest place to apply mask.

### Cons
- typography must be rendered into WebGL/canvas correctly;
- accessibility needs semantic DOM companion;
- responsive type layout needs careful synchronization.

### Technical quality
**Highest.**

---

## Option B — DOM front + WebGL hidden-layer overlay

Keep front hero in DOM.

Render the black/white hidden hero state in a transparent WebGL canvas placed above it, with alpha controlled by the reveal mask.

Concept:

```glsl
hiddenHeroRGBA.a *= mask;
```

### Pros
- front text stays native DOM;
- only hidden state requires GPU rendering;
- WebGL naturally overlays only revealed pixels.

### Cons
- hidden typography must line up exactly with DOM;
- font metrics must be synchronized;
- resize handling becomes critical.

### Technical quality
**Very strong if registration is solved carefully.**

---

## Option C — both states as synchronized canvas renderings + semantic DOM

Use the same layout data to draw front/back states, so registration is guaranteed.

Keep an accessibility/SEO DOM structure underneath or visually hidden.

### Pros
- exact visual registration;
- easy GPU composition.

### Cons
- more custom text rendering;
- selection/accessibility requires semantic duplicate.

---

## Option D — CSS clip/mask without WebGL

Possible for simplified fallback but not ideal for the main semi-fluid interaction.

Useful for:
- reduced motion;
- unsupported WebGL;
- extremely low-end devices.

---

# 25. TYPOGRAPHY REGISTRATION STRATEGY

This matters specifically because `WELCOME / TO` must be exactly aligned between front and back layers.

Do not independently position two separate implementations by eye.

Recommended:
- one layout model defines all hero geometry;
- both layers consume the same values;
- resize updates both in one transaction;
- use loaded font metrics;
- wait for `document.fonts.ready` before GPU raster setup.

Possible model:

```ts
type HeroLayout = {
  welcomeX: number
  welcomeY: number
  toX: number
  toY: number
  fontSize: number
  lineHeight: number
  brandSlot: DOMRect
}
```

A single measurement pass produces these values.

---

# 26. SITE STUDY — LANDO NORRIS

Production site:
`https://landonorris.com/`

Official creator case study:
`https://www.itsoffbrand.com/our-work/lando-norris`

Webflow official microinteraction feature:
`https://webflow.com/blog/microinteractions`

## Confirmed public information

OFF+BRAND's case study lists:
- Webflow;
- development;
- WebGL;
- 3D;
- Rive;
- motion.

Webflow's own article describes the opening interaction as a cursor/drag-driven reveal that exposes or covers Lando's face with splashes of helmet imagery.

The effect is an important behavioral reference because:
- it is pointer-local;
- it has organic masking;
- it reveals a second visual state underneath;
- the mask reads as blobs/splashes rather than a geometric circle.

## What was NOT established

The exact production shader/source architecture is **not publicly documented in the official materials reviewed**.

Do not claim:
- it definitely uses Pavel fluid;
- it definitely uses OGL Flowmap;
- it definitely uses metaballs;
- we possess the production source.

Those would be guesses.

## Legal / reuse note

Lando's published Terms state its site content is owned/licensed and restrict automated scraping without permission.

Therefore:
- use the site as visual/behavioral research;
- do not wholesale copy proprietary production code;
- use licensed open-source implementations for our actual foundation.

---

# 27. SITE STUDY — NOTHIN'

Production site:
`https://www.noth.in/`

The live site publicly credits:
- Pierre Patrault;
- Thomas Carré;
- Guillaume Perrette for visuals.
