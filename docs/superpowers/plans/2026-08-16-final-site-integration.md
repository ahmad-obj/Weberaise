# Final Site Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Compose the accepted Homepage, Services, Work, About, and navigation implementations into one authoritative Weberaise integration branch without regressing any page-specific behavior.

**Architecture:** `feature/signature-intro` is the base and owns all existing shared Homepage/navigation systems. Services+About are transplanted from `feature/about-page`; Work is transplanted from `feature/work-spherical-showcase`. Cross-route behavior is then integrated surgically through the current navigation and route files only.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, GSAP 3.15.0, Framer Motion 12.43.0, custom WebGL/WebGL2.

## Global Constraints
- Do not merge donor branches wholesale.
- Do not modify `main` until the integration branch is verified.
- Preserve current Homepage loader/hero/reveal/ribbon/footer behavior.
- Preserve current Work 42-slot sphere, no per-tile wiggle, project open/return, and WebGL fallback behavior.
- Preserve Services opening/Menu-to-Grid/Works Bridge/Silk/Capabilities/Contact behavior.
- Preserve About three-section structure and two founder portrait interactions.
- Preserve `THIRD_PARTY_NOTICES.md`.
- Do not invent production contact data or client projects.
- Minimize GitHub Actions usage.

---

### Task 1: Establish integration branch and provenance
- Create `integration/final-site` from `4d89fa9eb72c6d620277f9d0d2cbfdf6ce1d3572`.
- Record this design and implementation plan.
- Confirm authoritative donor heads have not moved.

### Task 2: Integrate Services and About by ownership
- Transplant `src/app/services/**`, `src/components/ServicesPage/**`, `src/components/ui/DriftWall/**`, `src/components/ui/GooeyLink/**`, `src/components/ui/SilkWavesBackground/**` from `feature/about-page`.
- Transplant `src/app/about/**`, `src/components/AboutPage/**`, and `public/about/founders/**`.
- Transplant Services preview SVGs under `public/work/placeholders/work-preview-*.svg`.
- Transplant only Services/About-specific tests and design/history docs.
- Keep Homepage globals, tokens, navigation, experience, and MainSite code from the base.
- Add `Geist_Mono` / `--font-technical` to the current root layout.

### Task 3: Integrate Work by ownership
- Transplant `src/app/work/**`, `src/components/WorkPage/**`, `src/webgl/workSphere/**`, `src/content/workProjects.ts`, `src/content/workProjectValidation.ts`, `public/work/README.md`, `public/work/placeholders/poster.svg`, Work-specific tests/docs, and `THIRD_PARTY_NOTICES.md`.
- Do not import stale shared Homepage/navigation files from the Work branch.

### Task 4: Add failing integration contracts
Add tests that require:
- center nav routes `/services`, `/work`, `/about`;
- `LET'S TALK` routes to `/services#contact`;
- secondary route pages mount the existing `SiteNavigation` in route mode/layer;
- Services Contact exposes `id="contact"`;
- Services hash handling occurs after the opening interaction handoff;
- fake `example@gmail.com` no longer exists.

### Task 5: Implement global navigation seams
- Keep existing `SiteNavigation` defaults unchanged for Homepage.
- Add route navigation support/layering without changing Hero compositor z-index behavior.
- Mount it on `/services`, `/work`, `/about`.
- Update Work/About nav destinations from stale hashes to routes.
- Update `LET'S TALK` canonical destination to `/services#contact`.
- Add the Contact hash target and post-opening hash handoff on Services.

### Task 6: Remove fake contact email
- Remove the placeholder email channel from the production contact model.
- Keep verified real channels already present in the repository.

### Task 7: Reconcile documentation
- Add `docs/FINAL_INTEGRATION_STATUS.md` with donor SHAs, ownership, routes, verification status, known development fixtures, and production blockers.
- Update root README to describe the four-route integrated site.

### Task 8: Verify before promotion
Run on a checkout of `integration/final-site`:
```bash
npm ci
npm test
npm run typecheck
npm run build
git diff --check
```
Then browser-check at minimum 1920×1080, 1440×900, 1280×800, 768×1024, 390×844, and 360×800; test keyboard, touch/coarse pointer, reduced motion, WebGL failure/fallback, hidden-tab lifecycle, direct route loads, `/services#contact`, and browser Back/Forward.

Do not update `main` until every verification gate passes.
