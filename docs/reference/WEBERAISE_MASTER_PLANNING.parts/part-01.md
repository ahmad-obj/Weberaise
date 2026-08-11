
```text
   TAGLINE
────────────
```

Important:
- do not reduce this to simple fade-out/fade-in;
- the objects should feel like they physically pass behind the line;
- masking/clipping/reveal behavior is the key visual idea.

---

# 12. TAGLINE HOLD

Working timing:
- approximately **2–3 seconds**.

This is not yet a hard millisecond value.  
Final duration should be tuned by motion testing.

During the hold:
- no competing animation should steal attention;
- keep the screen composed and premium.

---

# 13. TAGLINE EXIT

The tagline reverses the entrance logic:

- moves downward;
- disappears behind the horizontal line.

Again:
- not a plain opacity fade;
- maintain the slit/mask illusion.

---

# 14. LINE COLLAPSE

After the tagline disappears:

The line reverses its opening motion:

`full width → collapses inward toward center → disappears`

Requirements:
- same motion/easing family as expansion;
- symmetrical;
- smooth;
- no awkward end-frame;
- no blank pause before hero begins.

---

# 15. HANDOFF INTO HERO

The end of the loader transitions directly into the Weberaise hero reveal.

The exact hero sequence is **intentionally unresolved** and will be designed in the next planning phase.

Do not implement an arbitrary hero entrance before that design is approved.

Current unresolved items:
- exact WEBERAISE text entrance;
- whether mark, wordmark, or headline reveals first;
- hero shader / fluid reveal treatment;
- headline choreography;
- CTA entrance;
- relationship between loader line collapse and hero reveal;
- mobile-specific adaptation.

---

# 16. HARD DON'TS — LOADER

Do not:
- use fake loading progress;
- leave a blank frame between countdown numbers;
- use uncontrolled random positioning;
- clip numbers;
- let mobile layouts break;
- use a thick horizontal line;
- use cheap fade-only tagline transitions;
- preload the entire website;
- sacrifice quality purely to improve benchmark numbers;
- create excessive browser load;
- use unnecessary particles/glow/noise;
- allow frame drops during the loader;
- create an awkward pause between loader and hero;
- independently redesign approved choreography during development.

---

# 17. PERFORMANCE TARGET

Desired experience:
- no perceptible lag;
- no stuttering;
- no delayed hero resources;
- no visible quality downgrade;
- no wasteful preload;
- maximum practical responsiveness while keeping the intended premium visual quality.

Implementation should prioritize:
- critical-path resource budgeting;
- preload only where justified;
- async/deferred loading for noncritical code;
- responsive asset sizing;
- GPU-friendly animation properties;
- efficient shader/effect implementation;
- reduced work on low-capability devices where necessary without destroying the visual identity;
- careful mobile testing.

---

# 18. NEXT DESIGN PHASE

**Next:** Design the complete transition from the end of the loader into the final Weberaise hero.

Start from:

1. Line collapses to center.
2. Loader state ends.
3. Hero reveal begins.
4. Define the exact appearance/order of:
   - WEBERAISE;
   - approved logo mark;
   - hero headline;
   - hero visual/effect;
   - CTA(s);
   - navbar;
   - background/reveal system.
5. Research N' Nothing / noth.in or comparable perfected reveal implementations before final implementation planning.

---

# 19. CHANGE LOG

## 2026-08-11
- Created canonical Weberaise planning document.
- Recorded locked brand/logo/wordmark direction.
- Recorded complete pre-hero loading-sequence specification.
- Locked real-loading behavior.
- Locked countdown option **A**: show every integer while dynamically catching up to true loading progress.
- Reserved unresolved hero reference/code fields for later research.

---

# 20. LOADER → HERO TRANSITION — APPROVED DIRECTION

**Status:** Approved design direction; exact timings/easing values remain for motion prototyping.

This transition begins immediately after the loader tagline exits behind the horizontal line.

## 20.1 Horizontal line does NOT fully disappear

The previously specified horizontal line begins its inward collapse, but **does not collapse all the way to zero width**.

Instead:
- it contracts smoothly toward the center;
- stops at a deliberate short length;
- remains perfectly centered;
- there must be no visual snap, pause glitch, or abrupt change of velocity.

The retained short line becomes the transition object that opens the hero.

## 20.2 Rotation into vertical orientation

The shortened horizontal line then rotates **90 degrees** into a vertical orientation.

Requirements:
- rotation must be smooth and continuous;
- pivot should remain visually centered;
- no sudden axis jump;
- no irregular easing between collapse and rotation;
- collapse → stop → rotation should feel like one choreographed motion system rather than separate animations pasted together.

## 20.3 Vertical expansion

After reaching the vertical orientation, the line expands vertically until it spans the viewport height.

Animation concept:

`short vertical line at center → full-height vertical line`

Requirements:
- expansion occurs smoothly from its center/controlled origin;
- line remains thin and crisp;
- no change in visual thickness during scale;
- no stuttering or layout-driven animation;
- use GPU-friendly motion/transform strategy where practical.

## 20.4 Duplication into twin reveal boundaries

Once the full-height centered line is established, it visually becomes **two identical vertical lines**.

These two lines act as the moving boundaries of the hero reveal.

Initial state conceptually:

```text
             ||
             ||
             ||
```

The pair then moves apart horizontally:

```text
       |           |
       |  REVEAL   |
       |           |
```

and continues until both lines travel beyond the left and right edges of the viewport.

## 20.5 Strict traversal-based reveal

The hero must only become visible in the region the moving lines have actually opened.

This is a **spatial mask reveal**, not a global fade.

At any frame:
- region between the two outward-moving lines = hero revealed;
- region outside those lines = loader/front black state still covering the hero;
- as the lines move outward, the revealed window grows continuously;
- when the lines leave the viewport, the full hero is visible.

Hard requirement:

> **Do not reveal hero pixels before the reveal boundaries have traversed them.**

The visual geometry of the opening must match the actual mask geometry exactly.

## 20.6 Loader-to-hero transition motion quality

Hard DON'Ts:
- no abrupt motion;
- no snapping between line states;
- no irregular speed changes;
- no visible mask mismatch;
- no frame drops;
- no laggy reveal;
- no botchy/stair-stepped opening edge;
- no late hero rendering after the mask has already passed;
- no opacity shortcut that reveals the entire hero underneath;
- no DOM layout animation that causes reflow/jank if a transform/clip/WebGL solution can avoid it.

Performance requirement:
- the hero must already be render-ready because the real loader has loaded its critical assets;
- reveal implementation must be optimized independently as well;
- the mask should remain smooth on practical mobile and desktop targets;
- exact implementation mechanism should be selected after testing performance and visual fidelity.

---

# 21. HERO SECTION — TWO-LAYER CORE LAYOUT

**Scope note:** This section defines only the hero's core visual composition. Navbar, buttons/CTAs, downstream homepage sections, scroll handoff, and the full fluid interaction choreography are intentionally outside this specification for now.

The hero consists of **two perfectly registered visual layers**:

1. **Front / default layer**
2. **Behind / reveal layer**

The behind layer will later be exposed using a fluid-like reveal effect inspired by the Nothin' website. Exact fluid interaction behavior will be specified separately.

---

# 22. FRONT HERO LAYER

## 22.1 Color system

Front/default hero layer:
- background: **white**;
- typography: **black**.

The visual should feel:
- bold;
- modern;
- minimal;
- premium;
- typography-led.

## 22.2 Main typography

Large two-line headline:

```text
WELCOME
TO
```

Exact casing can be finalized during typography prototyping, but the intended wording/layout is:
- `Welcome` on the first line;
- `To` directly below it.

