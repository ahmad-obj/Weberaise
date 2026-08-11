# Weberaise Signature Intro Implementation

Production-oriented implementation of the approved Weberaise homepage intro milestone:

`real loader → masked hero opening → viscous interactive reveal → EXPLORE → black First Impression`

The downstream homepage skeleton is preserved, but its final art direction remains intentionally unfinished until the next design phase.

## Source of truth

Read before changing visual behavior:

1. `docs/reference/WEBERAISE_MASTER_PLANNING.md`
2. `docs/reference/WEBERAISE_WEBGL_REVEAL_RESEARCH.md`
3. `docs/reference/WEBERAISE_MASTER_IMPLEMENTATION_PROMPT.md`
4. `docs/reference/WEBERAISE_HANDOFF_PROMPT.md`

Newer decisions in the master planning document override older handoff/skeleton notes.

## Stack

- Next.js App Router + TypeScript
- React Server Components where practical
- GSAP for authored intro timelines
- custom WebGL2 low-resolution feedback mask for the signature reveal
- native scrolling after `EXPLORE`

## Production app

Once npm registry access is available:

```bash
npm install
npm run test
npm run typecheck
npm run build
npm run dev
```

Open the URL printed by Next.js.

> The implementation sandbox used for this handoff could not reach `registry.npmjs.org` (`EAI_AGAIN`), so dependency installation and the Next.js production build could not be verified here. See `docs/IMPLEMENTATION_STATUS.md`.

## Dependency-free visual prototype

The prototype exists only for visual QA in restricted/offline environments; production architecture lives under `src/`.

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173/prototype/
```

Structural smoke test:

```bash
./scripts/smoke-prototype.sh
```

The sandbox Chromium capture harness is:

```bash
xvfb-run -a python3 scripts/capture-prototype.py
```

## Tests available without npm install

```bash
npm test
```

The test command uses Node's built-in test runner and TypeScript stripping for the dependency-free core behavior.

A dependency-free TypeScript core compile can also be run with a globally available compiler:

```bash
tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler \
  --allowImportingTsExtensions --lib ES2022,DOM \
  src/experience/state/experienceReducer.ts \
  src/experience/loading/countdownPositions.ts \
  src/experience/loading/progressController.ts \
  src/webgl/reveal/math.ts \
  src/webgl/reveal/emitters/types.ts \
  src/webgl/reveal/emitters/pointerEmitter.ts \
  src/webgl/reveal/emitters/autonomousEmitter.ts \
  src/webgl/reveal/emitters/bottomFillEmitter.ts \
  src/webgl/reveal/pointerTracker.ts \
  src/webgl/reveal/quality.ts
```

## Current milestone boundaries

Implemented now:
- truthful critical-resource loader and 100→0 display logic;
- loader line/tagline choreography;
- strict twin-line hero opening;
- registered `WELCOME / TO` front/reveal composition;
- thick semi-fluid persistent pointer reveal;
- one-shot autonomous brand reveal;
- custom cursor on fine pointers;
- WebGL/reduced-motion fallback structure;
- same-route `EXPLORE` viscous black fill;
- scroll unlock onto black First Impression;
- semantic downstream skeleton with explicit TODOs instead of fabricated proof.

Not yet finalized:
- navigation system;
- First Impression final art direction/entrance;
- downstream section motion/polish;
- real case-study imagery/data;
- audit workflow;
- real proof/testimonials;
- final engagement/pricing details;
- contact/intake integration.

See `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_STATUS.md` for details.
