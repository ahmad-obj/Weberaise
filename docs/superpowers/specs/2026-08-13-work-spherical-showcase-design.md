# Weberaise Work Page — Spherical Project Showcase Design

**Status:** Approved design specification  
**Date:** 2026-08-13  
**Branch:** `feature/work-spherical-showcase`  
**Route:** `/work`  
**Purpose:** Define the complete visual, interaction, media, performance, accessibility, and technical direction for the Weberaise Work page before an implementation plan is written.

---

## 1. Core idea

The Weberaise Work page must not be a conventional portfolio grid, card wall, masonry showcase, or long case-study archive.

The page is an **interactive spherical project world** inspired by the spatial navigation model of ReactBits `InfiniteMenu`, but redesigned around what Weberaise actually needs to show: websites.

The user enters a full-viewport project sphere containing a small, curated set of large rectangular website previews. The sphere can be dragged in any direction, coasts with controlled inertia, then softly magnetizes the nearest project into the ideal front-facing position. The front project is the default active project; hovering another visible project temporarily overrides the active state so it can be inspected without first dragging it perfectly to center.

Each project is represented by a moving website preview rather than a static circular image. These are lightweight, short, optimized video loops in the browse state. Clicking a project does not open a generic modal and does not navigate to a conventional separate case-study page. Instead, the spherical world **transforms around the selected project**: neighboring projects move away, the selected website becomes the visual anchor, and it expands into a compact full-size project showcase.

The expanded showcase is intentionally brief. The website/video is the main proof. Supporting content is limited to:

- project name;
- a short brief;
- services;
- year;
- live website link;
- a clear return to the spherical Work world.

No long process write-up, résumé-like technology dump, fabricated metrics, unnecessary slides, or essay-length case study is part of the approved concept.

---

## 2. Relationship to the rest of Weberaise

The Work page has a distinct job inside the site:

- **Homepage:** attract, establish identity, route interest.
- **Services:** explain what Weberaise can do.
- **Work:** prove the quality of what Weberaise has made.

Therefore Work should not reuse the homepage ribbon journey as its primary interaction and should not reproduce the Services page menu-to-grid system. It may share brand tokens, navigation, typography, easing philosophy, and general motion quality, but its signature interaction is the spherical project world.

The page should feel like part of the same Weberaise product while remaining visually and mechanically distinct.

### Hard rule

The sphere and project media exist to make the **work itself** impressive. The page must never feel like an impressive WebGL demo with websites added afterward.

---

## 3. Primary reference

### ReactBits Infinite Menu

Documentation:

`https://reactbits.dev/components/infinite-menu`

Canonical source repository:

`https://github.com/DavidHDev/react-bits`

Primary TypeScript source studied:

`src/ts-default/Components/InfiniteMenu/InfiniteMenu.tsx`

Demo source studied:

`src/demo/Components/InfiniteMenuDemo.jsx`

Example CSS studied:

`src/ts-default/Components/InfiniteMenu/InfiniteMenu.css`

ReactBits is a **technical and behavioral starting point**, not the finished Weberaise design.

### Licensing note

At the time this specification was written, the ReactBits repository uses an **MIT + Commons Clause** license. Its license explicitly permits use/modification as part of an application, website, or product, while restricting selling or redistributing the components themselves as a component product. Any substantial reused source must preserve the required notice. The implementation plan must re-check the repository license before copying substantial code.

---

## 4. What the ReactBits implementation actually does

The reference was inspected at source level so later implementation work does not have to infer the behavior from screenshots.

### 4.1 Rendering architecture

ReactBits `InfiniteMenu` uses **direct WebGL2**, not React Three Fiber or a full Three.js scene.

The source:

- requests a `webgl2` context;
- uses `gl-matrix` for vectors, matrices, and quaternions;
- creates its own shaders/programs/buffers;
- uses instanced rendering for the menu objects;
- runs the interaction/render lifecycle outside React's render loop.

This is relevant to Weberaise because a lightweight direct-WebGL approach gives us full control over the spherical motion and avoids making each project a heavy React component that rerenders every frame.

### 4.2 Spherical distribution

The reference constructs an `IcosahedronGeometry`, subdivides it once, then calls `spherize(...)` using a sphere radius of `2`.

The resulting vertices become the menu item positions around the sphere.

The important idea to preserve is:

> generate a stable set of approximately even directions around a sphere, then rotate the whole distribution through quaternion/arcball interaction.

We are **not** required to preserve the reference's exact subdivision count, radius, number of instances, or duplicate-item behavior. Those are implementation parameters to tune against the approved curated density.

### 4.3 Reference item geometry

ReactBits renders each item using `DiscGeometry(56, 1)`, so the reference is visually based on circular image discs.

This is one of the major parts Weberaise must replace.

Our projects are website windows and must use **larger rectangular / squarish-landscape surfaces with restrained corner rounding**, not discs.

### 4.4 Instancing and placement

The source maintains per-instance matrices and sends them through an instanced matrix attribute. Every frame it:

1. rotates the stored sphere positions by the current control orientation;
2. calculates scale partly from depth;
3. translates each item to its spherical position;
4. orients it to the sphere;
5. uploads the changed instance matrices;
6. draws all instances with one instanced draw call.

The source also slightly stretches geometry based on rotation velocity inside the vertex shader, contributing to the dynamic moving-sphere feel.

We should preserve the **single coherent spherical transform system** and GPU-friendly instance model where appropriate, but the visible deformation must be much more restrained for Weberaise because project screenshots/videos must remain readable.

### 4.5 Arcball interaction

The reference uses a custom `ArcballControl`.

Important behavior:

- pointer down starts manipulation;
- pointer motion is projected into a virtual arcball;
- quaternion rotation is accumulated;
- pointer release allows residual rotational movement;
- rotation velocity is smoothed;
- touch scrolling is disabled on the canvas through `touchAction = 'none'` so drag interaction remains predictable.

This is the correct core family for Weberaise: drag the sphere, not a fake horizontal carousel.

### 4.6 Soft magnetic snapping

ReactBits already contains the essential behavior we approved.

When the pointer is released, it finds the sphere vertex nearest the configured snap direction, makes that item active, and calculates a `snapTargetDirection`. The arcball control then adds a lower-intensity snap quaternion that gradually aligns the selected item.

This directly supports the approved Weberaise behavior:

> free drag first, soft magnetic alignment only after the user releases and inertia settles.

The Weberaise implementation should tune the magnetic strength so it never feels like a conventional one-item-at-a-time carousel.

### 4.7 Active item logic

The reference determines an active item from the nearest sphere vertex while not dragging and exposes the active item back to React for title/description UI.

We will retain center-based active selection but extend it with the approved **hover override** behavior.

### 4.8 Camera response while dragging

The reference changes camera distance while pointer manipulation is active, using rotation velocity to contribute to the camera target. This helps the sphere feel responsive and alive during a strong drag.

For Weberaise this can be retained only subtly. We do not want extreme zoom breathing that makes websites hard to inspect.

### 4.9 Reference texture strategy

ReactBits builds a square image atlas in an offscreen 2D canvas. Each source image is drawn into a `512 × 512` atlas cell and the fragment shader chooses a cell according to the instance ID.

That strategy is efficient for static images but is **not sufficient for our video-first project previews**.

The Weberaise media architecture therefore needs a hybrid poster/video system described later in this specification.

### 4.10 Reference entrance animation

The entrance the user specifically approved comes from the **ReactBits demo wrapper**, not from the core WebGL class itself.

`InfiniteMenuDemo.jsx` initially hides the demo for about one second, then transitions a wrapper from:

- `opacity: 0` → `1`;
- `transform: scale(5)` → `scale(1)`;
- `transition: 1s ease`.

That scale-in/settle behavior is the entrance character to reproduce for the Weberaise sphere.

We should not copy the demo spinner or its arbitrary one-second fake waiting state. Weberaise uses its `OUR WORKS` opening as useful preload/warm-up time, then triggers the same **large-scale-to-normal spherical establishment** once the relevant resources are ready enough.

### 4.11 Reference overlay behavior

The example CSS hides title/description/action UI while the sphere is moving and brings it back once the sphere becomes steady.

We should preserve the underlying principle — browsing information is strongest when an item is inspectable — but our UI is different:

- browse metadata = project name + category;
- no generic circular external-link button floating at the bottom;
- no long description in the sphere state.

---

## 5. What Weberaise keeps, changes, and rejects from ReactBits

### Keep / adapt

- spherical navigation model;
- arcball-style free drag in all directions;
- quaternion-based orientation;
- controlled inertia after release;
- nearest-project soft snapping;
- center-based active project selection;
- WebGL2/direct-GPU rendering philosophy;
- GPU-friendly instance transforms;
- reference entrance character: oversized sphere settling to normal scale;
- depth-based hierarchy around the sphere;
- active metadata separate from the WebGL media surface.

### Change heavily

- circular discs → large rounded rectangles;
- square image atlas → hybrid posters + selectively live video textures;
- reference sphere curvature → visually flatter front region / larger-feeling sphere;
- reference item density → curated 5–7 visible projects;
- generic image menu → website preview gallery;
- center-only active logic → center default + hover override;
- default click/external navigation → in-place project-showcase transformation;
- generic title/description overlay → restrained name + category;
- strong motion deformation → low distortion so web designs remain legible;
- always-identical media treatment → quality tiers based on project prominence.

### Reject

- circular project artwork;
- tiny tiles;
- dense field of equally important objects;
- square-cropping websites into 1:1 atlas cells;
- full-quality videos playing on every object simultaneously;
- direct navigation away from `/work` when a project is selected;
- generic modal overlay;
- long case-study copy;
- spinner-based opening;
- decorative background behind the initial `OUR WORKS` state;
- intentionally pixelated or visibly degraded preview media;
- dependence on hover for core functionality.

---

## 6. Work page state model

The page should be designed as a small explicit experience state machine rather than scattered booleans.

Conceptually:

```text
opening
→ sphereEntering
→ sphereInteractive
→ projectOpening
→ projectShowcase
→ projectReturning
→ sphereInteractive
```

Fallback/reduced-motion paths may shorten transitions but must preserve the same semantic states.

### `opening`

Only `OUR WORKS` is presented. Sphere resources and initial project media warm in the background.

### `sphereEntering`

Opening copy transitions away. Sphere establishes itself with the ReactBits-inspired scale-in motion. Input remains temporarily controlled until the entrance is sufficiently settled.

### `sphereInteractive`

Drag, inertia, hover override, magnetic snapping, project metadata, and project selection are available.

### `projectOpening`

Sphere interaction freezes. The selected project becomes the anchor; other sphere items clear outward/recede. The selected website transitions into the full project showcase.

### `projectShowcase`

The large project video dominates. The short supporting project information and live link are available. Normal page scrolling is allowed for the compact supporting content if needed.

### `projectReturning`

The project showcase collapses/re-hands off to the stored sphere orientation. The spherical world reconstructs and interaction returns.

---

## 7. Opening experience: `OUR WORKS`

### 7.1 Visual

The route initially shows only:

```text
OUR WORKS
```

No visible sphere.
No decorative 3D scene.
No project thumbnails leaking through.
No WebGL effect competing with the words.
No separate loader UI.

The underlying page surface follows the approved Weberaise visual system, but this state should visually read as **plain, intentional space plus the words `OUR WORKS`**.

### 7.2 Purpose

The opening is both an art-directed introduction and a hidden preparation window.

While it is visible, the application may:

- initialize the Work WebGL context;
- compile sphere shaders;
- allocate sphere buffers and media textures;
- build project geometry/distribution;
- load project metadata;
- preload poster images;
- create/decode the most important lightweight browse video loops;
- warm the initially active project preview;
- warm a limited number of neighboring project previews;
- prepare the starting sphere orientation;
- prepare the first selected-project metadata.

### 7.3 It is not a fake loader

`OUR WORKS` must never become a progress screen.

No percentage.
No spinner.
No “loading projects”.
No need to block until every project/full video is ready.

The opening choreography gets its intended short visual duration. At the transition boundary, the sphere only needs enough media to enter cleanly. Anything noncritical may begin as a crisp poster and upgrade to motion without a flash.

### 7.4 Exit

The text exits through a **simple restrained text transition**.

Approved character:

- clip/mask and/or small directional translation;
- optional light opacity support;
- short and composed;
- no letter explosion;
- no letters flying into the sphere;
- no fake depth choreography;
- no complex particle conversion.

The Work page saves its spectacle for the actual project world.

---

## 8. Sphere entrance

Immediately after `OUR WORKS` clears, the sphere enters using the **same core visual idea as the ReactBits demo entrance**.

### Approved character

The spherical field begins substantially oversized/zoomed and settles toward its normal presentation scale, while becoming fully visible.

The reference uses `scale(5) → scale(1)` on a wrapper over `1s ease`. Weberaise does not have to use those literal values in production; the implementation should tune them so the entrance feels equally decisive without creating clipping, nausea, or an absurd fisheye burst with our larger rectangular media.

### Rules

- no spinner between copy and sphere;
- no empty pause;
- no additional wipe;
- no duplicate sphere flash;
- sphere media is already poster-ready before visibility;
- interaction activates only once the sphere is stable enough to avoid fighting the entrance animation;
- reduced-motion mode replaces the large scale travel with a short opacity/scale settle.

---

## 9. Spherical project world

### 9.1 Core geometry

The core remains a sphere.

The user explicitly chose the spherical model over a cylinder, wall, or free spatial plane.

However, the front of the sphere must feel **less curved than the default ReactBits presentation** so project websites remain readable.

This should be achieved through camera/sphere geometry and item layout rather than flattening the entire concept into a fake 2D carousel.

Intended result:

- front project: nearly front-facing and highly readable;
- immediate neighbors: clearly part of a curved sphere but not severely distorted;
- farther peripheral projects: stronger angular/depth falloff, helping communicate spherical form;
- back-side projects: naturally hidden/cropped by depth/culling.

### 9.2 Project surfaces

Projects are **landscape rectangular website surfaces**.

Direction:

- meaningfully larger than ReactBits discs;
- approximately website/browser-preview proportions rather than square thumbnails;
- restrained rounded corners;
- enough width to read the design language of the website;
- no fake browser chrome unless a particular project presentation explicitly needs it;
- preserve the website capture/video itself as the visual focus.

Exact aspect ratio is a tuning parameter because different project recordings may vary, but the shared gallery system should normalize them into one coherent project-frame family.

### 9.3 Curated density

Approved density: **cinematic / curated**.

Normal desktop target:

- approximately **5–7 project objects visibly contributing to the composition**;
- one dominant front/active project;
- 2–3 meaningful neighboring projects;
- remaining visible objects partially entering/leaving or occupying peripheral depth;
- generous negative space.

This is not a dense “universe of thumbnails.”

The sphere may contain more project positions overall than are visibly prominent at once, but the visible composition should still feel sparse and intentional.

### 9.4 Depth hierarchy

The project nearest the ideal front direction is visually dominant.

As objects move away from the front:

- apparent scale reduces;
- perspective angle increases;
- media priority decreases;
- metadata visibility decreases;
- video playback priority decreases;
- opacity may reduce subtly if depth readability needs it, but avoid fog-like fading.

The sphere should never show seven equally loud moving videos.

---

## 10. Sphere interaction

### 10.1 Dragging

The user can drag in any direction, rotating the spherical world through an arcball/quaternion interaction.

Desktop:

- pointer drag;
- grab/grabbing cursor treatment may be used if consistent with final cursor system.

Touch:

- direct one-finger drag on the sphere;
- prevent the browser from interpreting the gesture as page scroll while the sphere is the active full-screen interaction.

### 10.2 Inertia

On release, meaningful drag velocity should continue briefly.

It must feel:

- smooth;
- physical;
- controlled;
- quickly understandable.

It must not feel:

- endlessly spinning;
- slippery;
- impossible to stop;
- like a game globe with exaggerated momentum.

### 10.3 Soft magnetic snapping — LOCKED

When free inertia reduces, the nearest project is gently attracted to the ideal front-center viewing direction.

This is a **soft magnet**, not carousel snapping.

The user should still feel they are manipulating a continuous sphere.

### 10.4 Active project — LOCKED

Default active project:

> whichever project is nearest the front-center ideal direction after/while the sphere settles.

Active state controls browse metadata and media quality priority.

### 10.5 Hover override — LOCKED

On fine-pointer devices, hovering another visible project temporarily makes it the inspection target even if it is not the mathematically closest front project.

While a project is deliberately hovered:

- its project name/category becomes the primary browse metadata;
- its visual emphasis increases subtly;
- sphere inertia should pause or strongly damp so the target does not move away under the user's pointer;
- the project should not violently jump to the center;
- leaving hover returns control to the positional active-project system.

Hover is an enhancement, not required for access.

### 10.6 Movement-state UI

While the user is actively throwing/dragging the sphere, detailed metadata should de-emphasize rather than jitter between projects every frame.

Once the movement becomes inspectable, project name/category can settle back in.

This preserves the good principle from the ReactBits example while using Weberaise-specific content.

---

## 11. Browse-state project information

Approved information density: **name + category only**.

Example structure:

```text
ROSA MEDICAL
WEB DESIGN / DEVELOPMENT
```

No paragraph description in the sphere.
No year.
No services list.
No technology stack.
No giant button cluster.

The preview itself should remain the dominant proof.

The metadata should be DOM text rather than baked into the WebGL texture so it stays crisp, accessible, responsive, and easy to animate independently.

---

## 12. Browse-state video system

This is a defining Weberaise difference from ReactBits.

### 12.1 Purpose

Every project should feel like a **real website in motion**, not a static screenshot portfolio.

The browse state therefore uses short website preview videos/recordings.

These are not the same asset as the full project showcase video.

### 12.2 Preview loops

Browse media should be generated specifically for the sphere:

- short;
- muted;
- loopable;
- cropped/framed specifically for the project surface;
- compressed for fast decoding;
- enough motion to communicate the website;
- high enough source resolution that the front project never looks blocky or visibly upscaled.

The exact codec/bitrate/resolution ladder will be selected during implementation planning and profiling. The design requirement is visual:

> optimization must be largely invisible. Performance is achieved through selective playback, resolution tiers, and preload strategy — not by allowing the active website to look pixelated.

### 12.3 Playback priority

Do **not** decode and upload a live full-motion video for every sphere object.

Use project prominence tiers.

#### Tier 1 — active/front project

- live optimized browse preview;
- highest browse-preview quality;
- normal target frame cadence;
- continuously updated while visible/active.

#### Tier 2 — closest meaningful neighbors

- optionally live lighter preview;
- may use lower frame cadence/resolution if necessary;
- only a small bounded number may be live at once.

#### Tier 3 — peripheral/back projects

- crisp poster frame;
- no continuous video decoding/upload;
- promote to a video tier as the project approaches importance.

A good initial performance target is **only about 3 meaningful video previews live at once**, but the final number should be decided by profiling on integrated-GPU hardware rather than treated as an arbitrary law.

### 12.4 Poster → motion promotion

Every project has a poster asset matching the preview composition.

When a peripheral project is promoted to active/live status:

- its video element is already prepared where possible;
- first decoded frame should visually match or closely match the poster;
- transition from poster to video should be seamless;
- no black frame;
- no layout jump;
- no obvious sudden resolution pop.

### 12.5 Likely WebGL media architecture

ReactBits uses one static image atlas. That cannot simply be replaced with an atlas of always-updating videos.

Recommended design architecture:

1. retain an efficient poster atlas/texture strategy for all project instances;
2. maintain only a small pool of live `HTMLVideoElement` sources for high-priority projects;
3. upload those live frames into dedicated WebGL textures (or a small texture/array pool) only when the source has advanced;
4. the project fragment shader chooses between the poster atlas and an assigned live-video texture slot;
5. reassign live slots as project priority changes.

Use `requestVideoFrameCallback` where supported so video textures update when decoded video frames actually advance instead of blindly uploading the same frame every RAF.

This preserves the sphere as one coherent GPU scene while bounding decode/upload work.

### 12.6 No exploded pixels

The front project must never look like a tiny web thumbnail stretched across a large GPU quad.

Quality selection must consider projected display size. The active video derivative should have sufficient effective pixel density for its on-screen footprint under the current DPR cap.

If a higher-quality browse source is not ready, it is better to hold a sharp poster briefly than display visibly broken/pixelated video.

---

## 13. Project selection

Clicking/tapping a project selects it for the expanded showcase.

This is not a route-to-another-page animation and not a generic modal.

### 13.1 Click semantics

Fine pointer:

- click a visible project → select/open it;
- hover can inspect before clicking.

Touch:

- dragging must never accidentally open a project;
- a clear tap on the current/front project opens it;
- tapping a meaningful off-center project may first make it the selected/snap target so touch users receive the equivalent of hover inspection before opening.

### 13.2 Freeze interaction

As project opening begins:

- stop accepting sphere drag input;
- cancel/damp remaining inertia;
- lock the chosen project identity;
- do not allow active selection to change halfway through the transition.

---

## 14. Sphere → project showcase transformation

Approved model: **the sphere transforms into the project showcase**.

Not a modal.
Not a separate route reload.
Not simply detaching one card while the sphere continues spinning behind it.

### 14.1 Choreography

1. Selected project is locked.
2. Sphere movement settles/stops.
3. Neighboring projects move outward/recede/clear the composition.
4. Selected project straightens toward a presentation orientation if needed.
5. Selected project grows into the dominant large video canvas.
6. Browse metadata transitions into the compact project-showcase information system.
7. Once the cinematic transformation settles, normal vertical scrolling becomes available for the small amount of supporting information.

### 14.2 Spatial continuity

The user should perceive that the **same project they clicked became the expanded showcase**.

Because the browse object lives in WebGL while the expanded experience benefits from native DOM/video quality and controls, the implementation should use a controlled visual handoff rather than pretending one technology can do everything.

Recommended handoff:

1. compute/project the selected WebGL quad's screen-space bounds;
2. create the expanded DOM/video presentation at the exact corresponding screen geometry;
3. transfer/crossfade the same media frame/content into that DOM element while the WebGL selected surface is still aligned underneath;
4. once visually indistinguishable, allow the DOM/video element to complete the expansion;
5. fade/retire the sphere canvas behind it.

This gives us:

- spatial continuity;
- high-quality native large video;
- better media controls;
- easier responsive project text/layout;
- ability to suspend the expensive sphere renderer while the project is open.

### 14.3 Surrounding projects

Other projects should not remain loudly visible behind the selected showcase.

They move out/recede as part of the transition so the selected website becomes the entire visual focus.

Avoid:

- random explosion;
- excessive particle-like scattering;
- wildly different trajectories;
- long theatrical delays.

The movement should feel like the spherical collection reorganizes itself around the choice.

---

## 15. Expanded project showcase

The expanded state is **not a full conventional case study**.

### 15.1 Primary hierarchy

The **full-size website showcase video** is the hero.

It should occupy the majority of the initial expanded viewport and immediately show the work at meaningful scale.

The video should not be treated as a small card beside a giant headline.

### 15.2 Full video behavior

Browse previews are deliberately lightweight snippets.

Expanded state provides access to the richer/full project video.

The user should have an explicit, understandable control to play the full presentation. Do not force the full high-bandwidth video to autoplay merely because the project was selected.

Possible presentation characteristics:

- large poster/initial frame;
- clear play affordance;
- native/custom controls consistent with accessibility requirements;
- full-quality source loaded on demand or promoted when project opening begins, depending measured cost.

### 15.3 Project information — LOCKED MINIMAL SET

Only:

- **Project name**
- **Short brief**
- **Services**
- **Year**
- **Visit Website ↗**

The brief should be concise — enough to explain what the project was and what Weberaise contributed, not a long narrative.

### 15.4 Explicit exclusions

Do not automatically add:

- technology stack;
- long process timeline;
- challenge/solution/result essay;
- fake conversion percentages;
- fake client quotes;
- fabricated awards;
- dozens of screenshots;
- huge project-navigation chapters;
- decorative content merely to make the page longer.

If verified proof later exists and deserves placement, it can be designed deliberately rather than becoming a template requirement.

### 15.5 Scroll model

Approved: **hybrid**.

- sphere and project-opening transformation are viewport-controlled/cinematic;
- once the project hero is established, normal scrolling unlocks;
- the supporting information can live directly below/around the video;
- because content is intentionally short, the project should remain compact.

---

## 16. Returning to the sphere

The expanded project must provide a clear return action.

Return should preserve continuity:

1. lock showcase interaction during return;
2. move the large media presentation back toward the stored selected-project screen position;
3. hand visual ownership back to the WebGL project surface;
4. restore the stored sphere orientation;
5. neighboring projects return;
6. sphere interaction unlocks;
7. previously selected project remains the front/active project so users never lose their place.

Do not reset the sphere randomly after every project.

The return can be a visually simplified inverse rather than mathematically reversing every frame, but the spatial relationship must remain believable.

---

## 17. Project data model

The Work page should be data-driven from the start.

Conceptual project shape:

```ts
interface WorkProject {
  slug: string;
  name: string;
  category: string;
  brief: string;
  services: string[];
  year: string;
  liveUrl: string;

  media: {
    poster: string;
    browsePreview: string;
    showcasePoster: string;
    showcaseVideo: string;
  };
}
```

Additional internal media variants may be generated for quality tiers without expanding the editorial content model.

No placeholder project claims should ship as real portfolio proof.

---

## 18. Media preparation pipeline

The visual quality of this page depends as much on media preparation as on WebGL code.

For every project, prepare:

### 18.1 Poster

- exact crop/composition used by the sphere;
- sharp at the maximum expected browse footprint;
- modern compressed image format where supported;
- first-frame relationship to preview video designed to prevent a visible swap.

### 18.2 Browse preview

- short motion excerpt;
- no audio;
- optimized for looping and seeking/decoding;
- generated specifically for sphere usage;
- not the original giant screen recording simply resized by the browser at runtime.

### 18.3 Showcase video

- higher quality;
- larger presentation;
- full/meaningful website walkthrough;
- loaded later than browse previews;
- should not block initial sphere readiness.

### 18.4 Showcase poster

- high-quality frame shown before explicit full-video playback;
- allows project showcase to appear immediately while full media buffers.

---

## 19. Loading and performance strategy

Performance is a first-class requirement because this page combines WebGL, several media assets, sphere interaction, and transitions.

### 19.1 Initial Work preload priorities

During `OUR WORKS`, prioritize:

1. Work-page component JS required to enter the sphere;
2. WebGL shader/program compilation;
3. sphere buffers/geometry;
4. project metadata;
5. all immediately visible poster frames;
6. active project's browse preview;
7. closest 1–2 neighboring browse previews;
8. only then other lightweight previews.

Do not preload full showcase videos for every project.

### 19.2 Progressive readiness

Sphere entrance may proceed when:

- WebGL is ready;
- sphere geometry is ready;
- visible projects all have crisp posters;
- at least the main/front preview is motion-ready or can upgrade immediately after entry.

The page does **not** need to hold `OUR WORKS` until every video is decoded.

### 19.3 Render-loop discipline

- no React state updates on every sphere frame;
- interaction orientation/velocity stays in refs/classes/GPU state;
- React receives only meaningful state boundaries such as active-project changes, movement state, or experience state;
- pause/suspend the sphere RAF/render work when project showcase fully owns the viewport;
- resume intentionally before/while returning;
- clean up video texture sources when no longer needed;
- avoid unnecessary WebGL resource reallocation on ordinary pointer movement.

### 19.4 DPR and GPU cost

Render resolution should be profiled and capped where appropriate. The scene is dominated by project media, so wasting fill rate at extreme device DPR does not automatically improve perceived quality.

Use adaptive quality rather than one hard desktop setting for every device.

### 19.5 Frame target

Target a stable **60fps-class interaction on practical desktop hardware including integrated GPUs**.

If quality must adapt, adapt in this order before visibly degrading the front project:

1. reduce number of simultaneously live neighbor videos;
2. reduce peripheral video update cadence;
3. use posters farther from front;
4. cap canvas DPR;
5. reduce subtle deformation/effects;
6. adjust sphere mesh complexity.

Do **not** make the active project blurry first.

### 19.6 Visibility/page lifecycle

When the document/tab is hidden:

- pause video previews;
- suspend unnecessary sphere rendering;
- resume carefully without a burst of stale frame uploads.

---

## 20. Responsive behavior

This interaction must be designed for all screen sizes, not shrunk from desktop.

### 20.1 Desktop

- curated 5–7 visible contribution target;
- generous active project size;
- hover override available;
- multiple live preview tiers possible;
- full drag/inertia/snap character.

### 20.2 Tablet

- preserve the sphere model;
- slightly reduce visible density/project scale where required;
- no assumption of hover;
- touch drag primary;
- active/front preview retains good resolution.

### 20.3 Mobile

Do not replace the whole concept with a conventional list unless capability fallback is necessary.

Preferred mobile adaptation:

- same spherical world;
- fewer objects meaningfully visible at once;
- active/front project becomes more dominant;
- most neighbors use posters rather than live previews;
- center/front video gets the live browse slot;
- touch drag with controlled inertia;
- magnetic snap slightly stronger if needed for precision;
- project metadata positioned for small-screen readability;
- tap semantics protect against accidental opening during drag.

The sphere can feel simpler on mobile while still clearly being the same Work experience.

---

## 21. Accessibility

The WebGL canvas cannot be the only representation of the portfolio.

### 21.1 Semantic project controls

Maintain a DOM representation of the project collection/active controls so assistive technology can identify:

- project name;
- category;
- selectable project action;
- expanded state;
- live website link.

### 21.2 Keyboard

Provide a deliberate keyboard model rather than forcing users to manipulate a canvas with a mouse.

Recommended:

- arrow keys: move/select neighboring sphere targets through a deterministic project order;
- Enter/Space: open active project;
- Escape: return from project showcase where appropriate;
- visible focus state consistent with Weberaise styling.

Keyboard movement should trigger the same soft-snap selection system rather than invent a separate visual mode.

### 21.3 Video

- browse previews muted by default;
- full showcase video has accessible controls;
- no audio autoplay;
- keyboard-operable play/pause;
- project meaning must not depend on motion alone.

---

## 22. Reduced motion

`prefers-reduced-motion: reduce` should preserve the concept but substantially reduce inertial/large spatial travel.

Recommended behavior:

- `OUR WORKS` uses a brief restrained reveal/exit;
- sphere entrance uses small scale/opacity change rather than huge scale travel;
- drag can remain direct but inertia is minimal or disabled;
- snap becomes fast and controlled;
- project opening uses short shared-element/opacity/scale transition;
- browse videos may remain available if user settings/browser rules allow, but automatic motion can be reduced/paused where appropriate;
- no information is removed.

---

## 23. Capability fallback

If WebGL2 cannot initialize or the device is clearly incapable of running the experience smoothly, do not show a broken sphere.

Fallback should be intentional:

- same `OUR WORKS` opening;
- premium responsive editorial project list/grid using the same project posters;
- project name + category;
- clicking opens the same compact project showcase;
- full video and live link remain available.

The fallback is not the primary design, but it must still look like Weberaise.

---

## 24. Visual system

Use the established Weberaise brand system.

Relevant current tokens/direction:

- premium modern tech tone;
- restrained near-black/black surfaces where appropriate;
- white/off-white typography;
- Weberaise blue as the signature accent;
- existing typography family and site navigation system after branch integration.

### Hard visual don'ts

- no generic SaaS cards;
- no glassmorphism;
- no random purple gradients;
- no decorative 3D objects unrelated to projects;
- no giant glowing sphere background;
- no particle field just to make the empty space feel busy;
- no fake browser mockup clutter around every video;
- no circular project thumbnails;
- no tiny unreadable website previews;
- no excessive perspective deformation of the active website;
- no long blocks of portfolio prose.

---

## 25. Navigation integration

A separate agent is currently developing the shared floating navigation system on another branch.

The Work implementation must therefore:

- avoid rebuilding global navigation inside the Work page;
- expose normal route semantics for `/work`;
- keep Work interaction below the shared navigation layering contract;
- ensure hover/drag hit areas do not swallow global navigation input;
- integrate the final navigation branch deliberately later rather than copying a stale version into this branch.

The same applies to parallel Services-page work: Work should not import page-specific Services interactions merely for consistency.

---

## 26. Likely component boundaries

This section is architectural guidance for the later implementation plan, not a mandate to produce one giant component.

Recommended separation:

### `WorkPage`

Owns high-level experience state and project data.

### `WorkOpening`

Owns `OUR WORKS`, media warm-up readiness reporting, and its simple exit.

### `SphericalWorkGallery`

Owns canvas lifecycle and presents the sphere API to React.

### `WorkSphereEngine`

Non-React core responsible for:

- WebGL context;
- shaders;
- sphere distribution;
- project matrices;
- arcball orientation;
- inertia;
- snapping;
- picking/project hit testing;
- projection math;
- render loop.

### `WorkPreviewMediaPool`

Owns:

- poster atlas;
- browse video elements;
- project-priority assignment;
- video texture slots;
- frame upload scheduling;
- lifecycle cleanup.

### `WorkBrowseMeta`

Crisp DOM project name/category presentation.

### `ProjectShowcase`

Owns expanded large video, short brief, services, year, live link, and return action.

### `ProjectTransitionBridge`

Owns screen-space handoff between WebGL selected project and DOM showcase presentation.

These boundaries keep the renderer, media pipeline, editorial UI, and experience state independently testable.

---

## 27. Recommended technical relationship to ReactBits source

Do not paste `InfiniteMenu.tsx` into the repo and then keep adding exceptions until it becomes unmaintainable.

Better approach:

1. preserve the useful mathematical/control concepts from ReactBits;
2. carry over/adapt the arcball + quaternion + nearest-direction snapping logic where appropriate;
3. replace disc geometry entirely;
4. separate renderer from React component lifecycle;
5. design a project-specific media pool instead of extending the static atlas beyond recognition;
6. implement project picking/hover intentionally;
7. expose a small public engine API to the page;
8. preserve attribution/license notice if substantial source is adapted.

Current Weberaise `package.json` does **not** include `gl-matrix`; ReactBits does use it. The implementation plan should either add `gl-matrix` intentionally or document a strong reason to replace that math layer. Avoid bringing in Three.js merely to recreate behavior the direct-WebGL reference already handles efficiently.

---

## 28. Acceptance criteria

The Work experience is accepted only when all of the following are true.

### Opening

- `OUR WORKS` appears without visible project/background clutter;
- initial media/shader preparation happens invisibly;
- no fake progress UI;
- copy exits simply;
- no blank flash before sphere entrance.

### Sphere entrance

- entrance clearly carries the ReactBits oversized-to-normal settling character;
- projects are poster-ready on first visible frame;
- no spinner;
- no layout jump;
- interaction does not fight the entrance.

### Geometry/composition

- project surfaces are rectangular/landscape, not circular;
- active/front project is substantially larger and readable;
- front region feels less curved than default reference;
- sphere still unmistakably feels spherical;
- normal desktop composition is curated, roughly 5–7 visible contributions rather than dense clutter.

### Interaction

- free two-dimensional drag feels direct;
- release has controlled inertia;
- nearest project softly snaps when movement settles;
- snap never feels like a rigid carousel;
- center project becomes active automatically;
- hover can override active inspection without violent sphere movement;
- hover dampens/pauses unwanted inertia;
- touch does not depend on hover.

### Browse media

- front project preview is visibly sharp;
- website motion is obvious enough to understand the site is alive;
- performance system does not run full live video on every object;
- posters promote to motion without black flashes;
- peripheral optimization is not visually embarrassing;
- no audio autoplay.

### Project opening

- clicked project remains visually identifiable throughout the transformation;
- neighboring projects clear away coherently;
- selected project becomes the dominant large video presentation;
- no generic modal feeling;
- no route reload/white flash.

### Project showcase

- video dominates;
- full video has explicit play capability;
- supporting content remains minimal;
- only project name, short brief, services, year, and live link are required;
- normal scroll unlocks after cinematic opening settles;
- return to sphere preserves the previous sphere orientation/project.

### Performance

- no first-drag shader hitch after the opening warm-up;
- no uncontrolled multi-video decoding load;
- sphere render work pauses when not needed;
- active project quality is protected under adaptive performance;
- practical desktop target is stable 60fps-class interaction;
- mobile/tablet behavior remains purposeful rather than simply broken-down desktop.

### Accessibility/fallback

- keyboard can select/open projects;
- screen readers have semantic project information;
- reduced-motion path exists;
- no-WebGL fallback remains usable and visually intentional.

---

## 29. Final locked product behavior summary

The complete approved Work-page experience is:

```text
/work opens
    ↓
OUR WORKS only
    ↓
quietly prepare sphere + posters + priority preview videos
    ↓
simple OUR WORKS exit
    ↓
ReactBits-inspired large-scale sphere entrance / settle
    ↓
full-screen spherical project gallery
    ↓
free drag in all directions
    ↓
controlled inertia
    ↓
soft magnetic snap to nearest project
    ↓
front project active by default
hover can temporarily override inspection + damp movement
    ↓
large rectangular website previews
only a few priority previews actually play live video
    ↓
project name + category only
    ↓
click project
    ↓
sphere reorganizes / other projects clear away
    ↓
selected project transforms into large full-video showcase
    ↓
cinematic opening settles
    ↓
normal scroll available for compact details
    ↓
name + short brief + services + year + live website link
    ↓
return
    ↓
project hands back into preserved spherical position
    ↓
spherical gallery interaction resumes
```

---

## 30. Scope boundary for the next phase

This document is the **design source of truth** for the Work spherical showcase.

The next phase is to write an implementation plan based on this specification. That plan should cover, in concrete task order:

- exact code reuse/adaptation strategy from ReactBits;
- branch integration assumptions;
- dependencies;
- sphere engine implementation;
- rectangular geometry and picking;
- media derivative requirements;
- poster/video texture pool;
- preload readiness logic;
- opening and sphere entrance choreography;
- hover/snap/inertia behavior;
- project transition bridge;
- expanded showcase;
- mobile/reduced-motion/fallback behavior;
- tests and profiling.

No implementation should silently replace the spherical concept with a carousel, grid, cylinder, or generic case-study page without a new explicit design decision.
