# Navigation Performance Optimization

## Goal
Recover the smooth scroll/frame behavior that existed before navigation was added, without reducing any visible quality or changing navigation behavior.

## Evidence / root cause
The current main-state theme sampler runs on scroll through `requestAnimationFrame`, and for every frame it performs three DOM queries, three layout reads, and three full `document.elementsFromPoint()` stack walks. That work competes with the ribbon/WebGL pipeline even when no navbar pill is hovered.

The flood CSS also leaves `will-change` on the moving surface plus both content layers for all five pills. Those content-layer hints are unnecessary while idle and can increase compositor-layer pressure.

## Required behavior after optimization
- Keep independent logo / center / talk theme switching.
- Keep exact black/white adaptive conversion through `--nav-pill-bg` and `--nav-pill-fg`.
- Keep the five-pill flood effect, geometry, overscan, easing, enter/leave timing and clipping unchanged.
- Keep the moving flood surface compositor-accelerated.
- Keep hero, loader, ribbon, artwork and WebGL quality untouched.

## Optimization design
1. Cache the three navbar probe centers only during layout refreshes.
2. Cache all non-navbar `[data-nav-theme]` rectangles in document coordinates only during layout refreshes.
3. On scroll, use only `window.scrollX/Y` plus numeric rectangle comparisons; no DOM queries, hit tests or layout reads.
4. Refresh cached geometry on mount, resize, relevant ResizeObserver changes, theme-related mutations, font readiness and window load.
5. Track current themes in a ref and call React `setThemes` only when at least one zone actually changes.
6. Remove permanent `will-change` from the base/reveal text/mark layers; retain `will-change: transform` on `.pillFloodSurface` only.

## Verification
- New performance regression test must fail on the old implementation and pass on the new implementation.
- Existing navigation and unified-flood tests must remain compatible.
- No homepage/ribbon/artwork/hero production files may change.
- PR #1 remains open and unmerged.
