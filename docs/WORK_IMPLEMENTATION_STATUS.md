# Weberaise Work Page — Implementation Status

**Branch:** `feature/work-spherical-showcase`  
**Design:** `docs/superpowers/specs/2026-08-13-work-spherical-showcase-design.md`  
**Plan:** `docs/superpowers/plans/2026-08-13-work-spherical-showcase.md`  
**Date:** 2026-08-13

## Implemented

### Route and experience state
- dedicated `/work` App Router route;
- explicit phases: opening, empty, sphere entering, interactive sphere, project opening, project showcase, project return;
- `OUR WORKS` is the only visible opening content;
- WebGL/media warm-up runs while the opening remains visually clean;
- no spinner, percentage, fake progress or project artwork visible during the opening;
- opening exits through a restrained clipped text transition;
- normal page scroll stays locked until a project showcase or honest empty/fallback state owns the page.

### Spherical project world
- direct WebGL2 renderer with one instanced rectangular project draw;
- dependency-free Weberaise vector/quaternion/matrix math;
- 12 stable icosahedron-derived directions with antipodal repetition for small project sets;
- large landscape project surfaces with shader-based rounded corners;
- enlarged sphere radius / restrained deformation so websites remain readable;
- free arcball drag in both axes;
- time-based inertia with reduced mobile/lite strength;
- soft nearest-project magnetic snapping;
- active project follows the nearest front slot;
- fine-pointer hover can override inspection, stop residual motion and receive video priority;
- drag-vs-click thresholds prevent accidental project opening;
- coarse-pointer off-center tap selects/snaps first, then active tap opens;
- keyboard arrow navigation uses the same sphere snap path;
- page/tab visibility pauses RAF and preview video work.

### Browse media
- all projects remain poster-ready through a poster atlas;
- full desktop profile caps live browse previews at three;
- weaker/mobile profiles reduce the live-video pool before reducing active-project sharpness;
- hover receives media priority without increasing the pool cap;
- `requestVideoFrameCallback` is used when supported;
- video textures upload only when a decoded frame advances;
- first video frame must be uploaded before the shader switches away from the sharp poster;
- reassignment clears old-frame state so a new project cannot briefly show another project's video;
- browse previews are muted/looping/inline;
- media derivative contract is documented in `public/work/README.md`.

### Project showcase transition
- selected WebGL project bounds are projected into CSS screen coordinates;
- fixed DOM transition bridge starts at the clicked project's real on-screen footprint;
- selected canvas surface is hidden only when the bridge visually owns it;
- surrounding sphere projects recede while selection opens;
- full project view uses native DOM/video rather than stretching the WebGL texture;
- full video has explicit controls and does not autoplay;
- project details are limited to name, category, short brief, services, year and live-site link;
- sphere render/video work stops while the full showcase owns the viewport;
- Escape or Back to Work restores the stored sphere orientation and selected project;
- return bridge hands visual ownership back to the original sphere slot and restores focus.

### Responsive / accessibility / fallback
- adaptive full/lite/mobile/reduced quality profiles;
- DPR caps and live-video-slot caps are explicit;
- reduced motion removes inertia and large motion while preserving content;
- WebGL capability failure falls back to an intentional responsive poster gallery;
- fallback projects open the same compact `ProjectShowcase` component;
- canvas is decorative to assistive technology;
- semantic DOM project buttons remain available to keyboard/screen-reader users;
- focused project controls become visibly discoverable;
- no hover dependency for core access.

### Data integrity
- production `WORK_PROJECTS` is intentionally empty until verified real project copy/media is supplied;
- project validation rejects missing content/media, invalid year, or non-http(s) live URLs;
- no fabricated clients, metrics, testimonials, awards or results are shipped;
- when production data is empty, `/work` shows the intended opening and then an honest prepared-work message rather than fake portfolio entries.

## Verification performed in this implementation session

Because the execution environment could not clone the networked repository or install project dependencies, full Next.js verification could not be run here.

A dependency-free isolated verification harness was built for the new sphere core using the same math/geometry/control code. Fresh results:

- strict TypeScript compile of sphere constants, math, geometry, selection, arcball and projection: **PASS**;
- normalized/antipodal sphere directions: **PASS**;
- rectangular project quad contract: **PASS**;
- inertial decay + reduced-motion stop: **PASS**;
- deterministic keyboard wrapping: **PASS**;
- arcball orientation normalization after movement: **PASS**;
- front-project matrix/projection produces a centered landscape screen footprint: **PASS**;
- soft magnetic snapping converges the chosen sphere direction to the front target: **PASS**;
- focused core tests: **7/7 PASS**.

Repository diff inspection confirms this branch adds Work-specific source/tests/docs and does not edit homepage or Services implementation files.

GitHub currently has no status checks attached to the branch head, so CI provides no additional verification evidence.

## Verification required on a normal checkout before integration

Run:

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Then visually verify `/work` with real production project media on:

- desktop fine-pointer;
- tablet/coarse pointer;
- narrow mobile;
- `prefers-reduced-motion: reduce`;
- browser/device where WebGL2 is disabled to inspect fallback.

## Real media still required

The sphere intentionally cannot be visually art-directed against real projects until verified project assets are supplied. For each project add the media set described in `public/work/README.md`, then add the verified record to `src/content/workProjects.ts`.

Do not merge fake fixture projects into production merely to make the sphere visible.

## Parallel-branch note

`feature/signature-intro`, floating navigation, Services, and Work have continued independently. Reconcile/rebase this Work branch against the final chosen integration branch only after those parallel changes are settled; do not resolve that by copying stale navigation/homepage files into Work.
