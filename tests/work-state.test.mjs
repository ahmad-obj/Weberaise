import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_WORK_STATE, workReducer } from '../src/components/WorkPage/workState.ts';

test('work state runs the guarded Phase 2 lifecycle and preserves exact selection', () => {
  let state = INITIAL_WORK_STATE;
  state = workReducer(state, { type: 'OPEN_PROJECT', selection: { slotId: 19, projectIndex: 1, projectSlug: 'fixture-b' } });
  assert.equal(state.phase, 'opening');

  state = workReducer(state, { type: 'OPENING_READY' });
  state = workReducer(state, { type: 'SPHERE_ENTERED' });
  state = workReducer(state, {
    type: 'OPEN_PROJECT',
    selection: { slotId: 19, projectIndex: 1, projectSlug: 'fixture-b' },
  });
  assert.equal(state.phase, 'projectResolving');
  assert.equal(state.selection?.slotId, 19);
  assert.equal(state.selection?.projectIndex, 1);

  const skipped = workReducer(state, { type: 'PROJECT_EXPANDED' });
  assert.equal(skipped.phase, 'projectResolving');

  state = workReducer(state, { type: 'PROJECT_RESOLVED' });
  assert.equal(state.phase, 'projectExpanding');
  state = workReducer(state, { type: 'PROJECT_EXPANDED' });
  assert.equal(state.phase, 'projectViewing');
  state = workReducer(state, { type: 'RETURN_PROJECT' });
  assert.equal(state.phase, 'projectReturning');
  state = workReducer(state, { type: 'PROJECT_RETURNED' });
  assert.equal(state.phase, 'sphereInteractive');
  assert.equal(state.selection, null);
});

test('empty project data retains an explicit terminal state', () => {
  const state = workReducer(INITIAL_WORK_STATE, { type: 'EMPTY_PROJECTS' });
  assert.equal(state.phase, 'empty');
});
