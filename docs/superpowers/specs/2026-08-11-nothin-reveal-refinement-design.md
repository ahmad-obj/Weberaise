# Nothin-inspired Hero Reveal Refinement Design

## Status
Approved by user on 2026-08-11.

## Goal
Refine the existing Weberaise intro so the loader is centered, the white hero gains extremely subtle edge depth, the hero composition sits slightly higher, and the pointer reveal behaves like a dense coherent liquid/blob mask rather than smoke/fog.

## Public reference findings
The Nothin site itself credits Pierre Patrault / Thomas Carré / Guillaume Perrette. Public posts by developer Thomas Carré describe the production site as built with Webflow, GSAP, WebGL and custom shaders. Independent stack detection identifies Three.js and Lenis as well. These findings confirm that the reference effect is shader-driven rather than a CSS blur/fade trick.

We will reproduce the observable qualities, not copy proprietary deployed source code verbatim.

## Locked visual changes

### Loader
- Every countdown integer remains centered in the viewport.
- Preserve truthful 100→0 progress behavior and no skipped integers.
- Previous/current integer overlap may still be used for seamless handoff, but both occupy the same center point.

### White hero depth
- Add a radial vignette overlay above the reveal compositor.
- Center remains visually pure white.
- Only the extreme perimeter receives a very faint black influence (~2–3% maximum visual strength).
- The vignette must not become a visible border or gray frame.

### Hero vertical composition
- Move the shared `WELCOME / TO + hidden WEBERAISE` composition upward as one registered unit.
- Desktop target: roughly 2.5–3vh upward, clamped to a restrained pixel range.
- Mobile target: smaller upward shift.
- Explore remains anchored near the bottom.

## Reveal behavior
Target character:
- dense, thick liquid/blob mask;
- coherent rounded contour;
- crisp but antialiased edge;
- very little high-frequency edge noise;
- no visible smoky/foggy low-alpha tail;
- minimal advection/drift;
- subtle organic contour motion only;
- old trail dissolves by contour erosion/contraction, not vapor-like diffusion;
- last point of a stroke terminates as a proper rounded blob;
- overlapping trail portions merge naturally;
- perceptual lifetime remains about 3–4 seconds.

## Technical direction
Keep the existing low-resolution persistent history architecture, but retune it away from fluid-smoke behavior:
- replace high-frequency temporal hash noise with low-frequency contour warp;
- narrow the composite threshold band to make the boundary substantially more defined;
- increase mask persistence enough to preserve the 3–4s lifetime despite the higher threshold;
- reduce advection and settling amplitude significantly;
- keep spatially graded splats so threshold decay causes the visible contour to contract inward;
- modestly increase the full-quality history field resolution for cleaner contours while preserving adaptive fallback profiles.

## Acceptance criteria
1. Loader numbers are always centered.
2. White hero has only barely-visible edge depth.
3. Front and reveal typography/logo remain pixel-registered after the upward shift.
4. A stationary/old trail does not become smoky, grainy, or mist-like.
5. Trail disappearance reads as a clean shrinking/eroding mask.
6. Stroke endpoint remains a rounded blob until it erodes away.
7. Reveal remains smooth and organic rather than geometrically hard.
8. Existing autonomous intro stroke and Explore flow continue to use the same engine family.
