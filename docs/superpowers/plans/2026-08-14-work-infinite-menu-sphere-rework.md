# Weberaise Infinite Menu Sphere Rework — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sparse custom Work sphere with a 42-instance, ReactBits-Infinite-Menu-faithful spherical browser using 4:3 subdivided website surfaces, repeated project mapping, reference-style arcball/camera/snapping/deformation, and no project-opening behavior.

**Architecture:** Keep the existing `/work` opening shell, placeholder project data, bounded media pool, and direct WebGL2 rendering. Replace the geometry/control/camera/render core with a close adaptation of the supplied ReactBits Infinite Menu mechanics, expressed through Weberaise's existing dependency-free math utilities. The sphere always owns 42 instance slots; project identity is mapped by `instanceId % projectCount`, so density is constant even with one project.

**Tech Stack:** Next.js 16, React 19, TypeScript, WebGL2, GSAP for the already-approved opening transition, dependency-free Weberaise vector/quaternion/matrix math, Node test runner via `tsx`.

## Global Constraints

- Phase 1 scope is the browse sphere only; project click/open/showcase/return behavior is disabled.
- Sphere distribution is exactly 42 instance positions produced by a full icosahedron subdivided once and spherized to radius `2`.
- Sphere density never depends on project count.
- Project mapping is exactly modulo-based: `projectIndex = instanceId % projectCount`.
- One project must fill all 42 slots; six projects must repeat cyclically across all 42.
- Website surface baseline is exact `4:3`.
- Website geometry is a `6 x 4` cell mesh: 7 columns x 5 rows = 35 vertices, 48 triangles, 144 indices.
- Surfaces are tangentially oriented and re-projected onto the sphere in the vertex shader so they read as one spherical system.
- Arcball pointer projection, quaternion smoothing, release behavior, snap weighting, and camera response follow the supplied ReactBits source before any Weberaise tuning.
- Camera resting Z is `3 * scaleFactor`; energetic drag adds `rotationVelocity * 80 + 2.5` to the target Z as in the reference.
- Depth scale, depth alpha, and velocity deformation remain present.
- Reduced motion removes aggressive kinetic behavior but keeps the dense sphere navigable.
- Keep one instanced draw; never create one DOM node or one video decoder per sphere instance.
- Reuse the bounded preview media architecture; repeated instances may point to the same project media.
- The existing six `PLACEHOLDER 01`–`PLACEHOLDER 06` records remain development-only fixtures.
- Do not add `gl-matrix` or another runtime dependency; extend `src/webgl/workSphere/math.ts` only where the reference mechanics require missing primitives.
- Do not modify Homepage or Services implementation files.
- Do not begin Phase 2 project expansion until the user visually accepts the Phase 1 sphere.

---

## File Structure

### Core files to modify

- `src/webgl/workSphere/geometry.ts`
  - Owns full icosahedron construction, one subdivision, spherization, 42 stable instance positions, modulo project mapping, and the 6x4 rectangular surface mesh.
- `src/webgl/workSphere/arcball.ts`
  - Owns the ReactBits-style pointer projection, pointer quaternion smoothing, rotation-axis/velocity derivation, and distance-weighted snap behavior.
- `src/webgl/workSphere/math.ts`
  - Add only missing primitives required by the reference mechanics.
- `src/webgl/workSphere/selection.ts`
  - Owns nearest-instance lookup against the fixed snap direction and project-index mapping.
- `src/webgl/workSphere/camera.ts`
  - New pure helpers for reference-style drag pull-back and return-to-rest camera behavior.
- `src/webgl/workSphere/shaders.ts`
  - Owns rectangular-surface sphere reprojection, depth alpha, motion deformation, rounded masking, and media sampling.
- `src/webgl/workSphere/WorkSphereEngine.ts`
  - Owns WebGL buffers, 42 instance matrices, dynamic camera, reference-style control update, entrance scale, media priority, and render loop.
- `src/webgl/workSphere/mediaPool.ts`
  - Adapt repeated 42-instance priorities without increasing decoder/live texture counts.
- `src/components/WorkPage/WorkSphereCanvas.tsx`
  - Narrow the engine interface to Phase 1 browse operations.
- `src/components/WorkPage/WorkPage.tsx`
  - Remove project-open orchestration from the active Phase 1 path and retain opening, entrance, metadata, keyboard navigation, fallback, and accessibility.
- `src/components/WorkPage/workState.ts`
  - Reduce active Phase 1 state transitions to opening → empty/sphereEntering → sphereInteractive.

### Tests to modify or create

- `tests/work-sphere-geometry.test.mjs`
- `tests/work-sphere-control.test.mjs`
- `tests/work-media-priority.test.mjs`
- `tests/work-page-contract.test.mjs`
- `tests/work-state.test.mjs`
- Create: `tests/work-sphere-reference-contract.test.mjs`

### Documentation to update

- `docs/WORK_IMPLEMENTATION_STATUS.md`

---

### Task 1: Lock Phase 1 page scope and disable project opening

**Files:**
- Modify: `tests/work-page-contract.test.mjs`
- Modify: `tests/work-state.test.mjs`
- Modify: `src/components/WorkPage/workState.ts`
- Modify: `src/components/WorkPage/WorkPage.tsx`
- Modify: `src/components/WorkPage/WorkSphereCanvas.tsx`

**Interfaces:**
- Consumes: existing `WorkProject[]`, `WorkOpening`, `WorkBrowseMeta`, `WorkFallback`.
- Produces: Phase 1 lifecycle with only `opening | empty | sphereEntering | sphereInteractive`; no project activation callback.

- [ ] **Step 1: Write the failing Phase 1 contract tests**

Add to `tests/work-page-contract.test.mjs`:

```js
test('phase one browse route cannot open project showcase', () => {
  const page = read('src/components/WorkPage/WorkPage.tsx');
  const canvas = read('src/components/WorkPage/WorkSphereCanvas.tsx');
  assert.doesNotMatch(page, /ProjectTransitionBridge/);
  assert.doesNotMatch(page, /ProjectShowcase/);
  assert.doesNotMatch(page, /activateSlot/);
  assert.doesNotMatch(canvas, /onProjectActivate/);
});
```

Replace project-phase expectations in `tests/work-state.test.mjs` with:

```js
test('work state contains only phase one lifecycle states', () => {
  const source = read('src/components/WorkPage/workState.ts');
  assert.match(source, /opening/);
  assert.match(source, /sphereEntering/);
  assert.match(source, /sphereInteractive/);
  assert.match(source, /empty/);
  assert.doesNotMatch(source, /projectOpening|projectShowcase|projectReturning/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs tests/work-state.test.mjs
```

Expected: FAIL because current code still imports and drives project opening/showcase phases.

- [ ] **Step 3: Replace the reducer with the Phase 1 state machine**

```ts
export type WorkPhase = 'opening' | 'empty' | 'sphereEntering' | 'sphereInteractive';
export type WorkState = { phase: WorkPhase };
export type WorkAction =
  | { type: 'EMPTY_PROJECTS' }
  | { type: 'OPENING_READY' }
  | { type: 'SPHERE_ENTERED' };

export const INITIAL_WORK_STATE: WorkState = { phase: 'opening' };

export function workReducer(state: WorkState, action: WorkAction): WorkState {
  switch (action.type) {
    case 'EMPTY_PROJECTS':
      return state.phase === 'opening' ? { phase: 'empty' } : state;
    case 'OPENING_READY':
      return state.phase === 'opening' ? { phase: 'sphereEntering' } : state;
    case 'SPHERE_ENTERED':
      return state.phase === 'sphereEntering' ? { phase: 'sphereInteractive' } : state;
    default:
      return state;
  }
}
```

In `WorkPage.tsx`, remove `ProjectTransitionBridge`, `ProjectShowcase`, bridge bounds, selected project state, return handlers, Escape-close logic, and all calls that open a project. Semantic buttons only navigate/snap the sphere.

In `WorkSphereCanvas.tsx`, remove `onProjectActivate` from props and callback refs.

- [ ] **Step 4: Run and verify GREEN**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs tests/work-state.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/work-page-contract.test.mjs tests/work-state.test.mjs \
  src/components/WorkPage/workState.ts src/components/WorkPage/WorkPage.tsx \
  src/components/WorkPage/WorkSphereCanvas.tsx
git commit -m "refactor: isolate Work sphere phase one"
```

---

### Task 2: Replace 12-slot geometry with the exact 42-position icosphere

**Files:**
- Modify: `tests/work-sphere-geometry.test.mjs`
- Modify: `src/webgl/workSphere/geometry.ts`
- Modify: `src/webgl/workSphere/types.ts`

**Interfaces:**
- Produces `createIcosphereDirections(radius?: number): readonly Vec3[]`.
- Produces `buildProjectSlots(projectCount: number, radius?: number): readonly SphereSlot[]`.
- Produces `createProjectSurfaceMesh()`.

- [ ] **Step 1: Write failing geometry tests**

```js
test('one icosahedron subdivision produces exactly 42 sphere positions', () => {
  const positions = createIcosphereDirections(2);
  assert.equal(positions.length, 42);
  for (const [x, y, z] of positions) {
    assert.ok(Math.abs(Math.hypot(x, y, z) - 2) < 1e-5);
  }
});

test('sphere density is independent of project count', () => {
  assert.equal(buildProjectSlots(1).length, 42);
  assert.equal(buildProjectSlots(6).length, 42);
  assert.equal(buildProjectSlots(17).length, 42);
});

test('one project fills every sphere slot', () => {
  assert.ok(buildProjectSlots(1).every(slot => slot.projectIndex === 0));
});

test('six projects repeat cyclically over all 42 slots', () => {
  buildProjectSlots(6).forEach((slot, id) => assert.equal(slot.projectIndex, id % 6));
});

test('website surface is exact 4:3 with 35 vertices and 144 indices', () => {
  const mesh = createProjectSurfaceMesh();
  assert.equal(mesh.positions.length / 3, 35);
  assert.equal(mesh.indices.length, 144);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --import=tsx --test tests/work-sphere-geometry.test.mjs
```

Expected: FAIL against current 12-slot/4-vertex geometry.

- [ ] **Step 3: Implement the full icosahedron + one shared-edge subdivision**

Use the exact 12 base vertices and 20 faces from the supplied ReactBits source. Deduplicate edge midpoints with a cache. Spherize all unique vertices to radius `2`. The unique result must be exactly 42 positions.

Modulo mapping is fixed:

```ts
export function buildProjectSlots(projectCount: number, radius = 2): readonly SphereSlot[] {
  if (projectCount <= 0) return [];
  return createIcosphereDirections(radius).map((direction, id) => ({
    id,
    direction,
    projectIndex: id % projectCount,
  }));
}
```

- [ ] **Step 4: Implement the fixed 6x4 4:3 surface mesh**

```ts
export function createProjectSurfaceMesh() {
  const cellsX = 6;
  const cellsY = 4;
  const width = 4 / 3;
  const height = 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= cellsY; y += 1) {
    const v = y / cellsY;
    for (let x = 0; x <= cellsX; x += 1) {
      const u = x / cellsX;
      positions.push((u - 0.5) * width, (v - 0.5) * height, 0);
      uvs.push(u, 1 - v);
    }
  }

  const stride = cellsX + 1;
  for (let y = 0; y < cellsY; y += 1) {
    for (let x = 0; x < cellsX; x += 1) {
      const a = y * stride + x;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  return {
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  };
}
```

- [ ] **Step 5: Run geometry tests**

```bash
node --import=tsx --test tests/work-sphere-geometry.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/webgl/workSphere/geometry.ts src/webgl/workSphere/types.ts tests/work-sphere-geometry.test.mjs
git commit -m "feat: build dense 42-slot Work icosphere"
```

---

### Task 3: Port the ReactBits arcball mechanics

**Files:**
- Modify: `src/webgl/workSphere/math.ts`
- Modify: `src/webgl/workSphere/arcball.ts`
- Modify: `tests/work-sphere-control.test.mjs`

**Interfaces:**
- `ArcballController.update(deltaMs, targetFrameDuration = 1000 / 60)` returns orientation, rotation axis, rotation velocity, and moving state.
- Snap direction convention follows the supplied source: `[0, 0, -1]`.

- [ ] **Step 1: Write failing reference-control tests**

```js
test('pointer movement changes a normalized orientation quaternion', () => {
  const control = new ArcballController(false);
  control.setViewport(1200, 800);
  control.pointerDown(600, 400);
  control.pointerMove(760, 470);
  for (let i = 0; i < 8; i += 1) control.update(16.6667);
  const q = control.orientation;
  assert.ok(Math.abs(Math.hypot(...q) - 1) < 1e-5);
  assert.ok(Math.abs(q[0]) + Math.abs(q[1]) + Math.abs(q[2]) > 1e-4);
});

test('release smoothly decays reference pointer rotation', () => {
  const control = new ArcballController(false);
  control.setViewport(1200, 800);
  control.pointerDown(500, 400);
  control.pointerMove(760, 400);
  control.update(16.6667);
  control.pointerUp();
  const first = Math.abs(control.update(16.6667).rotationVelocity);
  for (let i = 0; i < 120; i += 1) control.update(16.6667);
  const last = Math.abs(control.update(16.6667).rotationVelocity);
  assert.ok(last < first);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --import=tsx --test tests/work-sphere-control.test.mjs
```

Expected: FAIL because current control uses a separate angular-velocity/inertia-axis model.

- [ ] **Step 3: Add only the missing dependency-free math primitive**

```ts
export function conjugateQuat(out: Quat, value: ArrayLike<number>): Quat {
  out[0] = -value[0];
  out[1] = -value[1];
  out[2] = -value[2];
  out[3] = value[3];
  return out;
}
```

- [ ] **Step 4: Rebuild `ArcballController` around the supplied reference constants and sequence**

Use these initial constants exactly before visual tuning:

```ts
const TARGET_FRAME_DURATION = 1000 / 60;
const POINTER_INTENSITY = 0.3;
const ANGLE_AMPLIFICATION = 5;
const RELEASE_INTENSITY = 0.1;
const SNAP_INTENSITY = 0.2;
const ROTATION_ACCUMULATION_INTENSITY = 0.8;
const ROTATION_VELOCITY_INTENSITY = 0.5;
const EPSILON = 0.1;
```

Pointer projection must match the supplied source structure:

```ts
private project(x: number, y: number): Vec3f {
  const r = 2;
  const w = this.viewportWidth;
  const h = this.viewportHeight;
  const s = Math.max(w, h) - 1;
  const px = (2 * x - w - 1) / s;
  const py = (2 * y - h - 1) / s;
  const xySq = px * px + py * py;
  const rSq = r * r;
  const z = xySq <= rSq / 2
    ? Math.sqrt(rSq - xySq)
    : rSq / Math.sqrt(xySq);
  return vec3f(-px, py, z);
}
```

Use pointer quaternion smoothing, snap quaternion multiplication, combined-quaternion smoothing, and derived rotation-axis/velocity from the supplied implementation. Reduced motion collapses residual rotation rapidly.

- [ ] **Step 5: Run control tests**

```bash
node --import=tsx --test tests/work-sphere-control.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/webgl/workSphere/math.ts src/webgl/workSphere/arcball.ts tests/work-sphere-control.test.mjs
git commit -m "feat: match ReactBits Work arcball behavior"
```

---

### Task 4: Add reference nearest-instance selection and camera response

**Files:**
- Modify: `src/webgl/workSphere/selection.ts`
- Create: `src/webgl/workSphere/camera.ts`
- Create: `tests/work-sphere-reference-contract.test.mjs`

**Interfaces:**
- `findNearestInstanceIndex(instancePositions, orientation, snapDirection): number`
- `projectIndexForInstance(instanceId, projectCount): number`
- `computeCameraTargetZ(...)`
- `stepCameraZ(...)`

- [ ] **Step 1: Write failing selection/camera tests**

```js
test('project identity is instance modulo project count', () => {
  assert.equal(projectIndexForInstance(0, 6), 0);
  assert.equal(projectIndexForInstance(6, 6), 0);
  assert.equal(projectIndexForInstance(41, 1), 0);
});

test('camera pulls back during energetic drag', () => {
  const rest = computeCameraTargetZ({ scaleFactor: 1, pointerDown: false, rotationVelocity: 0 });
  const drag = computeCameraTargetZ({ scaleFactor: 1, pointerDown: true, rotationVelocity: 0.04 });
  assert.equal(rest, 3);
  assert.ok(drag > rest + 2.5);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --import=tsx --test tests/work-sphere-reference-contract.test.mjs
```

Expected: FAIL because helpers do not exist.

- [ ] **Step 3: Implement camera helpers with reference formulas**

```ts
export function computeCameraTargetZ({ scaleFactor, pointerDown, rotationVelocity }: {
  scaleFactor: number;
  pointerDown: boolean;
  rotationVelocity: number;
}) {
  let target = 3 * scaleFactor;
  if (pointerDown) target += rotationVelocity * 80 + 2.5;
  return target;
}

export function stepCameraZ(currentZ: number, targetZ: number, deltaMs: number, pointerDown: boolean) {
  const timeScale = deltaMs / (1000 / 60) + 0.0001;
  const damping = (pointerDown ? 7 : 5) / timeScale;
  return currentZ + (targetZ - currentZ) / Math.max(1, damping);
}
```

- [ ] **Step 4: Implement nearest-instance lookup following inverse orientation + max dot product**

Use quaternion conjugation to transform the fixed snap direction into local sphere space, then choose the maximum dot product against the 42 instance positions.

- [ ] **Step 5: Run tests**

```bash
node --import=tsx --test tests/work-sphere-reference-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/webgl/workSphere/selection.ts src/webgl/workSphere/camera.ts tests/work-sphere-reference-contract.test.mjs
git commit -m "feat: add reference Work snapping and camera response"
```

---

### Task 5: Rebuild shaders for curved 4:3 website surfaces

**Files:**
- Modify: `src/webgl/workSphere/shaders.ts`
- Modify: `tests/work-sphere-reference-contract.test.mjs`

**Interfaces:**
- Vertex shader consumes instance matrix, world/view/projection matrices, rotation-axis velocity, and reduced-motion flag.
- Fragment shader keeps project atlas/live texture sampling and mild rounded rectangle alpha masking.

- [ ] **Step 1: Add failing shader contract tests**

```js
test('vertex shader reprojects rectangular vertices back to sphere radius', () => {
  const shader = read('src/webgl/workSphere/shaders.ts');
  assert.match(shader, /radius\s*\*\s*normalize\(worldPosition\.xyz\)/);
});

test('vertex shader preserves velocity deformation and depth alpha', () => {
  const shader = read('src/webgl/workSphere/shaders.ts');
  assert.match(shader, /uRotationAxisVelocity/);
  assert.match(shader, /cross\(centerPos, rotationAxis\)/);
  assert.match(shader, /vDepthAlpha/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --import=tsx --test tests/work-sphere-reference-contract.test.mjs
```

Expected: FAIL against the current flat-quad deformation model.

- [ ] **Step 3: Implement the reference structural vertex sequence**

```glsl
vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.0);
vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
float radius = length(centerPos);

if (uReducedMotion < 0.5) {
  vec3 rotationAxis = uRotationAxisVelocity.xyz;
  float rotationVelocity = min(0.15, uRotationAxisVelocity.w * 15.0);
  vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
  vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
  float strength = dot(stretchDir, relativeVertexPos);
  float invAbsStrength = min(0.0, abs(strength) - 1.0);
  strength = rotationVelocity * sign(strength)
    * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.0);
  worldPosition.xyz += stretchDir * strength;
}

worldPosition.xyz = radius * normalize(worldPosition.xyz);
gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
vDepthAlpha = smoothstep(0.5, 1.0, normalize(worldPosition.xyz).z) * 0.9 + 0.1;
```

Do not add extra visual effects in Phase 1.

- [ ] **Step 4: Keep media sampling and rounded masking**

The fragment shader maps project identity by instance/project metadata, samples atlas or bounded live texture, applies mild corner masking, and multiplies alpha by depth alpha.

- [ ] **Step 5: Run tests**

```bash
node --import=tsx --test tests/work-sphere-reference-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/webgl/workSphere/shaders.ts tests/work-sphere-reference-contract.test.mjs
git commit -m "feat: curve Work website surfaces onto sphere"
```

---

### Task 6: Rewrite `WorkSphereEngine` around the reference render loop

**Files:**
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `src/webgl/workSphere/constants.ts`
- Modify: `src/webgl/workSphere/types.ts`
- Modify: `src/webgl/workSphere/math.ts`
- Modify: `tests/work-sphere-reference-contract.test.mjs`
- Modify: `tests/work-page-contract.test.mjs`

**Interfaces:**
- Keep: `start`, `stop`, `destroy`, `setInteractive`, `setEntranceProgress`, `snapToInstance`, `snapToProjectIndex`, `getActiveInstanceId`, `getProjectIndexForInstance`.
- Remove Phase-2 APIs: `setProjectOpening`, `setSelectedHidden`, `getSlotScreenBounds`, project picking/activation.

- [ ] **Step 1: Add failing engine structure tests**

```js
test('engine renders the dense sphere in one instanced draw', () => {
  const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
  assert.match(engine, /drawElementsInstanced/);
  assert.match(engine, /this\.slots\.length/);
  assert.doesNotMatch(engine, /setProjectOpening|setSelectedHidden|getSlotScreenBounds/);
});

test('engine uses reference camera and rotation-axis velocity', () => {
  const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
  assert.match(engine, /computeCameraTargetZ/);
  assert.match(engine, /stepCameraZ/);
  assert.match(engine, /rotationAxis/);
  assert.match(engine, /rotationVelocity/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --import=tsx --test tests/work-sphere-reference-contract.test.mjs tests/work-page-contract.test.mjs
```

Expected: FAIL against old engine.

- [ ] **Step 3: Replace quad geometry with `createProjectSurfaceMesh()` and 42 matrices**

All 42 instances remain GPU-instanced in one draw call.

- [ ] **Step 4: Match the reference matrix-construction order**

For every rotated sphere position `p`, compute reference depth scale:

```ts
const s = (Math.abs(p[2]) / SPHERE_RADIUS) * 0.6 + 0.4;
const finalScale = s * BASE_SURFACE_SCALE * entranceScale;
```

Then use translation/orientation/scaling equivalent to the supplied ReactBits order. Add a minimal `translateMat4` helper to `math.ts` if required; do not add a dependency.

- [ ] **Step 5: Implement the reference RAF sequence**

```text
control.update(deltaTime)
→ rotate all 42 instance positions
→ rebuild/upload instance matrices
→ derive rotation axis/velocity
→ on release find nearest instance and set snap target
→ report active project by modulo mapping
→ compute/ease camera Z
→ rebuild view/projection
→ rank media priorities
→ upload ready media
→ render one instanced draw
```

- [ ] **Step 6: Implement reference-style dynamic FOV**

```ts
const aspect = cssWidth / cssHeight;
const height = SPHERE_RADIUS * 0.35;
const distance = cameraZ;
const fov = aspect > 1
  ? 2 * Math.atan(height / distance)
  : 2 * Math.atan(height / aspect / distance);
```

- [ ] **Step 7: Keep entrance progress independent of slot creation**

All 42 instances exist from initialization. `setEntranceProgress()` only affects establishing scale/framing and never changes instance count.

- [ ] **Step 8: Run focused tests**

```bash
node --import=tsx --test tests/work-sphere-geometry.test.mjs tests/work-sphere-control.test.mjs tests/work-sphere-reference-contract.test.mjs tests/work-page-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/webgl/workSphere/WorkSphereEngine.ts src/webgl/workSphere/constants.ts \
  src/webgl/workSphere/types.ts src/webgl/workSphere/math.ts \
  tests/work-sphere-reference-contract.test.mjs tests/work-page-contract.test.mjs
git commit -m "feat: rebuild Work renderer around Infinite Menu mechanics"
```

---

### Task 7: Adapt the bounded media pool to repeated instances

**Files:**
- Modify: `src/webgl/workSphere/mediaPool.ts`
- Modify: `tests/work-media-priority.test.mjs`
- Modify: `tests/work-placeholders.test.mjs`

**Interfaces:**
- Priority remains instance-based.
- Live-source count remains quality-profile bounded.
- Repeated project copies never imply repeated decoder creation beyond `liveSlots.length`.

- [ ] **Step 1: Add failing dense-instance media tests**

```js
test('42 repeated instances never increase the live preview cap', () => {
  const ranked = Array.from({ length: 42 }, (_, rank) => ({ slotId: rank, rank }));
  assert.equal(selectLiveVideoSlots(ranked, 3).length, 3);
});
```

Also assert repeated modulo identity using `buildProjectSlots(6)`.

- [ ] **Step 2: Run and verify RED where assumptions differ**

```bash
node --import=tsx --test tests/work-media-priority.test.mjs tests/work-placeholders.test.mjs
```

- [ ] **Step 3: Update media bookkeeping for 42 instance priorities**

Keep:
- max 3 live textures on full profile;
- reduced caps on weaker profiles;
- procedural placeholder refresh capped at 24fps;
- `requestVideoFrameCallback` for real video when supported.

Ensure active/front instance receives first live slot and reassignment clears previous frame state.

- [ ] **Step 4: Run media tests**

```bash
node --import=tsx --test tests/work-media-priority.test.mjs tests/work-placeholders.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/webgl/workSphere/mediaPool.ts tests/work-media-priority.test.mjs tests/work-placeholders.test.mjs
git commit -m "perf: bound media for repeated Work sphere instances"
```

---

### Task 8: Reconnect metadata, keyboard navigation, mobile, and reduced motion

**Files:**
- Modify: `src/components/WorkPage/WorkPage.tsx`
- Modify: `src/components/WorkPage/WorkSphereCanvas.tsx`
- Modify: `src/components/WorkPage/WorkBrowseMeta.tsx`
- Modify: `src/webgl/workSphere/quality.ts`
- Modify: `tests/work-page-contract.test.mjs`
- Modify: `tests/work-sphere-control.test.mjs`

**Interfaces:**
- Canvas reports active instance and moving state.
- Page maps active instance to project through modulo mapping.
- Semantic buttons call `snapToProjectIndex`; they never open projects.

- [ ] **Step 1: Add Phase 1 navigation contracts**

```js
test('semantic project buttons only navigate the sphere in phase one', () => {
  const page = read('src/components/WorkPage/WorkPage.tsx');
  assert.match(page, /data-work-semantic-project/);
  assert.match(page, /snapToProjectIndex/);
  assert.doesNotMatch(page, /OPEN_PROJECT|PROJECT_OPENED/);
});

test('mobile keeps the WebGL sphere instead of switching to a carousel', () => {
  const page = read('src/components/WorkPage/WorkPage.tsx');
  assert.match(page, /WorkSphereCanvas/);
  assert.doesNotMatch(page, /mobileCarousel|mobileProjectList/);
});
```

- [ ] **Step 2: Run and verify RED if stale Phase 2 code remains**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs tests/work-sphere-control.test.mjs
```

- [ ] **Step 3: Implement keyboard navigation over the 42 instances**

Arrow keys wrap instance IDs and call `snapToInstance(nextInstanceId)`. Semantic project controls choose a matching repeated instance and call `snapToProjectIndex(projectIndex)`.

- [ ] **Step 4: Match ReactBits active/inactive metadata rhythm**

Keep Weberaise typography, but soften/fade metadata while moving and restore the snapped project's name/category at rest.

- [ ] **Step 5: Preserve 42 instances on mobile**

Quality profiles may reduce DPR, live-preview count, and deformation strength. They must never reduce sphere topology or modulo repetition.

- [ ] **Step 6: Reduced motion**

Residual rotation collapses rapidly, velocity deformation is disabled, automatic placeholder/video motion is suppressed, and fast snapping remains navigable.

- [ ] **Step 7: Run tests**

```bash
node --import=tsx --test tests/work-page-contract.test.mjs tests/work-sphere-control.test.mjs tests/work-media-priority.test.mjs tests/work-placeholders.test.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/WorkPage/WorkPage.tsx src/components/WorkPage/WorkSphereCanvas.tsx \
  src/components/WorkPage/WorkBrowseMeta.tsx src/webgl/workSphere/quality.ts \
  tests/work-page-contract.test.mjs tests/work-sphere-control.test.mjs \
  tests/work-media-priority.test.mjs tests/work-placeholders.test.mjs
git commit -m "feat: finish dense Work sphere browse experience"
```

---

### Task 9: Full regression verification and visual comparison gate

**Files:**
- Modify: `docs/WORK_IMPLEMENTATION_STATUS.md`
- No production-code changes unless verification demonstrates a specific defect.

- [ ] **Step 1: Run full tests**

```bash
npm test
```

Expected: exit 0.

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 4: Run development server and open `/work`**

```bash
npm run dev
```

- [ ] **Step 5: Desktop visual acceptance against the supplied ReactBits reference**

```text
[ ] 42 surfaces visibly form a dense globe
[ ] six placeholders repeat naturally across the globe
[ ] no sparse 6/12-card interpretation remains
[ ] 4:3 surfaces are compact and website-like
[ ] surfaces bend subtly with the sphere
[ ] drag weight resembles the reference
[ ] release/momentum resembles the reference
[ ] nearest-item snap resembles the reference
[ ] camera pulls back during energetic drag
[ ] camera settles inward after release
[ ] depth scale and depth alpha define the globe
[ ] motion deformation is visible but controlled
[ ] click/tap does not open a showcase
```

- [ ] **Step 6: One-project repetition acceptance**

Temporarily run a local fixture with one project only. Verify all 42 slots remain and every slot maps to that single project. Do not commit this temporary fixture.

- [ ] **Step 7: Mobile/coarse-pointer acceptance**

Verify true dense sphere, touch arcball, no list/carousel fallback, and acceptable framing.

- [ ] **Step 8: Reduced-motion acceptance**

Verify same dense content, minimal residual motion, no strong deformation, fast snap, and no continuous automatic placeholder movement.

- [ ] **Step 9: Update `docs/WORK_IMPLEMENTATION_STATUS.md` with exact verification evidence**

Record test/typecheck/build outputs and explicitly answer:

> Does the Weberaise browse sphere now feel like ReactBits Infinite Menu with 4:3 website previews instead of circular photos?

If **no**, keep Phase 2 blocked and record the observed mismatch. If **yes**, record that Phase 2 design may begin.

- [ ] **Step 10: Commit verification status**

```bash
git add docs/WORK_IMPLEMENTATION_STATUS.md
git commit -m "docs: record Work sphere phase one verification"
```

---

## Execution Order

```text
Task 1  Phase-1-only page contract
  ↓
Task 2  42-slot icosphere + 4:3 mesh
  ↓
Task 3  ReactBits-style arcball
  ↓
Task 4  nearest snap + dynamic camera
  ↓
Task 5  sphere-conforming shaders
  ↓
Task 6  engine rewrite
  ↓
Task 7  repeated-instance media adaptation
  ↓
Task 8  metadata/accessibility/responsive integration
  ↓
Task 9  full verification + visual acceptance gate
```

Do not begin Phase 2 project expansion as part of this plan.

## Reference Fidelity Rule

When implementation behavior is uncertain, resolve it in this order:

1. the exact ReactBits Infinite Menu source supplied by the user;
2. `docs/superpowers/specs/2026-08-14-work-infinite-menu-sphere-rework-design.md`;
3. this implementation plan;
4. current Weberaise code only where it does not conflict with 1–3.

The current sparse sphere is not a reference. Existing code must not be preserved merely because it exists.

## Phase 1 Completion Gate

Automated tests/build are necessary but not sufficient.

The final gate is:

> **Does the Weberaise browse sphere now feel like ReactBits Infinite Menu with 4:3 website previews instead of circular photos?**

If no: keep project opening disabled, diagnose the mismatch against the supplied source, correct Phase 1, and rerun verification.

If yes: stop, obtain user acceptance, then begin a separate brainstorming/spec cycle for Phase 2 project expansion.
