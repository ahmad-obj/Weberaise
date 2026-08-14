# Weberaise Work Sphere No-Tile-Wiggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the per-tile velocity deformation from the Work sphere while preserving the accepted 42-slot Infinite Menu geometry, arcball inertia, magnetic snap, camera pull-back, depth scaling/fade, sphere curvature, entrance, and media behavior.

**Architecture:** Keep the sphere/control/camera systems unchanged. Remove only the vertex-shader stretch path and its engine/quality plumbing. The shader still reprojects every rectangular surface vertex back onto the sphere radius, so tiles remain curved with the globe but rigid relative to it.

**Tech Stack:** TypeScript, WebGL2/GLSL ES 3.0, Next.js 16, React 19, Node test runner via `tsx`.

## Global Constraints

- Preserve exactly 42 sphere slots and modulo project repetition.
- Preserve exact 4:3 subdivided website surfaces.
- Preserve `worldPosition.xyz = radius * normalize(worldPosition.xyz)` sphere reprojection.
- Preserve arcball drag, rotational inertia, nearest-item snap, camera pull-back/settle, depth scale/fade, and 5 → 1 entrance.
- Remove `uRotationAxisVelocity`, `uDeformation`, `stretchDir`, and deformation-strength math from the shader.
- Remove engine uniform lookup/upload code used only by tile deformation.
- Remove the now-unused `deformation` quality-profile field; do not alter DPR, live-preview caps, or inertia settings.
- Do not modify Homepage, Services, Work geometry, media behavior, or Phase 2 functionality.

---

### Task 1: Lock the no-wiggle behavior with a failing source contract

**Files:**
- Modify: `tests/work-sphere-reference-contract.test.mjs`

**Interfaces:**
- Consumes: `shaders.ts`, `WorkSphereEngine.ts`, `quality.ts`, `types.ts` as source files.
- Produces: a regression test proving tile deformation code is absent while sphere reprojection remains.

- [ ] **Step 1: Replace the existing deformation-positive assertion with a no-deformation contract**

```js
test('website surfaces stay curved on the sphere without velocity wiggle deformation', () => {
  const shaders = read('src/webgl/workSphere/shaders.ts');
  const engine = read('src/webgl/workSphere/WorkSphereEngine.ts');
  const quality = read('src/webgl/workSphere/quality.ts');
  const types = read('src/webgl/workSphere/types.ts');

  assert.match(shaders, /worldPosition\.xyz\s*=\s*radius\s*\*\s*normalize\(worldPosition\.xyz\)/);
  assert.match(shaders, /smoothstep\(0\.5,\s*1\.0/);
  assert.match(shaders, /roundedRectSdf/);

  for (const source of [shaders, engine, quality, types]) {
    assert.doesNotMatch(source, /uRotationAxisVelocity|uDeformation|stretchDir|deformation:/);
  }
});
```

- [ ] **Step 2: Run the focused contract and verify RED**

```bash
node --import=tsx --test tests/work-sphere-reference-contract.test.mjs
```

Expected: FAIL because the current shader/engine/quality/types still contain deformation plumbing.

- [ ] **Step 3: Commit the failing contract**

```bash
git add tests/work-sphere-reference-contract.test.mjs
git commit -m "test: lock rigid Work sphere tiles"
```

---

### Task 2: Remove deformation math and plumbing

**Files:**
- Modify: `src/webgl/workSphere/shaders.ts`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `src/webgl/workSphere/quality.ts`
- Modify: `src/webgl/workSphere/types.ts`

**Interfaces:**
- Preserves: `WorkSphereEngine.render()` behavior except it no longer accepts/uploads rotation-axis deformation uniforms.
- Preserves: `WorkQualityProfile` DPR/live-video/inertia fields.

- [ ] **Step 1: Simplify the vertex shader to rigid sphere-conforming surfaces**

The vertex body must keep only the instance transform, center radius, sphere reprojection, projection, depth alpha, UV, and instance metadata:

```glsl
mat4 instanceMatrix = mat4(aInstance0, aInstance1, aInstance2, aInstance3);
vec4 worldPosition = instanceMatrix * vec4(aPosition, 1.0);
vec3 centerPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
float radius = max(0.0001, length(centerPos));

worldPosition.xyz = radius * normalize(worldPosition.xyz);

gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
vAlpha = smoothstep(0.5, 1.0, normalize(worldPosition.xyz).z) * 0.9 + 0.1;
```

Delete uniforms `uRotationAxisVelocity` and `uDeformation` plus the full stretch calculation.

- [ ] **Step 2: Remove deformation-only engine plumbing**

Delete from `Uniforms` and constructor lookup:

```ts
rotationAxisVelocity
deformation
```

Change frame rendering from:

```ts
this.render(snapshot.rotationAxis, snapshot.rotationVelocity);
```

to:

```ts
this.render();
```

Change `render` to:

```ts
private render() {
  const gl = this.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(this.program);
  gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, this.view);
  gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, this.projection);
  gl.uniform1f(this.uniforms.cornerRadius, 0.045);
  this.mediaPool.bind(this.uniforms.media);
  gl.bindVertexArray(this.vao);
  gl.drawElementsInstanced(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0, this.slots.length);
  gl.bindVertexArray(null);
}
```

Do not change camera use of `snapshot.rotationVelocity`.

- [ ] **Step 3: Remove the unused quality-profile field**

Change `WorkQualityProfile` to:

```ts
export type WorkQualityProfile = {
  dprCap: number;
  liveVideoSlots: number;
  inertia: number;
};
```

Update profiles to retain their existing DPR/live-video/inertia values only:

```ts
full: { dprCap: 1.5, liveVideoSlots: 3, inertia: 1 },
lite: { dprCap: 1.2, liveVideoSlots: 2, inertia: 0.8 },
mobile: { dprCap: 1.15, liveVideoSlots: 1, inertia: 0.62 },
reduced: { dprCap: 1, liveVideoSlots: 1, inertia: 0 },
```

Where reduced-motion entrance currently checks `this.profile.deformation === 0`, replace it with the already-known quality identity:

```ts
const reduced = this.profile.inertia === 0;
```

- [ ] **Step 4: Run the focused contract and verify GREEN**

```bash
node --import=tsx --test tests/work-sphere-reference-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Run unchanged geometry/control/media contracts**

```bash
node --import=tsx --test \
  tests/work-sphere-geometry.test.mjs \
  tests/work-sphere-control.test.mjs \
  tests/work-media-priority.test.mjs \
  tests/work-page-contract.test.mjs
```

Expected: PASS with no behavioral regression outside tile deformation.

- [ ] **Step 6: Commit implementation**

```bash
git add src/webgl/workSphere/shaders.ts src/webgl/workSphere/WorkSphereEngine.ts \
  src/webgl/workSphere/quality.ts src/webgl/workSphere/types.ts
git commit -m "perf: remove Work tile velocity deformation"
```

---

### Task 3: Update implementation status and verify branch invariants

**Files:**
- Modify: `docs/WORK_IMPLEMENTATION_STATUS.md`

**Interfaces:**
- Produces: accurate status note that the sphere retains inertia/camera/snap but tiles no longer deform.

- [ ] **Step 1: Update status language**

Record that per-tile rotational deformation was intentionally removed for visual stability and lower per-vertex GPU work, while sphere inertia, snap, camera pull-back, curvature, depth behavior, and density remain.

- [ ] **Step 2: Search for stale deformation symbols**

```bash
git grep -n -E 'uRotationAxisVelocity|uDeformation|stretchDir|deformation:' -- \
  src/webgl/workSphere tests/work-sphere-reference-contract.test.mjs
```

Expected: no matches.

- [ ] **Step 3: Commit status update**

```bash
git add docs/WORK_IMPLEMENTATION_STATUS.md
git commit -m "docs: record rigid Work tile optimization"
```
