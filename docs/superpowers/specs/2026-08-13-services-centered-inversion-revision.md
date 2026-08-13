# Services Centered Masthead and Inversion Revision

## Status and authority

This revision supersedes the color, `SERVICES` docking geometry, row-number placement, and resting-row styling in `2026-08-13-services-menu-to-grid-fidelity-design.md`. It does not replace the Codrops-derived hover-piece, clipped-title, cover, Flip reparenting, fullscreen-grid, or close choreography already specified there.

The user's revised art direction is approved and implementation may proceed without another design-selection round:

- the Services route uses the homepage's decisive true-black/white identity rather than the blue-black surface palette;
- the same `SERVICES` word remains white and travels from the intro into a horizontally centered masthead;
- the word retains the exact intro font and almost all of its visual scale;
- service numbers sit inline to the left of their titles;
- hover/focus reverses an entire row to white with black typography;
- the smooth existing introduction and Codrops interaction language are preserved;
- exactly the five defined service groups remain; no sixth service is invented;
- an intentionally empty black runway follows the menu for a later section.

Homepage hero, loader, ribbon journey, post-Explore artwork, homepage WebGL, and floating navigation remain outside scope.

## Visual diagnosis

Matched 1440×900 Chromium captures show that the homepage identity comes from strong black/white field changes, while the current Services state uses `#070a0f`, blue borders, a tiny blue top-left label, and bold row titles. The latter feels generic because every element has roughly the same visual tone and no decisive state change.

The revised direction creates identity through restraint and contrast rather than decoration:

1. true black is the permanent canvas;
2. the surviving `SERVICES` word becomes a centered typographic masthead, not a utility label;
3. row typography is lighter, tighter, and more editorial;
4. inline numbers create one readable `03 LANDING PAGES` object;
5. hover/focus reverses the complete horizontal field, echoing the homepage's black/white reveal;
6. Codrops preview pieces and clipped title switching add motion detail inside that strong field change.

## Opening and centered handoff

The intro question remains:

```text
SO, WHAT
SERVICES
DO WE PROVIDE?
```

The current clipped entrance, reading hold, opposing outer-line exit, short `SERVICES`-alone beat, and overlapping row reveal remain unchanged in rhythm unless browser tuning reveals a collision.

The destination changes materially:

- `SERVICES` remains `var(--wr-white)` for the entire flight and resting state;
- it keeps `var(--font-hero)` and the same weight, tracking, casing, and line-height as the intro;
- desktop docking scales it only modestly, targeting roughly 72–85% of its intro size rather than collapsing to a 12px label;
- the destination is horizontally centered;
- its top position reserves approximately 72–96px for the future/menu navigation zone, then gives the word enough air before the first row;
- the row sequence begins revealing while the word is still moving and completes with the word;
- the same DOM node is still captured, reparented, and animated through GSAP Flip;
- no blue color tween, duplicate word, crossfade, or top-left drift remains.

On mobile, the destination remains centered and uses the same font but scales down enough to avoid edge clipping. Reduced motion still reparents the exact node and establishes the final geometry immediately.

## Menu composition

The index is a true-black editorial list with five horizontal rows. The masthead and rows are one continuous section, followed by a separate empty black runway with a responsive minimum height for future work.

Each row contains:

- a full-row semantic button;
- one inline two-digit number;
- one clipped service-title span;
- the same three transferable preview pieces aligned at the right on suitable widths.

The number and title form one left-hand reading unit. Target desktop structure is a compact fixed number column followed by a fluid title region; the right preview pieces retain their own fixed rhythm. Numbers are subtle but readable, around 12–15px in a technical/body face—not micro text above the title.

The normal title uses Inter Tight at a refined medium weight rather than a generic heavy display weight. The target range is approximately 30–46px on desktop, with controlled wrapping for the commerce title. Tracking should be tight but not crushed. The long service title may become two lines at narrower widths without forcing every row taller on wide desktop.

Borders become neutral white at low opacity. Blue is not used for the page field, masthead, row hover, or title color. The page should read primarily black and white, consistent with the homepage.

## Hover and keyboard-focus inversion

Fine-pointer hover and keyboard `:focus-visible` reverse the complete row:

- row background transitions from black to white;
- number and title transition from white to black;
- border relationships remain clean instead of producing a double bright seam;
- transition timing uses the premium ease and takes roughly 0.4–0.5s, fast enough to feel responsive but slow enough to avoid flashing;
- focus-visible receives the same inversion plus a subtle inset outline that remains visible without adding blue.

The Codrops interior motion remains active:

- three preview pieces enter from scale/offset/opacity with negative stagger;
- the title exits upward through its clip;
- the same title re-enters from below in Geist Mono for a noticeably different technical voice;
- on leave/blur, pieces and typography restore cleanly.

The white row must still have legible preview pieces. In the row state, the pieces use black surfaces with white microcopy, so their entrance reads as black objects on the white field instead of blue dashboard cards. On coarse pointers, no simulated hover is required and the origin pieces remain visually absent until click.

## Click takeover and fullscreen palette

The selected row remains the physical transition source. To preserve continuity with the inversion, opening establishes the selected row in its white/black state before takeover. The fullscreen cover begins at that row's exact viewport top and height, remains below the selected row initially, and expands as a white field.

Other titles still exit by comparing their vertical position with the selected row. The three visible black preview pieces are captured, physically moved into the preview grid, and expanded with Flip. Five additional pieces enter around them.

The expanded state uses the same homepage-like black/white polarity:

- white fullscreen cover;
- black selected-service title and close control;
- eight flat black grid pieces with white labels and restrained neutral rules;
- no blue card borders, glow, rounded SaaS-card treatment, lead paragraph, or side panel.

The close sequence follows the existing Codrops-derived order. The white cover collapses back to the selected row, the row returns to black, and focus is restored.

## Responsive and empty runway

Desktop at 1440×900 remains the art-directed baseline. Laptop and tablet retain inline numbering and horizontal rows while reducing masthead, title, and preview-piece sizes.

At mobile widths:

- the masthead remains horizontally centered below the reserved menu area;
- rows use an inline number column and readable wrapping title;
- primary origin pieces remain present for Flip but hidden from the resting row;
- the detail grid becomes 2×4 and fits without horizontal overflow;
- inversion is available to keyboard focus but is not required on touch hover.

After the service list, an `aria-hidden` empty runway uses true black and a responsive minimum height of roughly 45–60svh. It contains no invented copy, CTA, art, or placeholder UI.

## Accessibility and verification

Existing row-button semantics, `aria-expanded`, `aria-controls`, dialog labelling, Escape close, double-activation guard, hidden-state tab control, and focus restoration remain required.

Browser acceptance adds these explicit checks:

- the docked masthead's horizontal center is within visual tolerance of the viewport center;
- the masthead computed font family/weight matches the intro word and its color stays white throughout;
- no blue-tinted page field is visible;
- every desktop row transitions to a complete white field with black number/title;
- no tiny detached number remains above a title;
- hover pieces are black/white, not blue cards;
- the selected white row visibly becomes the white fullscreen cover;
- the empty black runway is visible below the list when scrolling;
- mobile has no horizontal overflow.

The final design review occurs only after implementation and primary QA. A dedicated graphic-design review agent will be asked to criticize hierarchy, rhythm, typography, contrast, and interaction continuity. Its recommendations will be debated against this approved direction, Codrops fidelity, accessibility, and implementation evidence; accepted changes will be re-tested and re-captured.
