# Weberaise Signature Intro Architecture

## Design goal

The intro is treated as one coordinated experience rather than a collection of independent animations. The homepage stays on one route and moves through an explicit state machine:

```text
boot
→ loading
→ loaderCompletion
→ heroOpening
→ heroInteractive
→ heroExiting
→ main
```

Scrolling is locked until `main`.

## Separation of responsibilities

### React / DOM

Owns:
- semantic content;
- layout;
- accessibility;
- experience state;
- lifecycle of intro components;
- the normal scrollable website.

The whole page is not a WebGL scene. Normal content stays normal HTML/CSS.

### GSAP

Owns finite authored choreography:
- loader completion;
- line contraction/rotation;
- twin-line opening;
- EXPLORE transition progress.

It does not own pointer sampling or the WebGL render loop.

### WebGL2 reveal engine

Owns only the signature mask system:
- low-resolution ping-pong history field;
- interpolated input samples;
- light directional advection;
- subtle settling;
- time-correct persistence/healing;
- reveal compositing;
- bottom-edge black fill mode.

It intentionally does **not** run a full pressure-projected fluid simulation. The desired effect is a controlled viscous paint/blob trail, not water.

## Hero composition

The visual hero uses one shared `HeroTypography` structure for front and hidden states so `WELCOME / TO` cannot drift between layers.

Front state:
- white background;
- black typography;
- empty lower brand slot.

Reveal state:
- black background;
- white identical typography;
- approved horizontal WEBERAISE lockup in the lower brand slot.

The DOM remains the semantic/a11y source. The WebGL canvas operates as the per-pixel reveal layer rather than rasterizing the whole website.

## Why the canvas uses difference compositing

The normal hero remains crisp DOM text. The WebGL canvas uses difference blending to reconstruct the inverse black/white state only inside the reveal mask. A viewport-aligned brand texture supplies the approved blue/white lockup inside the hidden brand slot.

This avoids rendering large hero typography into a canvas while preserving exact DOM font/layout quality.

## Reveal engine data flow

```text
Pointer / autonomous stroke
        ↓
PointerTracker interpolation + bounded velocity
        ↓
RevealSample[]
        ↓
low-res history framebuffer A/B
        ↓
retention + restrained advection + settling
        ↓
thresholded reveal mask
        ↓
viewport compositor
```

The same engine changes mode for EXPLORE:

```text
bottom-fill progress
→ mildly irregular viscous crest
→ solid black coverage
→ main state
```

## Persistent trail behavior

Production tuning is intentionally controlled:
- normal desktop radius ≈ `0.105` normalized viewport height;
- wider coarse/small-screen radius ≈ `0.135`;
- low-resolution mask profile rather than full-screen simulation resolution;
- perceptual trail persistence tuned to the approved ~3–4 second experience;
- oldest mask energy decays first;
- slight residual motion continues after pointer stops;
- no strong curl, ripple, splash, smoke, or wide diffusion.

The one-time autonomous stroke uses the same `RevealSample` pipeline and is deliberately short enough to expose roughly two wordmark letters.

## Loading architecture

`criticalAssetRegistry` tracks only hero-critical readiness. The loader does not pretend to measure progress and does not block on unrelated below-fold content.

The visible count always traverses every integer while catching up to the real readiness target. `0` is gated by actual critical completion.

## Performance strategy

- simulation resolution is independent of display resolution;
- DPR is capped by quality profile;
- no React state update on pointer movement;
- no DOM layout reads inside the WebGL RAF loop;
- shader/framebuffer warm-up is part of critical readiness;
- heavy work stops with hero lifecycle;
- fallbacks are explicit rather than allowing a weak device to stutter;
- First Impression/main content is already mounted before EXPLORE handoff.

## Fallback strategy

If the full WebGL path cannot initialize:
- the site remains usable;
- the hidden hero can use a restrained CSS reveal fallback;
- EXPLORE has a CSS black-fill fallback;
- reduced-motion users keep the semantic sequence with shortened/simplified movement.

The design intent is preserved without showing an error or blank canvas.

## Downstream site boundary

Current main-section order is preserved:

1. First Impression
2. Selected Work
3. What We Do
4. Website Audit
5. Why Weberaise
6. Process
7. Proof
8. Engagement
9. Final CTA / contact

These sections are deliberately not over-animated yet. The next design phase begins with First Impression.
