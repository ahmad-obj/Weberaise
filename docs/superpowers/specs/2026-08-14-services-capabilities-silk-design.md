# Services Capabilities + Silk Environment Design

## Status and authority

This spec defines the `/services` section that follows the approved Works Bridge / `VIEW OUR WORK` CTA. It extends the existing Services experience and does not replace or alter the approved opening, centered `SERVICES` handoff, service index, surface-wave inversion, fullscreen service previews, Works Bridge DriftWall, or Work CTA behavior.

Current implementation baseline when this spec was written:

- branch: `feature/services-opening-grid`
- verified branch head before this documentation commit: `a207f85ad1f1daeb9d52240bef92cc214ca4790d`
- Works Bridge implementation is already present and remains the upstream boundary for this work.

This spec intentionally stops before designing the final Contact CTA composition. The Contact CTA will live inside the same Silk background environment, but its exact copy, hierarchy, interaction, and spacing are a separate design decision.

## References

Primary layout/composition reference:

https://www.kue.studio/about

Reference idea: the Kue Studio Values section, especially its small technical section label, editorial spacing, asymmetric distribution of concepts, strong negative space, and refusal to package each idea into a card.

Primary shader reference:

https://pro.reactbits.dev/docs/components/silk-waves

Reference idea: broad flowing silk-like folds with configurable speed, scale, distortion, curve/frequency, complexity, contrast, brightness, opacity, rotation/offset and gradient/color controls.

The goal is not to clone either reference. Weberaise combines Kue's editorial composition language with a much darker, art-directed Silk Waves environment using the existing Weberaise black/blue identity.

## Objective

The section answers a different question from the service index.

- Service index: what Weberaise sells.
- Works Bridge: a glimpse of visual proof.
- Capabilities: the disciplines and skills that sit underneath those services.

The Capabilities section should feel precise, architectural and editorial after the kinetic DriftWall. It should remain visually authored, but it must not become another dense interaction system.

The rest of the Services page, beginning after the Work CTA, should also feel like one continuous final visual chapter rather than two disconnected rectangles. The fixed Silk Waves shader becomes that shared environment for Capabilities and the later Contact CTA.

## Page journey and transition

The Works Bridge ends on true black with the centered `VIEW OUR WORK` CTA.

Immediately after the CTA, keep true black for a short visual beat. Do not introduce a divider, border, hard color change, wipe, reveal line, or obvious new-section edge.

Over approximately 30-40vh after the Work CTA, the black surface should gradually give way to the Silk environment. The visitor should first perceive ordinary black, then faint texture/light, then realize the background is alive.

The transition must feel like the plain black is dissolving away rather than like a shader component suddenly starts.

Preferred visual mechanism:

- keep the fixed shader canvas alive behind the downstream page environment;
- keep the Works Bridge itself visually opaque true black;
- use a long black transition veil/gradient at the start of the downstream environment so shader visibility rises continuously from effectively zero to its intended resting level;
- avoid a rectangular opacity animation that exposes a component boundary.

The exact implementation may use CSS layering/masks or an equivalent technique, but the visible requirement is a seamless `black -> barely perceptible silk -> full subtle silk` progression.

## Shared fixed background environment

Locked: Silk Waves is a **fixed viewport background canvas**, not a normal-flow background attached separately to Capabilities and Contact.

Capabilities and the later Contact CTA scroll over the same persistent shader state. The shader must not restart, jump, re-seed, snap to another composition, or visibly reposition at the boundary between those sections.

The fixed canvas is a background layer only. Content remains normal document flow and must never become sticky or pinned merely because the shader is fixed.

Upstream sections remain visually true black. If the fixed shader exists underneath them for architectural convenience, their opaque black backgrounds must fully conceal it until the approved transition begins.

## Shader art direction

The selected family is **React Bits Pro Silk Waves**.

The stock/demo appearance is only a behavioral reference. Weberaise treatment must be significantly darker and calmer.

### Visual character

Target impression:

**large, slow, black silk folds with deep Weberaise-blue light buried inside the material.**

The background should read as material/light, not water, smoke, aurora, plasma, mesh gradient, or cyberpunk glow.

Use:

- true black as the dominant visual state;
- deep/mid Weberaise blues derived from `#2563EB`, `#3B82F6`, and sparing `#60A5FA` highlights;
- very broad folds;
- low apparent frequency;
- slow motion;
- restrained distortion;
- enough contrast to perceive shape, but never enough to compete with typography;
- occasional brighter blue grazing highlights only where the silk form warrants them.

Avoid:

- rainbow or multi-hue gradients;
- purple/pink SaaS aurora treatment;
- obvious blob movement;
- rapid waves;
- high-frequency noisy wrinkles;
- strong bloom/glow;
- visible loop points;
- strong white highlights;
- liquid-ripple behavior.

A sensible art-direction target is for roughly 80-90% of a viewport to still read primarily as black at any moment.

### Motion

Shader movement is autonomous and continuous. It is not driven by page scrolling.

Motion should be glacial enough that the shader feels environmental rather than demonstrative. Large folds should evolve over seconds, not visibly race across the viewport.

The shader must preserve continuity while the visitor scrolls from Capabilities into Contact.

### Pointer influence

Locked: pointer influence is extremely weak.

The shader may respond subtly to cursor position through a very small distortion/light/parallax bias, but the user should not perceive it as a mouse-following effect.

The autonomous motion remains the primary source of movement. No cursor trails, ripples, displacement bursts, hover blobs, or click reactions.

### Readability

The shader is subordinate to content.

Text contrast must remain reliable regardless of shader phase. If a brighter fold passes behind important typography, the composition should still read clearly without requiring text shadows, glow, glass cards, or opaque boxes.

If necessary, the shader's overall brightness/opacity may be capped or a very subtle black content veil may be introduced globally. Do not solve readability per item with cards or local dark rectangles.

## Capabilities vertical scale

Desktop target: approximately **130-160svh**, with a preferred tuning region around 140-150svh.

This is intentionally taller than the earlier compact-ledger concept. The Kue-inspired composition needs breathing room and negative space.

The height is an art-direction target, not a forced fixed value. Content should never be clipped to satisfy a viewport-height number.

Mobile may be taller because the authored offsets collapse into a more readable vertical sequence.

## Capabilities opening

The section begins with a quiet technical label:

```text
// CAPABILITIES.
```

Below it, one short framing sentence:

```text
The disciplines we bring together to shape, build and improve digital experiences.
```

This sentence provides the context that the individual capability names intentionally omit.

The opening should be restrained relative to the giant Services masthead and Works Bridge statement. It is not another hero.

## Information architecture

Keep the three approved discipline anchors:

```text
01 // DESIGN
Art Direction
UI/UX
Responsive
Motion

02 // DEVELOPMENT
Frontend
CMS
Integrations
E-commerce

03 // IMPROVEMENT
Performance
SEO Foundations
Analytics
Iteration
```

The discipline labels provide structure but are not three cards or rigid columns.

Capability names remain **names only**. No per-capability descriptions, icons, tags, badges, pills, tool lists, fake metrics, proof points or explanatory accordions.

## Editorial composition

The visual composition should borrow the pacing logic of Kue Studio's Values section without copying its exact placements.

The 12 capability names should be distributed through the section with deliberate asymmetry and negative space. Some entries may sit near the left edge of the content grid, some may shift toward the center, and some may sit further right.

The sequence must still read naturally top-to-bottom. Visual asymmetry must not make the information order ambiguous.

Each discipline occupies a loose vertical zone rather than a boxed module. Its anchor label establishes the zone; the four capabilities then occupy authored positions within that space.

Use whitespace as a design element. Do not fill every viewport band evenly.

Desktop should feel composed rather than templated. Tablet/mobile should simplify offsets rather than preserving desktop asymmetry at the expense of readability.

## Typography

The section is primarily typographic.

- `// CAPABILITIES.` and discipline anchors may use the site's technical/mono language.
- Capability names use the primary modern display/body family already established on Weberaise, with enough scale to feel editorial but clearly below the Services masthead hierarchy.
- Category anchors are smaller and quieter than capability names.
- Indices and separators (`01 //`) are structural, not decorative noise.
- Avoid excessive uppercase if it harms scanability; category anchors remain technical and may stay uppercase.

Exact pixel sizes, line heights and tracking remain tunable during browser art direction.

## Capability interaction

Locked: **subtle typographic response** only.

On fine-pointer hover over a capability name:

- apply a small weight increase or variable-font weight shift where supported;
- slightly compress or shift letter-spacing;
- allow a tiny positional response from the adjacent index/marker if that marker is present in the final composition;
- keep movement restrained and quick enough to feel intentional, not playful.

Do not add:

- underline sweeps;
- full-word marquees;
- cards/background fills;
- glow;
- blur;
- image reveals;
- cursor replacements;
- magnetic movement;
- per-capability shader reactions;
- sound;
- navigation behavior.

Capability names are informational text, not links or buttons.

On coarse/touch pointers, the typography remains static.

## Relationship between typography and shader

The shader must not react individually to capability hover. The two systems remain deliberately decoupled:

- the Silk canvas provides slow environmental motion;
- the typography provides local, restrained pointer feedback.

This separation prevents the section from becoming another interaction demo and keeps the Capabilities content readable.

## Responsive behavior

### Desktop

Primary art-directed baseline around 1440x900:

- long 130-160svh composition;
- substantial left/right authored offsets;
- all three discipline zones clearly distinguishable;
- strong negative space;
- fixed Silk environment visible continuously;
- subtle fine-pointer typography response.

### Tablet

Reduce extreme horizontal offsets and keep the reading path obvious. Preserve asymmetry where it still feels deliberate, but do not allow capability names to collide or create awkward dead zones.

### Mobile

Do not force the desktop scatter layout onto a narrow screen.

Use a primarily vertical editorial sequence with smaller controlled indents. Discipline anchors remain clear. Capability names retain generous vertical rhythm. The shader stays fixed behind the page, but brightness/complexity may be reduced if needed for readability/performance.

No horizontal overflow is acceptable.

## Reduced motion and accessibility

Respect `prefers-reduced-motion: reduce`.

For reduced motion:

- freeze the Silk canvas into a deliberate static frame or reduce animation to effectively static;
- remove pointer-driven shader influence;
- remove or greatly reduce typographic hover motion while keeping contrast states accessible;
- keep all text and section structure intact.

Capabilities are semantic text content and should remain accessible without interaction.

The shader is decorative and must not add meaningful accessible content.

## Performance

This is the first WebGL/shader background in the Services tail, so performance discipline is mandatory.

- One fixed shader canvas shared by Capabilities and Contact; never instantiate one canvas per section.
- Prefer one RAF loop owned by the shader implementation.
- Avoid React state updates per frame.
- Clamp device pixel ratio to a sensible ceiling instead of rendering unbounded native DPR.
- Pause or substantially throttle the shader when the document is hidden.
- Consider pausing when the entire downstream environment is far outside the viewport while preserving/recovering a visually continuous state.
- Avoid expensive post-processing, bloom chains or multiple framebuffer passes unless the chosen Silk implementation requires them and browser profiling proves acceptable.
- Keep typography interaction on CSS/transform/font-axis properties where practical.
- Mobile quality may reduce shader resolution/complexity rather than changing the visual concept.

A fallback static background/frame must exist if WebGL initialization fails.

## Component boundaries and integration

Do not expand `ServicesPage.tsx` into a shader/controller monolith.

Preferred conceptual structure:

```text
ServicesRoute
├── ServicesPage
├── WorksBridge
└── ServicesTailEnvironment
    ├── fixed SilkWavesBackground
    ├── transition veil / black-to-silk handoff
    ├── CapabilitiesSection
    └── ContactSection (designed separately later)
```

Exact component names may follow repository conventions, but the responsibilities should remain isolated:

- Silk background owns WebGL/shader lifecycle, resize, reduced motion, pointer bias and performance throttling.
- Tail environment owns layering and the seamless transition from upstream black.
- Capabilities section owns semantic content, editorial positioning and hover typography.
- Contact section later consumes the shared environment without owning another shader instance.

Do not couple shader animation constants to `servicesMotion.ts`; the service menu choreography and the persistent Silk environment are independent systems.

## React Bits Pro implementation constraint

Silk Waves is the approved visual/component reference.

Implementation must use the legitimate project-accessible React Bits Pro source/package if available. If the Pro implementation is not available in the repository/runtime, do not fabricate or copy inaccessible proprietary source. In that case, reproduce the approved visual behavior with an original shader implementation based on the locked art direction, while preserving the same external design contract.

The visual result and performance requirements in this spec are authoritative; exact internal shader code is not.

## Explicit non-goals

Do not build:

- three capability cards;
- a conventional feature grid;
- accordions;
- capability descriptions;
- tool/logo clouds;
- animated counters;
- fake statistics;
- per-capability imagery;
- shader-reactive hover ripples;
- scroll-scrubbed silk motion;
- sticky capability copy;
- pinned scroll storytelling;
- aurora/mesh-gradient SaaS visuals;
- another DriftWall-like moving grid;
- a second shader for Contact.

## Locked vs tunable

Locked:

- seamless continuation after the Works CTA;
- approximately 30-40vh subtle black-to-shader transition;
- React Bits Silk Waves visual family;
- one fixed viewport shader canvas shared by the remaining Services tail;
- predominantly true-black shader with deep Weberaise-blue silk folds;
- broad, slow, restrained autonomous motion;
- extremely weak pointer influence only;
- Capabilities composition around 130-160svh;
- `// CAPABILITIES.` opening label;
- short framing sentence;
- three discipline anchors: DESIGN / DEVELOPMENT / IMPROVEMENT;
- exact approved 12 capability names;
- Kue-inspired asymmetric editorial spacing and negative space;
- names only, no per-capability descriptions;
- subtle typographic hover response;
- no cards, boxes, pills or icons;
- Contact will reuse the same shader environment rather than starting another one.

Tunable during implementation/browser QA:

- exact Silk speed, scale, distortion, curve/frequency, complexity, brightness, contrast and opacity;
- exact blue gradient stops within the approved Weberaise family;
- exact shader DPR/quality tiers;
- transition fade length within the approved ~30-40vh character;
- exact Capabilities height within ~130-160svh;
- exact authored offsets of each capability;
- exact capability type size/weight/tracking;
- exact hover weight/tracking/marker movement;
- responsive breakpoints;
- whether the transition veil is implemented with mask, gradient overlay or an equivalent seamless technique.

If a compromise is necessary, preserve in order: readability, seamless black-to-silk handoff, fixed continuous shader environment, editorial hierarchy/negative space, broad slow Silk character, performance, then exact numeric parity with the reference demo.

## Browser acceptance

Primary art-direction check around 1440x900.

Verify:

- Works CTA still ends on convincing plain true black;
- shader does not appear as a rectangular component immediately after the CTA;
- black gradually develops into visible Silk over a long subtle transition;
- shader remains fixed while Capabilities content scrolls;
- shader state is continuous and does not restart between downstream sections;
- background is mostly black, not blue-dominant;
- folds are broad, slow and silk-like rather than watery or aurora-like;
- pointer influence is barely perceptible;
- `// CAPABILITIES.` framing reads clearly;
- DESIGN / DEVELOPMENT / IMPROVEMENT remain understandable anchors without becoming three cards;
- all 12 capability names are present exactly once;
- asymmetry looks authored, not random;
- reading order remains obvious;
- negative space feels intentional;
- hover response is subtle and typographic only;
- text stays readable through all shader phases;
- no horizontal overflow.

Also verify around 1280x800, 768x1024 and 390x844, touch/coarse pointer, reduced motion, WebGL-disabled/failure fallback, background-tab resume, and lower-performance mobile quality.

## Next design step

After this spec is approved, design the final Contact CTA as a separate composition that lives inside the same fixed Silk environment. Do not implement the Contact CTA from assumptions in this document.
