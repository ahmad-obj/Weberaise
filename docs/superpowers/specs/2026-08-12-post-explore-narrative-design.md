# Post-Explore Narrative Design

**Branch:** `feature/signature-intro`  
**Status:** Approved by user on 2026-08-12  
**Scope:** Home page only, immediately after the existing `EXPLORE` hero transition. The final Home → Services navbar-detach gateway is explicitly out of scope for this spec.

## Goal

Turn the existing `EXPLORE` transition into the beginning of a guided homepage narrative that immediately recognizes why a visitor may have arrived, reassures them, states Weberaise's purpose in very few words, and then summarizes the core offer visually.

The sequence must feel like one authored experience rather than four unrelated animation demos.

## Locked copy and narrative order

1. `Need a website?`
2. `Need a redesign?`
3. `Need to look better online?`
4. brief empty black breathing beat
5. `DONT WORRY. WE GOT YOU`
6. `We build websites that move businesses forward.`
7. circular service ring: `WEB DEVELOPMENT · SEO · BRANDING ·`
8. center of ring: `GROW`

`BRANDING` is the third service label because it accurately complements web development + SEO. E-commerce remains part of the web-development offering rather than becoming a separate top-level service label. Social-media marketing is not implied.

## Continuity from EXPLORE

The existing `EXPLORE` exit already switches the reveal engine to `bottomFill` and grows a black viscous mass upward until the hero is fully covered. That full black state is not a disposable overlay: it becomes the visual foundation of this post-Explore sequence.

Requirements:
- no route flash;
- no white frame between hero and narrative;
- no hard cut from the finished bottom fill to a separately painted black section;
- no rectangular wipe added on top of the existing liquid transition;
- scrolling becomes normal only after the existing `EXPLORE_COMPLETE` handoff to `main`;
- the first question is already positioned in the upcoming scroll scene, but remains visually hidden until its authored Scroll Float entrance begins.

## Scene 1 — scroll-driven visitor questions

### Reference effect

Use React Bits **Scroll Float** as the motion reference and implementation basis for the *entrance character behavior*:

- Docs/demo: https://reactbits.dev/text-animations/scroll-float
- TypeScript source reference: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ScrollFloat/ScrollFloat.tsx
- CSS source reference: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ScrollFloat/ScrollFloat.css

Relevant behavior in the reference implementation:
- text is split into individual character spans;
- characters begin at `opacity: 0`;
- characters rise from approximately `yPercent: 120`;
- characters begin vertically stretched (`scaleY: 2.3`) and horizontally compressed (`scaleX: 0.7`);
- GSAP + ScrollTrigger scrub the characters into their natural `opacity: 1`, `yPercent: 0`, `scaleX: 1`, `scaleY: 1` state;
- character stagger is approximately `0.03` in the stock component.

Do **not** treat the stock component as the complete scene. The reference only solves the entrance. Weberaise needs an authored hold and exit as part of one coordinated GSAP timeline.

### Composition

Use one sticky/pinned black narrative viewport rather than three conventional stacked sections.

Desktop target scene height: approximately `260svh`.  
Mobile target scene height: approximately `280svh` so short screens still give every question enough readable time.

The visible stage remains `100svh` while the three questions progress through it.

Questions deliberately occupy slightly different positions, forming a restrained visual path rather than appearing on top of one another or jumping randomly:

- Question 1 — `Need a website?`: approximately `x: -8vw`, `y: -7vh` from viewport center.
- Question 2 — `Need a redesign?`: approximately `x: +7vw`, `y: 0vh` from viewport center.
- Question 3 — `Need to look better online?`: approximately `x: -2vw`, `y: +7vh` from viewport center.

Responsive rule:
- clamp desktop offsets so the full line always remains inside a safe horizontal gutter;
- below tablet width, reduce offsets to roughly one third of the desktop amount;
- on narrow mobile, preserve the ordering but favor readability over lateral displacement;
- no text may touch viewport edges or navigation-safe areas.

Typography must be large and confident, but each full question must remain readable as a phrase. Avoid a scale so large that the third question breaks into awkward single-word fragments.

### Question timeline

Use one coordinated progress timeline for the sticky scene. Initial target windows:

- Q1 entrance: `0–16%`
- Q1 readable hold: `16–25%`
- Q1 exit: `25–35%`
- Q2 entrance: `30–46%`
- Q2 readable hold: `46–55%`
- Q2 exit: `55–65%`
- Q3 entrance: `60–76%`
- Q3 readable hold: `76–86%`
- Q3 exit: `86–96%`
- empty breathing beat: `96–100%`

The 5% entrance/exit overlap is deliberate. It prevents dead pops while keeping only one question dominant at a time.

### Entrance behavior

Preserve the recognizable Scroll Float character:
- characters rise into place from below;
- slight initial vertical stretch / horizontal compression;
- opacity resolves with motion rather than appearing before movement;
- stagger remains subtle and fast enough that the phrase still reads as one sentence;
- scroll controls progress directly; no animation should unexpectedly run ahead of the user's scroll.

Use the project's existing GSAP / ScrollTrigger stack rather than adding another general animation library.

### Exit behavior

Author a complementary Weberaise exit instead of simply reversing or instantly hiding the text:
- begin with a gentle upward departure;
- introduce only slight vertical compression and tiny horizontal expansion;
- opacity begins fading after physical departure has already started;
- restrained blur may be introduced only near the final edge of the exit;
- characters may leave with a very small stagger in the same reading direction;
- the phrase must remain legible through the useful portion of the exit;
- remove the old phrase completely before its ghost could visually interfere with the following reassurance.

### Explicit failures to avoid

- text materializing with no physical entrance;
- React mounting/unmounting causing one-frame flashes;
- random per-question coordinates;
- glitch aesthetics;
- excessive blur;
- characters stretched far enough to become ugly or unreadable;
- two questions equally dominant at once;
- text clipping at viewport edges;
- ScrollTrigger jumps after resize;
- layout shift as character wrappers activate;
- three unrelated full-height sections with large empty gaps.

## Scene 2 — reassurance particle formation

### Locked copy

`DONT WORRY. WE GOT YOU`

This is the emotional turn from questions/uncertainty to confidence. It must be more stable and decisive than the moving question sequence.

### Reference effect

Use React Bits **Particle Text** as the visual and algorithmic reference:

- Docs/demo: https://reactbits.dev/text-animations/particle-text
- TypeScript source reference: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/ParticleText/ParticleText.tsx

Important reference implementation behavior:
- Canvas 2D is used rather than DOM particles;
- the target text is rasterized to an offscreen canvas;
- visible glyph pixels are sampled into target particle positions;
- particles begin scattered around those target positions and gather into readable text;
- device pixel ratio is capped;
- particle count is bounded;
- the reference supports reduced motion and resize rebuilding.

### Weberaise adaptation

Do not use the stock component unchanged. Build a tuned variant appropriate to a premium landing page:

- one Canvas 2D surface for the complete reassurance;
- deterministic target sampling so the particle field does not visually reshuffle on ordinary rerenders;
- primarily Weberaise main text white (`#F5F7FA`);
- sparse blue accents using `#60A5FA` / `#3B82F6`, never a rainbow field;
- particles should start locally around their target glyphs, not from extreme screen-wide scatter;
- target scatter distance: approximately `70–110px` desktop and `45–75px` mobile;
- target gather duration: approximately `1100–1400ms` plus restrained stagger;
- particle size should remain small and crisp, approximately `1.2–2px` CSS-space depending on viewport/DPR;
- avoid large glowing balls, star shapes, confetti, spray, or meaningless particle placement;
- no pointer-repel interaction in this scene;
- no meaningful idle drift once the message is assembled;
- glow should be absent or extremely restrained.

### Performance budget

The reassurance must not become a permanent animation tax after the WebGL hero has already done substantial work.

Initial caps:
- desktop: approximately `2400–2800` rendered particles maximum;
- mobile: approximately `1200–1600` rendered particles maximum;
- DPR cap: approximately `1.5` for this canvas;
- use `ResizeObserver` or equivalent to rebuild only when size materially changes;
- wait for the actual font before sampling glyph targets;
- after gathering completes, render the settled frame and stop requesting animation frames;
- if the scene leaves the viewport during formation, pause/cancel unnecessary active work;
- restart/rebuild only when genuinely required by layout/size change, not on every React render.

Reduced-motion behavior:
- show the final readable text directly or with a very short opacity transition;
- do not scatter thousands of particles and then gather them when `prefers-reduced-motion` is active.

### Placement

After Q3 exits, preserve a short fully black breathing interval before particles begin forming. The reassurance should then assemble close to visual center with enough surrounding black negative space that the particle silhouette reads clearly.

Do not place decorative elements around it merely to fill space.

## Scene 3 — Weberaise purpose statement

### Locked copy

`We build websites that move businesses forward.`

This appears soon after the reassurance. It must not require another long empty scroll journey.

### Reference effect

Use Magic UI **Aurora Text** for selective emphasis:

- Docs/demo: https://magicui.design/docs/components/aurora-text
- Source reference: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/aurora-text.tsx

Relevant reference behavior:
- the effect is an animated multi-stop linear gradient;
- gradient is clipped to text;
- text remains accessible through a semantic/screen-reader representation;
- animation speed is controllable.

### Composition

Keep the first clause visually stable:

`We build websites that`

Apply Aurora treatment only to the meaningful outcome phrase:

`move businesses forward.`

The outcome phrase should receive the animation because it carries the value proposition. Do not apply Aurora to the entire sentence.

Use a Weberaise-specific gradient instead of Magic UI's stock pink/purple palette:

`#F5F7FA → #60A5FA → #3B82F6 → #2563EB → #F5F7FA`

Target a slow premium movement, roughly equivalent to a `14–16s` full gradient animation cycle. Avoid rapid cycling.

Typography should be large editorial display text with intentional line breaks. Preferred desktop composition is two lines when space allows:

`We build websites that`  
`move businesses forward.`

On mobile, wrapping may differ naturally but the highlighted phrase must remain contiguous and visually dominant.

The purpose statement should begin entering after a relatively short scroll movement from the settled reassurance, not after another full blank viewport.

## Scene 4 — service / growth ring

### Locked copy

Ring:

`WEB DEVELOPMENT · SEO · BRANDING ·`

Center:

`GROW`

### Reference effect

Use React Bits **Circular Text** as the reference for circular character placement and slow continuous rotation:

- Docs/demo: https://reactbits.dev/text-animations/circular-text
- TypeScript source reference: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/CircularText/CircularText.tsx
- CSS source reference: https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/TextAnimations/CircularText/CircularText.css

The stock reference relies on `motion/react` for rotation and hover behavior. Weberaise currently uses GSAP and does not have Motion installed. Do **not** add `motion/react` solely for this ring. Recreate the same visual principle with existing GSAP/CSS transforms.

### Design

- ring sits directly below the purpose statement as part of the same visual composition;
- desktop diameter target: approximately `230–260px`;
- mobile diameter target: approximately `175–200px`;
- circular copy uses compact uppercase typography with careful tracking;
- separators must have enough spacing that service names remain readable while rotating;
- center `GROW` stays perfectly stationary while the outer ring rotates;
- target base rotation: one revolution approximately every `20–24s`, linear and continuous;
- no bonkers/speed-up hover behavior;
- if the ring is not a link, do not give it a fake pointer cursor;
- its entrance can be a restrained opacity/scale settle, but the rotation itself should never pop from an arbitrary angle due to rerendering;
- stop or reduce continuous work when the element is far outside the viewport if practical without creating visible restart jumps.

### Graphic relationship to statement

The ring must feel subordinate to the value proposition, not like an unrelated badge.

Use enough vertical spacing to breathe but keep them visually connected. Initial target: approximately `clamp(2.5rem, 6vh, 5rem)` between the statement block and ring. Tune within that range only to preserve optical balance across responsive layouts.

## Motion hierarchy

The section intentionally changes motion language as the narrative progresses:

1. **Questions:** scroll-controlled, moving, unresolved.
2. **Breathing beat:** almost nothing.
3. **Reassurance:** particles organize into certainty.
4. **Purpose statement:** stable typography with selective living color.
5. **Growth ring:** calm continuous rotation.

This hierarchy is essential. Do not make every element equally animated.

## Accessibility and semantic text

- every phrase must exist as accessible semantic text even when canvas or per-character rendering is used;
- character-splitting wrappers must not cause screen readers to read one character at a time; retain an accessible whole-string representation and hide decorative character clones from assistive technology;
- particle canvas is decorative presentation of the reassurance; provide an accessible text equivalent;
- Aurora text must retain a semantic text value;
- respect `prefers-reduced-motion` across all four scenes;
- focus order must not include decorative ring characters or canvas surfaces.

## Responsive behavior

- use `svh`/modern viewport units where useful so browser chrome does not break pinned scene geometry;
- safe horizontal gutters should scale with viewport and protect text on narrow screens;
- recompute ScrollTrigger geometry after meaningful responsive layout changes;
- do not rely on fixed desktop pixel coordinates for text placement;
- mobile receives smaller position offsets, ring diameter, particle count, scatter distance, and possibly type scale while preserving the exact narrative order.

## Integration boundaries

The old downstream `MainSite` skeleton is not authoritative for content order. This narrative replaces the current first-impression direction after `EXPLORE`; do not simply append it above the old placeholder first-impression section and create redundant messaging.

Preserve existing intro architecture and state machine:

`boot → loading → loaderCompletion → heroOpening → heroInteractive → heroExiting → main`

Do not redesign or refactor the loader, hero reveal, cursor liquid, or EXPLORE bottom-fill while implementing this spec unless a separate verified regression is discovered.

Prefer existing dependencies:
- Next.js 16.3.0
- React 19.2.8
- GSAP 3.15.0

Do not add a broad animation dependency to reproduce an effect that can be implemented with the project's existing GSAP/CSS/Canvas stack.

## Explicit non-goals

- final `Visit our services` section;
- Services navbar-item detachment / drifting CTA animation;
- Services page design;
- Work page design;
- Contact page design;
- fake client work, testimonials, metrics, awards, or proof;
- rebuilding the intro;
- social-media marketing messaging;
- large decorative 3D scenes;
- another WebGL system for these text effects.

## Acceptance criteria

1. The current EXPLORE liquid bottom fill resolves directly into the black background of the first narrative scene with no visible flash or cut.
2. The three questions appear in the exact locked order and are never dumped on screen simultaneously.
3. Every question uses a recognizable Scroll Float-style character entrance and a complementary authored exit.
4. Q1, Q2, and Q3 occupy intentionally different but restrained positions; placement never looks random.
5. Every question has a clearly readable hold state before leaving.
6. No question flashes on initial mount, clips against the viewport, or becomes unreadable during its useful transition.
7. Q3 is followed by a short empty-black breathing beat.
8. `DONT WORRY. WE GOT YOU` assembles through clean, deterministic particle motion and finishes as crisp readable text.
9. Particle motion does not resemble confetti, spray, a star field, or arbitrary noise.
10. Particle rendering is bounded and stops active frame rendering after the settled state when no further animation is required.
11. The purpose statement appears close after the reassurance rather than after a large unrelated gap.
12. Only `move businesses forward.` receives the Aurora treatment.
13. Aurora colors stay within the Weberaise white/blue visual language and move slowly enough to feel premium.
14. `WEB DEVELOPMENT · SEO · BRANDING ·` rotates as a clean circular ring below the statement.
15. `GROW` remains stationary and centered inside the rotating ring.
16. The circular ring does not require installing `motion/react`.
17. Reduced-motion users receive fully readable static or minimally animated equivalents for every scene.
18. Mobile preserves the narrative and hierarchy without clipped copy, cramped ring text, excessive particles, or scroll-jank.
19. Existing loader/hero/EXPLORE behavior remains unchanged except for the intended seamless handoff into the new narrative.
20. The final Services navbar-detach gateway remains untouched by this implementation scope.
