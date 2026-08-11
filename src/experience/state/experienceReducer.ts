export type ExperienceState =
  | 'boot'
  | 'loading'
  | 'loaderCompletion'
  | 'heroOpening'
  | 'heroInteractive'
  | 'heroExiting'
  | 'main';

export type ExperienceEvent =
  | { type: 'START_LOADING' }
  | { type: 'CRITICAL_READY' }
  | { type: 'LOADER_COMPLETE' }
  | { type: 'HERO_OPENED' }
  | { type: 'EXPLORE' }
  | { type: 'EXPLORE_COMPLETE' };

export const INITIAL_EXPERIENCE_STATE: ExperienceState = 'boot';

const TRANSITIONS: Record<ExperienceState, Partial<Record<ExperienceEvent['type'], ExperienceState>>> = {
  boot: { START_LOADING: 'loading' },
  loading: { CRITICAL_READY: 'loaderCompletion' },
  loaderCompletion: { LOADER_COMPLETE: 'heroOpening' },
  heroOpening: { HERO_OPENED: 'heroInteractive' },
  heroInteractive: { EXPLORE: 'heroExiting' },
  heroExiting: { EXPLORE_COMPLETE: 'main' },
  main: {},
};

export function experienceReducer(
  state: ExperienceState,
  event: ExperienceEvent,
): ExperienceState {
  return TRANSITIONS[state][event.type] ?? state;
}
