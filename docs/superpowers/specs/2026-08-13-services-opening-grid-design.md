# Services Opening + Menu-to-Grid Design

## Scope

Implement the first interactive beat of the dedicated `/services` page only:

1. automatic opening statement,
2. semantic `SERVICES` handoff into the page interface,
3. compact service index,
4. selected-service expansion into an editorial detail grid,
5. close/back transition to the service index.

Works bridge, capability-summary section, final contact CTA, homepage navigation integration, and homepage-to-Services detachment are explicitly out of scope for this implementation.

## Opening copy

Visible opening composition:

- `SO, WHAT`
- `SERVICES`
- `DO WE PROVIDE?`

A persistent semantic page heading remains available to assistive technology as `SO, WHAT SERVICES DO WE PROVIDE?`; the animated visual lines are decorative.

## Opening choreography

1. `/services` opens directly on the final Services visual theme; there is no loader or fake prelude.
2. The three visual text lines reveal through clipped vertical movement and settle completely.
3. Hold long enough to read: about 1.8 seconds after the entrance settles.
4. `SO, WHAT` exits through its mask toward the left while `DO WE PROVIDE?` exits toward the right.
5. `SERVICES` remains alone for a short beat.
6. Capture the actual `SERVICES` element with GSAP Flip, move that same DOM element into the permanent Services-index label slot, change it to Weberaise blue, and Flip it into place.
7. While that move is still resolving, reveal the service rows through clipped baseline motion with a tight stagger.
8. Motion stops completely before the page becomes the steady interactive index.

There is no wipe, shader, curtain, particle system, liquid effect, or duplicate crossfade between those states.

## Service index

Use the currently locked five service groups. The component must be data-driven and not hard-code a five-row geometry so a sixth item can be added later without rewriting the interaction.

1. Website Design & Development
2. Website Redesign
3. Landing Pages
4. E-commerce / Business Systems
5. Optimization & Support

Each row is a semantic button and contains:

- index number,
- service title,
- a small set of capability blocks on the right.

The capability blocks are the Weberaise replacement for the Codrops demo thumbnails. They are typographic/graphic blocks, not images.

At rest, rows are clean and editorial. Hover/focus may reveal or strengthen the small blocks, but all essential information remains available through click/tap/keyboard.

## Menu-to-grid expansion

The mechanism is inspired by Codrops `MenuToGrid` (MIT), but re-authored for React/Next.js and Weberaise content.

On activation:

1. prevent re-entry while the transition is running;
2. remember the activated row for focus restoration;
3. expand a background cover from the selected row's screen position to the viewport;
4. animate non-selected row titles away from the selected row;
5. capture the selected row's capability blocks with `Flip.getState(...)`;
6. physically move those same DOM nodes into the selected service detail grid;
7. run `Flip.from(...)` so the blocks preserve spatial continuity while expanding/recomposing;
8. reveal supplemental detail blocks after the transferred blocks begin landing;
9. reveal the selected service title and concise explanation;
10. reveal/focus the close control.

On close:

1. hide supplemental detail blocks and title;
2. capture/move the transferred capability blocks back to their row container;
3. collapse the cover back toward the originating row;
4. restore all row titles;
5. return keyboard focus to the originating row button.

Escape closes an open service detail.

## Service detail content

### Website Design & Development

Lead: `A complete website system — structured, designed and built around how the business needs to present itself.`

Transferred blocks:
- Strategy & Structure
- UI/UX Design
- Frontend Development

Supplemental blocks:
- Responsive Build
- CMS & Integrations
- Launch QA

### Website Redesign

Lead: `For websites that work technically but no longer represent the quality, clarity or direction of the business.`

Transferred blocks:
- Audit & Diagnosis
- UX Restructure
- Visual Redesign

Supplemental blocks:
- Performance Cleanup
- Content Migration
- Relaunch QA

### Landing Pages

Lead: `Focused campaign and offer pages built to communicate one thing quickly, clearly and convincingly.`

Transferred blocks:
- Message & Hierarchy
- Conversion UX
- Rapid Build

Supplemental blocks:
- Analytics
- A/B-ready Structure
- Campaign Integrations

### E-commerce / Business Systems

Lead: `Digital systems where the website has to do real operational work — selling, collecting, organising or connecting.`

Transferred blocks:
- Storefront UX
- Product / Service Flows
- Integrations

Supplemental blocks:
- CMS / Admin
- Commerce & Payments
- Operational Workflows

### Optimization & Support

Lead: `Ongoing technical improvement for websites that need to stay fast, measurable, maintained and useful.`

Transferred blocks:
- Performance
- SEO Foundations
- Analytics

Supplemental blocks:
- Maintenance
- Iteration
- Technical Support

## Visual system

- Use existing Weberaise fonts and tokens only.
- Primary background: `--wr-background` / black family.
- Primary text: `--wr-text` / white family.
- Signature accent: Weberaise blue (`--wr-blue`, with `--wr-glow` only where restrained).
- Avoid generic cards, glassmorphism, SaaS gradients, purple, stock imagery, or decorative 3D.
- The detail grid should feel like an editorial information composition, not a dashboard.

## Responsive behavior

Desktop:
- rows span wide horizontally;
- capability blocks sit on the right;
- detail expands into an asymmetric multi-column grid.

Tablet:
- keep the same spatial transformation with reduced gaps and block sizes.

Mobile:
- service title remains dominant;
- row capability blocks are compact and may wrap;
- expanded detail becomes a two-column or single-column grid depending available width;
- no hover dependency.

## Reduced motion

With `prefers-reduced-motion: reduce`:

- skip the long opening hold and large directional travel;
- immediately establish the docked `SERVICES` label and index with a very short opacity transition;
- opening/closing detail uses near-instant state changes or short fades;
- all information and focus behavior remains identical.

## Accessibility

- One semantic `h1` for the page.
- Service rows are `button` elements with `aria-expanded` and `aria-controls`.
- Expanded detail uses a labelled dialog-like region without trapping the user indefinitely; close button is immediately reachable.
- Escape closes detail.
- Focus enters the close control after opening and returns to the originating service button on close.
- Focus-visible styling uses the existing brand system.
- Animated decorative duplicate text is `aria-hidden`.

## Source adaptation note

Reference studied: Codrops `MenuToGrid` / `codrops/MenuToGrid` (MIT). The useful mechanism is GSAP Flip state capture + moving existing preview elements from a row into a full-screen grid. Weberaise does not copy the demo's image assets, fonts, loader, hover title-switch, WebFont/imagesloaded setup, Parcel structure, or visual styling.
