# Services Centered Masthead and Inversion Implementation Plan

> **Execution note:** This plan supersedes the unfinished row/hover and later visual tasks in `2026-08-13-services-menu-to-grid-fidelity.md`. The earlier motion blueprint and same-node handoff work remain the implementation foundation.

**Goal:** Preserve the smooth Codrops-derived Services choreography while changing its visual destination to a true-black Weberaise index with a large centered white `SERVICES` masthead, inline numbering, complete white/black row inversion, monochrome fullscreen takeover, and intentional empty space below.

**Architecture:** Continue using `ServicesPage.tsx` as the GSAP/Flip orchestrator and the existing data-driven five-service model. Keep the same transferable primary block nodes and centralized motion constants. Recompose the CSS and small parts of the row DOM around a centered masthead and inline number/title unit. Use a row visual-state attribute to synchronize GSAP hover, CSS inversion, focus, and click takeover without cloning content.

**Tech stack:** Next.js App Router, React, TypeScript, GSAP, GSAP Flip, CSS Modules, existing Next/font faces (`Inter_Tight`, `Geist`, plus the already-started `Geist_Mono` technical alternate), Node test runner with `tsx`.

## Constraints

- Stay on `feature/services-opening-grid`; current local HEAD before this revision is `441c4cd`, ahead of remote `36d9172` by four commits.
- Preserve user-owned changes in `next-env.d.ts`, `tsconfig.json`, `package-lock.json`, and unrelated untracked repo instruction files.
- Do not edit homepage animation/components; read them only for palette evidence.
- Keep exactly five service groups.
- Preserve the current smooth intro entrance, hold, outer exits, and overlapping row reveal.
- The same `SERVICES` node must remain white, keep its intro font, and dock horizontally centered at a similar size.
- Use true `var(--wr-black)`, not `var(--wr-background)`, for the Services page and runway.
- Hover/focus must invert the full row to white with black text; touch must still open without hover.
- Preserve Codrops title switching, preview-piece entrance, cover origin, Flip reparenting, 4×2 desktop grid, and close return.
- Add no dependency, fake content, new lower-page section, or sixth service.
- Do not summon the requested design-review agent until implementation and primary QA are complete.

## Exact file map

- Modify `src/app/layout.tsx` — finish registering `Geist_Mono` for the hover-only alternate; do not change the masthead's Inter Tight face.
- Modify `src/components/ServicesPage/ServicesPage.tsx` — remove the blue handoff tween, render number inline with title, synchronize active row state, establish white selected state before cover expansion, render an empty runway, and keep DOM transfer/accessibility lifecycle intact.
- Modify `src/components/ServicesPage/ServicesPage.module.css` — true-black canvas, centered masthead geometry, refined title weight, inline number grid, neutral rules, full inversion, monochrome preview pieces/cover, responsive layout, and empty-runway size.
- Modify `tests/services-page.test.mjs` — replace obsolete blue/top-left/micro-number contracts with centered-white/inversion/runway behavior contracts; preserve existing Codrops/Flip/accessibility assertions.
- Use `src/components/ServicesPage/servicesMotion.ts` unchanged unless browser timing evidence requires a small shared constant adjustment.
- Use `src/components/ServicesPage/servicesModel.ts` unchanged unless a label demonstrably breaks responsive layout; do not alter the five services or eight-piece composition.
- Update this plan's checkboxes after each verified batch.

## Task 1: Lock the revised visual/state contracts before implementation

- [ ] Add a focused test requiring `.page` and `.intro` to use `var(--wr-black)` and forbidding `var(--wr-background)` in those rules.
- [ ] Require docked `SERVICES` to stay `var(--wr-white)`, retain `var(--font-hero)`, use a large `clamp(...)` size, and forbid the former blue handoff tween.
- [ ] Require `.indexHeader`/`.servicesLabelSlot` to center the destination and reserve menu-bar top space.
- [ ] Require inline row markup containing number and title in the same reading unit; remove the obsolete absolutely positioned micro-index contract.
- [ ] Require a row inversion state with white background and black number/title plus a neutral focus-visible treatment.
- [ ] Require `data-row-active` (or equivalent) to be controlled by hover/focus methods and established before opening.
- [ ] Require a monochrome white cover and black preview pieces.
- [ ] Require an empty `aria-hidden` runway after the index with a responsive `min-height`.
- [ ] Run `node --import=tsx --test tests/services-page.test.mjs` and confirm the new assertions fail for the expected old styling/markup.

## Task 2: Recompose the same-node handoff into the centered masthead

- [ ] Remove the GSAP tween to `var(--wr-blue)` and all compact utility-label font overrides.
- [ ] Keep `servicesWord` on `var(--font-hero)` with the intro's weight, tracking, line-height, casing, and white color in both source/destination states.
- [ ] Build a full-width centered destination slot below a responsive menu-bar reserve; tune the docked size to a modest reduction only.
- [ ] Preserve `Flip.getState`, physical append, `Flip.from({ scale: true })`, handoff stacking, and concurrent row reveal.
- [ ] Adjust the index header height so the masthead and first row breathe without pushing the five-row index beyond a useful desktop first view.
- [ ] Verify intermediate frames at desktop and mobile: no left drift, blue flash, font switch, ghost, or premature row settle.

## Task 3: Rebuild row typography and inline numbering

- [ ] Change the left row cell to a number/title grid: compact number column, fluid clipped title, aligned optical baseline.
- [ ] Set normal titles in Inter Tight at a refined medium weight and responsive 30–46px desktop scale.
- [ ] Remove the tiny number positioned above the title; use a readable 12–15px inline number.
- [ ] Preserve controlled desktop single-line behavior and allow the commerce title to wrap at deliberate laptop/mobile breakpoints.
- [ ] Replace blue-tinted borders/backgrounds with low-opacity neutral white rules on black.
- [ ] Keep origin preview pieces absent at rest and ensure the entire row remains a semantic clickable/focusable target.
- [ ] Add the empty black runway below the content without copy or decoration.
- [ ] Capture 1440×900, laptop, tablet, and 390×844 resting states; reject generic heavy type, uneven number alignment, and overflow.

## Task 4: Synchronize full-row inversion with Codrops hover/focus motion

- [ ] Add a stable `data-row-active` visual state when fine-pointer hover or keyboard focus starts; remove it only on the matching exit when no preview is open.
- [ ] Transition row background and foreground with `var(--wr-ease-premium)` over roughly 0.45s.
- [ ] Make number and title black under inversion, including while the clipped title switches to Geist Mono.
- [ ] Restyle row preview pieces as black flat objects with white type/rules on the white row.
- [ ] Preserve reference block entrance (`scale .8`, `xPercent 20`, `.4s`, negative stagger) and exit.
- [ ] Preserve clipped title exit/switch/entrance; ensure the alternate is visibly different without becoming decorative.
- [ ] Apply the same inversion to keyboard focus-visible with a restrained neutral inset outline.
- [ ] On coarse pointer, keep pieces absent at rest and bypass desktop hover while retaining click.
- [ ] Hover every row in Chromium and inspect early/mid/settled inversion frames for flashes, seam artifacts, title clipping, long-title overlap, and preview readability.

## Task 5: Translate takeover and fullscreen grid to the monochrome field

- [ ] On click, establish the selected row's white/black state before measuring/starting the cover expansion.
- [ ] Keep selected row at z-index 11 and cover at z-index 10; use a white cover starting at exact row top/height.
- [ ] Preserve directional exits for titles above/below the selection.
- [ ] Capture the same three visible preview blocks, physically prepend them into the active grid, and run `Flip.from` with centralized Codrops values.
- [ ] Style all eight fullscreen pieces as flat black geometry with white labels and subtle neutral micro-details; remove blue borders/glow/rounded card language.
- [ ] Use black preview title and close control proportionate to the grid.
- [ ] Keep desktop 4×2 and mobile 2×4 geometry.
- [ ] Verify first, middle, and last opens at mid-cover and settled frames; reject cover-origin mismatch, row/cover seam, Flip jumps, and dashboard-card appearance.

## Task 6: Preserve and retune close, repeated-state, and accessibility behavior

- [ ] Shrink/fade all grid pieces, return primary nodes to the selected row origin, exit title/close, and collapse the white cover back toward the row.
- [ ] Remove row-active/current state only when collapse restores the black menu, preventing a white flash before the cover reaches its source.
- [ ] Restore row titles, menu accessibility, tab stops, body overflow, and focus origin.
- [ ] Verify close button and Escape, first/middle/last rows, repeated open/close cycles, resize after close, and focus restoration.
- [ ] Verify inactive dialog content remains hidden from assistive technology and hidden menu controls are not focusable during preview.

## Task 7: Responsive, reduced-motion, and automated verification

- [ ] Desktop 1440×900: intro, centered handoff frames, all row hovers, first/middle/last open, close mid-frame, repeated cycles.
- [ ] Laptop and tablet: masthead/menu proportions, long-title wrap, right preview-piece fit, fullscreen grid.
- [ ] Mobile 390×844/coarse pointer: centered masthead, inline number, no resting pieces, tap open, 2×4 grid, reachable close, no horizontal overflow.
- [ ] Reduced motion: same node relocation, information/state preservation, immediate inversion/focus, correct open/close DOM state.
- [ ] Run focused Services tests, `npm test`, `npm run typecheck`, and `npm run build`.
- [ ] Distinguish any pre-existing unrelated suite failures from regressions with exact test evidence; do not edit protected homepage code to satisfy stale tests.

## Task 8: Requested adversarial graphic-design review and final refinement

- [ ] Only after Tasks 1–7, spawn one review agent explicitly framed as an adversarial senior graphic/interaction designer.
- [ ] Give it the approved revision spec, Codrops and Weberaise screenshots, desktop/mobile captures, and permission to criticize hierarchy, rhythm, typography, contrast, identity, hover transition, takeover continuity, and whitespace.
- [ ] Require ranked findings with visual evidence and concrete alternatives, not a generic approval.
- [ ] Debate each material recommendation against the user's locked direction, Codrops choreography, accessibility, and current browser evidence.
- [ ] Accept only changes that strengthen the approved system; document rejected recommendations and why.
- [ ] Implement accepted refinements, repeat affected screenshots/tests, then run final verification before completion claims.

## Commit strategy

1. `docs: revise services around centered inversion` — this spec and plan only.
2. `feat: center services masthead and invert service rows` — tests plus intro/index/hover implementation.
3. `feat: carry monochrome inversion into services grid` — takeover, grid, close, responsive refinements.
4. `fix: apply services design review refinements` — only if the requested design review produces accepted changes.

Do not stage user-owned generated/config changes or unrelated files.
