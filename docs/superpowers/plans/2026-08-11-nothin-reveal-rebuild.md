# Nothin-Inspired Reveal Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the density-feedback reveal with an age-aware solid implicit-surface mask that heals by geometric contraction and add a local runtime probe for Nothin's publicly delivered WebGL characteristics.

**Architecture:** Keep React, pointer tracking, hero layering, brand compositing, and Explore flow intact. Replace the ping-pong decay buffer with a per-frame low-resolution field render generated from a bounded active primitive list; each primitive keeps a birth time and shrinks only during the healing stage. Composite the field with a narrow threshold so the reveal stays solid and clean. Add a dependency-free Chrome DevTools Protocol probe for local reference inspection.

**Tech Stack:** Next.js 16.3, TypeScript, WebGL2/GLSL ES 3.00, GSAP, Node 24.

## Global Constraints

- Preserve the approved centered loader, radial vignette, raised shared hero composition, same-route state machine, custom cursor, autonomous intro stroke, and Explore handoff.
- No full Navier-Stokes solver.
- No smoke/fog/low-alpha residue.
- Target visible trail lifetime remains approximately 3–4 seconds.
- No proprietary Nothin shader source copied into Weberaise.
- Full-quality path must remain practical on integrated GPUs by using a bounded active primitive count and low-resolution field target.

---

### Task 1: Encode age-aware liquid lifetime behavior

**Files:**
- Create: `src/webgl/reveal/liquidLifetime.ts`
- Modify: `tests/experience.test.mjs`

**Interfaces:**
- Produces `liquidRadiusScale(ageSeconds, lifetimeSeconds, holdFraction): number`
- Produces `isLiquidPrimitiveAlive(ageSeconds, lifetimeSeconds): boolean`

- [ ] Add tests proving radius stays essentially full through the hold stage, contracts monotonically afterward, reaches zero at lifetime, and never returns negative values.
- [ ] Run `npm test` and confirm the new tests fail before implementation.
- [ ] Implement the two pure helpers with a smooth nonlinear contraction curve.
- [ ] Run `npm test` and confirm the new tests pass.

### Task 2: Replace density history with an active primitive field renderer

**Files:**
- Modify: `src/webgl/reveal/shaders.ts`
- Modify: `src/webgl/reveal/RevealEngine.ts`
- Modify: `src/webgl/reveal/quality.ts`
- Modify: `tests/visual-contract.test.mjs`

**Interfaces:**
- `RevealEngine.emit(samples)` stores bounded time-stamped active primitives.
- Per frame, the engine removes expired primitives, computes age-adjusted radius, clears one low-resolution field framebuffer, and renders all active primitives into it with additive blending.
- Composite shader consumes the field texture and brand texture.

- [ ] Add visual-contract assertions requiring primitive-field shader names, age/lifetime uniforms or CPU age calculation markers, narrow solid thresholding, and absence of history retention/advection logic.
- [ ] Run the visual-contract test and verify red state.
- [ ] Replace `HISTORY_FRAGMENT` with a primitive-field vertex/fragment pair. Each primitive is an instanced quad producing a smooth radial contribution; velocity may add restrained anisotropic stretch.
- [ ] Change `RevealEngine` from ping-pong history targets to one field target plus an instanced primitive buffer/VAO. Clear and redraw the field every frame using active primitives.
- [ ] Stamp primitive birth time at `emit()` so autonomous samples and real pointer samples share one clock.
- [ ] Keep active count bounded by quality profile and prune oldest/expired primitives.
- [ ] Composite with a narrow threshold band so low field values are fully invisible and overlapping primitives form smooth unions/necks.
- [ ] Keep bottom-fill mode independent and unchanged.
- [ ] Run all tests.

### Task 3: Tune full/lite profiles for solid union and pinch-off

**Files:**
- Modify: `src/webgl/reveal/quality.ts`
- Modify: `src/components/experience/Hero/HeroRevealCanvas.tsx`
- Modify: `tests/experience.test.mjs`

**Interfaces:**
- Extend `RevealQuality` with `lifetime`, `holdFraction`, `maxPrimitives`, `surfaceThreshold`, `contourWarp`.

- [ ] Add tests for profile ordering and hard bounds.
- [ ] Use a ~3.6s full-profile lifetime with a majority hold stage and shorter/lighter mobile profile.
- [ ] Set primitive count high enough for continuous movement but bounded for integrated GPUs.
- [ ] Slightly reduce pointer interpolation spacing if side-by-side inspection shows visible segmentation.
- [ ] Ensure reduced-motion disables animated contour warp.
- [ ] Run tests and typecheck.

### Task 4: Add dependency-free Nothin WebGL runtime probe

**Files:**
- Create: `scripts/probe-nothin-webgl.mjs`
- Modify: `.gitignore`
- Create: `docs/reference/NOTHIN_RUNTIME_PROBE.md`

**Interfaces:**
- Run with `node scripts/probe-nothin-webgl.mjs`.
- Output to `.diagnostics/nothin-webgl.json` and `.diagnostics/nothin-shaders.txt`.

- [ ] Implement Chromium/Chrome executable discovery for common Linux paths.
- [ ] Launch Chrome with a temporary profile and remote-debugging port using Node built-ins only.
- [ ] Connect through CDP using Node 24's built-in `WebSocket`.
- [ ] Inject hooks before navigation for WebGL/WebGL2 `shaderSource`, `linkProgram`, `getUniformLocation`, texture allocation, framebuffer binding, and draw calls.
- [ ] Navigate to `https://www.noth.in/`, wait for startup, then save summarized metadata and shader source captured from the public runtime for local analysis only.
- [ ] Add clear documentation that output is diagnostic and must not be copied wholesale into production.
- [ ] Gitignore `.diagnostics/`.

### Task 5: Update offline prototype and docs

**Files:**
- Modify: `prototype/reveal-engine.js`
- Modify: `prototype/app.js` if required
- Modify: `docs/IMPLEMENTATION_STATUS.md`
- Modify: `docs/reference/WEBERAISE_MASTER_PLANNING.parts/part-05.md`

- [ ] Mirror the production primitive/healing behavior closely enough that the offline Chromium capture remains a meaningful visual harness.
- [ ] Update status docs to state the reveal now heals geometrically through primitive contraction rather than feedback-density decay.
- [ ] Record the runtime probe workflow and comparison checklist.

### Task 6: Verification

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build` where dependencies are available.
- [ ] Run the prototype smoke/capture workflow.
- [ ] Locally run `node scripts/probe-nothin-webgl.mjs` on a network-enabled machine and inspect the resulting metadata before final visual tuning.
- [ ] Compare Weberaise and Nothin side-by-side for: solid interior, terminal blob shape, hold behavior, contraction, necking/pinch-off, detached islands, contour movement, and absence of fog.
