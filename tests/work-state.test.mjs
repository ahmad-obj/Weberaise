import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_WORK_STATE, workReducer } from '../src/components/WorkPage/workState.ts';

test('approved work state sequence is guarded', () => {
  let state = INITIAL_WORK_STATE;
  state = workReducer(state, { type: 'OPENING_READY' });
  assert.equal(state.phase, 'sphereEntering');
  state = workReducer(state, { type: 'SPHERE_ENTERED' });
  assert.equal(state.phase, 'sphereInteractive');
  state = workReducer(state, { type: 'OPEN_PROJECT', projectSlug: 'fixture-a', slotId: 3 });
  assert.equal(state.phase, 'projectOpening');
  state = workReducer(state, { type: 'PROJECT_OPENED' });
  assert.equal(state.phase, 'projectShowcase');
  state = workReducer(state, { type: 'RETURN_TO_SPHERE' });
  assert.equal(state.phase, 'projectReturning');
  state = workReducer(state, { type: 'SPHERE_RESTORED' });
  assert.equal(state.phase, 'sphereInteractive');
  assert.equal(state.selectedProjectSlug, 'fixture-a');
  assert.equal(state.selectedSlotId, 3);
});

test('project opening is rejected before sphere interaction', () => {
  assert.deepEqual(
    workReducer(INITIAL_WORK_STATE, { type: 'OPEN_PROJECT', projectSlug: 'fixture-a', slotId: 1 }),
    INITIAL_WORK_STATE,
  );
});

test('empty production data has an explicit terminal phase', () => {
  const state = workReducer(INITIAL_WORK_STATE, { type: 'EMPTY_PROJECTS' });
  assert.equal(state.phase, 'empty');
});
