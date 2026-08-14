# Services Contact Ending Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the blank Services-tail contact reserve with a compact, premium, direct Contact ending that continues the existing Silk environment and presents only verified Weberaise contact channels.

**Architecture:** Keep the route-level fixed `SilkWavesBackground` unchanged. Replace the blank `contactReserve` in `ServicesTailEnvironment` with a focused `ContactEnding` component that owns the section marker, non-clickable `CONTACT US` heading, optional verified contact directory, and final footer strip. Contact data lives in one small model so no contact values are scattered through JSX and no fake values are ever published.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript, CSS Modules, existing raw WebGL1 Silk background, Node test runner.

## Global Constraints

- Work on `feature/services-opening-grid`; approved design spec: `docs/superpowers/specs/2026-08-14-services-contact-ending-design.md`.
- Do not alter Services opening/menu choreography, service previews, Works Bridge, Capabilities layout, or Silk shader internals.
- Reuse the one existing fixed Silk canvas; no second WebGL instance, shader restart, contact-specific shader state, or pointer reaction.
- Contact is direct information, not persuasive copy.
- Section marker: `// CONTACT.`
- Main heading: `CONTACT US`; display text only, never a link/button/modal trigger.
- Desktop target: approximately 80–95svh, starting around 88–90svh.
- Desktop heading stays one line when comfortable; narrow screens may wrap naturally.
- Directory is organized, not scattered: email and phone/WhatsApp in a two-column desktop grid, social row below; mobile stacks cleanly.
- Publish only real contact values already verified by the project/user. Never invent email, phone, WhatsApp, Instagram, LinkedIn, or other URLs.
- If a channel is not verified at implementation time, omit that channel completely rather than rendering placeholder copy.
- No location, local time, office address, form, newsletter, cards, glassmorphism, fake legal links, testimonials, conversion copy, or duplicated `LET'S TALK` control.
- Footer minimum: `WEBERAISE` + current year.
- Functional links use familiar semantics: `mailto:`, `tel:`, WhatsApp URL, ordinary external social links.
- No JS animation system. Small link hover/focus states use CSS only.
- Reduced motion must remain valid without changing content.

---

## File Structure

**Create:**
- `src/components/ServicesPage/ContactEnding.tsx` — semantic contact section, directory rendering, and footer strip.
- `src/components/ServicesPage/ContactEnding.module.css` — organized desktop/mobile composition and restrained interactions.
- `src/components/ServicesPage/contactDetails.ts` — typed single source of truth for verified contact channels.
- `tests/services-contact-ending.test.mjs` — structural/regression contracts for the Contact ending.

**Modify:**
- `src/components/ServicesPage/ServicesTailEnvironment.tsx` — replace blank reserve with `<ContactEnding />`.
- `src/components/ServicesPage/ServicesTailEnvironment.module.css` — remove obsolete `.contactReserve`; preserve the tail and 40vh transition veil.

**Do not modify unless verification exposes a genuine regression:**
- `src/components/ui/SilkWavesBackground/*`
- `src/components/ServicesPage/CapabilitiesSection*`
- `src/components/ServicesPage/WorksBridge*`
- `src/components/ServicesPage/ServicesPage*`
- `src/app/services/page.tsx`
- `src/app/services/ServicesRoute.module.css`

---

### Task 1: Lock the Contact ending structure with failing tests

**Files:**
- Create: `tests/services-contact-ending.test.mjs`
- Production files created in later tasks.

**Interfaces:**
- Protects exact copy, semantic non-clickable heading, real-channel-only model, organized layout, tail integration, and Silk reuse.

- [ ] **Step 1: Create the failing test file**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const moduleUrl = (file) => pathToFileURL(path.join(root, file)).href;

test('contact ending uses direct non-persuasive section copy', () => {
  const source = read('src/components/ServicesPage/ContactEnding.tsx');

  assert.match(source, /\/\/ CONTACT\./);
  assert.match(source, />\s*CONTACT US\s*</);
  assert.doesNotMatch(source, /dream|idea|project|ready|transform|grow|build together|let.s talk/i);
  assert.doesNotMatch(source, /href=[^>]*CONTACT US|<button[^>]*>[\s\S]*CONTACT US/i);
});

test('contact details model never embeds placeholder channels', async () => {
  const model = await import(moduleUrl('src/components/ServicesPage/contactDetails.ts'));
  const details = model.CONTACT_DETAILS;

  assert.ok(Array.isArray(details));
  for (const item of details) {
    assert.ok(['email', 'phone', 'whatsapp', 'social'].includes(item.kind));
    assert.equal(typeof item.label, 'string');
    assert.equal(typeof item.value, 'string');
    assert.equal(typeof item.href, 'string');
    assert.ok(item.label.trim().length > 0);
    assert.ok(item.value.trim().length > 0);
    assert.ok(item.href.trim().length > 0);
    assert.doesNotMatch(`${item.value} ${item.href}`, /example|placeholder|your-|000000|todo|tbd/i);
  }
});

test('contact ending is organized and responsive rather than scattered', () => {
  const css = read('src/components/ServicesPage/ContactEnding.module.css');

  assert.match(css, /min-height:\s*clamp\([^;]*(88|90)svh/);
  assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /@media \(max-width:\s*720px\)[\s\S]*grid-template-columns:\s*1fr/);
  assert.doesNotMatch(css, /margin-left:\s*\d+(%|vw)/);
  assert.doesNotMatch(css, /position:\s*sticky/);
  assert.doesNotMatch(css, /position:\s*fixed/);
});

test('services tail mounts contact ending after capabilities without creating another shader', () => {
  const tail = read('src/components/ServicesPage/ServicesTailEnvironment.tsx');
  const tailCss = read('src/components/ServicesPage/ServicesTailEnvironment.module.css');
  const route = read('src/app/services/page.tsx');

  assert.match(tail, /<CapabilitiesSection\s*\/>[\s\S]*<ContactEnding\s*\/>/);
  assert.doesNotMatch(tail, /contactReserve/);
  assert.doesNotMatch(tailCss, /\.contactReserve/);
  assert.equal((route.match(/<SilkWavesBackground/g) ?? []).length, 1);
  assert.match(tailCss, /height:\s*40vh/);
});

test('contact footer remains minimal', () => {
  const source = read('src/components/ServicesPage/ContactEnding.tsx');

  assert.match(source, /WEBERAISE/);
  assert.match(source, /new Date\(\)\.getFullYear\(\)/);
  assert.doesNotMatch(source, /LOCAL TIME|BASED IN|NEWSLETTER|PRIVACY|TERMS/i);
});
```

- [ ] **Step 2: Run the new test and verify RED**

```bash
node --experimental-strip-types --test tests/services-contact-ending.test.mjs
```

Expected: FAIL because `ContactEnding.tsx` and `contactDetails.ts` do not exist yet.

---

### Task 2: Create the verified contact-data boundary

**Files:**
- Create: `src/components/ServicesPage/contactDetails.ts`
- Test: `tests/services-contact-ending.test.mjs`

**Interfaces:**
- Produces `ContactDetailKind`, `ContactDetail`, and `CONTACT_DETAILS`.
- `ContactEnding.tsx` consumes `CONTACT_DETAILS` without owning literal contact values.

- [ ] **Step 1: Add the typed model**

```ts
export type ContactDetailKind = 'email' | 'phone' | 'whatsapp' | 'social';

export type ContactDetail = {
  kind: ContactDetailKind;
  label: string;
  value: string;
  href: string;
  external?: boolean;
};

/**
 * Populate only with contact channels that have been explicitly verified for Weberaise.
 * Unverified channels stay absent; the Contact ending handles an empty list cleanly.
 */
export const CONTACT_DETAILS: readonly ContactDetail[] = [];
```

This empty array is deliberate and truthful if no production contact channel exists in the current Services branch. Do not substitute the repository committer email or infer social URLs from the agency name.

- [ ] **Step 2: Run the model contract**

```bash
node --experimental-strip-types --test tests/services-contact-ending.test.mjs
```

Expected: tests still fail because the component does not exist, but the contact model import itself no longer fails.

- [ ] **Step 3: Commit the data boundary with the test contract**

```bash
git add src/components/ServicesPage/contactDetails.ts tests/services-contact-ending.test.mjs
git commit -m "test: define services contact data contract"
```

---

### Task 3: Build the semantic Contact ending

**Files:**
- Create: `src/components/ServicesPage/ContactEnding.tsx`
- Create later: `src/components/ServicesPage/ContactEnding.module.css`
- Test: `tests/services-contact-ending.test.mjs`

**Interfaces:**
- Consumes `CONTACT_DETAILS`.
- Produces `<ContactEnding />` for `ServicesTailEnvironment`.

- [ ] **Step 1: Create the component**

```tsx
import { CONTACT_DETAILS } from './contactDetails';
import styles from './ContactEnding.module.css';

const PRIMARY_DETAILS = CONTACT_DETAILS.filter((item) =>
  item.kind === 'email' || item.kind === 'phone' || item.kind === 'whatsapp'
);

const SOCIAL_DETAILS = CONTACT_DETAILS.filter((item) => item.kind === 'social');

export function ContactEnding() {
  const year = new Date().getFullYear();

  return (
    <section className={styles.section} aria-labelledby="services-contact-heading">
      <div className={styles.main}>
        <p className={styles.kicker}>// CONTACT.</p>
        <h2 id="services-contact-heading" className={styles.heading}>
          CONTACT US
        </h2>

        {(PRIMARY_DETAILS.length > 0 || SOCIAL_DETAILS.length > 0) && (
          <div className={styles.directory}>
            {PRIMARY_DETAILS.map((item) => (
              <div className={styles.contactBlock} key={`${item.kind}-${item.label}`}>
                <p className={styles.label}>{item.label}</p>
                <a
                  className={styles.value}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noreferrer' : undefined}
                >
                  <span>{item.value}</span>
                  <span className={styles.arrow} aria-hidden="true">↗</span>
                </a>
              </div>
            ))}

            {SOCIAL_DETAILS.length > 0 && (
              <div className={styles.socialBlock}>
                <p className={styles.label}>SOCIAL</p>
                <div className={styles.socialLinks}>
                  {SOCIAL_DETAILS.map((item) => (
                    <a
                      className={styles.socialLink}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      key={item.label}
                    >
                      <span>{item.value}</span>
                      <span className={styles.arrow} aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <span>WEBERAISE</span>
        <span>© {year}</span>
      </footer>
    </section>
  );
}
```

Notes locked by spec:
- `CONTACT US` receives no link, button, click handler, pointer cursor, or modal behavior.
- Empty verified contact data does not render fake rows; the visual ending remains heading + footer until real channels are supplied.
- No copy-to-clipboard behavior in the first implementation because a normal `mailto:` link is the clearer familiar interaction and no approved copy affordance exists yet.

- [ ] **Step 2: Run the focused test**

```bash
node --experimental-strip-types --test tests/services-contact-ending.test.mjs
```

Expected: component-copy tests now advance; CSS and tail-integration tests still fail until Tasks 4–5.

- [ ] **Step 3: Commit**

```bash
git add src/components/ServicesPage/ContactEnding.tsx
git commit -m "feat: add services contact ending structure"
```

---

### Task 4: Implement the premium organized Contact composition

**Files:**
- Create: `src/components/ServicesPage/ContactEnding.module.css`
- Test: `tests/services-contact-ending.test.mjs`

**Interfaces:**
- Desktop: compact ~90svh section, single-line heading where possible, organized two-column directory.
- Mobile <=720px: single-column directory and naturally wrapping heading.

- [ ] **Step 1: Create the stylesheet**

```css
.section {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: min(100%, 1600px);
  min-height: clamp(680px, 90svh, 940px);
  margin: 0 auto;
  padding: clamp(92px, 12svh, 132px) var(--wr-page-pad) 28px;
  color: var(--wr-white);
}

.main {
  width: 100%;
}

.kicker {
  margin: 0 0 clamp(28px, 4svh, 40px);
  color: rgb(255 255 255 / 62%);
  font: 650 11px/1 var(--font-body), Arial, sans-serif;
  letter-spacing: .14em;
}

.heading {
  margin: 0;
  width: max-content;
  max-width: 100%;
  color: rgb(255 255 255 / 96%);
  font: 600 clamp(72px, 9vw, 146px)/.9 var(--font-hero), Arial, sans-serif;
  letter-spacing: -.065em;
  white-space: nowrap;
}

.directory {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: clamp(56px, 8vw, 140px);
  row-gap: clamp(42px, 6svh, 68px);
  margin-top: clamp(70px, 9svh, 104px);
}

.contactBlock,
.socialBlock {
  min-width: 0;
}

.label {
  margin: 0 0 14px;
  color: rgb(255 255 255 / 54%);
  font: 650 10px/1 var(--font-body), Arial, sans-serif;
  letter-spacing: .13em;
}

.value,
.socialLink {
  display: inline-flex;
  align-items: baseline;
  gap: 10px;
  max-width: 100%;
  color: rgb(255 255 255 / 90%);
  text-decoration: none;
  transition:
    color 240ms ease,
    letter-spacing 260ms cubic-bezier(.22, 1, .36, 1);
}

.value {
  font: 520 clamp(28px, 3.1vw, 46px)/1 var(--font-hero), Arial, sans-serif;
  letter-spacing: -.04em;
  overflow-wrap: anywhere;
}

.arrow {
  display: inline-block;
  flex: none;
  font-size: .45em;
  transform: translate(0, -.22em);
  transition: transform 260ms cubic-bezier(.22, 1, .36, 1);
}

.socialBlock {
  grid-column: 1 / -1;
}

.socialLinks {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 34px;
}

.socialLink {
  font: 560 clamp(20px, 2vw, 28px)/1 var(--font-hero), Arial, sans-serif;
  letter-spacing: -.035em;
}

.footer {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-top: clamp(72px, 10svh, 112px);
  padding-top: 20px;
  border-top: 1px solid rgb(255 255 255 / 14%);
  color: rgb(255 255 255 / 58%);
  font: 620 10px/1 var(--font-body), Arial, sans-serif;
  letter-spacing: .12em;
}

@media (hover: hover) and (pointer: fine) {
  .value:hover,
  .socialLink:hover {
    color: #fff;
    letter-spacing: -.045em;
  }

  .value:hover .arrow,
  .socialLink:hover .arrow {
    transform: translate(3px, calc(-.22em - 3px));
  }
}

.value:focus-visible,
.socialLink:focus-visible {
  outline: 1px solid rgb(96 165 250 / 92%);
  outline-offset: 6px;
}

@media (max-width: 980px) {
  .heading {
    font-size: clamp(68px, 9.8vw, 108px);
  }
}

@media (max-width: 720px) {
  .section {
    min-height: clamp(620px, 88svh, 820px);
    padding: clamp(82px, 11svh, 112px) 18px 22px;
  }

  .heading {
    width: min-content;
    font-size: clamp(62px, 19vw, 92px);
    line-height: .88;
    white-space: normal;
  }

  .directory {
    grid-template-columns: 1fr;
    row-gap: 42px;
    margin-top: clamp(58px, 8svh, 78px);
  }

  .socialBlock {
    grid-column: auto;
  }

  .value {
    font-size: clamp(26px, 8.2vw, 38px);
  }

  .footer {
    margin-top: 74px;
  }
}

@media (max-width: 420px) {
  .footer {
    align-items: flex-end;
  }
}

@media (pointer: coarse) {
  .value,
  .socialLink,
  .arrow {
    transition: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .value,
  .socialLink,
  .arrow {
    transition-duration: 1ms;
  }
}
```

- [ ] **Step 2: Run focused tests**

```bash
node --experimental-strip-types --test tests/services-contact-ending.test.mjs
```

Expected: layout contract passes; tail integration still fails until Task 5.

- [ ] **Step 3: Commit**

```bash
git add src/components/ServicesPage/ContactEnding.module.css
git commit -m "feat: style services contact ending"
```

---

### Task 5: Replace the blank reserve in Services tail

**Files:**
- Modify: `src/components/ServicesPage/ServicesTailEnvironment.tsx`
- Modify: `src/components/ServicesPage/ServicesTailEnvironment.module.css`
- Test: `tests/services-contact-ending.test.mjs`

**Interfaces:**
- Tail order becomes transition veil -> Capabilities -> ContactEnding.
- Existing fixed shader remains route-level and unchanged.

- [ ] **Step 1: Update `ServicesTailEnvironment.tsx`**

```tsx
import { CapabilitiesSection } from './CapabilitiesSection';
import { ContactEnding } from './ContactEnding';
import styles from './ServicesTailEnvironment.module.css';

export function ServicesTailEnvironment() {
  return (
    <div id="services-tail-environment" className={styles.tail}>
      <div className={styles.transitionVeil} aria-hidden="true" />
      <CapabilitiesSection />
      <ContactEnding />
    </div>
  );
}
```

- [ ] **Step 2: Remove only obsolete reserve sizing from `ServicesTailEnvironment.module.css`**

Delete:

```css
.contactReserve {
  position: relative;
  z-index: 1;
  min-height: clamp(620px, 82svh, 900px);
}
```

and its mobile `.contactReserve` rule.

Keep `.tail`, `.transitionVeil`, the 40vh desktop transition, and the existing mobile 34vh transition unchanged. Do not compensate by adding extra tail height unless browser QA proves a real clipping problem.

- [ ] **Step 3: Run focused tests and verify GREEN**

```bash
node --experimental-strip-types --test tests/services-contact-ending.test.mjs
node --experimental-strip-types --test tests/services-capabilities-silk.test.mjs
```

Expected: both focused suites pass with zero failures.

- [ ] **Step 4: Commit**

```bash
git add src/components/ServicesPage/ServicesTailEnvironment.tsx \
  src/components/ServicesPage/ServicesTailEnvironment.module.css \
  tests/services-contact-ending.test.mjs
git commit -m "feat: integrate services contact ending"
```

---

### Task 6: Automated verification and scope protection

**Files:** none unless verification exposes a defect.

- [ ] **Step 1: Run all Services-tail focused tests**

```bash
node --experimental-strip-types --test \
  tests/services-contact-ending.test.mjs \
  tests/services-capabilities-silk.test.mjs \
  tests/works-bridge.test.mjs
```

Expected: zero failures.

- [ ] **Step 2: Run repository test command if available in the user checkout**

```bash
npm test
```

Expected: zero failures. If the repository test command is unavailable or an unrelated pre-existing failure occurs, record the exact output rather than changing unrelated code.

- [ ] **Step 3: Run TypeScript verification**

Use the repository's current typecheck command if present:

```bash
npm run typecheck
```

If this checkout does not define `typecheck`, use the already-established focused TypeScript check for the Services files and report that limitation explicitly.

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: exit 0 in a network/runtime-capable checkout. Do not claim a successful build without actual output.

- [ ] **Step 5: Scan for forbidden Contact behavior/copy**

```bash
grep -RniE "LOCAL TIME|BASED IN|newsletter|contactReserve|CONTACT US.*href|onClick.*CONTACT|LET.S TALK" \
  src/components/ServicesPage/ContactEnding* \
  src/components/ServicesPage/ServicesTailEnvironment* || true
```

Expected: no forbidden implementation matches except any deliberate test fixture strings.

- [ ] **Step 6: Scope check**

Compare against the Contact-spec commit baseline `0bc224b79f241d704ee2066c23664f49f4645edf`.

Expected implementation files only:

```text
src/components/ServicesPage/ContactEnding.tsx
src/components/ServicesPage/ContactEnding.module.css
src/components/ServicesPage/contactDetails.ts
src/components/ServicesPage/ServicesTailEnvironment.tsx
src/components/ServicesPage/ServicesTailEnvironment.module.css
tests/services-contact-ending.test.mjs
```

No `SilkWavesBackground`, Capabilities, Works Bridge, Services menu, or global navigation files should change.

---

### Task 7: Browser art-direction QA

**Files:** tune `ContactEnding.module.css` only unless a genuine semantic/integration defect is found.

- [ ] **Step 1: Launch `/services`**

```bash
npm run dev
```

Scroll from the final Improvement capability into the Contact ending.

- [ ] **Step 2: Check the 1440×900 composition**

Verify:

```text
Capabilities flows into Contact without a hard background reset
same Silk state continues behind Contact
// CONTACT. aligns with the established content grid
CONTACT US is strong but not a hero-scale takeover
CONTACT US remains a single line when comfortable
no pointer cursor or hover treatment implies heading clickability
directory, when verified data exists, reads as a disciplined ledger
footer feels like a quiet resolution rather than another section
no excessive dead vertical space
```

- [ ] **Step 3: Check 1280×800 and 768×1024**

Keep the two-column directory while values fit naturally. If real contact strings collide or feel cramped, move the directory stack breakpoint upward within approximately 720–820px; do not introduce staggered/scattered placement.

- [ ] **Step 4: Check 390×844**

Verify:

```text
CONTACT / US wraps cleanly
single-column directory
no horizontal overflow
contact values remain readable
footer remains inside the natural page ending
Silk remains smooth and subordinate
```

- [ ] **Step 5: Keyboard/focus/reduced-motion check**

Tab through every rendered contact link. Confirm focus rings are visible against all Silk phases. With `prefers-reduced-motion`, verify no required information disappears and no contact-specific motion remains beyond effectively static CSS state.

- [ ] **Step 6: If real contact data is still unavailable, stop before inventing it**

The section may ship structurally with the direct heading/footer and no directory rows. Add channel values only after the user or a verified shared contact configuration supplies them.

- [ ] **Step 7: Re-run focused tests after any CSS tuning**

```bash
node --experimental-strip-types --test \
  tests/services-contact-ending.test.mjs \
  tests/services-capabilities-silk.test.mjs \
  tests/works-bridge.test.mjs
```

- [ ] **Step 8: Final tuning commit only if browser evidence caused a change**

```bash
git add src/components/ServicesPage/ContactEnding.module.css tests/services-contact-ending.test.mjs
git commit -m "fix: tune services contact ending"
```

Do not create a no-op commit.

---

## Final Acceptance Checklist

```text
CONTACT STRUCTURE
[ ] // CONTACT. present
[ ] CONTACT US present and non-interactive
[ ] no persuasive copy
[ ] no location/local time/form/newsletter
[ ] only verified contact channels render
[ ] no fake contact data

VISUAL
[ ] compact ~80–95svh ending
[ ] CONTACT US strong but not hero-dominant
[ ] organized two-column desktop directory
[ ] clean one-column mobile layout
[ ] no scattered offsets/cards/glass
[ ] restrained functional link interactions only
[ ] minimal WEBERAISE + current-year footer

INTEGRATION
[ ] blank contact reserve removed
[ ] Capabilities -> ContactEnding order preserved
[ ] one fixed Silk canvas only
[ ] shader code/preset untouched
[ ] global LET'S TALK behavior untouched

VERIFICATION
[ ] Contact tests pass
[ ] Capabilities/Silk regression tests pass
[ ] Works Bridge regression tests pass
[ ] TypeScript check passes in available environment
[ ] production build checked where environment permits
[ ] browser QA at 1440×900, 1280×800, 768×1024, 390×844
[ ] keyboard focus checked
[ ] reduced-motion checked
```
