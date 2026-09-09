import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseFillInput, matchFillInput } from './fillInput.js';

const data = [
  { label: 'VAV', value: '100' },
  { label: 'Standard Life', value: '101' },
  { label: 'UNIQA', value: '102' },
  { label: 'Zürich', value: '103' },
  { label: 'Helvetia', value: '104' },
];

describe('parseFillInput', () => {
  it('01: returns an empty list for empty or whitespace-only input', () => {
    assert.deepEqual(parseFillInput(''), []);
    assert.deepEqual(parseFillInput('   \n '), []);
  });

  it('02: parses a JSON array as-is', () => {
    assert.deepEqual(parseFillInput('["100","104","102"]'), ['100', '104', '102']);
    assert.deepEqual(parseFillInput('[100, 104]'), [100, 104]);
  });

  it('03: does not treat other JSON values as a token list', () => {
    // a quoted JSON string is a single token, not a list of characters
    assert.deepEqual(parseFillInput('"VAV"'), ['"VAV"']);
  });

  it('04: splits by spaces', () => {
    assert.deepEqual(parseFillInput('100 104 102'), ['100', '104', '102']);
  });

  it('05: splits by commas', () => {
    assert.deepEqual(parseFillInput('VAV,Helvetia,UNIQA'), ['VAV', 'Helvetia', 'UNIQA']);
  });

  it('06: splits by semicolons, tabs and newlines', () => {
    assert.deepEqual(parseFillInput('100;101;102'), ['100', '101', '102']);
    assert.deepEqual(parseFillInput('100\t101\t102'), ['100', '101', '102']);
    assert.deepEqual(parseFillInput('100\n101\n102'), ['100', '101', '102']);
  });

  it('07: picks the separator that produces the most tokens', () => {
    // commas win over the single space inside "Standard Life"
    assert.deepEqual(parseFillInput('Standard Life,VAV,UNIQA'), ['Standard Life', 'VAV', 'UNIQA']);
  });

  it('08: trims tokens and drops empty ones', () => {
    assert.deepEqual(parseFillInput('100, 101,\n'), ['100', '101']);
  });
});

describe('matchFillInput', () => {
  it('01: matches by option value', () => {
    assert.deepEqual(matchFillInput('100 104 102', data), ['100', '104', '102']);
  });

  it('02: matches by option label', () => {
    assert.deepEqual(matchFillInput('VAV,Helvetia,UNIQA', data), ['100', '104', '102']);
  });

  it('03: matches a JSON array input', () => {
    assert.deepEqual(matchFillInput('["100","104","102"]', data), ['100', '104', '102']);
  });

  it('04: ignores tokens that match no option', () => {
    assert.deepEqual(matchFillInput('100 nope 102', data), ['100', '102']);
  });

  it('05: deduplicates repeated matches', () => {
    assert.deepEqual(matchFillInput('100 100 VAV', data), ['100']);
  });

  it('06: matches numeric option values from pasted text', () => {
    const numericData = [
      { label: 'VAV', value: 100 },
      { label: 'UNIQA', value: 102 },
    ];
    assert.deepEqual(matchFillInput('100 102', numericData), [100, 102]);
    assert.deepEqual(matchFillInput('[100]', numericData), [100]);
  });

  it('07: uses a custom getOptionValue', () => {
    const custom = [
      { label: 'VAV', id: 'a' },
      { label: 'UNIQA', id: 'b' },
    ];
    assert.deepEqual(
      matchFillInput('VAV b', custom, row => row.id),
      ['a', 'b'],
    );
  });

  it('08: returns an empty list for empty input', () => {
    assert.deepEqual(matchFillInput('', data), []);
  });
});
