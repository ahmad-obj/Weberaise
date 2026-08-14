export type WorkPhase =
  | 'opening'
  | 'empty'
  | 'sphereEntering'
  | 'sphereInteractive'
  | 'projectResolving'
  | 'projectExpanding'
  | 'projectViewing'
  | 'projectReturning';

export type WorkSelection = {
  slotId: number;
  projectIndex: number;
  projectSlug: string;
};

export type WorkExperienceState = {
  phase: WorkPhase;
  selection: WorkSelection | null;
};

export type WorkAction =
  | { type: 'EMPTY_PROJECTS' }
  | { type: 'OPENING_READY' }
  | { type: 'SPHERE_ENTERED' }
  | { type: 'OPEN_PROJECT'; selection: WorkSelection }
  | { type: 'PROJECT_RESOLVED' }
  | { type: 'PROJECT_EXPANDED' }
  | { type: 'RETURN_PROJECT' }
  | { type: 'PROJECT_RETURNED' };

export const INITIAL_WORK_STATE: WorkExperienceState = {
  phase: 'opening',
  selection: null,
};

export function workReducer(
  state: WorkExperienceState,
  action: WorkAction,
): WorkExperienceState {
  switch (action.type) {
    case 'EMPTY_PROJECTS':
      return state.phase === 'opening' ? { phase: 'empty', selection: null } : state;
    case 'OPENING_READY':
      return state.phase === 'opening' ? { phase: 'sphereEntering', selection: null } : state;
    case 'SPHERE_ENTERED':
      return state.phase === 'sphereEntering' ? { phase: 'sphereInteractive', selection: null } : state;
    case 'OPEN_PROJECT':
      return state.phase === 'sphereInteractive'
        ? { phase: 'projectResolving', selection: action.selection }
        : state;
    case 'PROJECT_RESOLVED':
      return state.phase === 'projectResolving'
        ? { ...state, phase: 'projectExpanding' }
        : state;
    case 'PROJECT_EXPANDED':
      return state.phase === 'projectExpanding'
        ? { ...state, phase: 'projectViewing' }
        : state;
    case 'RETURN_PROJECT':
      return state.phase === 'projectViewing'
        ? { ...state, phase: 'projectReturning' }
        : state;
    case 'PROJECT_RETURNED':
      return state.phase === 'projectReturning'
        ? { phase: 'sphereInteractive', selection: null }
        : state;
    default:
      return state;
  }
}
