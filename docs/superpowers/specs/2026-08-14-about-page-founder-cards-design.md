# About Page + Founder Portrait Cards Design

## Status and authority

This spec defines the complete design direction for the Weberaise `/about` page, with special emphasis on the two-founder portrait interaction.

It is a **design clarification document**, not an implementation plan. Its purpose is to remove ambiguity before the implementation plan is written.

Current repository baseline when this spec is written:

- repository: `manbtd0-cloud/Weberaise`
- working reference branch: `feature/services-opening-grid`
- branch head before this spec: `176fa7aa0e6cb9dc9dc716af87f38463953f5624`
- there is currently no `src/app/about/` route on this branch
- the existing component organization is split between route-specific component folders (`MainSite`, `ServicesPage`) and reusable `ui` components
- the project already has `framer-motion@12.43.0`, `gsap@3.15.0`, Next.js 16.3.0 and React 19.2.8
- the existing visual tokens live in `src/styles/tokens.css`
- the existing hero/body typography families are wired in `src/app/layout.tsx`
- the existing reusable Silk WebGL environment lives under `src/components/ui/SilkWavesBackground`

The About page remains independent of the separate global navigation / top-right `LET'S TALK` implementation being developed elsewhere. This spec must not duplicate or alter that system.

---

## Product objective

The About page should answer one thing clearly:

> **Who are the two people behind Weberaise, and how do they work together?**

It should not become a long agency manifesto, timeline, culture deck, hiring page or corporate profile.

The page is intentionally short: **three sections only**.

1. Opening / studio identity
2. The two people behind Weberaise
3. How the two-person studio works

The founders section is the visual centerpiece of the page.

---

## Page character

The page should feel:

- human;
- compact;
- premium;
- editorial rather than corporate;
- technically polished without becoming a component demo;
- clearly related to the existing Weberaise design language;
- confident enough to show the real founders without over-explaining them.

The About page should **not** feel like a generic SaaS “Meet the team” page.

There are exactly two founders. The composition must celebrate that fact rather than pretending Weberaise has a large staff directory.

---

# 1. Page structure

## Section 01 — Opening

### Purpose

Introduce Weberaise as a two-person studio in one concise visual chapter.

### Visual structure

Recommended desktop hierarchy:

```text
// ABOUT.

WE'RE WEBERAISE.
A TWO-PERSON DIGITAL STUDIO
BUILT AROUND DESIGN AND DEVELOPMENT.

[short supporting sentence]
```

The exact opening wording may be tuned during copy polish, but the **content meaning is locked**:

- Weberaise is a two-person studio;
- design and development are the complementary halves;
- the tone is descriptive, not persuasive.

Recommended supporting sentence direction:

> We work closely from first idea to final build, keeping design and development together from the start.

Do not add:

- statistics;
- “years of combined experience” claims;
- awards;
- client-count claims;
- mission / vision blocks;
- a CTA button;
- long origin-story paragraphs.

### Height

Desktop target: approximately **78–88svh**.

This should feel like a strong opening, but not another homepage hero.

### Background

Use the existing Weberaise black / blue language.

Preferred direction:

- true or near-black base;
- reuse the existing Silk shader as a restrained environmental element behind the opening only;
- do **not** create a new shader or a new animation system;
- the following founders section becomes visually more opaque / black so the portraits receive full attention.

The current reusable candidate is:

`src/components/ui/SilkWavesBackground/SilkWavesBackground.tsx`

If reused, it should be mounted once at route level and scoped with an About-specific active target. Do not modify the Silk formulas simply to make the About page look different.

---

## Section 02 — The People

### Purpose

This is the central About-page section.

It should communicate that Weberaise is formed by **two real people with complementary responsibilities**.

### Section composition

Desktop:

- left column: section marker + concise statement;
- right / dominant area: exactly two founder portrait modules;
- both portrait modules share one visual system;
- cards sit on the same baseline and use the same dimensions;
- no team grid, carousel, stack or infinite list.

Recommended section text structure:

```text
02 // THE PEOPLE

THE PEOPLE
BEHIND
WEBERAISE.

Two people, different strengths,
one shared standard for the work.
```

The supporting line is optional during final copy tuning, but no biography wall should be added.

### Height

Desktop target: roughly **95–115svh** depending on final portrait size.

The section should fit as one major chapter at common desktop heights rather than becoming a long scrolling directory.

---

# 2. Founder portrait card — core concept

## Reference synthesis

The founder module intentionally combines two references, but should not look like a copied component.

### Reference A — React Bits `Tilted Card`

Official demo:

`https://reactbits.dev/components/tilted-card`

Official source repository:

`https://github.com/DavidHDev/react-bits`

Relevant TypeScript implementation at the inspected source revision:

`src/ts-default/Components/TiltedCard/TiltedCard.tsx`

Pinned source URL:

`https://github.com/DavidHDev/react-bits/blob/4022efa12a8763a2aeb10768ad0b390d30b6d960/src/ts-default/Components/TiltedCard/TiltedCard.tsx`

Relevant CSS:

`https://github.com/DavidHDev/react-bits/blob/4022efa12a8763a2aeb10768ad0b390d30b6d960/src/ts-default/Components/TiltedCard/TiltedCard.css`

Mechanics worth borrowing conceptually:

- pointer position is measured relative to the card center;
- pointer offset is mapped to `rotateX` / `rotateY`;
- rotations are driven through spring-smoothed motion values;
- the card wrapper establishes CSS `perspective`;
- the inner card uses `transform-style: preserve-3d`;
- the image is a full-frame absolute layer;
- pointer leave returns the card to neutral.

The React Bits source currently defaults to approximately:

- `rotateAmplitude = 14`
- `scaleOnHover = 1.1`
- spring damping `30`
- spring stiffness `100`
- spring mass `2`
- CSS perspective `800px`

**Weberaise should not use those aggressive defaults unchanged.**

The interaction must be quieter and more editorial.

### Reference B — Hover.dev `Reveal Cards`

Reference:

`https://www.hover.dev/components/cards#reveal-cards`

The public page demonstrates a card where foreground visual content moves to reveal additional card information.

For Weberaise, borrow only the **reveal relationship**:

- fixed card frame;
- hidden information layer beneath;
- foreground image moves away to expose that layer.

Do not copy the demo’s “MORE” action, content design or full card styling.

This spec does not depend on Hover.dev’s internal source code. The custom Weberaise behavior below is explicitly defined and should be implemented independently.

---

# 3. Founder card — locked visual behavior

## Frame geometry

The card is portrait-oriented, not square.

Locked starting ratio:

**`aspect-ratio: 4 / 5`**

This is intentionally only moderately tall. It should feel like a portrait artwork, not a narrow employee badge.

Suggested desktop width:

- approximately `clamp(260px, 24vw, 380px)`;
- exact maximum tuned against the full founders-section grid.

Both founder cards must have identical frame dimensions.

The frame itself never changes size during hover.

No hover state may modify:

- card width;
- card height;
- aspect ratio;
- surrounding margins;
- grid gap;
- document flow.

The entire effect must be transform-only so there is **zero layout shift**.

---

## Layer model

The founder card should be understood as four nested layers:

```text
FounderPortraitCard
└── perspective shell              // fixed layout footprint
    └── tilt layer                 // rotateX / rotateY only
        └── fixed portrait frame   // overflow hidden
            ├── reveal band        // lives underneath the photo
            └── image layer        // covers the entire frame at rest
```

This separation is important.

The tilt and reveal mechanics must not fight over the same CSS transform property.

- the **tilt layer** owns 3D rotation;
- the **image layer** owns vertical reveal translation;
- the **frame** owns clipping;
- the **reveal band** does not move the layout.

---

## Rest state

At rest:

- portrait fills the complete frame;
- `object-fit: cover`;
- frame remains clean and simple;
- reveal band is physically behind the portrait;
- no “MORE”, icon, button, arrow or fake profile action is visible;
- founder name is presented as part of the surrounding identity layout, not as a floating tooltip;
- tilt is neutral at `0deg / 0deg`.

The card should still look finished before any interaction occurs.

---

## Hover state — image reveal

On fine-pointer hover:

1. the frame begins its subtle pointer-responsive tilt;
2. the portrait image shifts **downward inside the unchanged frame**;
3. the upper part of the frame reveals the information band underneath;
4. the bottom of the portrait naturally clips outside the frame;
5. the frame itself remains exactly the same size and position in layout.

This is the core interaction requested for Weberaise.

### Reveal amount

Target reveal band:

**approximately 25–30% of card height.**

Preferred first implementation value:

**~27%**.

Therefore the image layer should translate downward by approximately the same amount.

Do not animate the image height. Do not resize the image. Do not reveal by expanding the card.

The intended visual effect is equivalent to **dragging the portrait down inside a fixed crop window**.

The bottom torso area is expected to be clipped during hover. That clipping is intentional.

---

## Reveal-band content

The reveal band occupies the newly exposed upper area.

It should contain short identity information only.

Recommended structure:

```text
01 / FOUNDER
DESIGN / DIRECTION
```

and for the second founder:

```text
02 / FOUNDER
DEVELOPMENT / SYSTEMS
```

Those role examples describe the intended information density, not final founder titles. Final role text must use the real founder responsibilities supplied for production.

The band should **not** contain:

- biography paragraphs;
- social links;
- buttons;
- “MORE”;
- project counts;
- skill pills;
- progress bars;
- icons unless a later visual QA pass proves one tiny marker is useful.

### Text treatment

- small technical index line using `var(--font-technical)` or body family;
- main role line using the existing display/body system;
- role accent may use `var(--wr-blue)` or `var(--wr-glow)`;
- high contrast but not neon;
- left aligned;
- enough internal top / side padding that the band feels intentional even when revealed quickly.

---

# 4. Tilt mechanics — Weberaise adaptation

The React Bits implementation is a reference, not a drop-in dependency.

The Weberaise card should use the same general pointer-to-rotation idea but substantially lower amplitude.

## Target motion values

Starting art-direction values:

- horizontal rotation (`rotateY`): approximately **±5–6deg** maximum;
- vertical rotation (`rotateX`): approximately **±3.5–4.5deg** maximum;
- perspective: approximately **900–1100px**;
- hover scale: **1.00–1.015**, never the React Bits default 1.1;
- return-to-neutral should feel soft rather than snappy.

Recommended spring family:

- damping around `28–32`;
- stiffness around `110–140`;
- mass around `1.3–1.8`.

Exact numbers are browser-tuning values, not branding constants.

## Important interaction rule

Pointer position controls **tilt only**.

Pointer position should **not** continuously control how much of the title band is revealed.

The reveal is a clean hover state:

- pointer enters → image travels toward the ~27% reveal position;
- pointer moves → tilt responds, reveal amount remains stable;
- pointer leaves → image returns to `0%`, tilt springs back to neutral.

This avoids jitter and makes the card feel composed.

---

# 5. Motion ownership and code strategy

## Existing dependency constraint

The inspected React Bits source imports from `motion/react`.

Weberaise does **not** currently depend on the separate `motion` package.

The repository already has:

`framer-motion@12.43.0`

Therefore the About card should be implemented with the existing `framer-motion` dependency rather than introducing `motion` solely to mirror React Bits.

The required concepts are already available in Framer Motion:

- `motion`;
- `useMotionValue`;
- `useSpring`;
- transform animation.

No new animation library is required.

## Performance principle

Pointer movement must update motion values directly and must not cause React component re-renders on every mousemove.

The interaction should avoid per-frame React state.

Recommended separation:

- MotionValues / springs: tilt;
- CSS hover or one hover state transition: image reveal;
- Next Image / browser image layer: portrait rendering;
- CSS clipping: frame.

---

# 6. Portrait image requirements

The user retains final art direction over the actual founder photographs.

The component must support per-founder crop control rather than forcing the same crop coordinates onto both images.

## Production photo guidance

Best source image shape:

- portrait or generously cropped vertical image;
- enough torso / lower-body area that losing the lower ~25–30% on hover is harmless;
- face placed in the upper third rather than vertically centered;
- shoulders not cropped too tightly;
- sufficient resolution for a 350–400px wide high-DPR render.

Preferred source target:

- at least roughly 1200×1500px;
- ideally 1600×2000px or larger;
- clean lighting and enough background around the head for crop adjustment.

The production card should use `next/image` unless browser QA proves there is a technical reason not to.

## Per-founder crop configuration

Founder data should support an image crop hint such as:

```ts
objectPosition: '50% 22%'
```

This is important because the image physically moves downward on hover.

The crop should be tuned so:

- head / eyes remain comfortably inside the frame at rest;
- after the downward reveal translation, the face remains readable and is not pushed too close to the lower edge;
- only torso / lower body is materially lost at the bottom.

No implementation should hard-code one universal object position and assume both photographs will fit.

---

# 7. Founder identity content outside the frame

The card should not become visually anonymous at rest.

Recommended founder identity block immediately below each portrait:

```text
REAL NAME
formal role / responsibility
```

However, the role treatment changes by interaction capability:

### Fine pointer desktop

- founder name remains visible below the card;
- role may be visually restrained below the card;
- the richer / more graphic role treatment appears in the upper reveal band on hover.

### Coarse pointer / mobile

Hover cannot be assumed.

Therefore:

- no information may require hover to be understood;
- name and role are both fully visible beneath the portrait;
- card remains a clean static portrait;
- the hidden reveal band may remain visually unused on touch devices.

This prevents the mobile experience from becoming an awkward “tap to discover role” interaction.

The reveal band is an enhancement, not the only source of essential founder information.

---

# 8. Founder data model

Exactly two founder records are expected.

Recommended shape:

```ts
type Founder = {
  id: '01' | '02';
  name: string;
  role: string;
  revealTitle: string;
  imageSrc: string;
  imageAlt: string;
  objectPosition: string;
};
```

Production rules:

- use the two real founder names;
- use real roles / responsibilities;
- use real founder photographs supplied / approved by the user;
- do not publish generated faces as production founder images;
- do not invent biographies;
- do not add social links unless explicitly requested later.

The actual content values are production inputs, not a reason to alter the layout architecture.

---

# 9. Founder section layout details

## Desktop ≥ ~1100px

Suggested grid:

```text
[left introduction column]   [founder 01] [founder 02]
```

Recommended proportional idea:

- intro: ~28–32%;
- portraits area: ~68–72%;
- equal card widths;
- portrait gap approximately `clamp(22px, 2.5vw, 42px)`.

The cards should not overlap.

Do not stagger one card far above / below the other simply to make the layout “editorial.” The interaction is already the authored element.

## Tablet ~721–1099px

- founders intro moves above or remains in a reduced left column depending on available width;
- two portrait cards may remain side by side while each can stay at least ~240–260px wide;
- once that can no longer be maintained comfortably, stack.

## Mobile ≤ ~720px

- intro full width;
- cards stack one per row;
- no tilt;
- no hover-only reveal;
- portrait aspect ratio remains close to 4:5;
- names / roles visible directly;
- no horizontal scrolling;
- spacing between founders should feel like two intentional profiles, not a feed.

---

# 10. Card visual styling

## Surface

The card frame should remain understated.

Preferred:

- true black or `var(--wr-surface)` underlay;
- thin `var(--wr-border)` edge or a low-opacity white edge;
- moderate radius around **12–16px**;
- no glass panel;
- no frosted backdrop;
- no thick neon outline;
- no permanent glow.

The reveal band can use:

- `#000` / `var(--wr-surface)` base;
- one restrained blue accent;
- subtle inner separator if needed.

## Shadow / depth

The 3D motion itself supplies most depth.

Any shadow should be soft and low contrast.

Do not use a large floating SaaS-card shadow.

## Cursor

Use the normal pointer / site cursor language.

Because the card is not a link or button, do not falsely communicate clickability with a hand cursor.

---

# 11. Accessibility and non-hover behavior

The founder cards are primarily presentation, not controls.

Therefore:

- do not add fake button semantics;
- do not add an anchor if the card has no destination;
- do not add a meaningless `tabIndex=0` just to make hover animation keyboard-focusable;
- actual founder name and role must exist as real semantic text in the DOM;
- portrait alt text should identify the person simply, e.g. `Portrait of <name>`;
- decorative duplicate text inside the hover reveal may use `aria-hidden="true"` if the same role is already semantically present outside the card.

### `prefers-reduced-motion`

Reduced-motion mode:

- card stays neutral with no pointer tilt;
- no image slide reveal animation;
- name and role remain fully available below the portrait;
- no important content is lost.

### Coarse pointer

For `pointer: coarse` / `hover: none`:

- disable 3D tilt;
- disable image shift reveal;
- keep the card visually stable;
- show full identity information outside the image.

---

# 12. Section 03 — How We Work

## Purpose

Close the About page with a compact explanation of how a two-person studio functions.

This is not a process timeline and not another Services section.

Recommended structure:

```text
03 // HOW WE WORK

HOW WE WORK.

01 / FOCUSED
We keep the work close, clear and intentional.

02 / COLLABORATIVE
Design and development move together instead of being handed off.

03 / DELIBERATE
Every interaction and technical choice should earn its place.
```

The exact sentences may receive copy polish, but the three-part meaning is locked:

- focused;
- collaborative;
- deliberate.

No icons are required.

If tiny abstract markers are used, they must not turn the row into generic feature cards.

### Height

Desktop target: approximately **60–75svh**.

The page should end soon after this section.

### Ending

Use a quiet footer rail, not another full Contact CTA.

The global `LET'S TALK` system already owns quick contact access.

Do not add another large persuasive end section to About.

---

# 13. Overall page motion

The founder cards are the page’s primary interaction.

Everything else should be calmer.

Allowed:

- very light section entrance opacity / translate;
- small stagger on the three approach principles;
- ambient Silk motion in the opening;
- founder-card tilt / reveal interaction.

Do not add:

- loader;
- homepage liquid reveal;
- Services surface-wave hover;
- scrolling ribbon;
- scroll pinning;
- text split spectacle;
- parallax portraits;
- WebGL distortion on the portraits;
- magnetic founder cards;
- drag behavior;
- card flipping;
- click-to-expand bios;
- cursor-following tooltip from the stock Tilted Card implementation.

The About page needs one authored interactive signature, not five competing ones.

---

# 14. Relationship to existing Weberaise code

## Existing visual tokens

Use:

`src/styles/tokens.css`

Relevant existing tokens include:

- `--wr-black`
- `--wr-white`
- `--wr-background`
- `--wr-surface`
- `--wr-card`
- `--wr-text`
- `--wr-muted`
- `--wr-blue`
- `--wr-glow`
- `--wr-border`
- `--wr-page-pad`
- `--wr-section-pad`
- `--wr-max`
- `--wr-ease-premium`

Do not introduce a separate About-specific color system.

## Existing typography

`src/app/layout.tsx` currently maps:

- `Geist` → `--font-body`
- `Geist_Mono` → `--font-technical`
- `Inter_Tight` → `--font-hero`

The About page should use those existing families.

Do not add another font dependency for the founder cards.

## Existing global section language

`src/app/globals.css` already contains shared concepts such as:

- `--wr-page-pad` / `--wr-section-pad` spacing;
- `.section-display` large editorial typography;
- small muted section kickers;
- dark section foundations.

The About route should follow those visual foundations while keeping its CSS scoped in About-specific modules.

Do not add founder-card rules to `globals.css` unless a genuinely reusable global utility is needed.

## Existing shader

If the opening uses Silk, reuse:

`src/components/ui/SilkWavesBackground/`

Do not fork its shader merely for About.

## Existing dependency stack

From `package.json`:

- `framer-motion: 12.43.0`
- `gsap: 3.15.0`
- `next: 16.3.0`
- `react: 19.2.8`

The founder card requires no new package.

---

# 15. Preferred component boundaries for later implementation

This is a design boundary map, not implementation code.

Recommended structure:

```text
src/app/about/
├── page.tsx
└── AboutRoute.module.css

src/components/AboutPage/
├── AboutPage.tsx
├── AboutPage.module.css
├── AboutOpening.tsx
├── AboutOpening.module.css
├── FoundersSection.tsx
├── FoundersSection.module.css
├── FounderPortraitCard.tsx
├── FounderPortraitCard.module.css
├── ApproachSection.tsx
├── ApproachSection.module.css
└── foundersModel.ts
```

Responsibilities:

### `page.tsx`

- route metadata;
- mounts About page / route background only;
- no founder interaction logic.

### `AboutPage`

- section order only;
- no detailed card behavior.

### `AboutOpening`

- About marker;
- opening headline and short lede;
- opening background layering.

### `FoundersSection`

- exactly two founder records;
- intro / card grid;
- renders `FounderPortraitCard`.

### `FounderPortraitCard`

Owns only:

- fixed portrait frame;
- pointer-to-tilt mapping;
- hover reveal;
- image crop configuration;
- reduced-motion / pointer-capability behavior.

It should not know about the full About page.

### `foundersModel.ts`

- exactly two founder data records;
- names / roles / image path / crop settings;
- no layout logic.

### `ApproachSection`

- compact three-principle close;
- no card interaction code.

This keeps the custom portrait interaction independently understandable and testable.

---

# 16. Interaction state definition

The founder card has only these visual states.

## State A — Idle / fine pointer

- rotation = zero until pointer movement;
- image translation = 0%;
- reveal band covered;
- name visible outside card.

## State B — Hovered / fine pointer

- image translation targets ~27%;
- reveal band exposed;
- role text becomes visually clear;
- tilt responds within low-amplitude bounds;
- frame footprint unchanged.

## State C — Pointer leave

- image returns to 0%;
- tilt returns to neutral;
- no bounce large enough to look playful;
- no delayed tooltip remains.

## State D — Coarse pointer / reduced motion

- no tilt;
- no moving reveal;
- static portrait;
- name + role visible outside frame.

There is no clicked / expanded / selected state.

---

# 17. Visual QA targets

Primary desktop checks:

- 1440×900
- 1280×800
- 1024×768

Mobile / compact checks:

- 768×1024
- 430×932
- 390×844

Founder-card acceptance at each fine-pointer desktop size:

1. both cards share exactly the same dimensions;
2. card height does not change on hover;
3. card grid does not move on hover;
4. top reveal is approximately one quarter to one third of card height;
5. the portrait physically moves downward inside the crop window;
6. bottom torso clipping looks intentional;
7. face remains fully readable throughout the reveal;
8. tilt is obvious enough to feel alive but not strong enough to look like a toy card;
9. the reveal text is readable against its underlay;
10. leaving the card returns smoothly to the exact rest composition.

Mobile acceptance:

1. no horizontal overflow;
2. no tilt dependency;
3. no information hidden behind unavailable hover;
4. portrait crop still looks intentional;
5. cards do not become excessively tall;
6. founders remain the visual center of the page.

---

# 18. Performance requirements

- no new WebGL work for the portraits;
- no Three.js;
- no canvas for the cards;
- no continuous RAF loop owned by the founder cards;
- pointer movement should update MotionValues, not React state;
- only two interactive cards exist, so there is no need for virtualization or complex lifecycle management;
- use transform / opacity for motion;
- avoid animating layout properties;
- use optimized portrait assets through Next Image where practical;
- respect `prefers-reduced-motion`;
- avoid globally applying `will-change` when cards are not interactive.

---

# 19. Explicit non-goals

Do not build:

- a large team directory;
- more than two founder cards;
- employee cards;
- biographies that expand on click;
- modals;
- founder profile routes;
- social-media icon clusters inside the cards;
- Tilted Card’s mouse-following tooltip;
- Hover.dev’s `MORE` action;
- image flipping;
- draggable cards;
- stacked cards;
- a carousel;
- an infinite gallery;
- heavy perspective rotation;
- a 1.1 hover scale;
- WebGL image distortion;
- glossy 3D materials;
- glassmorphism;
- gradient-heavy card surfaces;
- fake metrics;
- mission / vision / values sections;
- a long company timeline;
- another Contact page / Contact CTA;
- modifications to the separately developed top-right `LET'S TALK` panel.

---

# 20. Locked decisions

The following are locked by this design:

- About is short: three sections only;
- people-first direction;
- exactly two real founder names and real photos;
- founder images are chosen / approved by the user;
- founders section is the main visual chapter;
- portrait cards, not square cards;
- starting card ratio `4:5`;
- both cards same dimensions;
- React Bits Tilted Card provides the reference for pointer tilt mechanics;
- Hover.dev Reveal Cards provides the reference for image-moves-to-reveal-information behavior;
- the final card is a custom Weberaise component, not a pasted stock component;
- card frame never changes size on hover;
- photo moves downward inside `overflow: hidden` frame;
- target exposed top area ~25–30%, initial target ~27%;
- bottom torso crop is intentional;
- role / title appears in the revealed upper band;
- no `MORE` button or click action;
- tilt is subtle (~4deg X / ~6deg Y range), not React Bits’ default 14deg amplitude;
- hover scale nearly neutral, never 1.1;
- reveal amount is binary hover state, not cursor-position scrubbed;
- pointer movement controls tilt only;
- no tooltip following the mouse;
- no card click behavior;
- coarse pointer / mobile removes tilt and hover dependency;
- reduced motion removes the transform choreography;
- use existing `framer-motion`; do not add `motion` only for this card;
- use existing Weberaise tokens and typefaces;
- About opening may reuse existing Silk as a restrained background, without shader changes;
- approach section is a compact three-part close;
- no additional big CTA at the bottom.

---

# 21. Tunable values during browser art direction

These are intentionally left as browser-QA tuning parameters rather than conceptual decisions:

- exact card width within the approved portrait proportions;
- exact radius in the 12–16px range;
- reveal shift between roughly 25–30%;
- exact maximum tilt within the restrained range;
- exact spring constants;
- exact reveal-band padding;
- exact founder crop via `objectPosition`;
- exact section gaps and responsive breakpoint between two-column and stacked founder layout;
- exact Silk visibility in the opening;
- exact copy line breaks.

Tuning these values must not change the locked interaction model.

---

# 22. Required content before production implementation is considered final

The implementation architecture can be built before final photos are ready, but production completion requires:

- founder 01 real display name;
- founder 01 real role / responsibility label;
- founder 01 approved portrait;
- founder 02 real display name;
- founder 02 real role / responsibility label;
- founder 02 approved portrait.

Until those are supplied, temporary local development assets may be used only for layout testing and must not be treated as final site content.

The user explicitly owns final portrait selection and crop art direction.

---

## Final design statement

The About page should feel like a short, confident portrait of a two-person studio.

Its signature interaction is not a generic team card. Each founder is shown in a fixed 4:5 portrait frame that responds subtly to pointer tilt. On hover, the portrait itself slides downward inside that unchanged frame, revealing a restrained founder / role band in the upper ~27% while the lower torso naturally clips away. The frame never grows, nothing says “MORE,” and nothing becomes a fake profile button.

The result should read as **one carefully authored Weberaise interaction built from two good ideas**: the physical responsiveness of React Bits Tilted Card and the layered reveal logic of Hover.dev Reveal Cards, reduced to a quieter, more premium two-founder composition that fits the rest of the site.
