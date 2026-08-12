# Weberaise Floating Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build WebeRaise's fixed, barless floating navigation with independent adaptive pills, an improved 21st-style center hover cursor, a React Bits Gooey Nav-inspired `LET'S TALK` hover, hero WebGL inversion compatibility, and an architecture that keeps `SERVICES` independently detachable for the later footer choreography.

**Architecture:** Render the same navigation language in two lifecycle contexts: a hero instance inside `Hero` below the existing WebGL reveal compositor, and a main-site instance inside `main-stage`. Keep the three center links as independent pill elements while a single measured inverse hover plate moves between them. Use only the existing React + GSAP stack; use CSS blur/contrast and deterministic particles for the CTA goo effect. Main-site contrast is section-theme driven; hero contrast is produced by the existing per-pixel WebGL difference compositor.

**Tech Stack:** Next.js 16.3, React 19.2, TypeScript 7, GSAP 3.15, CSS Modules, existing WebGL2 reveal compositor, Node built-in test runner.

## Global Constraints

- Navigation order is exactly: `LOGO | SERVICES | WORK | ABOUT | LET'S TALK`.
- Layout is three zones: logo left, `SERVICES / WORK / ABOUT` centered, `LET'S TALK` right.
- There is no enclosing visible navbar/background bar.
- Every visible control is an independent rounded-rectangle pill; center buttons are not visually conjoined.
- Geometry is an elongated rounded rectangle, not a fully circular capsule.
- Typography is bold, minimal, modern, and uses the existing Weberaise font system.
- Light background: black pill with white text.
- Dark background: white pill with black text.
- Hero contrast must respond to the actual viscous WebGL reveal at pixel level, including partial coverage across a pill.
- Hero navigation must sit below the existing reveal canvas so the current `mix-blend-mode: difference` compositor performs the inversion.
- Center hover is inspired by the 21st.dev Abdul Ali Nav Header, but improved for separate filled pills rather than a shared navbar container.
- `LET'S TALK` hover is inspired by React Bits Gooey Nav: monochrome goo/particle motion triggered on hover/focus rather than click.
- No magnetic attraction.
- No new animation dependency; use the existing `gsap@3.15.0`.
- `SERVICES` must remain a standalone, independently measurable DOM item with no ancestor transform/clip dependency that would obstruct the future footer detachment.
- Do not implement the footer-triggered Services detachment in this scope.
- Do not modify loader choreography, hero typography, reveal physics, EXPLORE fill behavior, ribbon journey behavior, or downstream content art direction.
- Reduced motion must preserve navigation usability while removing nonessential particle/travel motion.
- Coarse-pointer/touch devices must not depend on hover to reveal functionality.

## Implementation Tasks

1. Define `navigationModel.ts`, `SiteNavigation.tsx`, `Navigation.module.css`, and `tests/navigation.test.mjs` for the three-zone barless shell.
2. Integrate hero navigation before `HeroRevealCanvas`, visible in `heroInteractive` and `heroExiting`, with a short entrance and hero base colors black/white.
3. Implement `CenterNavCluster.tsx` + `centerHoverMotion.ts`: one measured inverse hover plate moving/resizing across three separate pills, keyboard-equivalent behavior, `ResizeObserver`, no clipping, and live geometry.
4. Implement `GooeyTalkButton.tsx` + deterministic `gooeyParticles.ts`: monochrome hover/focus goo burst, blur/contrast merge, reduced-motion and coarse-pointer fallbacks.
5. Implement `useNavigationTheme.ts`, mount the main nav inside `main-stage`, and mark main sections with explicit `data-nav-theme` values.
6. Keep hero-to-main geometry identical so the EXPLORE handoff is visually continuous and main mode does not replay the entrance animation.
7. Add responsive, touch, keyboard, and reduced-motion behavior; mobile keeps logo/CTA top row and center trio on a second centered row.
8. Add a stable `data-nav-detach-anchor` to Services and preserve a transform/clip-free slot for the future footer drift without implementing detachment now.
9. Run full tests/typecheck/build and visual QA across hero inversion, center hover, goo CTA, handoff, responsiveness, and detachment readiness.

## Final Interaction Specification

Rest state:

```text
(LOGO)                  (SERVICES)  (WORK)  (ABOUT)                  (LET'S TALK)
```

Center hover uses a ~3px inset inverse inner plate that glides and resizes between Services, Work, and About while the outer pills remain independent. `LET'S TALK` blooms an inverse surface with about ten same-color blobs that briefly separate around its perimeter and merge back through blur/contrast. In the hero, the entire navigation sits below the existing difference compositor so the WebGL liquid can partially invert pills at the exact reveal boundary. In main content, section-provided `data-nav-theme` values switch dark sections to white-pill/black-text and light sections to black-pill/white-text. Services exposes a stable detach anchor for a future footer animation but remains in place in this milestone.
