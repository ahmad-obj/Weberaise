# Services Opening + Menu-to-Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved `/services` opening sequence and Weberaise-adapted GSAP Flip service-index-to-detail transformation without modifying homepage animation work.

**Architecture:** Add a dedicated App Router route and an isolated `ServicesPage` component family. The opening and service-detail transitions are imperative GSAP timelines inside focused client components; static content stays in a typed data model. The exact Codrops idea we retain is state capture + physical DOM relocation + `Flip.from`, while layout, content, hover behavior, accessibility and visual treatment are Weberaise-native.

**Tech Stack:** Next.js 16.3.0 App Router, React 19.2.8, TypeScript 7.0.2, GSAP 3.15.0 + `gsap/Flip`, CSS Modules, existing Weberaise tokens/fonts.

## Global Constraints

- Base from `feature/signature-intro` commit `ea62ef3a0fa4b7b1ea0eb5930094e92259cd6f0e`.
- Implement on isolated branch `feature/services-opening-grid`.
- Do not edit homepage hero, loader, ribbon, post-Explore artwork, or navigation branches.
- Do not add dependencies.
- Opening copy is exactly `SO, WHAT SERVICES DO WE PROVIDE?`.
- Use the five currently locked service groups; code must remain count-agnostic.
- No fake clients, testimonials, awards, metrics, or imagery.
- Hover is enhancement only; click/tap/keyboard must expose the complete detail state.
- Respect `prefers-reduced-motion: reduce`.
- Use existing Weberaise colors, fonts and tokens.
- Codrops source is reference/inspiration; do not transplant its fonts/assets/loader/Parcel setup.

---

## File map

- Create `src/app/services/page.tsx` — route metadata and page entry.
- Create `src/components/ServicesPage/servicesModel.ts` — typed service content and stable IDs.
- Create `src/components/ServicesPage/ServicesPage.tsx` — client-side orchestration, intro handoff, open/close lifecycle, focus and Escape behavior.
- Create `src/components/ServicesPage/ServicesPage.module.css` — complete responsive visual system and reduced-motion contract.
- Create `tests/services-page.test.mjs` — source-level contract tests for route, content, Flip mechanism, accessibility and reduced motion.
- No modification to existing homepage files should be required.

### Task 1: Establish the route and typed service model

**Files:**
- Create: `src/app/services/page.tsx`
- Create: `src/components/ServicesPage/servicesModel.ts`
- Test: `tests/services-page.test.mjs`

**Interfaces:**
- Produces: `ServiceEntry` type and `SERVICES` readonly array.
- Produces: `/services` route rendering `<ServicesPage />`.

- [ ] **Step 1: Write the failing route/model contract test**

Create tests that assert:

```js
const route = read('src/app/services/page.tsx');
const model = read('src/components/ServicesPage/servicesModel.ts');
assert.match(route, /ServicesPage/);
assert.match(model, /website-design-development/);
assert.match(model, /website-redesign/);
assert.match(model, /landing-pages/);
assert.match(model, /ecommerce-business-systems/);
assert.match(model, /optimization-support/);
assert.doesNotMatch(model, /PROJECT ONE|CLIENT|AWARD/);
```

- [ ] **Step 2: Run only the new test and verify failure**

Run: `npm test -- --test-name-pattern="services page"`
Expected: FAIL because the route/model do not exist yet.

- [ ] **Step 3: Implement the typed model**

Use:

```ts
export type ServiceEntry = {
  id: string;
  index: string;
  title: string;
  lead: string;
  primary: readonly string[];
  secondary: readonly string[];
};

export const SERVICES = [/* five exact spec entries */] as const satisfies readonly ServiceEntry[];
```

Keep exactly three `primary` blocks and three `secondary` blocks for the initial content, but render arrays dynamically.

- [ ] **Step 4: Implement the route**

`src/app/services/page.tsx` exports Services-specific metadata and renders `<ServicesPage />`. Do not wrap it in `ExperienceShell`; the homepage loader/hero state machine is homepage-only.

- [ ] **Step 5: Run the new test**

Expected: model/route assertions PASS.

### Task 2: Build the opening sequence and real `SERVICES` handoff

**Files:**
- Create: `src/components/ServicesPage/ServicesPage.tsx`
- Create: `src/components/ServicesPage/ServicesPage.module.css`
- Modify: `tests/services-page.test.mjs`

**Interfaces:**
- Consumes: `SERVICES`.
- Produces: intro refs (`introRef`, `servicesWordRef`, `servicesLabelSlotRef`) and a GSAP timeline that physically moves the same `SERVICES` node into the label slot.

- [ ] **Step 1: Add failing opening contracts**

Assert the component contains all three visual line fragments, imports GSAP + Flip, registers Flip, contains an `aria-hidden` animated intro and a semantic full-copy heading, and does not use WebGL/canvas/shader code.

- [ ] **Step 2: Verify the new contracts fail**

Run the single services test file.

- [ ] **Step 3: Render the stable page structure**

Render:

```tsx
<main className={styles.page}>
  <h1 className="sr-only">SO, WHAT SERVICES DO WE PROVIDE?</h1>
  <section ref={introRef} className={styles.intro} aria-hidden="true">...</section>
  <section className={styles.indexStage}>...</section>
  <section className={styles.previewLayer}>...</section>
</main>
```

The index is present underneath from first render but visually unavailable until the intro handoff completes.

- [ ] **Step 4: Implement the entrance/hold/exit timeline**

Use a scoped `gsap.context`. Reveal line inners from `yPercent: 110` to `0`, hold about `1.8s`, move the outer lines in opposite horizontal directions through overflow-hidden masks, then leave `SERVICES` alone briefly.

- [ ] **Step 5: Implement the semantic handoff with Flip**

Capture `Flip.getState(servicesWord)`, append that same DOM node to `servicesLabelSlot`, add the docked class/blue state, then `Flip.from(state, { duration: ~0.95, ease: 'power4.inOut', absolute: true })`. While it is moving, stagger the row inner wrappers from `yPercent: 110` to `0`.

- [ ] **Step 6: Implement reduced motion for the opening**

Detect `matchMedia('(prefers-reduced-motion: reduce)')`. In reduced motion, immediately move the Services word into its destination, establish index visibility, and use only a short opacity settle.

- [ ] **Step 7: Verify opening contracts**

Run the services test file and typecheck when a local checkout is available.

### Task 3: Adapt Codrops row-to-grid Flip behavior to service blocks

**Files:**
- Modify: `src/components/ServicesPage/ServicesPage.tsx`
- Modify: `src/components/ServicesPage/ServicesPage.module.css`
- Modify: `tests/services-page.test.mjs`

**Interfaces:**
- Produces: `openService(index: number)` and `closeService()` imperative transitions.
- DOM contract: each row has a stable `data-service-row`, `data-service-blocks`, and button; each preview has stable `data-service-preview` and `data-service-grid`.

- [ ] **Step 1: Add failing interaction contracts**

Assert source contains `Flip.getState`, `.append`/`.prepend` relocation into the preview grid, `Flip.from`, `aria-expanded`, `aria-controls`, Escape handling, close button and focus restoration.

- [ ] **Step 2: Verify failure**

Run only `tests/services-page.test.mjs`.

- [ ] **Step 3: Render service rows and hidden preview panels**

Rows are buttons containing index/title plus three primary capability blocks. Render one hidden preview panel per service with its lead text, empty landing zone for transferred primary blocks, and three supplemental blocks.

- [ ] **Step 4: Implement open transition**

Pseudo-sequence:

```ts
if (isAnimating || currentIndex !== -1) return;
isAnimating = true;
originButton = button;
const flipState = Flip.getState(primaryBlocks, { simple: true });
activatePreview(index);
positionCoverFrom(rowRect);
previewGrid.prepend(...primaryBlocks);
Flip.from(flipState, { duration: 0.9, ease: 'power4.inOut', stagger: 0.04, absolute: true });
```

At the same label time, expand the cover from the row to viewport, move other titles away from the selected row, reveal detail title/lead/supplemental blocks, then focus close.

- [ ] **Step 5: Implement close transition**

Capture the transferred primary blocks in their expanded positions, move them back into the originating row block container, Flip them back, hide detail content, collapse the cover toward the originating row, restore titles, clear `aria-expanded`, and return focus to the origin button.

- [ ] **Step 6: Implement Escape and transition guards**

Attach one document keydown listener in the component lifecycle. Escape calls `closeService()` only when open and not already transitioning. Cleanup all GSAP timelines/listeners and restore moved blocks on unmount.

- [ ] **Step 7: Implement reduced-motion open/close**

Keep the same DOM relocation/focus semantics but set near-zero durations and skip travel/stagger.

- [ ] **Step 8: Verify interaction contracts**

Run the services test file.

### Task 4: Responsive and visual polish

**Files:**
- Modify: `src/components/ServicesPage/ServicesPage.module.css`
- Modify: `tests/services-page.test.mjs`

**Interfaces:**
- CSS contract only; no new JS dependencies.

- [ ] **Step 1: Add failing CSS contracts**

Assert the module contains breakpoints for `max-width: 900px` and `max-width: 640px`, `prefers-reduced-motion: reduce`, `:focus-visible`, and no hard-coded purple/glassmorphism styling.

- [ ] **Step 2: Implement desktop composition**

Use a near-black full viewport, large display typography, thin brand-border rows, blue persistent Services label, wide title scale, and small rectangular text blocks on the right. Detail grid should be asymmetric and spacious rather than equal dashboard cards.

- [ ] **Step 3: Implement tablet/mobile composition**

At tablet widths, reduce title/block scale and grid gaps. At mobile widths, stack number/title intelligently, allow capability blocks to wrap, and convert preview detail to a compact two-column/single-column flow without losing the Flip destination relationship.

- [ ] **Step 4: Add pointer/focus states**

Desktop hover may brighten/translate capability blocks subtly. `:focus-visible` must have a clear Weberaise-blue focus treatment. Coarse pointer layouts must not depend on hover to indicate clickability.

- [ ] **Step 5: Verify CSS contracts**

Run the services test file.

### Task 5: Full verification and regression check

**Files:**
- No feature changes unless verification finds a defect.

- [ ] **Step 1: Run focused tests**

Run: `node --import=tsx --test tests/services-page.test.mjs`
Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: PASS and `/services` compiled.

- [ ] **Step 4: Run existing test suite**

Run: `npm test`
Expected: record exact result. If the pre-existing `visual-contract` contradiction around Framer Motion still fails, report it as pre-existing and do not alter homepage contracts inside this Services branch.

- [ ] **Step 5: Visual QA**

At minimum inspect desktop (~1440×900), tablet (~1024×768), mobile (~390×844), keyboard-only flow, reduced motion, opening/closing the first and last services, repeated open/close cycles, and resize after closing.

- [ ] **Step 6: Regression diff**

Compare branch against `feature/signature-intro`; expected touched scope is only the new Services route/component/model/test/docs.

- [ ] **Step 7: Commit implementation as one meaningful feature batch**

Use commit message: `feat: add services opening and menu-grid interaction`.

## Self-review

- Spec coverage: opening, Services-word continuity, menu index, Flip relocation, detail state, close state, reduced motion, keyboard/focus, responsive behavior are each mapped to tasks.
- Placeholder scan: no TODO/TBD implementation placeholders.
- Type consistency: `ServiceEntry`, `SERVICES`, `openService(index)`, `closeService()` are used consistently.
- Scope: Works bridge/capabilities/contact/nav integration remain deliberately excluded.
