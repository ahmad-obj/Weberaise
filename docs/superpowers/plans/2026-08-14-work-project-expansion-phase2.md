# Weberaise Work Page — Phase 2 Project Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a stable one-interaction sphere → near-fullscreen project expansion → normal scrolling project view → exact-context return flow on top of the accepted 42-instance Infinite Menu sphere.

**Architecture:** Keep the sphere renderer responsible only for spatial state, one-shot picking, resolve-to-front, selected-instance visibility, peel progress, screen bounds, and orientation restore. React/GSAP owns visual ownership transfer, DOM expansion, normal-flow project content, scrolling, and reverse handoff. The selected DOM frame only takes ownership after the clicked slot is face-on and stable. Return restores that exact stored resolved face-on snapshot for DOM → WebGL handoff, then restores the exact pre-open browse snapshot after ownership is safely back in WebGL.

**Tech Stack:** Next.js 16.3.0 App Router, React 19.2.8, TypeScript 7.0.2, direct WebGL2, GSAP 3.15.0, existing dependency-free quaternion/matrix helpers. Do not add `gl-matrix` or any new runtime dependency.

## Global Constraints

- Preserve the accepted 42-slot once-subdivided icosphere, radius `2`, 4:3 website surfaces, base scale `0.34`, no tile wiggle, current arcball inertia, snap, camera pull-back, depth scaling/fade, and bounded media pool.
- One click/tap opens a project even if the clicked repeated instance is off-center; no two-click selection rule.
- Preserve exact clicked `slotId`, separate from `projectIndex`.
- Store **two** transition snapshots: `preOpenSnapshot` and `resolvedSnapshot`.
- No modal, route change, continuous picking loop, `readPixels`, canvas screenshot/readback, 42 DOM mirrors, or resurrected old transition-bridge architecture.
- Selected project expands to near-fullscreen with responsive margins, then the page becomes normal vertical scrolling.
- Other 41 sphere instances peel/recede/fade fully away before WebGL is stopped.
- WebGL RAF and sphere preview media must be stopped/paused throughout `projectViewing`.
- Return DOM → WebGL handoff occurs only from the stored `resolvedSnapshot`; after ownership transfer, WebGL restores `preOpenSnapshot`.
- Fine-pointer activation travel threshold: `8px`; coarse-pointer threshold: `14px`.
- Full-view content remains minimal: project name, 2–4 line brief, services, year, visit link, Back to Work.
- Reduced motion keeps the same content/state flow but uses short fades/scales and minimal spatial travel.

---

## File Structure

**Create**
- `src/webgl/workSphere/activation.ts` — pure click-vs-drag thresholds, slot hit-testing, alignment helpers, screen-rect projection helpers.
- `src/components/WorkPage/WorkProjectTransition.tsx` — fixed DOM handoff/expansion/return layer only.
- `src/components/WorkPage/WorkProjectView.tsx` — normal-flow expanded media and compact project information.
- `tests/work-project-activation.test.mjs` — pure activation / exact-slot / threshold / projection tests.
- `tests/work-project-transition-contract.test.mjs` — source-level orchestration/performance/accessibility contracts.

**Modify**
- `src/components/WorkPage/workState.ts`
- `src/webgl/workSphere/types.ts`
- `src/webgl/workSphere/shaders.ts`
- `src/webgl/workSphere/WorkSphereEngine.ts`
- `src/components/WorkPage/WorkSphereCanvas.tsx`
- `src/components/WorkPage/WorkPage.tsx`
- `src/components/WorkPage/WorkPage.module.css`
- `src/components/WorkPage/WorkFallback.tsx`
- `tests/work-state.test.mjs`
- `tests/work-page-contract.test.mjs`
- `tests/work-sphere-reference-contract.test.mjs`
- `docs/WORK_IMPLEMENTATION_STATUS.md`

---

### Task 1: Extend the Work state machine without coupling it to rendering

**Files:**
- Modify: `src/components/WorkPage/workState.ts`
- Modify: `tests/work-state.test.mjs`

**Produces:**

```ts
export type WorkPhase =
  | 'opening'
  | 'empty'
  | 'sphereEntering'
  | 'sphereInteractive'
  | 'projectResolving'
  | 'projectExpanding'
  | 'projectViewing'
  | 'projectReturning';

export type WorkSelection = {
  slotId: number;
  projectIndex: number;
  projectSlug: string;
};

export type WorkExperienceState = {
  phase: WorkPhase;
  selection: WorkSelection | null;
};
```

Actions:

```ts
| { type: 'OPEN_PROJECT'; selection: WorkSelection }
| { type: 'PROJECT_RESOLVED' }
| { type: 'PROJECT_EXPANDED' }
| { type: 'RETURN_PROJECT' }
| { type: 'PROJECT_RETURNED' }
```

- [ ] **Step 1: Write the failing lifecycle tests**

```js
let state = INITIAL_WORK_STATE;
state = workReducer(state, { type: 'OPENING_READY' });
state = workReducer(state, { type: 'SPHERE_ENTERED' });
state = workReducer(state, {
  type: 'OPEN_PROJECT',
  selection: { slotId: 19, projectIndex: 1, projectSlug: 'fixture-b' },
});
assert.equal(state.phase, 'projectResolving');
assert.equal(state.selection.slotId, 19);
state = workReducer(state, { type: 'PROJECT_RESOLVED' });
assert.equal(state.phase, 'projectExpanding');
state = workReducer(state, { type: 'PROJECT_EXPANDED' });
assert.equal(state.phase, 'projectViewing');
state = workReducer(state, { type: 'RETURN_PROJECT' });
assert.equal(state.phase, 'projectReturning');
state = workReducer(state, { type: 'PROJECT_RETURNED' });
assert.equal(state.phase, 'sphereInteractive');
assert.equal(state.selection, null);
```

Also assert `OPEN_PROJECT` is ignored before `sphereInteractive`, and phase-skipping actions are ignored.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/work-state.test.mjs
```
Expected: FAIL because Phase 2 phases/actions do not exist.

- [ ] **Step 3: Implement the minimal reducer**

Keep DOM refs, WebGL snapshots, animation progress, and media elements outside reducer state.

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/work-state.test.mjs
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/WorkPage/workState.ts tests/work-state.test.mjs
git commit -m "feat: add Work project expansion lifecycle"
```

---

### Task 2: Add pure activation, hit-test, alignment, and projection helpers

**Files:**
- Create: `src/webgl/workSphere/activation.ts`
- Create: `tests/work-project-activation.test.mjs`

**Interfaces:**

```ts
export type PointerActivationSample = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  durationMs: number;
  coarsePointer: boolean;
};

export function isActivationGesture(sample: PointerActivationSample): boolean;

export function frontAlignmentError(
  direction: ArrayLike<number>,
  orientation: Quat,
  front?: readonly [number, number, number],
): number;

export function projectSurfaceBounds(
  model: Mat4,
  view: Mat4,
  projection: Mat4,
  cssWidth: number,
  cssHeight: number,
): ScreenBounds | null;

export function hitTestProjectedSlots(
  pointX: number,
  pointY: number,
  projected: readonly { slotId: number; bounds: ScreenBounds | null; depth: number }[],
): number;
```

Rules:
- fine travel ≤ `8px`;
- coarse travel ≤ `14px`;
- duration ≤ `550ms`;
- overlapping hits choose the front-most visible candidate;
- invalid/behind-camera bounds return `null`;
- alignment error = `1 - dot(normalizedTransformedDirection, [0,0,-1])`.

- [ ] **Step 1: Write RED tests**

Cover 7px fine true, 9px fine false, 13px coarse true, 15px coarse false, 551ms false, exact repeated slot identity, finite front-facing bounds, and front-most overlap selection.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/work-project-activation.test.mjs
```

- [ ] **Step 3: Implement using existing math only**

Use `multiplyMat4`, `transformVec4Mat4`, `transformVec3Quat`, `normalizeVec3`, and `dotVec3`. Use actual 4:3 surface extents `[-2/3,+2/3] × [-1/2,+1/2]`.

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/work-project-activation.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add src/webgl/workSphere/activation.ts tests/work-project-activation.test.mjs
git commit -m "feat: add Work project activation math"
```

---

### Task 3: Add exact engine snapshots and resolve-to-front APIs

**Files:**
- Modify: `src/webgl/workSphere/types.ts`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `tests/work-sphere-control.test.mjs`
- Modify: `tests/work-project-activation.test.mjs`

**Interfaces:**

```ts
export type WorkSphereTransitionSnapshot = {
  orientation: Quat;
  activeSlotId: number;
};

export type WorkResolveStatus = {
  slotId: number;
  alignmentError: number;
  rotationVelocity: number;
  ready: boolean;
};
```

Engine:

```ts
captureTransitionSnapshot(): WorkSphereTransitionSnapshot;
beginResolveToSlot(slotId: number): void;
getResolveStatus(): WorkResolveStatus | null;
restoreTransitionSnapshot(snapshot: WorkSphereTransitionSnapshot): void;
```

Readiness thresholds:
- `alignmentError <= 0.0025`;
- `abs(rotationVelocity) <= 0.0035`.

- [ ] **Step 1: Add RED tests**

Test exact slot 31 converges to `-Z`; snapshot → mutate orientation → restore round-trips quaternion components within `1e-5` and active slot exactly.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/work-sphere-control.test.mjs tests/work-project-activation.test.mjs
```

- [ ] **Step 3: Implement APIs on the existing controller**

Do not create a second arcball controller or alternate orientation source.

- [ ] **Step 4: Verify GREEN**

Same command.

- [ ] **Step 5: Commit**

```bash
git add src/webgl/workSphere/types.ts src/webgl/workSphere/WorkSphereEngine.ts tests/work-sphere-control.test.mjs tests/work-project-activation.test.mjs
git commit -m "feat: resolve Work sphere slots for project handoff"
```

---

### Task 4: Add one-shot pointer picking and drag discrimination

**Files:**
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `src/webgl/workSphere/types.ts`
- Modify: `tests/work-project-activation.test.mjs`
- Modify: `tests/work-page-contract.test.mjs`

Add callback:

```ts
onProjectActivate?: (slotId: number) => void;
```

Pointer record:

```ts
private activationPointer: {
  pointerId: number;
  startX: number;
  startY: number;
  startedAt: number;
  candidateSlotId: number;
  coarsePointer: boolean;
} | null;
```

- [ ] **Step 1: Add RED source contract**

Assert engine uses `isActivationGesture` and `hitTestProjectedSlots` only in pointer activation handlers, never in `frame`.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/work-project-activation.test.mjs tests/work-page-contract.test.mjs
```

- [ ] **Step 3: Implement one-shot picking**

On pointer down, project/hit-test 42 slots and store exact candidate. On pointer up, activate only when click/tap thresholds pass and release is still on the same physical slot/tolerance. Dragging continues through the existing arcball path.

- [ ] **Step 4: Verify GREEN**

Same command.

- [ ] **Step 5: Commit**

```bash
git add src/webgl/workSphere/WorkSphereEngine.ts src/webgl/workSphere/types.ts tests/work-project-activation.test.mjs tests/work-page-contract.test.mjs
git commit -m "feat: add one-shot Work sphere project activation"
```

---

### Task 5: Add selected masking, stable bounds, and global non-selected peel

**Files:**
- Modify: `src/webgl/workSphere/shaders.ts`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `tests/work-sphere-reference-contract.test.mjs`
- Create/Modify: `tests/work-project-transition-contract.test.mjs`

Engine:

```ts
getSlotScreenBounds(slotId: number): ScreenBounds | null;
setSelectedSlotHidden(slotId: number | null): void;
setProjectOpenProgress(progress: number): void;
```

Shader:

```glsl
uniform int uSelectedSlotId;
uniform float uProjectOpenProgress;
```

Peel for non-selected instances only:
- radius multiplier `1.0 + 0.48 * progress`;
- scale multiplier `1.0 - 0.32 * progress`;
- alpha multiplier `1.0 - smoothstep(0.08, 0.92, progress)`;
- selected instance stays spatially unchanged until DOM owns it;
- hidden selected instance alpha becomes zero;
- no random stagger or velocity deformation.

- [ ] **Step 1: Write RED shader/engine contracts**

Assert peel + selected mask exist, no wiggle symbols return, and `worldPosition.xyz = radius * normalize(worldPosition.xyz)` remains.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/work-project-transition-contract.test.mjs tests/work-sphere-reference-contract.test.mjs
```

- [ ] **Step 3: Implement peel/mask/bounds**

`getSlotScreenBounds` uses current model/view/projection/CSS canvas size only; no screenshot/readback.

- [ ] **Step 4: Verify GREEN**

Same command.

- [ ] **Step 5: Commit**

```bash
git add src/webgl/workSphere/shaders.ts src/webgl/workSphere/WorkSphereEngine.ts tests/work-project-transition-contract.test.mjs tests/work-sphere-reference-contract.test.mjs
git commit -m "feat: add Work sphere project peel state"
```

---

### Task 6: Expose the bounded Phase 2 engine bridge through `WorkSphereCanvas`

**Files:**
- Modify: `src/components/WorkPage/WorkSphereCanvas.tsx`
- Modify: `tests/work-page-contract.test.mjs`

`WorkSphereHandle`:

```ts
export type WorkSphereHandle = {
  start(): void;
  stop(): void;
  setInteractive(value: boolean): void;
  setEntranceProgress(progress: number): void;
  snapToSlot(slotId: number): void;
  captureTransitionSnapshot(): WorkSphereTransitionSnapshot | null;
  beginResolveToSlot(slotId: number): void;
  getResolveStatus(): WorkResolveStatus | null;
  getSlotScreenBounds(slotId: number): ScreenBounds | null;
  setSelectedSlotHidden(slotId: number | null): void;
  setProjectOpenProgress(progress: number): void;
  restoreTransitionSnapshot(snapshot: WorkSphereTransitionSnapshot): void;
  getProjectIndexForSlot(slotId: number): number;
};
```

Props add:

```ts
onProjectActivate(slotId: number): void;
```

- [ ] **Step 1: Add RED adapter contract**

Callbacks remain ref-backed; engine identity remains `[projectKey, reducedMotion]`; interactivity changes do not recreate the engine.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/work-page-contract.test.mjs
```

- [ ] **Step 3: Implement imperative forwarding only**

No GSAP/state-machine/project-view logic in this component.

- [ ] **Step 4: Verify GREEN**

Same command.

- [ ] **Step 5: Commit**

```bash
git add src/components/WorkPage/WorkSphereCanvas.tsx tests/work-page-contract.test.mjs
git commit -m "feat: expose Work sphere expansion bridge"
```

---

### Task 7: Build the fixed DOM ownership transition

**Files:**
- Create: `src/components/WorkPage/WorkProjectTransition.tsx`
- Modify: `src/components/WorkPage/WorkPage.module.css`
- Modify: `tests/work-project-transition-contract.test.mjs`

**Interfaces:**

```ts
export type WorkTransitionRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function getWorkProjectDestination(
  viewportWidth: number,
  viewportHeight: number,
): WorkTransitionRect;

export type WorkProjectTransitionProps = {
  project: WorkProject;
  sourceRect: WorkTransitionRect;
  direction: 'open' | 'close';
  reducedMotion: boolean;
  onOwnership(): void;
  onProgress(progress: number): void;
  onComplete(): void;
};
```

Destination:
- desktop side margin `clamp(28px, 4vw, 64px)`;
- mobile side margin `18px` below `720px`;
- top margin `clamp(68px, 7vh, 104px)`;
- max height `min(viewportHeight - topMargin - 28px, width / 1.6)`;
- centered horizontally;
- never stretch media.

Animation:
- open `0.82s`, `power4.inOut`;
- reduced `0.22s`, `power1.out`;
- DOM starts at exact source rect;
- selected WebGL hides only after DOM frame is painted/owns the visual;
- `onProgress` drives peel `0→1`;
- media presentation reveals from 4:3 crop toward 16:10 without distortion;
- close reverses from expanded rect to the stored resolved face-on rect.

- [ ] **Step 1: Write RED destination/ownership tests**

Test `1440×900`, `390×844`, no `readPixels`, no normal project view fixed-position after completion, and ownership callbacks.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/work-project-transition-contract.test.mjs
```

- [ ] **Step 3: Implement transition component/CSS**

Do not render project details or own sphere snapshots here.

- [ ] **Step 4: Verify GREEN**

Same command.

- [ ] **Step 5: Commit**

```bash
git add src/components/WorkPage/WorkProjectTransition.tsx src/components/WorkPage/WorkPage.module.css tests/work-project-transition-contract.test.mjs
git commit -m "feat: add Work project ownership transition"
```

---

### Task 8: Build the normal-flow project view

**Files:**
- Create: `src/components/WorkPage/WorkProjectView.tsx`
- Modify: `src/components/WorkPage/WorkPage.module.css`
- Modify: `tests/work-project-transition-contract.test.mjs`

```ts
export type WorkProjectViewProps = {
  project: WorkProject;
  focusOnMount?: boolean;
  onBack(): void;
};
```

Render only:
- dominant media frame;
- category/name;
- short brief;
- Services;
- Year;
- Visit Website ↗ or disabled placeholder equivalent;
- `← Back to Work`.

Real video:

```tsx
<video controls preload="metadata" playsInline poster={project.media.showcasePoster} />
```

- [ ] **Step 1: Add RED minimal-content tests**

Assert controls, metadata preload, services/year/visit/back and absence of testimonial/conversion/tech-stack/process copy.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/work-project-transition-contract.test.mjs
```

- [ ] **Step 3: Implement normal-flow view + responsive CSS**

This is document content, not a fixed modal/overlay.

- [ ] **Step 4: Verify GREEN**

Same command.

- [ ] **Step 5: Commit**

```bash
git add src/components/WorkPage/WorkProjectView.tsx src/components/WorkPage/WorkPage.module.css tests/work-project-transition-contract.test.mjs
git commit -m "feat: add Work project detail view"
```

---

### Task 9: Orchestrate deterministic open → view → return in `WorkPage`

**Files:**
- Modify: `src/components/WorkPage/WorkPage.tsx`
- Modify: `src/components/WorkPage/WorkPage.module.css`
- Modify: `tests/work-page-contract.test.mjs`
- Modify: `tests/work-project-transition-contract.test.mjs`

**Local refs/state:**

```ts
const preOpenSnapshotRef = useRef<WorkSphereTransitionSnapshot | null>(null);
const resolvedSnapshotRef = useRef<WorkSphereTransitionSnapshot | null>(null);
const resolvedRectRef = useRef<ScreenBounds | null>(null);
const [transitionRect, setTransitionRect] = useState<ScreenBounds | null>(null);
```

**Opening sequence:**
1. `onProjectActivate(slotId)` resolves project index/project;
2. immediately capture `preOpenSnapshotRef.current = sphere.captureTransitionSnapshot()`;
3. dispatch `OPEN_PROJECT` with exact slot/project payload;
4. disable sphere input;
5. `beginResolveToSlot(slotId)`;
6. poll `getResolveStatus()` with RAF only during `projectResolving`;
7. when ready, capture `resolvedSnapshotRef.current = sphere.captureTransitionSnapshot()` **before DOM handoff**;
8. read `resolvedRectRef.current = sphere.getSlotScreenBounds(slotId)`;
9. if bounds valid, dispatch `PROJECT_RESOLVED` and mount transition;
10. if bounds invalid, use fallback fade into project view;
11. ownership callback hides selected WebGL slot;
12. transition progress drives peel;
13. completion calls `sphere.stop()`, dispatches `PROJECT_EXPANDED`, unlocks scroll, mounts normal-flow project view, and focuses it.

**Return sequence:**
1. Escape/Back dispatches `RETURN_PROJECT`;
2. scroll to project top and wait until `scrollY <= 2`;
3. lock scroll;
4. `sphere.start()` while sphere remains visually peeled/hidden;
5. require `resolvedSnapshotRef.current`; call `sphere.restoreTransitionSnapshot(resolvedSnapshotRef.current)`;
6. set peel progress `1`, keep selected WebGL slot hidden;
7. recompute resolved face-on slot rect and verify it is finite;
8. mount `WorkProjectTransition direction="close"` from expanded rect to resolved face-on rect;
9. near visual match, reveal selected WebGL slot beneath DOM;
10. transition completes; DOM ownership layer unmounts;
11. animate peel `1→0`;
12. after peel ownership is fully WebGL, require `preOpenSnapshotRef.current`; call `sphere.restoreTransitionSnapshot(preOpenSnapshotRef.current)`;
13. restore active slot identity, metadata, semantic focus, and interactivity;
14. clear both snapshot refs only after restoration;
15. dispatch `PROJECT_RETURNED`.

**Critical rule:** never re-resolve during return and never shrink DOM directly into a tilted pre-open tile. The exact stored `resolvedSnapshot` is the return handoff state; the exact stored `preOpenSnapshot` is the final browse restore state.

- [ ] **Step 1: Write RED orchestration contracts**

Assert both snapshot refs exist; resolved snapshot is captured after resolve; close path restores resolved snapshot before DOM close; pre-open snapshot restores only after DOM unmount/peel return; no modal/router navigation; `sphere.stop()` occurs for viewing; exact slot ID is preserved; Escape returns only from project phases.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/work-page-contract.test.mjs tests/work-project-transition-contract.test.mjs
```

- [ ] **Step 3: Implement open path first**

Do not implement return until `sphereInteractive → projectViewing` passes focused tests.

- [ ] **Step 4: Re-run focused tests**

Same command.

- [ ] **Step 5: Implement deterministic return path**

Use one GSAP peel-restore timeline and clean it up on effect teardown.

- [ ] **Step 6: Verify GREEN**

Same command.

- [ ] **Step 7: Commit**

```bash
git add src/components/WorkPage/WorkPage.tsx src/components/WorkPage/WorkPage.module.css tests/work-page-contract.test.mjs tests/work-project-transition-contract.test.mjs
git commit -m "feat: orchestrate Work project expansion and return"
```

---

### Task 10: Fallback, keyboard, reduced motion, and failure-safe behavior

**Files:**
- Modify: `src/components/WorkPage/WorkFallback.tsx`
- Modify: `src/components/WorkPage/WorkPage.tsx`
- Modify: `src/components/WorkPage/WorkPage.module.css`
- Modify: `tests/work-page-contract.test.mjs`
- Modify: `tests/work-project-transition-contract.test.mjs`

Requirements:
- semantic project buttons activate the same opening path;
- Enter/Space opens focused project;
- focus returns to corresponding semantic control after return;
- Escape triggers Back to Work in project view;
- reduced motion keeps safe ownership transfer while removing long spatial travel;
- no-WebGL fallback opens `WorkProjectView` directly;
- unresolved source bounds cause a short fade to valid project DOM view, not malformed geometry animation;
- return capability failure leaves valid project/fallback content, never blank viewport.

- [ ] **Step 1: Add RED accessibility/fallback contracts**

- [ ] **Step 2: Verify RED**

```bash
node --test tests/work-page-contract.test.mjs tests/work-project-transition-contract.test.mjs
```

- [ ] **Step 3: Implement fallback/accessibility paths**

- [ ] **Step 4: Verify GREEN**

Same command.

- [ ] **Step 5: Commit**

```bash
git add src/components/WorkPage/WorkFallback.tsx src/components/WorkPage/WorkPage.tsx src/components/WorkPage/WorkPage.module.css tests/work-page-contract.test.mjs tests/work-project-transition-contract.test.mjs
git commit -m "feat: harden Work project expansion access paths"
```

---

### Task 11: Full regression, performance, and visual acceptance gate

**Files:**
- Modify: `docs/WORK_IMPLEMENTATION_STATUS.md`

- [ ] **Step 1: Run focused Work suite**

```bash
node --test \
  tests/work-state.test.mjs \
  tests/work-sphere-geometry.test.mjs \
  tests/work-sphere-control.test.mjs \
  tests/work-media-priority.test.mjs \
  tests/work-project-activation.test.mjs \
  tests/work-project-transition-contract.test.mjs \
  tests/work-page-contract.test.mjs \
  tests/work-placeholders.test.mjs \
  tests/work-project-validation.test.mjs \
  tests/work-sphere-reference-contract.test.mjs
```
Expected: 0 failures.

- [ ] **Step 2: Run full repository verification**

```bash
npm test
npm run typecheck
npm run build
```
Expected: all exit 0. If execution environment blocks them, record the boundary and do not claim green.

- [ ] **Step 3: Run browser QA**

```bash
npm run dev
```

Verify:
- desktop fine pointer;
- off-center repeated instance opens with one click;
- drag never opens;
- no source-rect jump/blank/duplicate frame;
- other tiles peel fully;
- no wiggle returns;
- WebGL stops while viewing;
- normal vertical scroll works;
- Back restores **resolvedSnapshot first**, hands DOM back to WebGL, then restores **preOpenSnapshot**;
- exact repeated slot context returns;
- mobile/coarse pointer;
- reduced motion;
- no-WebGL fallback.

- [ ] **Step 4: Performance sanity gate**

Confirm:
- no idle-frame picking;
- no hidden 42 DOM mirrors;
- no sphere RAF during `projectViewing`;
- no decoder explosion;
- no canvas readback.

- [ ] **Step 5: Update status doc with only verified evidence**

- [ ] **Step 6: Commit**

```bash
git add docs/WORK_IMPLEMENTATION_STATUS.md
git commit -m "docs: record Work Phase 2 verification"
```

---

## Self-Review Checklist

- Spec coverage: activation, exact repeated slot preservation, resolve-to-front, stable WebGL→DOM ownership, near-fullscreen expansion, 4:3→16:10 reveal, surrounding peel, WebGL pause, normal scrolling, compact project info, deterministic face-on return handoff, exact pre-open orientation restore, fallback, mobile, reduced motion, accessibility, failure handling, and performance contracts all map to explicit tasks.
- No placeholders: no `TBD`, `TODO`, or unspecified implementation step remains.
- Type consistency: `WorkSphereTransitionSnapshot`, `WorkResolveStatus`, `ScreenBounds`, `WorkSelection`, `WorkProjectTransitionProps`, and all `WorkSphereHandle` methods use one spelling/signature throughout.
- Ownership invariant: selected visual ownership transfers `WebGL → DOM` only after stable face-on resolve and `DOM → WebGL` only at the exact stored `resolvedSnapshot`.
- Return invariant: `resolvedSnapshot` is restored before close handoff; `preOpenSnapshot` is restored only after DOM ownership has returned to WebGL.
- Phase 1 invariant: 42-instance geometry, no-wiggle shader, arcball/snap/camera/depth/media behavior remain regression-gated.
