import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { getGroupState, toggleGroupSelection } from './selectionHelpers.js';

const group = [
  { value: 200, label: 'Aktiv' },
  { value: 210, label: 'Premium' },
];

describe('getGroupState', () => {
  it('01: unchecked when nothing of the group is selected', () => {
    assert.deepEqual(getGroupState(group, []), { checked: false, indeterminate: false });
    assert.deepEqual(getGroupState(group, [300]), { checked: false, indeterminate: false });
  });

  it('02: indeterminate when only some of the group is selected', () => {
    assert.deepEqual(getGroupState(group, [200]), { checked: false, indeterminate: true });
    assert.deepEqual(getGroupState(group, [210, 300]), { checked: false, indeterminate: true });
  });

  it('03: checked when the whole group is selected', () => {
    assert.deepEqual(getGroupState(group, [200, 210]), { checked: true, indeterminate: false });
    assert.deepEqual(getGroupState(group, [300, 210, 200]), {
      checked: true,
      indeterminate: false,
    });
  });

  it('04: an empty group is never checked', () => {
    assert.deepEqual(getGroupState([], [200]), { checked: false, indeterminate: false });
  });

  it('05: falsy checkbox values work', () => {
    const falsyGroup = [{ value: 0 }, { value: false }];
    assert.deepEqual(getGroupState(falsyGroup, [0, false]), {
      checked: true,
      indeterminate: false,
    });
    assert.deepEqual(getGroupState(falsyGroup, [0]), { checked: false, indeterminate: true });
  });
});

describe('toggleGroupSelection', () => {
  it('01: selects all group members when none are selected', () => {
    assert.deepEqual(toggleGroupSelection(group, []), [200, 210]);
  });

  it('02: completes a partial selection without duplicating values', () => {
    assert.deepEqual(toggleGroupSelection(group, [200]), [200, 210]);
  });

  it('03: deselects all group members when all are selected', () => {
    assert.deepEqual(toggleGroupSelection(group, [200, 210]), []);
  });

  it('04: keeps selections outside of the group untouched', () => {
    assert.deepEqual(toggleGroupSelection(group, [300]), [300, 200, 210]);
    assert.deepEqual(toggleGroupSelection(group, [300, 200, 210]), [300]);
  });

  it('05: does not mutate the input selection', () => {
    const selected = [200];
    toggleGroupSelection(group, selected);
    assert.deepEqual(selected, [200]);
  });
});
