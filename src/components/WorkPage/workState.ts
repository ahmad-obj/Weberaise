export type WorkPhase =
  | 'opening'
  | 'empty'
  | 'sphereEntering'
  | 'sphereInteractive'
  | 'projectOpening'
  | 'projectShowcase'
  | 'projectReturning';

export type WorkExperienceState = {
  phase: WorkPhase;
  selectedProjectSlug: string | null;
  selectedSlotId: number | null;
};

export type WorkAction =
  | { type: 'EMPTY_PROJECTS' }
  | { type: 'OPENING_READY' }
  | { type: 'SPHERE_ENTERED' }
  | { type: 'OPEN_PROJECT'; projectSlug: string; slotId: number }
  | { type: 'PROJECT_OPENED' }
  | { type: 'RETURN_TO_SPHERE' }
  | { type: 'SPHERE_RESTORED' };

export const INITIAL_WORK_STATE: WorkExperienceState = {
  phase: 'opening',
  selectedProjectSlug: null,
  selectedSlotId: null,
};

export function workReducer(
  state: WorkExperienceState,
  action: WorkAction,
): WorkExperienceState {
  switch (action.type) {
    case 'EMPTY_PROJECTS':
      return state.phase === 'opening' ? { ...state, phase: 'empty' } : state;
    case 'OPENING_READY':
      return state.phase === 'opening' ? { ...state, phase: 'sphereEntering' } : state;
    case 'SPHERE_ENTERED':
      return state.phase === 'sphereEntering' ? { ...state, phase: 'sphereInteractive' } : state;
    case 'OPEN_PROJECT':
      return state.phase === 'sphereInteractive'
        ? {
            phase: 'projectOpening',
            selectedProjectSlug: action.projectSlug,
            selectedSlotId: action.slotId,
          }
        : state;
    case 'PROJECT_OPENED':
      return state.phase === 'projectOpening' ? { ...state, phase: 'projectShowcase' } : state;
    case 'RETURN_TO_SPHERE':
      return state.phase === 'projectShowcase' ? { ...state, phase: 'projectReturning' } : state;
    case 'SPHERE_RESTORED':
      return state.phase === 'projectReturning' ? { ...state, phase: 'sphereInteractive' } : state;
    default:
      return state;
  }
}
