# Weberaise Navigation Selective Integration

## Goal

Integrate the approved floating navigation from `feature/floating-navigation` into the current `feature/signature-intro` homepage without regressing any newer homepage, ribbon, artwork, loader, hero reveal, reassurance, or post-Explore work.

## Precedence

- Navigation UI, hover behavior, gooey CTA behavior, responsive layout, theme sampling, reduced-motion behavior, hero/main mounting behavior, and navigation tests come from `feature/floating-navigation`.
- All non-navigation homepage content and implementation come from current `feature/signature-intro`.
- Do not restore obsolete sections from the old navigation branch.
- Do not full-merge or cherry-pick the historical branch wholesale.

## Files to transplant exactly

Copy from `feature/floating-navigation`:

- `src/components/navigation/SiteNavigation.tsx`
- `src/components/navigation/CenterNavCluster.tsx`
- `src/components/navigation/GooeyTalkButton.tsx`
- `src/components/navigation/Navigation.module.css`
- `src/components/navigation/centerHoverMotion.ts`
- `src/components/navigation/gooeyParticles.ts`
- `src/components/navigation/navigationModel.ts`
- `src/components/navigation/useNavigationTheme.ts`
- `tests/navigation.test.mjs`

## Current-branch integration hooks

### `ExperienceShell.tsx`

Keep the current state machine unchanged. Add the navigation import and mount `<SiteNavigation mode="main" />` only when `state === 'main'`, before current main children.

### `Hero.tsx`

Keep current hero reveal/open/Explore implementation unchanged except for the navigation integration from the navigation branch:

- render hero-mode navigation only during `heroInteractive` and `heroExiting`;
- hero navigation is interactive only during `heroInteractive`;
- clicking a hero nav target uses the existing Explore exit before attempting to navigate to the hidden main target;
- preserve `pendingTargetRef`, unlock polling, `scrollIntoView`, and hash replacement behavior from the navigation branch;
- keep the navigation before `HeroRevealCanvas` in DOM order as required by its visual compositing design.

### `PostExploreNarrative.tsx`

Keep all current narrative/ribbon/artwork markup unchanged. Add only `data-nav-theme="dark"` to the existing `#post-explore` root so main navigation theme sampling works.

### `MainSite.tsx`

Do not import or restore the old navigation branch's temporary homepage sections. Current `MainSite` remains authoritative.

## Destination caveat

The approved navigation model currently targets `#services`, `#work`, `#about`, and `#contact`. The current homepage branch intentionally no longer contains the old temporary target sections. Preserve the navigation model exactly for this integration; destination routing can be updated when the real Services/Work/About/Contact page implementations are integrated. Do not recreate placeholder sections merely to satisfy anchors.

## Validation

- Existing navigation test suite passes after adapting only assertions that depended on obsolete `MainSite` placeholder sections.
- Existing homepage/ribbon tests remain unchanged and passing.
- Typecheck/build remain passing.
- Browser QA: desktop + mobile; loader/hero unchanged; nav appears after hero opens; nav remains during Explore exit; main nav persists over the dark post-Explore journey; center hover plate and LET'S TALK goo remain identical to navigation branch; no layout shift or ribbon geometry change.

## Non-goals

- No redesign of the menu.
- No changes to ribbon geometry/pacing.
- No Q1/Q2 artwork changes.
- No Q3 artwork work.
- No restoration of deprecated homepage sections.
- No merge to `main` and no PR merge.