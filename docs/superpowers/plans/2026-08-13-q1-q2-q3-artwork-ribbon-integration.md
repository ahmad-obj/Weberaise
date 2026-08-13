# Q1/Q2/Q3 Artwork and Ribbon Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three post-EXPLORE placeholders with the supplied separated Weberaise artwork, add restrained one-time scene choreography, and refine the existing continuous ribbon against the final measured scene and LOOK glyph geometry.

**Architecture:** Keep the existing normal-flow journey, controller, two synchronized SVG depth copies, ShutterText reassurance, and canonical centerline. `JourneyArtwork` becomes a small dispatcher over three focused scene components; each scene uses losslessly tight-cropped display derivatives while the original transparent PNGs remain preserved in source asset storage. One-time motion is driven by the journey anchor's existing `data-revealed` state using transform/opacity CSS, so no React state is updated per scroll frame.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, CSS Modules, GSAP 3.15.0 for existing journey behavior, SVG ribbon geometry, Chromium DevTools screenshot QA, ImageMagick for lossless alpha-bound display derivatives.

## Global Constraints

- Work only on `feature/signature-intro`; do not merge PR #1.
- Preserve all pre-existing local changes and generated files that are outside this task.
- Preserve native scrolling, real document-flow questions, the one-way reveal model, and the `45vh–58vh` ribbon-head band.
- Keep one canonical continuous ribbon centerline and identical draw progress for back/front copies.
- Use every supplied separated production layer; never ship any master composite as a flattened scene.
- Preserve the supplied original PNGs unchanged; derived crops may only remove transparent margins.
- Q1 is the strongest ribbon/artwork depth event; Q2 remains the calm route beat; Q3's special ribbon event remains the measured LOOK OO trace.
- Do not implement character walking, physics, complex rigs, particle bursts, constant bouncing, or large pointer parallax.
- Reverse scrolling retracts ribbon only; completed artwork stays completed.
- Reduced motion exposes each meaningful final scene immediately.
- Required browser viewports: `1440×900`, `1280×720`, and `390×844`.
- Existing baseline has 9 unrelated failing tests; no new failure may be introduced, and final reporting must distinguish those baseline failures from task-focused verification.

---

### Task 1: Lock Artwork Integration and Mobile OO Behavior in RED

**Files:**
- Create: `tests/journey-artwork-integration.test.mjs`
- Modify: `tests/ribbon-loop-regression.test.mjs`

**Interfaces:**
- Produces an executable contract for all 23 separated layers, scene component boundaries, layer semantics, one-time reveal selectors, reduced-motion final states, and a mobile OO exit that clears below/forward without a long vertical tail through the word.

- [ ] **Step 1: Add the failing artwork asset/component test**

Assert that source and display copies exist for all manifest entries, masters are absent from production display paths, `JourneyArtwork.tsx` dispatches to `Q1ArtworkScene`, `Q2ArtworkScene`, and `Q3ArtworkScene`, and each scene exposes `data-artwork-scene` plus semantic `data-artwork-layer` names.

- [ ] **Step 2: Add motion-state source contracts**

Assert CSS contains journey-anchor reveal selectors for all three scenes, Q2's messy-to-clean transform corrections, Q3 whole-character translation, and a reduced-motion block that removes transitions/animations and exposes final opacity/transforms.

- [ ] **Step 3: Add a geometry regression for the observed mobile OO congestion**

Use the baseline `390×844` glyph rectangles. The break caught is an exit that drops through/beside LOOK for an excessive distance or reverses into the paired loops. Require the paired primitive's post-loop exit to clear below the glyph bounds, move forward beyond the second O, avoid strict crossings, and keep the immediate vertical run bounded relative to glyph height.

- [ ] **Step 4: Run RED**

Run:

```bash
node --import=tsx --test tests/journey-artwork-integration.test.mjs tests/ribbon-loop-regression.test.mjs
```

Expected: the artwork test fails because files/assets do not yet exist; the new OO regression fails against the congested mobile exit.

---

### Task 2: Preserve Source Artwork and Create Lossless Display Derivatives

**Files:**
- Create: `public/artwork/journey/source/Q1/*.png`
- Create: `public/artwork/journey/source/Q2/*.png`
- Create: `public/artwork/journey/source/Q3/*.png`
- Create: `public/artwork/journey/display/Q1/*.png`
- Create: `public/artwork/journey/display/Q2/*.png`
- Create: `public/artwork/journey/display/Q3/*.png`
- Create: `public/artwork/journey/ASSET_MANIFEST.json`

**Interfaces:**
- Source paths preserve the 23 byte-identical renamed PNGs.
- Display paths preserve layer separation and remove alpha-only margins with lossless PNG cropping.

- [ ] **Step 1: Copy the renamed production PNGs and manifest from the validated extracted archive**

Do not copy master references or nested ZIPs into the served production artwork directory.

- [ ] **Step 2: Verify source checksums against the extracted archive**

Run `sha256sum` over both trees and compare corresponding files.

- [ ] **Step 3: Generate tight-alpha display PNGs**

For each source layer, run ImageMagick `-trim +repage` without resizing or palette conversion.

- [ ] **Step 4: Verify display alpha and dimensions**

Require RGBA channels, non-opaque output, dimensions no larger than source, and nonzero visible bounds.

- [ ] **Step 5: Re-run the focused test**

The asset-existence portion should turn green while component/CSS contracts remain red.

---

### Task 3: Build Static Layered Scene Components

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/JourneyArtwork.tsx`
- Create: `src/components/MainSite/PostExploreNarrative/artwork/ArtworkLayer.tsx`
- Create: `src/components/MainSite/PostExploreNarrative/artwork/Q1ArtworkScene.tsx`
- Create: `src/components/MainSite/PostExploreNarrative/artwork/Q2ArtworkScene.tsx`
- Create: `src/components/MainSite/PostExploreNarrative/artwork/Q3ArtworkScene.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`

**Interfaces:**
- `ArtworkLayer({ src, name, className, eager? })` renders a decorative Next `Image` with intrinsic dimensions and `data-artwork-layer={name}`.
- Each scene renders one stable `data-artwork-cluster` measurement surface inside the existing `data-ribbon-artwork` figure.
- `JourneyArtwork({ id, label })` remains the public dispatcher used by `JourneyNarrative`.

- [ ] **Step 1: Implement the shared decorative layer**

Use `next/image` with exact display-file intrinsic dimensions, `alt=""`, appropriate responsive `sizes`, and no preload because all scenes are below the interactive hero.

- [ ] **Step 2: Compose Q1 final static state**

Place island and storefront as the central readable anchor. Arrange nav/image/CTA/browser fragments around it without obscuring the storefront. Preserve disconnected UI semantics and keep the scene bounds stable.

- [ ] **Step 3: Compose Q2 final clean state**

Keep browser shell stable; position header, media, text cluster, CTA, profile cards, and search perceptually clean without forcing exact generated-edge docking.

- [ ] **Step 4: Compose Q3 final lit state**

Layer beam, floor pool, shadow, whole character, website/profile cards, and two blue tiles. Keep the character unobscured and use a controlled dark stage so the spotlight reads clearly.

- [ ] **Step 5: Add responsive layouts**

Desktop and laptop use tuned aspect ratios; mobile compacts fragments, shortens perceived travel space, narrows spotlight geometry, and prevents any transparent layer from clipping.

- [ ] **Step 6: Run focused tests, typecheck, and static browser QA**

Force journey anchors to final revealed state in Chromium for composition-only screenshots at all three required viewports. Tune only resting geometry at this stage.

- [ ] **Step 7: Commit the static asset/composition unit**

Commit only task-owned assets, components, CSS, tests, and this plan.

---

### Task 4: Add One-Time Restrained Scene Choreography

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Modify: `tests/journey-artwork-integration.test.mjs`

**Interfaces:**
- Existing `[data-journey-stop][data-revealed='true']` is the sole activation signal.
- No new IntersectionObserver or scroll-frame React state.

- [ ] **Step 1: Verify motion contracts still fail**

- [ ] **Step 2: Add Q1 entrance**

Island/storefront rise gently first; disconnected fragments enter from nearby directions with modest overlapping delay and `cubic-bezier(.22,.61,.36,1)`. No bounce. Optional ambient life is limited to a few pixels and omitted on mobile/reduced motion.

- [ ] **Step 3: Add Q2 messy initial state to clean final state**

Default state uses small rotations/displacements, oversized CTA scale, and detached search/profile positioning. Revealed state corrects these over roughly `1.2–1.7s`, once, with overlapping transitions. Browser shell remains stable.

- [ ] **Step 4: Add Q3 spotlight entrance**

Move the whole character and shadow diagonally into the beam; reveal website, profile, media, and secondary tile in order using opacity/small translate/small scale. Do not animate limbs.

- [ ] **Step 5: Add reduced-motion final state**

All layers become visible at final transforms immediately; no semantic meaning depends on transition completion.

- [ ] **Step 6: Run focused tests and motion-state Chromium captures**

Capture initial, mid, and final states by scrolling through the actual controller trigger. Confirm reverse scroll keeps completed art complete.

---

### Task 5: Retune Ribbon Against Final Artwork and Fix Mobile LOOK Exit

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/buildJourneyPath.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/ribbonPrimitives.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/journeyRoute.ts`
- Modify: `tests/ribbon-loop-regression.test.mjs`
- Modify: `tests/ribbon-route-geometry.test.mjs` when final measured bounds require new fixtures.

**Interfaces:**
- Route continues to measure `data-ribbon-artwork`/actual glyph rectangles and returns one canonical `d`.
- Q1 front clips align with actual scene depth zones.
- Paired LOOK primitive exits below and forward with a short curved clearance rather than a long vertical stroke through the word.

- [ ] **Step 1: Confirm the new OO regression is RED before production geometry changes**

- [ ] **Step 2: Make the minimal paired-loop exit change**

Shorten/bias the post-second-O clearance using glyph-height-derived limits while retaining no-crossing, no-eyeglasses, and smooth-turn invariants.

- [ ] **Step 3: Tune Q1 wrap and clip rectangles from real scene bounds**

Capture approach, front overlap, behind segment, and re-emergence. Change only route/clip parameters proven wrong by screenshots.

- [ ] **Step 4: Reconfirm Q2 remains monotonic and calm**

Do not add an artwork loop or S-turn.

- [ ] **Step 5: Reconfirm desktop/mobile opening, reassurance, and taper are not regressed**

- [ ] **Step 6: Run focused geometry suites and recapture every adjusted state**

Run:

```bash
node --import=tsx --test tests/ribbon-loop-regression.test.mjs tests/ribbon-smoothness-regression.test.mjs tests/ribbon-primitives.test.mjs tests/ribbon-route-geometry.test.mjs tests/path-lookup-loop.test.mjs tests/ribbon-reassurance-end.test.mjs
```

---

### Task 6: Full Verification, Visual Acceptance, and Handoff

**Files:**
- Modify only files required by evidence-backed final tuning.

- [ ] **Step 1: Run task-focused tests**

Require zero failures.

- [ ] **Step 2: Run the full suite**

Run `npm test`. Compare failures with the recorded baseline of 9 unrelated failures; do not claim a green full suite unless it is actually green.

- [ ] **Step 3: Run fresh typecheck and build**

Run `npm run typecheck` and `npm run build`; both must exit `0` before completion.

- [ ] **Step 4: Capture required browser checkpoints**

At `1440×900`, `1280×720`, and `390×844`, inspect opening/handoff, Q1 entrance and all depth phases, Q2 messy/mid/clean and calm bend, Q3 outside/mid/final plus each O trace, reassurance start/final oval, taper near-zero, and reverse-scroll persistence.

- [ ] **Step 5: Verify reduced motion**

Emulate `prefers-reduced-motion: reduce`; all scene messages and reassurance remain immediately legible.

- [ ] **Step 6: Inspect git scope and preserve unrelated local files**

Do not stage `next-env.d.ts`, `tsconfig.json`, `tsconfig.tsbuildinfo`, generated agent files, or other pre-existing changes unless they become explicitly required.

- [ ] **Step 7: Commit meaningful final tuning**

Use a small number of cohesive commits and report the final SHA.

- [ ] **Step 8: Confirm PR #1 remains unmerged**

Inspect only; do not merge, close, or otherwise mutate the PR.

## Completion Gate

Completion requires: all 23 separated layers integrated; originals preserved; static compositions accepted before motion; one-time Q1/Q2/Q3 choreography; Q1 depth visually continuous; Q2 calm and perceptually clean; Q3 whole-character spotlight motion and readable cards; mobile OO congestion cleared; no new automated failures; typecheck/build green; required real-browser screenshots inspected; reduced-motion verified; current commit SHA reported; PR #1 confirmed unmerged.
