# Loader + Pointer Inertia Polish Design

## Goal
Refine the already-approved signature intro without changing its architecture: make the reveal footprint smaller and slightly inertial, make countdown transitions smoother and slower near zero, preserve perfect zero-to-zero registration, raise the shared hero composition slightly, invert EXPLORE over the black reveal, and update the loader tagline/line width.

## Locked behavior

### Reveal footprint and inertia
- Keep the age-aware implicit liquid-surface engine and its current clean contraction/dissolve behavior.
- Reduce the normal pointer reveal radius to a smaller footprint while keeping the stroke continuous.
- When pointer input stops, use the last measured velocity to emit a short, decaying forward afterglide for roughly 300–400 ms.
- Afterglide must be asymmetric and slightly irregular laterally, not a centered sphere that simply keeps growing.
- Faster movement may carry slightly farther; slow movement should produce little or no afterglide.
- The afterglide must be subtle enough that it reveals only a small amount beyond the stopped cursor position.
- New pointer movement immediately cancels pending afterglide emissions.
- Reduced-motion mode disables afterglide.

### Countdown motion
- Keep every integer from 100 to 0 and keep the loader centered.
- Digit replacement uses a soft crossfade plus very small vertical/scale travel.
- Transition duration should track the current countdown cadence so early fast digits do not restart a long fixed animation every few milliseconds.
- Countdown cadence progressively slows as values approach 0, with the most deliberate pacing from 5 to 0.
- Hold the real countdown `0` for about 700 ms before starting the completion choreography.

### Zero registration
- The countdown `0` and the completion-phase `0` must use the same font metrics, size, letter spacing, center coordinates, and translate transform.
- Switching from countdown phase to completion phase must not visibly jump the zero before the line animation begins.

### Loader completion copy
- Tagline is exactly: `Need a website for business?`
- Horizontal line width must comfortably cover the tagline on desktop and mobile.

### Hero placement
- Move the shared `WELCOME / TO + WEBERAISE` composition a small additional amount upward.
- Front and hidden/reveal layers remain registered because only the shared `.hero-composition` is moved.
- EXPLORE remains anchored near the bottom.

### EXPLORE inversion
- EXPLORE text and rule must appear black on the white hero and white wherever the black reveal passes behind them.
- Use difference blending rather than manually switching React state/colors.

## Non-goals
- Do not alter the loader concept, radial vignette, autonomous intro stroke, implicit-surface dissolution model, Explore-to-main transition, main page sections, or navigation.

## Verification
- Unit-test countdown timing progression and final zero hold.
- Unit-test inertial afterglide: zero/slow speed yields none; faster input emits bounded forward, shrinking samples.
- Structural tests verify shared zero class/positioning, tagline copy, widened line, raised shared composition, and EXPLORE difference blending.
- Run `npm test`, `npm run typecheck`, and `npm run build` in the network-enabled checkout.
