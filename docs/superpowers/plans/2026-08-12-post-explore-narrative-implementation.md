# Post-Explore Narrative Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old post-EXPLORE first-impression placeholder with a polished, responsive narrative sequence: three scroll-float visitor questions, a particle-assembled reassurance, an Aurora-emphasized Weberaise purpose statement, and a rotating service/GROW ring.

**Architecture:** Preserve the existing intro state machine and EXPLORE bottom-fill unchanged. The `main` state continues to reveal the homepage only after `EXPLORE_COMPLETE`; `MainSite` swaps the obsolete `FirstImpression` for a focused `PostExploreNarrative` feature composed of isolated client components. GSAP/ScrollTrigger powers the scroll question choreography, Canvas 2D powers the bounded particle reassurance, CSS powers Aurora and ring rotation, and no new general animation dependency is added.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, GSAP 3.15.0 + ScrollTrigger, Canvas 2D, CSS Modules/global design tokens, Node test runner via `tsx`.

## Global Constraints

- Work only on `feature/signature-intro`; do not merge PR #1.
- Preserve the experience state machine exactly: `boot → loading → loaderCompletion → heroOpening → heroInteractive → heroExiting → main`.
- Do not redesign or refactor the loader, hero reveal, cursor liquid, EXPLORE button, `bottomFill`, or `exploreTimeline.ts` unless an independently verified regression is found.
- The existing black EXPLORE `bottomFill` must resolve visually into the black post-Explore narrative with no white frame, route flash, rectangular wipe, or hard-cut appearance.
- Exact copy/order: `Need a website?` → `Need a redesign?` → `Need to look better online?` → brief black pause → `DONT WORRY. WE GOT YOU` → `We build websites that move businesses forward.` → ring `WEB DEVELOPMENT · SEO · BRANDING ·` with center `GROW`.
- Only `move businesses forward.` receives Aurora treatment.
- Do not install `motion/react`; the existing project dependency set remains sufficient.
- No extra WebGL system for post-Explore text effects.
- No fake clients, testimonials, metrics, awards, pricing, or social proof.
- Final Home → Services navbar-detach gateway remains out of scope.
- Preserve accessible whole-string text for all split/canvas/decorative effects and honor `prefers-reduced-motion`.
- Mobile must preserve exact narrative order while reducing offsets, particle count, scatter distance, and ring size.
- Prefer fewer continuous animation loops: particle RAF stops after settling; Aurora and ring use compositor-friendly CSS; ScrollTrigger is scoped and cleaned up.

## External Motion References

These links are implementation references, not permission to drop stock components into the project unchanged.

### React Bits — Scroll Float
- Demo/docs: https://reactbits.dev/text-animations/scroll-float
- TypeScript source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ScrollFloat/ScrollFloat.tsx
- CSS source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ScrollFloat/ScrollFloat.css
- Preserve the recognizable entrance character: per-character split, initial opacity 0, roughly `yPercent: 120`, `scaleY: 2.3`, `scaleX: 0.7`, scrubbed toward natural geometry with subtle stagger.
- Weberaise adds an authored hold and exit instead of treating the reference as a complete section.

### React Bits — Particle Text
- Demo/docs: https://reactbits.dev/text-animations/particle-text
- TypeScript source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ParticleText/ParticleText.tsx
- Preserve the Canvas 2D model: rasterize target glyphs, sample visible pixels, generate target particle positions, gather particles into readable text.
- Weberaise adaptation removes pointer repel and meaningful idle drift, bounds the particle budget, uses deterministic sampling, local scatter, capped DPR, and stops RAF after the settled frame.

### Magic UI — Aurora Text
- Demo/docs: https://magicui.design/docs/components/aurora-text
- Source: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/aurora-text.tsx
- Preserve the animated gradient clipped to text and accessible semantic copy.
- Use Weberaise colors only: `#F5F7FA → #60A5FA → #3B82F6 → #2563EB → #F5F7FA` with a slow 14–16s cycle.

### React Bits — Circular Text
- Demo/docs: https://reactbits.dev/text-animations/circular-text
- TypeScript source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/CircularText/CircularText.tsx
- CSS source: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/CircularText/CircularText.css
- Preserve circular character placement + slow continuous rotation.
- Rebuild with React + CSS transforms instead of installing the reference's `motion/react` dependency.

---

## File Structure

### Create
- `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx` — server-safe composition wrapper and semantic section ordering.
- `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css` — all layout, responsive, Aurora, ring, canvas, and question-scene styles for this feature.
- `src/components/MainSite/PostExploreNarrative/QuestionSequence.tsx` — client component that creates split-character question DOM and owns scoped ScrollTrigger lifecycle.
- `src/components/MainSite/PostExploreNarrative/questionMotion.ts` — pure timeline constants plus GSAP setup function for entrance/hold/exit windows.
- `src/components/MainSite/PostExploreNarrative/ParticleReassurance.tsx` — client Canvas 2D particle formation component.
- `src/components/MainSite/PostExploreNarrative/particleModel.ts` — deterministic pure helpers for particle selection, seeded scatter, viewport caps, and reduced-motion configuration.
- `src/components/MainSite/PostExploreNarrative/AuroraStatement.tsx` — semantic purpose statement with only the outcome phrase visually aurora-treated.
- `src/components/MainSite/PostExploreNarrative/GrowthRing.tsx` — semantic service summary + decorative rotating character ring and static `GROW` center.
- `tests/post-explore-narrative.test.mjs` — source/behavior contracts for content, dependencies, scene structure, reduced motion, and performance caps.

### Modify
- `src/components/MainSite/MainSite.tsx` — replace `FirstImpression` with `PostExploreNarrative`; leave the later placeholder sections untouched for this scope.
- `src/content/homepage.ts` — replace obsolete `firstImpressionCopy` with exact post-Explore content constants; do not rewrite unrelated downstream placeholder data.
- `src/app/globals.css` — remove obsolete `.first-impression*` rules only after the old component is removed; do not place the new feature's detailed styles here.
- `tests/visual-contract.test.mjs` — add only broad integration contracts that belong with existing global visual/state guarantees.

### Delete after replacement is verified
- `src/components/MainSite/FirstImpression.tsx` — obsolete placeholder superseded by the approved narrative.

---

### Task 1: Lock content contract and replace the obsolete first-impression integration

**Files:**
- Modify: `src/content/homepage.ts`
- Modify: `src/components/MainSite/MainSite.tsx`
- Create: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx`
- Create: `tests/post-explore-narrative.test.mjs`
- Delete after pass: `src/components/MainSite/FirstImpression.tsx`

**Interfaces:**
- `postExploreCopy.questions: readonly [string, string, string]`
- `postExploreCopy.reassurance: string`
- `postExploreCopy.statementLead: string`
- `postExploreCopy.statementAurora: string`
- `postExploreCopy.ring: string`
- `postExploreCopy.ringCenter: string`
- `PostExploreNarrative(): JSX.Element`

- [ ] **Step 1: Write the failing content/integration test**

Add `tests/post-explore-narrative.test.mjs` with assertions that:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('post-explore narrative uses the approved visitor journey copy', () => {
  const content = read('src/content/homepage.ts');
  for (const phrase of [
    'Need a website?',
    'Need a redesign?',
    'Need to look better online?',
    'DONT WORRY. WE GOT YOU',
    'We build websites that',
    'move businesses forward.',
    'WEB DEVELOPMENT · SEO · BRANDING ·',
    'GROW',
  ]) assert.match(content, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('MainSite replaces the obsolete FirstImpression with PostExploreNarrative', () => {
  const main = read('src/components/MainSite/MainSite.tsx');
  assert.match(main, /PostExploreNarrative/);
  assert.doesNotMatch(main, /FirstImpression/);
});
```

- [ ] **Step 2: Run the targeted test and verify failure**

Run:

```bash
npm test -- --test-name-pattern="post-explore narrative|MainSite replaces"
```

Expected: FAIL because `postExploreCopy`/`PostExploreNarrative` do not yet exist.

- [ ] **Step 3: Add exact copy constants**

In `src/content/homepage.ts`, remove `firstImpressionCopy` and add:

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

Do not modify `selectedWork`, `services`, `principles`, `processSteps`, or `engagementOptions` in this task.

- [ ] **Step 4: Add the composition shell and wire MainSite**

Create `PostExploreNarrative.tsx` with stable section landmarks for questions, reassurance, purpose statement, and growth ring. Import it from `MainSite.tsx` and replace `<FirstImpression />` exactly where the old first-impression section currently sits.

The wrapper must render these child slots in order:

```tsx
<section id="post-explore" data-post-explore-narrative>
  <QuestionSequence questions={postExploreCopy.questions} />
  <ParticleReassurance text={postExploreCopy.reassurance} />
  <AuroraStatement
    lead={postExploreCopy.statementLead}
    aurora={postExploreCopy.statementAurora}
  />
  <GrowthRing text={postExploreCopy.ring} center={postExploreCopy.ringCenter} />
</section>
```

Stub child components only long enough to keep TypeScript compiling inside this task; they are replaced by real implementations in Tasks 2–5. Do not ship placeholder visible copy beyond the exact locked text.

- [ ] **Step 5: Remove obsolete component and styles**

Delete `FirstImpression.tsx`. Remove only `.first-impression--black`, `.first-impression__body`, and their mobile override from `globals.css`. Keep all unrelated section-shell styles intact.

- [ ] **Step 6: Run tests and typecheck**

```bash
npm test -- --test-name-pattern="post-explore narrative|MainSite replaces"
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/content/homepage.ts src/components/MainSite/MainSite.tsx src/components/MainSite/PostExploreNarrative tests/post-explore-narrative.test.mjs src/app/globals.css
git rm src/components/MainSite/FirstImpression.tsx
git commit -m "feat: establish post-explore narrative structure"
```

---

### Task 2: Implement the scroll-float question sequence with authored exits

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/QuestionSequence.tsx`
- Create: `src/components/MainSite/PostExploreNarrative/questionMotion.ts`
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

export function createQuestionTimeline(
  root: HTMLElement,
  reducedMotion: boolean,
): () => void;
```

`QuestionSequence` consumes `readonly string[]` and owns no homepage state outside its DOM subtree.

- [ ] **Step 1: Write failing timing/structure tests**

Assert that `questionMotion.ts` contains three ordered windows matching the approved timing intent and that `QuestionSequence.tsx` contains accessible whole-string text plus decorative character spans. Also assert use of `gsap/ScrollTrigger`, scoped cleanup, and no new animation package.

At minimum verify these windows numerically through a pure import or source contract:

```ts
[
  { enterStart: 0.00, enterEnd: 0.16, holdEnd: 0.25, exitEnd: 0.35 },
  { enterStart: 0.30, enterEnd: 0.46, holdEnd: 0.55, exitEnd: 0.65 },
  { enterStart: 0.60, enterEnd: 0.76, holdEnd: 0.86, exitEnd: 0.96 },
]
```

- [ ] **Step 2: Verify the new test fails**

```bash
npm test -- --test-name-pattern="question"
```

Expected: FAIL because the motion module is absent.

- [ ] **Step 3: Implement accessible split-character markup**

For each question render one positioned `<h2>` containing:
- one `.sr-only` whole-string copy for assistive technology;
- one `aria-hidden="true"` decorative wrapper whose children are per-character spans;
- non-breaking spaces for literal spaces so line geometry is stable;
- `data-question-index` for timeline targeting.

Do not mount/unmount questions while scrolling. Keep all three mounted from first render so timeline progress cannot create one-frame flashes.

- [ ] **Step 4: Implement the scoped GSAP timeline**

Register `ScrollTrigger` only in the client module. Use `useLayoutEffect` so initial decorative transforms are applied before paint.

Timeline requirements:
- one ScrollTrigger tied to the narrative scene, `scrub: true`;
- sticky scene uses CSS for `100svh`; scroll host uses ~`260svh` desktop and ~`280svh` mobile;
- Q1/Q2/Q3 positions are CSS-controlled, not generated randomly;
- entrance starts from roughly `opacity: 0`, `yPercent: 120`, `scaleY: 2.3`, `scaleX: 0.7`;
- resolve to opacity 1 and natural scale with ~`0.03` character stagger;
- hold state must contain no transform mutation;
- exit begins with upward movement, then slight `scaleY < 1`, slight `scaleX > 1`, then opacity and restrained blur near the tail;
- no destructive `display:none` during timeline; opacity/visibility only after useful exit;
- cleanup kills the timeline/ScrollTrigger on unmount;
- refresh geometry after meaningful resize/orientation changes, debounced rather than on every pixel resize.

Use the existing project GSAP dependency; do not add another library.

- [ ] **Step 5: Implement graphic placement and responsive safe zones**

In the CSS module set the three question anchors approximately:
- Q1: `translate(-8vw, -7vh)` from center;
- Q2: `translate(7vw, 0)`;
- Q3: `translate(-2vw, 7vh)`.

Clamp type scale and max width so `Need to look better online?` remains a readable phrase. Below tablet width reduce lateral/vertical offsets to roughly one third. On narrow screens prefer optical centering over preserving desktop displacement.

The initial pre-GSAP CSS state must already be hidden to prevent a first-paint flash. `useLayoutEffect` then transfers ownership to GSAP.

- [ ] **Step 6: Implement reduced motion**

When reduced motion is active:
- do not apply stretched character geometry;
- present each question through a simpler scroll progression or stacked readable flow with minimal opacity/translation;
- preserve exact order and readable dwell;
- avoid pinned scrub behavior if it creates excessive motion while the user requested reduction.

- [ ] **Step 7: Run targeted tests and typecheck**

```bash
npm test -- --test-name-pattern="question"
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative tests/post-explore-narrative.test.mjs
git commit -m "feat: add scroll-driven visitor questions"
```

---

### Task 3: Implement deterministic, bounded Particle Text reassurance

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/ParticleReassurance.tsx`
- Create: `src/components/MainSite/PostExploreNarrative/particleModel.ts`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
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
```

`ParticleReassurance({ text }: { text: string })` renders one semantic accessible reassurance and one decorative Canvas 2D layer.

- [ ] **Step 1: Write failing pure-helper tests**

Test that:
- desktop profile never exceeds 2800 particles and DPR 1.5;
- mobile profile never exceeds 1600 particles;
- desktop scatter falls inside 70–110 CSS px;
- mobile scatter falls inside 45–75 CSS px;
- deterministic seed returns identical values for identical inputs and values remain in `[0, 1)`.

Example:

```js
test('particle profile stays within approved budgets', async () => {
  const { particleProfileForWidth, deterministicUnit } = await import('../src/components/MainSite/PostExploreNarrative/particleModel.ts');
  const desktop = particleProfileForWidth(1440);
  const mobile = particleProfileForWidth(390);
  assert.ok(desktop.maxParticles <= 2800);
  assert.ok(desktop.dprCap <= 1.5);
  assert.ok(mobile.maxParticles <= 1600);
  assert.equal(deterministicUnit(25, 9), deterministicUnit(25, 9));
});
```

- [ ] **Step 2: Verify helper tests fail**

```bash
npm test -- --test-name-pattern="particle"
```

Expected: FAIL because `particleModel.ts` does not exist.

- [ ] **Step 3: Implement deterministic particle profile/model**

Use fixed pure formulas; no `Math.random()` in target selection or scatter. Example deterministic generator:

```ts
export function deterministicUnit(index: number, salt = 0): number {
  const x = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
```

Profiles:
- `< 720px`: max 1500, DPR 1.35, scatter 45–75, gather about 1150ms;
- `>= 720px`: max 2700, DPR 1.5, scatter 70–110, gather about 1300ms.

Keep values inside the approved design ranges.

- [ ] **Step 4: Implement Canvas 2D target sampling**

Following the React Bits reference algorithm:
1. wait for the actual computed font through `document.fonts.load` / `document.fonts.ready`;
2. measure the container;
3. rasterize `DONT WORRY. WE GOT YOU` into an offscreen canvas;
4. sample pixels whose alpha exceeds a fixed threshold;
5. downsample deterministically to the profile's `maxParticles`;
6. derive local scattered start positions around each target;
7. assign primarily `#F5F7FA`, with sparse deterministic `#60A5FA`/`#3B82F6` accents;
8. animate toward target with an ease-out gather;
9. after all particles settle, draw one final settled frame and cancel RAF.

Do not implement pointer movement, hover repel, click scatter, idle drift, star shapes, confetti behavior, or screen-wide random scattering.

- [ ] **Step 5: Trigger formation only when appropriate**

Use `IntersectionObserver` to begin gathering when the reassurance scene is approaching/entering view after the black breathing beat. Prevent repeated restarts during minor threshold crossings; one formation per page lifecycle is the default.

If it leaves view mid-gather, cancel/pause unnecessary RAF work. On re-entry, resume or snap coherently rather than regenerating a new random field.

Use `ResizeObserver` to schedule a rebuild only after material size changes. Preserve deterministic sampling so resize does not visibly reshuffle color/particle character without reason.

- [ ] **Step 6: Implement accessible/reduced-motion behavior**

The actual phrase must exist as semantic text independent of the canvas. Hide the semantic copy visually only when the decorative canvas is active; never remove it from accessibility APIs.

For `prefers-reduced-motion`:
- skip scattered start positions;
- render/show the final text immediately or with a very short opacity settle;
- do not run a full particle gather.

- [ ] **Step 7: Add the breathing-beat composition**

Ensure the question scene ends in fully black negative space before the reassurance becomes visible. The reassurance should assemble around optical center and stay visually stable after formation.

- [ ] **Step 8: Run tests and typecheck**

```bash
npm test -- --test-name-pattern="particle"
npm run typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative tests/post-explore-narrative.test.mjs
git commit -m "feat: add particle reassurance transition"
```

---

### Task 4: Implement the selective Weberaise Aurora statement

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/AuroraStatement.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Modify: `tests/post-explore-narrative.test.mjs`

**Interfaces:**

```ts
export function AuroraStatement(props: {
  lead: string;
  aurora: string;
}): JSX.Element;
```

- [ ] **Step 1: Add failing Aurora contract test**

Assert that:
- the lead and outcome are separate spans;
- Aurora span contains all five approved gradient stops;
- CSS cycle duration is within 14–16s;
- only the outcome span receives gradient clipping;
- a reduced-motion rule disables or freezes the gradient motion.

- [ ] **Step 2: Verify failure**

```bash
npm test -- --test-name-pattern="Aurora|aurora"
```

- [ ] **Step 3: Implement semantic statement**

Render one heading with stable text:

```tsx
<h2 className={styles.statement}>
  <span className={styles.statementLead}>{lead}</span>{' '}
  <span className={styles.auroraText}>{aurora}</span>
</h2>
```

Prefer a controlled desktop line break between lead and outcome while allowing natural responsive wrapping.

- [ ] **Step 4: Implement Aurora CSS based on Magic UI reference**

Use:

```css
background-image: linear-gradient(
  135deg,
  #f5f7fa,
  #60a5fa,
  #3b82f6,
  #2563eb,
  #f5f7fa
);
background-size: 200% auto;
background-clip: text;
-webkit-background-clip: text;
color: transparent;
animation: wr-aurora 15s linear infinite;
```

Keep the rest of the sentence normal `var(--wr-text)`/white. No pink, purple, rainbow, glow cloud, or animated background behind the letters.

Under reduced motion set a static gradient position and `animation: none`.

- [ ] **Step 5: Place it close to reassurance**

Use a short transition distance after the reassurance. Do not insert another 100svh blank spacer. The statement should feel like the verbal answer following `DONT WORRY. WE GOT YOU`.

- [ ] **Step 6: Run tests/typecheck**

```bash
npm test -- --test-name-pattern="Aurora|aurora"
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative tests/post-explore-narrative.test.mjs
git commit -m "feat: add aurora purpose statement"
```

---

### Task 5: Implement the rotating service ring with static GROW center

**Files:**
- Create: `src/components/MainSite/PostExploreNarrative/GrowthRing.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Modify: `tests/post-explore-narrative.test.mjs`
- Verify: `package.json`

**Interfaces:**

```ts
export function GrowthRing(props: {
  text: string;
  center: string;
}): JSX.Element;
```

- [ ] **Step 1: Add failing ring/dependency contract test**

Assert that:
- exact ring copy and `GROW` are used;
- decorative ring characters are `aria-hidden`;
- accessible whole-string service text exists;
- `GROW` is outside the rotating character wrapper;
- `package.json` does not contain `motion` or `motion/react`;
- rotation duration is within 20–24s and linear;
- reduced-motion rule stops rotation.

- [ ] **Step 2: Verify failure**

```bash
npm test -- --test-name-pattern="ring|GROW|motion"
```

- [ ] **Step 3: Implement circular character geometry**

Split the ring string with `Array.from(text)`. For each character calculate a deterministic angle:

```ts
const angle = (360 / characters.length) * index;
```

Pass it as a CSS custom property. Position characters around a circular track with transforms owned by each character; rotate the containing ring as one compositor layer.

Do not imitate the reference's hover `speedUp`/`goBonkers`; this element is a calm service summary, not a toy.

- [ ] **Step 4: Implement dimensions and visual hierarchy**

Desktop diameter: clamp within roughly 230–260px. Mobile: 175–200px. Use compact uppercase tracked type. Keep `GROW` stationary, optically centered, and more visually important than any single ring character but subordinate to the purpose statement above.

Use vertical spacing approximately `clamp(2.5rem, 6vh, 5rem)` from the purpose statement.

- [ ] **Step 5: Implement performant rotation**

Use CSS:

```css
animation: wr-service-ring 22s linear infinite;
will-change: transform;
```

This avoids a permanent JS frame loop and avoids installing Motion. Under `prefers-reduced-motion`, set `animation: none`.

- [ ] **Step 6: Run tests/typecheck**

```bash
npm test -- --test-name-pattern="ring|GROW|motion"
npm run typecheck
```

Expected: PASS and dependency list unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative tests/post-explore-narrative.test.mjs
git commit -m "feat: add rotating service growth ring"
```

---

### Task 6: Harden continuity, responsive behavior, accessibility, and cleanup

**Files:**
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.module.css`
- Modify: `src/components/MainSite/PostExploreNarrative/QuestionSequence.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/ParticleReassurance.tsx`
- Modify: `tests/post-explore-narrative.test.mjs`
- Modify: `tests/visual-contract.test.mjs`

**Interfaces:** No new public interface. This task enforces cross-component contracts.

- [ ] **Step 1: Add failing integration contracts**

Add assertions for:
- root post-Explore section starts with `var(--wr-black)`/black and does not inherit the old `var(--wr-background)` visual at its top;
- no new dependency was added for Motion;
- all four visual effects have reduced-motion handling;
- particle canvas and decorative character wrappers are excluded from focus/accessibility trees as appropriate;
- old first-impression CSS/component no longer exists;
- MainSite still preserves later section order after the new narrative.

- [ ] **Step 2: Verify failure where contracts are incomplete**

```bash
npm test -- --test-name-pattern="post-explore|reduced|continuity"
```

- [ ] **Step 3: Harden seamless EXPLORE → main visual continuity**

Do not alter `exploreTimeline.ts`. Instead make the first pixel of `PostExploreNarrative` exactly black (`var(--wr-black)`), remove margins/collapsing gaps at the root, and ensure the `main-stage` does not reveal the darker-blue `--wr-background` before the black narrative fills the viewport.

Because `ExperienceShell` hides `.main-stage` until state `main`, the first revealed main content must already paint black. Do not add a transition overlay or duplicate bottom-fill.

- [ ] **Step 4: Responsive pass**

Verify CSS at minimum around 390×844, 768×1024, 1440×900, and a short desktop viewport such as 1366×768.

Requirements:
- Q3 does not become awkward single-word fragments;
- question offsets stay inside safe gutters;
- sticky height uses `svh` and does not jump under mobile browser chrome;
- reassurance particle canvas remains bounded to its own scene;
- purpose statement retains outcome emphasis;
- ring remains readable and does not collide with statement.

- [ ] **Step 5: Cleanup lifecycle pass**

Verify:
- ScrollTrigger/timeline killed on unmount;
- resize/orientation observers removed;
- particle RAF cancelled on unmount;
- `ResizeObserver`, `IntersectionObserver`, media-query listeners removed;
- no pointer listeners are added by Particle Text;
- no React `setState` occurs on every animation frame or scroll tick.

- [ ] **Step 6: Accessibility pass**

Verify with DOM inspection:
- each question has one assistive whole phrase, not individually announced letters;
- reassurance has one semantic text equivalent even though the visual is canvas;
- Aurora statement remains ordinary semantic heading text;
- ring has an accessible service summary while decorative characters are hidden;
- no decorative canvas/ring element is keyboard-focusable.

- [ ] **Step 7: Run tests/typecheck**

```bash
npm test
npm run typecheck
```

Expected: all tests PASS, typecheck PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/MainSite/PostExploreNarrative tests/post-explore-narrative.test.mjs tests/visual-contract.test.mjs
git commit -m "fix: harden post-explore narrative experience"
```

---

### Task 7: Full verification and visual acceptance

**Files:** No intended source changes unless verification finds a reproducible defect directly within this scope.

- [ ] **Step 1: Confirm intro regression baseline before judging new section**

Run the site and hard refresh once. Verify the latest loader behavior remains correct:
- no final-zero flicker;
- zero exits below line and disappears;
- `Need a website for business?` loader tagline appears normally;
- line rotates/spans full height;
- hero opens normally;
- cursor reveal still behaves correctly;
- EXPLORE bottom-fill reaches full black.

If these pass, do not touch loader/hero code.

- [ ] **Step 2: Run complete automated verification**

```bash
npm test
npm run typecheck
npm run build
```

Expected:
- full Node suite PASS;
- TypeScript emits no errors;
- production Next build completes successfully.

- [ ] **Step 3: Run local development visual QA**

```bash
npm run dev
```

Hard refresh and inspect the full journey:

1. EXPLORE liquid fill resolves into black with no visual flash.
2. Q1 appears via readable Scroll Float entrance at upper-left-of-center.
3. Q1 leaves gracefully as Q2 begins; neither pops or glitches.
4. Q2 occupies a distinct restrained right-of-center position.
5. Q3 occupies a lower/near-center position and remains fully readable.
6. After Q3, there is a short black breathing beat.
7. `DONT WORRY. WE GOT YOU` gathers from clean local particles into crisp text.
8. Particle motion looks intentional, not confetti/spray/star-field; settled scene stops active motion.
9. Purpose statement follows nearby; only `move businesses forward.` carries slow white/blue Aurora.
10. Service ring sits masterfully below statement, rotates slowly, and `GROW` stays perfectly static.
11. Scrolling back upward does not create flashes, stale canvas garbage, or broken ScrollTrigger positions.
12. Resize/orientation refresh does not leave text clipped or triggers offset.

- [ ] **Step 4: Verify reduced motion manually**

Enable reduced motion in the browser/OS and reload:
- questions remain readable with minimal motion;
- particle reassurance does not scatter/gather thousands of particles;
- Aurora is static;
- ring is static;
- user still receives the complete exact narrative.

- [ ] **Step 5: Verify performance behavior**

Using browser performance tools or lightweight instrumentation:
- no permanent Particle Text RAF after settlement;
- no runaway ScrollTrigger instances after resize/navigation;
- no continuous React rerenders during scroll animation;
- no added Motion dependency in the bundle;
- no new WebGL context beyond the existing hero reveal.

- [ ] **Step 6: Final scope check**

Confirm no implementation of:
- final `Visit our services` CTA;
- Services navbar detachment/drift;
- Services/Work/Contact page redesign;
- fake proof/content;
- unrelated intro refactor.

- [ ] **Step 7: Commit only if verification required a scoped fix**

If a defect was found and fixed, rerun all verification first, then commit with a specific message describing the actual fix. If no fixes were needed, do not create an empty verification commit.

---

## Final Acceptance Matrix

Implementation is complete only when all of the following are true:

- EXPLORE bottom-fill and first homepage pixel read as one continuous black transition.
- Questions appear exactly in approved order and at intentionally different placements.
- Question entrance visibly retains Scroll Float character; exit is custom, graceful, and readable.
- No question appears from nowhere, glitches, clips, or becomes illegible.
- Reassurance forms from bounded deterministic particles and settles completely.
- Particle scene has no pointer repel, idle particle soup, screen-wide scatter, or perpetual RAF after settlement.
- Purpose statement uses exact copy and Aurora only on `move businesses forward.`.
- Aurora stays within Weberaise white/blue palette and moves slowly.
- Circular text reads `WEB DEVELOPMENT · SEO · BRANDING ·`; center reads `GROW`.
- Ring rotates slowly while center remains stationary.
- No `motion/react` dependency is added.
- Reduced-motion users receive complete readable static/minimal-motion equivalents.
- Mobile, tablet, normal desktop, and short desktop layouts preserve hierarchy and legibility.
- `npm test`, `npm run typecheck`, and `npm run build` pass.
- Existing loader, hero, viscous reveal, and EXPLORE transition remain visually unchanged except for the intended handoff into the new narrative.
- Final Services navbar-detach/footer concept remains untouched.
