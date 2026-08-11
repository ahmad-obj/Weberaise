- custom cursor behavior;
- autonomous stroke path;
- line motion dimensions;
- touch interaction.

Test intermediate tablet/laptop widths, not just 1440px and 390px.

---

# 27. TESTING STRATEGY

## Unit tests
At minimum:
- progress mapping;
- "0 only after critical-ready";
- every integer can be traversed;
- deterministic safe countdown positions;
- pointer interpolation;
- time-based decay;
- experience reducer transitions;
- scroll lock lifecycle;
- emitter-state behavior.

## Integration / Playwright
Test:
- initial loader visible;
- hero cannot scroll before EXPLORE;
- loader completes into hero without route reload;
- hero state becomes interactive;
- EXPLORE is keyboard accessible;
- EXPLORE transition locks scrolling during animation;
- main state unlocks scrolling after completion;
- First Impression exists immediately after handoff;
- reduced-motion mode;
- no-WebGL fallback;
- common desktop/mobile viewports.

## Visual/manual motion QA
Record or inspect:
- loader number continuity;
- 0/line/tagline masking;
- twin-line traversal;
- front/back text registration;
- fast cursor trails;
- 3–4s progressive healing;
- idle settling;
- autonomous stroke;
- Explore black fill;
- resize during/after hero;
- high-refresh display.

A technically passing implementation that looks ugly is a failed implementation.

---

# 28. PERFORMANCE VERIFICATION

Profile, do not guess.

Check:
- production build;
- bundle composition;
- initial client JS;
- shader compile timing;
- GPU frame time;
- main-thread long tasks;
- layout shifts;
- first pointer interaction;
- EXPLORE click;
- mobile-sized viewport;
- high-DPR device;
- throttled CPU profile.

Track before/after optimization evidence.

The signature effect should target smooth 60fps behavior on capable hardware and degrade intentionally on weaker devices rather than stuttering.

---

# 29. IMPLEMENTATION ORDER

Follow this order unless repo constraints require a documented change:

### Phase A — Audit
- repo
- assets
- conflicts
- dependencies
- skeleton mapping

### Phase B — Foundation
- Next.js production structure
- tokens
- fonts
- state machine
- accessibility
- loading registry

### Phase C — Loader
- real progress
- countdown
- completion line/tagline choreography

### Phase D — Hero opening
- vertical line
- twin line
- strict traversal reveal
- locked two-layer layout

### Phase E — Reveal-engine playground
- prototype candidates
- profile
- select winner
- delete production-unused experiments

### Phase F — Interactive hero
- final reveal engine
- pointer
- custom dot
- autonomous stroke
- aging/healing
- settling

### Phase G — Explore
- button
- shared bottom-fill emitter
- black fill
- state handoff
- scroll unlock

### Phase H — Main-site foundation
- preserve existing section order/content/TODOs
- implement First Impression foundation from black state
- do not invent unresolved visual choreography

### Phase I — QA
- responsive
- reduced motion
- WebGL fallback
- accessibility
- browser testing
- performance profiling
- cleanup

Do not jump straight into downstream section polish before the signature intro flow is stable.

---

# 30. DOCUMENTATION DURING IMPLEMENTATION

Maintain:
- architecture decisions;
- shader parameter meanings;
- performance profiles;
- browser/device exceptions;
- unresolved visual decisions;
- accepted deviations from master plan and why.

If a required design choice is genuinely unresolved:
- stop that specific decision;
- preserve architecture so it can be swapped later;
- continue independent work.

Do not replace an unresolved decision with a random preference.

---

# 31. CODE QUALITY

Requirements:
- strict TypeScript;
- focused modules;
- clear ownership of RAF/GPU resources;
- deterministic cleanup;
- no event-listener leaks;
- no hidden global mutable state except deliberate engine internals;
- no React rerender on pointer movement;
- no DOM layout reads in the per-frame WebGL loop;
- no dead prototype dependencies in production;
- no magic shader constants without documented parameter names;
- no monolithic hero component;
- no premature abstraction unrelated to current site needs.

---

# 32. HARD PROJECT DON'TS

Never:
- turn this into a generic SaaS website;
- use giant blue/purple gradient backgrounds everywhere;
- add random particles;
- add gratuitous 3D;
- use generic rounded card grids where the skeleton specifies editorial treatment;
- invent proof/testimonials/client data;
- fake loader progress;
- replace masking transitions with plain opacity fades because they are easier;
- use a watery full-screen fluid simulation;
- allow the reveal to become a tiny flashlight;
- allow hero typography layers to drift out of registration;
- enable scrolling before EXPLORE;
- make EXPLORE a route reload;
- add heavy dependencies without measuring their value;
- sacrifice readability for spectacle;
- sacrifice spectacle quality by using obviously cheap substitutes;
- make every section equally animated.

---

# 33. DEFINITION OF DONE FOR CURRENT IMPLEMENTATION MILESTONE

The current milestone is complete only when:

1. production architecture exists and is clean;
2. real loader works;
3. countdown is truthful and complete;
4. loader completion choreography is polished;
5. twin-line hero reveal is traversal-accurate;
6. two hero layers are pixel-registered;
7. the chosen semi-fluid reveal feels thick, viscous, rounded and controlled;
8. cursor trail has correct footprint and 3–4s age-based healing;
9. idle settling is subtle;
10. autonomous intro stroke uses same engine;
11. custom dot works on fine pointers;
12. hero does not scroll;
13. EXPLORE launches the bottom-edge viscous black fill;
14. black fill becomes First Impression background;
15. scroll unlock is seamless;
16. reduced-motion / no-WebGL fallbacks are intentional;
17. no fake content was introduced;
18. production build/tests pass;
19. performance has been profiled and obvious regressions fixed;
20. code is ready for the next design phase: full First Impression and downstream section art direction.

---

# 34. EXECUTION BEHAVIOR

Before implementation:
1. read all required sources;
2. inspect repo;
3. summarize contradictions and final interpretation;
4. write a concrete implementation plan with exact files/tasks;
5. implement in isolated, testable phases;
6. verify each phase before moving on;
7. perform final visual/performance/accessibility verification;
8. report only verified results.

Do not claim success based on code appearance.
Use evidence: tests, production build, screenshots/visual inspection, and profiling.

