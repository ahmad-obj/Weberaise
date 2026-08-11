# WEBERAISE — MASTER PLANNING & DESIGN SPEC

**Status:** Active canonical planning document  
**Purpose:** Preserve approved user decisions, preferences, do/don't rules, unresolved references, and implementation intentions so future design/development work continues from a single source of truth.

---

# 0. SOURCE-OF-TRUTH RULES

This document is the canonical running specification for Weberaise planning.

## Working rules
- Every newly approved design decision should be appended here.
- User preferences, explicit do's/don'ts, motion behavior, implementation constraints, and unresolved research/reference links should be recorded.
- During implementation, this document should be checked before making design or engineering decisions.
- Existing approved decisions should not be silently changed.
- Unresolved items should be marked clearly instead of guessed.
- Complex visual effects should be researched against proven/high-quality implementations before rebuilding from scratch where practical.

---

# 1. CURRENT BRAND STATE

## Brand name
**WEBERAISE**

## Logo
- Approved mark is locked.
- Mark concept: angular **W** rising into an upward arrow.
- Primary brand blue: `#3B82F6`
- Glow blue: `#60A5FA`
- Full logo asset pack already created.
- Full updated logo asset pack with approved typography already created.

## Wordmark typography
Approved direction:
- Text: `WEBERAISE`
- Uppercase
- Custom geometric sans direction
- Medium weight
- Moderate tracking
- Premium-tech
- Sharp and restrained
- Not excessively wide
- Subtle customization only; do not over-design
- Mostly sharp corners with slight visual softening
- Primary logo lockup: mark on left + `WEBERAISE` on right

---

# 2. HOMEPAGE HERO — OVERALL DIRECTION

## Reference direction
The homepage hero should take inspiration from the **N' Nothing / noth.in** style of cinematic reveal and visual transition.

The target is not to blindly imitate the whole site. The main inspiration is:
- reveal choreography
- fluid / masking transition quality
- premium minimal motion
- typography + effect integration
- smooth cinematic pacing

## Important implementation principle
For complex reveal effects:
- do not immediately invent an inferior version from scratch;
- first research how polished sites or open-source demos implement similar reveals;
- inspect/reference proven code where legally and technically appropriate;
- adapt rather than blindly copy;
- preserve performance.

## Reserved research field
**Hero reference website:** N' Nothing / noth.in  
**Hero reference code link:** `UNRESOLVED — RESEARCH BEFORE IMPLEMENTATION`  
**Specific hero reveal implementation:** `TO BE DESIGNED NEXT`

---

# 3. PRE-HERO LOADING SEQUENCE — APPROVED SPEC

This is the first completed choreography specification before the hero itself is designed.

## 3.1 Purpose

The loading sequence is not fake decoration.

It has two jobs:

1. Create the first premium visual interaction of the website.
2. Perform real loading of critical website assets so the hero and initial experience are ready when revealed.

The loader should prevent:
- ugly late-loading hero elements;
- delayed high-quality assets;
- visible popping-in;
- poor first-impression performance.

At the same time, it must not become an excuse to preload the entire site.

---

# 4. LOADING ARCHITECTURE

## 4.1 Real progress only

The countdown must be driven by actual loading progress.

Do **not** fake a timer pretending to load.

Potential critical resources include:
- required fonts;
- Weberaise logo assets;
- hero visual assets;
- hero shader/effect dependencies;
- critical JS/modules needed for the first experience;
- immediate above-the-fold imagery;
- any other resource genuinely required before revealing the hero.

## 4.2 Do not preload the entire website

Only critical above-the-fold and hero resources should block the loader.

Everything below the immediate experience should use appropriate:
- lazy loading;
- deferred loading;
- code splitting;
- background loading;
- progressive fetch strategies.

Goal:

> **Maximum perceived speed + full visual quality + no unnecessary browser load.**

---

# 5. COUNTDOWN VISUAL SYSTEM

## 5.1 Base screen

- Full viewport.
- Simple black / near-black screen.
- No visible site UI behind the loader.
- No unnecessary decorative noise.
- Premium minimalism.

## 5.2 Countdown

Sequence:

`100 → 99 → 98 → ... → 2 → 1 → 0`

Typography:
- bold;
- minimal;
- clean;
- geometric;
- highly legible;
- white/off-white unless later visual testing proves another locked brand-compatible value better.

Avoid:
- decorative fonts;
- gimmicky outlines;
- excessive glow;
- unnecessary particles.

---

# 6. RANDOMIZED NUMBER PLACEMENT

## 6.1 Intent

Every countdown number should appear in a different part of the viewport.

Example behavior:
- `100` may be near center;
- `99` may appear toward upper-right;
- `98` may appear lower-left;
- following numbers continue moving across the screen.

The effect should make the countdown feel dynamic and spatial.

## 6.2 Important refinement

The placement should **look random but be art-directed**.

Use constrained / pseudo-random placement rather than uncontrolled randomness.

Rules:
- preserve safe margins;
- never clip digits;
- distribute positions across the screen;
- avoid consecutive numbers appearing almost on top of each other;
- avoid excessive clustering;
- account for actual glyph dimensions;
- adapt independently for desktop/tablet/mobile;
- avoid obviously ugly or accidental-looking positions.

A deterministic pseudo-random sequence is acceptable if it produces a stronger composition.

---

# 7. ZERO-BLANK-FRAME RULE — HARD REQUIREMENT

The screen must **never become completely blank between countdown numbers**.

Example:

Correct:  
`99 visible → 98 enters while 99 exits`

Wrong:  
`99 → blank frame → 98`

This applies even at single-frame level.

Implementation should guarantee visual overlap/cross-transition so at least one countdown number is visible during the handoff.

A subtle crossfade or cut-like replacement is acceptable, but it should remain:
- crisp;
- rhythmic;
- intentional;
- not floaty.

---

# 8. REAL LOADING + EVERY INTEGER — FINAL DECISION

There was a conflict between:
- showing **every integer** from `100` to `0`;
- using **real loading progress**, which may jump unevenly.

## Approved solution: OPTION A

**Every integer is visually shown, while the animation speed dynamically catches up to actual loading progress.**

Meaning:
- actual loader state determines the target progress;
- display logic does not falsely claim completion;
- if real loading jumps ahead, displayed numbers accelerate through the missing integers;
- every number still appears;
- final `0` only occurs once critical loading is genuinely complete.

This gives:
- truthful loading state;
- complete visual countdown;
- no arbitrary skipped digits;
- no fake finish.

This is now **LOCKED**.

---

# 9. FINAL `0`

Unlike previous countdown numbers:

- The final `0` must appear at the **exact visual center of the viewport**.
- Random positioning ends here.
- Choreography becomes precise and symmetrical.
- Hold long enough for the user to register loading completion, but do not create a sluggish pause.

---

# 10. HORIZONTAL LINE REVEAL

Directly below the centered `0`:

A thin white horizontal line begins at zero width.

Animation:

`center → expand simultaneously left and right`

Requirements:
- thin;
- crisp;
- visually centered;
- not thick/chunky;
- smooth premium easing;
- precise geometry;
- no cheap glowing underline treatment unless later explicitly approved.

---

# 11. `0` EXIT + TAGLINE ENTRANCE

The horizontal line should behave as a **mask / visual slit**.

The `0` transitions downward and disappears **behind the line**.

At the same time / immediately afterward:
- the tagline emerges upward from behind the same line.

Conceptual choreography:

```text
      0
────────────
```

becomes:
