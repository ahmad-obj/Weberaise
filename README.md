# WEBERAISE

Integrated Next.js site for Weberaise.

## Routes

- `/` — signature Homepage experience: truthful loader, masked Hero opening, interactive reveal, post-Explore ribbon narrative, purpose section, and closing Services handoff.
- `/services` — Services opening/index, service detail transitions, Works bridge, Capabilities, and Contact ending.
- `/work` — 42-slot Infinite Menu-style WebGL project sphere with project expansion/return and a no-WebGL fallback.
- `/about` — studio introduction, two-founder portrait section, and How We Work.

The current integration candidate lives on `integration/final-site`. `main` must not be promoted until the verification gate in `docs/FINAL_INTEGRATION_STATUS.md` is complete.

## Stack

- Next.js 16.3.0 / App Router
- React 19.2.8
- TypeScript 7.0.2
- GSAP 3.15.0
- Framer Motion 12.43.0
- custom WebGL/WebGL2 systems for the Homepage reveal, Services/About Silk environment, and Work sphere

## Local verification

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

Browser QA is required in addition to automated checks because the accepted experience depends on animation choreography, pointer/touch behavior, responsive geometry, WebGL ownership, and reduced-motion fallbacks.

## Integration source of truth

Read these before modifying integrated behavior:

1. `docs/superpowers/specs/2026-08-16-final-site-integration-design.md`
2. `docs/superpowers/plans/2026-08-16-final-site-integration.md`
3. `docs/FINAL_INTEGRATION_STATUS.md`
4. Homepage-specific architecture/status documents under `docs/`
5. Services/About/Work feature specs retained under `docs/superpowers/`
6. `THIRD_PARTY_NOTICES.md`

Feature ownership is deliberate: Homepage/shared experience code comes from the latest Signature branch; Services+About come from the final About branch; Work comes from the final Work branch. Do not wholesale-merge the historical donor branches into the integration branch.

## Production data boundary

The Work project records are still explicit development placeholders. They exist to exercise the accepted Work interaction system and must be replaced with verified real project content/media before the public portfolio is treated as production-ready.

The previous fake contact email has been removed. Only verified contact channels currently present in the repository are rendered.
