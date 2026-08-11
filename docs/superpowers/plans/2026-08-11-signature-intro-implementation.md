# WEBERAISE Signature Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production architecture and the complete approved loader → hero opening → viscous reveal → EXPLORE black-fill → First Impression handoff, while preserving the existing downstream homepage skeleton as unfinished content.

**Architecture:** One Next.js App Router route owns a small intro experience state machine. DOM/CSS renders all semantic typography and layout; a compact WebGL2 feedback-mask engine owns only the viscous reveal. The same engine accepts three emitter modes—pointer, one-shot autonomous stroke, bottom-edge fill—so the visual language stays consistent. A dependency-free static prototype mirrors the signature interaction for visual verification in this offline sandbox while production Next.js files target the current package versions documented in `package.json`.

**Tech Stack:** Next.js 16.2.12, React 19.2.8, TypeScript 7.0.2, GSAP 3.15.0, custom WebGL2 (no second 3D framework), Node built-in test runner, Chromium for visual smoke testing.

## Global Constraints

- `docs/reference/WEBERAISE_MASTER_PLANNING.md` is the canonical design source.
- `docs/reference/WEBERAISE_WEBGL_REVEAL_RESEARCH.md` is required technical guidance.
- Latest master decisions override the old handoff/skeleton hero direction.
- Hero is viewport-locked and not scroll-driven.
- Loader progress must be real; every integer 100→0 must be displayed and `0` only after critical readiness.
- Loader completion: centered 0 → expanding line → masked tagline → shortened line → 90° rotation → full-height line → duplicated twin-line traversal reveal.
- Hero front: white/black `WELCOME / TO` with empty lower slot. Back: black/white exact registration plus huge approved horizontal WEBERAISE lockup.
- Hero type: Inter Tight heavy/800 direction, centered, very large with breathing room.
- Reveal: thick rounded high-viscosity paint/blob; footprint ~1/2–2/3 type height; ~3–4s persistence; oldest-first healing; subtle settling; no ripple/splash/smoke/chaotic full fluid.
- One autonomous curved/diagonal reveal stroke runs once after hero opening and uses the same engine as pointer input.
- Fine-pointer cursor is a tiny custom dot; reveal is always active on normal movement.
- EXPLORE triggers a bottom-edge black viscous fill; the resulting black becomes First Impression background; no route reload.
- No invented proof, testimonials, client results, pricing, or fake business content.
- Preserve max quality first; optimize by reducing unnecessary work/simulation cost before visible quality.
- Provide reduced-motion and no-WebGL fallbacks.

---

### Task 1: Production Scaffold and Pure Experience Logic

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `src/experience/state/experienceReducer.ts`
- Create: `src/experience/loading/progressController.ts`
- Create: `src/experience/loading/countdownPositions.ts`
- Create: `src/webgl/reveal/math.ts`
- Create: `tests/experience.test.mjs`
- Create: `scripts/build-testable-modules.mjs`

**Interfaces:**
- Produces `experienceReducer(state, event)` and `INITIAL_EXPERIENCE_STATE`.
- Produces `createProgressController()` with truthful target/display countdown behavior.
- Produces `createCountdownPositions(seed, count, viewport, glyphSize)`.
- Produces pure `interpolateSegment`, `retentionForHalfLife`, `oldestFirstWeight` helpers shared with the reveal engine.

- [ ] **Step 1: Write failing tests for state transitions, truthful countdown, deterministic positions, interpolation, and time-based retention.**

Use Node's built-in test runner against compiled JS in `.test-dist`.

- [ ] **Step 2: Run `node --test tests/experience.test.mjs` and verify RED because production modules do not exist.**

- [ ] **Step 3: Implement only the pure modules required by the tests.**

Required behavior:
```ts
loading -> loaderCompletion -> heroOpening -> heroInteractive -> heroExiting -> main
```
Invalid backward/event transitions must leave state unchanged.

Progress controller rules:
```ts
realReadyRatio 0..1 -> target countdown 100..0
show every integer while catching up
never display 0 until realReadyRatio === 1
```

- [ ] **Step 4: Compile testable TS modules with `tsc` and run Node tests; verify GREEN.**

- [ ] **Step 5: Commit `feat: add Weberaise experience core logic`.**

---

### Task 2: App Shell, Tokens, Brand Assets, and Main-Site Semantic Foundation

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/styles/tokens.css`
- Create: `src/components/experience/ExperienceShell.tsx`
- Create: `src/components/MainSite/MainSite.tsx`
- Create: `src/components/MainSite/FirstImpression.tsx`
- Create: `src/content/homepage.ts`
- Modify: `tests/experience.test.mjs`

**Interfaces:**
- `ExperienceShell` owns intro/main state and scroll lock.
- `MainSite` renders semantic downstream sections and keeps unresolved content explicit.
- `FirstImpression` begins on black and is present before EXPLORE handoff.

- [ ] **Step 1: Add failing source-structure tests ensuring no fake proof copy is introduced and required semantic section IDs exist in `homepage.ts`.**
- [ ] **Step 2: Run tests and verify RED.**
- [ ] **Step 3: Implement app shell, tokens, and semantic section placeholders using preserved skeleton copy/TODO markers only.**
- [ ] **Step 4: Run tests and verify GREEN.**
- [ ] **Step 5: Commit `feat: scaffold Weberaise production app shell`.**

---

### Task 3: Real Loader and Countdown Choreography

**Files:**
- Create: `src/experience/loading/criticalAssetRegistry.ts`
- Create: `src/components/experience/Loader/Loader.tsx`
- Create: `src/components/experience/Loader/LoaderCountdown.tsx`
- Create: `src/components/experience/Loader/LoaderCompletion.tsx`
- Create: `src/experience/motion/loaderTimeline.ts`
- Modify: `src/components/experience/ExperienceShell.tsx`
- Modify: `tests/experience.test.mjs`

**Interfaces:**
- `criticalAssetRegistry` registers weighted promises/readiness tasks and emits 0..1 progress.
- Loader uses `progressController` and transitions only when critical registry is ready.
- `loaderTimeline` receives DOM refs and resolves when hero opening should begin.

- [ ] **Step 1: Add failing tests for weighted registry progress and final-ready gating.**
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement registry and loader components; count positions use the deterministic safe-position helper.**
- [ ] **Step 4: Implement GSAP loader completion timeline matching the exact line/tagline/rotate choreography; reduced-motion branch keeps semantic sequence but shortens motion.**
- [ ] **Step 5: Run tests and verify GREEN.**
- [ ] **Step 6: Commit `feat: implement real Weberaise loader choreography`.**

---

### Task 4: Two-Layer Hero and Strict Twin-Line Opening

**Files:**
- Create: `src/components/experience/Hero/Hero.tsx`
- Create: `src/components/experience/Hero/HeroFrontLayer.tsx`
- Create: `src/components/experience/Hero/HeroRevealLayer.tsx`
- Create: `src/experience/motion/heroOpenTimeline.ts`
- Modify: `src/components/experience/ExperienceShell.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Hero front/back consume one shared layout structure so `WELCOME / TO` is pixel-registered.
- `heroOpenTimeline` animates one vertical line → twin lines; a CSS clip variable reveals only traversed area during opening.

- [ ] **Step 1: Add failing static assertions for identical front/back text structure and approved logo asset path.**
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement hero layers and responsive CSS with a centered composition and large horizontal lockup.**
- [ ] **Step 4: Implement strict traversal opening with no global opacity shortcut.**
- [ ] **Step 5: Run tests and verify GREEN.**
- [ ] **Step 6: Commit `feat: add registered two-layer hero opening`.**

---

### Task 5: WebGL2 Persistent Viscous Mask Engine

**Files:**
- Create: `src/webgl/reveal/RevealEngine.ts`
- Create: `src/webgl/reveal/createRevealEngine.ts`
- Create: `src/webgl/reveal/pointerTracker.ts`
- Create: `src/webgl/reveal/emitters/types.ts`
- Create: `src/webgl/reveal/emitters/pointerEmitter.ts`
- Create: `src/webgl/reveal/emitters/autonomousEmitter.ts`
- Create: `src/webgl/reveal/emitters/bottomFillEmitter.ts`
- Create: `src/webgl/reveal/shaders.ts`
- Create: `src/webgl/reveal/quality.ts`
- Modify: `tests/experience.test.mjs`

**Interfaces:**
- `RevealEngine.start/stop/resize/setMode/emitStroke/dispose`.
- Shared emitter format produces normalized `(x,y,radius,strength,velocity,time)` samples.
- Engine uses ping-pong low-resolution history textures and final mask compositing.

- [ ] **Step 1: Add failing tests for emitter sample generation, path interpolation, progressive age/healing data, and quality profiles.**
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement pure emitter/quality logic.**
- [ ] **Step 4: Implement WebGL2 ping-pong history field with semi-Lagrangian/light directional advection, subtle edge noise, and time-correct oldest-first decay.**
- [ ] **Step 5: Implement graceful no-WebGL failure return without throwing the app.**
- [ ] **Step 6: Run tests and verify GREEN.**
- [ ] **Step 7: Commit `feat: add persistent viscous reveal engine`.**

---

### Task 6: Interactive Hero, Autonomous Stroke, Cursor, and Fallback

**Files:**
- Create: `src/components/experience/Hero/HeroRevealCanvas.tsx`
- Create: `src/components/experience/Hero/HeroCursor.tsx`
- Create: `src/components/experience/Hero/HeroExploreButton.tsx`
- Modify: `src/components/experience/Hero/Hero.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Canvas mounts one `RevealEngine`, passes pointer samples without React state updates, and runs autonomous stroke exactly once after opening.
- Custom cursor only on fine pointers.
- Fallback uses CSS radial/paint-mask behavior and retains interaction discoverability.

- [ ] **Step 1: Add failing assertions for once-only autonomous trigger and no pointer `setState` pattern in reveal component.**
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement canvas lifecycle, pointer tracking, autonomous curved/diagonal stroke, and tiny dot cursor.**
- [ ] **Step 4: Implement reduced-motion/no-WebGL fallback.**
- [ ] **Step 5: Run tests and verify GREEN.**
- [ ] **Step 6: Commit `feat: integrate interactive Weberaise hero reveal`.**

---

### Task 7: EXPLORE Bottom-Fill Transition and Scroll Handoff

**Files:**
- Create: `src/experience/motion/exploreTimeline.ts`
- Modify: `src/components/experience/Hero/HeroExploreButton.tsx`
- Modify: `src/components/experience/ExperienceShell.tsx`
- Modify: `src/webgl/reveal/RevealEngine.ts`
- Modify: `src/app/globals.css`
- Modify: `tests/experience.test.mjs`

**Interfaces:**
- EXPLORE switches the shared engine into bottom-fill mode, blocks input/scroll during transition, then commits `main` state after full black coverage.
- First Impression is already mounted/prepared under the transition.

- [ ] **Step 1: Add failing tests for bottom-fill progression and state/scroll gating.**
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement bottom-edge emitter and full-black completion signal.**
- [ ] **Step 4: Wire EXPLORE timeline and main-state scroll unlock.**
- [ ] **Step 5: Run tests and verify GREEN.**
- [ ] **Step 6: Commit `feat: add viscous Explore handoff to main site`.**

---

### Task 8: Offline Visual Prototype and Chromium Verification

**Files:**
- Create: `prototype/index.html`
- Create: `prototype/styles.css`
- Create: `prototype/app.js`
- Create: `prototype/reveal-engine.js`
- Create: `scripts/smoke-prototype.sh`

**Interfaces:**
- Dependency-free prototype mirrors the approved intro flow so this sandbox can render it without npm network access.
- Prototype is reference/verification code, not the production architecture.

- [ ] **Step 1: Create smoke script that fails until prototype files and required DOM states exist.**
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Build prototype using the same WebGL2 mask algorithm and timing constants.**
- [ ] **Step 4: Run smoke script and verify GREEN.**
- [ ] **Step 5: Serve locally and capture Chromium screenshots at loader, hero, reveal, and post-EXPLORE states.**
- [ ] **Step 6: Inspect screenshots and browser console; fix visible clipping, registration, or WebGL errors.**
- [ ] **Step 7: Commit `test: add offline intro visual prototype`.**

---

### Task 9: Documentation, Verification, and Deliverable Packaging

**Files:**
- Create: `README.md`
- Create: `docs/IMPLEMENTATION_STATUS.md`
- Create: `docs/ARCHITECTURE.md`
- Modify: `docs/reference/WEBERAISE_MASTER_PLANNING.md` only to add implementation-status cross-reference, never to rewrite design decisions.

**Interfaces:**
- README explains install/run once npm network is available and prototype run command now.
- Status document separates verified behavior from dependency-blocked verification.

- [ ] **Step 1: Run full Node test suite and prototype smoke test.**
- [ ] **Step 2: Run TypeScript compile for dependency-free core modules.**
- [ ] **Step 3: Run Chromium prototype render with console capture.**
- [ ] **Step 4: Attempt `npm install`; if sandbox network blocks it, record exact blocker and do not claim Next.js production build passed.**
- [ ] **Step 5: If install succeeds, run `npm run build`; otherwise run package/source static validation and document the missing build verification.**
- [ ] **Step 6: Zip implementation workspace excluding `.git`, caches, and screenshots unless useful.**
- [ ] **Step 7: Commit `docs: finalize Weberaise intro implementation handoff`.**

