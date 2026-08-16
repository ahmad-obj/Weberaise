# Final Site Integration Design

## Status
Approved integration design for composing the completed Weberaise feature branches into one authoritative site without wholesale branch merges.

## Goal
Create one coherent codebase with `/`, `/services`, `/work`, and `/about`, preserving the accepted behavior of each independently developed feature while resolving only cross-branch seams.

## Source ownership
- Homepage, loader, hero, reveal, post-Explore narrative, current navigation, and footer Services detachment: `feature/signature-intro` at `4d89fa9eb72c6d620277f9d0d2cbfdf6ce1d3572`.
- Services and About: `feature/about-page` at `c22c699391d98f21e0bcdd7863682225d4bfa1c8`. This branch already contains the final Services work plus About and supersedes `feature/services-opening-grid` as a donor.
- Work: `feature/work-spherical-showcase` at `4f1e82740e5992e6a9fa53dfbf0fa3b89fa35c25`.
- `feature/floating-navigation` is reference-only and must not be merged; the current Homepage branch contains the later navigation implementation.
- `main` is not an implementation baseline.

## Integration method
Use selective snapshot integration onto a branch created from the latest Homepage tip. Donor feature-owned subtrees and files are transplanted by Git blob/tree identity. Shared Homepage-owned files are retained unless an explicit integration change is required.

This avoids allowing historical ancestry to overwrite newer shared code.

## Shared seams
1. Add `Geist_Mono`/`--font-technical` to the current root layout without replacing other root layout behavior.
2. Change center navigation destinations to `/services`, `/work`, and `/about`.
3. Reuse the current `SiteNavigation` on secondary routes rather than inventing a second navigation system.
4. Give route navigation a route-specific stacking layer while preserving Homepage Hero compositor layering.
5. Give `LET'S TALK` a concrete destination at `/services#contact` and make the Services contact section a real hash target.
6. Resolve a Services deep link only after the Services opening has released its scroll lock.
7. Remove the fake `example@gmail.com` contact value rather than inventing production data.

## Runtime ownership
- Homepage Hero owns the reveal WebGL system only while the Hero exists.
- Services owns one lifecycle-controlled Silk WebGL instance.
- Work owns one WorkSphere WebGL engine and stops it while the project DOM view owns the screen.
- About owns one lifecycle-controlled Silk WebGL instance.
- No heavy page-specific WebGL system moves into the root layout.

## Hard non-goals
- No redesign of accepted pages.
- No wholesale merges of donor branches.
- No restoration of stale Homepage/navigation files.
- No new animation library.
- No reduced Work sphere density or quality downgrade.
- No invented client projects, testimonials, outcomes, or contact data.

## Verification gate
The integration branch must not be promoted to `main` until the full test suite, TypeScript check, production build, responsive browser QA, keyboard/touch/reduced-motion checks, WebGL fallback checks, and cross-route navigation checks pass.
