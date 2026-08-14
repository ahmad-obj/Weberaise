# Weberaise Work Page — Phase 2 Project Expansion Design

**Date:** 2026-08-14  
**Branch:** `feature/work-spherical-showcase`  
**Status:** Approved direction; implementation planning pending user review.

## Purpose

Add the project-opening experience on top of the accepted Infinite Menu-style Work sphere without reintroducing the glitches, coupling, or visual discontinuity of the discarded first expansion implementation.

Phase 2 must feel like one continuous spatial system:

`interactive sphere → clicked slot resolves face-on → DOM takes ownership of selected preview → other sphere surfaces peel away → selected preview expands/flattens → normal DOM project view → reverse handoff → sphere restores exact browse context`

There is no modal, route change, separate overlay card, or abrupt cut.

---

## Locked Product Direction

The user selected and approved:

- selected project grows toward near-fullscreen;
- surrounding sphere projects peel backward/outward;
- surrounding projects fully disappear once expansion settles;
- selected project ends almost full viewport with small responsive margins;
- after expansion the page becomes normal vertical scrolling;
- selected project progressively reads flatter as it expands from sphere tile to normal website frame;
- obvious mechanical choices should be made for smoothness, performance, and visual quality without repeatedly asking the user.

---

## Core Transition Principle

Do **not** hand off an arbitrarily tilted, moving WebGL tile directly to DOM.

The reliable sequence is:

1. identify the exact clicked sphere slot;
2. stop accepting free-drag input;
3. resolve that physical slot to the front snap direction;
4. wait until it is face-on and stable;
5. establish a pixel-matched DOM frame over that stable tile;
6. only after DOM is visibly covering it, hide the selected WebGL instance;
7. expand the DOM frame while remaining WebGL instances peel/recede/fade;
8. stop WebGL/media work when the sphere is fully gone;
9. continue in normal DOM flow.

This deliberately avoids the fragile part of the old implementation: trying to bridge from a rotated/moving tile whose screen quad is changing during the same transition.

---

## Project Activation

### One interaction

A valid click/tap opens a project in one interaction.

If the clicked slot is off-center, the same activation automatically resolves it to front and continues into opening. No second click is required.

### Drag discrimination

Opening must never trigger from a drag release.

Initial thresholds:

- fine pointer maximum travel: **8 CSS px**;
- coarse/touch maximum travel: **14 CSS px**;
- maximum activation press duration: **500 ms**.

A release activates only when:

- travel stays under the appropriate threshold;
- duration stays under 500 ms;
- the release belongs to the same active pointer;
- a valid sphere instance is hit;
- phase is `sphereInteractive`.

These thresholds are implementation constants and may only be tuned after real-device QA if they produce accidental opens or missed taps.

### Picking cost

Do not run continuous picking in RAF.

Picking occurs only on activation attempts. Browse metadata continues to use nearest-front selection.

---

## Exact Physical Instance Preservation

Project identity and sphere-instance identity stay separate because projects repeat across 42 positions.

Opening stores:

- `selectedSlotId`;
- `selectedProjectIndex`;
- selected project slug;
- `preOpenOrientation`;
- `preOpenActiveSlotId`;
- `resolvedOrientation` after the clicked slot reaches the front.

Clicking two different repeated copies of the same project opens identical project content but preserves different physical sphere contexts for return.

---

## State Machine

Extend the current lifecycle to:

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

Meaning:

- `sphereInteractive`: normal Infinite Menu browsing.
- `projectResolving`: clicked slot is being brought to front; input disabled.
- `projectExpanding`: DOM owns the selected preview; sphere peels away.
- `projectViewing`: WebGL stopped; normal project scrolling active.
- `projectReturning`: reverse transition back into sphere.

---

## Resolve-to-Front Stage

Immediately after activation:

1. disable sphere input;
2. capture `preOpenOrientation` and `preOpenActiveSlotId`;
3. clear any stale snap request;
4. smoothly damp free rotational motion;
5. snap the exact clicked slot to the existing front direction;
6. keep current camera pull-back/settle behavior active;
7. wait for stable front alignment;
8. freeze the resolved orientation for handoff.

Initial handoff-ready criteria:

- selected slot/front dot product ≥ **0.9995**;
- absolute rotation velocity ≤ **0.0025**;
- both conditions hold for **2 consecutive rendered frames**.

The stage should be short and read as part of opening, not as a separate animation.

Browse metadata fades out during this stage.

---

## Live Preview → Stable Handoff Image

The selected sphere tile may currently be using a live preview texture. A DOM element cannot safely inherit the exact decoded WebGL frame without expensive canvas readback.

Therefore the selected slot transitions to its sharp poster during `projectResolving`:

- fade live-texture contribution to poster over roughly **80–120 ms** while the sphere is still resolving;
- do not hard-swap a moving video frame to poster;
- once face-on, both WebGL tile and DOM handoff frame show the same poster source.

This guarantees a deterministic visual match without `readPixels`, screenshots, or extra GPU copies.

The full/native project media can upgrade later after DOM owns the view.

---

## WebGL → DOM Handoff

Once the selected slot is face-on and stable:

- compute its screen-space rectangle from current model/view/projection state;
- create one fixed-position DOM handoff frame at exactly that rectangle;
- use the same poster and 4:3 crop currently visible on the WebGL tile;
- wait until the DOM frame is laid out/painted;
- then hide only the selected WebGL instance.

There must never be a frame where both selected representations are absent.

A very short overlap is acceptable because the DOM frame exactly covers the WebGL tile.

---

## Selected Project Expansion

### Destination

The selected preview expands to near-fullscreen with visible breathing room.

Initial desktop margins:

```text
horizontal = clamp(24px, 4vw, 64px)
top        = clamp(24px, 5vh, 56px)
```

Mobile/tablet use the same responsive clamp with the natural smaller result; minimum horizontal margin must not fall below **14px**.

The destination never becomes fully edge-to-edge.

### Curvature → flatness

No expensive mesh-curvature morph is required after handoff.

The perceived flattening comes from:

- resolving the WebGL tile face-on first;
- matching its visible rect exactly;
- transferring ownership to a normal flat DOM frame;
- expanding the frame while its corner radius decreases;
- progressively revealing more of the project media.

This keeps the visual result smooth while avoiding another shader transition system.

### Media crop transition

Sphere tiles show a fixed 4:3 crop.

The DOM handoff starts at that same crop, then expands toward the actual intended expanded-media aspect ratio.

Do **not** hard-code all real projects to 16:10. Use project media metadata/intrinsic dimensions where available. The current development placeholder source is 16:10 and should expand toward 16:10.

The media must never stretch. Use overflow/crop geometry and `object-fit: cover`/equivalent framing to reveal more of the source.

---

## Surrounding Sphere Peel

While the selected DOM frame expands, the remaining 41 WebGL instances recede as one system.

Use one global `projectOpenProgress` in the sphere engine/shader. For non-selected instances it drives:

- outward/radial recession;
- moderate scale reduction;
- alpha fade to zero.

No per-item random stagger, no wobble, and no elastic deformation.

The selected WebGL instance is handled separately and becomes hidden once DOM owns it.

At `projectOpenProgress = 1`:

- all non-selected instances are fully invisible;
- selected WebGL instance is hidden;
- WebGL RAF stops;
- sphere preview media pauses;
- only DOM project content remains.

The exact recession/scale coefficients are tuning constants for visual QA, but topology, selection, and sphere orientation must not change.

---

## Expanded Project View

After expansion, convert from fixed transition ownership to normal document flow and unlock vertical scrolling.

### Top media

The project preview remains the dominant first element.

For real projects:

- use native DOM media;
- poster stays visible until first usable video frame exists;
- full showcase video has explicit controls;
- do not autoplay full video with sound.

For development placeholders:

- use a simple clearly development-only full-preview placeholder;
- no elaborate fake case-study simulation is required.

### Compact information

Keep the page short:

```text
Project Name
Short 2–4 line brief

Services
Year
Visit Website ↗

← Back to Work
```

Do not add long case-study essays, fake metrics, testimonials, process timelines, giant tech-stack dumps, or decorative gallery clutter.

---

## Scroll Behavior

Sphere phases (`sphereInteractive`, `projectResolving`, `projectExpanding`) keep document scroll locked.

When `projectViewing` starts:

- unlock normal scrolling;
- project view begins at scroll position 0;
- focus moves to a meaningful project-view heading/control without causing a visual jump.

When return is requested from a scrolled position:

1. smoothly bring the project view back to its top transition position;
2. when near top, lock scroll;
3. start the reverse transition.

Because project content is intentionally short, this return-to-top stage should remain brief.

---

## Return to Work — Safe Reverse Handoff

The return must **not** attempt DOM → WebGL handoff into the arbitrary pre-open tilted orientation.

Safe sequence:

1. ensure project view is at top;
2. lock scroll;
3. restart sphere renderer/media in a hidden/frozen transition state at the saved **resolvedOrientation**;
4. keep non-selected sphere instances fully peeled/invisible;
5. keep the selected WebGL instance hidden;
6. shrink the DOM project frame back toward the selected slot's stable face-on screen rect at `resolvedOrientation`;
7. restore the 4:3 crop and sphere-tile corner radius;
8. when DOM and WebGL geometry match, reveal the selected WebGL instance underneath;
9. remove the DOM handoff frame;
10. restore surrounding sphere instances from peel progress 1 → 0;
11. after WebGL fully owns the view, animate sphere orientation from `resolvedOrientation` back to the exact saved `preOpenOrientation`;
12. restore `preOpenActiveSlotId`/metadata;
13. re-enable interaction only after the orientation settle completes.

This preserves exact browse context without requiring DOM to mimic an angled spherical tile.

### Focus after return

Keyboard focus returns to the semantic control for the selected project, but programmatic return focus must **not** trigger an automatic sphere snap. Sphere orientation/active metadata comes from `preOpenOrientation` and `preOpenActiveSlotId`, not from focus side effects.

---

## Engine Responsibilities

`WorkSphereEngine` gains only bounded transition APIs:

- classify click vs drag;
- one-shot slot picking on activation attempts;
- resolve an exact slot to front;
- expose handoff-ready status;
- expose stable selected-slot screen bounds;
- capture/restore orientation;
- hide/show selected instance;
- set global peel progress;
- transition selected live texture back to poster before handoff;
- pause/resume rendering/media without resetting orientation.

The engine does **not** own DOM project layout or GSAP DOM animation.

---

## React / DOM Responsibilities

`WorkPage` owns orchestration/state.

Use focused components rather than recreating one large bridge component:

- `WorkProjectTransition.tsx` — fixed DOM handoff/expansion/return ownership;
- `WorkProjectView.tsx` — normal-flow project media and compact information.

`WorkSphereCanvas` exposes the minimum imperative engine bridge needed by `WorkPage`.

---

## Animation Ownership

GSAP owns DOM transition timing because the Work opening already uses GSAP and cleanup/interruption are predictable.

WebGL owns sphere-only state.

DOM owns:

- handoff frame rect;
- corner radius;
- crop/aspect reveal;
- expanded project content entrance;
- return shrink.

WebGL owns:

- resolve-to-front;
- selected live-preview → poster stabilization;
- non-selected peel/recede/fade;
- selected instance visibility;
- orientation restore.

Never animate the same property from both systems.

---

## Motion Character

- no tile wiggle;
- no bouncy spring overshoot;
- no random peel staggering;
- use smooth cubic/quartic easing;
- selected expansion is decisive but controlled;
- sphere peel begins shortly after DOM ownership begins, not before;
- reduced motion uses short fades/scales and near-immediate resolve rather than long spatial travel.

---

## Performance Rules

- no continuous picking loop;
- no 42 DOM mirrors;
- no canvas readback / `readPixels` / screenshot capture;
- no decoder per repeated sphere slot;
- one DOM transition media element for selected project;
- poster-first handoff, full media upgrade after DOM ownership;
- stop WebGL RAF in `projectViewing`;
- pause sphere media in `projectViewing`;
- resume only during return preparation;
- no unnecessary layout polling each frame.

---

## Responsive Behavior

Desktop, tablet, and mobile use the same conceptual sequence:

`activate → resolve → handoff → expand → peel → normal project scroll`

Mobile differences are limited to:

- 14px click-vs-drag threshold;
- naturally smaller responsive margins;
- shorter transition travel if necessary;
- existing lower live-preview quality profile;
- simplified reduced-motion path.

Do not replace mobile with a modal or separate carousel.

---

## Accessibility

- canvas remains decorative to assistive technology;
- semantic project controls activate the same opening path;
- Enter/Space opens focused semantic project;
- Escape in `projectViewing` triggers return;
- focus enters the project view after expansion;
- focus returns after sphere restoration without causing a new snap;
- `prefers-reduced-motion` preserves all content/navigation;
- native links/video controls remain keyboard accessible.

---

## Failure Handling

If stable selected-slot bounds cannot be produced after resolve:

- do not attempt a broken geometric handoff;
- use a short fade from sphere to normal DOM project view;
- preserve project content and Back to Work behavior.

If WebGL is unavailable from the start:

- static fallback gallery remains;
- fallback project activation opens the same normal DOM project view without sphere transition.

If WebGL fails during return, keep the user in a valid DOM project view or static fallback; never blank the page.

---

## Testing Strategy

### State machine

Verify only valid transitions:

```text
sphereInteractive
→ projectResolving
→ projectExpanding
→ projectViewing
→ projectReturning
→ sphereInteractive
```

### Input

- fine click ≤ 8px activates;
- fine drag > 8px does not activate;
- coarse tap ≤ 14px activates;
- press > 500ms does not activate;
- off-center slot opens from one activation;
- repeated project copies preserve exact `slotId`.

### Resolve/handoff

- selected slot reaches dot ≥ 0.9995;
- velocity ≤ 0.0025 for 2 consecutive frames before handoff-ready;
- selected live texture resolves to poster before DOM ownership;
- source bounds are finite/positive;
- selected WebGL instance stays visible until DOM frame owns the same rect.

### Engine

- orientation snapshot round-trips;
- peel affects non-selected instances only;
- selected visibility toggling does not alter project mapping;
- pause/resume preserves orientation;
- return uses `resolvedOrientation` for handoff and only afterward restores `preOpenOrientation`.

### DOM

- handoff starts at engine source rect;
- destination respects responsive margins;
- source media is cropped, never stretched;
- normal scrolling unlocks only in `projectViewing`;
- return begins from top transition position;
- project content remains minimal.

### Performance

- no pick call inside RAF;
- WebGL `stop()` occurs in `projectViewing`;
- sphere media pauses in `projectViewing`;
- no DOM node per sphere instance;
- no readback/screenshot handoff.

---

## Visual Acceptance Checklist

Phase 2 is accepted when:

- clicking/tapping any visible project opens it with one interaction;
- drag releases never open projects;
- off-center clicked copy resolves to front automatically;
- live-preview → poster stabilization is not noticeable as a hard flash;
- no visible jump occurs between stable WebGL tile and DOM handoff;
- selected project expands smoothly to near-fullscreen;
- 4:3 crop reveals more media rather than stretching;
- surrounding sphere projects peel away as one system and fully disappear;
- no tile wiggle returns;
- expanded view becomes normal smooth vertical scrolling;
- sphere rendering/media stop while viewing;
- Back to Work reverses cleanly into the face-on sphere tile;
- sphere then restores the exact pre-open orientation/context;
- no blank frames, duplicate selected tiles, or flashing media swaps;
- desktop/touch feel like the same product;
- reduced motion remains coherent.

---

## Explicitly Rejected / Do Not Reintroduce

- deleted first-generation `ProjectTransitionBridge` architecture;
- moving/tilted WebGL → DOM handoff;
- DOM → arbitrary tilted WebGL return handoff;
- two-click off-center opening;
- modal project view;
- separate route for this phase;
- invisible WebGL rendering behind project view;
- continuous picking;
- canvas readback/screenshot handoff;
- elastic tile deformation/wiggle;
- random peel choreography;
- long case-study/fake proof content.

---

## Out of Scope

- project deep-link URLs/history integration;
- next/previous project navigation inside expanded view;
- multiple-media galleries;
- custom fullscreen video player;
- final real client media/copy replacement;
- homepage, Services, or global-navigation changes.
