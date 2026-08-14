# Work Spherical Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved `/work` experience: `OUR WORKS` opening, ReactBits-inspired spherical project gallery with rectangular moving website previews, controlled drag/inertia/soft snapping, compact in-place project showcase, and seamless return to the preserved sphere state.

**Architecture:** Add a dedicated App Router route and isolate the Work experience from the homepage and Services branches. React owns semantic state, opening/showcase UI, accessibility and transition orchestration; a non-React `WorkSphereEngine` owns WebGL2, arcball/quaternion movement, spherical placement, picking, projection and frame rendering; a bounded media pool owns poster textures and only a few live video textures at once. The selected WebGL project hands off through measured screen-space bounds to a native DOM/video showcase so the large project video stays sharp and accessible while the expensive sphere renderer can suspend.

**Tech Stack:** Next.js 16.3.0 App Router, React 19.2.8, TypeScript 7.0.2, GSAP 3.15.0, WebGL2, `gl-matrix` ^3.4.3, CSS Modules, existing Weberaise tokens/fonts, Node test runner through `tsx`.

## Global Constraints

- Work only on `feature/work-spherical-showcase` until branch reconciliation.
- Design source of truth: `docs/superpowers/specs/2026-08-13-work-spherical-showcase-design.md`.
- Reference behavior/source: `https://reactbits.dev/components/infinite-menu` and `DavidHDev/react-bits/src/ts-default/Components/InfiniteMenu/InfiniteMenu.tsx`.
- Preserve the spherical interaction model; do not replace it with a carousel, cylinder, grid or flat free-pan field.
- Initial route state visually presents only `OUR WORKS`; no visible sphere, project thumbnails, spinner, fake progress, particle scene or decorative 3D background.
- Sphere entrance preserves the ReactBits demo character: substantially oversized field settling to normal scale; production values are tuned for rectangular projects rather than literal `scale(5)` if that clips excessively.
- Project surfaces are landscape rectangles with restrained corner rounding, never circles.
- Desktop composition targets roughly 5–7 visible contributing project surfaces with one dominant front item and generous negative space.
- Browse metadata is only project name + category.
- Browse media uses short muted loops; no audio autoplay.
- Bound live browse decoding/upload to 3 projects initially: active + two highest-priority neighbors. Peripheral/back projects stay on sharp posters.
- Full showcase video does not autoplay; the user explicitly starts it.
- Expanded content is only project name, short brief, services, year and live website link.
- No fake clients, testimonials, awards, performance metrics or outcome claims.
- Preserve sphere orientation and selected project when returning from a showcase.
- Hover is enhancement only; touch, keyboard and assistive-technology access must remain complete.
- Respect `prefers-reduced-motion: reduce`.
- Provide a purposeful no-WebGL fallback using the same project content and showcase component.
- Target stable 60fps-class interaction on practical desktop hardware including integrated GPUs; degrade peripheral video/deformation/DPR before degrading the active project.
- Do not copy the ReactBits component wholesale. Adapt the arcball/quaternion/snap ideas into Weberaise-owned modules. If source portions are substantially adapted, retain the ReactBits copyright/license notice in `THIRD_PARTY_NOTICES.md`.
- Shared floating navigation is being developed in parallel. Do not rewrite or fork navigation inside Work; `/work` must function independently and navigation reconciliation happens after branch integration.
- Before modifying App Router files, inspect the installed Next.js 16 docs under `node_modules/next/dist/docs/` as required by `AGENTS.md`.

---

## File Map

### Route and page orchestration
- Create `src/app/work/page.tsx` — route metadata and page entry.
- Create `src/components/WorkPage/WorkPage.tsx` — experience reducer, opening/sphere/showcase orchestration, scroll lock, keyboard routing.
- Create `src/components/WorkPage/WorkPage.module.css` — full responsive Work visual system, transition layers and fallback styles.
- Create `src/components/WorkPage/workState.ts` — explicit Work state reducer and transition guards.
- Create `src/components/WorkPage/WorkOpening.tsx` — `OUR WORKS` intro and readiness/exit choreography.
- Create `src/components/WorkPage/WorkBrowseMeta.tsx` — crisp active-project name/category UI.
- Create `src/components/WorkPage/ProjectShowcase.tsx` — native large video + minimal information + return action.
- Create `src/components/WorkPage/ProjectTransitionBridge.tsx` — shared-element screen-space handoff between canvas project and DOM showcase.
- Create `src/components/WorkPage/WorkFallback.tsx` — intentional no-WebGL/reduced-capability portfolio fallback.

### Project content
- Create `src/content/workProjects.ts` — typed production project records and media contracts.
- Create `public/work/README.md` — exact media derivative naming/encoding contract for real project assets.

### WebGL sphere engine
- Create `src/webgl/workSphere/types.ts` — engine-facing types and public API.
- Create `src/webgl/workSphere/constants.ts` — tuned initial geometry/camera/performance constants.
- Create `src/webgl/workSphere/geometry.ts` — icosahedron directions + rectangular quad geometry + repeated-project slot allocation.
- Create `src/webgl/workSphere/arcball.ts` — pointer projection, quaternion drag, inertial decay and snap target.
- Create `src/webgl/workSphere/selection.ts` — nearest/front selection, hover override bookkeeping and deterministic keyboard target order.
- Create `src/webgl/workSphere/projection.ts` — project quad screen-space bounds and pointer hit testing.
- Create `src/webgl/workSphere/shaders.ts` — rectangular texture shader with rounded-rect alpha and restrained velocity deformation.
- Create `src/webgl/workSphere/mediaPool.ts` — poster atlas, 3-slot live video pool, frame upload scheduling and cleanup.
- Create `src/webgl/workSphere/quality.ts` — DPR/video/deformation quality profile selection.
- Create `src/webgl/workSphere/WorkSphereEngine.ts` — context/program/buffer lifecycle, render loop, public engine API.
- Create `src/components/WorkPage/WorkSphereCanvas.tsx` — React lifecycle adapter around `WorkSphereEngine`.

### Dependency/licensing
- Modify `package.json` — add `gl-matrix` ^3.4.3.
- Modify `package-lock.json` and `pnpm-lock.yaml` — keep both existing lockfiles consistent.
- Create `THIRD_PARTY_NOTICES.md` — ReactBits attribution/conditions if substantial reference source is adapted.

### Tests
- Create `tests/work-state.test.mjs`.
- Create `tests/work-sphere-geometry.test.mjs`.
- Create `tests/work-sphere-control.test.mjs`.
- Create `tests/work-media-priority.test.mjs`.
- Create `tests/work-page-contract.test.mjs`.

---

### Task 1: Add dependency, content contract, state machine and route shell

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `pnpm-lock.yaml`
- Create: `THIRD_PARTY_NOTICES.md`
- Create: `src/content/workProjects.ts`
- Create: `src/components/WorkPage/workState.ts`
- Create: `src/app/work/page.tsx`
- Test: `tests/work-state.test.mjs`
- Test: `tests/work-page-contract.test.mjs`

**Interfaces:**
- Produces `WorkProject`, `WorkProjectMedia`, `WORK_PROJECTS`.
- Produces `WorkExperienceState`, `WorkAction`, `workReducer`, `INITIAL_WORK_STATE`.
- Produces `/work` route rendering `<WorkPage projects={WORK_PROJECTS} />` once Task 2 creates `WorkPage`.

- [ ] **Step 1: Inspect the installed Next.js route documentation**

Run:

```bash
find node_modules/next/dist/docs -type f | grep -E 'app.*page|metadata|route' | head -30
```

Read the App Router page/metadata files returned before creating `src/app/work/page.tsx`.

- [ ] **Step 2: Write state/model contract tests first**

Create `tests/work-state.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_WORK_STATE, workReducer } from '../src/components/WorkPage/workState.ts';

test('work flow follows the approved state sequence', () => {
  let state = INITIAL_WORK_STATE;
  state = workReducer(state, { type: 'OPENING_READY' });
  assert.equal(state.phase, 'sphereEntering');
  state = workReducer(state, { type: 'SPHERE_ENTERED' });
  assert.equal(state.phase, 'sphereInteractive');
  state = workReducer(state, { type: 'OPEN_PROJECT', projectSlug: 'fixture-a', slotId: 3 });
  assert.equal(state.phase, 'projectOpening');
  assert.equal(state.selectedProjectSlug, 'fixture-a');
  state = workReducer(state, { type: 'PROJECT_OPENED' });
  assert.equal(state.phase, 'projectShowcase');
  state = workReducer(state, { type: 'RETURN_TO_SPHERE' });
  assert.equal(state.phase, 'projectReturning');
  state = workReducer(state, { type: 'SPHERE_RESTORED' });
  assert.equal(state.phase, 'sphereInteractive');
  assert.equal(state.selectedProjectSlug, 'fixture-a');
});

test('open project is ignored outside sphereInteractive', () => {
  const state = workReducer(INITIAL_WORK_STATE, {
    type: 'OPEN_PROJECT', projectSlug: 'fixture-a', slotId: 1,
  });
  assert.deepEqual(state, INITIAL_WORK_STATE);
});
```

Create the initial `tests/work-page-contract.test.mjs` assertions for route/model presence:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('work route and content use the dedicated work architecture', () => {
  assert.match(read('src/app/work/page.tsx'), /WorkPage/);
  const model = read('src/content/workProjects.ts');
  assert.match(model, /type WorkProject/);
  assert.match(model, /browsePreview/);
  assert.match(model, /showcaseVideo/);
});
```

- [ ] **Step 3: Run the new tests and verify failure**

Run:

```bash
node --import=tsx --test tests/work-state.test.mjs tests/work-page-contract.test.mjs
```

Expected: FAIL because the files are not implemented yet.

- [ ] **Step 4: Add `gl-matrix` and synchronize both lockfiles**

Run:

```bash
npm install gl-matrix@^3.4.3
pnpm install --lockfile-only
```

Verify `package.json`, `package-lock.json`, and `pnpm-lock.yaml` all include `gl-matrix`.

- [ ] **Step 5: Implement the typed project model**

Use this exact shape:

```ts
export type WorkProjectMedia = {
  poster: string;
  browsePreview: string;
  showcasePoster: string;
  showcaseVideo: string;
};

export type WorkProject = {
  slug: string;
  name: string;
  category: string;
  brief: string;
  services: readonly string[];
  year: string;
  liveUrl: string;
  media: WorkProjectMedia;
};

export const WORK_PROJECTS: readonly WorkProject[] = [];
```

Keep production data empty until real verified project copy/media is supplied. Tests use fixtures; the production fallback handles an empty collection intentionally rather than inventing portfolio proof.

- [ ] **Step 6: Implement the reducer**

Use phases:

```ts
export type WorkPhase =
  | 'opening'
  | 'sphereEntering'
  | 'sphereInteractive'
  | 'projectOpening'
  | 'projectShowcase'
  | 'projectReturning';
```

State includes:

```ts
export type WorkExperienceState = {
  phase: WorkPhase;
  selectedProjectSlug: string | null;
  selectedSlotId: number | null;
};
```

Only allow `OPEN_PROJECT` from `sphereInteractive`; preserve selection through `SPHERE_RESTORED`.

- [ ] **Step 7: Add route metadata and shell import**

`src/app/work/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { WorkPage } from '@/components/WorkPage/WorkPage';
import { WORK_PROJECTS } from '@/content/workProjects';

export const metadata: Metadata = {
  title: 'Work — WEBERAISE',
  description: 'Selected websites designed and built by WEBERAISE.',
};

export default function WorkRoute() {
  return <WorkPage projects={WORK_PROJECTS} />;
}
```

Task 2 creates the referenced component immediately afterward.

- [ ] **Step 8: Add ReactBits attribution notice**

Create `THIRD_PARTY_NOTICES.md` naming ReactBits, repository URL, copyright holder David Haz, the repository's MIT + Commons Clause condition, and state that Weberaise adapts interaction/math concepts rather than redistributing the component library.

- [ ] **Step 9: Run focused tests**

Run:

```bash
node --import=tsx --test tests/work-state.test.mjs tests/work-page-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 10: Commit the task**

```bash
git add package.json package-lock.json pnpm-lock.yaml THIRD_PARTY_NOTICES.md src/content/workProjects.ts src/components/WorkPage/workState.ts src/app/work/page.tsx tests/work-state.test.mjs tests/work-page-contract.test.mjs
git commit -m "feat: establish work showcase contracts"
```

---

### Task 2: Build `OUR WORKS` opening, Work shell and intentional empty-data state

**Files:**
- Create: `src/components/WorkPage/WorkPage.tsx`
- Create: `src/components/WorkPage/WorkOpening.tsx`
- Create: `src/components/WorkPage/WorkPage.module.css`
- Create: `src/components/WorkPage/WorkFallback.tsx`
- Modify: `tests/work-page-contract.test.mjs`

**Interfaces:**
- `WorkPage({ projects }: { projects: readonly WorkProject[] })` owns state and scroll locking.
- `WorkOpening({ ready, reducedMotion, onComplete })` reports completion only after its minimum visual beat and sphere readiness.
- Empty project arrays render an honest restrained empty state after the opening, never fabricated projects.

- [ ] **Step 1: Extend the failing page contract test**

Assert:

```js
const page = read('src/components/WorkPage/WorkPage.tsx');
const opening = read('src/components/WorkPage/WorkOpening.tsx');
const css = read('src/components/WorkPage/WorkPage.module.css');
assert.match(opening, /OUR WORKS/);
assert.doesNotMatch(opening, /spinner|percentage|loading projects/i);
assert.match(page, /work-page-scroll-locked/);
assert.match(css, /prefers-reduced-motion/);
```

- [ ] **Step 2: Verify failure**

Run:

```bash
node --import=tsx --test tests/work-page-contract.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Implement `WorkPage` shell**

Use `useReducer(workReducer, INITIAL_WORK_STATE)` and a `useEffect` that toggles:

```ts
document.documentElement.classList.toggle(
  'work-page-scroll-locked',
  state.phase !== 'projectShowcase',
);
```

Cleanup the class on unmount. Compute reduced motion once with `matchMedia('(prefers-reduced-motion: reduce)')`.

During `opening`, mount the sphere canvas hidden so Task 6 can warm WebGL/media while `OUR WORKS` is visible. During `projectShowcase`, allow normal vertical scrolling.

- [ ] **Step 4: Implement restrained opening choreography**

`WorkOpening` uses GSAP only for authored finite motion:

```ts
const MIN_OPENING_MS = 900;
const EXIT_DURATION = reducedMotion ? 0.16 : 0.34;
```

Keep text centered; exit with clipped `yPercent: -115` plus opacity support. No 3D transform or letter breakup.

Do not begin exit until both conditions are true:

```ts
minimumBeatComplete && ready
```

If WebGL readiness takes longer, the words simply remain composed on screen without displaying a loading indicator.

- [ ] **Step 5: Implement CSS isolation**

Key rules:

```css
.page { min-height: 100svh; background: var(--wr-black); color: var(--wr-white); }
.viewport { position: fixed; inset: 0; overflow: hidden; }
.opening { position: absolute; inset: 0; display: grid; place-items: center; z-index: 5; }
.openingText { font: 800 clamp(64px, 11vw, 190px)/.82 var(--font-hero), Arial, sans-serif; letter-spacing: -.07em; }
:global(html.work-page-scroll-locked),
:global(html.work-page-scroll-locked body) { overflow: hidden; height: 100%; overscroll-behavior: none; }
```

Include responsive rules and `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 6: Implement honest empty-data fallback**

If `projects.length === 0`, after the opening transition render a restrained message such as `SELECTED WORK IS BEING PREPARED.` plus a link back home. Do not invent demonstration client names in production.

- [ ] **Step 7: Run tests and typecheck**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/WorkPage tests/work-page-contract.test.mjs
git commit -m "feat: add work page opening shell"
```

---

### Task 3: Implement spherical slot geometry and curated rectangular placement

**Files:**
- Create: `src/webgl/workSphere/types.ts`
- Create: `src/webgl/workSphere/constants.ts`
- Create: `src/webgl/workSphere/geometry.ts`
- Test: `tests/work-sphere-geometry.test.mjs`

**Interfaces:**
- Produces `SphereSlot { id, direction, projectIndex }`.
- Produces `createIcosahedronDirections(): Vec3[]`.
- Produces `buildProjectSlots(projectCount: number): SphereSlot[]`.
- Produces `createProjectQuad(): { positions, uvs, indices }`.

- [ ] **Step 1: Write failing geometry tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProjectSlots, createIcosahedronDirections, createProjectQuad } from '../src/webgl/workSphere/geometry.ts';

test('base sphere uses twelve normalized icosahedron directions', () => {
  const dirs = createIcosahedronDirections();
  assert.equal(dirs.length, 12);
  for (const [x, y, z] of dirs) {
    assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 1e-6);
  }
});

test('project slots pair repeated project identities on opposite hemispheres', () => {
  const slots = buildProjectSlots(6);
  assert.equal(slots.length, 12);
  for (let projectIndex = 0; projectIndex < 6; projectIndex += 1) {
    const matching = slots.filter(slot => slot.projectIndex === projectIndex);
    assert.equal(matching.length, 2);
    const dot = matching[0].direction.reduce((sum, value, i) => sum + value * matching[1].direction[i], 0);
    assert.ok(dot < -0.99);
  }
});

test('project mesh is a landscape quad', () => {
  const quad = createProjectQuad();
  assert.deepEqual(Array.from(quad.indices), [0, 1, 2, 0, 2, 3]);
});
```

- [ ] **Step 2: Verify failure**

Run:

```bash
node --import=tsx --test tests/work-sphere-geometry.test.mjs
```

- [ ] **Step 3: Implement constants**

Initial tuned values:

```ts
export const WORK_SPHERE = {
  radius: 4.4,
  projectWidth: 1.55,
  projectHeight: 0.96,
  cameraZ: 7.35,
  dprCapFull: 1.5,
  dprCapLite: 1.15,
  liveVideoSlots: 3,
} as const;
```

These are initial production values, not permanent magic numbers; future visual tuning changes this one file.

- [ ] **Step 4: Implement base icosahedron directions and antipodal slot mapping**

Use the 12 canonical icosahedron vertices, normalize them, group six antipodal pairs, and assign the same project index to both points of a pair for `projectCount <= 6`. For project counts above six, assign unique projects before wrapping. This prevents the most common repeated identity from appearing simultaneously front/back for the initial curated set.

- [ ] **Step 5: Implement landscape quad data**

Use four vertices centered at origin with unit dimensions; instance matrices apply actual width/height.

- [ ] **Step 6: Run tests**

```bash
node --import=tsx --test tests/work-sphere-geometry.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/webgl/workSphere tests/work-sphere-geometry.test.mjs
git commit -m "feat: add work sphere geometry"
```

---

### Task 4: Implement arcball drag, inertia, nearest-item snapping and keyboard target selection

**Files:**
- Create: `src/webgl/workSphere/arcball.ts`
- Create: `src/webgl/workSphere/selection.ts`
- Test: `tests/work-sphere-control.test.mjs`

**Interfaces:**
- `ArcballController.update(deltaMs): ArcballSnapshot`.
- `ArcballController.pointerDown(x, y)`, `pointerMove(x, y)`, `pointerUp()`.
- `ArcballController.setSnapTarget(direction | null)`.
- `findNearestSlot(slots, orientation, frontDirection): number`.
- `nextKeyboardSlot(current, delta, slotCount): number`.

- [ ] **Step 1: Write failing pure-control tests**

Test deterministic helpers rather than browser events:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { decayAngularVelocity } from '../src/webgl/workSphere/arcball.ts';
import { nextKeyboardSlot } from '../src/webgl/workSphere/selection.ts';

test('inertia decays monotonically and reaches rest', () => {
  let velocity = 1;
  for (let i = 0; i < 120; i += 1) {
    const next = decayAngularVelocity(velocity, 16.6667, false);
    assert.ok(next <= velocity);
    velocity = next;
  }
  assert.ok(velocity < 0.002);
});

test('reduced motion removes residual inertia', () => {
  assert.equal(decayAngularVelocity(1, 16.6667, true), 0);
});

test('keyboard target order wraps deterministically', () => {
  assert.equal(nextKeyboardSlot(0, -1, 12), 11);
  assert.equal(nextKeyboardSlot(11, 1, 12), 0);
});
```

- [ ] **Step 2: Verify failure**

```bash
node --import=tsx --test tests/work-sphere-control.test.mjs
```

- [ ] **Step 3: Adapt arcball math from the ReactBits reference into a focused class**

Use `gl-matrix` `quat`, `vec2`, `vec3`. Keep pointer projection/quaternion accumulation, but separate event binding from control math. Use time-correct damping:

```ts
export function decayAngularVelocity(value: number, deltaMs: number, reducedMotion: boolean) {
  if (reducedMotion) return 0;
  return value * Math.exp(-deltaMs / 360);
}
```

Snap begins only when pointer is up and angular velocity falls below `0.055`; use a gentle quaternion slerp toward the target with time-correct factor `1 - Math.exp(-deltaMs / 260)`.

- [ ] **Step 4: Implement selection helpers**

Nearest slot is the maximum dot product between the front direction and each oriented slot direction. Keyboard order stays deterministic even though visual positions rotate.

- [ ] **Step 5: Run tests and strict typecheck**

```bash
node --import=tsx --test tests/work-sphere-control.test.mjs
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/webgl/workSphere/arcball.ts src/webgl/workSphere/selection.ts tests/work-sphere-control.test.mjs
git commit -m "feat: add sphere controls and snapping"
```

---

### Task 5: Build WebGL renderer with rectangular rounded project surfaces

**Files:**
- Create: `src/webgl/workSphere/shaders.ts`
- Create: `src/webgl/workSphere/projection.ts`
- Create: `src/webgl/workSphere/WorkSphereEngine.ts`
- Create: `src/components/WorkPage/WorkSphereCanvas.tsx`
- Modify: `tests/work-page-contract.test.mjs`

**Interfaces:**
- `WorkSphereEngine(canvas, projects, callbacks, options)`.
- Engine methods: `start()`, `stop()`, `destroy()`, `setInteractive(boolean)`, `setEntranceProgress(number)`, `setHoverSlot(number | null)`, `snapToSlot(number)`, `getSlotScreenBounds(number)`, `getOrientationSnapshot()`, `restoreOrientation(snapshot)`.
- Callbacks: `onReady`, `onActiveSlotChange`, `onMovementChange`, `onProjectActivate`, `onCapabilityFailure`.

- [ ] **Step 1: Add failing source contract assertions**

```js
const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
const shaders = read('src/webgl/workSphere/shaders.ts');
assert.match(engine, /getContext\(['"]webgl2/);
assert.match(engine, /drawElementsInstanced/);
assert.match(engine, /getSlotScreenBounds/);
assert.match(shaders, /rounded/i);
assert.doesNotMatch(shaders, /DiscGeometry/);
```

- [ ] **Step 2: Verify failure**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs
```

- [ ] **Step 3: Implement shaders**

Vertex shader receives world/view/projection matrices plus per-instance matrix and movement velocity. Apply only a restrained tangential deformation capped to roughly 2% of project width; active website content must never visibly rubber-band.

Fragment shader samples poster/live media and clips corners through a signed rounded-rectangle mask in UV space. Use a narrow derivative-based antialias band (`fwidth`) so corners remain smooth without blurring the project image.

- [ ] **Step 4: Implement engine initialization and instanced transforms**

Use one quad VAO and one instanced matrix buffer. Each frame:

1. update arcball orientation;
2. rotate slot direction;
3. place center at `direction * radius`;
4. orient quad tangent to sphere and toward center/camera consistently;
5. apply depth-based size hierarchy;
6. write matrices into one typed array;
7. upload with `bufferSubData` once;
8. draw instanced.

Use alpha canvas and depth test/culling. DPR comes from Task 8 quality profile, initially capped to `1.5`.

- [ ] **Step 5: Implement projection and hit testing**

Project all four selected quad corners through current view/projection matrices and return:

```ts
export type ScreenBounds = { left: number; top: number; width: number; height: number };
```

For pointer picking, test visible slot projected rectangles ordered by front depth; choose the nearest/frontmost containing the pointer. Ignore slots facing sufficiently away from camera.

- [ ] **Step 6: Implement React canvas adapter**

`WorkSphereCanvas` creates/destroys exactly one engine per project-set identity, forwards readiness/active/movement callbacks to React, and keeps per-frame orientation entirely outside React state.

- [ ] **Step 7: Validate no React RAF rerender coupling**

Add source assertion that `WorkSphereCanvas` does not call `setState` inside `requestAnimationFrame` and that `WorkSphereEngine` owns RAF.

- [ ] **Step 8: Run focused tests/typecheck**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs tests/work-sphere-geometry.test.mjs tests/work-sphere-control.test.mjs
npm run typecheck
```

- [ ] **Step 9: Commit**

```bash
git add src/webgl/workSphere src/components/WorkPage/WorkSphereCanvas.tsx tests/work-page-contract.test.mjs
git commit -m "feat: render rectangular spherical work gallery"
```

---

### Task 6: Implement hidden preload, poster atlas and bounded live-video texture pool

**Files:**
- Create: `src/webgl/workSphere/mediaPool.ts`
- Create: `src/webgl/workSphere/quality.ts`
- Create: `public/work/README.md`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Test: `tests/work-media-priority.test.mjs`

**Interfaces:**
- `rankMediaPriorities(slots, activeSlotId, hoverSlotId): MediaPriority[]`.
- `WorkPreviewMediaPool.prepareInitial(projects, initialPriorityIds): Promise<void>`.
- `WorkPreviewMediaPool.updatePriorities(priorities)`.
- `WorkPreviewMediaPool.bindForSlot(slotId): MediaBinding`.
- `WorkPreviewMediaPool.destroy()`.
- `chooseWorkQuality({ width, dpr, reducedMotion, hardwareConcurrency }): WorkQualityProfile`.

- [ ] **Step 1: Write failing priority tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { selectLiveVideoSlots } from '../src/webgl/workSphere/mediaPool.ts';

test('live preview pool is capped at three projects', () => {
  const ranked = [4, 2, 9, 5, 3].map((slotId, rank) => ({ slotId, rank }));
  assert.deepEqual(selectLiveVideoSlots(ranked, 3), [4, 2, 9]);
});

test('hovered project takes priority without increasing pool size', () => {
  const ranked = [1, 2, 3, 4].map((slotId, rank) => ({ slotId, rank }));
  assert.deepEqual(selectLiveVideoSlots(ranked, 3, 4), [4, 1, 2]);
});
```

- [ ] **Step 2: Verify failure**

```bash
node --import=tsx --test tests/work-media-priority.test.mjs
```

- [ ] **Step 3: Implement poster atlas**

Load every project's poster through `ImageBitmap` where supported, draw into an offscreen atlas with fixed per-cell dimensions selected from quality profile, upload once, and keep all peripheral instances on this texture.

If an image fails, mark that project media unavailable and keep the shader on a neutral Weberaise-black placeholder surface; do not crash the whole sphere.

- [ ] **Step 4: Implement three-slot live video pool**

For each slot create/reuse muted, looped, `playsInline` `HTMLVideoElement` objects. Only high-priority projects are assigned. Use:

```ts
video.muted = true;
video.loop = true;
video.playsInline = true;
video.preload = 'auto';
```

Use `requestVideoFrameCallback` when available to set a dirty flag; `WorkSphereEngine` uploads with `texSubImage2D` only when dirty. Fall back to comparing `video.currentTime` during RAF if the callback API is unavailable.

- [ ] **Step 5: Implement seamless poster-to-video promotion**

The shader receives a per-instance media slot index. If no live slot exists, sample poster atlas. Once a live texture has decoded a valid frame (`readyState >= HAVE_CURRENT_DATA`), switch that instance on the next frame. Never switch to an undecoded black texture.

- [ ] **Step 6: Implement initial hidden readiness**

`prepareInitial` resolves when:

- WebGL textures exist;
- all initially visible project posters have uploaded successfully or recorded a handled failure;
- active preview video has either decoded a frame or exceeded a bounded 1200ms media warm-up window.

This promise drives `WorkOpening.ready`; neighbor/full-showcase videos never block `OUR WORKS` exit.

- [ ] **Step 7: Add media derivative contract**

`public/work/README.md` specifies per project:

```text
poster.webp            1600px-wide target, sharp still for sphere
browse.mp4             muted short loop, H.264 baseline/high compatibility
browse.webm            optional VP9/AV1 derivative when supported
showcase-poster.webp   large still matching full video opening frame
showcase.mp4           high-quality walkthrough loaded on project demand
```

Require the poster and first browse frame to use the same crop/composition. Do not set one universal bitrate in code; encode assets offline to visual quality and profile real decode cost.

- [ ] **Step 8: Add page-visibility lifecycle**

On `document.visibilitychange`, pause live previews and stop sphere RAF while hidden. Resume selected live slots and RAF intentionally when visible.

- [ ] **Step 9: Run tests/typecheck**

```bash
node --import=tsx --test tests/work-media-priority.test.mjs
npm run typecheck
```

- [ ] **Step 10: Commit**

```bash
git add src/webgl/workSphere public/work/README.md tests/work-media-priority.test.mjs
git commit -m "feat: add bounded work preview media pipeline"
```

---

### Task 7: Add sphere entrance, active metadata, hover override, pointer/touch/keyboard selection

**Files:**
- Create: `src/components/WorkPage/WorkBrowseMeta.tsx`
- Modify: `src/components/WorkPage/WorkPage.tsx`
- Modify: `src/components/WorkPage/WorkSphereCanvas.tsx`
- Modify: `src/components/WorkPage/WorkPage.module.css`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `tests/work-page-contract.test.mjs`

**Interfaces:**
- Work sphere reports `{ slotId, projectIndex }` for active/hover/activate events.
- `WorkBrowseMeta({ project, visible, moving })` renders only name/category.
- `WorkPage` handles ArrowLeft/Right/Up/Down, Enter/Space and stores active slot/project identity.

- [ ] **Step 1: Add failing interaction contract assertions**

Assert source contains:

```js
assert.match(read('src/components/WorkPage/WorkBrowseMeta.tsx'), /category/);
assert.doesNotMatch(read('src/components/WorkPage/WorkBrowseMeta.tsx'), /brief|year|services/);
const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
assert.match(engine, /pointerdown/);
assert.match(engine, /pointermove/);
assert.match(engine, /setHoverSlot/);
```

- [ ] **Step 2: Implement ReactBits-inspired sphere entrance**

During `sphereEntering`, keep canvas wrapper visible but set engine entrance progress from `0 → 1` over about `0.9s` using GSAP. Map progress to scene scale:

```ts
const startScale = reducedMotion ? 1.08 : 3.2;
const sceneScale = startScale + (1 - startScale) * easedProgress;
```

Use `power3.out`; this keeps the approved oversized-to-normal character while avoiding literal `5x` clipping with larger rectangular tiles. Interaction remains disabled until progress reaches 1.

- [ ] **Step 3: Implement active metadata**

Render only active project name and category. While `movementActive` is true, reduce opacity/translate slightly; once motion settles, bring it back. Do not swap metadata on every frame—engine only emits when active slot identity changes.

- [ ] **Step 4: Implement hover override**

On fine pointers, engine picking during non-drag pointer movement emits hover slot. While hovered:

- call `controller.setExternalDamping(true)` so residual inertia rapidly settles;
- prioritize hovered media slot;
- use hovered project for metadata;
- do not force immediate center snap.

On pointer leave, clear hover and return metadata to positional active project.

- [ ] **Step 5: Distinguish click from drag**

Store pointer-down position/time. Treat pointer-up as activation only when travel is less than `8px` desktop / `12px` coarse pointer and duration is under `450ms`. Drag release never opens a project.

Touch rule: tapping an off-center project first calls `snapToSlot(slotId)`; only tapping the already active/front project opens it.

- [ ] **Step 6: Implement keyboard semantics**

When sphere is interactive and focus is within Work gallery:

- arrows call `snapToSlot(nextKeyboardSlot(...))`;
- Enter/Space opens active project;
- expose an offscreen semantic list of project buttons with `aria-current` for active identity so screen-reader users can select directly.

- [ ] **Step 7: Run tests/typecheck**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs tests/work-sphere-control.test.mjs tests/work-media-priority.test.mjs
npm run typecheck
```

- [ ] **Step 8: Commit**

```bash
git add src/components/WorkPage src/webgl/workSphere tests/work-page-contract.test.mjs
git commit -m "feat: add interactive work sphere browsing"
```

---

### Task 8: Build screen-space project handoff and compact native project showcase

**Files:**
- Create: `src/components/WorkPage/ProjectTransitionBridge.tsx`
- Create: `src/components/WorkPage/ProjectShowcase.tsx`
- Modify: `src/components/WorkPage/WorkPage.tsx`
- Modify: `src/components/WorkPage/WorkPage.module.css`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `tests/work-page-contract.test.mjs`

**Interfaces:**
- `ProjectTransitionBridge` receives `sourceBounds: ScreenBounds`, `project`, `direction: 'open' | 'close'`, `onComplete`.
- `ProjectShowcase({ project, onReturn })` owns native `<video controls preload="metadata">` and minimal project data.
- Engine supports `setProjectOpening(slotId, progress)` so non-selected projects recede coherently while DOM bridge expands.

- [ ] **Step 1: Add failing showcase contract assertions**

```js
const showcase = read('src/components/WorkPage/ProjectShowcase.tsx');
assert.match(showcase, /controls/);
assert.match(showcase, /preload="metadata"/);
assert.match(showcase, /Visit Website/);
assert.match(showcase, /services/);
assert.match(showcase, /year/);
assert.doesNotMatch(showcase, /tech stack|testimonial|conversion rate/i);
```

- [ ] **Step 2: Verify failure**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs
```

- [ ] **Step 3: Implement project-opening freeze and source measurement**

When activation occurs:

1. dispatch `OPEN_PROJECT`;
2. engine disables pointer input and zeroes inertial velocity;
3. read `engine.getSlotScreenBounds(slotId)`;
4. snapshot orientation with `engine.getOrientationSnapshot()`;
5. mount transition bridge at those exact CSS pixel bounds.

- [ ] **Step 4: Implement sphere reorganization**

`setProjectOpening(slotId, progress)` scales non-selected instances toward `0.72`, moves them radially away from selected screen direction, and fades them only modestly. Selected WebGL project remains stable until DOM bridge visually covers it. No random particle/explosion motion.

- [ ] **Step 5: Implement DOM transition bridge**

Bridge starts fixed at measured source bounds with the selected project's sharp poster. Animate to a large viewport-contained destination using GSAP `left/top/width/height/borderRadius`. Once bridge is opaque and aligned, hide the selected WebGL instance; when destination settles, dispatch `PROJECT_OPENED` and stop sphere RAF.

- [ ] **Step 6: Implement compact `ProjectShowcase`**

Use structure:

```tsx
<section aria-labelledby={`work-${project.slug}-title`}>
  <button type="button" onClick={onReturn}>Back to Work</button>
  <video
    poster={project.media.showcasePoster}
    src={project.media.showcaseVideo}
    controls
    preload="metadata"
    playsInline
  />
  <h1 id={`work-${project.slug}-title`}>{project.name}</h1>
  <p>{project.brief}</p>
  <dl>
    <div><dt>Services</dt><dd>{project.services.join(' / ')}</dd></div>
    <div><dt>Year</dt><dd>{project.year}</dd></div>
  </dl>
  <a href={project.liveUrl} target="_blank" rel="noreferrer">Visit Website ↗</a>
</section>
```

Do not autoplay the full video.

- [ ] **Step 7: Unlock normal scroll only in showcase state**

The Work root stops using fixed viewport layout for the detail portion and allows a compact vertical scroll. Keep the large video dominant at initial showcase viewport.

- [ ] **Step 8: Implement return choreography**

On return:

1. dispatch `RETURN_TO_SPHERE`;
2. reset showcase scroll to top for deterministic bridge geometry;
3. resume sphere RAF with stored orientation before it becomes visible;
4. restore selected slot and non-selected instance positions;
5. bridge animates from showcase video bounds back to fresh `getSlotScreenBounds(selectedSlotId)`;
6. reveal WebGL selected tile underneath;
7. unmount bridge and dispatch `SPHERE_RESTORED`;
8. restore keyboard focus to the semantic project button.

- [ ] **Step 9: Escape support**

In `projectShowcase`, Escape invokes return. During `projectOpening/projectReturning`, ignore repeated Escape/activation to prevent re-entry.

- [ ] **Step 10: Run tests/typecheck**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs tests/work-state.test.mjs
npm run typecheck
```

- [ ] **Step 11: Commit**

```bash
git add src/components/WorkPage src/webgl/workSphere/WorkSphereEngine.ts tests/work-page-contract.test.mjs
git commit -m "feat: transform work sphere into project showcase"
```

---

### Task 9: Add adaptive quality, reduced-motion path, mobile behavior and no-WebGL fallback

**Files:**
- Modify: `src/webgl/workSphere/quality.ts`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `src/components/WorkPage/WorkPage.tsx`
- Modify: `src/components/WorkPage/WorkFallback.tsx`
- Modify: `src/components/WorkPage/WorkPage.module.css`
- Modify: `tests/work-page-contract.test.mjs`

**Interfaces:**
- `chooseWorkQuality` returns `full | lite | mobile | reduced` values for DPR, deformation, live video count and inertia.
- `WorkFallback` opens the exact same `ProjectShowcase`; only browse navigation changes.

- [ ] **Step 1: Add quality/fallback contract tests**

Assert:

```js
const quality = read('src/webgl/workSphere/quality.ts');
const fallback = read('src/components/WorkPage/WorkFallback.tsx');
assert.match(quality, /dprCap/);
assert.match(quality, /liveVideoSlots/);
assert.match(fallback, /ProjectShowcase/);
assert.match(read('src/components/WorkPage/WorkPage.module.css'), /max-width: 720px/);
```

- [ ] **Step 2: Implement profiles**

Start with:

```ts
export const WORK_QUALITY_PROFILES = {
  full: { dprCap: 1.5, liveVideoSlots: 3, deformation: 1, inertia: 1 },
  lite: { dprCap: 1.2, liveVideoSlots: 2, deformation: 0.45, inertia: 0.8 },
  mobile: { dprCap: 1.15, liveVideoSlots: 1, deformation: 0.2, inertia: 0.62 },
  reduced: { dprCap: 1.0, liveVideoSlots: 1, deformation: 0, inertia: 0 },
} as const;
```

Select mobile when coarse pointer + viewport under 820px. Select lite for low logical core count (`hardwareConcurrency <= 4`) or very high DPR. Reduced motion always overrides inertia/deformation.

- [ ] **Step 3: Mobile composition changes**

On mobile:

- increase active/front project screen share;
- reduce neighboring live motion to zero/one slot as profile specifies;
- use stronger snap interpolation but no rigid step carousel;
- retain one-finger sphere drag;
- touch project activation follows the active-first rule from Task 7.

- [ ] **Step 4: Reduced-motion choreography**

Opening text still appears. Sphere entrance uses `scale 1.08 → 1`, short opacity settle. Inertia is disabled. Project opening/return uses short geometry/opacity handoff without large surrounding-project travel. Browse videos can remain muted but pause automatically if `prefers-reduced-motion` is active unless user explicitly interacts with the project.

- [ ] **Step 5: WebGL failure fallback**

If context/program creation throws, `WorkSphereCanvas` reports capability failure once. `WorkPage` switches to `WorkFallback`: an editorial responsive stack/grid of the same sharp project posters with project name/category. Selecting an item opens the same `ProjectShowcase` component. If no production projects exist, preserve the honest empty-data state.

- [ ] **Step 6: Run tests/typecheck**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs tests/work-media-priority.test.mjs tests/work-sphere-control.test.mjs
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/components/WorkPage src/webgl/workSphere tests/work-page-contract.test.mjs
git commit -m "feat: add responsive work sphere fallbacks"
```

---

### Task 10: Add real media validation hooks and development fixtures without shipping fake proof

**Files:**
- Create: `src/content/workProjectValidation.ts`
- Create: `tests/work-project-validation.test.mjs`
- Modify: `src/content/workProjects.ts`
- Modify: `public/work/README.md`

**Interfaces:**
- `validateWorkProject(project): string[]` returns explicit content/media errors.
- `assertWorkProjectsValid(projects)` throws in development/build for malformed real entries.

- [ ] **Step 1: Write validation tests with local fixtures**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateWorkProject } from '../src/content/workProjectValidation.ts';

const valid = {
  slug: 'fixture-a', name: 'Fixture A', category: 'WEB DESIGN', brief: 'Fixture brief.',
  services: ['Design'], year: '2026', liveUrl: 'https://example.com',
  media: {
    poster: '/work/fixture/poster.webp',
    browsePreview: '/work/fixture/browse.mp4',
    showcasePoster: '/work/fixture/showcase-poster.webp',
    showcaseVideo: '/work/fixture/showcase.mp4',
  },
};

test('valid project contract produces no errors', () => {
  assert.deepEqual(validateWorkProject(valid), []);
});

test('missing media and non-http live urls are rejected', () => {
  const errors = validateWorkProject({ ...valid, liveUrl: '#', media: { ...valid.media, browsePreview: '' } });
  assert.ok(errors.some(error => error.includes('liveUrl')));
  assert.ok(errors.some(error => error.includes('browsePreview')));
});
```

- [ ] **Step 2: Implement validation**

Require non-empty editorial fields, at least one service, 4-digit year string, `http://` or `https://` live URL, and all four media paths. This gives later asset population a precise failure instead of a broken black surface.

- [ ] **Step 3: Keep fixtures test-only**

Do not put fixture client names into `WORK_PROJECTS`. Real project entries are added only with verified copy and media files.

- [ ] **Step 4: Run tests**

```bash
node --import=tsx --test tests/work-project-validation.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add src/content public/work/README.md tests/work-project-validation.test.mjs
git commit -m "test: validate work project media contracts"
```

---

### Task 11: Full verification, profiling and integration readiness

**Files:**
- Modify: `docs/IMPLEMENTATION_STATUS.md`
- Modify only if evidence requires correction: Work files from Tasks 1–10.

**Interfaces:**
- Produces a verified Work implementation ready for visual review and later navigation-branch reconciliation.

- [ ] **Step 1: Run the entire automated suite**

```bash
npm test
```

Expected: all existing homepage/navigation/ribbon tests plus Work tests PASS.

- [ ] **Step 2: Run TypeScript and production build**

```bash
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 3: Run development server and visually verify desktop**

```bash
npm run dev
```

At `/work`, verify with real media once populated:

- only `OUR WORKS` visible during opening;
- no spinner/progress UI;
- no black/blank flash between text and sphere;
- oversized-to-normal sphere entrance feels like the ReactBits reference without clipping;
- front website is sharp and readable;
- roughly 5–7 surfaces contribute visually, not a dense wall;
- drag works both axes;
- inertia stops controllably;
- snap is gentle;
- hover override damps motion and changes metadata without yanking project center;
- no more than three preview videos decode/play in full profile;
- peripheral projects remain crisp posters;
- clicking the project is not confused with dragging;
- project handoff maintains source spatial identity;
- native full video does not autoplay;
- return restores the exact prior sphere orientation/project.

- [ ] **Step 4: Verify mobile/touch**

Use browser responsive mode at widths 390px, 430px, 768px:

- sphere concept remains intact;
- one-finger drag does not scroll the document while gallery is interactive;
- off-center tap first selects/snaps rather than accidentally opening;
- active project dominates enough of the viewport to read;
- mobile uses at most one live preview slot;
- project showcase scroll and controls remain usable.

- [ ] **Step 5: Verify accessibility/reduced motion**

- keyboard arrows select projects;
- Enter/Space opens;
- Escape returns;
- focus returns to selected project control;
- semantic project names/categories exist outside canvas;
- `prefers-reduced-motion` removes inertia/large entrance travel;
- full video controls are keyboard operable;
- no audio autoplay.

- [ ] **Step 6: Verify lifecycle/performance**

Using Chrome Performance/Media panels:

- no first-drag shader compilation hitch after opening;
- RAF pauses when showcase fully owns viewport;
- hidden tab pauses sphere/video work;
- active project remains sharp at DPR cap;
- no more than quality-profile live videos are decoding;
- interaction stays near 60fps-class on the user's integrated-GPU machine under normal desktop view.

If frame time is too high, adjust in this order only: live neighbor count → peripheral frame cadence → poster promotion thresholds → DPR cap → deformation → slot/mesh complexity. Do not reduce active project media quality first.

- [ ] **Step 7: Update implementation status with measured evidence**

Record exact commands run, pass/fail results, tested viewport/device classes, live-video slot count, selected DPR caps and any visual tuning values changed from this plan.

- [ ] **Step 8: Commit verification/status corrections**

```bash
git add docs/IMPLEMENTATION_STATUS.md src/components/WorkPage src/webgl/workSphere src/content tests public/work package.json package-lock.json pnpm-lock.yaml THIRD_PARTY_NOTICES.md
git commit -m "docs: verify work spherical showcase"
```

---

## Branch Integration Note

Do not merge parallel homepage, floating-navigation or Services implementation into this branch during Tasks 1–11. Once Work passes independently, reconcile branches in a dedicated integration step. At that point the global navigation's `WORK` destination should route to `/work`, while homepage-only in-page Selected Work links may remain section anchors where intentionally used. Resolve the final navigation behavior against the newest navigation branch rather than editing a stale copy during Work implementation.

## ReactBits Adaptation Boundary

The implementation may use the following reference ideas/source structures with attribution as necessary:

- virtual arcball pointer projection;
- quaternion accumulation;
- angular velocity smoothing;
- nearest-direction snap calculation;
- instanced spherical placement concept;
- oversized-to-normal demo entrance character.

The implementation must independently own:

- rectangular geometry and rounded clipping;
- curated slot density/repeat placement;
- project picking/hover semantics;
- video/poster media pool;
- quality profiles;
- project transition bridge;
- compact showcase UI;
- accessibility/fallback behavior.

This avoids turning ReactBits `InfiniteMenu.tsx` into an increasingly patched vendor file and keeps the Weberaise Work system maintainable.