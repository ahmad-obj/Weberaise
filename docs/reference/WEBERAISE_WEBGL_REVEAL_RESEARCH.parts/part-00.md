# WEBERAISE — WebGL Fluid / Blob Reveal Research Dossier

**Status:** Research reference / technical foundation  
**Date:** 2026-08-11  
**Project:** WEBERAISE homepage hero  
**Scope:** WebGL fluid, semi-fluid, blob, trail, masking, dual-layer reveal, feedback-buffer, flowmap, metaball and SDF approaches.  
**Primary design target:** A **semi-fluid reveal with a persistent trail**, not a full-screen free-running fluid simulation.

---

# 1. RESEARCH BRIEF

This document exists separately from `WEBERAISE_MASTER_PLANNING.md` so the implementation phase has a dedicated technical reference for the hero reveal.

The requested effect is **not** "put a water simulation on the page."

The target is:

- two perfectly registered hero states;
- a front state and a hidden inverse-color state;
- the hidden state is exposed by an organic cursor/touch-driven mask;
- the mask should feel **semi-fluid / blobby / viscous**;
- it should leave a **meaningful trail behind the pointer**, rather than behave like a small flashlight following the cursor;
- trail shape should merge smoothly with itself;
- the reveal should feel designed, not physically chaotic;
- motion must remain stable, clean and performant;
- implementation should be based on proven WebGL techniques and reusable open-source foundations where licensing permits;
- public production websites are references for behavior, not automatically reusable source code.

The research therefore compares **multiple families of implementations**, from full GPU Navier–Stokes to lightweight feedback masks and metaballs.

---

# 2. EXECUTIVE CONCLUSION

## Best fit for WEBERAISE

The strongest architecture for the current design is **not a full Pavel-style fluid simulation by itself**.

The recommended direction is a hybrid:

> **Pointer history → low-resolution persistent mask → flowmap / light advection → subtle organic noise → blur/threshold → dual-layer compositor**

This gives the desired qualities:

- persistent trail;
- blob merging;
- soft semi-fluid edge behavior;
- controlled motion;
- far less GPU work than a full pressure-projected fluid solver;
- easy tuning between "paint trail", "liquid smear", "ink", and "soft viscous blob";
- deterministic enough to art-direct;
- practical mobile fallback;
- easy to preserve the reveal for 1–4 seconds instead of having it instantly vanish.

### Why not use full Navier–Stokes as the default?

A full fluid solver is excellent when the fluid itself is the visual subject. For WEBERAISE, the fluid is only the **mask boundary** between two hero layers.

Full simulation introduces:

- velocity advection;
- pressure solve;
- divergence;
- curl/vorticity;
- multiple framebuffer passes;
- more tuning complexity;
- more opportunity for unstable visual noise;
- extra mobile GPU cost.

We can borrow the good part — **organic motion and feedback** — without simulating an entire physical fluid field.

---

# 3. DESIGN INTENT — HARD REQUIREMENTS

## Desired visual behavior

The final hero-reveal system should be capable of the following:

1. Reveal hidden content exactly where the interactive mask has reached.
2. Keep the reveal alive behind the pointer long enough to read as a trail.
3. Merge new and old trail segments naturally.
4. Avoid a perfect circular cursor spotlight.
5. Avoid overly turbulent smoke-like behavior.
6. Avoid watery waves that distract from the typography.
7. Allow controlled edge distortion/noise.
8. Stay perfectly registered with the front hero typography.
9. Respond smoothly to fast and slow pointer movement.
10. Interpolate between sparse pointer events so fast motion never creates broken dotted gaps.
11. Support pointer and touch.
12. Degrade gracefully on weak hardware.
13. Precompile/setup GPU resources during the real loader where practical, so first interaction does not hitch.
14. Never reveal pixels the mask has not reached.
15. Never let WebGL masking and visible hero content drift out of alignment during resize.

---

# 4. IMPORTANT TERMINOLOGY

## Mask
A grayscale texture used to choose between two visual states.

Typical convention:

- `0.0` = front layer;
- `1.0` = hidden/reveal layer;
- intermediate values = soft transition edge.

Conceptual compositor:

```glsl
vec3 finalColor = mix(frontColor, backColor, mask);
```

## Render target / framebuffer
A texture that the GPU can render into instead of directly rendering to the screen.

This is fundamental to:
- feedback effects;
- flowmaps;
- fluid simulation;
- post-processing;
- mask accumulation.

Three.js exposes this through `WebGLRenderTarget`. Native WebGL uses framebuffers with texture attachments.

## Ping-pong rendering
Two render targets are alternated:

```text
frame N:
read A → process → write B

frame N+1:
read B → process → write A
```

A texture generally cannot safely be read and written as the same render destination in the same pass. Ping-pong feedback solves this.

## Feedback mask
The current frame reads the previous frame's mask and adds/warps/fades new input.

This is the single most useful primitive for a long-lived WEBERAISE trail.

## Flowmap
A texture containing local directional/velocity information deposited by pointer movement. It can distort UVs or drive another mask.

## Advection
Move/transport a texture quantity according to a velocity field.

## Dissipation / decay
How quickly previous mask/velocity values disappear.

## SDF
Signed Distance Field. A mathematical field representing distance to a shape boundary. Very useful for smooth circles, blobs, masks and procedural merging.

## Metaballs
Multiple implicit blobs whose fields merge into a continuous organic shape. Very useful for cursor histories because sequential points can merge into one liquid-looking trail.

---

# 5. FOUNDATION: GPU FLUID SIMULATION

## 5.1 NVIDIA GPU Gems — foundational fluid model

Reference:
`https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu`

The classic GPU fluid approach is based on a 2D velocity field and repeated GPU texture operations.

A typical stable-fluid pipeline contains:

1. apply external pointer force;
2. advect velocity;
3. calculate curl/vorticity;
4. calculate divergence;
5. solve pressure through iterative passes;
6. subtract pressure gradient;
7. advect dye/density.

This is why realistic fluid simulations require many framebuffer passes.

### Relevance to Weberaise

Useful knowledge:
- how feedback textures work;
- how velocity moves a field;
- how dye can act as a mask;
- how dissipation determines persistence;
- how a low-resolution grid can still look smooth when composited.

Not required for Weberaise:
- maximum physical correctness;
- highly accurate pressure solve;
- elaborate vortices;
- free-surface water physics.

---

# 6. PAVEL DOBRYAKOV — FULL WEBGL FLUID

Repository:
`https://github.com/PavelDoGreat/WebGL-Fluid-Simulation`

Demo:
`https://paveldogreat.github.io/WebGL-Fluid-Simulation/`

License:
**MIT**

## Why it matters

This is one of the best-known practical browser GPU fluid implementations and a strong reference for production-friendly WebGL fluid passes.

The project uses render targets for fields such as:
- velocity;
- density/dye;
- pressure;
- divergence;
- curl.

Common configuration concepts include:
- simulation resolution;
- dye resolution;
- density dissipation;
- velocity dissipation;
- pressure iterations;
- curl amount;
- splat radius.

## Possible Weberaise mode

Use the **dye/density field as the reveal mask**:

```text
pointer splat
    ↓
fluid velocity + advection
    ↓
density field
    ↓
smooth threshold
    ↓
mix(frontHero, backHero, densityMask)
```

## Strengths

- most physically fluid;
- naturally swirls and merges;
- proven WebGL architecture;
- extensive reference value;
- MIT license.

## Weaknesses for our use

- more GPU passes than necessary;
- can become too "fluid simulation demo";
- trail tends to move/swirl away unless carefully controlled;
- pressure/curl can make typography reveal feel noisy;
- expensive compared with a simple feedback mask.

## Best use in this project

**Reference / high-realism variant**, not the first implementation candidate.

If used:
- lower pressure iteration count only after visual validation;
- lower sim resolution;
- decouple reveal persistence from velocity;
- keep velocity subtle;
- use density as mask, not as colorful fluid;
- constrain curl.

---

# 7. KSENIA KONDRASHOVA — WEBGL LIQUID MASKING

Original demo:
`https://codepen.io/ksenia-k/pen/dyaeGgO`

This demonstration is important because it applies fluid-like simulation to **masking/revealing visual content**, which is much closer to Weberaise than a standalone colored fluid canvas.

## Concept

Instead of treating fluid density as the final visual, treat it as:

```text
fluid output → grayscale reveal mask → underlying visual
```

## Why it is relevant

It establishes that:
- Pavel-style fluid can be repurposed into a reveal mask;
- content can be uncovered by pointer-driven liquid behavior;
- masking is a separate concern from fluid color rendering.

## Caution
