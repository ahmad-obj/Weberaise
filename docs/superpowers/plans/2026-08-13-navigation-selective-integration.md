# Navigation Selective Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the approved floating navigation from `feature/floating-navigation` into the current `feature/signature-intro` homepage while preserving every newer non-navigation change.

**Architecture:** Treat the navigation directory as an isolated subsystem copied verbatim from the navigation branch. Integrate it into the current experience state machine through three narrow hooks only: hero mounting/navigation handoff, main-state mounting, and dark-theme declaration on the current post-Explore root. Never merge or cherry-pick the old branch wholesale.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS Modules, GSAP, Node test runner.

## Global Constraints

- Navigation branch wins only for navigation UI/behavior.
- Current `feature/signature-intro` wins for all homepage/ribbon/artwork/loader/hero-reveal content.
- Do not restore old `MainSite.tsx` sections.
- Do not modify ribbon geometry/pacing or artwork.
- Preserve existing experience state names and Explore timeline.
- Do not merge PR #1 or merge to `main`.

---

### Task 1: Port navigation regression coverage

**Files:**
- Create: `tests/navigation.test.mjs`

**Interfaces:**
- Consumes: current `ExperienceShell.tsx`, `Hero.tsx`, `PostExploreNarrative.tsx`.
- Produces: static regression coverage for the navigation subsystem and its integration hooks.

- [ ] Copy `tests/navigation.test.mjs` from `feature/floating-navigation`.
- [ ] Modify only the old assertion that requires `MainSite.tsx` to contain `data-nav-theme="dark"`; the current homepage intentionally removed those temporary sections, so require theme declaration on `PostExploreNarrative.tsx` instead.
- [ ] Run `node --test tests/navigation.test.mjs` before production files are added. Expected: FAIL because `src/components/navigation/*` does not yet exist and hero/shell hooks are absent.

### Task 2: Transplant navigation subsystem verbatim

**Files:**
- Create: `src/components/navigation/SiteNavigation.tsx`
- Create: `src/components/navigation/CenterNavCluster.tsx`
- Create: `src/components/navigation/GooeyTalkButton.tsx`
- Create: `src/components/navigation/Navigation.module.css`
- Create: `src/components/navigation/centerHoverMotion.ts`
- Create: `src/components/navigation/gooeyParticles.ts`
- Create: `src/components/navigation/navigationModel.ts`
- Create: `src/components/navigation/useNavigationTheme.ts`

**Interfaces:**
- `SiteNavigation({ mode: 'hero' | 'main', interactive?: boolean, onNavigate?: (href: string) => void })`
- Center destinations remain `#services`, `#work`, `#about`; talk remains `#contact`.

- [ ] Copy the eight files byte-for-byte from `feature/floating-navigation`.
- [ ] Do not alter CSS, hover plate behavior, goo particles, theme sampling, responsive layout, or reduced-motion handling.

### Task 3: Add only current-branch integration hooks

**Files:**
- Modify: `src/components/experience/ExperienceShell.tsx`
- Modify: `src/components/experience/Hero/Hero.tsx`
- Modify: `src/components/MainSite/PostExploreNarrative/PostExploreNarrative.tsx`

**Interfaces:**
- `ExperienceShell`: render `<SiteNavigation mode="main" />` only when `state === 'main'`.
- `Hero`: render hero-mode nav during `heroInteractive`/`heroExiting`; use the navigation branch's `pendingTargetRef` Explore-handoff behavior without changing the existing reveal/Explore timeline itself.
- `PostExploreNarrative`: add `data-nav-theme="dark"` to existing root only.

- [ ] Apply the exact navigation branch additions to current `ExperienceShell.tsx` without replacing current file wholesale.
- [ ] Apply the exact hero navigation additions to current `Hero.tsx` without changing current reveal components/timelines.
- [ ] Add only `data-nav-theme="dark"` to current `PostExploreNarrative.tsx` root.
- [ ] Do not modify `MainSite.tsx`.

### Task 4: Verify integration and branch hygiene

**Files:**
- Test: `tests/navigation.test.mjs`
- Inspect: all changed files against pre-integration current head.

- [ ] Run `node --test tests/navigation.test.mjs`. Expected: all navigation tests pass.
- [ ] Run existing focused homepage/ribbon tests if a full checkout is available.
- [ ] Run `npm run typecheck` and `npm run build` if a full checkout is available.
- [ ] Confirm the integration diff contains only navigation files, navigation test, three integration hooks, and Superpowers docs.
- [ ] Confirm `src/components/MainSite/MainSite.tsx` is unchanged.
- [ ] Confirm PR #1 remains open/unmerged and `feature/signature-intro` is the updated branch.