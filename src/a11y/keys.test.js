import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyName } from './keys.js';

test('keyName names a key by what it is', () => {
  assert.equal(keyName({ key: 'ArrowDown' }), 'ArrowDown');
  assert.equal(keyName({ key: 'F2' }), 'F2');
  assert.equal(keyName({ key: 'a' }), 'a');
});

test('keyName calls the space bar Space', () => {
  assert.equal(keyName({ key: ' ' }), 'Space');
  assert.equal(keyName({ key: ' ', shiftKey: true }), 'Shift+Space');
});

test('keyName puts the modifiers in front, in a fixed order', () => {
  assert.equal(keyName({ key: 'Tab', shiftKey: true }), 'Shift+Tab');
  assert.equal(keyName({ key: 'F10', shiftKey: true }), 'Shift+F10');
  assert.equal(keyName({ key: 'ArrowUp', altKey: true }), 'Alt+ArrowUp');
  assert.equal(
    keyName({ key: 'Home', ctrlKey: true, altKey: true, shiftKey: true }),
    'Control+Alt+Shift+Home',
  );
});

test('keyName counts the Command key as Control', () => {
  assert.equal(keyName({ key: 'End', metaKey: true }), 'Control+End');
  assert.equal(keyName({ key: 'End', metaKey: true, ctrlKey: true }), 'Control+End');
});
