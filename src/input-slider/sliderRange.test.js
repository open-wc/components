import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { adjustRangeForValue, clampRangeToAbsolute } from './sliderRange.js';

describe('adjustRangeForValue', () => {
  it('01: keeps a value inside the range untouched', () => {
    const state = { value: 50, min: 0, max: 100 };
    assert.deepEqual(adjustRangeForValue(state), {
      value: 50,
      min: 0,
      max: 100,
      absoluteMin: undefined,
      absoluteMax: undefined,
    });
  });

  it('02: grows max when the value exceeds it (break out upwards)', () => {
    const result = adjustRangeForValue({ value: 250, min: 0, max: 100 });
    assert.equal(result.value, 250);
    assert.equal(result.max, 250);
    assert.equal(result.min, 0);
  });

  it('03: shrinks min when the value falls below it (break out downwards)', () => {
    const result = adjustRangeForValue({ value: -20, min: 0, max: 100 });
    assert.equal(result.value, -20);
    assert.equal(result.min, -20);
    assert.equal(result.max, 100);
  });

  it('04: clamps the value to absoluteMax and grows max only up to it', () => {
    const result = adjustRangeForValue({ value: 500, min: 0, max: 100, absoluteMax: 200 });
    assert.equal(result.value, 200);
    assert.equal(result.max, 200);
  });

  it('05: clamps the value to absoluteMin and shrinks min only down to it', () => {
    const result = adjustRangeForValue({ value: -500, min: 0, max: 100, absoluteMin: -50 });
    assert.equal(result.value, -50);
    assert.equal(result.min, -50);
  });

  it('06: treats an absoluteMin of 0 as a real bound', () => {
    const result = adjustRangeForValue({ value: -10, min: 10, max: 100, absoluteMin: 0 });
    assert.equal(result.value, 0);
    assert.equal(result.min, 0);
  });

  it('07: treats an absoluteMax of 0 as a real bound', () => {
    const result = adjustRangeForValue({ value: 10, min: -100, max: -10, absoluteMax: 0 });
    assert.equal(result.value, 0);
    assert.equal(result.max, 0);
  });
});

describe('clampRangeToAbsolute', () => {
  it('01: leaves a range inside the absolute bounds untouched', () => {
    const result = clampRangeToAbsolute({
      value: 50,
      min: 0,
      max: 100,
      absoluteMin: -100,
      absoluteMax: 200,
    });
    assert.equal(result.value, 50);
    assert.equal(result.min, 0);
    assert.equal(result.max, 100);
  });

  it('02: raises min (and the value) to absoluteMin', () => {
    const result = clampRangeToAbsolute({ value: 5, min: 0, max: 100, absoluteMin: 10 });
    assert.equal(result.min, 10);
    assert.equal(result.value, 10);
  });

  it('03: lowers max (and the value) to absoluteMax', () => {
    const result = clampRangeToAbsolute({ value: 90, min: 0, max: 100, absoluteMax: 80 });
    assert.equal(result.max, 80);
    assert.equal(result.value, 80);
  });

  it('04: treats absolute bounds of 0 as real bounds', () => {
    const result = clampRangeToAbsolute({ value: -5, min: -10, max: 100, absoluteMin: 0 });
    assert.equal(result.min, 0);
    assert.equal(result.value, 0);
  });

  it('05: does nothing without absolute bounds', () => {
    const result = clampRangeToAbsolute({ value: 42, min: 0, max: 100 });
    assert.equal(result.value, 42);
    assert.equal(result.min, 0);
    assert.equal(result.max, 100);
  });
});
