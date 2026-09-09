import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { addFiles, fileIsEqual } from './fileHelpers.js';

/**
 * @param {string} name
 * @param {string} [content]
 * @param {string} [type]
 */
function makeFile(name, content = 'aaaa', type = 'text/plain') {
  return new File([content], name, { type });
}

describe('fileIsEqual', () => {
  it('01: equal when name, size, and type match', () => {
    assert.equal(fileIsEqual(makeFile('a.txt'), makeFile('a.txt')), true);
  });

  it('02: different name, size, or type is a different file', () => {
    assert.equal(fileIsEqual(makeFile('a.txt'), makeFile('b.txt')), false);
    assert.equal(fileIsEqual(makeFile('a.txt', 'aaaa'), makeFile('a.txt', 'aa')), false);
    assert.equal(fileIsEqual(makeFile('a.txt'), makeFile('a.txt', 'aaaa', 'image/png')), false);
  });
});

describe('addFiles', () => {
  it('01: appends new files in multiple mode', () => {
    const existing = [makeFile('a.txt')];
    const incoming = [makeFile('b.txt'), makeFile('c.txt')];
    const { files, added } = addFiles(existing, incoming, true);
    assert.deepEqual(
      files.map(file => file.name),
      ['a.txt', 'b.txt', 'c.txt'],
    );
    assert.deepEqual(
      added.map(file => file.name),
      ['b.txt', 'c.txt'],
    );
  });

  it('02: skips duplicates of already selected files', () => {
    const existing = [makeFile('a.txt')];
    const { files, added } = addFiles(existing, [makeFile('a.txt'), makeFile('b.txt')], true);
    assert.deepEqual(
      files.map(file => file.name),
      ['a.txt', 'b.txt'],
    );
    assert.deepEqual(
      added.map(file => file.name),
      ['b.txt'],
    );
  });

  it('03: skips duplicates within the incoming batch itself', () => {
    const { files, added } = addFiles([], [makeFile('a.txt'), makeFile('a.txt')], true);
    assert.equal(files.length, 1);
    assert.equal(added.length, 1);
  });

  it('04: single mode replaces the list with the first incoming file', () => {
    const existing = [makeFile('a.txt')];
    const { files, added } = addFiles(existing, [makeFile('b.txt'), makeFile('c.txt')], false);
    assert.deepEqual(
      files.map(file => file.name),
      ['b.txt'],
    );
    assert.deepEqual(
      added.map(file => file.name),
      ['b.txt'],
    );
  });

  it('05: does not mutate the existing list (regression)', () => {
    const existing = [makeFile('a.txt')];
    addFiles(existing, [makeFile('b.txt')], true);
    assert.equal(existing.length, 1);
  });
});
