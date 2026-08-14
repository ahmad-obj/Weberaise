# Work Spherical Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/work` as the approved `OUR WORKS → spherical project world → compact project showcase → preserved sphere return` experience.

**Architecture:** React owns semantic experience state, opening/showcase UI, accessibility, focus and scroll locking. A non-React `WorkSphereEngine` owns WebGL2 rendering, spherical placement, arcball/quaternion movement, inertia, magnetic snapping, picking and projection. A bounded `WorkPreviewMediaPool` keeps all projects poster-ready but allows only a few live browse videos, and a measured screen-space transition bridge hands the selected canvas project into a native DOM/video showcase.

**Tech Stack:** Next.js 16.3.0 App Router, React 19.2.8, TypeScript 7.0.2, GSAP 3.15.0, WebGL2, `gl-matrix` ^3.4.3, CSS Modules, existing Weberaise design tokens/fonts, Node test runner through `tsx`.

## Global Constraints

- Branch: `feature/work-spherical-showcase`.
- Design source of truth: `docs/superpowers/specs/2026-08-13-work-spherical-showcase-design.md`.
- Primary reference: `https://reactbits.dev/components/infinite-menu` plus `DavidHDev/react-bits/src/ts-default/Components/InfiniteMenu/InfiniteMenu.tsx` and `InfiniteMenuDemo.jsx`.
- Preserve the core spherical interaction. Do not replace it with a carousel, cylinder, grid or flat free-pan field.
- Initial visual state is only `OUR WORKS`: no visible projects, sphere, spinner, progress indicator, particles or decorative 3D background.
- Sphere entrance keeps the ReactBits demo character: oversized field settling into normal scale, tuned for Weberaise rectangles rather than blindly using literal `scale(5)`.
- Project surfaces are large landscape rectangles with restrained rounded corners, never circular discs.
- Normal desktop composition should read as roughly 5–7 visible contributors, with one dominant front item and generous empty space.
- Browse state shows only project name + category.
- Browse previews are short, muted website videos. Full project video never autoplays.
- Initial live browse pool cap: 3 projects on full desktop profile, fewer on weaker/mobile profiles.
- Expanded project content is only name, short brief, services, year and live website link.
- No fake clients, metrics, testimonials, awards or outcome claims.
- Returning from a project restores the prior sphere orientation and selected project.
- Hover is enhancement only. Touch, keyboard and assistive-technology paths must be complete.
- Respect `prefers-reduced-motion: reduce`.
- Provide a purposeful no-WebGL fallback using the same content and `ProjectShowcase`.
- Protect active-project sharpness first. Reduce neighbor video activity, peripheral cadence, DPR and deformation before active media quality.
- Do not paste ReactBits `InfiniteMenu.tsx` wholesale. Adapt only useful math/control ideas into Weberaise-owned modules.
- Add ReactBits attribution/license notice if substantial source logic is adapted.
- Shared floating navigation is a parallel branch. Do not rebuild global navigation in this Work branch.
- Before editing App Router files, inspect installed Next.js 16 docs under `node_modules/next/dist/docs/`, as required by `AGENTS.md`.

---

## Locked File Structure

### Route/UI
- `src/app/work/page.tsx` — route metadata and page entry.
- `src/components/WorkPage/workState.ts` — explicit Work state reducer and guards.
- `src/components/WorkPage/WorkPage.tsx` — high-level orchestration, scroll lock, keyboard and state wiring.
- `src/components/WorkPage/WorkPage.module.css` — isolated responsive visual system.
- `src/components/WorkPage/WorkOpening.tsx` — `OUR WORKS` opening and simple exit.
- `src/components/WorkPage/WorkSphereCanvas.tsx` — React lifecycle adapter around engine.
- `src/components/WorkPage/WorkBrowseMeta.tsx` — name/category UI only.
- `src/components/WorkPage/ProjectTransitionBridge.tsx` — measured canvas→DOM and DOM→canvas handoff.
- `src/components/WorkPage/ProjectShowcase.tsx` — native large video + minimal project details.
- `src/components/WorkPage/WorkFallback.tsx` — no-WebGL fallback gallery using same showcase.

### Content/media
- `src/content/workProjects.ts` — production project records only.
- `src/content/workProjectValidation.ts` — runtime/build validation for real entries.
- `public/work/README.md` — media derivative naming and quality contract.

### WebGL
- `src/webgl/workSphere/types.ts` — public engine-facing types.
- `src/webgl/workSphere/constants.ts` — sphere/camera/performance tuning values.
- `src/webgl/workSphere/geometry.ts` — icosahedron directions, rectangular mesh and project-slot assignment.
- `src/webgl/workSphere/arcball.ts` — quaternion drag/inertia/snap math.
- `src/webgl/workSphere/selection.ts` — active/hover/keyboard target selection.
- `src/webgl/workSphere/projection.ts` — screen bounds + hit testing.
- `src/webgl/workSphere/shaders.ts` — rectangular poster/video shader and rounded-rect clipping.
- `src/webgl/workSphere/mediaPool.ts` — poster atlas + bounded live video textures.
- `src/webgl/workSphere/quality.ts` — full/lite/mobile/reduced profiles.
- `src/webgl/workSphere/WorkSphereEngine.ts` — WebGL lifecycle/render loop/public API.

### Dependency/licensing
- Modify `package.json`, `package-lock.json`, `pnpm-lock.yaml` for `gl-matrix`.
- Create `THIRD_PARTY_NOTICES.md`.

### Tests
- `tests/work-state.test.mjs`
- `tests/work-sphere-geometry.test.mjs`
- `tests/work-sphere-control.test.mjs`
- `tests/work-media-priority.test.mjs`
- `tests/work-project-validation.test.mjs`
- `tests/work-page-contract.test.mjs`

---

### Task 1: Establish project contracts, dependency, validation and Work state machine

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `pnpm-lock.yaml`
- Create: `THIRD_PARTY_NOTICES.md`
- Create: `src/content/workProjects.ts`
- Create: `src/content/workProjectValidation.ts`
- Create: `src/components/WorkPage/workState.ts`
- Test: `tests/work-state.test.mjs`
- Test: `tests/work-project-validation.test.mjs`

**Interfaces:**
- Produces `WorkProject`, `WorkProjectMedia`, `WORK_PROJECTS`.
- Produces `validateWorkProject(project): string[]` and `assertWorkProjectsValid(projects): void`.
- Produces `WorkExperienceState`, `WorkAction`, `workReducer`, `INITIAL_WORK_STATE`.

- [ ] **Step 1: Write failing reducer tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_WORK_STATE, workReducer } from '../src/components/WorkPage/workState.ts';

test('approved work state sequence is guarded', () => {
  let state = INITIAL_WORK_STATE;
  state = workReducer(state, { type: 'OPENING_READY' });
  assert.equal(state.phase, 'sphereEntering');
  state = workReducer(state, { type: 'SPHERE_ENTERED' });
  assert.equal(state.phase, 'sphereInteractive');
  state = workReducer(state, { type: 'OPEN_PROJECT', projectSlug: 'fixture-a', slotId: 3 });
  assert.equal(state.phase, 'projectOpening');
  state = workReducer(state, { type: 'PROJECT_OPENED' });
  assert.equal(state.phase, 'projectShowcase');
  state = workReducer(state, { type: 'RETURN_TO_SPHERE' });
  assert.equal(state.phase, 'projectReturning');
  state = workReducer(state, { type: 'SPHERE_RESTORED' });
  assert.equal(state.phase, 'sphereInteractive');
  assert.equal(state.selectedProjectSlug, 'fixture-a');
  assert.equal(state.selectedSlotId, 3);
});

test('project opening is rejected before sphere interaction', () => {
  assert.deepEqual(
    workReducer(INITIAL_WORK_STATE, { type: 'OPEN_PROJECT', projectSlug: 'fixture-a', slotId: 1 }),
    INITIAL_WORK_STATE,
  );
});

test('empty production data has an explicit terminal phase', () => {
  const state = workReducer(INITIAL_WORK_STATE, { type: 'EMPTY_PROJECTS' });
  assert.equal(state.phase, 'empty');
});
```

- [ ] **Step 2: Write project validation tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateWorkProject } from '../src/content/workProjectValidation.ts';

const project = {
  slug: 'fixture-a',
  name: 'Fixture A',
  category: 'WEB DESIGN',
  brief: 'Fixture brief.',
  services: ['Design'],
  year: '2026',
  liveUrl: 'https://example.com',
  media: {
    poster: '/work/fixture/poster.webp',
    browsePreview: '/work/fixture/browse.mp4',
    showcasePoster: '/work/fixture/showcase-poster.webp',
    showcaseVideo: '/work/fixture/showcase.mp4',
  },
};

test('valid project contract has no errors', () => {
  assert.deepEqual(validateWorkProject(project), []);
});

test('invalid live url and missing browse media are rejected', () => {
  const errors = validateWorkProject({
    ...project,
    liveUrl: '#',
    media: { ...project.media, browsePreview: '' },
  });
  assert.ok(errors.some(error => error.includes('liveUrl')));
  assert.ok(errors.some(error => error.includes('browsePreview')));
});
```

- [ ] **Step 3: Run tests and verify failure**

```bash
node --import=tsx --test tests/work-state.test.mjs tests/work-project-validation.test.mjs
```

Expected: FAIL because implementation files do not exist.

- [ ] **Step 4: Add `gl-matrix` and synchronize both existing lockfiles**

```bash
npm install gl-matrix@^3.4.3
pnpm install --lockfile-only
```

Confirm all three package files contain `gl-matrix`.

- [ ] **Step 5: Implement project types and production data container**

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

The production array stays empty until verified real project copy/media is supplied. Test fixtures remain inside tests and never ship as client proof.

- [ ] **Step 6: Implement validation**

Require non-empty slug/name/category/brief, at least one service, a four-digit year, an `http://` or `https://` live URL, and all four media paths. `assertWorkProjectsValid` throws one combined error listing project slug + invalid fields.

- [ ] **Step 7: Implement explicit state machine including the honest empty-data path**

```ts
export type WorkPhase =
  | 'opening'
  | 'empty'
  | 'sphereEntering'
  | 'sphereInteractive'
  | 'projectOpening'
  | 'projectShowcase'
  | 'projectReturning';
```

`EMPTY_PROJECTS` is accepted only from `opening`. `OPEN_PROJECT` is accepted only from `sphereInteractive`. `SPHERE_RESTORED` preserves selected slug/slot.

- [ ] **Step 8: Add ReactBits notice**

`THIRD_PARTY_NOTICES.md` names ReactBits, repository URL, David Haz copyright, MIT + Commons Clause condition and states Weberaise adapts interaction/math concepts rather than redistributing the component library.

- [ ] **Step 9: Run focused tests**

```bash
node --import=tsx --test tests/work-state.test.mjs tests/work-project-validation.test.mjs
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json pnpm-lock.yaml THIRD_PARTY_NOTICES.md src/content/workProjects.ts src/content/workProjectValidation.ts src/components/WorkPage/workState.ts tests/work-state.test.mjs tests/work-project-validation.test.mjs
git commit -m "feat: establish work showcase contracts"
```

---

### Task 2: Build the `/work` route, `OUR WORKS` opening and high-level page shell

**Files:**
- Create: `src/app/work/page.tsx`
- Create: `src/components/WorkPage/WorkPage.tsx`
- Create: `src/components/WorkPage/WorkOpening.tsx`
- Create: `src/components/WorkPage/WorkFallback.tsx`
- Create: `src/components/WorkPage/WorkPage.module.css`
- Test: `tests/work-page-contract.test.mjs`

**Interfaces:**
- `WorkPage({ projects }: { projects: readonly WorkProject[] })` owns reducer, readiness, focus and scroll lock.
- `WorkOpening({ ready, reducedMotion, onComplete })` exits only after minimum visual beat + readiness.
- Empty production project arrays flow `opening → empty` and unlock normal page scrolling.

- [ ] **Step 1: Inspect installed Next.js docs**

```bash
find node_modules/next/dist/docs -type f | grep -E 'app.*page|metadata|route' | head -30
```

Read the App Router page and metadata guidance returned before creating the route.

- [ ] **Step 2: Write failing route/opening contract test**

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('work route uses the dedicated work page', () => {
  assert.match(read('src/app/work/page.tsx'), /WorkPage/);
});

test('opening is only OUR WORKS and never exposes fake loading UI', () => {
  const opening = read('src/components/WorkPage/WorkOpening.tsx');
  assert.match(opening, /OUR WORKS/);
  assert.doesNotMatch(opening, /spinner|percentage|loading projects/i);
});

test('work styling contains reduced-motion and scroll-lock contracts', () => {
  const css = read('src/components/WorkPage/WorkPage.module.css');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /work-page-scroll-locked/);
});
```

- [ ] **Step 3: Verify failure**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs
```

- [ ] **Step 4: Implement route and metadata**

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

- [ ] **Step 5: Implement page reducer wiring and correct scroll-lock rule**

Use:

```ts
const shouldLockScroll =
  state.phase !== 'projectShowcase' && state.phase !== 'empty';

document.documentElement.classList.toggle(
  'work-page-scroll-locked',
  shouldLockScroll,
);
```

Clean the class on unmount. If `projects.length === 0`, `WorkOpening` uses `ready=true`, then its completion dispatches `EMPTY_PROJECTS` instead of `OPENING_READY`.

- [ ] **Step 6: Implement restrained opening**

Opening minimum visual beat: `900ms`. Once ready, exit text with clipped upward movement and light opacity support. Use approximately `0.34s` normal / `0.16s` reduced motion. No 3D transform, letter explosion or project imagery.

- [ ] **Step 7: Implement honest empty state**

After `opening → empty`, render a minimal message such as `SELECTED WORK IS BEING PREPARED.` plus a home link. No project names or client claims.

- [ ] **Step 8: Implement isolated CSS**

Core:

```css
.page { min-height: 100svh; background: var(--wr-black); color: var(--wr-white); }
.viewport { position: fixed; inset: 0; overflow: hidden; }
.opening { position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; }
.openingText { font: 800 clamp(64px, 11vw, 190px)/.82 var(--font-hero), Arial, sans-serif; letter-spacing: -.07em; }
:global(html.work-page-scroll-locked),
:global(html.work-page-scroll-locked body) { overflow: hidden; height: 100%; overscroll-behavior: none; }
```

Add responsive and `prefers-reduced-motion` rules.

- [ ] **Step 9: Verify complete task**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs
npm run typecheck
```

Expected: PASS. The branch compiles at the end of Task 2; unlike the earlier draft plan, no route is committed before its component exists.

- [ ] **Step 10: Commit**

```bash
git add src/app/work src/components/WorkPage tests/work-page-contract.test.mjs
git commit -m "feat: add work page opening shell"
```

---

### Task 3: Implement sphere slot geometry and rectangular project mesh

**Files:**
- Create: `src/webgl/workSphere/types.ts`
- Create: `src/webgl/workSphere/constants.ts`
- Create: `src/webgl/workSphere/geometry.ts`
- Test: `tests/work-sphere-geometry.test.mjs`

**Interfaces:**
- `SphereSlot { id: number; direction: [number, number, number]; projectIndex: number }`.
- `createIcosahedronDirections(): readonly Vec3[]`.
- `buildProjectSlots(projectCount: number): readonly SphereSlot[]`.
- `createProjectQuad(): { positions: Float32Array; uvs: Float32Array; indices: Uint16Array }`.

- [ ] **Step 1: Write failing geometry tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProjectSlots, createIcosahedronDirections, createProjectQuad } from '../src/webgl/workSphere/geometry.ts';

test('base sphere uses twelve normalized icosahedron directions', () => {
  const dirs = createIcosahedronDirections();
  assert.equal(dirs.length, 12);
  for (const [x, y, z] of dirs) assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 1e-6);
});

test('six projects repeat on antipodal pairs', () => {
  const slots = buildProjectSlots(6);
  assert.equal(slots.length, 12);
  for (let projectIndex = 0; projectIndex < 6; projectIndex += 1) {
    const pair = slots.filter(slot => slot.projectIndex === projectIndex);
    assert.equal(pair.length, 2);
    const dot = pair[0].direction.reduce((sum, value, i) => sum + value * pair[1].direction[i], 0);
    assert.ok(dot < -0.99);
  }
});

test('project geometry is a landscape quad', () => {
  assert.deepEqual(Array.from(createProjectQuad().indices), [0, 1, 2, 0, 2, 3]);
});
```

- [ ] **Step 2: Verify failure**

```bash
node --import=tsx --test tests/work-sphere-geometry.test.mjs
```

- [ ] **Step 3: Implement central tuning constants**

```ts
export const WORK_SPHERE = {
  radius: 4.4,
  projectWidth: 1.55,
  projectHeight: 0.96,
  cameraZ: 7.35,
  liveVideoSlots: 3,
  dprCapFull: 1.5,
  dprCapLite: 1.2,
} as const;
```

- [ ] **Step 4: Implement 12 normalized icosahedron directions and antipodal repeat assignment**

For six initial projects, every duplicate sits on the opposite side of the sphere, preventing the same project from being simultaneously prominent front/back. For other counts, fill unique project identities before deterministic wrapping.

- [ ] **Step 5: Implement unit landscape quad**

Four centered vertices, UVs 0–1, two triangles. Width/height applied in per-instance matrices.

- [ ] **Step 6: Verify and commit**

```bash
node --import=tsx --test tests/work-sphere-geometry.test.mjs
npm run typecheck
git add src/webgl/workSphere tests/work-sphere-geometry.test.mjs
git commit -m "feat: add work sphere geometry"
```

---

### Task 4: Implement arcball drag, inertia, soft snapping and deterministic selection helpers

**Files:**
- Create: `src/webgl/workSphere/arcball.ts`
- Create: `src/webgl/workSphere/selection.ts`
- Test: `tests/work-sphere-control.test.mjs`

**Interfaces:**
- `ArcballController.pointerDown(x,y)`, `pointerMove(x,y)`, `pointerUp()`.
- `ArcballController.update(deltaMs): ArcballSnapshot`.
- `ArcballController.setSnapTarget(direction | null)`.
- `decayAngularVelocity(value, deltaMs, reducedMotion): number`.
- `findNearestSlot(...)` and `nextKeyboardSlot(current, delta, slotCount)`.

- [ ] **Step 1: Write failing control tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { decayAngularVelocity } from '../src/webgl/workSphere/arcball.ts';
import { nextKeyboardSlot } from '../src/webgl/workSphere/selection.ts';

test('inertia decays to rest', () => {
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

test('keyboard order wraps', () => {
  assert.equal(nextKeyboardSlot(0, -1, 12), 11);
  assert.equal(nextKeyboardSlot(11, 1, 12), 0);
});
```

- [ ] **Step 2: Adapt ReactBits arcball concepts into a focused Weberaise controller**

Use `gl-matrix` `quat`, `vec2`, `vec3`. Separate event binding from math. Use time-correct inertia:

```ts
export function decayAngularVelocity(value: number, deltaMs: number, reducedMotion: boolean) {
  if (reducedMotion) return 0;
  return value * Math.exp(-deltaMs / 360);
}
```

Begin magnetic snap only when pointer is up and absolute angular velocity is below `0.055`. Snap factor per frame: `1 - Math.exp(-deltaMs / 260)`.

- [ ] **Step 3: Implement nearest/front and keyboard selection**

Nearest slot = max dot product of front direction and each oriented slot direction. Keyboard order is deterministic and simply requests the same visual snap engine.

- [ ] **Step 4: Verify and commit**

```bash
node --import=tsx --test tests/work-sphere-control.test.mjs
npm run typecheck
git add src/webgl/workSphere/arcball.ts src/webgl/workSphere/selection.ts tests/work-sphere-control.test.mjs
git commit -m "feat: add sphere controls and snapping"
```

---

### Task 5: Build the direct-WebGL rectangular sphere renderer, projection and picking

**Files:**
- Create: `src/webgl/workSphere/shaders.ts`
- Create: `src/webgl/workSphere/projection.ts`
- Create: `src/webgl/workSphere/WorkSphereEngine.ts`
- Create: `src/components/WorkPage/WorkSphereCanvas.tsx`
- Modify: `tests/work-page-contract.test.mjs`

**Interfaces:**
- `WorkSphereEngine(canvas, projects, callbacks, options)`.
- Engine public methods: `start`, `stop`, `destroy`, `setInteractive`, `setEntranceProgress`, `setHoverSlot`, `snapToSlot`, `getSlotScreenBounds`, `getOrientationSnapshot`, `restoreOrientation`.
- Callbacks: `onReady`, `onActiveSlotChange`, `onMovementChange`, `onProjectActivate`, `onCapabilityFailure`.
- `ScreenBounds = { left; top; width; height }`.

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

- [ ] **Step 2: Implement shaders**

Vertex shader uses one unit quad + per-instance matrix. Movement deformation is tangential and capped to roughly 2% of project width. Fragment shader clips corners with a rounded-rectangle signed-distance mask using `fwidth`, so corners anti-alias without blurring website pixels.

- [ ] **Step 3: Implement instanced renderer**

Per frame:

1. update arcball controller;
2. rotate slot directions;
3. center each instance at `direction * radius`;
4. orient tangent to sphere;
5. apply depth hierarchy and configured width/height;
6. write all matrices into one typed array;
7. one `bufferSubData` upload;
8. one instanced draw.

Keep React out of the frame loop.

- [ ] **Step 4: Implement projection + picking**

Project all four quad corners through current matrices to CSS pixel bounds. Pointer picking evaluates only front-facing visible slots, ordered nearest-to-camera, and selects the frontmost rectangle containing the pointer.

- [ ] **Step 5: Implement React adapter**

`WorkSphereCanvas` creates exactly one engine per project-set identity, forwards only meaningful callback boundaries, never sets React state per RAF, and destroys GL/media resources on unmount.

- [ ] **Step 6: Verify**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs tests/work-sphere-geometry.test.mjs tests/work-sphere-control.test.mjs
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/webgl/workSphere src/components/WorkPage/WorkSphereCanvas.tsx tests/work-page-contract.test.mjs
git commit -m "feat: render rectangular spherical work gallery"
```

---

### Task 6: Implement poster readiness and bounded live preview video textures

**Files:**
- Create: `src/webgl/workSphere/mediaPool.ts`
- Create: `src/webgl/workSphere/quality.ts`
- Create: `public/work/README.md`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Test: `tests/work-media-priority.test.mjs`

**Interfaces:**
- `selectLiveVideoSlots(ranked, maxSlots, hoverSlotId?)`.
- `WorkPreviewMediaPool.prepareInitial(projects, initialPriorityIds): Promise<void>`.
- `updatePriorities`, `bindForSlot`, `pauseAll`, `resumePriority`, `destroy`.
- `chooseWorkQuality(...)`.

- [ ] **Step 1: Write failing pool-cap tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { selectLiveVideoSlots } from '../src/webgl/workSphere/mediaPool.ts';

test('desktop live pool never exceeds three', () => {
  const ranked = [4, 2, 9, 5, 3].map((slotId, rank) => ({ slotId, rank }));
  assert.deepEqual(selectLiveVideoSlots(ranked, 3), [4, 2, 9]);
});

test('hover gets first priority without growing the pool', () => {
  const ranked = [1, 2, 3, 4].map((slotId, rank) => ({ slotId, rank }));
  assert.deepEqual(selectLiveVideoSlots(ranked, 3, 4), [4, 1, 2]);
});
```

- [ ] **Step 2: Implement poster atlas**

Load posters with `ImageBitmap` when supported, draw into offscreen atlas cells, upload once. Failed poster load records a handled media failure and renders a neutral brand-black surface instead of crashing GL.

- [ ] **Step 3: Implement bounded live video pool**

Each reused video is:

```ts
video.muted = true;
video.loop = true;
video.playsInline = true;
video.preload = 'auto';
```

Use `requestVideoFrameCallback` to mark texture dirty where supported; upload with `texSubImage2D` only when a decoded frame advances. Fall back to `currentTime` change detection.

- [ ] **Step 4: Seamless poster→video promotion**

Shader remains on poster until assigned video reports `readyState >= HTMLMediaElement.HAVE_CURRENT_DATA`. Never expose an undecoded black texture.

- [ ] **Step 5: Implement hidden readiness contract for `OUR WORKS`**

`prepareInitial` resolves when WebGL textures exist, initially visible posters have either uploaded or failed safely, and the active browse preview has decoded one frame **or** hit a bounded `1200ms` warm-up ceiling. Neighbor/full showcase videos never block entry.

- [ ] **Step 6: Define actual media derivative contract**

`public/work/README.md`:

```text
poster.webp            sharp sphere still, ~1600px-wide target
browse.mp4             muted short loop, web-friendly H.264
browse.webm            optional modern derivative
showcase-poster.webp   large still matching full video start frame
showcase.mp4           high-quality walkthrough loaded only on project demand
```

Poster and first browse frame must share crop/composition.

- [ ] **Step 7: Add page visibility lifecycle**

Hidden tab pauses videos + sphere RAF; returning tab resumes priority sources without uploading stale frames in a burst.

- [ ] **Step 8: Verify and commit**

```bash
node --import=tsx --test tests/work-media-priority.test.mjs
npm run typecheck
git add src/webgl/workSphere public/work/README.md tests/work-media-priority.test.mjs
git commit -m "feat: add bounded work preview media pipeline"
```

---

### Task 7: Wire sphere entrance, active metadata, hover override and input semantics

**Files:**
- Create: `src/components/WorkPage/WorkBrowseMeta.tsx`
- Modify: `src/components/WorkPage/WorkPage.tsx`
- Modify: `src/components/WorkPage/WorkSphereCanvas.tsx`
- Modify: `src/components/WorkPage/WorkPage.module.css`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `tests/work-page-contract.test.mjs`

**Interfaces:**
- Sphere callbacks expose active/hover/activate slot identity.
- `WorkBrowseMeta` renders only name/category.
- Keyboard requests same engine snap system rather than a separate carousel mode.

- [ ] **Step 1: Add failing metadata/input assertions**

```js
const meta = read('src/components/WorkPage/WorkBrowseMeta.tsx');
assert.match(meta, /category/);
assert.doesNotMatch(meta, /brief|year|services/);
const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
assert.match(engine, /pointerdown/);
assert.match(engine, /pointermove/);
assert.match(engine, /setHoverSlot/);
```

- [ ] **Step 2: Implement ReactBits-style sphere entrance**

During `sphereEntering`, animate engine progress `0 → 1` over about `0.9s`, `power3.out`.

```ts
const startScale = reducedMotion ? 1.08 : 3.2;
const sceneScale = startScale + (1 - startScale) * easedProgress;
```

Interaction remains disabled until settled.

- [ ] **Step 3: Implement browse metadata**

Name + category only. While throwing/dragging, de-emphasize metadata to prevent jitter; engine emits active changes only when identity actually changes.

- [ ] **Step 4: Implement hover override**

Fine pointer hover selects inspection metadata and highest media priority, rapidly damps remaining inertia, but does not yank project into center. Pointer leave restores positional active project.

- [ ] **Step 5: Separate click from drag**

Activation only when pointer travel is under `8px` desktop / `12px` coarse pointer and duration under `450ms`. Drag release never opens.

Touch: tapping off-center item first snaps/selects it; tapping already active/front item opens it.

- [ ] **Step 6: Implement semantic keyboard path**

Maintain offscreen semantic project buttons. Arrow keys request adjacent deterministic slot; Enter/Space opens active; visible focus indication remains in DOM. Core portfolio meaning is not canvas-only.

- [ ] **Step 7: Verify and commit**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs tests/work-sphere-control.test.mjs tests/work-media-priority.test.mjs
npm run typecheck
git add src/components/WorkPage src/webgl/workSphere tests/work-page-contract.test.mjs
git commit -m "feat: add interactive work sphere browsing"
```

---

### Task 8: Implement the canvas→native project showcase handoff and preserved return

**Files:**
- Create: `src/components/WorkPage/ProjectTransitionBridge.tsx`
- Create: `src/components/WorkPage/ProjectShowcase.tsx`
- Modify: `src/components/WorkPage/WorkPage.tsx`
- Modify: `src/components/WorkPage/WorkPage.module.css`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `tests/work-page-contract.test.mjs`

**Interfaces:**
- `ProjectTransitionBridge({ sourceBounds, project, direction, onComplete })`.
- `ProjectShowcase({ project, onReturn })`.
- Engine adds `setProjectOpening(slotId, progress)`.

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

- [ ] **Step 2: Freeze selected identity and measure source**

On activation: dispatch `OPEN_PROJECT`, disable engine input, zero inertia, snapshot orientation, then read `getSlotScreenBounds(slotId)`.

- [ ] **Step 3: Reorganize sphere coherently**

`setProjectOpening` makes non-selected items recede/scale toward ~`0.72` and shift away from selected direction. No particle explosion or random trajectories. Selected WebGL project remains visible until bridge covers it.

- [ ] **Step 4: Implement measured fixed-position bridge**

Bridge starts exactly on source bounds using sharp project poster/current visual. GSAP animates fixed `left/top/width/height/borderRadius` into large viewport-contained destination. Once bridge fully covers selected GL tile, hide that one GL instance. At destination, stop sphere RAF and dispatch `PROJECT_OPENED`.

- [ ] **Step 5: Implement compact native showcase**

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

Full video is mounted only when the project is selected and never uses autoplay.

- [ ] **Step 6: Unlock normal scroll only after `PROJECT_OPENED`**

Large video dominates the initial showcase viewport; short information follows compactly.

- [ ] **Step 7: Implement return with preserved orientation**

On Back/Escape: dispatch `RETURN_TO_SPHERE`; resume engine using stored orientation before reveal; compute fresh selected-slot bounds; bridge returns to them; reveal GL tile underneath; restore neighbors; dispatch `SPHERE_RESTORED`; return focus to selected semantic project button.

- [ ] **Step 8: Prevent transition re-entry**

Ignore click/Enter/Escape state-changing input during `projectOpening` and `projectReturning` except the active timeline's own completion.

- [ ] **Step 9: Verify and commit**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs tests/work-state.test.mjs
npm run typecheck
git add src/components/WorkPage src/webgl/workSphere/WorkSphereEngine.ts tests/work-page-contract.test.mjs
git commit -m "feat: transform work sphere into project showcase"
```

---

### Task 9: Add adaptive quality, mobile/reduced-motion behavior and no-WebGL fallback

**Files:**
- Modify: `src/webgl/workSphere/quality.ts`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `src/components/WorkPage/WorkPage.tsx`
- Modify: `src/components/WorkPage/WorkFallback.tsx`
- Modify: `src/components/WorkPage/WorkPage.module.css`
- Modify: `tests/work-page-contract.test.mjs`

**Interfaces:**
- Quality profile values control DPR, live-video count, deformation and inertia.
- Fallback selection opens exact same `ProjectShowcase`.

- [ ] **Step 1: Add source assertions for quality/fallback**

```js
const quality = read('src/webgl/workSphere/quality.ts');
assert.match(quality, /dprCap/);
assert.match(quality, /liveVideoSlots/);
assert.match(read('src/components/WorkPage/WorkFallback.tsx'), /ProjectShowcase/);
```

- [ ] **Step 2: Implement initial quality profiles**

```ts
export const WORK_QUALITY_PROFILES = {
  full: { dprCap: 1.5, liveVideoSlots: 3, deformation: 1, inertia: 1 },
  lite: { dprCap: 1.2, liveVideoSlots: 2, deformation: 0.45, inertia: 0.8 },
  mobile: { dprCap: 1.15, liveVideoSlots: 1, deformation: 0.2, inertia: 0.62 },
  reduced: { dprCap: 1.0, liveVideoSlots: 1, deformation: 0, inertia: 0 },
} as const;
```

Mobile when coarse pointer + viewport under 820px. Lite for `hardwareConcurrency <= 4` or extreme DPR. Reduced motion overrides inertia/deformation.

- [ ] **Step 3: Mobile adaptation**

Keep the same sphere. Increase active project screen share, reduce meaningful neighbors, use at most one live browse slot, preserve one-finger drag and slightly stronger magnetic settling. Do not convert to a normal carousel/list unless WebGL fallback is required.

- [ ] **Step 4: Reduced motion**

Opening text remains. Sphere entrance becomes `1.08 → 1` plus short opacity settle. Inertia = 0. Project open/close uses short shared geometry/opacity handoff. Automatic browse video pauses under reduced motion until direct gallery interaction.

- [ ] **Step 5: Intentional WebGL capability fallback**

Context/program failure reports once to WorkPage. `WorkFallback` renders an editorial responsive poster collection with name/category; selecting an item opens the same `ProjectShowcase`. Empty production data still uses `empty`, not fake examples.

- [ ] **Step 6: Verify and commit**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs tests/work-media-priority.test.mjs tests/work-sphere-control.test.mjs
npm run typecheck
git add src/components/WorkPage src/webgl/workSphere tests/work-page-contract.test.mjs
git commit -m "feat: add responsive work sphere fallbacks"
```

---

### Task 10: Full automated verification and production build

**Files:**
- Modify only files proven incorrect by verification.

- [ ] **Step 1: Run entire test suite**

```bash
npm test
```

Expected: all existing homepage/navigation/ribbon tests plus Work tests PASS.

- [ ] **Step 2: Run strict TypeScript**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: PASS and `/work` appears as a valid route.

- [ ] **Step 4: Inspect dependency/license diff**

Confirm only `gl-matrix` was added for this feature and `THIRD_PARTY_NOTICES.md` matches the ReactBits repository license condition currently present at implementation time.

- [ ] **Step 5: Commit corrections only if verification changed source**

Use one task-sized verification commit rather than many micro-commits.

---

### Task 11: Visual QA and performance acceptance with real project media

**Files:**
- Modify: `docs/IMPLEMENTATION_STATUS.md`
- Modify Work source only if visual/performance evidence requires tuning.

- [ ] **Step 1: Populate only verified real Work projects/media before visual acceptance**

Every entry must pass `assertWorkProjectsValid`. Media must follow `public/work/README.md`. Test fixtures do not enter production data.

- [ ] **Step 2: Desktop visual QA at `/work`**

Verify:

- only `OUR WORKS` during opening;
- hidden preparation produces no spinner/progress UI;
- no blank flash between text exit and sphere;
- oversized-to-normal sphere establishment clearly resembles the approved ReactBits entrance character;
- landscape previews, not circles;
- front website is sharp;
- normal composition reads as ~5–7 contributors, not dense clutter;
- two-axis drag feels direct;
- inertia is controlled;
- soft snap does not feel carousel-like;
- hover changes inspection target without violently snapping;
- full profile runs no more than 3 live browse previews;
- poster→video switch has no black frame;
- click never fires after a real drag;
- project remains spatially identifiable through expansion;
- full video does not autoplay;
- return restores prior sphere orientation/project.

- [ ] **Step 3: Tablet/mobile QA**

Test approximately 390px, 430px and 768px widths:

- same spherical concept preserved;
- touch drag blocks accidental page scroll while gallery owns viewport;
- off-center tap selects/snaps before opening;
- active project remains readable;
- mobile profile uses at most one live preview;
- native showcase controls and short content remain usable.

- [ ] **Step 4: Accessibility/reduced-motion QA**

- arrows select/snap;
- Enter/Space opens;
- Escape returns;
- focus returns to selected project;
- semantic project controls exist outside canvas;
- reduced motion removes inertia and large travel;
- no audio autoplay;
- full video controls keyboard-operable.

- [ ] **Step 5: Performance profiling**

Use Chrome Performance/Media panels on the user's integrated-GPU machine:

- no shader compilation hitch on first drag after opening;
- sphere RAF suspends during settled project showcase;
- hidden tab suspends video + RAF work;
- active project stays sharp under DPR cap;
- decoded live-video count matches profile;
- target is stable 60fps-class normal interaction.

If frame time misses target, tune in this exact order:

1. live neighbor count;
2. peripheral video update cadence;
3. poster/video promotion threshold;
4. canvas DPR cap;
5. movement deformation;
6. slot/mesh complexity.

Do not degrade active-project media first.

- [ ] **Step 6: Record measured evidence**

Update `docs/IMPLEMENTATION_STATUS.md` with exact commands, tested viewports, pass/fail results, chosen quality values, video-slot counts and any tuning changes.

- [ ] **Step 7: Commit final verified status**

```bash
git add docs/IMPLEMENTATION_STATUS.md src/components/WorkPage src/webgl/workSphere src/content public/work tests package.json package-lock.json pnpm-lock.yaml THIRD_PARTY_NOTICES.md
git commit -m "docs: verify work spherical showcase"
```

---

## Branch Integration Boundary

Do not merge parallel homepage, navigation or Services work during Tasks 1–11. Once Work passes independently, reconcile branches deliberately. At integration time, the newest global navigation implementation should route its dedicated `WORK` action to `/work`; homepage-only Selected Work anchors may remain section links where intentionally used. Resolve against the newest navigation branch instead of editing a stale nav copy here.

## ReactBits Adaptation Boundary

Allowed reference/adaptation targets:

- virtual arcball pointer projection;
- quaternion orientation accumulation;
- angular velocity smoothing;
- nearest-direction magnetic snap concept;
- instanced spherical placement concept;
- demo oversized-to-normal entrance character.

Weberaise-owned implementation areas:

- rectangular rounded project surfaces;
- curated slot density/repeat mapping;
- project picking + hover behavior;
- poster/video texture pool;
- quality profiles;
- project transition bridge;
- compact showcase UI;
- semantic keyboard/accessibility path;
- mobile/reduced-motion/no-WebGL behavior.

This keeps the Work system maintainable instead of turning ReactBits `InfiniteMenu.tsx` into a patched vendor component.