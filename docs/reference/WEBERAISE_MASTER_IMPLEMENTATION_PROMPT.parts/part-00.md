# WEBERAISE — MASTER IMPLEMENTATION PROMPT

## Role

You are the implementation agent for the WEBERAISE agency website.

Your job is not to reinterpret the brand, improvise a generic agency website, or replace approved choreography with easier substitutes. Your job is to turn the existing approved planning into a production-grade implementation with excellent motion quality, high performance, clean architecture, accessibility, responsive behavior, and a codebase that can support the rest of the site without becoming fragile.

Work systematically. Inspect first. Plan second. Prototype risky visual systems in isolation. Integrate only after they are verified. Preserve every locked design decision.

---

# 1. REQUIRED READING — DO THIS BEFORE TOUCHING CODE

Read these files in this order:

1. `WEBERAISE_MASTER_PLANNING.md`
   - canonical source of truth for all approved brand, loader, hero, reveal, Explore transition, do/don't, and motion decisions.
   - later sections / later change-log decisions override stale earlier sections when they conflict.

2. `WEBERAISE_WEBGL_REVEAL_RESEARCH.md`
   - required technical reference for the semi-fluid reveal engine.
   - read the architecture comparisons, Flowmap/history-mask research, persistence, interpolation, age-based healing, performance notes, fallbacks, and prototype matrix.

3. `WEBERAISE_HANDOFF_PROMPT.md`
   - use for broader site direction, homepage narrative, design principles, color tokens, non-hero section intent, and unresolved business/site TODOs.
   - if it conflicts with the newer master planning document, the master planning document wins.

4. Existing homepage skeleton:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `index-local.html`
   - `README.md`
   - `TODO.md`
   Treat this as a layout/content/hierarchy reference, NOT production architecture and NOT a reason to preserve outdated hero implementation placeholders.

5. Approved WEBERAISE logo/wordmark assets.
   - use the finalized horizontal WEBERAISE lockup and approved mark.
   - never recreate the logo approximately in CSS.

Before implementation, make a short conflict list:
- stale decisions in the skeleton/handoff that have been superseded;
- still-unresolved decisions that must remain configurable or TODO;
- assets that are missing.

Do not silently guess unresolved design decisions.

---

# 2. SOURCE-OF-TRUTH PRECEDENCE

When two sources disagree:

1. newest explicit decision in `WEBERAISE_MASTER_PLANNING.md`
2. `WEBERAISE_WEBGL_REVEAL_RESEARCH.md` for technical implementation guidance
3. `WEBERAISE_HANDOFF_PROMPT.md`
4. skeleton files / README / TODO
5. implementation convenience

Implementation convenience NEVER overrides an approved visual requirement.

---

# 3. PRODUCTION ARCHITECTURE

Build the production site as a Next.js App Router + TypeScript application.

Use:
- Next.js App Router
- TypeScript
- React Server Components by default
- client components only where interaction requires them
- CSS / modern layout primitives for normal interface/layout work
- GSAP for authored transition timelines
- GSAP ScrollTrigger for later scroll-linked sections
- OGL or a compact custom WebGL2 layer for the hero reveal after prototype validation
- native scrolling initially
- do NOT add Lenis or another smooth-scroll dependency unless a later section proves it materially improves the experience
- `next/font` for font delivery
- `next/image` for normal responsive imagery outside shader-specific textures
- dynamic imports for heavy client-only modules that do not need to be in the initial JS bundle

Do not ship multiple 3D/WebGL frameworks for one effect.

## Rendering philosophy

Use DOM/CSS for everything that does not genuinely need GPU compositing.

Use WebGL only for:
- interactive viscous reveal mask;
- shared bottom-edge viscous Explore fill if the shared engine is visually/performance superior;
- later signature shader moments explicitly approved by the master plan.

Do not rebuild buttons, ordinary text, section grids, or standard layout in WebGL.

---

# 4. TOP-LEVEL EXPERIENCE STATE MACHINE

The homepage is one route with two experience modes.

Do NOT navigate to a second page when `EXPLORE` is clicked.

Use a small explicit state machine / reducer with approximately these states:

```ts
type ExperienceState =
  | 'boot'
  | 'loading'
  | 'loaderCompletion'
  | 'heroOpening'
  | 'heroInteractive'
  | 'heroExiting'
  | 'main'
```

Rules:
- `loading`: real critical resource loading and countdown.
- `loaderCompletion`: final 0 + line + tagline choreography.
- `heroOpening`: shortened line → rotate → full-height line → twin-line reveal.
- `heroInteractive`: viewport locked, no scroll, viscous reveal active, autonomous intro stroke once, EXPLORE available.
- `heroExiting`: EXPLORE transition running; scroll remains locked.
- `main`: scroll enabled and First Impression is the first natural scroll state.

No race conditions between timelines, pointer input, scrolling, and route state.

Create one orchestrator responsible for state transitions. Do not scatter experience-state mutations across unrelated components.

---

# 5. SUGGESTED FILE / MODULE BOUNDARIES

Use focused modules. Adapt names to repo conventions if needed.

```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css

  components/
    experience/
      ExperienceShell.tsx
      Loader/
        Loader.tsx
        LoaderCountdown.tsx
        LoaderCompletion.tsx
      Hero/
        Hero.tsx
        HeroFrontLayer.tsx
        HeroRevealLayer.tsx
        HeroExploreButton.tsx
        HeroCursor.tsx
      MainSite/
        MainSite.tsx
        FirstImpression.tsx
        SelectedWork.tsx
        Services.tsx
        Audit.tsx
        Philosophy.tsx
        Process.tsx
        Proof.tsx
        Engagement.tsx
        FinalCTA.tsx
        Footer.tsx

  experience/
    state/
      experienceReducer.ts
    loading/
      criticalAssetRegistry.ts
      progressController.ts
    motion/
      loaderTimeline.ts
      heroOpenTimeline.ts
      exploreTimeline.ts
      easing.ts

  webgl/
    reveal/
      RevealEngine.ts
      createRevealEngine.ts
      pointerTracker.ts
      emitters/
        pointerEmitter.ts
        autonomousEmitter.ts
        bottomFillEmitter.ts
      shaders/
        history.vert
        history.frag
        composite.vert
        composite.frag
      quality/
        qualityProfile.ts
        capability.ts

  content/
    homepage.ts

  styles/
    tokens.css
```

Keep the WebGL engine independent from React.
React mounts/configures it; the engine owns pointer samples, frame state, textures, and GPU lifecycle.

---

# 6. PHASE 0 — REPOSITORY AUDIT BEFORE IMPLEMENTATION

Before writing production code:

1. inspect repository structure and git state;
2. identify whether a Next.js app already exists;
3. inspect all existing dependencies;
4. inspect all approved logo/font assets;
5. inspect skeleton and current styles;
6. identify stale hero code/placeholders;
7. create a migration plan rather than layering production code on top of the static prototype;
8. preserve useful content and TODOs;
9. do not invent testimonials, client numbers, projects, pricing, or proof.

If starting a fresh production app is cleaner than mutating the skeleton, preserve the skeleton as reference material rather than forcing it into the production architecture.

---

# 7. PHASE 1 — FOUNDATION

Implement first:

- design tokens;
- font loading;
- global responsive sizing primitives;
- semantic page structure;
- experience state machine;
- scroll lock/unlock utility;
- reduced-motion capability;
- WebGL capability detection;
- critical resource registry;
- production logo assets;
- base accessibility infrastructure.

Do not begin detailed downstream-section animation yet.

---

# 8. REAL LOADER IMPLEMENTATION

