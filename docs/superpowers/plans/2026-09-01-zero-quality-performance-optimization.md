# Zero-Quality Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make WEBERAISE measurably faster by deferring unnecessary JavaScript, removing proven-dead work/bytes, shrinking runtime assets losslessly, and eliminating redundant WorkSphere computation without changing any visible design, motion, timing, typography, interaction, or decoded image pixel.

**Architecture:** Performance gains come from changing *when* work happens and avoiding work whose output would be identical. Establish a production baseline first, then split code by experience phase, remove only mechanically proven unused resources, recompress images only losslessly, and optimize WorkSphere without changing its RAF/controller cadence or rendering math.

**Tech Stack:** Next.js 16.3.0 App Router, React 19.2.8, TypeScript 7.0.2, GSAP 3.15.0, Framer Motion 12.43.0, WebGL/WebGL2, Node test runner, Chrome DevTools Protocol.

**Spec:** `docs/superpowers/specs/2026-09-01-zero-quality-performance-optimization-design.md`

## Global Constraints

- Do not change any Hero fluid quality-profile value, shader equation, solver pass, blend mode, DPR cap, pressure iteration count, splat radius/force, dissipation, reveal gain, edge softness, or edge width.
- Do not change loader countdown timing, zero hold, loader completion choreography, Hero opening choreography, EXPLORE choreography, GSAP ease, duration, or sequencing.
- Do not lower animation FPS, WorkSphere mesh detail, Silk quality, DriftWall quality, live-video count, or media cadence.
- Do not change typography, copy, metadata, semantic/SEO content, accessibility behavior, or reduced-motion behavior.
- Do not use lossy image conversion. Every modified runtime PNG must decode to exactly the same RGBA pixels.
- Do not upgrade Next.js, React, GSAP, Framer Motion, TypeScript, or any production dependency in this pass.
- At execution time branch from the then-current `feature/hero-nothin-reveal-fidelity` HEAD using the worktree skill. Do not merge unless explicitly requested.
- Every optimization receives its own focused test cycle, visual gate, and commit.
- A faster metric with any blank frame, delayed transition, missing first interaction, geometry drift, font flash, changed animation, or changed image pixel is a failed optimization and is reverted.

---

## File Map

### New files

- `scripts/capture-performance-qa.mjs` — reproducible CDP capture of homepage phase resources, timing, screenshots, and long tasks.
- `tests/performance-hero-loading.test.mjs` — Hero split/prewarm source contract.
- `src/components/MainSite/PostExploreNarrative/postExploreRuntime.ts` — cached dynamic-import boundary for heavy post-EXPLORE modules.
- `src/components/ui/ShutterTextPlaceholder.tsx` — hidden, Framer-free placeholder that preserves inactive ShutterText layout.
- `tests/post-explore-runtime-loading.test.mjs` — verifies ribbon/Framer runtime is dynamically loaded and prewarmed later.
- `tests/font-runtime-contract.test.mjs` — proves the technical font is unused before removal.
- `tests/public-artwork-contract.test.mjs` — proves runtime code references only display artwork.
- `src/webgl/workSphere/frameInvalidation.ts` — pure WorkSphere draw-invalidation policy.
- `tests/work-frame-invalidation.test.mjs` — invalidation behavior contract.
- `docs/PERFORMANCE_OPTIMIZATION_REPORT_2026-09-01.md` — measured before/after results.

### Existing files modified

- `src/components/experience/ExperienceShell.tsx`
- `src/components/experience/Loader/Loader.tsx`
- `src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx`
- `src/app/layout.tsx`
- `src/webgl/workSphere/math.ts`
- `src/webgl/workSphere/WorkSphereEngine.ts`
- `src/webgl/workSphere/mediaPool.ts`
- `package.json`
- `next.config.ts` only if deployed-cache measurement proves a change is needed and URLs are fingerprinted first.

### Path/binary-only changes

- `public/artwork/journey/source/**` moves to `docs/reference/artwork/journey/source/**` after reference proof.
- `public/artwork/journey/ASSET_MANIFEST.json` moves to `docs/reference/artwork/journey/ASSET_MANIFEST.json` after reference proof.
- `public/artwork/journey/display/Q1/*.png` and `Q2/*.png` may receive lossless recompression only.

---

### Task 1: Establish the Production Performance and Fidelity Baseline

**Files:**
- Create: `scripts/capture-performance-qa.mjs`
- Modify: `package.json`

**Interfaces:**
- Input: production server URL, Chrome page DevTools websocket, output directory, viewport.
- Output: `metrics.json`, `hero-interactive.png`, and `main.png` for each viewport.

- [ ] **Step 1: Create the isolated execution branch and record its immutable base SHA**

After using `superpowers:using-git-worktrees`, run inside the new worktree:

```bash
PERF_BASE=$(git rev-parse HEAD)
printf '%s\n' "$PERF_BASE" > /tmp/weberaise-perf-base-sha
```

This SHA is the final whole-pass diff base.

- [ ] **Step 2: Prove the branch is healthy before performance work**

```bash
npm ci
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: every command exits `0`. Existing failures are not fixed in this branch; they must be separated before continuing.

- [ ] **Step 3: Save the first-party Next.js bundle graph**

```bash
rm -rf /tmp/weberaise-perf-before
mkdir -p /tmp/weberaise-perf-before
npx next experimental-analyze --output
cp -R .next/diagnostics/analyze /tmp/weberaise-perf-before/analyze
```

Expected: `.next/diagnostics/analyze` exists. Do not add `@next/bundle-analyzer`; Next.js 16.3 already contains the Turbopack analyzer.

- [ ] **Step 4: Add the CDP capture script**

Create `scripts/capture-performance-qa.mjs` with this implementation:

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

let sequence = 0;
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
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
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
const capture = async (filename) => {
  const result = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`${options.out}/${filename}`, Buffer.from(result.data, 'base64'));
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
  await capture(`${name}.png`);
  return { resources, navigation, longTasks, metrics: metrics.metrics };
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
await call('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
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
await writeFile(
  `${options.out}/metrics.json`,
  `${JSON.stringify({ viewport: { width: options.width, height: options.height }, heroInteractive, main }, null, 2)}\n`,
);
socket.close();
```

- [ ] **Step 5: Add the package script**

Add to `package.json` scripts:

```json
"perf:capture": "node scripts/capture-performance-qa.mjs"
```

No dependency change is allowed.

- [ ] **Step 6: Run the baseline at desktop and mobile widths**

Start production server in one shell:

```bash
PORT=3000 npm run start
```

Start a clean Chrome debugging profile in another shell:

```bash
rm -rf /tmp/weberaise-perf-chrome
chromium --remote-debugging-port=9222 --user-data-dir=/tmp/weberaise-perf-chrome --disable-extensions about:blank
```

Resolve the page websocket automatically:

```bash
PAGE_WS=$(python3 - <<'PY'
import json, urllib.request
pages = json.load(urllib.request.urlopen('http://127.0.0.1:9222/json/list'))
print(next(page['webSocketDebuggerUrl'] for page in pages if page.get('type') == 'page'))
PY
)
```

Capture both viewports:

```bash
npm run perf:capture -- --ws "$PAGE_WS" --url http://127.0.0.1:3000 --out /tmp/weberaise-perf-before/desktop --viewport 1440x900
npm run perf:capture -- --ws "$PAGE_WS" --url http://127.0.0.1:3000 --out /tmp/weberaise-perf-before/mobile --viewport 390x844
```

Expected in each directory: `hero-interactive.png`, `main.png`, `metrics.json`.

- [ ] **Step 7: Commit the measurement harness only**

```bash
git add package.json scripts/capture-performance-qa.mjs
git commit -m "test: add production performance capture harness"
```

---

### Task 2: Split Hero Code from the Initial Homepage Client Graph

**Files:**
- Create: `tests/performance-hero-loading.test.mjs`
- Modify: `src/components/experience/ExperienceShell.tsx`
- Modify: `src/components/experience/Loader/Loader.tsx`

**Interfaces:**
- `Hero` keeps its existing props and phase contract.
- The loader's existing `hero-code` critical task becomes the owner of loading the Hero module and warming the reveal engine.

- [ ] **Step 1: Write the failing source-contract test**

Create `tests/performance-hero-loading.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const shellPath = new URL('../src/components/experience/ExperienceShell.tsx', import.meta.url);
const loaderPath = new URL('../src/components/experience/Loader/Loader.tsx', import.meta.url);

test('Hero is split from ExperienceShell and prewarmed by Loader', async () => {
  const [shell, loader] = await Promise.all([readFile(shellPath, 'utf8'), readFile(loaderPath, 'utf8')]);
  assert.match(shell, /import dynamic from ['"]next\/dynamic['"]/);
  assert.doesNotMatch(shell, /import\s+\{\s*Hero\s*\}\s+from\s+['"]@\/components\/experience\/Hero\/Hero['"]/);
  assert.match(shell, /import\(['"]@\/components\/experience\/Hero\/Hero['"]\)/);
  assert.match(loader, /import\(['"]@\/components\/experience\/Hero\/Hero['"]\)/);
  assert.match(loader, /import\(['"]@\/webgl\/reveal\/createRevealEngine['"]\)/);
  assert.match(loader, /warmRevealEngine\(\)/);
});
```

- [ ] **Step 2: Confirm RED**

```bash
node --test tests/performance-hero-loading.test.mjs
```

Expected: FAIL because `ExperienceShell` still has a static Hero import.

- [ ] **Step 3: Add the dynamic Hero boundary**

In `ExperienceShell.tsx`, remove the static Hero import and add:

```ts
import dynamic from 'next/dynamic';

const Hero = dynamic(
  () => import('@/components/experience/Hero/Hero').then((module) => module.Hero),
);
```

Do not alter Hero JSX or props.

- [ ] **Step 4: Make Loader preload the Hero module before critical readiness**

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

Replace only the existing `hero-code` task body:

```ts
{ id: 'hero-code', weight: 2, run: warmHeroCode },
```

Keep its weight and all loader timing unchanged.

- [ ] **Step 5: Verify correctness and build**

```bash
node --test tests/performance-hero-loading.test.mjs
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: all PASS.

- [ ] **Step 6: Verify the handoff visually and in the analyzer**

Repeat Task 1 captures into `/tmp/weberaise-perf-task2`. Acceptance requirements:

- no blank frame between loader completion and Hero opening;
- exact same Hero logo/typography/layout at both viewports;
- same state order `loading -> loaderCompletion -> heroOpening -> heroInteractive`;
- bundle analyzer no longer shows the reveal engine entering the initial graph through a static `ExperienceShell -> Hero` import chain.

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
- Produces `loadPostExploreRuntime(): Promise<PostExploreRuntime>` and `preloadPostExploreRuntime(): void`.
- `JourneyNarrative` markup and visible behavior remain unchanged.

- [ ] **Step 1: Write the failing runtime-boundary test**

Create `tests/post-explore-runtime-loading.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const journeyPath = new URL('../src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx', import.meta.url);
const shellPath = new URL('../src/components/experience/ExperienceShell.tsx', import.meta.url);
const runtimePath = new URL('../src/components/MainSite/PostExploreNarrative/postExploreRuntime.ts', import.meta.url);

test('post-EXPLORE heavy modules are behind one cached dynamic boundary', async () => {
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
});
```

- [ ] **Step 2: Confirm RED**

```bash
node --test tests/post-explore-runtime-loading.test.mjs
```

Expected: FAIL because the runtime loader does not exist and the imports are static.

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

- [ ] **Step 4: Create the inactive Framer-free placeholder**

Create `src/components/ui/ShutterTextPlaceholder.tsx`:

```tsx
import styles from './shutter-text.module.css';

function glyph(char: string) {
  return char === ' ' ? '\u00A0' : char;
}

export function ShutterTextPlaceholder({ lines }: { lines: readonly string[] }) {
  return (
    <span className={styles.root} aria-label={lines.join(' ')}>
      <span className={`${styles.row} ${styles.placeholder}`} aria-hidden="true">
        {lines.map((line, lineIndex) => (
          <span
            key={`${line}-${lineIndex}`}
            className={styles.line}
            data-reassurance-line={lineIndex === 0 ? 'one' : 'two'}
          >
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

The existing `.placeholder { visibility: hidden; }` rule remains unchanged.

- [ ] **Step 5: Prewarm the runtime during Hero interaction without awaiting it**

In `ExperienceShell.tsx`, import only the tiny loader module:

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

This effect must never block Hero interaction or EXPLORE.

- [ ] **Step 6: Convert JourneyNarrative to consume the cached runtime only when main starts**

Keep type-only imports for `BuiltJourneyPath` and `JourneyStopId`. Remove static value imports of `buildJourneyPath`, `createRibbonController`, `getJourneyRoute`, `revealJourneyStop`, and `ShutterText`.

Add:

```ts
import { ShutterTextPlaceholder } from '@/components/ui/ShutterTextPlaceholder';
import { loadPostExploreRuntime, type PostExploreRuntime } from './postExploreRuntime';
```

Add state:

```ts
const [ShutterTextRuntime, setShutterTextRuntime] = useState<PostExploreRuntime['ShutterText'] | null>(null);
```

Inside the first layout effect, add:

```ts
let disposed = false;
let runtime: PostExploreRuntime | null = null;
```

Keep `rebuild` defined before `scheduleRebuild`, but make it runtime-aware:

```ts
const rebuild = () => {
  if (!runtime) return;
  const config = runtime.getJourneyRoute(window.innerWidth);
  const built = runtime.buildJourneyPath(root, config);
  lastWidth = built.width;
  lastHeight = built.height;
  setGeometry({ ...built, sampleSpacing: config.sampleSpacing });
};
```

Make `startJourney` asynchronous and race-safe:

```ts
const startJourney = async () => {
  if (started || disposed || (shell && shell.dataset.experienceState !== 'main')) return;
  started = true;
  runtime = await loadPostExploreRuntime();
  if (disposed) return;
  setShutterTextRuntime(() => runtime!.ShutterText);

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

Call it with `void startJourney()` from both the immediate-main path and the existing mutation-observer path.

In cleanup, set `disposed = true` before disconnecting observers/timers.

In the controller layout effect, resolve the cached runtime before constructing the controller:

```ts
let disposed = false;
let cleanupController: () => void = () => undefined;
const frame = window.requestAnimationFrame(() => {
  void loadPostExploreRuntime().then((runtimeModule) => {
    if (disposed) return;
    cleanupController = runtimeModule.createRibbonController({
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
          if (target) runtimeModule.revealJourneyStop(target, reducedMotion);
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

Replace the reassurance child only:

```tsx
{ShutterTextRuntime ? (
  <ShutterTextRuntime lines={['DONT WORRY.', 'WE GOT YOU']} active={reassuranceActive} />
) : (
  <ShutterTextPlaceholder lines={['DONT WORRY.', 'WE GOT YOU']} />
)}
```

- [ ] **Step 7: Verify tests and production build**

```bash
node --test tests/post-explore-runtime-loading.test.mjs
npm test
npm run typecheck
npm run build
git diff --check
npx next experimental-analyze --output
```

Acceptance requirement: Framer Motion and the large ribbon geometry/controller modules are absent from the earliest homepage client path unless another genuinely initial feature imports them.

- [ ] **Step 8: Verify immediate EXPLORE under throttling**

Run the production site with Chrome DevTools Fast 3G throttling. As soon as `heroInteractive` appears, click EXPLORE immediately.

Pass condition: no missing ribbon, delayed question geometry, missing Shutter animation, or delayed EXPLORE completion.

If this fails, do **not** delay EXPLORE. Move the non-blocking `preloadPostExploreRuntime()` trigger earlier to `heroOpening` and repeat. If the visual/timing invariant still cannot be guaranteed, revert Task 3 and retain the baseline loading strategy.

- [ ] **Step 9: Commit only after the throttle gate passes**

```bash
git add src/components/experience/ExperienceShell.tsx src/components/MainSite/PostExploreNarrative/JourneyNarrative.tsx src/components/MainSite/PostExploreNarrative/postExploreRuntime.ts src/components/ui/ShutterTextPlaceholder.tsx tests/post-explore-runtime-loading.test.mjs
git commit -m "perf: defer post-explore runtime from initial load"
```

---

### Task 4: Remove Geist Mono Only if Production Source Proves It Is Unused

**Files:**
- Create: `tests/font-runtime-contract.test.mjs`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write the source-wide contract**

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

test('technical font is not used or registered', async () => {
  const files = await walk(path.resolve('src'));
  const usages = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    if (file.endsWith(path.join('src', 'app', 'layout.tsx'))) continue;
    if (source.includes('--font-technical') || source.includes('Geist_Mono')) usages.push(file);
  }
  assert.deepEqual(usages, []);
  const layout = await readFile(path.resolve('src/app/layout.tsx'), 'utf8');
  assert.doesNotMatch(layout, /Geist_Mono|geistMono|--font-technical/);
});
```

- [ ] **Step 2: Confirm RED and the absence of real usages**

```bash
node --test tests/font-runtime-contract.test.mjs
rg --line-number --glob '!src/app/layout.tsx' -- '--font-technical|Geist_Mono|geistMono' src
```

Expected: test fails only because `layout.tsx` still registers Geist Mono; `rg` prints no production usage. If `rg` finds a real usage, abort Task 4 and keep the font.

- [ ] **Step 3: Remove only Geist Mono from the root layout**

Change:

```ts
import { Geist, Geist_Mono, Inter_Tight } from 'next/font/google';
```

to:

```ts
import { Geist, Inter_Tight } from 'next/font/google';
```

Delete the `geistMono` declaration and change the html class to:

```tsx
<html lang="en" className={`${geist.variable} ${interTight.variable}`}>
```

Do not change Geist or Inter Tight options.

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

### Task 5: Remove Master Artwork from the Public Deployment Tree

**Files:**
- Create: `tests/public-artwork-contract.test.mjs`
- Move: `public/artwork/journey/source/**` → `docs/reference/artwork/journey/source/**`
- Move: `public/artwork/journey/ASSET_MANIFEST.json` → `docs/reference/artwork/journey/ASSET_MANIFEST.json`

- [ ] **Step 1: Write the runtime-reference proof test**

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
    else if (/\.(?:ts|tsx|js|mjs|css|json)$/.test(entry.name)) files.push(full);
  }
  return files;
}

test('runtime source uses journey display assets only', async () => {
  const files = await walk(path.resolve('src'));
  const source = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
  assert.doesNotMatch(source, /\/artwork\/journey\/source\//);
  assert.doesNotMatch(source, /ASSET_MANIFEST\.json/);
  assert.match(source, /\/artwork\/journey\/display\/Q1/);
  assert.match(source, /\/artwork\/journey\/display\/Q2/);
});
```

- [ ] **Step 2: Prove the current runtime already satisfies that contract**

```bash
node --test tests/public-artwork-contract.test.mjs
rg --line-number '/artwork/journey/source/|ASSET_MANIFEST\.json' src
```

Expected: test PASS and `rg` returns no production source match.

- [ ] **Step 3: Move master/reference files without changing their bytes**

```bash
mkdir -p docs/reference/artwork/journey
git mv public/artwork/journey/source docs/reference/artwork/journey/source
git mv public/artwork/journey/ASSET_MANIFEST.json docs/reference/artwork/journey/ASSET_MANIFEST.json
```

Do not touch `public/artwork/journey/display` in this task.

- [ ] **Step 4: Verify and commit**

```bash
node --test tests/public-artwork-contract.test.mjs
npm test
npm run typecheck
npm run build
git diff --check
find public/artwork/journey -type f -print
git add tests/public-artwork-contract.test.mjs docs/reference/artwork/journey public/artwork/journey
git commit -m "perf: remove source artwork from public deployment"
```

---

### Task 6: Losslessly Recompress Runtime Journey PNGs

**Files:**
- Modify bytes only: `public/artwork/journey/display/Q1/*.png`
- Modify bytes only: `public/artwork/journey/display/Q2/*.png`

- [ ] **Step 1: Preserve exact originals and byte totals**

```bash
rm -rf /tmp/weberaise-png-before
mkdir -p /tmp/weberaise-png-before
cp -a public/artwork/journey/display /tmp/weberaise-png-before/display
find public/artwork/journey/display -type f -name '*.png' -print0 | xargs -0 stat -c '%s %n' > /tmp/weberaise-png-before/sizes.txt
awk '{sum += $1} END {print sum}' /tmp/weberaise-png-before/sizes.txt
```

Record the printed byte total in the final report.

- [ ] **Step 2: Recompress with OxiPNG without stripping or transforming image data**

```bash
find public/artwork/journey/display -type f -name '*.png' -print0 | xargs -0 oxipng -o 4
```

Do not pass `--strip`, palette conversion, bit-depth reduction, or format conversion.

- [ ] **Step 3: Prove exact decoded-pixel equality**

```bash
while IFS= read -r -d '' after; do
  rel="${after#public/artwork/journey/display/}"
  before="/tmp/weberaise-png-before/display/$rel"
  error=$(compare -metric AE "$before" "$after" null: 2>&1 || true)
  if [ "$error" != "0" ]; then
    printf 'PIXEL MISMATCH: %s (%s)\n' "$rel" "$error" >&2
    exit 1
  fi
done < <(find public/artwork/journey/display -type f -name '*.png' -print0)
```

Expected: exit `0`; every file has absolute pixel error `0`.

- [ ] **Step 4: Record after bytes and require a real reduction**

```bash
find public/artwork/journey/display -type f -name '*.png' -print0 | xargs -0 stat -c '%s %n' > /tmp/weberaise-png-after-sizes.txt
awk '{sum += $1} END {print sum}' /tmp/weberaise-png-after-sizes.txt
```

If total bytes are not lower, restore the originals and make no PNG commit. Do not use a lossy setting to manufacture a reduction.

- [ ] **Step 5: Verify application and visual checkpoints**

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Run the existing journey QA capture plus Task 1 desktop/mobile capture. Q1/Q2 must be visually identical.

- [ ] **Step 6: Commit only the recompressed binaries**

```bash
git add public/artwork/journey/display/Q1 public/artwork/journey/display/Q2
git commit -m "perf: losslessly compress journey artwork"
```

---

### Task 7: Remove WorkSphere Hot-Loop Allocations and Identical Redraws

**Files:**
- Create: `src/webgl/workSphere/frameInvalidation.ts`
- Create: `tests/work-frame-invalidation.test.mjs`
- Modify: `src/webgl/workSphere/math.ts`
- Modify: `src/webgl/workSphere/WorkSphereEngine.ts`
- Modify: `src/webgl/workSphere/mediaPool.ts`
- Modify: the existing WorkSphere math/geometry test file chosen for exact matrix regression.

**Interfaces:**
- `multiplyMat4(out, a, b)` retains its current signature and alias-safe semantics.
- `WorkPreviewMediaPool.uploadReadyFrames()` returns `boolean` instead of `void`.
- RAF scheduling/controller update cadence remains exactly as before.

- [ ] **Step 1: Add a reference matrix-multiply regression before changing math**

In the existing WorkSphere math/geometry test, add a local reference implementation matching the current nested-loop formula and assert equality for identity, arbitrary matrices, `out === a`, and `out === b`.

Reference:

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

Run the selected test before implementation and confirm it passes against current behavior.

- [ ] **Step 2: Rewrite `multiplyMat4` allocation-free while preserving operation order**

Read all input matrix values into scalar locals before writing `out`, then compute each output element using the same multiplication/addition order as the reference. This keeps aliasing safe and removes the per-call `new Float32Array(16)`.

The required shape is:

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

- [ ] **Step 3: Make media uploads report whether the canvas can visually change**

Change `uploadReadyFrames()` to:

```ts
uploadReadyFrames(): boolean {
  if (this.destroyed) return false;
  let changed = false;
```

Set `changed = true` after each successful placeholder/video `texImage2D` or `texSubImage2D`. Return `changed` at the end. Do not change placeholder interval, video dirty tracking, playback, priorities, texture filtering, or live slot count.

- [ ] **Step 4: Add the pure draw-invalidation contract**

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

Create `tests/work-frame-invalidation.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldDrawWorkFrame } from '../src/webgl/workSphere/frameInvalidation.ts';

test('WorkSphere redraw invalidation preserves all visual-change causes', () => {
  assert.equal(shouldDrawWorkFrame({ transformChanged: false, mediaChanged: false, force: false }), false);
  assert.equal(shouldDrawWorkFrame({ transformChanged: true, mediaChanged: false, force: false }), true);
  assert.equal(shouldDrawWorkFrame({ transformChanged: false, mediaChanged: true, force: false }), true);
  assert.equal(shouldDrawWorkFrame({ transformChanged: false, mediaChanged: false, force: true }), true);
});
```

Run:

```bash
node --import=tsx --test tests/work-frame-invalidation.test.mjs
```

Expected: PASS once the helper exists.

- [ ] **Step 5: Reuse engine-owned matrix scratch buffers**

Add once on `WorkSphereEngine`:

```ts
private readonly translationScratch = mat4Identity();
private readonly scaleScratch = mat4Identity();
private readonly facingScratch = mat4Identity();
private forceRender = true;
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

Inside `updateMatrices()`, replace `matrix.set(mat4Identity())`, `translationMatrix(...)`, `scaleMatrix(...)`, and `targetToMat4(mat4Identity(), ...)` with the reusable buffers. Preserve multiplication order exactly.

- [ ] **Step 6: Skip only mathematically identical redraws while retaining every RAF/controller update**

At the beginning of `frame`, snapshot four orientation scalars and camera Z:

```ts
const q0 = this.controller.orientation[0];
const q1 = this.controller.orientation[1];
const q2 = this.controller.orientation[2];
const q3 = this.controller.orientation[3];
const cameraBefore = this.cameraZ;
```

Keep all controller/snap/camera calculations in their current order. After camera stepping:

```ts
const orientationChanged =
  q0 !== this.controller.orientation[0]
  || q1 !== this.controller.orientation[1]
  || q2 !== this.controller.orientation[2]
  || q3 !== this.controller.orientation[3];
const cameraChanged = cameraBefore !== this.cameraZ;

if (cameraChanged) this.updateView();
if (orientationChanged) this.updateMatrices();
const mediaChanged = this.mediaPool.uploadReadyFrames();
const transformChanged = orientationChanged || cameraChanged;

if (shouldDrawWorkFrame({ transformChanged, mediaChanged, force: this.forceRender })) {
  this.render();
  this.forceRender = false;
}
this.scheduleFrame();
```

The RAF loop is still scheduled every frame exactly as before.

Set `forceRender = true` in every method that changes visible state outside normal orientation/camera evolution: `start`, `resize`, `setEntranceProgress`, `snapToSlot`, `beginResolveToSlot`, `restoreTransitionSnapshot`, `setSelectedSlotHidden`, `setProjectOpenProgress`, and the visible branch of `onVisibilityChange`.

Do not alter inertia thresholds, snap equations, camera constants, or `deltaMs` handling.

- [ ] **Step 7: Run the full WorkSphere regression gate**

```bash
node --import=tsx --test tests/work-frame-invalidation.test.mjs
npm test
npm run typecheck
npm run build
git diff --check
```

All existing WorkSphere control, geometry, activation, transition, and reference-contract tests must pass.

- [ ] **Step 8: Browser parity test**

On `/work`, repeat before/after with the same viewport:

1. drag through the same pointer path;
2. release and let inertia settle;
3. keyboard-snap between the same slots;
4. open the same project;
5. return to the sphere;
6. leave the settled sphere visible for 10 seconds.

Instrument `gl.drawElementsInstanced` in a local QA build to count draws. Pass requirements:

- movement/selection/project transitions are visually identical;
- live preview/placeholder cadence is unchanged;
- settled interval has fewer identical redraws when no media/transform state changed;
- no frame-rate reduction is introduced.

- [ ] **Step 9: Commit**

```bash
git add src/webgl/workSphere/math.ts src/webgl/workSphere/WorkSphereEngine.ts src/webgl/workSphere/mediaPool.ts src/webgl/workSphere/frameInvalidation.ts tests/work-frame-invalidation.test.mjs tests/work-sphere-geometry.test.mjs
git commit -m "perf: remove redundant work-sphere frame work"
```

Use the actual existing WorkSphere test filename modified for the matrix regression in the `git add` command if it differs from `tests/work-sphere-geometry.test.mjs`.

---

### Task 8: Measure Deployed Caching Before Adding Any Header

**Files:**
- Modify `next.config.ts` only if measurement proves a safe cache miss and runtime public filenames are fingerprinted first.

**Interfaces:**
- No stable unversioned public URL may receive `immutable` caching.

- [ ] **Step 1: Require an explicit deployed preview origin and measure headers**

```bash
: "${WEBERAISE_DEPLOYED_ORIGIN:?Set WEBERAISE_DEPLOYED_ORIGIN to the exact preview origin before running cache tests}"
curl -I "$WEBERAISE_DEPLOYED_ORIGIN/brand/weberaise-horizontal-on-dark.svg"
curl -I "$WEBERAISE_DEPLOYED_ORIGIN/artwork/journey/display/Q1/01_island_platform.png"
```

From the deployed homepage HTML, resolve one current Next static chunk automatically:

```bash
CHUNK_PATH=$(curl -fsSL "$WEBERAISE_DEPLOYED_ORIGIN/" | grep -oE '/_next/static/[^" ]+\.js' | head -n 1)
test -n "$CHUNK_PATH"
curl -I "$WEBERAISE_DEPLOYED_ORIGIN$CHUNK_PATH"
```

Record `cache-control`, `age`, `etag`, `cf-cache-status`, and content length.

- [ ] **Step 2: Choose one of two explicit outcomes**

**Outcome A — caching is already safe/effective:** make no code change. Store the header evidence in the final report.

**Outcome B — public runtime assets lack useful cacheability:** fingerprint every file that would be matched by a new immutable header before adding that header. Use content-hash prefixes in filenames and update all runtime references with `rg` verification. Do not apply `immutable` to a directory containing any stable unversioned filename.

- [ ] **Step 3: If Outcome B applies, add headers only after fingerprinting**

After every matched runtime asset is fingerprinted, `next.config.ts` may add:

```ts
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
```

If any matched filename is not fingerprinted, do not add these rules.

- [ ] **Step 4: Verify preview deployment after any cache change**

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Deploy the branch preview, rerun Step 1, then reload twice in a clean browser profile. Any stale asset, 404, or changed visual fails the task.

- [ ] **Step 5: Commit only when Outcome B produced a verified code change**

```bash
git add next.config.ts public src tests
git commit -m "perf: fingerprint and cache immutable runtime assets"
```

For Outcome A, there is intentionally no commit.

---

### Task 9: Final Whole-Site Verification and Measured Report

**Files:**
- Create: `docs/PERFORMANCE_OPTIMIZATION_REPORT_2026-09-01.md`
- No production code changes.

- [ ] **Step 1: Clean full correctness gate**

```bash
rm -rf node_modules .next
npm ci
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: all PASS.

- [ ] **Step 2: Capture final analyzer and homepage evidence with the exact baseline procedure**

```bash
rm -rf /tmp/weberaise-perf-after
mkdir -p /tmp/weberaise-perf-after
npx next experimental-analyze --output
cp -R .next/diagnostics/analyze /tmp/weberaise-perf-after/analyze
```

Run the same production server, Chrome flags, viewports, motion setting, and cache state used in Task 1, writing captures to `/tmp/weberaise-perf-after/desktop` and `/tmp/weberaise-perf-after/mobile`.

- [ ] **Step 3: Calculate comparable homepage JS/long-task totals from captured JSON**

Run for before and after desktop captures:

```bash
node - <<'NODE'
const fs = require('node:fs');
for (const label of ['before', 'after']) {
  const file = `/tmp/weberaise-perf-${label}/desktop/metrics.json`;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const phase of ['heroInteractive', 'main']) {
    const snap = data[phase];
    const js = snap.resources.filter((entry) => entry.name.includes('.js'));
    const transfer = js.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
    const decoded = js.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), 0);
    const longTaskMs = snap.longTasks.reduce((sum, entry) => sum + entry.duration, 0);
    console.log(JSON.stringify({ label, phase, jsTransferBytes: transfer, jsDecodedBytes: decoded, longTaskMs }));
  }
}
NODE
```

Use these exact outputs in the report; do not estimate.

- [ ] **Step 4: Perform route-by-route visual/interaction regression**

Verify production build at 1440×900 and 390×844, with normal motion and `prefers-reduced-motion: reduce`:

```text
/          loader -> zero -> completion -> Hero opening -> Hero interaction -> EXPLORE -> full narrative
/services  opening grid -> capabilities Silk -> Works bridge -> contact ending
/work      opening -> sphere drag/inertia -> activation -> project view -> return
/about     intro -> founder cards -> hover/reveal behavior
```

Explicitly confirm these protected visual-core files are unchanged by the performance pass:

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

- [ ] **Step 5: Write the report using measured evidence only**

`docs/PERFORMANCE_OPTIMIZATION_REPORT_2026-09-01.md` must contain these sections, each populated from the completed commands and captured files:

1. **Fidelity Result** — full test count/result, typecheck result, build result, desktop/mobile/reduced-motion verification result, and confirmation that protected Hero/timeline/shader files were not modified.
2. **Initial Homepage** — before/after JS transfer bytes, decoded JS bytes, and long-task milliseconds at `heroInteractive`, using Step 3 output.
3. **Post-EXPLORE Loading** — bundle-analyzer import-chain evidence showing whether Framer/ribbon modules left the initial graph and whether immediate-throttle EXPLORE passed.
4. **Assets** — pre/post public journey bytes, pre/post display PNG bytes, and exact pixel mismatch count (must be zero).
5. **WorkSphere** — before/after 10-second settled draw count plus motion/project-transition parity result.
6. **Caching** — exact observed deployed headers and whether Task 8 used Outcome A or B.
7. **Rejected Optimizations** — list any candidate reverted because it failed a fidelity gate.

No guessed percentage or synthetic score is allowed.

- [ ] **Step 6: Review the complete scope diff against the recorded base SHA**

```bash
BASE=$(cat /tmp/weberaise-perf-base-sha)
git status --short
git diff --stat "$BASE"..HEAD
git diff --name-only "$BASE"..HEAD
```

Reject unrelated design/refactor changes.

- [ ] **Step 7: Commit the measured report**

```bash
git add docs/PERFORMANCE_OPTIMIZATION_REPORT_2026-09-01.md
git commit -m "docs: record zero-quality performance results"
```

---

## Execution Order and Mandatory Checkpoints

Execute strictly in this order:

```text
1 Baseline harness
2 Hero split
3 Post-EXPLORE runtime split
4 Unused font removal
5 Public source-art relocation
6 Lossless PNG recompression
7 WorkSphere redundant-work removal
8 Deployed cache measurement/configuration
9 Final verification/report
```

Stop for a fresh visual/performance review after Tasks 2, 3, 6, and 7 before continuing.

Immediately revert a task if any of the following occurs:

- loader/Hero/main handoff exposes a blank or later frame;
- motion path, duration, ease, cadence, or appearance changes;
- a runtime PNG returns non-zero absolute pixel error;
- WorkSphere pointer/inertia/snap/project transitions differ from baseline;
- a font flash or typography metric changes;
- the supposed optimization produces no measurable benefit;
- shipping it would require a lower quality parameter.

The required end state is fewer early bytes and less redundant computation with the exact same user-facing WEBERAISE experience.