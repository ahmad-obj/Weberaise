# Weberaise Work Page — Phase 2 Project Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a stable one-interaction sphere → near-fullscreen project expansion → normal scrolling project view → exact-context return flow on top of the accepted 42-instance Infinite Menu sphere.

**Architecture:** Keep the sphere renderer responsible only for spatial state, one-shot picking, resolve-to-front, selected-instance visibility, peel progress, screen bounds, and orientation restore. React/GSAP owns visual ownership transfer, DOM expansion, normal-flow project content, scrolling, and reverse handoff. The selected DOM frame only takes ownership after the clicked slot is face-on and stable; return hands back to the same resolved face-on state first, then WebGL restores the exact pre-open browse orientation.

**Tech Stack:** Next.js 16.3.0 App Router, React 19.2.8, TypeScript 7.0.2, direct WebGL2, GSAP 3.15.0, existing dependency-free quaternion/matrix helpers. Do not add `gl-matrix` or any new runtime dependency.

## Global Constraints

- Preserve the accepted 42-slot once-subdivided icosphere, radius `2`, 4:3 website surfaces, base scale `0.34`, no tile wiggle, current arcball inertia, snap, camera pull-back, depth scaling/fade, and bounded media pool.
- One click/tap opens a project even if the clicked repeated instance is off-center; no two-click selection rule.
- Preserve the exact clicked `slotId`, separate from `projectIndex`.
- No modal, route change, continuous picking loop, `readPixels`, canvas screenshot/readback, 42 DOM mirrors, or resurrected old transition-bridge architecture.
- Selected project expands to near-fullscreen with responsive margins, then the page becomes normal vertical scrolling.
- Other 41 sphere instances peel/recede/fade fully away before WebGL is stopped.
- WebGL RAF and sphere preview media must be stopped/paused throughout `projectViewing`.
- Return DOM → WebGL handoff occurs only at the resolved face-on orientation; after ownership transfer, WebGL restores `preOpenOrientation`.
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
- `src/components/WorkPage/workState.ts` — Phase 2 guarded lifecycle and selection payload.
- `src/webgl/workSphere/types.ts` — snapshot / bounds / resolve status / callbacks.
- `src/webgl/workSphere/shaders.ts` — selected-instance masking and global non-selected peel only.
- `src/webgl/workSphere/WorkSphereEngine.ts` — one-shot activation, resolve-to-front, stable bounds, selected visibility, peel, snapshot restore.
- `src/components/WorkPage/WorkSphereCanvas.tsx` — minimal imperative bridge for those engine APIs.
- `src/components/WorkPage/WorkPage.tsx` — experience orchestration only.
- `src/components/WorkPage/WorkPage.module.css` — transition/view layout and scrolling states.
- `src/components/WorkPage/WorkFallback.tsx` — static gallery opens same DOM project view without sphere transition.
- `tests/work-state.test.mjs` — guarded Phase 2 lifecycle.
- `tests/work-page-contract.test.mjs` — no modal/route-change/old bridge; WebGL stops while viewing.
- `tests/work-sphere-reference-contract.test.mjs` — preserve Phase 1 sphere invariants.
- `docs/WORK_IMPLEMENTATION_STATUS.md` — Phase 2 verification/status.

---

### Task 1: Extend the Work state machine without coupling it to rendering

**Files:**
- Modify: `src/components/WorkPage/workState.ts`
- Modify: `tests/work-state.test.mjs`

**Interfaces:**
- Produces:
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
- Actions:
  ```ts
  | { type: 'OPEN_PROJECT'; selection: WorkSelection }
  | { type: 'PROJECT_RESOLVED' }
  | { type: 'PROJECT_EXPANDED' }
  | { type: 'RETURN_PROJECT' }
  | { type: 'PROJECT_RETURNED' }
  ```

- [ ] **Step 1: Rewrite state tests first**

Add exact lifecycle coverage:

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

- [ ] **Step 2: Run the focused state test and verify RED**

Run:
```bash
node --test tests/work-state.test.mjs
```
Expected: FAIL because Phase 2 actions/phases do not exist.

- [ ] **Step 3: Implement the minimal reducer/state payload**

Keep the reducer pure. Do not store DOM refs, WebGL snapshots, animation progress, or media elements in reducer state.

- [ ] **Step 4: Re-run focused state tests**

Run:
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
- hit-test chooses the front-most/deepest visible candidate containing the point;
- invalid/behind-camera bounds return `null`;
- alignment error is `1 - dot(normalizedTransformedDirection, [0,0,-1])`.

- [ ] **Step 1: Write RED tests**

Cover:
- 7px fine activation = true;
- 9px fine = false;
- 13px coarse = true;
- 15px coarse = false;
- 551ms = false;
- repeated project slots remain distinguishable by slot ID;
- centered front-facing model projects to finite positive bounds;
- overlapping hit candidates choose the front-most slot.

- [ ] **Step 2: Run RED**

```bash
node --test tests/work-project-activation.test.mjs
```
Expected: FAIL because helper module does not exist.

- [ ] **Step 3: Implement helpers using existing math only**

Use `multiplyMat4`, `transformVec4Mat4`, `transformVec3Quat`, `normalizeVec3`, and `dotVec3`; do not introduce another math library.

Use the actual subdivided 4:3 surface corner extents `[-2/3,+2/3] × [-1/2,+1/2]`, not the deleted old unit-quad assumptions.

- [ ] **Step 4: Run GREEN**

```bash
node --test tests/work-project-activation.test.mjs
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/webgl/workSphere/activation.ts tests/work-project-activation.test.mjs
git commit -m "feat: add Work project activation math"
```

---

### Task 3: Add engine snapshot + resolve-to-front APIs before any DOM transition

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

Engine APIs:

```ts
captureTransitionSnapshot(): WorkSphereTransitionSnapshot;
beginResolveToSlot(slotId: number): void;
getResolveStatus(): WorkResolveStatus | null;
restoreTransitionSnapshot(snapshot: WorkSphereTransitionSnapshot): void;
```

Lock readiness thresholds:
- `alignmentError <= 0.0025`;
- `abs(rotationVelocity) <= 0.0035`.

Behavior:
- `beginResolveToSlot` disables free pointer drag through existing interactivity control at orchestration level;
- clears stale snap target;
- sets the exact clicked slot as the resolve target;
- arcball continues updating until thresholds are reached;
- once ready, orientation is effectively stable for DOM handoff.

- [ ] **Step 1: Add failing control tests**

Test exact slot 31 converges to the `-Z` front target and preserves `slotId:31` even if it maps to the same project as another slot. Test snapshot → rotate → restore round-trips quaternion components within `1e-5` and restores active slot.

- [ ] **Step 2: Run RED**

```bash
node --test tests/work-sphere-control.test.mjs tests/work-project-activation.test.mjs
```

- [ ] **Step 3: Implement the four APIs**

Do not create a second arcball controller. Reuse the current controller orientation/snap logic.

- [ ] **Step 4: Run GREEN**

Same command. Expected: PASS.

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

**Interfaces:**

Add callback:

```ts
onProjectActivate?: (slotId: number) => void;
```

Private engine pointer record:

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

Behavior:
- On pointer down in interactive sphere, one-shot project slot projection/hit-test records `candidateSlotId`.
- Normal arcball drag still starts immediately.
- On pointer up, call `isActivationGesture`; only activate when the release still hits the same physical slot or remains inside a small tolerance around its projected bounds.
- Never pick from RAF/frame loop.
- `pointercancel` / pointerleave clear activation candidate.

- [ ] **Step 1: Add RED source contract**

Assert engine contains `onProjectActivate` and uses `isActivationGesture`, but the `frame` body does not call `hitTestProjectedSlots`.

- [ ] **Step 2: Run RED**

```bash
node --test tests/work-project-activation.test.mjs tests/work-page-contract.test.mjs
```

- [ ] **Step 3: Implement one-shot picking**

Projection may iterate 42 slots only on pointer down/up. That cost is acceptable; do not build GPU color picking or readback.

- [ ] **Step 4: Run GREEN**

Same command.

- [ ] **Step 5: Commit**

```bash
git add src/webgl/workSphere/WorkSphereEngine.ts src/webgl/workSphere/types.ts tests/work-project-activation.test.mjs tests/work-page-contract.test.mjs
git commit -m "feat: add one-shot Work sphere project activation"
```

---

### Task 5: Add stable selected bounds, selected visibility, and non-selected peel

**Files:**
- Modify: `src/webgl/workSphere/shaders.ts`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `tests/work-sphere-reference-contract.test.mjs`
- Modify: `tests/work-project-transition-contract.test.mjs`

**Interfaces:**

Engine:

```ts
getSlotScreenBounds(slotId: number): ScreenBounds | null;
setSelectedSlotHidden(slotId: number | null): void;
setProjectOpenProgress(progress: number): void;
```

Shader uniforms:

```glsl
uniform int uSelectedSlotId;
uniform float uProjectOpenProgress;
```

Peel rule for non-selected instances only:
- selected instance transform remains unchanged until DOM owns it;
- non-selected center radius multiplier: `1.0 + 0.48 * progress`;
- non-selected scale multiplier: `1.0 - 0.32 * progress`;
- non-selected alpha multiplier: `1.0 - smoothstep(0.08, 0.92, progress)`;
- no per-item stagger, random offsets, or velocity deformation;
- hidden selected slot alpha = 0 after ownership transfer.

- [ ] **Step 1: Create RED transition contract test**

Assert shader has global peel progress + selected slot masking, does not contain deformation/wiggle symbols, and Phase-1 spherical reprojection remains.

- [ ] **Step 2: Run RED**

```bash
node --test tests/work-project-transition-contract.test.mjs tests/work-sphere-reference-contract.test.mjs
```

- [ ] **Step 3: Implement minimal peel/mask/bounds APIs**

`getSlotScreenBounds` must use the current stable model/view/projection and CSS canvas size; no screenshot/readback.

- [ ] **Step 4: Run GREEN**

Same command.

- [ ] **Step 5: Commit**

```bash
git add src/webgl/workSphere/shaders.ts src/webgl/workSphere/WorkSphereEngine.ts tests/work-project-transition-contract.test.mjs tests/work-sphere-reference-contract.test.mjs
git commit -m "feat: add Work sphere project peel state"
```

---

### Task 6: Expose only the bounded Phase 2 engine bridge through `WorkSphereCanvas`

**Files:**
- Modify: `src/components/WorkPage/WorkSphereCanvas.tsx`
- Modify: `tests/work-page-contract.test.mjs`

**Interfaces:**

`WorkSphereHandle` becomes:

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

Assert callbacks remain ref-backed, engine identity remains `[projectKey, reducedMotion]`, and `interactive` changes do not recreate engine.

- [ ] **Step 2: Run RED**

```bash
node --test tests/work-page-contract.test.mjs
```

- [ ] **Step 3: Implement imperative forwarding only**

No GSAP, state-machine logic, or project-view layout belongs in this component.

- [ ] **Step 4: Run GREEN**

Same command.

- [ ] **Step 5: Commit**

```bash
git add src/components/WorkPage/WorkSphereCanvas.tsx tests/work-page-contract.test.mjs
git commit -m "feat: expose Work sphere expansion bridge"
```

---

### Task 7: Build the fixed DOM ownership transition component

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

Destination rules:
- desktop side margin = `clamp(28px, 4vw, 64px)`;
- mobile side margin = `18px` below `720px`;
- top margin = `clamp(68px, 7vh, 104px)`;
- frame max height = `min(viewportHeight - topMargin - 28px, width / 1.6)`;
- center horizontally;
- never stretch media.

Animation:
- open duration `0.82s`, `power4.inOut`;
- reduced motion `0.22s`, `power1.out`;
- DOM starts at exact source rect using poster/preview visual;
- selected WebGL hides only in `onOwnership` after DOM frame is mounted/painted;
- `onProgress` drives sphere peel through `0→1`;
- crop transitions from sphere 4:3 view to full 16:10 presentation via nested overflow frame/object positioning, not image distortion;
- closing is the reverse to the resolved face-on source rect.

- [ ] **Step 1: Write RED destination/component contracts**

Test deterministic destination geometry for `1440×900` and `390×844`, no `position:fixed` project view after transition completion, no `readPixels`, and GSAP ownership callbacks exist.

- [ ] **Step 2: Run RED**

```bash
node --test tests/work-project-transition-contract.test.mjs
```

- [ ] **Step 3: Implement component and CSS**

Keep the component focused on the transition frame only. It must not render project details or own sphere snapshots.

- [ ] **Step 4: Run GREEN**

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

**Interfaces:**

```ts
export type WorkProjectViewProps = {
  project: WorkProject;
  focusOnMount?: boolean;
  onBack(): void;
};
```

Render exactly:
- dominant media frame;
- project category/name;
- short brief;
- Services;
- Year;
- Visit Website ↗ for real projects;
- disabled development placeholder equivalent when `project.placeholder`;
- `← Back to Work`.

Real media:
```tsx
<video controls preload="metadata" playsInline poster={project.media.showcasePoster} />
```
No autoplay with sound.

- [ ] **Step 1: Add RED minimal-content tests**

Assert `controls`, `preload="metadata"`, services/year/visit/back, and absence of `testimonial|conversion rate|tech stack|process timeline`.

- [ ] **Step 2: Run RED**

```bash
node --test tests/work-project-transition-contract.test.mjs
```

- [ ] **Step 3: Implement normal-flow view + responsive CSS**

The view itself must be scrollable document content, not a fixed modal/overlay.

- [ ] **Step 4: Run GREEN**

Same command.

- [ ] **Step 5: Commit**

```bash
git add src/components/WorkPage/WorkProjectView.tsx src/components/WorkPage/WorkPage.module.css tests/work-project-transition-contract.test.mjs
git commit -m "feat: add Work project detail view"
```

---

### Task 9: Orchestrate open → view → return in `WorkPage`

**Files:**
- Modify: `src/components/WorkPage/WorkPage.tsx`
- Modify: `src/components/WorkPage/WorkPage.module.css`
- Modify: `tests/work-page-contract.test.mjs`
- Modify: `tests/work-project-transition-contract.test.mjs`

**Local non-reducer refs/state:**

```ts
const transitionSnapshotRef = useRef<WorkSphereTransitionSnapshot | null>(null);
const resolvedRectRef = useRef<ScreenBounds | null>(null);
const [transitionRect, setTransitionRect] = useState<ScreenBounds | null>(null);
```

Opening sequence:
1. `onProjectActivate(slotId)` resolves `projectIndex` and project;
2. capture `preOpenOrientation` snapshot immediately;
3. dispatch `OPEN_PROJECT` with exact slot/project payload;
4. disable sphere input;
5. `beginResolveToSlot(slotId)`;
6. poll `getResolveStatus()` with RAF only during `projectResolving`;
7. once ready, read stable `getSlotScreenBounds(slotId)`;
8. if valid, dispatch `PROJECT_RESOLVED` and mount `WorkProjectTransition`;
9. if invalid, use fallback fade into `WorkProjectView` without broken geometry animation;
10. transition ownership callback hides selected WebGL slot;
11. transition progress drives `setProjectOpenProgress(progress)`;
12. completion calls `sphere.stop()`, dispatches `PROJECT_EXPANDED`, unlocks scroll, renders normal-flow `WorkProjectView`, then sets focus.

Return sequence:
1. Escape or Back dispatches `RETURN_PROJECT`;
2. scroll project view to top before transition; use `window.scrollTo({top:0, behavior: reducedMotion ? 'auto' : 'smooth'})` and wait until `scrollY <= 2`;
3. lock scroll;
4. `sphere.start()` while sphere layer remains visually hidden/receded;
5. restore the saved **resolved face-on orientation state used for handoff**, or re-resolve exact slot if only pre-open snapshot is stored;
6. set peel progress `1`, keep selected WebGL hidden;
7. calculate the resolved face-on source rect again;
8. mount `WorkProjectTransition direction="close"` from expanded rect → resolved tile rect;
9. near DOM/WebGL match, reveal selected WebGL slot beneath DOM;
10. DOM transition completes and unmounts;
11. animate peel `1→0`;
12. restore `preOpenOrientation` through engine snapshot after ownership is back in WebGL;
13. restore active slot identity, metadata, focus, and interactivity;
14. dispatch `PROJECT_RETURNED`.

**Critical return ownership rule:** never shrink DOM directly into a tilted pre-open tile. DOM hands back at the deterministic face-on resolved tile; only WebGL subsequently restores the old browse orientation.

- [ ] **Step 1: Write RED orchestration contracts**

Assert:
- no modal/router navigation;
- `sphere.stop()` exists on viewing transition;
- selected slot ID is preserved;
- transition component + normal-flow view are distinct;
- return contains face-on handoff before snapshot restore;
- Escape triggers return only from project phases.

- [ ] **Step 2: Run RED**

```bash
node --test tests/work-page-contract.test.mjs tests/work-project-transition-contract.test.mjs
```

- [ ] **Step 3: Implement open orchestration first**

Do not implement return until `sphereInteractive → projectViewing` is structurally complete and tests pass.

- [ ] **Step 4: Run open-path tests**

Same command.

- [ ] **Step 5: Implement return orchestration**

Use one GSAP timeline for peel restore; clean it up on effect teardown. Never let sphere and DOM both own the same selected image invisibly for more than the handoff overlap.

- [ ] **Step 6: Run GREEN**

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
- semantic project buttons `onClick` and Enter/Space invoke the exact same open orchestration as canvas activation;
- focus returns to the corresponding semantic project control after return;
- Escape triggers Back to Work in `projectViewing`;
- reduced motion skips long resolve/peel travel but preserves ownership safety and scroll state;
- no-WebGL fallback gallery opens `WorkProjectView` directly;
- if source bounds cannot be resolved, fade sphere out → show project view instead of attempting malformed transition;
- return capability failure leaves valid project/fallback content, never blank viewport.

- [ ] **Step 1: Add RED accessibility/fallback contracts**

- [ ] **Step 2: Run RED**

```bash
node --test tests/work-page-contract.test.mjs tests/work-project-transition-contract.test.mjs
```

- [ ] **Step 3: Implement fallback and accessibility paths**

- [ ] **Step 4: Run GREEN**

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
- Test: all Work tests + full project commands.

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
Expected: all exit 0. If the execution environment still cannot install/run the checkout, record that boundary explicitly; do not claim green.

- [ ] **Step 3: Run browser visual QA on `/work`**

```bash
npm run dev
```

Verify at minimum:
- desktop fine pointer;
- one repeated off-center instance opens with one click;
- drag never opens;
- expansion source rect has no visible jump/duplicate/disappearance frame;
- remaining tiles peel/fade completely;
- no tile wiggle returns;
- WebGL stops while project view is active;
- normal vertical scrolling works;
- Back first returns DOM to face-on tile, then WebGL restores old orientation;
- exact repeated slot context returns;
- mobile/coarse pointer;
- reduced motion;
- no-WebGL fallback.

- [ ] **Step 4: Performance sanity gate**

Use browser performance/devtools inspection to confirm:
- no picking work occurs during idle RAF;
- no hidden 42 DOM tile mirrors;
- no sphere RAF while `projectViewing`;
- no repeated project decoder explosion;
- no canvas readback.

- [ ] **Step 5: Update status doc with only verified evidence**

Document pass/fail/blocked items and the tested branch head.

- [ ] **Step 6: Commit**

```bash
git add docs/WORK_IMPLEMENTATION_STATUS.md
git commit -m "docs: record Work Phase 2 verification"
```

---

## Self-Review Checklist

- Spec coverage: activation, exact repeated slot preservation, resolve-to-front, stable WebGL→DOM ownership, near-fullscreen expansion, 4:3→16:10 reveal, surrounding peel, WebGL pause, normal scrolling, compact project info, face-on return handoff, pre-open orientation restore, fallback, mobile, reduced motion, accessibility, failure handling, and performance contracts all map to explicit tasks.
- No placeholders: no `TBD`, `TODO`, or unspecified implementation step is used.
- Type consistency: `WorkSphereTransitionSnapshot`, `WorkResolveStatus`, `ScreenBounds`, `WorkSelection`, `WorkProjectTransitionProps`, and all `WorkSphereHandle` methods use one spelling/signature throughout.
- Ownership invariant: selected visual ownership always transfers `WebGL → DOM` only after stable face-on resolve, and `DOM → WebGL` only at the same deterministic face-on state.
- Return invariant: `preOpenOrientation` is restored only after DOM ownership has returned to WebGL.
- Phase 1 invariant: 42-instance geometry, no-wiggle shader, arcball/snap/camera/depth/media behavior remain regression-gated.
