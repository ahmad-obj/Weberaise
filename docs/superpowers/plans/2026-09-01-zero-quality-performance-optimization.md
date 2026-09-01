# Zero-Quality Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make WEBERAISE measurably faster by deferring unnecessary JavaScript, removing unused work/bytes, shrinking runtime assets losslessly, and eliminating redundant WorkSphere computation without changing a single visible design or motion characteristic.

**Architecture:** Treat performance as an invalidation/scheduling problem rather than a quality-reduction problem. First establish reproducible production evidence, then split code by experience phase, remove only mechanically proven dead resources, optimize only losslessly, and finally reduce hot-loop allocations/draws while preserving the exact existing RAF/controller cadence and rendering math.

**Tech Stack:** Next.js 16.3.0 App Router, React 19.2.8, TypeScript 7.0.2, GSAP 3.15.0, Framer Motion 12.43.0, custom WebGL/WebGL2, Node test runner, Chrome DevTools Protocol.

**Spec:** `docs/superpowers/specs/2026-09-01-zero-quality-performance-optimization-design.md`

## Global Constraints

- Do not change any hero fluid quality-profile value, shader equation, solver pass, blend mode, DPR cap, pressure iteration count, splat radius/force, dissipation, reveal gain, edge softness, or edge width.
- Do not change loader countdown timing, zero hold, loader completion choreography, hero opening choreography, EXPLORE choreography, GSAP ease, duration, or sequencing.
- Do not lower animation FPS, WorkSphere mesh detail, Silk quality, DriftWall quality, live-video count, or media cadence.
- Do not change typography, copy, metadata, semantic/SEO content, accessibility behavior, or reduced-motion behavior.
- Do not use lossy image conversion. Any modified runtime PNG must decode to exactly the same RGBA pixels.
- Do not upgrade Next.js, React, GSAP, Framer Motion, TypeScript, or any production dependency in this pass.
- Keep `feature/hero-nothin-reveal-fidelity` intact. At execution time create an isolated worktree/branch from its then-current HEAD; do not merge unless explicitly requested.
- Every optimization is independently revertible and gets its own focused test cycle and commit.
- A faster metric with any visual/loading flash, delayed transition, missing first interaction, geometry drift, font flash, or changed animation is a failed optimization and must be reverted.

---

## File Structure

### New files

- `scripts/capture-performance-qa.mjs` — reproducible CDP capture of homepage phase resources, timing, screenshots, and long tasks.
- `tests/performance-hero-loading.test.mjs` — source contract for Hero code splitting/prewarm.
- `src/components/MainSite/PostExploreNarrative/postExploreRuntime.ts` — one cached dynamic-import boundary for heavy post-EXPLORE runtime modules.
- `src/components/ui/ShutterTextPlaceholder.tsx` — Framer-free hidden layout placeholder matching inactive ShutterText geometry.
- `tests/post-explore-runtime-loading.test.mjs` — verifies heavy ribbon/Framer code is no longer statically pulled into `JourneyNarrative` and is preloaded during Hero interaction.
- `tests/font-runtime-contract.test.mjs` — proves the technical font is not referenced before removing it.
- `tests/public-artwork-contract.test.mjs` — proves runtime artwork references use only the display tree.
- `tests/work-frame-invalidation.test.mjs` — pure draw-invalidation contract for WorkSphere.

### Existing files modified

- `src/components/experience/ExperienceShell.tsx` — dynamic Hero boundary and post-EXPLORE runtime prewarm trigger.
- `src/components/experience/Loader/Loader.tsx` — Hero-module + reveal-engine critical prewarm.
- `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx` — consume cached runtime modules only after main starts; use Framer-free placeholder until runtime component is ready.
- `src/components/ui/shutter-text.tsx` — retain exact active animation, optionally share placeholder helpers without changing motion values.
- `src/app/layout.tsx` — remove Geist Mono only after mechanical proof that it is unused.
- `src/webgl/workSphere/math.ts` — remove hot matrix multiplication allocations while preserving alias behavior and operation order.
- `src/webgl/workSphere/WorkSphereEngine.ts` — reuse matrix scratch storage and render only when visual state changed, while keeping RAF/controller cadence.
- `src/webgl/workSphere/mediaPool.ts` — return whether a media texture changed this frame.
- `next.config.ts` — only if fingerprinted public assets need explicit immutable headers after deployed-header measurement.

### Binary/path-only changes

- `public/artwork/journey/source/**` → `docs/reference/artwork/journey/source/**` after runtime-reference proof.
- `public/artwork/journey/ASSET_MANIFEST.json` → `docs/reference/artwork/journey/ASSET_MANIFEST.json` after runtime-reference proof.
- `public/artwork/journey/display/Q1/*.png`, `public/artwork/journey/display/Q2/*.png` — lossless IDAT recompression only.

---

### Task 1: Build the Performance/Fidelity Baseline Harness

**Files:**
- Create: `scripts/capture-performance-qa.mjs`
- Modify: `package.json`
- Test: existing full suite plus a direct smoke invocation of the script

**Interfaces:**
- Consumes: a running production server and a Chrome page DevTools websocket.
- Produces: JSON with phase-specific `performance.getEntriesByType('resource')`, navigation timing, long-task data, CDP metrics, and PNG screenshots.

- [ ] **Step 1: Confirm the pre-optimization branch is healthy before changing production code**

Run:

```bash
npm ci
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: all commands exit `0`. If the branch is not green before optimization, record the existing failure and stop this task; do not mix unrelated fixes into the performance branch.

- [ ] **Step 2: Capture the built-in Next.js 16.3 bundle graph**

Run:

```bash
rm -rf /tmp/weberaise-perf-before
mkdir -p /tmp/weberaise-perf-before
npx next experimental-analyze --output
cp -R .next/diagnostics/analyze /tmp/weberaise-perf-before/analyze
```

Expected: `.next/diagnostics/analyze` exists and is copied. This uses the first-party Turbopack analyzer available in Next.js 16.1+; do not install `@next/bundle-analyzer`.

- [ ] **Step 3: Add a production-safe CDP capture script**

Create `scripts/capture-performance-qa.mjs` using the repository's existing websocket/CDP pattern. The script must inject a long-task observer before navigation, collect resources at `heroInteractive` and `main`, and capture screenshots without changing page state except for clicking EXPLORE.

Implement this structure:

```js
import { mkdir, writeFile } from 'node:fs/promises';

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) throw new Error(`Invalid argument near ${key ?? 'end'}`);
    values.set(key.slice(2), value);
  }
  const ws = values.get('ws');
  const url = values.get('url') ?? 'http://127.0.0.1:3000';
  const out = values.get('out');
  const viewport = values.get('viewport') ?? '1440x900';
  const match = viewport.match(/^(\d+)x(\d+)$/);
  if (!ws || !out || !match) throw new Error('Usage: --ws WS --url URL --out DIR --viewport WIDTHxHEIGHT');
  return { ws, url, out, width: Number(match[1]), height: Number(match[2]) };
}

const options = parseArguments(process.argv.slice(2));
await mkdir(options.out, { recursive: true });
const socket = new WebSocket(options.ws);
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = () => reject(new Error(`Unable to connect to ${options.ws}`));
});

let id = 0;
const pending = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const handlers = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) handlers.reject(new Error(message.error.message));
  else handlers.resolve(message.result);
};

function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Runtime evaluation failed');
  return result.result.value;
};
const waitFor = async (expression, label, attempts = 160) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await evaluate(expression)) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
};
const screenshot = async (name) => {
  const result = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`${options.out}/${name}.png`, Buffer.from(result.data, 'base64'));
};
const snapshot = async (name) => {
  const resources = await evaluate(`performance.getEntriesByType('resource').map((entry) => ({
    name: entry.name,
    initiatorType: entry.initiatorType,
    transferSize: entry.transferSize,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize,
    startTime: entry.startTime,
    duration: entry.duration
  }))`);
  const navigation = await evaluate(`performance.getEntriesByType('navigation')[0]?.toJSON() ?? null`);
  const longTasks = await evaluate(`globalThis.__wrLongTasks ?? []`);
  const metrics = await call('Performance.getMetrics');
  await screenshot(name);
  return { name, resources, navigation, longTasks, metrics: metrics.metrics };
};

await call('Page.enable');
await call('Runtime.enable');
await call('Performance.enable');
await call('Emulation.setDeviceMetricsOverride', {
  width: options.width,
  height: options.height,
  deviceScaleFactor: 1,
  mobile: options.width <= 720,
});
await call('Page.addScriptToEvaluateOnNewDocument', {
  source: `globalThis.__wrLongTasks = []; new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) globalThis.__wrLongTasks.push({ startTime: entry.startTime, duration: entry.duration });
  }).observe({ type: 'longtask', buffered: true });`,
});
await call('Page.navigate', { url: options.url });
await waitFor(`document.readyState === 'complete'`, 'document complete');
await waitFor(`document.querySelector('.experience-shell')?.dataset.experienceState === 'heroInteractive'`, 'heroInteractive');
const heroInteractive = await snapshot('hero-interactive');
await evaluate(`document.querySelector('.hero-explore')?.click()`);
await waitFor(`document.querySelector('.experience-shell')?.dataset.experienceState === 'main'`, 'main');
await wait(900);
const main = await snapshot('main');
await writeFile(`${options.out}/metrics.json`, `${JSON.stringify({ viewport: { width: options.width, height: options.height }, heroInteractive, main }, null, 2)}\n`);
socket.close();
```

- [ ] **Step 4: Add a package script without adding dependencies**

In `package.json`, add:

```json
"perf:capture": "node scripts/capture-performance-qa.mjs"
```

Do not alter dependency versions.

- [ ] **Step 5: Run the baseline at desktop and mobile widths**

Start production server and a clean Chrome remote-debugging profile, then run the capture twice:

```bash
PORT=3000 npm run start
chromium --remote-debugging-port=9222 --user-data-dir=/tmp/weberaise-perf-chrome --disable-extensions about:blank
```

Resolve the page websocket from `http://127.0.0.1:9222/json/list`, then:

```bash
npm run perf:capture -- --ws 'ws://127.0.0.1:9222/devtools/page/PAGE_ID' --url http://127.0.0.1:3000 --out /tmp/weberaise-perf-before/desktop --viewport 1440x900
npm run perf:capture -- --ws 'ws://127.0.0.1:9222/devtools/page/PAGE_ID' --url http://127.0.0.1:3000 --out /tmp/weberaise-perf-before/mobile --viewport 390x844
```

Expected: each output directory contains `hero-interactive.png`, `main.png`, and `metrics.json`.

- [ ] **Step 6: Commit the measurement harness only**

```bash
git add package.json scripts/capture-performance-qa.mjs
git commit -m "test: add production performance capture harness"
```

---

### Task 2: Split Hero Code from the Initial Homepage Graph

**Files:**
- Create: `tests/performance-hero-loading.test.mjs`
- Modify: `src/components/experience/ExperienceShell.tsx`
- Modify: `src/components/experience/Loader/Loader.tsx`

**Interfaces:**
- Produces: dynamic `Hero` component boundary; loader critical task guarantees Hero module + reveal engine are loaded before `CRITICAL_READY`.
- Preserves: all existing Hero props and phase transitions.

- [ ] **Step 1: Write the failing source-contract test**

Create `tests/performance-hero-loading.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const shellPath = new URL('../src/components/experience/ExperienceShell.tsx', import.meta.url);
const loaderPath = new URL('../src/components/experience/Loader/Loader.tsx', import.meta.url);

test('Hero is split from the initial ExperienceShell graph and prewarmed by the loader', async () => {
  const [shell, loader] = await Promise.all([
    readFile(shellPath, 'utf8'),
    readFile(loaderPath, 'utf8'),
  ]);

  assert.match(shell, /import dynamic from ['"]next\/dynamic['"]/);
  assert.doesNotMatch(shell, /import\s+\{\s*Hero\s*\}\s+from\s+['"]@\/components\/experience\/Hero\/Hero['"]/);
  assert.match(shell, /dynamic\(\(\) => import\(['"]@\/components\/experience\/Hero\/Hero['"]\)/);
  assert.match(loader, /import\(['"]@\/components\/experience\/Hero\/Hero['"]\)/);
  assert.match(loader, /import\(['"]@\/webgl\/reveal\/createRevealEngine['"]\)/);
  assert.match(loader, /warmRevealEngine\(\)/);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

```bash
node --test tests/performance-hero-loading.test.mjs
```

Expected: FAIL because `ExperienceShell` still statically imports `Hero`.

- [ ] **Step 3: Replace the static Hero import with `next/dynamic`**

In `src/components/experience/ExperienceShell.tsx`, remove:

```ts
import { Hero } from '@/components/experience/Hero/Hero';
```

Add:

```ts
import dynamic from 'next/dynamic';

const Hero = dynamic(
  () => import('@/components/experience/Hero/Hero').then((module) => module.Hero),
);
```

Keep the JSX and all Hero props unchanged.

- [ ] **Step 4: Make the loader's `hero-code` task preload the actual Hero module before warming WebGL**

In `Loader.tsx`, add outside the component:

```ts
async function warmHeroCode(): Promise<void> {
  const [, revealModule] = await Promise.all([
    import('@/components/experience/Hero/Hero'),
    import('@/webgl/reveal/createRevealEngine'),
  ]);
  await revealModule.warmRevealEngine();
}
```

Replace the current hero-code task with:

```ts
{ id: 'hero-code', weight: 2, run: warmHeroCode },
```

Do not change the task weight, progress controller, zero hold, or loader phase logic.

- [ ] **Step 5: Run focused and full correctness checks**

```bash
node --test tests/performance-hero-loading.test.mjs
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: all PASS.

- [ ] **Step 6: Re-run the production capture and compare the hero handoff**

Run desktop/mobile `perf:capture` into `/tmp/weberaise-perf-task2/...`.

Acceptance conditions:

- no blank frame between loader completion and hero opening;
- hero screenshot geometry/copy/logo matches baseline;
- loader/hero state sequence unchanged;
- initial analyze graph no longer traces `HeroRevealCanvas`/reveal engine through a static `ExperienceShell -> Hero` import chain;
- `Hero` and reveal code are loaded before the loader dispatches critical-ready.

- [ ] **Step 7: Commit**

```bash
git add tests/performance-hero-loading.test.mjs src/components/experience/ExperienceShell.tsx src/components/experience/Loader/Loader.tsx
git commit -m "perf: defer hero code behind loader prewarm"
```

---

### Task 3: Defer Heavy Post-EXPLORE Runtime and Framer Motion

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/postExploreRuntime.ts`
- Create: `src/components/ui/ShutterTextPlaceholder.tsx`
- Create: `tests/post-explore-runtime-loading.test.mjs`
- Modify: `src/components/experience/ExperienceShell.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx`

**Interfaces:**
- Produces: `loadPostExploreRuntime(): Promise<PostExploreRuntime>` and `preloadPostExploreRuntime(): void`.
- Runtime object contains the existing exported functions/components without changing their signatures.

- [ ] **Step 1: Write the failing runtime-boundary test**

Create `tests/post-explore-runtime-loading.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const journeyPath = new URL('../src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx', import.meta.url);
const shellPath = new URL('../src/components/experience/ExperienceShell.tsx', import.meta.url);
const runtimePath = new URL('../src/components/MainSite/PostExploreNarrative/postExploreRuntime.ts', import.meta.url);

test('post-EXPLORE heavy runtime is dynamically loaded and prewarmed during hero interaction', async () => {
  const [journey, shell, runtime] = await Promise.all([
    readFile(journeyPath, 'utf8'),
    readFile(shellPath, 'utf8'),
    readFile(runtimePath, 'utf8'),
  ]);

  for (const name of ['buildJourneyPath', 'createRibbonController', 'getJourneyRoute', 'revealJourneyStop']) {
    assert.doesNotMatch(journey, new RegExp(`import\\s+\\{[^}]*${name}[^}]*\\}\\s+from`));
  }
  assert.doesNotMatch(journey, /import ShutterText from ['"]@\/components\/ui\/shutter-text['"]/);
  assert.match(runtime, /import\(['"]\.\/buildJourneyPath['"]\)/);
  assert.match(runtime, /import\(['"]\.\/ribbonController['"]\)/);
  assert.match(runtime, /import\(['"]\.\/journeyRoute['"]\)/);
  assert.match(runtime, /import\(['"]\.\/questionReveal['"]\)/);
  assert.match(runtime, /import\(['"]@\/components\/ui\/shutter-text['"]\)/);
  assert.match(shell, /preloadPostExploreRuntime\(\)/);
  assert.match(shell, /state === ['"]heroInteractive['"]/);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

```bash
node --test tests/post-explore-runtime-loading.test.mjs
```

Expected: FAIL because the runtime loader file does not exist and `JourneyNarrative` still statically imports the heavy modules.

- [ ] **Step 3: Create the cached runtime loader**

Create `postExploreRuntime.ts`:

```ts
export type PostExploreRuntime = {
  buildJourneyPath: typeof import('./buildJourneyPath').buildJourneyPath;
  createRibbonController: typeof import('./ribbonController').createRibbonController;
  getJourneyRoute: typeof import('./journeyRoute').getJourneyRoute;
  revealJourneyStop: typeof import('./questionReveal').revealJourneyStop;
  ShutterText: typeof import('@/components/ui/shutter-text').default;
};

let runtimePromise: Promise<PostExploreRuntime> | null = null;

export function loadPostExploreRuntime(): Promise<PostExploreRuntime> {
  if (!runtimePromise) {
    runtimePromise = Promise.all([
      import('./buildJourneyPath'),
      import('./ribbonController'),
      import('./journeyRoute'),
      import('./questionReveal'),
      import('@/components/ui/shutter-text'),
    ]).then(([pathModule, controllerModule, routeModule, revealModule, shutterModule]) => ({
      buildJourneyPath: pathModule.buildJourneyPath,
      createRibbonController: controllerModule.createRibbonController,
      getJourneyRoute: routeModule.getJourneyRoute,
      revealJourneyStop: revealModule.revealJourneyStop,
      ShutterText: shutterModule.default,
    }));
  }
  return runtimePromise;
}

export function preloadPostExploreRuntime(): void {
  void loadPostExploreRuntime();
}
```

All `typeof import(...)` references are type-only and must not become runtime imports.

- [ ] **Step 4: Create a Framer-free inactive placeholder with the same text geometry**

Create `src/components/ui/ShutterTextPlaceholder.tsx`:

```tsx
import styles from './shutter-text.module.css';

function glyph(char: string) {
  return char === ' ' ? '\u00A0' : char;
}

export function ShutterTextPlaceholder({
  lines,
  className = '',
}: {
  lines: readonly string[];
  className?: string;
}) {
  const rootClassName = `${styles.root} ${className}`.trim();
  return (
    <span className={rootClassName} aria-label={lines.join(' ')}>
      <span className={`${styles.row} ${styles.placeholder}`} aria-hidden="true">
        {lines.map((line, lineIndex) => (
          <span key={`${line}-${lineIndex}`} className={styles.line}>
            {line.split('').map((char, characterIndex) => (
              <span key={`${char}-${characterIndex}`} className={styles.character}>
                <span className={styles.mainCharacter}>{glyph(char)}</span>
              </span>
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}
```

This placeholder is hidden by the existing `.placeholder { visibility: hidden; }` rule and preserves the inactive layout without importing Framer Motion.

- [ ] **Step 5: Prewarm the post-EXPLORE runtime during hero interaction**

In `ExperienceShell.tsx`, statically import only the tiny loader:

```ts
import { preloadPostExploreRuntime } from '@/components/MainSite/PostExploreNarrative/postExploreRuntime';
```

Add:

```ts
useEffect(() => {
  if (state !== 'heroInteractive') return;
  preloadPostExploreRuntime();
}, [state]);
```

Do not change Hero timing or delay EXPLORE.

- [ ] **Step 6: Replace JourneyNarrative value imports with runtime consumption**

Keep only type imports such as `BuiltJourneyPath`/`JourneyStopId`. Remove static value imports for the four runtime functions and `ShutterText`.

Add:

```ts
import { ShutterTextPlaceholder } from '@/components/ui/ShutterTextPlaceholder';
import { loadPostExploreRuntime, type PostExploreRuntime } from './postExploreRuntime';
```

Add state:

```ts
const [ShutterTextRuntime, setShutterTextRuntime] = useState<PostExploreRuntime['ShutterText'] | null>(null);
```

Inside the existing first `useLayoutEffect`, make `startJourney` async and load once before attaching geometry observers:

```ts
const startJourney = async () => {
  if (started || disposed || (shell && shell.dataset.experienceState !== 'main')) return;
  started = true;
  const runtime = await loadPostExploreRuntime();
  if (disposed) return;
  setShutterTextRuntime(() => runtime.ShutterText);

  const rebuild = () => {
    const config = runtime.getJourneyRoute(window.innerWidth);
    const built = runtime.buildJourneyPath(root, config);
    lastWidth = built.width;
    lastHeight = built.height;
    setGeometry({ ...built, sampleSpacing: config.sampleSpacing });
  };

  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    if (Math.abs(entry.contentRect.width - lastWidth) > 4 || Math.abs(entry.contentRect.height - lastHeight) > 4) scheduleRebuild();
  });
  resizeObserver.observe(root);
  window.addEventListener('orientationchange', scheduleRebuild, { passive: true });
  scheduleRebuild();
};
```

Set `disposed = true` in cleanup before disconnecting observers.

In the controller effect, resolve the cached runtime before creating the controller:

```ts
let disposed = false;
let cleanupController: () => void = () => undefined;
const frame = window.requestAnimationFrame(() => {
  void loadPostExploreRuntime().then((runtime) => {
    if (disposed) return;
    cleanupController = runtime.createRibbonController({
      root,
      svg,
      measurementPath: backBasePath,
      drawPaths: [backBasePath, backHighlightPath, frontBasePath, frontHighlightPath],
      openingLocalY: geometry.openingLocalY,
      sampleSpacing: geometry.sampleSpacing,
      stops: geometry.stops,
      markerProgress: geometry.markerProgress,
      taper: { revealPath: taperRevealPath, startLocalY: geometry.taper.startLocalY },
      reducedMotion,
      onReveal: (id: JourneyStopId) => {
        const anchor = root.querySelector<HTMLElement>(`[data-journey-stop="${id}"]`);
        if (!anchor || anchor.dataset.revealed === 'true') return;
        if (id === 'reassurance') setReassuranceActive(true);
        else {
          const target = anchor.querySelector<HTMLElement>('[data-journey-question]');
          if (target) runtime.revealJourneyStop(target, reducedMotion);
        }
        anchor.dataset.revealed = 'true';
      },
    });
  });
});
return () => {
  disposed = true;
  window.cancelAnimationFrame(frame);
  cleanupController();
};
```

Replace the reassurance render with:

```tsx
{ShutterTextRuntime ? (
  <ShutterTextRuntime lines={['DONT WORRY.', 'WE GOT YOU']} active={reassuranceActive} />
) : (
  <ShutterTextPlaceholder lines={['DONT WORRY.', 'WE GOT YOU']} />
)}
```

- [ ] **Step 7: Run correctness tests**

```bash
node --test tests/post-explore-runtime-loading.test.mjs
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: all PASS.

- [ ] **Step 8: Run bundle and throttled visual verification**

Run:

```bash
npx next experimental-analyze --output
```

Verify the `/` initial client import chain no longer includes Framer Motion, `buildJourneyPath`, `ribbonController`, `ribbonPacing`, or `ribbonPrimitives` solely because `JourneyNarrative` was imported.

Then run the homepage capture under normal network and Chrome DevTools Fast 3G throttling. Acceptance conditions:

- Hero interaction becomes available without waiting for post-EXPLORE runtime.
- Clicking EXPLORE immediately after Hero becomes interactive does not expose blank/missing ribbon/question content.
- Q1/Q2/Q3/reassurance geometry and animations match baseline screenshots/behavior.
- Shutter animation timings/colours remain exactly those defined in `shutter-text.tsx`.

If Fast 3G exposes a late main runtime, move `preloadPostExploreRuntime()` earlier to `heroOpening`; do not delay EXPLORE and do not ship a loading placeholder visible to the user.

- [ ] **Step 9: Commit**

```bash
git add src/components/experience/ExperienceShell.tsx src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx src/components/MainSite/PostExploreNarrative/postExploreRuntime.ts src/components/ui/ShutterTextPlaceholder.tsx tests/post-explore-runtime-loading.test.mjs
git commit -m "perf: defer post-explore runtime until hero phase"
```

---

### Task 4: Remove the Unused Technical Font Only if Proven Dead

**Files:**
- Create: `tests/font-runtime-contract.test.mjs`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: identical visible fonts with one fewer globally registered font family if `--font-technical` is unused.

- [ ] **Step 1: Write the source-wide contract test**

Create `tests/font-runtime-contract.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(?:ts|tsx|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

test('unused technical font is not registered in the production app', async () => {
  const root = path.resolve('src');
  const files = await walk(root);
  const usages = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    if (file.endsWith('src/app/layout.tsx')) continue;
    if (source.includes('--font-technical') || source.includes('Geist_Mono')) usages.push(file);
  }
  assert.deepEqual(usages, []);

  const layout = await readFile(path.resolve('src/app/layout.tsx'), 'utf8');
  assert.doesNotMatch(layout, /Geist_Mono/);
  assert.doesNotMatch(layout, /geistMono/);
  assert.doesNotMatch(layout, /--font-technical/);
});
```

- [ ] **Step 2: Run and confirm RED**

```bash
node --test tests/font-runtime-contract.test.mjs
```

Expected: FAIL because `layout.tsx` still registers Geist Mono. If the test reports any production source usage outside layout, abort this task and keep Geist Mono.

- [ ] **Step 3: Remove only Geist Mono registration**

Change:

```ts
import { Geist, Geist_Mono, Inter_Tight } from 'next/font/google';
```

to:

```ts
import { Geist, Inter_Tight } from 'next/font/google';
```

Delete:

```ts
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-technical', display: 'swap' });
```

Change the html class to:

```tsx
<html lang="en" className={`${geist.variable} ${interTight.variable}`}>
```

Do not alter Geist or Inter Tight options.

- [ ] **Step 4: Verify and commit**

```bash
node --test tests/font-runtime-contract.test.mjs
npm test
npm run typecheck
npm run build
git diff --check
git add src/app/layout.tsx tests/font-runtime-contract.test.mjs
git commit -m "perf: remove unused technical font"
```

---

### Task 5: Remove Master Artwork from the Public Runtime Tree

**Files:**
- Create: `tests/public-artwork-contract.test.mjs`
- Move: `public/artwork/journey/source/**` → `docs/reference/artwork/journey/source/**`
- Move: `public/artwork/journey/ASSET_MANIFEST.json` → `docs/reference/artwork/journey/ASSET_MANIFEST.json`

**Interfaces:**
- Runtime URLs under `/artwork/journey/display/**` remain unchanged.

- [ ] **Step 1: Write the runtime-reference test**

Create `tests/public-artwork-contract.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(?:ts|tsx|js|mjs|css|json|md)$/.test(entry.name)) files.push(full);
  }
  return files;
}

test('production source references journey display artwork only', async () => {
  const files = await walk(path.resolve('src'));
  const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
  assert.doesNotMatch(source, /\/artwork\/journey\/source\//);
  assert.doesNotMatch(source, /ASSET_MANIFEST\.json/);
  assert.match(source, /\/artwork\/journey\/display\/Q1/);
  assert.match(source, /\/artwork\/journey\/display\/Q2/);
});
```

- [ ] **Step 2: Run the test before moving assets**

```bash
node --test tests/public-artwork-contract.test.mjs
```

Expected: PASS. This is a proof test, not a RED test; the behavior already exists and the task changes deployment packaging rather than application logic.

- [ ] **Step 3: Move source/master assets out of `public` without modifying bytes**

```bash
mkdir -p docs/reference/artwork/journey
git mv public/artwork/journey/source docs/reference/artwork/journey/source
git mv public/artwork/journey/ASSET_MANIFEST.json docs/reference/artwork/journey/ASSET_MANIFEST.json
```

Do not touch `public/artwork/journey/display`.

- [ ] **Step 4: Verify production behavior and build**

```bash
node --test tests/public-artwork-contract.test.mjs
npm test
npm run typecheck
npm run build
git diff --check
```

Also run:

```bash
find public/artwork/journey -type f -maxdepth 4 -print
```

Expected: only runtime display assets remain under the journey public tree.

- [ ] **Step 5: Commit**

```bash
git add tests/public-artwork-contract.test.mjs docs/reference/artwork/journey public/artwork/journey
git commit -m "perf: remove source artwork from public deployment"
```

---

### Task 6: Losslessly Recompress Runtime Journey PNGs

**Files:**
- Modify binary bytes only: `public/artwork/journey/display/Q1/*.png`
- Modify binary bytes only: `public/artwork/journey/display/Q2/*.png`

**Interfaces:**
- Same filenames, dimensions, alpha, colour chunks, and decoded pixels.

- [ ] **Step 1: Copy exact pre-optimization PNGs for verification**

```bash
rm -rf /tmp/weberaise-png-before
mkdir -p /tmp/weberaise-png-before
cp -a public/artwork/journey/display /tmp/weberaise-png-before/display
```

- [ ] **Step 2: Record original byte totals**

```bash
find public/artwork/journey/display -type f -name '*.png' -print0 | xargs -0 stat -c '%s %n' | tee /tmp/weberaise-png-before/sizes.txt
awk '{sum += $1} END {print sum}' /tmp/weberaise-png-before/sizes.txt
```

- [ ] **Step 3: Run lossless PNG recompression only**

Use OxiPNG with no stripping/conversion:

```bash
find public/artwork/journey/display -type f -name '*.png' -print0 | xargs -0 oxipng -o 4
```

Do not pass `--strip`, palette reduction, bit-depth reduction, or format-conversion flags.

- [ ] **Step 4: Prove decoded-pixel identity for every file**

For every PNG, run ImageMagick absolute-error comparison:

```bash
while IFS= read -r -d '' after; do
  rel="${after#public/artwork/journey/display/}"
  before="/tmp/weberaise-png-before/display/$rel"
  error=$(compare -metric AE "$before" "$after" null: 2>&1 || true)
  if [ "$error" != "0" ]; then
    echo "PIXEL MISMATCH: $rel ($error)" >&2
    exit 1
  fi
done < <(find public/artwork/journey/display -type f -name '*.png' -print0)
```

Expected: every comparison returns absolute error `0`.

- [ ] **Step 5: Confirm dimensions/channels and build remain unchanged**

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Run the desktop/mobile performance capture and manually compare Q1/Q2 artwork at the existing journey checkpoints.

- [ ] **Step 6: Commit binary-only optimization**

```bash
git add public/artwork/journey/display/Q1 public/artwork/journey/display/Q2
git commit -m "perf: losslessly compress journey artwork"
```

If total bytes do not decrease meaningfully, restore the PNGs and skip this commit; no quality setting may be weakened to force a win.

---

### Task 7: Remove WorkSphere Hot-Loop Allocations and Redundant Draws

**Files:**
- Create: `tests/work-frame-invalidation.test.mjs`
- Modify: `src/webgl/workSphere/math.ts`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `src/webgl/workSphere/mediaPool.ts`
- Test: existing WorkSphere geometry/control/reference tests

**Interfaces:**
- `multiplyMat4(out, a, b)` retains the same signature and alias-safe behavior.
- `WorkPreviewMediaPool.uploadReadyFrames()` changes from `void` to `boolean`, returning `true` only if a texture upload occurred.
- WorkSphere RAF cadence remains unchanged.

- [ ] **Step 1: Add an exact matrix-multiply regression to existing WorkSphere math tests**

In the most appropriate existing WorkSphere math/geometry test, define a local reference implementation matching the current allocation-based multiply and compare the optimized function for normal and aliasing calls:

```js
function referenceMultiply(a, b) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      result[column * 4 + row] =
        a[row] * b[column * 4]
        + a[4 + row] * b[column * 4 + 1]
        + a[8 + row] * b[column * 4 + 2]
        + a[12 + row] * b[column * 4 + 3];
    }
  }
  return result;
}
```

Test at least identity, translation/scale matrices, arbitrary matrices, `out === a`, and `out === b`.

- [ ] **Step 2: Rewrite `multiplyMat4` without allocating a temporary Float32Array**

Read all 32 input scalars into locals before writing any output value so aliasing remains safe. Preserve the exact addition/multiplication order from the reference implementation.

The implementation must have this form:

```ts
export function multiplyMat4(out: Mat4, a: ArrayLike<number>, b: ArrayLike<number>): Mat4 {
  const a00 = a[0]; const a01 = a[1]; const a02 = a[2]; const a03 = a[3];
  const a10 = a[4]; const a11 = a[5]; const a12 = a[6]; const a13 = a[7];
  const a20 = a[8]; const a21 = a[9]; const a22 = a[10]; const a23 = a[11];
  const a30 = a[12]; const a31 = a[13]; const a32 = a[14]; const a33 = a[15];
  const b00 = b[0]; const b01 = b[1]; const b02 = b[2]; const b03 = b[3];
  const b10 = b[4]; const b11 = b[5]; const b12 = b[6]; const b13 = b[7];
  const b20 = b[8]; const b21 = b[9]; const b22 = b[10]; const b23 = b[11];
  const b30 = b[12]; const b31 = b[13]; const b32 = b[14]; const b33 = b[15];

  out[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
  out[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
  out[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
  out[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
  out[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
  return out;
}
```

- [ ] **Step 3: Make media uploads report visual invalidation**

Change:

```ts
uploadReadyFrames() {
```

to:

```ts
uploadReadyFrames(): boolean {
  if (this.destroyed) return false;
  let changed = false;
```

After every successful `texImage2D`/`texSubImage2D` for placeholder or video, set:

```ts
changed = true;
```

Return `changed` at the end. Do not alter placeholder interval, video-frame dirty logic, playback, priorities, or texture parameters.

- [ ] **Step 4: Add a pure draw invalidation helper test**

Create `tests/work-frame-invalidation.test.mjs` against a small exported helper in `WorkSphereEngine.ts` or a focused adjacent module:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldDrawWorkFrame } from '../src/webgl/workSphere/frameInvalidation.ts';

test('WorkSphere draws only when visual state changed', () => {
  assert.equal(shouldDrawWorkFrame({ transformChanged: false, mediaChanged: false, force: false }), false);
  assert.equal(shouldDrawWorkFrame({ transformChanged: true, mediaChanged: false, force: false }), true);
  assert.equal(shouldDrawWorkFrame({ transformChanged: false, mediaChanged: true, force: false }), true);
  assert.equal(shouldDrawWorkFrame({ transformChanged: false, mediaChanged: false, force: true }), true);
});
```

Create `src/webgl/workSphere/frameInvalidation.ts`:

```ts
export function shouldDrawWorkFrame({
  transformChanged,
  mediaChanged,
  force,
}: {
  transformChanged: boolean;
  mediaChanged: boolean;
  force: boolean;
}) {
  return force || transformChanged || mediaChanged;
}
```

- [ ] **Step 5: Reuse matrix scratch storage inside WorkSphereEngine**

Add engine-owned scratch matrices once:

```ts
private readonly translationScratch = mat4Identity();
private readonly scaleScratch = mat4Identity();
private readonly facingScratch = mat4Identity();
```

Replace local allocation helpers with in-place setters:

```ts
function setIdentity(out: Mat4) {
  out.fill(0);
  out[0] = out[5] = out[10] = out[15] = 1;
  return out;
}

function setTranslation(out: Mat4, x: number, y: number, z: number) {
  setIdentity(out);
  out[12] = x;
  out[13] = y;
  out[14] = z;
  return out;
}

function setScale(out: Mat4, scale: number) {
  out.fill(0);
  out[0] = out[5] = out[10] = scale;
  out[15] = 1;
  return out;
}
```

Inside `updateMatrices()`, replace `matrix.set(mat4Identity())`, `translationMatrix(...)`, `scaleMatrix(...)`, and `targetToMat4(mat4Identity(), ...)` with these reusable buffers. Preserve multiplication order exactly.

- [ ] **Step 6: Track exact visual change before drawing**

Keep controller `update()` and `scheduleFrame()` on every current RAF. Before mutation, snapshot the transform-driving values needed to know whether the output changed:

```ts
const beforeOrientation = cloneQuat(this.controller.orientation);
const beforeCameraZ = this.cameraZ;
```

After controller/camera updates:

```ts
const orientationChanged =
  beforeOrientation[0] !== this.controller.orientation[0]
  || beforeOrientation[1] !== this.controller.orientation[1]
  || beforeOrientation[2] !== this.controller.orientation[2]
  || beforeOrientation[3] !== this.controller.orientation[3];
const cameraChanged = beforeCameraZ !== this.cameraZ;
const transformChanged = orientationChanged || cameraChanged;
```

Do not keep the per-frame `cloneQuat` allocation in the final version. Replace it with four scalar locals after correctness is established:

```ts
const q0 = this.controller.orientation[0];
const q1 = this.controller.orientation[1];
const q2 = this.controller.orientation[2];
const q3 = this.controller.orientation[3];
```

Call `updateMatrices()` only when transform-driving state changed or when setters such as entrance/project-open/restore have marked `forceRender=true`.

Then:

```ts
const mediaChanged = this.mediaPool.uploadReadyFrames();
if (shouldDrawWorkFrame({ transformChanged, mediaChanged, force: this.forceRender })) {
  this.render();
  this.forceRender = false;
}
this.scheduleFrame();
```

Every method that changes visible state outside normal controller movement must set `forceRender = true`, including `setEntranceProgress`, `snapToSlot`, `beginResolveToSlot`, `restoreTransitionSnapshot`, `setSelectedSlotHidden`, `setProjectOpenProgress`, and `resize`.

The RAF loop itself must not be stopped by this task.

- [ ] **Step 7: Verify motion/math parity**

Run:

```bash
node --test tests/work-frame-invalidation.test.mjs
npm test
npm run typecheck
npm run build
git diff --check
```

Specifically ensure existing `work-sphere-control`, `work-sphere-geometry`, `work-sphere-reference-contract`, `work-project-activation`, and transition tests pass.

Then perform deterministic browser checks:

- drag sphere through the same pointer path before/after;
- let inertia settle;
- keyboard snap between the same slots;
- open a project and return;
- leave the Work page visible and settled for 10 seconds;
- verify live preview video/placeholder animation cadence remains unchanged.

Use browser instrumentation to count `gl.drawElementsInstanced` calls during the settled 10-second interval. The optimized version should draw only when media/visual state changes, while pointer/inertia traces must match baseline.

- [ ] **Step 8: Commit**

```bash
git add src/webgl/workSphere/math.ts src/webgl/workSphere/WorkSphereEngine.ts src/webgl/workSphere/mediaPool.ts src/webgl/workSphere/frameInvalidation.ts tests/work-frame-invalidation.test.mjs tests/work-sphere-geometry.test.mjs
git commit -m "perf: remove redundant work-sphere frame work"
```

---

### Task 8: Measure Deployed Caching Before Changing Headers

**Files:**
- Modify: `next.config.ts` only if this task's measurement proves a safe win and asset URLs are fingerprinted.
- Modify runtime public asset filenames/references only if immutable caching is needed.

**Interfaces:**
- No unversioned URL receives `immutable` caching.

- [ ] **Step 1: Measure current production/preview headers**

For representative assets, run against the actual Cloudflare deployment:

```bash
curl -I 'https://DEPLOYED_HOST/brand/weberaise-horizontal-on-dark.svg'
curl -I 'https://DEPLOYED_HOST/artwork/journey/display/Q1/01_island_platform.png'
curl -I 'https://DEPLOYED_HOST/_next/static/chunks/REPRESENTATIVE_CHUNK.js'
```

Record `cache-control`, `age`, `etag`, `cf-cache-status`, and content length.

Do not change configuration if Cloudflare/Next already provides safe equivalent caching for the public assets.

- [ ] **Step 2: If public runtime assets are not safely cacheable, fingerprint them before adding immutable headers**

Use the current Git blob/content hash prefix in filenames, for example:

```text
weberaise-horizontal-on-dark.95a2b66f.svg
01_island_platform.6aff7f62.png
```

Update every internal reference mechanically. Run:

```bash
rg 'weberaise-horizontal-on-dark\.svg|artwork/journey/display' src tests public docs
```

Expected after rename: no stale runtime reference remains.

Do not fingerprint or rename if the deployment layer already provides sufficient cache behavior; avoid churn without a measured benefit.

- [ ] **Step 3: Add immutable headers only for fingerprinted runtime trees**

If fingerprinting was required, update `next.config.ts` with:

```ts
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/brand/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/artwork/journey/display/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};
```

Only do this when every file under those matched runtime paths is content-fingerprinted. Otherwise leave `next.config.ts` unchanged.

- [ ] **Step 4: Build, deploy preview, and verify repeat-load behavior**

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

After preview deployment, repeat the header checks and reload twice in a clean browser profile. Verify no stale asset, 404, or changed visual appears.

- [ ] **Step 5: Commit only if configuration/assets actually changed**

```bash
git add next.config.ts public src tests
git commit -m "perf: fingerprint and cache immutable runtime assets"
```

If measurement showed current caching was already correct, record the evidence in the final performance report and make no commit for this task.

---

### Task 9: Final Whole-Site Verification and Performance Report

**Files:**
- Create: `docs/PERFORMANCE_OPTIMIZATION_REPORT_2026-09-01.md`
- No production code changes in this task.

**Interfaces:**
- Produces: before/after evidence and explicit confirmation of preserved quality contracts.

- [ ] **Step 1: Run the complete correctness gate from a clean install/build**

```bash
rm -rf node_modules .next
npm ci
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: all PASS.

- [ ] **Step 2: Generate the final bundle analyzer output**

```bash
rm -rf /tmp/weberaise-perf-after
mkdir -p /tmp/weberaise-perf-after
npx next experimental-analyze --output
cp -R .next/diagnostics/analyze /tmp/weberaise-perf-after/analyze
```

Compare import chains and route client graphs against `/tmp/weberaise-perf-before/analyze`.

- [ ] **Step 3: Re-run desktop/mobile production captures**

Run the same `perf:capture` commands as Task 1 into `/tmp/weberaise-perf-after/desktop` and `/tmp/weberaise-perf-after/mobile`.

Do not change viewport, DPR, browser flags, cache state, or network profile between before/after comparisons.

- [ ] **Step 4: Perform visual/interaction regression checks on every route**

Verify manually in production build:

```text
/          loader -> zero -> completion -> hero opening -> hero interaction -> EXPLORE -> full narrative
/services  opening grid -> capabilities silk -> works bridge -> contact ending
/work      opening -> sphere drag/inertia -> activation -> project view -> return
/about     intro -> founder cards -> hover/reveal behavior
```

At minimum test 1440×900 and 390×844, normal motion and prefers-reduced-motion.

Explicitly confirm that none of these files changed unless required by a task in this plan:

```text
src/webgl/reveal/quality.ts
src/webgl/reveal/shaders.ts
src/webgl/reveal/fluid/shaders.ts
src/experience/motion/loaderTimeline.ts
src/experience/motion/heroOpenTimeline.ts
src/experience/motion/exploreTimeline.ts
src/components/ui/SilkWavesBackground/silkShaders.ts
src/components/ui/DriftWall/driftWallMotion.ts
```

- [ ] **Step 5: Write the final report with measured deltas only**

Create `docs/PERFORMANCE_OPTIMIZATION_REPORT_2026-09-01.md` containing:

```markdown
# WEBERAISE Performance Optimization Report — 2026-09-01

## Fidelity Result
- Full test suite: PASS/FAIL with count
- Typecheck: PASS/FAIL
- Production build: PASS/FAIL
- Desktop visual verification: PASS/FAIL
- Mobile visual verification: PASS/FAIL
- Reduced-motion verification: PASS/FAIL
- Hero fluid/timeline files changed: NO

## Initial Homepage
| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| JS transfer before heroInteractive | ... | ... | ... |
| JS decoded bytes before heroInteractive | ... | ... | ... |
| Long-task total before heroInteractive | ... | ... | ... |

## Post-EXPLORE Loading
| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| Framer/ribbon modules in initial graph | ... | ... | ... |
| Main runtime ready before EXPLORE | ... | ... | ... |

## Assets
| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| public journey asset bytes | ... | ... | ... |
| display PNG bytes | ... | ... | ... |
| pixel mismatches | 0 | 0 | 0 |

## WorkSphere
| Metric | Before | After | Delta |
| --- | ---: | ---: | ---: |
| settled 10s WebGL draws | ... | ... | ... |
| matrix temporary allocations/frame | ... | ... | ... |
| visible/motion regression | none | none | none |

## Caching
- Existing deployed headers: ...
- Change required: yes/no
- Repeat-load result: ...
```

Replace every ellipsis with measured values before committing; do not write estimates.

- [ ] **Step 6: Review the complete diff for scope drift**

```bash
git status --short
git diff --stat BASE_OF_PERF_BRANCH..HEAD
git diff --name-only BASE_OF_PERF_BRANCH..HEAD
```

Reject any unrelated visual/design refactor.

- [ ] **Step 7: Commit the report**

```bash
git add docs/PERFORMANCE_OPTIMIZATION_REPORT_2026-09-01.md
git commit -m "docs: record zero-quality performance results"
```

---

## Execution Order and Stop Rules

Execute tasks strictly in order: `1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9`.

After Tasks 2, 3, 6, and 7, stop for a fresh visual/performance gate before continuing. Do not stack another optimization on top of an unverified one.

A task is reverted immediately if any of these occur:

- a loader/hero/main state takes longer or exposes a blank frame;
- any animation changes path, duration, ease, cadence, or appearance;
- any runtime PNG has non-zero decoded-pixel error;
- WorkSphere pointer/inertia/project transitions differ from baseline;
- a font flash or typography metric changes;
- the bundle/load change is not measurable;
- the optimization requires lowering a quality parameter.

The preferred end state is fewer bytes and less redundant computation with the exact same user-facing experience — not a higher benchmark score obtained by weakening the site.