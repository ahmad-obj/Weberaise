# Services Surface Wave Design

## Status

Approved by the user on 2026-08-13. This refinement extends the centered black/white Services revision; it does not replace its layout, typography, content, or Codrops-derived takeover system.

## Objective

Replace the row's ordinary black-to-white color interpolation with a physical surface transition that feels authored for the surrounding menu-to-grid choreography.

The interaction must avoid:

- background-color crossfades
- opacity fades as the primary inversion mechanism
- zoom-based inversion
- WebGL, particle, glow, or generic liquid effects
- a playful blob language that conflicts with Weberaise's disciplined geometry

## Approved Direction: Right-Originating Surface Wave

Each service row contains one decorative SVG surface beneath its content. The surface is a white rectangular field whose leading left edge is drawn as a restrained vertical Bézier wave.

At rest the surface sits completely beyond the row's right edge. On hover or keyboard focus, it translates from right to left until the row is fully white. This makes the preview region feel like the source of the inversion and visually anticipates the selected row becoming the fullscreen white cover.

On exit the surface returns to the right, revealing the black row from left to right. The movement is geometric and continuous; opacity remains at one throughout.

## Visual Construction

- Render an inline, non-focusable, `aria-hidden` SVG inside every data-driven row.
- Use a `viewBox` and a single white path with cubic Bézier segments along its leading edge.
- Position the SVG slightly wider than the row and offset its final left edge beyond the viewport so the settled active row is completely white.
- Animate only `transform: translate3d(...)` with `will-change: transform`.
- Keep the row clipped and isolated so the moving surface never leaks across its borders.
- Place number/title above the surface and use a white `mix-blend-mode: difference` text layer. The glyphs therefore remain white on untouched black and become black only where white has physically passed beneath them, without a gray crossover.
- Keep preview pieces as opaque black geometry with white internal type. They do not use blend mode.

## Motion Synchronization

- Surface travel: approximately 0.62–0.7 seconds, premium `power4`-like cubic easing.
- The surface begins immediately.
- Preview-piece entrance begins about 0.16 seconds after the surface; its negative stagger makes the earliest piece begin around 0.09 seconds, when the advancing white field has reached the preview region.
- The clipped title exit/switch/entrance begins only after the `.66s` surface travel is complete, followed by a restrained `.06s` white-field hold. This gives the eye one event at a time: surface takeover first, typography second.
- Preserve the Codrops-derived preview values: start scale about `.8`, `xPercent` about `20`, duration about `.4`, `power3`, and negative stagger around `-.035`.
- On exit, title and pieces reverse immediately while the surface withdraws. Because the black field returns from the title side first and the preview side last, the disappearing black pieces retain contrast throughout most of their exit.
- Rapid hover/focus changes must reverse the same surface without snapping or resetting its geometry.

## Interaction State

Pointer and keyboard focus independently own a row's active state. The wave enters when the combined state changes from inactive to active, and exits only after both pointer and focus are inactive.

Touch/coarse-pointer activation does not simulate hover. Clicking a resting row establishes its white surface before the existing cover expansion is measured and launched.

The selected row remains fully white above the fullscreen cover. During close, its wave withdraws only as the cover collapses back into the row.

## Accessibility and Reduced Motion

- The SVG surface is decorative, `aria-hidden`, and cannot receive focus.
- Existing semantic buttons, focus-visible outline, `aria-expanded`, dialog labeling, Escape close, and focus restoration remain unchanged.
- Reduced motion establishes the final white or black surface immediately while preserving all state and content changes.
- Intro scrolling remains locked until the same-node `SERVICES` handoff becomes interactive, then the original body overflow value is restored.

## Responsive Behavior

The SVG scales with row height and width, so the same wave geometry works across desktop, tablet, and mobile wrapping. Mobile still omits resting preview pieces and opens on tap. No additional horizontal width may contribute to layout or document overflow.

## Acceptance Criteria

- No CSS `background-color` or text-color interpolation performs the inversion.
- Early, middle, and settled hover frames clearly show a traveling white surface with a curved leading edge.
- Number/title change contrast at the spatial wave boundary instead of passing through gray.
- Preview pieces remain readable throughout entrance and exit.
- The selected white row and fullscreen white cover read as the same surface system.
- Pointer-plus-focus ownership cannot produce a white row with reverted internal choreography.
- Desktop every-row hover, keyboard focus, rapid enter/leave, first/middle/last open, close, mobile tap, reduced motion, and repeated cycles remain correct.
