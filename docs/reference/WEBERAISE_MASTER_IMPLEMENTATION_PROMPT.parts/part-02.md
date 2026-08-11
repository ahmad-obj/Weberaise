- no generic SaaS pill aesthetic;
- should visually belong to the composition;
- exact styling can be tuned during visual implementation.

On activation:
- disable competing pointer/reveal interactions cleanly;
- maintain scroll lock;
- begin hero exit state.

---

# 17. EXPLORE / HERO EXIT

Reuse the same reveal-engine family where practical with a new emitter profile.

Emitter mode:
**bottom-edge viscous fill**

Behavior:
1. black viscous material begins along the bottom edge;
2. rises upward like a container filling with thick paint/gel;
3. leading crest is rounded, coherent, mildly organic;
4. low turbulence;
5. only traversed regions become black;
6. no rectangular wipe;
7. no water wave;
8. no splash/bubbles;
9. continues until viewport is fully black.

At completion:
- the black state becomes the real background/foundation of First Impression;
- do NOT reveal a throwaway black screen and then transition again;
- switch to `main`;
- enable normal scrolling only at the safe handoff point.

Prepare main content before click.
No route fetch/reload after EXPLORE.

---

# 18. MAIN-SITE ARCHITECTURE

After EXPLORE, keep the broader skeleton order:

1. First Impression
2. Selected Work
3. What We Do
4. Website Audit
5. Why Weberaise
6. Process
7. Proof
8. Engagement
9. Final CTA
10. Footer

Important:
- current First Impression / downstream composition is still being designed.
- preserve approved/current copy from skeleton where it is still working.
- do not invent missing client work, metrics, testimonials, package pricing, or final sales claims.
- keep explicit TODOs where real business content is absent.

Narrative pacing remains:
**spectacle → silence → work → calm → interaction → calm → final spectacle**

Do not make every section WebGL-heavy.

---

# 19. SCROLL SYSTEM

Use native scrolling unless later visual testing proves a smoothing library is necessary.

Use GSAP ScrollTrigger for:
- authored section reveals;
- pinned/sticky work chapters if approved;
- process progression;
- final signature transition.

Rules:
- do not scroll-jack;
- do not attach expensive layout reads to every scroll event;
- use transforms/opacity/masks for motion;
- clean up all ScrollTriggers in React;
- use responsive configurations;
- avoid animating pinned elements in ways that invalidate ScrollTrigger measurements.

The hero itself is not scroll-driven.

---

# 20. CLIENT / SERVER BOUNDARIES

Keep most of the main website server-renderable.

Client islands should be limited to:
- ExperienceShell / intro state controller;
- loader timeline;
- hero WebGL system;
- custom pointer;
- EXPLORE transition;
- later scroll-motion controllers;
- interactive forms.

Do not mark the entire homepage `'use client'`.

Static copy, semantic section markup, SEO content, and basic cards/lists should remain server-rendered where practical.

---

# 21. FONT / IMAGE / ASSET DELIVERY

Fonts:
- use `next/font`;
- avoid runtime font requests that create layout shifts;
- ensure Inter Tight hero font is available before hero measurement/rendering;
- approved custom WEBERAISE wordmark is an asset, not a substitute font approximation.

Images:
- use `next/image` for normal site images/case studies;
- use exact responsive dimensions/sizes;
- lazy-load below-fold assets;
- only preload true hero-critical resources.

WebGL textures:
- size appropriately;
- do not upload giant source images unnecessarily;
- release GPU resources on teardown.

---

# 22. WEBGL PERFORMANCE RULES

Start with a low-resolution simulation field and upscale smoothly.

Do NOT run the history/flow field at full device resolution.

Initial profiling ranges from research:
- desktop mask field around a few hundred pixels on the short axis;
- lower on mobile;
- clamp pixel ratio;
- use adaptive quality rather than reducing aesthetic quality everywhere.

Keep GPU passes minimal.

Ideal production path is approximately:
1. flow/history update;
2. optional light post-process;
3. final composition.

Avoid a full multi-pass pressure solver unless visual comparison proves it is required.

No shader compilation or FBO allocation hitch on first pointer movement or EXPLORE click.
Warm required GPU resources during real loader initialization.

Pause or reduce work when:
- page is hidden;
- hero is no longer active;
- effect is not visible.

---

# 23. QUALITY PROFILES / FALLBACKS

Implement explicit capability profiles.

### Full
- persistent history
- light flow/advection
- subtle edge deformation
- full compositor

### Lightweight
- persistent trail/history
- no expensive flow pass
- restrained noise/threshold
- same composition concept

### Reduced motion
- preserve readable hero and black/white concept
- remove continuous viscous settling
- simplify loader and reveal choreography without destroying the page structure
- avoid inaccessible interaction requirements

### No WebGL
- hero must still look intentional
- use DOM/CSS fallback reveal/transition
- never present a broken blank canvas.

Do not show users a "your device is weak" message.

---

# 24. PERFORMANCE PHILOSOPHY

The target is **maximum visual quality within a stable frame budget**, not maximum effect complexity.

Never solve performance problems by immediately making the hero visibly low quality.

Order of optimization:
1. remove unnecessary work;
2. reduce offscreen/noncritical work;
3. reduce WebGL simulation resolution;
4. reduce optional passes/noise octaves;
5. adapt update frequency;
6. only then consider visible simplification.

Quality must remain coherent.

No artificial loader duration.
No delayed route fetch after EXPLORE.
No first-interaction hitch.
No giant initial JS bundle just because later sections use effects.

After hero-critical loading is complete, use idle time/background loading to prepare the First Impression/main-site interactive code so EXPLORE remains instant.

---

# 25. ACCESSIBILITY

Required:
- semantic HTML for all meaningful copy;
- hero visual text must have an accessible semantic representation even if WebGL is used for pixels;
- keyboard-operable EXPLORE button;
- visible focus treatment;
- custom cursor never hides focus;
- native pointer behavior on touch;
- reduced motion;
- color contrast checks;
- do not make hidden/revealed content the only way to access essential business information;
- loading status should be accessible without announcing every integer;
- no scroll trap after the intro exits.

---

# 26. RESPONSIVE RULES

Do not treat mobile as scaled-down desktop.

Preserve:
- typography dominance;
- centered front/back registration;
- inverse-color reveal idea;
- brand discovery;
- smooth loader-to-hero handoff;
- Explore gateway.

Adapt:
- font sizes and line breaks;
- reveal radius;
- simulation resolution;
