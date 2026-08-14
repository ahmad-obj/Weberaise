# About Page + Founder Portrait Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete short `/about` page for Weberaise: a compact studio opening, a two-founder portrait section with subtle React Bits-inspired tilt plus a fixed-frame downward image reveal, and a concise `HOW WE WORK` ending with a quiet footer rail.

**Architecture:** Keep About-specific code under `src/components/AboutPage`. Mount the existing `SilkWavesBackground` once at route level and let only the opening remain visually transparent to it; the founder and closing sections sit on opaque black. Split the founder interaction into four responsibilities: a fixed perspective shell, a Framer Motion tilt layer, an overflow-hidden 4:5 frame, and a portrait image layer that translates downward by ~27% to reveal a top role band.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript, CSS Modules, `next/image`, existing `framer-motion@12.43.0`, existing raw WebGL1 Silk background, Node test runner with the existing `tsx` loader.

## Global Constraints

- Approved spec: `docs/superpowers/specs/2026-08-14-about-page-founder-cards-design.md`.
- Planning baseline: `feature/services-opening-grid` at `522564fe95499e80660f35306c67ec0e3c162c4d`.
- At execution time create an isolated worktree/branch with `superpowers:using-git-worktrees`; recommended branch: `feature/about-page`.
- Exactly three major sections: Opening, The People, How We Work.
- People-first, compact, editorial, not a long agency profile.
- No mission/vision grid, timeline, statistics, awards, testimonials, hiring block, process timeline, large Contact CTA, or duplicated `LET'S TALK` system.
- Reuse the existing palette/tokens from `src/styles/tokens.css` and typography variables from `src/app/layout.tsx`.
- Reuse the existing `SilkWavesBackground`; do not alter shader formulas, preset, lifecycle, or create a second canvas.
- Exactly two founder profiles; no generic team-grid abstraction, carousel, slider, or infinite list.
- Founder frame: `aspect-ratio: 4 / 5`; frame size never changes on hover.
- Reveal: image translates downward within the unchanged clipped frame; initial value `27%`, acceptable tuning range `25–30%`.
- Pointer position controls tilt only; reveal amount is a stable hover state.
- Starting tilt: `rotateX ±4deg`, `rotateY ±5.5deg`, perspective `1000px`, no meaningful hover scale.
- Use existing `framer-motion`; do not add the separate `motion` package.
- Pointer movement updates MotionValues directly; no React state on every pointermove.
- Founder cards are presentation, not controls: no click action, `tabIndex`, button role, pointer cursor, tooltip, arrow, or `MORE` affordance.
- Touch/coarse-pointer and reduced-motion users must receive the full name/role without relying on hover.
- Production founder names, roles, reveal titles, and images must be real values explicitly supplied/approved by the user. Never infer the partner name or role, never publish generated founder faces, and never invent biography copy.
- Each portrait gets its own `objectPosition` crop hint.

---

## File Map

### Create

- `src/components/AboutPage/founderTypes.ts` — the `Founder` data contract.
- `src/components/AboutPage/founderCardMotion.ts` — pure pointer-to-rotation mapping.
- `src/components/AboutPage/FounderPortraitCard.tsx` — client-only tilt interaction and portrait rendering.
- `src/components/AboutPage/FounderPortraitCard.module.css` — 4:5 frame, reveal band, image shift, touch/reduced-motion fallbacks.
- `src/components/AboutPage/FoundersSection.tsx` — exactly-two-founder composition.
- `src/components/AboutPage/AboutIntro.tsx` — Section 01.
- `src/components/AboutPage/AboutApproach.tsx` — Section 03 + quiet footer rail.
- `src/components/AboutPage/AboutPage.tsx` — three-section composition.
- `src/components/AboutPage/AboutPage.module.css` — section layouts and responsive composition.
- `src/components/AboutPage/aboutData.ts` — exactly two approved production founder records.
- `src/app/about/page.tsx` — route metadata, one Silk mount, founder-data handoff.
- `src/app/about/AboutRoute.module.css` — route stacking/isolation.
- `tests/about-founder-card.test.mjs` — interaction/source contracts and tilt math.
- `tests/about-page.test.mjs` — section structure, route/Silk, responsive and production-data contracts.
- Two approved real portrait files under `public/about/founders/`.

### Do not modify unless verification proves a real integration bug

- `src/components/ui/SilkWavesBackground/*`
- `src/styles/tokens.css`
- `src/app/layout.tsx`
- Home, Services, Work, or global navigation code.

### Locked interfaces

```ts
export type Founder = Readonly<{
  id: '01' | '02';
  name: string;
  role: string;
  revealTitle: string;
  imageSrc: string;
  imageAlt: string;
  objectPosition: string;
}>;

export type FounderRotation = Readonly<{
  rotateX: number;
  rotateY: number;
}>;

export function getFounderCardRotation(
  pointerX: number,
  pointerY: number,
  width: number,
  height: number,
): FounderRotation;
```

---

### Task 1: Define and test the founder motion boundary

**Files:**
- Create: `src/components/AboutPage/founderTypes.ts`
- Create: `src/components/AboutPage/founderCardMotion.ts`
- Create: `tests/about-founder-card.test.mjs`

**Interfaces:**
- Produces the shared `Founder` type.
- Produces deterministic, clamped tilt math consumed by `FounderPortraitCard`.

- [ ] **Step 1: Write the failing tilt tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const moduleUrl = (file) => pathToFileURL(path.resolve(file)).href;

test('founder tilt stays centered and bounded', async () => {
  const { getFounderCardRotation } = await import(
    moduleUrl('src/components/AboutPage/founderCardMotion.ts')
  );

  assert.deepEqual(getFounderCardRotation(200, 250, 400, 500), {
    rotateX: 0,
    rotateY: 0,
  });
  assert.deepEqual(getFounderCardRotation(400, 0, 400, 500), {
    rotateX: 4,
    rotateY: 5.5,
  });
  assert.deepEqual(getFounderCardRotation(9999, -9999, 400, 500), {
    rotateX: 4,
    rotateY: 5.5,
  });
});
```

- [ ] **Step 2: Verify RED**

```bash
node --import=tsx --test tests/about-founder-card.test.mjs
```

Expected: FAIL because `founderCardMotion.ts` does not exist.

- [ ] **Step 3: Create the founder type**

```ts
export type Founder = Readonly<{
  id: '01' | '02';
  name: string;
  role: string;
  revealTitle: string;
  imageSrc: string;
  imageAlt: string;
  objectPosition: string;
}>;
```

- [ ] **Step 4: Implement pure tilt math**

```ts
export type FounderRotation = Readonly<{ rotateX: number; rotateY: number }>;

export const FOUNDER_TILT = Object.freeze({
  maxRotateX: 4,
  maxRotateY: 5.5,
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function getFounderCardRotation(
  pointerX: number,
  pointerY: number,
  width: number,
  height: number,
): FounderRotation {
  if (width <= 0 || height <= 0) return { rotateX: 0, rotateY: 0 };

  const x = clamp((pointerX - width / 2) / (width / 2), -1, 1);
  const y = clamp((pointerY - height / 2) / (height / 2), -1, 1);

  return {
    rotateX: Number((-y * FOUNDER_TILT.maxRotateX).toFixed(4)),
    rotateY: Number((x * FOUNDER_TILT.maxRotateY).toFixed(4)),
  };
}
```

- [ ] **Step 5: Verify GREEN and commit**

```bash
node --import=tsx --test tests/about-founder-card.test.mjs
git add src/components/AboutPage/founderTypes.ts src/components/AboutPage/founderCardMotion.ts tests/about-founder-card.test.mjs
git commit -m "test: define about founder motion contract"
```

---

### Task 2: Build the interactive portrait card

**Files:**
- Create: `src/components/AboutPage/FounderPortraitCard.tsx`
- Create: `src/components/AboutPage/FounderPortraitCard.module.css`
- Modify: `tests/about-founder-card.test.mjs`

**Interfaces:**
- Consumes `Founder` and `getFounderCardRotation()`.
- Produces a non-clickable portrait profile whose name/role are visible outside the frame at all times.

- [ ] **Step 1: Extend the test with interaction-source contracts**

Add assertions for:
- `aspect-ratio: 4 / 5`;
- `overflow: hidden`;
- `perspective: 1000px`;
- `translateY(27%)`;
- `useMotionValue`, `useSpring`, `useReducedMotion`;
- no `useState`, `onClick`, `tabIndex`, button role, pointer cursor, tooltip, or `MORE`.

Example:

```js
assert.match(css, /aspect-ratio:\s*4\s*\/\s*5/);
assert.match(css, /translateY\(27%\)/);
assert.match(component, /useMotionValue/);
assert.doesNotMatch(component, /useState\(|onClick|tabIndex|role=["']button/i);
```

- [ ] **Step 2: Verify RED**

```bash
node --import=tsx --test tests/about-founder-card.test.mjs
```

- [ ] **Step 3: Implement the client component**

Use this structure:

```tsx
'use client';

import Image from 'next/image';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { getFounderCardRotation } from './founderCardMotion';
import type { Founder } from './founderTypes';
import styles from './FounderPortraitCard.module.css';

const SPRING = { damping: 30, stiffness: 125, mass: 1.5 } as const;

export function FounderPortraitCard({ founder }: { founder: Founder }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawX, SPRING);
  const rotateY = useSpring(rawY, SPRING);

  const reset = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType === 'touch') return;
    const node = shellRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const rotation = getFounderCardRotation(
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
      rect.height,
    );
    rawX.set(rotation.rotateX);
    rawY.set(rotation.rotateY);
  };

  return (
    <article className={styles.card}>
      <div ref={shellRef} className={styles.shell} onPointerMove={move} onPointerLeave={reset}>
        <motion.div className={styles.tiltLayer} style={reducedMotion ? undefined : { rotateX, rotateY }}>
          <div className={styles.frame}>
            <div className={styles.revealBand} aria-hidden="true">
              <span>{founder.id} / FOUNDER</span>
              <strong>{founder.revealTitle}</strong>
            </div>
            <div className={styles.imageLayer}>
              <Image
                src={founder.imageSrc}
                alt={founder.imageAlt}
                fill
                sizes="(max-width: 720px) 92vw, (max-width: 1099px) 42vw, 380px"
                className={styles.image}
                style={{ objectPosition: founder.objectPosition }}
              />
            </div>
          </div>
        </motion.div>
      </div>
      <div className={styles.identity}>
        <h3>{founder.name}</h3>
        <p>{founder.role}</p>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Implement the card CSS**

Core geometry:

```css
.shell { width: 100%; perspective: 1000px; cursor: default; }
.tiltLayer { width: 100%; transform-style: preserve-3d; will-change: transform; }
.frame {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: #060910;
  border: 1px solid rgb(255 255 255 / 12%);
}
.revealBand {
  position: absolute;
  inset: 0 0 auto;
  z-index: 1;
  height: 27%;
  padding: clamp(18px, 2vw, 26px);
  background: var(--wr-blue);
  color: var(--wr-white);
}
.imageLayer {
  position: absolute;
  inset: 0;
  z-index: 2;
  transform: translateY(0);
  transition: transform 520ms var(--wr-ease-premium);
  will-change: transform;
}
.image { object-fit: cover; }

@media (hover: hover) and (pointer: fine) {
  .shell:hover .imageLayer { transform: translateY(27%); }
}

@media (pointer: coarse), (prefers-reduced-motion: reduce) {
  .tiltLayer { transform: none !important; will-change: auto; }
  .imageLayer,
  .shell:hover .imageLayer { transform: none; transition: none; will-change: auto; }
}
```

Add the name/role block below the image using the existing hero/body fonts. Do not place essential role information only inside the reveal band.

- [ ] **Step 5: Verify and commit**

```bash
node --import=tsx --test tests/about-founder-card.test.mjs
npm run typecheck
git add src/components/AboutPage/FounderPortraitCard.tsx src/components/AboutPage/FounderPortraitCard.module.css tests/about-founder-card.test.mjs
git commit -m "feat: add interactive founder portrait card"
```

---

### Task 3: Build the two-founder composition

**Files:**
- Create: `src/components/AboutPage/FoundersSection.tsx`
- Create: `src/components/AboutPage/AboutPage.module.css`
- Create: `tests/about-page.test.mjs`

**Interfaces:**
- `FoundersSection` consumes `readonly [Founder, Founder]`.
- Desktop ≥1100px: intro + founder 01 + founder 02.
- Intermediate widths: intro above, founders remain two-up while each can stay ~240–260px wide.
- Mobile ≤720px: one founder per row.

- [ ] **Step 1: Write RED structure tests**

Tests must assert:
- marker `02 // THE PEOPLE`;
- heading `THE PEOPLE / BEHIND / WEBERAISE.`;
- `readonly [Founder, Founder]` prop contract;
- desktop two-card layout;
- mobile one-column layout;
- no carousel/slider/infinite-team code.

- [ ] **Step 2: Implement the section**

```tsx
import { FounderPortraitCard } from './FounderPortraitCard';
import type { Founder } from './founderTypes';
import styles from './AboutPage.module.css';

export function FoundersSection({ founders }: { founders: readonly [Founder, Founder] }) {
  return (
    <section className={styles.foundersSection} aria-labelledby="about-people-heading">
      <div className={styles.foundersGrid}>
        <div className={styles.peopleIntro}>
          <p className={styles.kicker}>02 // THE PEOPLE</p>
          <h2 id="about-people-heading" className={styles.peopleHeading}>
            THE PEOPLE<br />BEHIND<br />WEBERAISE.
          </h2>
          <p className={styles.peopleNote}>
            Two people, different strengths, one shared standard for the work.
          </p>
        </div>
        {founders.map((founder) => (
          <FounderPortraitCard key={founder.id} founder={founder} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Implement responsive layout**

Use these starting rules in `AboutPage.module.css`:

```css
.foundersSection {
  position: relative;
  z-index: 2;
  min-height: clamp(820px, 106svh, 1120px);
  padding: clamp(104px, 11svh, 148px) var(--wr-page-pad);
  background: var(--wr-black);
  color: var(--wr-white);
}
.foundersGrid {
  display: grid;
  grid-template-columns: minmax(220px, .72fr) repeat(2, minmax(260px, 380px));
  align-items: end;
  justify-content: space-between;
  gap: clamp(32px, 4.2vw, 72px);
  width: min(100%, var(--wr-max));
  margin: 0 auto;
}
@media (max-width: 1099px) {
  .foundersGrid { grid-template-columns: repeat(2, minmax(240px, 1fr)); max-width: 860px; }
  .peopleIntro { grid-column: 1 / -1; }
}
@media (max-width: 720px) {
  .foundersSection { min-height: auto; padding: 92px 18px 110px; }
  .foundersGrid { grid-template-columns: 1fr; max-width: 520px; }
  .peopleIntro { grid-column: auto; }
}
```

Do not vertically stagger the two founder cards on desktop.

- [ ] **Step 4: Verify and commit**

```bash
node --import=tsx --test tests/about-page.test.mjs
git add src/components/AboutPage/FoundersSection.tsx src/components/AboutPage/AboutPage.module.css tests/about-page.test.mjs
git commit -m "feat: add about founders composition"
```

Expected: founder-section tests PASS; route/data tests remain RED until Task 6.

---

### Task 4: Build the opening and How We Work ending

**Files:**
- Create: `src/components/AboutPage/AboutIntro.tsx`
- Create: `src/components/AboutPage/AboutApproach.tsx`
- Modify: `src/components/AboutPage/AboutPage.module.css`
- Modify: `tests/about-page.test.mjs`

**Interfaces:**
- Opening id: `about-opening` for Silk activation.
- Opening desktop target: ~84svh within approved 78–88svh.
- How We Work desktop target: ~68svh within approved 60–75svh.
- Footer rail belongs inside Section 03; it is not a fourth section.

- [ ] **Step 1: Implement Section 01**

```tsx
export function AboutIntro() {
  return (
    <section id="about-opening" className={styles.opening} aria-labelledby="about-opening-heading">
      <div className={styles.openingInner}>
        <p className={styles.kicker}>// ABOUT.</p>
        <h1 id="about-opening-heading" className={styles.openingHeading}>
          <span>WE&apos;RE WEBERAISE.</span>
          <span>A TWO-PERSON DIGITAL STUDIO</span>
          <span>BUILT AROUND DESIGN AND DEVELOPMENT.</span>
        </h1>
        <p className={styles.openingNote}>
          We work closely from first idea to final build, keeping design and development together from the start.
        </p>
      </div>
    </section>
  );
}
```

No CTA/button in Section 01.

- [ ] **Step 2: Implement Section 03**

Use exactly these three principles:

```ts
const PRINCIPLES = [
  ['01', 'FOCUSED', 'We keep the work close, clear and intentional.'],
  ['02', 'COLLABORATIVE', 'Design and development move together instead of being handed off.'],
  ['03', 'DELIBERATE', 'Every interaction and technical choice should earn its place.'],
] as const;
```

Render marker `03 // HOW WE WORK`, heading `HOW WE WORK.`, the three principles, then a quiet footer rail containing `WEBERAISE` and `© {new Date().getFullYear()}`. Do not add a Contact/Let’s Talk CTA.

- [ ] **Step 3: Add section CSS**

Opening baseline:

```css
.opening {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: clamp(660px, 84svh, 920px);
  padding: clamp(112px, 13svh, 156px) var(--wr-page-pad) clamp(78px, 9svh, 112px);
  color: var(--wr-white);
  background: transparent;
}
```

Closing baseline:

```css
.approach {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: clamp(560px, 68svh, 780px);
  padding: clamp(90px, 10svh, 126px) var(--wr-page-pad) 26px;
  color: var(--wr-white);
  background: var(--wr-black);
}
.principles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
@media (max-width: 720px) {
  .principles { grid-template-columns: 1fr; }
}
```

- [ ] **Step 4: Verify and commit**

```bash
node --import=tsx --test tests/about-page.test.mjs
git add src/components/AboutPage/AboutIntro.tsx src/components/AboutPage/AboutApproach.tsx src/components/AboutPage/AboutPage.module.css tests/about-page.test.mjs
git commit -m "feat: add about opening and approach"
```

---

### Task 5: Compose the three-section page without production data

**Files:**
- Create: `src/components/AboutPage/AboutPage.tsx`
- Modify: `tests/about-page.test.mjs`

**Interfaces:**
- `AboutPage` accepts exactly two founders as data; it does not own or infer production identities.

- [ ] **Step 1: Implement composition**

```tsx
import { AboutApproach } from './AboutApproach';
import { AboutIntro } from './AboutIntro';
import { FoundersSection } from './FoundersSection';
import type { Founder } from './founderTypes';

export function AboutPage({ founders }: { founders: readonly [Founder, Founder] }) {
  return (
    <main>
      <AboutIntro />
      <FoundersSection founders={founders} />
      <AboutApproach />
    </main>
  );
}
```

- [ ] **Step 2: Test exact order**

```js
assert.match(page, /<AboutIntro\s*\/>[\s\S]*<FoundersSection[\s\S]*<AboutApproach\s*\/>/);
```

- [ ] **Step 3: Verify and commit**

```bash
node --import=tsx --test tests/about-page.test.mjs
npm run typecheck
git add src/components/AboutPage/AboutPage.tsx tests/about-page.test.mjs
git commit -m "feat: compose about page sections"
```

Route/data tests intentionally remain RED until the required real founder inputs are available.

---

### Task 6: Integrate real founder data, portraits, route, and Silk

**Files:**
- Create: `src/components/AboutPage/aboutData.ts`
- Create: two approved portrait files under `public/about/founders/`
- Create: `src/app/about/page.tsx`
- Create: `src/app/about/AboutRoute.module.css`
- Modify: `tests/about-page.test.mjs`

**Interfaces:**
- `FOUNDERS` is a readonly two-item tuple with ids `01`, `02`.
- Route mounts one `SilkWavesBackground` with `activeTargetId="about-opening"`.

**Mandatory execution gate:** Do not begin this task until the user has supplied for both founders: exact public display name, exact role line, exact short reveal title, approved real portrait file, and approval of the browser crop. If any of these are missing, stop and ask for them. This is an external content dependency, not a license to invent temporary production values.

- [ ] **Step 1: Add the two real portrait files**

Store them under `public/about/founders/` with stable lowercase hyphenated filenames. Keep enough torso space that losing the lower ~27% on hover is harmless.

- [ ] **Step 2: Create `aboutData.ts` using only the exact supplied values**

The file must export:

```ts
import type { Founder } from './founderTypes';

export const FOUNDERS: readonly [Founder, Founder] = [
  /* founder 01: exact user-supplied literals only */
  /* founder 02: exact user-supplied literals only */
];
```

Each object must contain every field defined by `Founder`. The comments above describe the insertion points and are removed before commit. There is no fallback identity, guessed name, fake role, generated image, or generic portrait.

- [ ] **Step 3: Create the route**

```tsx
import type { Metadata } from 'next';
import { AboutPage } from '@/components/AboutPage/AboutPage';
import { FOUNDERS } from '@/components/AboutPage/aboutData';
import { SilkWavesBackground } from '@/components/ui/SilkWavesBackground/SilkWavesBackground';
import styles from './AboutRoute.module.css';

export const metadata: Metadata = {
  title: 'About — WEBERAISE',
  description: 'Meet the two people behind WEBERAISE and how design and development work together.',
};

export default function AboutRoute() {
  return (
    <div className={styles.route}>
      <SilkWavesBackground activeTargetId="about-opening" />
      <div className={styles.content}>
        <AboutPage founders={FOUNDERS} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create route stacking CSS**

```css
.route {
  position: relative;
  min-height: 100svh;
  background: var(--wr-black);
  isolation: isolate;
}
.content {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 5: Add production-data tests**

Assert:
- exactly two records;
- ids are `01`, `02`;
- every string field is non-empty;
- each `imageSrc` begins `/about/founders/`;
- each referenced file exists under `public/`;
- values do not contain known generic/fake markers such as `example`, `john doe`, `jane doe`, or test-fixture names.

Also assert route contains exactly one `<SilkWavesBackground` and `activeTargetId="about-opening"`.

- [ ] **Step 6: Verify and commit**

```bash
node --import=tsx --test tests/about-founder-card.test.mjs tests/about-page.test.mjs
npm run typecheck
git add src/components/AboutPage/aboutData.ts public/about/founders src/app/about tests/about-page.test.mjs
git commit -m "feat: add Weberaise about route"
```

---

### Task 7: Browser art direction and full verification

**Files:**
- Tune only if needed: `src/components/AboutPage/AboutPage.module.css`
- Tune only if needed: `src/components/AboutPage/FounderPortraitCard.module.css`
- Tune only if needed: `src/components/AboutPage/aboutData.ts` crop values.

**Interfaces:**
- Final browser pass locks crop, reveal amount inside 25–30%, typography, spacing and section heights without changing the approved interaction model.

- [ ] **Step 1: Run automation before visual tuning**

```bash
npm test
npm run typecheck
npm run build
```

Expected: PASS. If an unrelated existing suite failure appears, record it separately and still run both focused About tests.

- [ ] **Step 2: Run local browser QA**

```bash
npm run dev
```

Check at minimum:
- 1440×900;
- 1280×800;
- ~1024px wide;
- 390×844;
- 360×800.

- [ ] **Step 3: Opening acceptance**

Confirm:
- exactly one Silk canvas;
- Silk is visible behind Section 01 only as the environmental layer;
- Section 01 feels strong but not like another homepage hero;
- no CTA;
- no heading overflow;
- Section 02’s opaque black visually suppresses Silk behind portraits.

- [ ] **Step 4: Founder-card acceptance**

For each founder at rest and hover:
- identical 4:5 frame dimensions;
- face/eyes safe in frame at rest;
- name/role readable without hover;
- no pointer cursor/click affordance;
- frame/grid never changes size;
- image moves downward to reveal the top band;
- bottom crop removes torso, not face;
- pointer movement affects tilt only;
- tilt stays near ±4deg X / ±5.5deg Y;
- leave returns both image and tilt cleanly;
- rapid card-to-card movement never sticks or jitters.

If one portrait crop is unsafe, tune that founder’s `objectPosition` first. Change global reveal only if necessary and keep it between 25–30%.

- [ ] **Step 5: Touch and reduced-motion acceptance**

Confirm:
- by 720px the cards stack one per row;
- no horizontal scrolling;
- touch does not require tilt/reveal;
- no identity content is hover-only;
- `prefers-reduced-motion: reduce` disables founder tilt and reveal while preserving all content;
- existing Silk reduced-motion behavior remains intact.

- [ ] **Step 6: Closing acceptance**

Confirm:
- exactly three principles: Focused, Collaborative, Deliberate;
- no extra Services-like process chapter;
- no Contact/Let’s Talk CTA;
- footer rail contains `WEBERAISE` and dynamic year;
- page ends soon after the closing section.

- [ ] **Step 7: Re-run complete verification**

```bash
node --import=tsx --test tests/about-founder-card.test.mjs tests/about-page.test.mjs
npm test
npm run typecheck
npm run build
git status --short
git diff
```

Confirm the diff does not touch Silk internals, Services, Work, homepage narrative, global navigation, or unrelated tokens.

- [ ] **Step 8: Commit visual tuning only if there was a real change**

```bash
git add src/components/AboutPage src/app/about
git commit -m "refine: polish about founder presentation"
```

---

## Implementation Order

1. Founder type + pure tilt math.
2. Interactive founder card.
3. Two-founder section.
4. Opening + How We Work ending.
5. Three-section composition.
6. Real founder content/assets + route + one Silk mount.
7. Browser art direction + full verification.

## Self-Review

- **Spec coverage:** all three sections, two-founder emphasis, 4:5 fixed frame, 27% reveal, restrained tilt, separate transform ownership, mobile/coarse-pointer behavior, reduced motion, per-founder crop, one Silk canvas, compact closing and no duplicate Contact CTA are mapped to tasks and tests.
- **Dependency check:** no new runtime package is needed; Framer Motion already exists in the repository.
- **Scope check:** About work remains isolated from Home/Services/Work/navigation systems.
- **Production-content check:** no fake founder data is authorized. Task 6 is intentionally gated on exact user-supplied identities and portrait assets; implementation must stop there rather than fabricate values.
- **Type consistency:** `Founder`, `FounderRotation`, `getFounderCardRotation`, `FounderPortraitCard`, `FoundersSection`, `AboutPage`, and `FOUNDERS` are named consistently throughout the plan.
