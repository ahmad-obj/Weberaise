# Services Menu-to-Grid Fidelity Design

## Status and authority

This spec supersedes the interaction decisions in `2026-08-13-services-opening-grid-design.md` where they conflict with the August 13 handoff. The handoff locks the closest Codrops-style takeover (Approach A), a real hover title-font switch, an eight-piece 4×2 preview grid, and no side description/editorial dashboard. Those choices are treated as approved.

The implementation remains isolated to `/services`. Homepage hero, loader, ribbon journey, post-Explore artwork, homepage WebGL, and floating navigation are outside scope.

## Reference baseline

The behavioral reference is the live Codrops MenuToGrid demo and repository commit `f94d1dadf23b7991a2f2d4921628b00ead223584`.

The required reference source was read completely:

- `src/js/index.js`
- `src/js/row.js`
- `src/js/previewItem.js`
- `src/js/utils.js`
- `src/css/base.css`
- `src/index.html`
- `package.json`
- `README.md`

The reusable choreography is:

- rows use fixed small preview-piece sizing, wide left titles, right-aligned preview pieces, and restrained borders;
- hover pieces enter from `scale: 0.8`, `xPercent: 20`, `opacity: 0` over `0.4s` with `power3` and `stagger: -0.035`;
- hover titles exit upward over `0.1s`, switch font while clipped, then enter from `yPercent: 100` and `rotation: 15` over `0.5s` with `expo`;
- the clicked row receives the current-row stacking level above a fixed cover that starts at the row's viewport `top` and `height`;
- the cover reaches `top: 0` and `window.innerHeight` over `0.9s` with `power4.inOut`;
- titles above the clicked row leave at `yPercent: -100`, and titles below it leave at `yPercent: 100`;
- the visible row pieces are captured with `Flip.getState`, physically prepended into the preview grid, and animated with `Flip.from` over `0.9s` with `power4.inOut` and `0.04` stagger;
- supplemental grid pieces enter from `scale: 0`, randomized positive vertical offset, and zero opacity;
- the preview title and close control enter concurrently with the takeover;
- close shrinks all preview pieces, returns the transferred pieces to their origin container, collapses the cover toward the selected row center, and returns titles with a stagger originating at the selected index.

## Current implementation findings

Matched 1440×900 Chromium captures revealed these concrete gaps:

1. The same `SERVICES` node is reparented, but its destination sits in an index stacking context below the still-opaque intro. The word therefore disappears during the supposed signature travel.
2. Inter Tight and Geist are too similar at the current size/weight, so the title switch is barely perceptible.
3. The fullscreen blocks are uniform rounded bordered squares with centered labels, producing a dashboard-card impression instead of image-like grid pieces.
4. The resting and hover row geometry is close to Codrops, but the title/preview contrast and subtle index treatment need refinement.
5. Existing source-string tests preserve useful contracts but do not exercise service counts, eight-piece composition, motion constants, or directional title logic as imported code.

## Component architecture

`ServicesPage.tsx` owns DOM refs, GSAP timelines, focus, and open/close lifecycle. It renders one stable index, one cover, and one preview article per service. The three row preview pieces remain the same DOM elements when moved into and out of the active preview grid.

`servicesMotion.ts` owns immutable motion values and pure helpers. It exports Codrops-derived hover/open/close constants and a `getTitleExitY(targetTop, selectedTop)` helper. Tests import this module directly so timing drift and directional logic fail behaviorally rather than through source regex alone.

`servicesModel.ts` owns five service records. Each record has exactly three `primary` items and five `secondary` items, yielding eight meaningful preview pieces without special-casing the number of services.

`ServicesPage.module.css` owns all geometry, stacking, responsive behavior, tile motifs, and reduced-motion presentation. No new UI framework or runtime dependency is introduced.

`src/app/layout.tsx` adds `Geist_Mono` as an unused-by-default CSS variable for the Services hover/preview technical voice. Existing body and hero font assignments remain unchanged.

## Opening and `SERVICES` handoff

The intro fills the first viewport and renders the three exact visual lines. Line inners enter from below through fixed overflow clips over about `0.92s` with a tight stagger, then hold for `1.8s`.

After the hold, `SO, WHAT` exits left and `DO WE PROVIDE?` exits right over `0.72s`. `SERVICES` remains centered for a `0.18s` beat.

The handoff then performs these ordered operations in one frame:

1. capture the giant word with `Flip.getState`;
2. mark the page `data-handoff-active="true"`, which lifts the index stage above the intro stacking context;
3. physically append the same word node into the permanent label slot;
4. apply its compact blue docked typography;
5. call `Flip.from` for a `0.96s` geometry-safe move;
6. reveal row titles beginning shortly after the word starts moving, so the final row and label settle together;
7. fade/remove only the intro backdrop near the end;
8. remove the temporary handoff stacking state and enable row interaction.

There is no second visible `SERVICES` node, crossfade, or opacity substitution. In reduced motion, the same node is still reparented, but large travel and the reading hold are skipped.

## Resting service index

The five data-driven rows retain Codrops proportions: thin horizontal borders, generous vertical padding, restrained 27–43px display titles, and a right-aligned three-piece preview region. A small service index sits within the title area without pushing the title away from the Codrops-like left alignment.

Primary pieces have layout geometry at rest but are visually absent. They do not read as permanent cards. Each full row is covered by a semantic button with `aria-expanded`, `aria-controls`, and a visible Weberaise-blue focus treatment.

The long commerce title remains one line where desktop width allows and wraps only at narrower breakpoints. The title remains the dominant object; the service number never becomes a hero-scale element.

## Hover and focus choreography

Fine-pointer hover and keyboard focus run the Codrops sequence. The three primary pieces reveal with the reference scale, offset, easing, duration, and negative stagger. They exit with `power4`, opacity zero, and `scale: 0.8`.

The title is one text node. It exits upward, receives a `data-switched` typography state while clipped, then enters from below with the reference rotation and expo settle. The normal voice is Inter Tight. The alternate voice is Geist Mono, providing a clearly different premium technical personality without a decorative novelty face.

Pointer leave and blur reverse the same mechanism. Reduced-motion focus may establish the alternate/revealed state immediately. Coarse pointers do not need to simulate hover; click remains fully functional.

## Open choreography and stacking

Activation is ignored while an animation is running or another service is open. Before writes, the component records the row, button, title, primary pieces, origin container, preview grid, selected index, row rectangle, and focus origin.

The selected row receives `data-current="true"` at z-index 11. The cover is z-index 10 within the content stacking context, so the row remains visibly above the surface that grows from it. The preview layer sits above both at z-index 200.

At takeover start, the cover is fixed to the selected row's viewport top and row height minus its border, then expands to the viewport. All menu titles exit according to their position relative to the selected row.

The primary pieces are forced into their completed hover state, captured with `Flip.getState`, physically prepended into the active preview grid, and animated with `Flip.from`. Five secondary pieces enter around them with the Codrops scale-zero/random-y sequence. The selected service title enters through a clip and the close control becomes available. The index becomes hidden from assistive technology only after the preview state is established.

## Expanded preview

Desktop preview geometry is a centered 4×2 grid of eight equally sized pieces with the selected title above it and a minimal close control in the top-right. The title is significant but not hero-sized. There is no lead paragraph, side column, accordion, or dashboard header.

The pieces keep Codrops' square rhythm but lose the conventional card treatment: near-square flat surfaces, minimal or no rounding, controlled surface variation, micro indices, clipped rules, and restrained CSS technical motifs create visual identity without fake metrics or imagery. Labels remain concise and meaningful.

Each active preview article contains its own close button so dialog semantics and focus agree. Inactive preview articles and controls remain hidden from assistive technology and the tab order.

## Close choreography

Close and Escape share one guarded close path:

1. shrink/fade all eight grid pieces with `0.04` stagger;
2. return the three primary nodes to their original row container as the shrink completes;
3. move the preview title down and fade the close control;
4. collapse the cover from fullscreen toward the selected row center beginning at `0.4s`;
5. return row titles with `0.03` stagger originating at the selected index;
6. clear active/current/hover states and inline transforms;
7. restore index accessibility, scroll state, and row tab stops;
8. restore focus to the originating row button.

Repeated open/close cycles must not accumulate stale Flip transforms, moved nodes, body overflow, or hidden focus targets. Unmount cleanup kills all timelines/tweens and restores any transferred nodes.

## Responsive behavior

Desktop at approximately 1440×900 is the art-directed baseline.

Laptop and tablet retain horizontal rows and 4×2 preview geometry while reducing type, gaps, and piece size. At widths below 900px, row spacing tightens without turning the index into cards.

At widths below 640px, long titles may wrap, primary origin pieces become compact/visually hidden at the row's right edge, and the expanded preview becomes 2×4. Mobile piece size is constrained by both viewport width and `svh` so 2×4 fits short screens without horizontal overflow. Close remains obvious and reachable.

Reduced motion keeps all content, DOM relocation, state, and focus behavior but uses near-instant geometry changes and short opacity settles.

## Accessibility and performance

- The route retains one semantic full-sentence `h1`; visual intro copy is decorative.
- Row buttons expose `aria-expanded` and `aria-controls`.
- Active detail uses a labelled dialog article containing its close button.
- Escape closes; focus enters close and returns to the origin.
- Hidden menu buttons are removed from tab order while a preview is open.
- Transform and opacity are the primary animated properties.
- Geometry is read once per transition before layout writes.
- All GSAP timelines and Flip animations are killed on cleanup.
- Resize after a completed close uses fresh geometry on the next open.

## Verification contract

Automated checks cover the five-service model, three-plus-five block composition, Codrops-derived motion constants, title exit direction, same-node intro reparenting, actual block reparenting, accessibility attributes, responsive CSS, and reduced-motion CSS.

Visual acceptance requires matched Chromium inspection of the Codrops and Weberaise states at 1440×900, plus Weberaise laptop, tablet, and 390×844 mobile captures. Every row is hovered; first, middle, and last services are opened; close button, Escape, focus return, repeated cycles, post-close resize, coarse pointer, and reduced motion are exercised before completion.
