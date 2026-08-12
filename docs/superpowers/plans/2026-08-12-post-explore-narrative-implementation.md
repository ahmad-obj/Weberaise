# Post-Explore Narrative Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the obsolete first-impression placeholder after `EXPLORE` with a polished narrative sequence: three scroll-float visitor questions, particle-assembled reassurance, an Aurora-emphasized Weberaise statement, and a rotating services/GROW ring.

**Architecture:** Preserve the existing intro state machine and EXPLORE `bottomFill` unchanged. `MainSite` receives one new `PostExploreNarrative` feature at the position currently occupied by `FirstImpression`. Each motion technique is isolated: GSAP/ScrollTrigger for questions, Canvas 2D for particles, CSS for Aurora and ring rotation. No additional general animation dependency or WebGL context is introduced.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, GSAP 3.15.0 + ScrollTrigger, Canvas 2D, CSS Modules, existing Weberaise design tokens, Node tests through `tsx`.

## Global Constraints

- Branch: `feature/signature-intro`; do not merge PR #1.
- Preserve state flow exactly: `boot → loading → loaderCompletion → heroOpening → heroInteractive → heroExiting → main`.
- Do not modify loader, hero reveal, cursor liquid, EXPLORE button, `bottomFill`, or `src/experience/motion/exploreTimeline.ts` unless separate regression evidence exists.
- First post-Explore pixel must be `var(--wr-black)` so the existing liquid fill visually becomes the homepage background with no white flash, blue-black flash, overlay wipe, or hard cut.
- Exact narrative order:
  1. `Need a website?`
  2. `Need a redesign?`
  3. `Need to look better online?`
  4. short empty-black breathing beat
  5. `DONT WORRY. WE GOT YOU`
  6. `We build websites that move businesses forward.`
  7. ring `WEB DEVELOPMENT · SEO · BRANDING ·`
  8. center `GROW`
- Only `move businesses forward.` receives Aurora styling.
- Do not install `motion`, `motion/react`, Framer Motion, or another animation library.
- Do not create another WebGL system.
- Final Home → Services navbar-detach gateway is out of scope.
- No fake clients, testimonials, metrics, proof, awards, pricing, or social-media-marketing claims.
- Every visually split/canvas-rendered phrase must have an accessible whole-string equivalent.
- `prefers-reduced-motion` must produce a fully readable low-motion version of every scene.
- Particle RAF must stop after its final settled frame.
- Mobile keeps the same narrative order while reducing offsets, particle count/scatter, and ring size.

## Required external effect references

These are implementation references. Preserve the recognizable behavior, but adapt them to Weberaise and the existing stack rather than copying the demos as isolated widgets.

### React Bits — Scroll Float
- Demo/docs: https://reactbits.dev/text-animations/scroll-float
- TypeScript source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ScrollFloat/ScrollFloat.tsx
- CSS source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ScrollFloat/ScrollFloat.css
- Reference behavior to preserve: per-character split; initial `opacity: 0`, `yPercent: 120`, `scaleY: 2.3`, `scaleX: 0.7`; scrubbed GSAP/ScrollTrigger entrance; restrained character stagger near `0.03`.
- Weberaise addition: readable hold plus a custom graceful exit.

### React Bits — Particle Text
- Demo/docs: https://reactbits.dev/text-animations/particle-text
- TypeScript source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ParticleText/ParticleText.tsx
- Reference behavior to preserve: Canvas 2D glyph rasterization, alpha sampling, target particle positions, gather animation, DPR cap, resize rebuild.
- Weberaise adaptation: deterministic sampling, local scatter, no pointer repel, no idle drift, bounded count, no permanent RAF.

### Magic UI — Aurora Text
- Demo/docs: https://magicui.design/docs/components/aurora-text
- Source: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/aurora-text.tsx
- Reference behavior to preserve: animated multi-stop gradient clipped to semantic text.
- Weberaise palette: `#F5F7FA → #60A5FA → #3B82F6 → #2563EB → #F5F7FA`, one cycle in 15s.

### React Bits — Circular Text
- Demo/docs: https://reactbits.dev/text-animations/circular-text
- TypeScript source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/CircularText/CircularText.tsx
- CSS source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/CircularText/CircularText.css
- Reference behavior to preserve: character placement around a circle and calm continuous rotation.
- Weberaise adaptation: React + CSS transforms; no `motion/react`; no speed-up/go-bonkers hover mode.

---

## File map

### Create
- `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx` — semantic composition/root.
- `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css` — scoped layout/motion styling.
- `src/components/MainSite/PostExploreNarrative/QuestionSequence.tsx` — client question DOM + lifecycle.
- `src/components/MainSite/PostExploreNarrative/questionMotion.ts` — question timing constants and GSAP setup.
- `src/components/MainSite/PostExploreNarrative/ParticleReassurance.tsx` — client Canvas 2D reassurance.
- `src/components/MainSite/PostExploreNarrative/particleModel.ts` — deterministic particle profiles/helpers.
- `src/components/MainSite/PostExploreNarrative/AuroraStatement.tsx` — semantic statement + selective Aurora span.
- `src/components/MainSite/PostExploreNarrative/GrowthRing.tsx` — circular services label + stationary `GROW`.
- `tests/post-explore-narrative.test.mjs` — content, structure, performance, dependency and accessibility contracts.

### Modify
- `src/components/MainSite/MainSite.tsx` — replace `FirstImpression` with `PostExploreNarrative`.
- `src/content/homepage.ts` — replace `firstImpressionCopy` with exact `postExploreCopy`.
- `src/app/globals.css` — remove only obsolete `.first-impression*` rules.
- `tests/visual-contract.test.mjs` — add broad black-handoff / dependency / integration guarantees.

### Delete
- `src/components/MainSite/FirstImpression.tsx` after Task 1 replacement passes.

---

## Task 1 — Establish a complete static narrative baseline

**Deliverable:** The old First Impression is gone. The exact approved narrative exists in the correct order on a continuous black background, fully semantic and responsive, but without the special effects yet. This is a complete usable state, not placeholder markup.

**Files:**
- Modify: `src/content/homepage.ts`
- Modify: `src/components/MainSite/MainSite.tsx`
- Create: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx`
- Create: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Create: `tests/post-explore-narrative.test.mjs`
- Modify: `src/app/globals.css`
- Delete: `src/components/MainSite/FirstImpression.tsx`

**Produces:**

```ts
export const postExploreCopy: {
  readonly questions: readonly ['Need a website?', 'Need a redesign?', 'Need to look better online?'];
  readonly reassurance: 'DONT WORRY. WE GOT YOU';
  readonly statementLead: 'We build websites that';
  readonly statementAurora: 'move businesses forward.';
  readonly ring: 'WEB DEVELOPMENT · SEO · BRANDING ·';
  readonly ringCenter: 'GROW';
};
```

- [ ] **Step 1: Write failing source-contract tests**

Create `tests/post-explore-narrative.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('approved post-explore copy is canonical', () => {
  const source = read('src/content/homepage.ts');
  for (const phrase of [
    'Need a website?',
    'Need a redesign?',
    'Need to look better online?',
    'DONT WORRY. WE GOT YOU',
    'We build websites that',
    'move businesses forward.',
    'WEB DEVELOPMENT · SEO · BRANDING ·',
    'GROW',
  ]) assert.ok(source.includes(phrase), phrase);
});

test('MainSite uses PostExploreNarrative instead of FirstImpression', () => {
  const main = read('src/components/MainSite/MainSite.tsx');
  assert.match(main, /PostExploreNarrative/);
  assert.doesNotMatch(main, /FirstImpression/);
  assert.equal(existsSync(resolve(root, 'src/components/MainSite/FirstImpression.tsx')), false);
});
```

- [ ] **Step 2: Run targeted test and confirm failure**

```bash
npm test -- --test-name-pattern="post-explore|MainSite uses"
```

Expected: FAIL because the new content/component does not exist and `FirstImpression` still does.

- [ ] **Step 3: Replace content constant**

Remove `firstImpressionCopy` and add exactly:

```ts
export const postExploreCopy = {
  questions: [
    'Need a website?',
    'Need a redesign?',
    'Need to look better online?',
  ],
  reassurance: 'DONT WORRY. WE GOT YOU',
  statementLead: 'We build websites that',
  statementAurora: 'move businesses forward.',
  ring: 'WEB DEVELOPMENT · SEO · BRANDING ·',
  ringCenter: 'GROW',
} as const;
```

Do not edit unrelated downstream content arrays.

- [ ] **Step 4: Create a complete static `PostExploreNarrative`**

Render semantic sections in exact order using the new copy. Initial markup should be intentionally simple and complete:

```tsx
import { postExploreCopy } from '@/content/homepage';
import styles from './PostExploreNarrative.module.css';

export function PostExploreNarrative() {
  return (
    <section id="post-explore" className={styles.root} data-post-explore-narrative>
      <div className={styles.questionsStatic}>
        {postExploreCopy.questions.map((question) => <h2 key={question}>{question}</h2>)}
      </div>
      <section className={styles.reassuranceStatic}><h2>{postExploreCopy.reassurance}</h2></section>
      <section className={styles.statementStatic}>
        <h2>{postExploreCopy.statementLead} {postExploreCopy.statementAurora}</h2>
      </section>
      <section className={styles.ringStatic} aria-label={`${postExploreCopy.ring} ${postExploreCopy.ringCenter}`}>
        <p>{postExploreCopy.ring}</p><strong>{postExploreCopy.ringCenter}</strong>
      </section>
    </section>
  );
}
```

This baseline is deliberately static but visually valid; later tasks replace each block one at a time with the approved effect.

- [ ] **Step 5: Create baseline CSS**

Root must paint black immediately:

```css
.root {
  margin: 0;
  background: var(--wr-black);
  color: var(--wr-text);
  overflow: clip;
}
```

Give each static scene enough spacing to visually verify order without introducing three unrelated `100svh` question sections. Use responsive `clamp()` values and `var(--wr-page-pad)`.

- [ ] **Step 6: Wire MainSite and remove old component/styles**

Replace import/render of `FirstImpression` with `PostExploreNarrative`, delete `FirstImpression.tsx`, and remove only `.first-impression--black`, `.first-impression__body`, `.first-impression__body h2`, `.first-impression__body p`, and the corresponding mobile override from `globals.css`.

- [ ] **Step 7: Verify static baseline**

```bash
npm test -- --test-name-pattern="post-explore|MainSite uses"
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/content/homepage.ts src/components/MainSite/MainSite.tsx src/components/MainSite/PostExploreNarrative src/app/globals.css tests/post-explore-narrative.test.mjs
git rm src/components/MainSite/FirstImpression.tsx
git commit -m "feat: establish post-explore narrative baseline"
```

---

## Task 2 — Replace static questions with Scroll Float narrative motion

**Deliverable:** One sticky scroll scene carries the three questions through distinct positions with Scroll Float entrances, readable holds, graceful authored exits, and a short empty-black tail.

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/QuestionSequence.tsx`
- Create: `src/components/MainSite/PostExploreNarrative/questionMotion.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Modify: `tests/post-explore-narrative.test.mjs`

**Interfaces:**

```ts
export type QuestionWindow = {
  enterStart: number;
  enterEnd: number;
  holdEnd: number;
  exitEnd: number;
};

export const QUESTION_WINDOWS: readonly QuestionWindow[];
export function createQuestionTimeline(root: HTMLElement, reducedMotion: boolean): () => void;
export function QuestionSequence(props: { questions: readonly string[] }): JSX.Element;
```

- [ ] **Step 1: Write failing timing and structure tests**

Add:

```js
test('question motion preserves approved windows and Scroll Float geometry', () => {
  const motion = read('src/components/MainSite/PostExploreNarrative/questionMotion.ts');
  assert.match(motion, /enterStart:\s*0(?:\.00)?/);
  assert.match(motion, /enterStart:\s*0\.30/);
  assert.match(motion, /enterStart:\s*0\.60/);
  assert.match(motion, /yPercent:\s*120/);
  assert.match(motion, /scaleY:\s*2\.3/);
  assert.match(motion, /scaleX:\s*0\.7/);
  assert.match(motion, /ScrollTrigger/);
});

test('question DOM keeps whole-string accessible text', () => {
  const component = read('src/components/MainSite/PostExploreNarrative/QuestionSequence.tsx');
  assert.match(component, /sr-only/);
  assert.match(component, /aria-hidden/);
  assert.match(component, /data-question-index/);
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
npm test -- --test-name-pattern="question"
```

- [ ] **Step 3: Implement constant timeline windows**

Use exactly:

```ts
export const QUESTION_WINDOWS = [
  { enterStart: 0.00, enterEnd: 0.16, holdEnd: 0.25, exitEnd: 0.35 },
  { enterStart: 0.30, enterEnd: 0.46, holdEnd: 0.55, exitEnd: 0.65 },
  { enterStart: 0.60, enterEnd: 0.76, holdEnd: 0.86, exitEnd: 0.96 },
] as const;
```

The 5% overlap is intentional; only one phrase should remain dominant.

- [ ] **Step 4: Implement split-character accessible DOM**

All three questions remain mounted. Each heading contains:
- visually hidden whole phrase for assistive technology;
- decorative `aria-hidden="true"` character wrapper;
- one span per character;
- spaces rendered as `\u00A0`;
- `data-question-index` on the heading.

Do not mount/unmount questions as scroll progress changes.

- [ ] **Step 5: Implement GSAP/ScrollTrigger motion**

In `useLayoutEffect`, establish initial states before normal paint. Use one scrubbed ScrollTrigger over the scene.

Entrance begins from the React Bits reference geometry:

```ts
{
  opacity: 0,
  yPercent: 120,
  scaleY: 2.3,
  scaleX: 0.7,
  transformOrigin: '50% 0%'
}
```

Resolve to natural geometry with restrained stagger about `0.03`.

Exit sequence per question:
1. begin upward departure (`yPercent` approximately `-18` to `-28`);
2. then compress vertically to roughly `0.94–0.97` and expand horizontally to roughly `1.02–1.04`;
3. only in the final part reduce opacity and introduce a small blur (maximum about `4px`);
4. end fully invisible before the reassurance begins.

The hold window changes no geometry.

Return a cleanup function that kills both GSAP timeline and its ScrollTrigger.

- [ ] **Step 6: Implement scene geometry**

- scroll host: `260svh` desktop, `280svh` mobile;
- sticky stage: `100svh`;
- Q1 approximately center + `(-8vw, -7vh)`;
- Q2 approximately center + `(+7vw, 0)`;
- Q3 approximately center + `(-2vw, +7vh)`;
- below tablet width reduce offsets to roughly one third;
- use max widths and `clamp()` typography so Q3 stays phrase-readable;
- initial CSS hides decorative question layers before GSAP initializes to prevent flash.

- [ ] **Step 7: Reduced motion**

When reduced motion is active, skip scale distortion and blur. Use minimal opacity/translation progression and preserve exact question order and dwell. Do not force the full distorted pinned experience.

- [ ] **Step 8: Replace the static question block**

`PostExploreNarrative` now renders:

```tsx
<QuestionSequence questions={postExploreCopy.questions} />
```

All later static scenes remain intact until their own tasks.

- [ ] **Step 9: Verify and commit**

```bash
npm test -- --test-name-pattern="question"
npm run typecheck
git add src/components/MainSite/PostExploreNarrative tests/post-explore-narrative.test.mjs
git commit -m "feat: add scroll-driven visitor questions"
```

---

## Task 3 — Replace static reassurance with optimized Particle Text

**Deliverable:** `DONT WORRY. WE GOT YOU` forms from clean local particles into crisp text, then stops consuming animation frames.

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/ParticleReassurance.tsx`
- Create: `src/components/MainSite/PostExploreNarrative/particleModel.ts`
- Modify: `PostExploreNarrative.tsx`
- Modify: `PostExploreNarrative.module.css`
- Modify: `tests/post-explore-narrative.test.mjs`

**Interfaces:**

```ts
export type ParticleProfile = {
  maxParticles: number;
  dprCap: number;
  scatterMin: number;
  scatterMax: number;
  gatherDuration: number;
};

export function particleProfileForWidth(width: number): ParticleProfile;
export function deterministicUnit(index: number, salt?: number): number;
export function ParticleReassurance(props: { text: string }): JSX.Element;
```

- [ ] **Step 1: Write failing pure-model tests**

```js
test('particle profiles remain inside the approved performance budget', async () => {
  const model = await import('../src/components/MainSite/PostExploreNarrative/particleModel.ts');
  const desktop = model.particleProfileForWidth(1440);
  const mobile = model.particleProfileForWidth(390);
  assert.ok(desktop.maxParticles <= 2800);
  assert.ok(desktop.dprCap <= 1.5);
  assert.ok(desktop.scatterMin >= 70 && desktop.scatterMax <= 110);
  assert.ok(mobile.maxParticles <= 1600);
  assert.ok(mobile.scatterMin >= 45 && mobile.scatterMax <= 75);
  assert.equal(model.deterministicUnit(25, 9), model.deterministicUnit(25, 9));
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
npm test -- --test-name-pattern="particle"
```

- [ ] **Step 3: Implement deterministic model**

Use no `Math.random()`.

```ts
export function deterministicUnit(index: number, salt = 0): number {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function particleProfileForWidth(width: number): ParticleProfile {
  return width < 720
    ? { maxParticles: 1500, dprCap: 1.35, scatterMin: 45, scatterMax: 75, gatherDuration: 1150 }
    : { maxParticles: 2700, dprCap: 1.5, scatterMin: 70, scatterMax: 110, gatherDuration: 1300 };
}
```

- [ ] **Step 4: Implement Canvas 2D text sampling**

Follow the React Bits Particle Text algorithm:
1. await computed font through `document.fonts.load` / `document.fonts.ready`;
2. rasterize the exact phrase into an offscreen canvas;
3. sample alpha-positive glyph pixels;
4. deterministically downsample to `maxParticles`;
5. create local scattered start positions around each target;
6. color mostly `#F5F7FA`, with sparse deterministic accents from `#60A5FA` and `#3B82F6`;
7. animate to targets with an ease-out curve;
8. when all particles settle, draw the final frame and `cancelAnimationFrame`/stop scheduling new frames.

Particles should be roughly `1.2–2px` CSS-space. No large glow, star shapes, spray, confetti, pointer repel, hover interaction, click interaction, or idle drift.

- [ ] **Step 5: Trigger and lifecycle**

Use `IntersectionObserver` to start one formation when the reassurance approaches view after the question scene. Use `ResizeObserver` to rebuild only after a material size change. Remove both observers and cancel RAF on unmount.

Do not regenerate a visually different field on ordinary React rerenders.

- [ ] **Step 6: Accessibility + reduced motion**

Render a semantic whole-string reassurance independent of the canvas. Canvas is `aria-hidden="true"` and not focusable.

Reduced motion: do not scatter/gather; show the final semantic phrase immediately or with a very short opacity settle.

- [ ] **Step 7: Replace static reassurance and tune breathing beat**

Keep a short fully black interval after Q3. Do not add decorative filler. Reassurance forms close to optical center.

- [ ] **Step 8: Verify and commit**

```bash
npm test -- --test-name-pattern="particle"
npm run typecheck
git add src/components/MainSite/PostExploreNarrative tests/post-explore-narrative.test.mjs
git commit -m "feat: add particle reassurance transition"
```

---

## Task 4 — Replace static statement with selective Aurora Text

**Deliverable:** `We build websites that` remains stable white typography; only `move businesses forward.` carries a slow Weberaise white/blue Aurora.

**Files:**
- Create: `AuroraStatement.tsx`
- Modify: `PostExploreNarrative.tsx`
- Modify: `PostExploreNarrative.module.css`
- Modify: `tests/post-explore-narrative.test.mjs`

- [ ] **Step 1: Write failing source contract**

```js
test('Aurora is limited to the business-outcome phrase and Weberaise palette', () => {
  const component = read('src/components/MainSite/PostExploreNarrative/AuroraStatement.tsx');
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  assert.match(component, /statementLead/);
  assert.match(component, /auroraText/);
  for (const color of ['#f5f7fa', '#60a5fa', '#3b82f6', '#2563eb']) assert.ok(css.toLowerCase().includes(color));
  assert.match(css, /15s/);
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
npm test -- --test-name-pattern="Aurora"
```

- [ ] **Step 3: Implement semantic component**

```tsx
export function AuroraStatement({ lead, aurora }: { lead: string; aurora: string }) {
  return (
    <h2 className={styles.statement}>
      <span className={styles.statementLead}>{lead}</span>{' '}
      <span className={styles.auroraText}>{aurora}</span>
    </h2>
  );
}
```

Desktop may deliberately break before the Aurora phrase; mobile can wrap naturally.

- [ ] **Step 4: Implement Magic UI-inspired Aurora CSS**

```css
.auroraText {
  background-image: linear-gradient(135deg, #f5f7fa, #60a5fa, #3b82f6, #2563eb, #f5f7fa);
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: wrAurora 15s linear infinite;
}
```

Reduced motion: `animation: none` with a fixed gradient position.

No pink/purple, rainbow, glow cloud, or animated element behind the heading.

- [ ] **Step 5: Replace static statement and keep it close to reassurance**

Do not insert a blank full viewport between reassurance and statement.

- [ ] **Step 6: Verify and commit**

```bash
npm test -- --test-name-pattern="Aurora"
npm run typecheck
git add src/components/MainSite/PostExploreNarrative tests/post-explore-narrative.test.mjs
git commit -m "feat: add aurora purpose statement"
```

---

## Task 5 — Replace static service summary with Circular Text / GROW ring

**Deliverable:** `WEB DEVELOPMENT · SEO · BRANDING ·` rotates calmly around a stationary `GROW`, directly below the purpose statement.

**Files:**
- Create: `GrowthRing.tsx`
- Modify: `PostExploreNarrative.tsx`
- Modify: `PostExploreNarrative.module.css`
- Modify: `tests/post-explore-narrative.test.mjs`
- Verify: `package.json`

- [ ] **Step 1: Write failing ring/dependency tests**

```js
test('growth ring is CSS-driven and does not add Motion', () => {
  const ring = read('src/components/MainSite/PostExploreNarrative/GrowthRing.tsx');
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  const pkg = read('package.json');
  assert.match(ring, /aria-hidden/);
  assert.match(ring, /GROW|center/);
  assert.match(css, /22s\s+linear\s+infinite/);
  assert.doesNotMatch(pkg, /"motion"|"framer-motion"/);
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
npm test -- --test-name-pattern="growth ring"
```

- [ ] **Step 3: Implement circular character placement**

```ts
const characters = Array.from(text);
const angle = (360 / characters.length) * index;
```

Pass each angle through a CSS custom property and position every decorative character around the circular track. Provide one accessible whole-string service summary separate from decorative characters.

`GROW` must live outside the rotating wrapper so it never rotates.

- [ ] **Step 4: Implement dimensions and visual hierarchy**

- desktop diameter: `clamp(230px, 18vw, 260px)` or equivalent within 230–260px;
- mobile diameter: 175–200px;
- spacing below purpose statement: approximately `clamp(2.5rem, 6vh, 5rem)`;
- uppercase compact ring copy with careful tracking;
- no pointer cursor unless later made genuinely interactive.

- [ ] **Step 5: Implement rotation**

Use one compositor-friendly CSS animation:

```css
.ringTrack { animation: wrServiceRing 22s linear infinite; }
```

Reduced motion: `animation: none`.

Do not implement React Bits hover speed-up/slow-down/go-bonkers behavior.

- [ ] **Step 6: Replace static ring, verify, commit**

```bash
npm test -- --test-name-pattern="growth ring"
npm run typecheck
git add src/components/MainSite/PostExploreNarrative tests/post-explore-narrative.test.mjs
git commit -m "feat: add rotating service growth ring"
```

---

## Task 6 — Integration hardening: continuity, responsiveness, accessibility, cleanup

**Deliverable:** The full four-scene narrative behaves as one coherent, responsive, accessible sequence and leaves no leaked observers/timelines/RAF loops.

**Files:**
- Modify: `PostExploreNarrative.tsx`
- Modify: `PostExploreNarrative.module.css`
- Modify: `QuestionSequence.tsx`
- Modify: `ParticleReassurance.tsx`
- Modify: `tests/post-explore-narrative.test.mjs`
- Modify: `tests/visual-contract.test.mjs`

- [ ] **Step 1: Add integration contracts**

```js
test('post-explore root owns the seamless black handoff', () => {
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  assert.match(css, /\.root\s*\{[^}]*background:\s*var\(--wr-black\)/s);
});

test('post-explore effects expose reduced-motion handling', () => {
  const css = read('src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
```

Also keep package assertion that Motion/Framer Motion are absent.

- [ ] **Step 2: Verify current integration tests**

```bash
npm test -- --test-name-pattern="post-explore|reduced|handoff"
```

- [ ] **Step 3: Harden EXPLORE → main continuity without touching `exploreTimeline.ts`**

Because `ExperienceShell` only reveals `.main-stage` when state reaches `main`, the new root must already paint `var(--wr-black)` at `y=0`. Remove top margins/collapsing gaps. Do not duplicate the liquid fill and do not animate an extra overlay.

- [ ] **Step 4: Responsive QA and fixes**

Check at minimum:
- 390×844;
- 768×1024;
- 1366×768;
- 1440×900.

Acceptance:
- Q3 stays readable as a phrase;
- question offsets remain inside safe horizontal gutters;
- sticky stage uses modern viewport units and does not clip under mobile browser chrome;
- reassurance canvas remains inside its scene;
- purpose outcome phrase remains visually contiguous;
- ring does not collide with statement or viewport edges.

- [ ] **Step 5: Lifecycle cleanup**

Verify in code and runtime:
- GSAP timeline and ScrollTrigger killed on unmount;
- resize/orientation listeners removed;
- `ResizeObserver` disconnected;
- `IntersectionObserver` disconnected;
- particle RAF canceled on unmount and stops after settlement;
- no React state update on every scroll tick/animation frame;
- particle scene adds no pointer listeners.

- [ ] **Step 6: Accessibility**

Verify:
- each question is announced once as a full phrase, not character-by-character;
- particle canvas is decorative and has a semantic text equivalent;
- Aurora is a normal semantic heading;
- ring decorative letters are hidden from AT while service summary remains available;
- no canvas/ring decoration enters keyboard focus order.

- [ ] **Step 7: Run full tests/typecheck and commit**

```bash
npm test
npm run typecheck
git add src/components/MainSite/PostExploreNarrative tests/post-explore-narrative.test.mjs tests/visual-contract.test.mjs
git commit -m "fix: harden post-explore narrative experience"
```

---

## Task 7 — Full production and visual acceptance

**Deliverable:** Automated verification passes and the real browser experience matches the approved design without regressing the completed intro.

- [ ] **Step 1: Verify intro once before judging downstream work**

Hard refresh and confirm:
- no final-zero flicker;
- zero exits below the line and disappears;
- loader tagline `Need a website for business?` appears correctly;
- line rotates/opens hero correctly;
- viscous cursor reveal still behaves correctly;
- EXPLORE bottom-fill reaches complete black.

If all six pass, stop touching intro code.

- [ ] **Step 2: Run complete automated verification**

```bash
npm test
npm run typecheck
npm run build
```

Expected: all tests PASS, TypeScript PASS, production build PASS.

- [ ] **Step 3: Run local visual QA**

```bash
npm run dev
```

Inspect the full journey:
1. EXPLORE liquid resolves into black with no flash/cut.
2. Q1 enters Scroll Float-style from upper-left-of-center.
3. Q1 exits gracefully while Q2 begins; neither pops or glitches.
4. Q2 is distinctly right-of-center.
5. Q3 is lower/near-center and fully readable.
6. Q3 exit is followed by a short fully black breathing beat.
7. `DONT WORRY. WE GOT YOU` gathers from clean local particles into crisp text.
8. Particle field never looks like confetti, spray, stars, smoke, or meaningless random placement.
9. After settlement, particle motion stops.
10. Statement follows nearby; only `move businesses forward.` carries the slow white/blue Aurora.
11. Service ring is visually connected below, turns slowly, and `GROW` remains stationary.
12. Reverse scrolling creates no stale canvas, flash, or broken question state.
13. Resize/orientation refresh leaves ScrollTrigger geometry correct.

- [ ] **Step 4: Verify reduced motion**

Reload with reduced motion enabled:
- questions remain readable with minimal motion;
- reassurance does not perform full scattered gather;
- Aurora is static;
- ring is static;
- complete narrative remains present.

- [ ] **Step 5: Verify runtime cost**

Confirm in browser performance tooling:
- no Particle Text RAF remains after settlement;
- no duplicate ScrollTrigger instances after resize/re-entry;
- no continuous React rerender loop during scroll;
- no new Motion dependency;
- no new WebGL context.

- [ ] **Step 6: Scope audit**

Confirm no code was added for:
- final `Visit our services` CTA;
- Services navbar detachment/drift;
- Services/Work/Contact page redesign;
- fake proof/content;
- unrelated intro refactor.

- [ ] **Step 7: Final commit rule**

If Task 7 reveals a scoped defect, fix only that reproducible defect, rerun `npm test`, `npm run typecheck`, and `npm run build`, then commit with a specific message naming the actual fix. If Task 7 requires no source change, create no empty verification commit.

---

## Final acceptance matrix

Implementation is complete only when all are true:

- EXPLORE bottom-fill and first homepage pixel read as one continuous black transition.
- Questions appear exactly in approved order and at intentionally different placements.
- Question entrance retains recognizable Scroll Float behavior; exit is custom, smooth, readable, and authored.
- No text appears from nowhere, glitches, clips, or becomes unreadable.
- Reassurance forms from bounded deterministic particles and settles completely.
- Particle scene has no pointer repel, idle particle soup, giant scatter, or permanent RAF.
- Statement copy is exact and only `move businesses forward.` receives Aurora.
- Aurora remains within Weberaise white/blue palette and cycles in 15s.
- Ring reads `WEB DEVELOPMENT · SEO · BRANDING ·`; center reads `GROW`.
- Ring rotates in 22s while center remains stationary.
- No `motion/react`/Framer Motion dependency is added.
- Reduced-motion version remains complete and readable.
- Mobile/tablet/desktop/short-desktop layouts preserve hierarchy and legibility.
- `npm test`, `npm run typecheck`, and `npm run build` pass.
- Existing loader, hero, viscous reveal, and EXPLORE transition remain unchanged except for the intended seamless handoff.
- Final Services navbar-detach concept remains untouched.
