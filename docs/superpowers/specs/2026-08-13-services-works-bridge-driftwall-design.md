# Services Works Bridge / DriftWall Design

## Status and authority

This spec defines the next section of `/services` after the approved Services MenuToGrid experience. It extends, and does not replace, the current Services specs for the opening, centered `SERVICES` handoff, black/white service index, surface-wave inversion, Codrops-style hover, fullscreen service preview, close behavior, accessibility, and reduced motion.

Current implementation baseline when this spec was written:

- branch: `feature/services-opening-grid`
- verified head before this documentation commit: `e5885b268b06d38974e06faa260f27105dcf8fcd`
- relevant implementation: `src/components/ServicesPage/ServicesPage.tsx`, `ServicesPage.module.css`, `servicesModel.ts`, `servicesMotion.ts`
- the current `.futureRunway` is intentional downstream black space reserved for later work; this Works Bridge should replace/absorb that runway rather than creating a second empty gap.

## References

Primary live reference:

https://reactbits.dev/components/drift-wall

React Bits source used as the behavioral reference:

https://github.com/DavidHDev/react-bits/blob/c7109dccb42e06592d1d9bc50bc87204697240e2/src/ts-default/Components/DriftWall/DriftWall.tsx

https://github.com/DavidHDev/react-bits/blob/c7109dccb42e06592d1d9bc50bc87204697240e2/src/ts-default/Components/DriftWall/DriftWall.css

The reference qualities we intentionally retain are its RAF-driven autonomous columns, alternating directions, deterministic speed variance, damped pointer parallax, active-tile lift/emphasis, active-column identification and smooth column-specific stop/resume.

## Objective

The Works Bridge is a teaser, not a portfolio browser.

The page journey is:

**Services explains what Weberaise can do -> the Works Bridge gives a moving visual glimpse of proof -> one `VIEW OUR WORK` action takes the visitor to `/work`.**

The section must not attempt to show every project. It should create enough visual curiosity that the dedicated Work page feels like the natural next action.

## Page transition

The final service row gives way to the same true-black page. There is no divider, color swap, hard section boundary, WebGL transition, or additional spectacle.

A controlled black breathing space follows the service index so the already-complex Services interaction can resolve. The Works Bridge then appears naturally in normal document flow.

Nothing in the Works Bridge is sticky or pinned to the viewport. Page scrolling moves the entire section normally. DriftWall's internal image motion is independent of page scroll and continues while the visitor is stationary.

## Main composition

On suitable desktop widths the composition is an asymmetric split.

Left statement, exact approved copy and line structure:

```text
WE COULD KEEP
TELLING YOU.

OR WE COULD
SHOW YOU.
```

Right: a Weberaise adaptation of React Bits DriftWall.

Target desktop allocation is approximately 35-40% for the statement and 55-60% for the wall, with real negative space between them rather than a rigid 50/50 marketing grid. The black page itself is the container; the DriftWall must not have a visible card/container border.

The statement is large editorial display type but must remain subordinate to the giant `SERVICES` masthead. Do not invent another complex text-reveal sequence; the autonomous wall is the energy source in this section.

## Overall vertical scale

Desktop art-direction target: approximately 120-140svh total for the bridge, treated as a composition target rather than a hard fixed height.

A useful starting rhythm is:

- approximately 15-25svh quiet transition after the Services list;
- approximately 80-95svh for the main statement/wall composition;
- approximately 20-30svh for lower wall dissolve, centered CTA and exit breathing room.

Mobile may become taller because the statement and wall can stack. Do not force the desktop `svh` target on small screens.

## DriftWall adaptation

### Three columns

Locked: exactly **3 columns**, replacing the reference default of five. This is a native configuration concept in the React Bits source and should not require a structural hack.

Three columns make the work substantially larger and stop the teaser from becoming a dense thumbnail field.

### Tile shape

Locked: consistent approximately **4:3 landscape** tiles. Do not use mixed masonry ratios.

Exact dimensions are responsive. A useful desktop starting region is roughly 220-280px wide by 165-210px tall depending on the available right-stage width.

Use small-to-moderate rounding, less soft than the stock 14px React Bits radius. Tiles should read as project imagery, not consumer-app cards.

### Imagery

Use actual Weberaise/client project imagery first. Temporary development placeholders are allowed where final assets are not ready, but they must be explicitly identifiable in the asset/code pipeline and replaced before production launch.

Do not fabricate client names, awards, case-study claims, conversion metrics or testimonials.

A small curated set, roughly 6-9 strong images, is enough because DriftWall loops items. Prioritize image quality over count.

Production teaser assets should be deliberately cropped to 4:3, preferably AVIF/WebP, with enough resolution for sharp lifted tiles (roughly 960x720 or 1200x900 source assets are a sensible target).

## Motion model

Preserve the React Bits RAF/ref architecture instead of replacing it with three CSS marquees.

The reference stores per-column offsets and velocities outside React render state and applies `translate3d` transforms directly. This is appropriate for smooth independent columns and damped hover deceleration.

With three columns the intended direction pattern is outer columns one way, center the opposite way. Keep deterministic speed variation so motion is not mechanically synchronized.

The React Bits defaults (`speed` around 42 and `variance` around 0.45) are starting references, not mandatory Weberaise constants. Final speed must feel calm and perpetual rather than like a fast content conveyor.

Preserve subtle perspective/depth and damped pointer parallax. Reference starting values such as tilt 16, turn -14, perspective 1200, depth 120 and parallax 0.6 can be used as initial values and tuned if three larger tiles make the effect too theatrical.

## Hover behavior

This is locked and should remain close to DriftWall.

At rest, images remain in color but are mildly subdued. Do not use full grayscale and do not darken work until it becomes background texture.

On pointer hover over a tile:

- that tile becomes fully vivid / higher contrast;
- its resting overlay/dim treatment clears;
- it lifts subtly in Z depth;
- a restrained depth shadow is acceptable;
- no project title, button or CTA appears;
- the **entire column containing that tile smoothly decelerates toward zero velocity**;
- the other two columns continue moving.

On pointer leave:

- the tile settles back into the subdued field;
- its column smoothly accelerates back toward its original signed base velocity;
- no position jump, loop restart or snap is allowed.

The reference's `hoveredColRef`/per-column target-velocity behavior is the model. Keep the equivalent of `pauseOnHover = false`; never pause the whole wall merely because one tile is hovered.

## Purely visual tiles

Project tiles do not navigate and are not controls.

The stock React Bits demo supports `href` and renders non-link tiles with `tabIndex=0`/`role="button"`. That must be removed for Weberaise because our tiles intentionally perform no action.

Therefore:

- no tile `href`;
- no tile click action;
- no `role="button"`;
- no `tabIndex=0` on the repeating visual tiles;
- no pointer cursor suggesting clickability;
- no per-tile keyboard focus through an infinite loop.

The wall may be treated as decorative visual proof (`aria-hidden` with empty image alt text where appropriate). The meaningful accessible content is the statement and the real `/work` CTA.

## Resting image treatment

Approved direction: **slightly subdued at rest -> vivid on hover**.

The stock React Bits treatment is stronger than desired (default dim around 0.55 plus overlay/reduced saturation). Weberaise should begin gentler, with roughly 70-85% apparent resting emphasis and only mild saturation reduction. Exact opacity/overlay values are tunable through browser QA.

The image must remain recognizable as real work before hover.

## Top and bottom dissolve

This is a critical Weberaise-specific adaptation.

The DriftWall must never visibly begin or end as a rectangular component. Images should appear to emerge from black near the top and disappear back into black near the bottom while motion continues beneath the mask.

Target fade region is roughly the outer 15-22% of wall height on both top and bottom. The transition must reach complete transparency before the actual component edge.

Prefer one deliberate symmetric vertical `mask-image` (`transparent -> opaque -> opaque -> transparent`) rather than relying on the stock general radial/composite vignette. Add a horizontal vignette only if browser QA proves necessary.

If mask behavior is unreliable in a browser, black gradient pseudo-elements at the top/bottom are an acceptable fallback. The visual result is more important than one specific CSS technique.

## CTA

After the main wall has enough lower space to dissolve into black, place one centered action:

`VIEW OUR WORK`

Destination: `/work`.

This is the only navigation action in the bridge.

It must reuse the established Weberaise gooey/morphing navigation-button language rather than introducing a new CTA animation. The floating navigation currently lives on another feature branch, so implementation must inspect the final shared nav primitive and reuse/extract it where possible instead of maintaining two visually similar but separate animations.

The CTA remains a real accessible link (preferably Next.js `Link`) with a visible keyboard-focus state.

## Responsive behavior

Desktop (~1440x900) is the primary art-directed baseline: left statement, right 3-column wall, full but restrained perspective/parallax, long top/bottom fades, CTA centered below.

On smaller desktop/laptop, reduce tile width, gap, statement size and perspective strength as needed while preserving readable website imagery.

When the split becomes too cramped (tablet/small widths), the statement may stack above the wall. The wall still remains three columns.

Mobile order:

1. statement;
2. breathing space;
3. full-width 3-column DriftWall with smaller 4:3 tiles;
4. long top/bottom dissolve;
5. centered `VIEW OUR WORK` CTA.

Touch does not simulate hover. Autonomous movement continues and the CTA remains the only action. No horizontal page overflow is acceptable.

## Reduced motion

Respect `prefers-reduced-motion: reduce` by stopping continuous column movement and pointer-driven plane motion while retaining a deliberate static three-column composition. Keep the imagery and CTA fully available. The section should look intentionally static, not broken.

## Performance

- Use transform-only per-frame updates (`translate3d`/3D transforms).
- Do not update React state on each animation frame.
- Keep per-column offsets/velocities in refs/local animation structures.
- Use optimized local image assets and avoid repeated layout shift.
- Consider an IntersectionObserver/offscreen guard so continuous transform work pauses when the bridge is far outside the viewport and resumes without resetting its visual state.
- No WebGL is needed or allowed for this section.

## Component boundaries and integration

`ServicesPage.tsx` already owns the intro, GSAP hover/title choreography, surface wave, Flip takeover, focus management and service-close lifecycle. Do not paste DriftWall into that file.

Preferred structure:

```text
ServicesPage
├── existing Services intro/menu system
└── WorksBridge
    ├── statement
    ├── DriftWall
    └── VIEW OUR WORK CTA
```

Suggested separation (exact paths may follow repo conventions):

```text
src/components/ServicesPage/WorksBridge.tsx
src/components/ServicesPage/WorksBridge.module.css
src/components/ui/DriftWall/DriftWall.tsx
src/components/ui/DriftWall/DriftWall.module.css
```

Keep DriftWall's autonomous motion values inside the DriftWall component, not `servicesMotion.ts`, because the service menu choreography and perpetual wall are independent motion systems.

Replace/absorb the current `.futureRunway` with `<WorksBridge />`. Do not disturb service row refs, cover stacking, service preview layer, same-node SERVICES handoff, or service block reparenting.

## Explicit non-goals

Do not build:

- project cards with permanent names/tags;
- a case-study carousel;
- horizontal dragging;
- a masonry portfolio grid;
- sticky/pinned scroll storytelling;
- a scroll-driven wall;
- project modals;
- per-image navigation;
- a full portfolio dump;
- blue/purple glow-heavy SaaS styling;
- another fullscreen takeover;
- WebGL;
- fake proof.

## Locked vs tunable

Locked:

- seamless black continuation;
- exact statement copy;
- left statement/right wall on suitable desktop widths;
- React Bits DriftWall as the behavioral base;
- 3 columns;
- autonomous motion independent of page scrolling;
- no sticky/pinning;
- consistent ~4:3 tiles;
- slight resting dim / vivid hover;
- hovered tile lifts/highlights;
- hovered tile's column stops smoothly while other columns continue;
- smooth resume on leave;
- long top/bottom dissolve into black;
- tiles purely visual and non-clickable;
- real work plus development placeholders only;
- `VIEW OUR WORK` is the only navigation action;
- centered gooey CTA below the wall;
- desktop section target roughly 120-140svh.

Tunable during implementation/browser QA:

- exact tile pixels/gap/radius;
- exact speed/variance;
- exact perspective/parallax/depth;
- resting overlay amount;
- exact fade percentages within the approved gentle range;
- exact desktop split and responsive breakpoint;
- exact breathing-space/CTA spacing;
- nonvisual performance implementation details.

If a compromise is necessary, preserve in order: visual hierarchy, autonomous DriftWall character, smooth hovered-column stop/resume, readable project imagery, gentle boundary dissolve, performance, then exact numeric parity with React Bits.

## Browser acceptance

Compare the live React Bits reference and local `/services` at approximately 1440x900.

Verify:

- no hard boundary after Services;
- enough black breathing room;
- balanced statement/wall composition;
- exactly three columns;
- recognizable ~4:3 website tiles;
- wall continues moving when page scrolling stops;
- neighboring columns move in alternating directions;
- top/bottom reach complete transparency without a rectangular cutoff;
- resting images remain colored/readable;
- hovered image becomes clearly vivid and lifts subtly;
- hovered column slows smoothly to a complete stop;
- other two columns continue;
- the stopped column resumes smoothly after leave;
- project tiles do not look clickable;
- CTA is centered below the dissolved wall and is the only `/work` action.

Also test ~1280x800, ~768x1024 and ~390x844, reduced motion, touch/coarse pointer, and at least 20-30 seconds of continuous looping to catch track jumps/gaps/repetition artifacts.

## Implementation order after approval

1. Re-check the latest Services branch and the React Bits live/source reference.
2. Replace the future runway with a structural Works Bridge shell.
3. Port/adapt DriftWall into an isolated component while preserving the RAF velocity architecture.
4. Configure 3 columns and 4:3 data-driven work imagery/placeholders.
5. Remove reference link/button/focus semantics from tiles.
6. Implement subdued rest + vivid/lifted hover.
7. Verify one-column stop/resume before further styling.
8. Implement the long symmetric top/bottom dissolve and fallback.
9. Tune 1440x900 layout, speed and perspective.
10. Reuse/integrate the gooey navigation-button behavior for `VIEW OUR WORK`.
11. Add reduced-motion/offscreen performance handling.
12. Tune responsive layouts while retaining the three-column concept.
13. Run automated behavior contracts and full browser QA.
14. Only then call the Works Bridge complete.
