export type WorkPhase = 'opening' | 'empty' | 'sphereEntering' | 'sphereInteractive';

export type WorkExperienceState = {
  phase: WorkPhase;
};

export type WorkAction =
  | { type: 'EMPTY_PROJECTS' }
  | { type: 'OPENING_READY' }
  | { type: 'SPHERE_ENTERED' };

export const INITIAL_WORK_STATE: WorkExperienceState = {
  phase: 'opening',
};

export function workReducer(
  state: WorkExperienceState,
  action: WorkAction,
): WorkExperienceState {
  switch (action.type) {
    case 'EMPTY_PROJECTS':
      return state.phase === 'opening' ? { phase: 'empty' } : state;
    case 'OPENING_READY':
      return state.phase === 'opening' ? { phase: 'sphereEntering' } : state;
    case 'SPHERE_ENTERED':
      return state.phase === 'sphereEntering' ? { phase: 'sphereInteractive' } : state;
    default:
      return state;
  }
}
