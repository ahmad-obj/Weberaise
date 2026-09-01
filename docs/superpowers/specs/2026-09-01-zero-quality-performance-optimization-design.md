# Zero-Quality Performance Optimization Design

## Goal

Improve WEBERAISE load, parse, hydration, runtime CPU/GPU efficiency, repeat-load behavior, and deployment/static footprint without changing any visible design, motion behavior, typography, image pixels, interaction timing, WebGL material, layout, copy, or accessibility/SEO content.

The governing rule is strict:

> An optimization is shippable only when the same user action produces the same visible result and timing contract as before. Performance gains must come from doing unnecessary work later, less often, or not at all — never from lowering quality.

## Current Baseline Architecture

The homepage starts in `boot`, moves through `loading`, `loaderCompletion`, `heroOpening`, `heroInteractive`, `heroExiting`, then `main` via `src/experience/state/experienceReducer.ts`.

`src/components/experience/ExperienceShell.tsx` is the top-level homepage client boundary. It currently statically imports `Hero`, while the loader separately performs a dynamic `hero-code` critical task that imports and warms `createRevealEngine`. Because `HeroRevealCanvas.tsx` statically imports `createRevealEngine`, the static `Hero` import can pull reveal code into the initial client graph before the loader's explicit prewarm is useful.

The post-EXPLORE narrative is present from the first homepage render. `JourneyNarrative.tsx` is a client component and statically imports ribbon geometry/controller modules plus `ShutterText`; `ShutterText` imports Framer Motion. Those modules are not needed while the user is watching the loader or interacting with the hero.

The current animation systems already contain several good safeguards:

- Hero reveal skips hidden-tab fluid work.
- Silk Waves only animates near its target area and while the page is visible.
- DriftWall stops outside its viewport margin.
- WorkSphere pauses when the document is hidden and pauses media when stopped.

Those protections stay intact.

## Non-Negotiable Fidelity Constraints

The optimization pass must not change any of the following:

1. Hero fluid quality profiles or material constants, including FULL `simResolution=256`, `dyeResolution=512`, `pressureIterations=20`, `dprCap=2`, current dissipation, splat radius/force, reveal gain, edge softness, and edge width.
2. Loader countdown progression, zero hold, loader completion choreography, hero opening choreography, EXPLORE exit choreography, GSAP eases, durations, or sequencing.
3. WebGL shader equations, blend modes, fluid solver pass order, WorkSphere mesh/shader output, Silk shader output, or DriftWall visual motion.
4. Typography family, weight, size, line height, letter spacing, or font-display behavior for any font that is actually used.
5. Artwork decoded pixels. Lossy image conversion is forbidden in this pass.
6. DOM copy, metadata, semantic content, accessibility labels, navigation behavior, or searchable/SEO content.
7. Existing reduced-motion behavior.
8. Existing fallbacks for unsupported WebGL/capability failures.
9. Any CSS values that control layout or visual appearance unless a later measured optimization proves a change is mathematically/visually identical and receives its own explicit review.
10. React/Next/GSAP/Framer package versions during this pass. Dependency upgrades are out of scope.

## Optimization Strategy

### 1. Establish measurable before/after evidence

Use the production build, Next.js 16.3's built-in Turbopack bundle analyzer (`next experimental-analyze --output`), and a Chrome DevTools Protocol capture script based on the repository's existing `scripts/capture-journey-qa.mjs` approach.

Capture at minimum:

- build success and route output;
- client bundle/module graph for `/`, `/services`, `/work`, `/about`;
- transferred/decoded resource bytes before `heroInteractive` and before `main`;
- resource names loaded in each phase;
- navigation timing and long-task count;
- fixed screenshots at loader, heroInteractive, post-EXPLORE, services tail, and Work sphere checkpoints;
- WorkSphere render/update counters during movement and a settled interval.

The same capture procedure must be run before and after every major optimization group.

### 2. Split the Hero from the initial homepage client graph

Replace the static `Hero` import in `ExperienceShell.tsx` with a `next/dynamic` import. The loader's existing `hero-code` task must preload both the `Hero` module and reveal engine, then warm the engine before declaring that critical task complete.

This changes when JavaScript is fetched/parsed, not what the hero renders. The hero must already be loaded before `LOADER_COMPLETE` can transition to `heroOpening`; therefore there is no loading fallback visible between loader and hero.

No Hero component, shader, CSS, timeline, or quality-profile implementation changes belong in this task.

### 3. Defer post-EXPLORE heavy runtime code while preloading it during the Hero

Keep the post-EXPLORE markup/content contract intact, but stop statically pulling expensive behavior modules into the earliest homepage execution path.

Create one small runtime loader module that owns dynamic imports for:

- `buildJourneyPath`;
- `ribbonController`;
- `journeyRoute`;
- `questionReveal`;
- `ShutterText` / its Framer Motion dependency.

`ExperienceShell` should trigger this preload after the hero becomes interactive. `JourneyNarrative` should consume the already-cached runtime only when the main experience starts. This uses the several-second hero interaction window as non-critical preparation time.

The rule is that EXPLORE choreography may never wait on a network request. The runtime must be warmed before it is needed; verification under throttled network conditions is mandatory. If that invariant cannot be met without changing user-visible timing, the relevant sub-optimization is not shipped.

### 4. Remove only proven-unused font work

The root layout currently registers Geist, Geist Mono, and Inter Tight. The source tree must first be mechanically scanned for `--font-technical`/`Geist_Mono` use.

If and only if no production source uses the technical font variable, remove Geist Mono from `layout.tsx` and its root class variable. Keep Geist and Inter Tight unchanged. Keep `document.fonts.ready` unless measurements prove another change is safe; changing the loader's font readiness semantics is not required for this pass.

### 5. Remove non-runtime master artwork from the public deployment tree

`public/artwork/journey/source/` contains source/master PNG files, while runtime components reference `public/artwork/journey/display/`. After an exact source-reference scan proves that the source directory is not addressed at runtime, move the master files outside `public` into documentation/reference storage.

This reduces deploy/static footprint without changing any runtime URL or image.

### 6. Losslessly compress runtime PNGs

Run a lossless PNG optimizer only on `public/artwork/journey/display/Q1/*.png` and `public/artwork/journey/display/Q2/*.png`.

Before/after decoded pixels must compare with absolute error `0`. Dimensions and alpha must be unchanged. If any file fails exact-pixel verification, restore it and do not ship that asset change.

Do not convert to lossy WebP/AVIF/JPEG and do not change `next/image` quality settings.

### 7. Reduce redundant WorkSphere CPU/GPU work without changing cadence or math

Do not lower WorkSphere frame rate, DPR, mesh detail, video cadence, inertia, camera behavior, shader quality, or live-video count.

Target only redundant work:

- eliminate hot-loop temporary matrix allocations by reusing preallocated scratch matrices while preserving operation order;
- make `WorkPreviewMediaPool.uploadReadyFrames()` report whether a texture actually changed;
- track whether matrices/view/uniform-dependent state actually changed;
- skip the final WebGL draw only on a frame where neither geometry/camera/project state nor media texture changed.

The RAF/controller cadence remains untouched, so pointer/inertia/snap math advances exactly as before. Placeholder textures still update at their existing ~24 fps cadence; live videos still update when decoded frames become dirty.

This is intentionally safer than stopping WorkSphere's RAF entirely.

### 8. Cache/static delivery only after fingerprint safety exists

Do not add `immutable` caching to stable unversioned public URLs.

If a runtime public asset is to receive year-long immutable caching, first content-fingerprint its filename and update every internal reference. Only then configure `next.config.ts` headers for the fingerprinted brand/artwork paths.

Measure actual deployed Cloudflare headers before changing this. If the platform already provides equivalent safe caching, leave configuration unchanged.

## Quality Gates

Every task must pass all applicable gates before its commit is retained:

1. `npm test`
2. `npm run typecheck`
3. `npm run build`
4. `git diff --check`
5. Next bundle analysis before/after comparison
6. fixed-state screenshot review at desktop and mobile widths
7. no unexpected changed files outside the task allowlist
8. exact decoded-pixel equality for modified image assets
9. no regression in loader/hero/main state transitions
10. no regression in WebGL fallback/reduced-motion paths

For optimizations that affect load order, test at normal network and throttled network. A blank frame, late component, font flash, missing first interaction, or delayed transition is a failure even if aggregate performance metrics improve.

## Success Criteria

The pass is successful when it produces measurable reductions in one or more of the following while all quality gates remain green:

- initial homepage client JavaScript transferred/parsed before Hero interaction;
- early Framer Motion/ribbon runtime loading;
- unused font bytes/work;
- public deployment asset footprint;
- runtime PNG transfer size;
- WorkSphere matrix allocations, buffer uploads, and redundant WebGL draws;
- repeat-load static asset transfer.

No numerical performance target justifies a quality regression. If a candidate optimization cannot satisfy the zero-change gates, it is discarded rather than weakened.