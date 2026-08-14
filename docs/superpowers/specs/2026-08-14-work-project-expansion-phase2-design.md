# Weberaise Work Page — Phase 2 Project Expansion Design

**Date:** 2026-08-14  
**Branch:** `feature/work-spherical-showcase`  
**Status:** Approved direction; implementation planning pending user review.

## Purpose

Add the project-opening experience on top of the accepted Infinite Menu-style Work sphere without reintroducing the glitches, coupling, or visual discontinuity of the discarded first expansion implementation.

Phase 2 must feel like a continuation of the same spatial system:

`interactive sphere → selected project resolves to front → selected surface takes visual ownership → other sphere surfaces peel away → selected project expands and flattens → DOM project view takes over → normal vertical scrolling`

The selected website preview is the visual anchor throughout. There is no modal, route change, separate overlay card, or abrupt cut.

---

## Locked Product Direction

The user selected and approved:

- the selected project grows toward near-fullscreen;
- surrounding sphere projects peel backward/outward;
- surrounding projects fully disappear once the transition settles;
- selected project ends almost full viewport with small responsive margins;
- after expansion the page becomes normal vertical scrolling;
- selected project progressively flattens from curved sphere surface into a flat website frame;
- mechanical transition choices should be optimized for smoothness, performance, and visual quality without asking the user about obvious implementation details.

---

## Core Design Principle

Do **not** attempt to morph an arbitrarily tilted, moving WebGL tile directly into DOM.

The reliable transition is:

1. identify the clicked project instance;
2. cancel active free-drag input and smoothly settle sphere rotational velocity;
3. automatically snap that exact instance to the front target;
4. once face-on and stable, establish a pixel-matched DOM handoff frame over the selected tile;
5. hide only the selected WebGL instance after the DOM frame visually owns it;
6. animate the DOM frame toward the near-fullscreen destination while the remaining WebGL instances peel/recede;
7. stop WebGL/media work when surrounding instances are fully gone;
8. continue as a normal DOM project page.

This removes the most fragile part of the old implementation: trying to bridge from a rotated, moving, distorted tile whose exact screen quad is changing during the same animation.

---

## Project Activation

### Pointer/touch

A valid click/tap on a project surface opens it in one interaction.

There is **no two-click rule** for off-center projects.

If the clicked instance is not the active/front instance:

- the sphere first snaps that physical instance to the front;
- the opening sequence continues automatically when the snap settles;
- the user does not need to click again.

### Drag discrimination

Opening must never trigger from a drag release.

The input system tracks pointer-down position/time and accumulated travel. A release is activation only when all are true:

- travel remains below the click/tap threshold;
- pointer duration remains within a normal click/tap window;
- a sphere instance was hit at pointer-down/release;
- sphere is in `sphereInteractive` phase.

Coarse-pointer thresholds may be slightly larger than fine-pointer thresholds, but both use the same one-interaction behavior.

### Picking cost

Do not run continuous GPU/CPU picking every frame.

Picking occurs only for actual pointer/touch activation attempts. The browse experience remains driven by nearest-front selection for metadata.

---

## Exact Physical Instance Preservation

Project identity and sphere-instance identity remain separate.

Because projects repeat across the 42 slots, opening must preserve the **exact clicked sphere slot**, not merely the project index.

Store:

- `selectedSlotId`;
- `selectedProjectIndex`;
- selected project slug;
- orientation snapshot before opening;
- active slot before opening.

If the same project appears in seven repeated positions, clicking any one of those positions opens the same project content, but return restores the sphere to the exact physical/orientation context from which that copy was opened.

---

## Phase State Machine

Extend the current Phase-1 lifecycle to:

```ts
type WorkPhase =
  | 'opening'
  | 'empty'
  | 'sphereEntering'
  | 'sphereInteractive'
  | 'projectResolving'
  | 'projectExpanding'
  | 'projectViewing'
  | 'projectReturning';
```

### Meaning

- `sphereInteractive`: normal Infinite Menu browsing.
- `projectResolving`: clicked slot is being brought face-on/front and sphere input is disabled.
- `projectExpanding`: DOM handoff owns selected image; remaining sphere tiles peel away; selected preview grows/flattens.
- `projectViewing`: WebGL is stopped; normal DOM scrolling owns the page.
- `projectReturning`: reverse handoff from DOM preview back into the stored sphere context.

No ambiguous intermediate bridge phases are needed.

---

## Resolve-to-Front Stage

Immediately after a valid project activation:

1. disable sphere pointer input;
2. clear any stale snap target;
3. smoothly damp free rotational motion;
4. snap the clicked slot to the existing front snap direction;
5. keep the current camera behavior intact while the sphere settles;
6. wait until both angular velocity and front-alignment error are below strict thresholds;
7. freeze the orientation for the handoff.

This stage should be short. It exists to make the visual transfer deterministic, not to feel like a separate animation.

Metadata fades out during this stage.

---

## WebGL → DOM Handoff

### Why DOM owns the expansion

The expanded preview should be DOM/native media because it provides:

- maximum sharpness;
- normal responsive layout;
- native video controls when real showcase media exists;
- easier full-project scrolling;
- accessibility;
- lower GPU load after expansion;
- cleaner return-animation control.

### Handoff source

Once selected slot is face-on, compute its stable screen-space rectangle from the current WebGL model/view/projection state.

The handoff DOM element is created fixed-position at exactly that rectangle.

The handoff frame initially displays the same poster/live-preview visual as the selected sphere tile. For development placeholders, it uses the same project-specific placeholder identity so no content jump is visible.

The selected WebGL instance remains visible until the DOM frame has been laid out and painted in the matching location. Then the selected WebGL instance becomes hidden.

There must never be a frame where both disappear.

---

## Selected Project Expansion

### Destination

The project preview expands to near-fullscreen with responsive margins.

Desktop target:

- horizontal margins roughly 3–5vw, capped to a sensible premium page padding;
- top margin enough to avoid touching browser chrome/navigation;
- preserve a cinematic large media area;
- destination height is constrained by viewport and source media aspect ratio.

Tablet/mobile use smaller margins while preserving visible breathing room.

Do not go fully edge-to-edge.

### Curvature → flatness

The WebGL tile is curved because its subdivided mesh is reprojected to the sphere.

The DOM handoff begins only when that tile is face-on. From there the DOM frame visually becomes the flat destination, so no expensive shader-based curvature morph is required during the large expansion.

The perceived flattening is produced by:

- resolve-to-front before handoff;
- matching the curved tile's visible screen rect;
- DOM frame expanding with decreasing corner radius and no spherical distortion;
- opening the media crop progressively.

This is visually smoother and significantly simpler than trying to animate mesh curvature to zero while simultaneously matching DOM.

### Media crop transition

Sphere surfaces display a 4:3 crop of the project's website media.

During DOM expansion, animate from that same 4:3 cropped presentation toward the fuller project media aspect ratio, currently expected around 16:10 for placeholders/website previews.

The image/video is never stretched.

Use an overflow-hidden frame with animated object-position/object-fit/crop geometry so the viewer perceives more of the website being revealed as the project becomes the main view.

---

## Surrounding Sphere Peel

While the selected DOM frame expands, the remaining 41 WebGL instances recede.

The effect is spatial, not decorative:

- non-selected instances move farther from the camera / outward along their spherical directions;
- their scale reduces moderately;
- their alpha drops toward zero;
- they do not wobble or elastically deform;
- no random per-item staggering;
- the whole sphere feels like it is making room for the selected project.

Use one global `projectOpenProgress` uniform/value to drive the non-selected transformation, with the selected slot masked separately.

At the end of expansion:

- all non-selected instances are fully invisible;
- WebGL rendering is stopped;
- live sphere preview media is paused;
- only the DOM project view remains.

This is more efficient than keeping an invisible sphere rendering behind the project page.

---

## Expanded Project View

After expansion finishes, change from the fixed transition layer to normal document flow.

The page unlocks vertical scrolling.

### Top media

The large project preview remains the dominant first element.

For real projects:

- native `<video>` may replace the poster/preview once ready;
- controls are explicit;
- do not autoplay full showcase video with sound;
- preserve poster until the first usable frame is ready.

For current development placeholders:

- use a simple visual placeholder representative of a full website/project preview;
- no elaborate fake case-study simulation is required;
- clearly remain development-only.

### Compact information below

Content remains deliberately short:

```text
Project Name
Short 2–4 line brief

Services
Year
Visit Website ↗

← Back to Work
```

No:

- long case-study essay;
- fake metrics;
- fake testimonials;
- process timeline;
- giant technology stack dump;
- unrelated gallery clutter.

The Work page proves quality primarily through the website media itself.

---

## Scroll Behavior

While sphere is active:

- document scroll is locked.

During resolve/expansion:

- scroll remains locked.

Once `projectViewing` begins:

- unlock normal document scrolling;
- project page starts at scroll position 0;
- browser focus moves to a meaningful project-view control/heading without causing a visible jump.

During return:

- scroll back to project top if necessary before starting the reverse transition;
- lock document scroll again;
- only then begin the DOM → sphere handoff.

This avoids attempting a return animation from an arbitrary scrolled layout position.

---

## Return to Work

`Back to Work` reverses the same visual ownership sequence rather than cutting back to the sphere.

### Return sequence

1. ensure project view is at its top transition position;
2. lock scrolling;
3. start sphere renderer/media in a hidden/frozen state;
4. restore the saved sphere orientation and exact selected slot context;
5. keep non-selected sphere instances invisible/receded initially;
6. shrink the DOM project frame toward the selected sphere slot's stable front-facing rect;
7. progressively restore the 4:3 crop and corner radius;
8. once DOM and WebGL selected surfaces match, reveal the selected WebGL instance beneath it;
9. remove/hide the DOM handoff frame;
10. bring surrounding sphere tiles back from their peel state;
11. restore metadata;
12. re-enable sphere interaction only after settle.

### Orientation preservation

Return restores the exact saved orientation from before opening, not a generic default orientation.

Because the opening stage may temporarily rotate the clicked slot to front, the implementation must distinguish:

- `preOpenOrientation` — what the user was browsing before clicking;
- `resolvedOrientation` — temporary face-on orientation used for the visual handoff.

Return ultimately restores `preOpenOrientation` so the sphere feels spatially continuous with the user's original browse state.

The selected slot should remain the active/focused identity after return.

---

## Engine Responsibilities

`WorkSphereEngine` gains only the APIs required for this bounded transition.

Expected responsibilities:

- pointer click-vs-drag classification;
- one-shot slot picking on activation attempts;
- resolve a specific slot to front;
- expose stable selected-slot screen bounds after resolve;
- capture/restore orientation state;
- expose resolved/alignment status;
- hide/show selected instance for handoff;
- drive global non-selected peel progress;
- pause/resume rendering/media safely.

Do not make the engine responsible for DOM project layout or GSAP DOM animation.

---

## React / DOM Responsibilities

`WorkPage` owns experience orchestration and state.

A new focused component should own the DOM expansion/view layer, for example:

- `WorkProjectTransition.tsx` — fixed handoff/expansion/return visual ownership;
- `WorkProjectView.tsx` — normal-flow project media + compact information.

Do not merge both into one giant component if their lifecycle responsibilities become tangled.

`WorkSphereCanvas` exposes the minimal imperative engine bridge required by `WorkPage`.

---

## Animation Ownership

Use GSAP for DOM transition timing because the Work opening already uses GSAP and it provides predictable interruption/cleanup.

Use WebGL uniforms/engine state for sphere peel and visibility.

Do not animate the same property from both systems.

DOM owns:

- handoff frame position/size;
- corner radius;
- media crop/aspect reveal;
- project information entrance;
- return shrink.

WebGL owns:

- selected-slot resolve-to-front;
- remaining-instance peel/recede/fade;
- selected-instance visibility;
- sphere orientation restoration.

---

## Motion Character

The transition should feel controlled and premium rather than springy.

- no tile wiggle;
- no overshooting project frame;
- no bouncy spring easing;
- use smooth cubic/quartic ease curves;
- selected project expansion should feel decisive but not abrupt;
- surrounding peel should start slightly after selected frame begins taking ownership, but not as obvious per-item stagger;
- reduced-motion path uses short fades/scales and near-immediate resolve rather than spatial travel.

---

## Performance Rules

- no continuous picking loop;
- no 42 DOM mirrors of sphere tiles;
- no extra video decoder for every repeated instance;
- selected DOM preview may reuse poster first and upgrade to full media after handoff;
- stop WebGL RAF once `projectViewing` starts;
- pause sphere live-preview media while project view owns page;
- resume only during return preparation;
- keep selected transition media to one DOM image/video element;
- avoid canvas readback / `readPixels` / screenshot capture for handoff;
- no layout polling every animation frame beyond what GSAP/resize handling requires.

---

## Responsive Behavior

The same conceptual sequence must exist on desktop, tablet, and mobile:

`tap project → resolve → expand → peel sphere → normal project scroll`

Mobile differences are limited to:

- larger tap-vs-drag threshold;
- smaller destination margins;
- shorter transition travel where necessary;
- lower sphere live-preview count according to the existing quality profile;
- simpler reduced-motion behavior.

Do not replace mobile with a modal or separate carousel.

---

## Accessibility

- canvas remains decorative to assistive technology;
- semantic project controls can activate the same opening path;
- Enter/Space on a focused semantic project opens it;
- Escape while `projectViewing` triggers Back to Work;
- focus enters the project view after expansion;
- focus returns to the corresponding semantic project control after return;
- `prefers-reduced-motion` preserves content and navigation while drastically reducing spatial travel;
- native links/video controls remain keyboard accessible.

---

## Failure Handling

If selected-slot screen bounds cannot be resolved after the slot is face-on:

- do not attempt a visually broken transition;
- fall back to a short fade from sphere to normal project DOM view;
- keep the same project content and back behavior.

If WebGL capability is unavailable from the start:

- existing static fallback gallery remains;
- selecting a fallback project opens the same normal DOM project view without sphere transition.

A capability failure during return should leave the user in a valid normal project view or static fallback, never on a blank page.

---

## Testing Strategy

### State-machine tests

Verify valid guarded transitions:

```text
sphereInteractive
→ projectResolving
→ projectExpanding
→ projectViewing
→ projectReturning
→ sphereInteractive
```

Invalid events must not skip phases.

### Input tests

- click under threshold activates;
- drag over threshold never activates;
- coarse-pointer threshold is larger but bounded;
- off-center selected slot resolves and opens from one activation;
- repeated project slots preserve exact `slotId`.

### Engine tests

- selected slot converges to front before handoff-ready signal;
- orientation snapshot round-trips accurately;
- peel progress affects non-selected instances only;
- selected instance visibility can be toggled without altering project mapping;
- screen bounds are finite/positive for resolved front-facing selected slot;
- renderer pause/resume does not reset orientation.

### DOM transition contract tests

- handoff frame starts from engine-provided source rect;
- destination respects responsive margins;
- project media is not stretched;
- project view becomes normal-flow/scrollable only after expansion;
- return starts only from project-top transition position;
- full-view content remains minimal.

### Performance contracts

- no continuous pointer-picking call in RAF;
- WebGL `stop()` is called in `projectViewing`;
- media pool is paused while project view is active;
- no DOM element is created per sphere instance.

---

## Visual Acceptance Checklist

Phase 2 is accepted when:

- clicking any visible project opens it with one interaction;
- drag releases never accidentally open;
- off-center clicked instance visibly resolves to front without requiring a second click;
- there is no jump between selected WebGL tile and DOM handoff frame;
- selected project expands smoothly to near-fullscreen;
- media crop reveals more of the website instead of stretching;
- surrounding sphere projects peel away as one spatial system and fully disappear;
- the tile no longer wiggles/deforms during opening;
- expanded project view becomes ordinary smooth vertical scrolling;
- sphere rendering stops while viewing project;
- Back to Work reverses cleanly;
- exact browse orientation/context returns rather than resetting sphere;
- no blank frames, duplicate selected tiles, or flashing poster/video swaps;
- desktop and touch behavior feel like the same product;
- reduced-motion mode remains coherent and usable.

---

## Explicitly Rejected / Do Not Reintroduce

- the deleted first-generation `ProjectTransitionBridge` architecture;
- arbitrary moving/tilted tile → DOM handoff;
- two-click off-center selection;
- modal project view;
- separate route for Phase 2;
- persistent invisible WebGL rendering behind project view;
- continuous picking every frame;
- elastic tile deformation/wiggle;
- random per-tile peel choreography;
- full case-study essay or fake performance claims.

---

## Out of Scope

- URL/deep-link state for individual projects;
- browser-history integration for open projects;
- multiple project media galleries;
- next/previous project navigation inside expanded view;
- custom full-screen video player;
- final client project copy/media replacement;
- changes to homepage, Services, or global navigation.
