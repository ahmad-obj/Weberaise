# Services Contact Ending Design

## Status and authority

This spec defines the final Contact ending of the `/services` page.

It follows the approved and implemented Services flow:

1. Services opening / centered `SERVICES` handoff
2. Service index and service preview interaction
3. Works Bridge / `VIEW OUR WORK`
4. fixed Silk environment
5. organized Capabilities section
6. **Contact ending — this spec**

Current implementation baseline when this spec is written:

- branch: `feature/services-opening-grid`
- branch head: `698f8018044b81240c588f5d295814ce9cf05b53`
- the Services tail already contains a blank `contactReserve` after `CapabilitiesSection`
- the fixed Silk background is already shared across the Services tail and must continue behind Contact without restarting

This Contact ending is deliberately **not** a persuasive sales CTA and is **not** a separate Contact page.

The site-level top-right `LET'S TALK` behavior is being developed elsewhere and may open its own compact contact panel. This Services Contact ending does not own, duplicate, or interfere with that system.

---

## Objective

Finish the Services page with a direct, useful, visually strong contact directory that feels like a natural conclusion to the page rather than another marketing section.

The visitor should immediately understand:

- this is the Contact area;
- how to contact Weberaise;
- which contact channels are available;
- where the Services page ends.

There should be no persuasion, no pitch, no reassurance paragraph, no fake urgency, and no extra narrative copy.

The section earns its visual impact through typography, hierarchy, spacing, the existing Silk environment, and precise microinteraction.

---

## Reference direction

The design direction is informed by premium studio contact/footer patterns such as Pentagram, BUCK, Locomotive, Kue Studio, and selected Awwwards/Codrops contact references.

What to borrow conceptually:

- direct information instead of conversion copy;
- strong typographic identity;
- clear contact channels;
- restrained interaction;
- contact and footer treated as one final composition;
- generous but controlled spacing;
- no generic boxed CTA card.

What not to copy:

- office/location listings;
- local clocks;
- multi-office directories;
- long inquiry forms;
- persuasive agency language;
- full-screen giant headline treatment that turns Contact into another hero.

---

## Core visual idea

The Contact ending is a **compact editorial contact scene** inside the same fixed Silk background already used by Capabilities.

It has three layers of hierarchy:

1. small technical section marker: `// CONTACT.`
2. strong but controlled display heading: `CONTACT US`
3. functional contact directory: email, phone/WhatsApp, social links

The composition then resolves into a very quiet bottom footer strip.

The section should feel visually decisive, but it must not dominate the page more than Services or Works.

---

## Vertical scale

Target desktop height: approximately **80–95svh**.

Preferred starting point: around **88–90svh**.

This is intentionally much smaller than a hero.

The heading should not consume 60–70% of the viewport. It should occupy roughly the first **25–35% of the section's visual hierarchy**, with the directory and footer receiving enough space to feel equally deliberate.

The section should end comfortably within one normal viewing chapter instead of feeling like another long scroll story.

Mobile may become taller naturally because the directory stacks, but it should still remain compact compared with the Capabilities section.

---

## Relationship to Capabilities

There is no hard visual reset between Capabilities and Contact.

The final Capabilities group should finish, then whitespace opens gradually before `// CONTACT.` appears.

Do not add:

- a new background;
- a section-colored block;
- a divider panel;
- a card container;
- a hard shader transition;
- another entrance animation spectacle.

The same fixed Silk shader continues with the same running state.

The Contact section should read as the final organized layer of the same visual chapter.

---

## Background behavior

The existing Silk canvas remains the single background source.

Locked:

- no second WebGL instance;
- no shader restart;
- no new shader preset;
- no pointer reaction added specifically for Contact;
- no contact-hover shader distortion;
- no scroll-scrubbed shader change.

The Contact section may allow the Silk to be **slightly more visually present through composition**, simply because there is less foreground text density than Capabilities. This does not mean changing shader brightness or parameters by section.

Do not add per-section shader controls unless browser QA proves readability requires a global adjustment.

---

## Section marker

Use:

```text
// CONTACT.
```

It should use the same technical micro-label language already established by:

- `// CAPABILITIES.`
- discipline labels like `01 // DESIGN`

The marker should align to the main content grid and provide immediate continuity.

It is not interactive.

---

## Main heading

Desktop heading:

```text
CONTACT US
```

Locked direction: **single line on desktop when the viewport comfortably permits it.**

The heading is display text only.

It must NOT:

- navigate to a `/contact` route;
- open the global `LET'S TALK` panel;
- act like a button;
- be wrapped in an anchor;
- imply clickability through cursor or hover treatment.

The heading may use a very subtle passive typographic state if the general page art direction requires it, but the preferred implementation is no hover interaction because it is not actionable.

### Scale

The heading should be large enough to close the page confidently but clearly smaller in conceptual dominance than a page hero.

Starting desktop target:

- approximately `clamp(72px, 9vw, 150px)` depending on the existing font metrics;
- tight line-height around `0.86–0.94`;
- strong negative tracking consistent with the Services display language;
- width constrained so it does not feel like edge-to-edge billboard typography.

The exact value is tuned in-browser.

### Responsive wrapping

Desktop / large tablet:

```text
CONTACT US
```

Narrow screens may wrap naturally to:

```text
CONTACT
US
```

Do not force a tiny font just to preserve a single line on mobile.

---

## Contact directory

Below the display heading, place a functional contact directory.

Preferred desktop structure:

```text
EMAIL                         PHONE / WHATSAPP
<email value>                 <phone / WhatsApp value>

SOCIAL
<social link>   <social link>
```

This is a structural model, not literal placeholder content.

Production values must come from real Weberaise contact data available to the project at implementation time. **Do not invent email addresses, phone numbers, WhatsApp numbers, or social URLs.**

If a channel does not yet have a real production value, omit it rather than publishing fake data.

### Information hierarchy

Labels:

- small;
- uppercase or technical style;
- muted white;
- similar visual role to discipline labels in Capabilities.

Values:

- significantly larger than labels;
- high contrast;
- easy to scan;
- not oversized enough to compete with `CONTACT US`.

The contact directory should feel like a clean ledger rather than a footer utility list.

---

## Contact interactions

Interaction is functional only.

### Email

Preferred behavior:

- email value is a normal `mailto:` link;
- optionally provide a tiny adjacent copy affordance if the site already has a suitable icon/interaction language;
- if copy is implemented, show a small transient `COPIED` acknowledgment;
- do not make the entire email click unexpectedly copy without any affordance if it looks like a normal email link.

Reason: direct contact should follow familiar browser expectations first.

### Phone / WhatsApp

Where both channels use the same number:

- phone value may use `tel:`;
- a separate `WHATSAPP` text link can use the appropriate WhatsApp URL;
- avoid presenting two visually giant duplicate numbers.

If the site later decides WhatsApp is the primary contact channel, the directory may label the block `PHONE / WHATSAPP` and provide two small actions beneath the single number.

### Social

Use ordinary external links for the actual Weberaise social profiles.

No fake social channels.

### Hover language

For actionable values only:

- subtle arrow or marker shift;
- very small tracking/weight change;
- subtle color lift toward white or Weberaise blue;
- no glowing pills;
- no magnetic cursor;
- no large underline animation;
- no card fill;
- no shader reaction.

The interaction should feel precise and consistent with the premium motion restraint used elsewhere on the Services tail.

---

## Layout system

The Contact ending should inherit the **organized** direction of the refined Capabilities section rather than returning to scattered editorial placement.

Desktop:

- one shared content grid;
- `// CONTACT.` aligned with the section left edge;
- `CONTACT US` directly beneath on the same alignment system;
- contact information placed in a clean two-column grid;
- social links occupy one clear row or sub-grid rather than floating independently.

Do not use arbitrary `margin-left` offsets or handcrafted scatter positions.

The composition can still feel premium through scale differences and whitespace, but every element should have an obvious structural relationship.

---

## Suggested desktop rhythm

At approximately 1440×900:

```text
[breathing room from final Capability group]

// CONTACT.

CONTACT US


EMAIL                           PHONE / WHATSAPP
real email                      real number / actions

SOCIAL
Instagram     LinkedIn          (only if real profiles exist)


----------------------------------------------------------
WEBERAISE                                       © 2026
```

The horizontal line is optional and should be extremely quiet if used.

If the line makes the composition feel like a generic corporate footer, remove it and rely on spacing instead.

---

## Bottom footer strip

The Contact ending and footer are treated as one final composition.

Preferred minimum footer content:

```text
WEBERAISE                                    © 2026
```

Do not add navigation repetition unless the existing global site architecture later requires it.

Do not add:

- location;
- local time;
- office address;
- newsletter signup;
- fake legal links;
- long copyright statements;
- slogan;
- another CTA;
- repeated Services links.

If real Privacy / Terms pages are introduced later, they may be added unobtrusively without redesigning the section.

Year handling may be dynamic in code.

---

## Typography

The section should use the existing Weberaise type system.

Hierarchy:

1. `CONTACT US` — display family / highest local hierarchy
2. contact values — large readable body/display hybrid
3. contact labels — technical small text
4. footer strip — smallest quiet utility text

Avoid introducing a new font or a contact-specific type treatment.

Tracking/weight should connect visually to the Services masthead and Capabilities names without copying either scale exactly.

---

## Motion and entrance behavior

The section should not introduce another choreographed scroll event.

Preferred behavior:

- normal document scroll;
- optionally a very small opacity/translate entrance for the marker, heading, and directory when they first enter the viewport;
- if used, entrance timing should be short and non-blocking;
- no scroll pinning;
- no text split animation requiring the user to wait;
- no letter-by-letter spectacle;
- no giant reveal mask;
- no parallax tied to scroll.

The Silk background already supplies continuous environmental motion, so foreground motion should remain secondary.

Reduced motion must remove any entrance translation while preserving the full layout.

---

## Relationship to global `LET'S TALK`

The existing/future top-right `LET'S TALK` control is a separate global contact mechanism.

This Services Contact ending does **not** need to open that panel automatically and does not need a duplicate `LET'S TALK` button.

The two systems have different roles:

- global `LET'S TALK`: quick contact access from anywhere on the site;
- Services Contact ending: direct contact information at the natural end of the Services page.

Do not create routing or shared-state coupling between the Contact heading and the global panel merely for consistency.

If reusable contact data constants later make sense, data may be shared, but UI behavior should remain independent.

---

## Responsive behavior

### Desktop

Target around 1440×900:

- section around 80–95svh;
- `CONTACT US` single line;
- directory in two columns;
- social row below;
- footer strip near the natural bottom;
- substantial but not excessive whitespace.

### Tablet

- keep `CONTACT US` single-line while it remains visually comfortable;
- two-column directory may remain if values fit naturally;
- otherwise stack contact blocks cleanly;
- never squeeze long email/number strings merely to preserve columns.

### Mobile

- heading may wrap to `CONTACT` / `US`;
- directory becomes one column;
- labels and values stay left aligned;
- social links become one simple horizontal row or small wrapped list;
- footer may stack `WEBERAISE` and copyright if required;
- no horizontal overflow;
- no arbitrary indentation.

Mobile should feel deliberate, not like a collapsed desktop footer.

---

## Accessibility

- use a semantic `<section>` with an accessible heading;
- `CONTACT US` may be the visible `<h2>` for the section;
- decorative technical marker remains normal text or is hidden from heading semantics as appropriate;
- email / phone / WhatsApp / social entries use real anchors;
- external links should preserve expected browser behavior;
- focus states must remain clearly visible over the Silk background;
- do not rely on hover alone to communicate link affordance;
- no interactive role on the non-actionable `CONTACT US` heading;
- reduced-motion behavior respected.

---

## Performance

The Contact ending adds no new animation engine and no new WebGL work.

- reuse the existing fixed Silk canvas;
- CSS transitions only for small link states;
- no per-frame React updates;
- no intersection-driven JS unless a tiny entrance animation genuinely requires it;
- prefer CSS for entrance/interactions where practical;
- no additional image/video assets required.

The final section should be effectively negligible compared with the existing shader cost.

---

## Component boundary

Preferred structure:

```text
ServicesTailEnvironment
├── CapabilitiesSection
└── ContactEnding
    ├── section marker
    ├── display heading
    ├── ContactDirectory
    └── FooterStrip
```

`ServicesTailEnvironment` continues to own tail layering only.

`ContactEnding` owns:

- Contact section semantics;
- visual hierarchy;
- contact directory rendering;
- footer strip.

The fixed `SilkWavesBackground` remains route-level and unchanged.

Do not put contact UI logic into the shader component.

Do not put global top-right `LET'S TALK` panel logic into `ContactEnding`.

If real contact data already lives in a shared configuration file when implementation begins, consume that source. Otherwise create one small contact-data model instead of scattering literals across JSX.

---

## Explicit non-goals

Do not build:

- a dedicated `/contact` page;
- a contact form;
- a modal from the `CONTACT US` heading;
- a duplicated `LET'S TALK` control;
- persuasive copy;
- project inquiry questionnaire;
- location/local-time widgets;
- office directory;
- giant 70%-of-viewport heading composition;
- cards or glass panels;
- newsletter signup;
- testimonials;
- conversion stats;
- another shader;
- shader hover interactions;
- scattered positioning;
- scroll pinning or scrubbed storytelling.

---

## Locked design decisions

Locked:

- direct contact-directory ending, not persuasive CTA;
- no separate Contact page;
- same persistent Silk environment;
- no location or local time;
- `// CONTACT.` technical marker;
- `CONTACT US` display heading;
- heading is not clickable and has no route behavior;
- single-line `CONTACT US` on desktop when comfortable;
- section target around 80–95svh, preferred ~88–90svh;
- heading is strong but not another hero;
- organized grid-based contact information;
- email + phone/WhatsApp + social channels, using only real production values;
- no invented contact data;
- functional interactions only;
- compact footer strip with `WEBERAISE` and copyright;
- no cards/pills/glassmorphism;
- no new major motion system;
- no coupling to global `LET'S TALK` panel behavior.

Tunable during browser art direction:

- exact section height within the approved range;
- exact `CONTACT US` font size/weight/tracking;
- spacing between marker, heading, directory, and footer;
- whether a very subtle horizontal footer rule is visually useful;
- exact directory column widths;
- stack breakpoint;
- tiny hover/arrow motion on actionable values;
- optional copy affordance for email if it remains visually clean.

---

## Browser acceptance criteria

Primary check around 1440×900:

- Contact begins naturally after Capabilities without a hard reset;
- same Silk state remains visible and continuous;
- `// CONTACT.` clearly signals the final section;
- `CONTACT US` is strong but does not behave like another hero;
- heading stays single-line when space permits;
- heading does not look clickable;
- directory alignment is clean and organized;
- real contact values are easy to find immediately;
- no location/time content exists;
- no persuasive paragraph exists;
- contact links have precise but restrained hover/focus behavior;
- no cards or generic CTA box appears;
- footer closes the page cleanly;
- entire ending feels proportional to the Services page rather than oversized.

Also verify:

- 1280×800;
- 768×1024;
- 390×844;
- keyboard focus navigation;
- touch/coarse pointer;
- reduced motion;
- long email/phone values without overflow;
- Silk fallback state;
- no interference with the independently developed global `LET'S TALK` contact panel.
