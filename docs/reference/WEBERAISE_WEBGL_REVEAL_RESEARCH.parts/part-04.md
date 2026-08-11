
The page is served with Webflow-hosted assets.

## Why it remains our visual reference

The relevant qualities are:
- polished fluid/organic reveal language;
- strong typography;
- controlled premium motion;
- transition effects that feel integrated into the visual system rather than like separate widgets.

## Source-code finding

No official open-source repository for the exact production reveal effect was identified during this research pass.

Therefore:

**Nothin' is a visual benchmark, not our codebase.**

We should approximate its quality using:
- open WebGL foundations;
- our own shader/mask composition;
- profiling and visual tuning.

---

# 28. THREE.JS RENDER-TARGET FOUNDATION

Official docs:
`https://threejs.org/docs/pages/WebGLRenderTarget.html`

Manual:
`https://threejs.org/manual/en/rendertargets.html`

A `WebGLRenderTarget` is a texture the renderer draws into.

For our mask:

```js
const targetA =
    new THREE.WebGLRenderTarget(maskWidth, maskHeight, options);

const targetB =
    new THREE.WebGLRenderTarget(maskWidth, maskHeight, options);
```

Each frame:

```text
read targetA.texture
write targetB
swap
```

This is the standard mechanism behind:
- history masks;
- feedback;
- blur passes;
- advection;
- fluid steps.

---

# 29. NATIVE WEBGL FRAMEBUFFER FOUNDATION

MDN:
`https://developer.mozilla.org/en-US/docs/Web/API/WebGLFramebuffer`

A framebuffer can use a texture as its color attachment and act as an offscreen render destination.

This is the low-level foundation used by libraries such as Three.js and OGL.

For Weberaise, we do not need to implement raw framebuffer management unless:
- custom performance profiling proves library overhead matters;
- we choose a minimal native WebGL solution.

OGL is already low-abstraction enough for this effect.

---

# 30. LIBRARY CHOICE: OGL VS THREE.JS

## OGL

Best when:
- effect is a focused full-screen shader;
- we want very little abstraction;
- small bundle impact matters;
- custom shaders are the primary feature.

Advantages:
- tiny architecture;
- built-in `Flowmap`;
- public-domain/unlicensed current source;
- very suitable for a single hero canvas.

## Three.js

Best when:
- project already uses Three;
- multiple render targets/post-processing are planned;
- richer ecosystem is helpful;
- React Three Fiber integration is desired.

Advantages:
- mature render-target APIs;
- massive ecosystem;
- Drei TrailTexture;
- strong examples;
- easy future expansion.

## Current recommendation

If Weberaise does **not** otherwise need Three.js in the hero:

> Start with **OGL or a compact custom WebGL implementation**.

If the site already adopts Three.js for other major effects:

> Reuse Three.js rather than shipping two WebGL frameworks.

---

# 31. REACT / NEXT.JS INTEGRATION PRINCIPLE

Do not let React rerender on every pointer move.

Pointer data should live in:
- refs;
- shader uniforms;
- typed arrays;
- mutable simulation state.

Bad:

```js
setMouse({ x, y });
```

on every `pointermove`.

Better:

```js
pointerRef.current.set(x, y);
```

Then the animation loop reads it.

React should manage:
- mount/unmount;
- layout state;
- feature capability;
- overall hero lifecycle.

WebGL loop manages:
- pointer field;
- mask feedback;
- uniforms;
- render targets.

---

# 32. PERFORMANCE ARCHITECTURE

## Separate display resolution from simulation resolution

The mask does not need to run at full screen pixel resolution.

Example starting points:

### Desktop
```text
display: native CSS viewport
mask simulation: 384×384 or aspect-correct equivalent
```

### Mobile
```text
mask simulation: 192×192 – 256×256
```

The final mask is sampled smoothly and upscaled.

## Avoid full-resolution blur

Blur the low-resolution mask, not the final hero.

## Clamp DPR

Do not blindly render at `devicePixelRatio = 3` or `4`.

Starting rule:

```js
pixelRatio = Math.min(window.devicePixelRatio, 1.5);
```

Possibly allow `2` on capable desktop devices after profiling.

## Reduce passes

Preferred semi-fluid pipeline may need only:

1. flow/history update;
2. optional blur;
3. final composite.

A full fluid solver can require many more.

---

# 33. GPU WARM-UP DURING THE REAL LOADER

The existing Weberaise loader is real, not fake.

Use it to initialize the hero system.

Loader can perform:
- import/load WebGL module;
- create WebGL context;
- compile shader programs;
- allocate render targets;
- load/rasterize hero textures;
- load fonts;
- run one hidden warm-up frame if needed.

Then `0` is reached only after the critical hero system is ready.

Important:
Do not spend multiple seconds intentionally delaying a fast GPU.

The loader reflects actual readiness.

---

# 34. FIRST-INTERACTION HITCH PREVENTION

Potential first-frame costs:
- shader compilation;
- texture upload;
- FBO allocation;
- font rasterization;
- pipeline initialization.

These should happen before interactive hero reveal is exposed.

Three.js users should consider current async compilation APIs where appropriate rather than assuming legacy preload helpers remove all shader hitches.

---

# 35. LOW-END / MOBILE FALLBACK STRATEGY

Use tiers.

## Tier 1 — Full experience
Desktop / capable GPU:
- feedback history;
- flowmap;
- noise;
- optional blur;
- compositor.

## Tier 2 — Lightweight semi-fluid
Moderate mobile:
- history trail texture;
- no velocity advection;
- noise/threshold;
- compositor.

## Tier 3 — Minimal
Weak/unsupported GPU:
- CSS/SVG soft blob or simple masked sweep;
- preserve black/white layer concept;
- no full simulation.

## Reduced motion
`prefers-reduced-motion: reduce`:
- avoid continuous fluid motion;
- either static soft reveal or minimal pointer mask;
- no autonomous drifting.

The brand idea survives even when physics are removed.

---

# 36. TOUCH DESIGN

Do not simply disable the effect on phones.

Possible mobile mode:

- touch-drag paints/reveals the hidden layer;
- wider radius than desktop;
- longer interpolation;
- reduced simulation resolution;
- lower flow strength;
- shorter trail half-life to avoid covering the entire viewport too quickly.

Touch pointer input should use the same normalized coordinate system as desktop.
