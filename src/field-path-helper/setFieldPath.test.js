import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { setFieldPath } from './setFieldPath.js';

const data = {
  firstName: 'Max',
  lastName: 'Mustermann',
  nested: {
    value: 'nested.value content',
  },
  emailList: [
    { type: 'public', email: 'max@example.com' },
    { type: 'private', email: 'max+private@example.com' },
  ],
};

describe('setFieldPath ', () => {
  it('01: direct string value', async () => {
    const updatedData = { ...data };
    setFieldPath(updatedData, 'firstName', 'Max SET');
    assert.equal(updatedData.firstName, 'Max SET');
  });
  it('02: nested value', async () => {
    const updatedData = { ...data };
    setFieldPath(updatedData, 'nested.value', 'nested.value content SET');
    assert.equal(updatedData.nested.value, 'nested.value content SET');
  });
  it('03: does nothing if a wrong path is given', async () => {
    const updatedData = { ...data };
    // @ts-ignore
    setFieldPath(updatedData, 'nested.wrong', 'SET');
    assert.deepEqual(updatedData, data);
  });
});
