The loader is real.

## Critical registry

Build a registry of resources that genuinely block the hero experience:

Examples:
- hero font(s);
- approved logo/wordmark resources needed in hero;
- shader source/module;
- WebGL context/engine initialization;
- render-target allocation;
- hero back-layer resources;
- GPU warm-up / shader compilation where practical.

Do NOT block on:
- Selected Work images below the fold;
- footer;
- unrelated main-site modules;
- analytics;
- noncritical decorative assets.

## Countdown

Visual sequence:
`100 → 99 → ... → 1 → 0`

Interpretation:
- 100 = critical experience not ready;
- 0 = critical experience genuinely ready.

Real progress determines the target.
Displayed count must still show every integer.

If loading jumps:
- accelerate the display through intermediate integers;
- never skip an integer;
- never show `0` before true readiness;
- never add an artificial minimum wait merely to prolong the animation.

## Positioning

Use seeded / art-directed pseudo-random positions:
- safe viewport margins;
- no clipping;
- no repetitive clustering;
- responsive for mobile/desktop;
- final `0` exactly centered.

Guarantee no blank frame between consecutive numbers.

Do not make screen readers announce 101 rapidly changing numbers.
Provide a stable accessible loading status separately.

---

# 9. LOADER COMPLETION CHOREOGRAPHY

Implement exactly from the master plan:

1. final `0` centered;
2. thin white horizontal line grows from center;
3. `0` passes downward behind line;
4. tagline emerges upward from same masked line;
5. tagline holds for approved working duration;
6. tagline exits downward behind line;
7. line contracts but DOES NOT disappear;
8. line stops at a short centered length;
9. smoothly rotates 90°;
10. expands to full viewport height;
11. duplicates into twin vertical lines;
12. twin lines move outward;
13. hero is revealed only in the area physically traversed between them;
14. when both lines leave viewport, hero is fully exposed.

No global opacity shortcut.

Use transforms / clip or GPU masks that remain exact and cheap.
Do not animate layout properties when transform/mask solutions are available.

---

# 10. HERO VISUAL LAYOUT

Implement the locked two-layer hero.

## Front layer
- white background;
- black typography;
- centered composition;
- `WELCOME`
- `TO`
- deliberate empty brand slot below;
- typography: Inter Tight, heavy/800 direction;
- very large with controlled breathing room.

## Reveal layer
- black background;
- white `WELCOME / TO`;
- exact same size/position/line-height/tracking as front;
- approved horizontal WEBERAISE mark + wordmark in lower brand slot;
- hidden lockup is huge, visually near the width of `WELCOME`.

Both layers must use one shared layout model.
Never separately eyeball their positions.

Exact registration is a hard acceptance criterion.

---

# 11. WEBGL REVEAL ENGINE — PROTOTYPE BEFORE FINAL INTEGRATION

Do not immediately commit to a generic full fluid simulation.

The research's leading architecture is:

```text
pointer/autonomous samples
→ low-resolution persistent history mask
→ lightweight flow/advection
→ restrained organic edge deformation
→ age-based healing
→ dual-layer composite
```

## Prototype playground

Before final hero integration, create an isolated dev playground with the SAME hero test layout and compare:

A. OGL Flowmap + persistent history  
B. Persistent paint/history + noise  
C. Metaball/SDF trail  
D. Reduced full-fluid density mask only if needed

Evaluate:
- slow pointer;
- fast pointer;
- sudden direction changes;
- overlapping strokes;
- idle settling;
- 60Hz;
- high-refresh displays;
- mobile-sized viewport;
- weak-GPU profile.

The production build should keep only:
- the winning engine;
- the intentional fallback.

Delete unused experimental engines or keep them outside production bundles.

## Default candidate

Start with A:
**Flowmap + independent persistent history mask**.

Reason:
- trail control;
- viscosity without full fluid chaos;
- low/moderate GPU cost;
- controllable edge behavior;
- shared emitter architecture for cursor/autonomous/Explore modes.

---

# 12. LOCKED REVEAL CHARACTER

The effect is NOT water.

It is:

> a thick, rounded, high-viscosity paint/blob reveal attached to the pointer path.

Hard behavior:
- reveal footprint roughly 1/2–2/3 of hero type height per normal pass;
- trail perceptually persists around 3–4 seconds;
- oldest areas heal first;
- overlapping strokes merge cleanly;
- after pointer stops, existing material continues subtle viscous settling;
- no full freeze;
- no screen-wide autonomous motion;
- no watery ripple;
- no splash;
- no smoke;
- no strong curl/vortex;
- no fast outward diffusion;
- no perfect circular flashlight;
- no tiny reveal requiring frantic mouse movement;
- no blurry typography;
- only pixels actually reached by the mask reveal the back layer.

Use time-based decay so trail lifetime is consistent across refresh rates.

Interpolate pointer samples so fast movement never creates dotted gaps.

---

# 13. AUTONOMOUS INTRO STROKE

After the twin hero-opening lines fully exit the viewport:

- start with the hero visually intact;
- inject ONE synthetic stroke into the exact same reveal input pipeline;
- path: short curved/diagonal motion in the middle-lower area;
- size: small enough to expose roughly 1–2 letters / part of the hidden WEBERAISE lockup;
- use identical viscosity, radius logic, persistence, settling, and healing as real pointer input;
- run once per hero entrance;
- do not loop;
- do not create a separate animation engine for it.

This stroke demonstrates interactivity without instruction text.

---

# 14. CURSOR

Desktop/fine pointer:
- tiny restrained custom dot;
- reveal radius is much larger than dot;
- dot must remain visible over both light and dark mask states;
- no oversized cursor ring.

Touch/coarse pointer:
- keep native touch behavior;
- do not emulate a fake mouse cursor.

Pointer state must remain outside React render state.
No `setState` on each `pointermove`.

---

# 15. HERO SCROLL RULE

While in `heroInteractive`:
- page/viewport is locked;
- normal scrolling does not advance the homepage;
- hero is an intentional intro state;
- EXPLORE is the gateway to the main scroll experience.

Do not implement the old skeleton's scroll-out hero behavior.

---

# 16. EXPLORE BUTTON

Add a minimal `EXPLORE` control below the main composition near the bottom of the viewport.

Button:
- premium;
- minimal;
