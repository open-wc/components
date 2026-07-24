import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { generateValueForData, replaceValues } from './generateValueForData.js';

/**
 * @type {import('./OwcTemplateEditorTypes.js').TemplateRecord}
 */
const mockTemplate = {
  name: 'foo',
  template: [
    {
      default: { subject: 'firstTemplate', html: 'firstTemplateHtml' },
      withData: {
        subject: 'firstTemplate{template.foo}{client.foo}',
        html: 'firstTemplate{template.abc}{user.foo}',
      },
    },
    {
      default: { subject: 'secondTemplate', html: 'secondTemplateHtml' },
      withData: {
        subject: 'secondTemplate{template.foo}{client.foo} {template.deep.deeper.evenDeeper}',
        html: 'secondTemplate{template.abc}{user.foo.bar} {template.deep.deeper.evenDeeper}',
      },
    },
    {
      first: { subject: 'firstVariant', html: `firstVariant` },
      default: { subject: 'thirdTemplate', html: 'thirdTemplateHtml' },
      withData: {
        subject: 'thirdTemplate{client.abc}',
        html: 'thirdTemplate{user.abc}',
      },
    },
  ],
  options: {
    value: { foo: () => 'bar', abc: 'bca', deep: { deeper: { evenDeeper: 'thats pretty deep' } } },
    delays: [],
    schema: {},
    tag: '',
    uiSchema: undefined,
  },
};

describe('generateValueForData', () => {
  it('01: chooses the right index', () => {
    const value0 = generateValueForData({}, mockTemplate, {
      index: 0,
      variantSelector: () => 'default',
      dataParameter: {},
    });
    assert.deepEqual(value0, { subject: 'firstTemplate', html: 'firstTemplateHtml' });
    const value1 = generateValueForData({}, mockTemplate, {
      index: 1,
      variantSelector: () => 'default',
      dataParameter: {},
    });
    assert.deepEqual(value1, { subject: 'secondTemplate', html: 'secondTemplateHtml' });
    const value2 = generateValueForData({}, mockTemplate, {
      index: 2,
      variantSelector: () => 'default',
      dataParameter: {},
    });
    assert.deepEqual(value2, { subject: 'thirdTemplate', html: 'thirdTemplateHtml' });
    const value3 = generateValueForData({}, mockTemplate, {
      index: 2,
      variantSelector: () => 'default',
      dataParameter: {},
    });
    assert.deepEqual(value3, { subject: 'thirdTemplate', html: 'thirdTemplateHtml' });
    const value4 = generateValueForData({}, mockTemplate, {
      index: 0,
      variantSelector: () => 'default',
      dataParameter: {},
    });
    assert.deepEqual(value4, { subject: 'firstTemplate', html: 'firstTemplateHtml' });
    const value5 = generateValueForData({}, mockTemplate, {
      index: 1,
      variantSelector: () => 'default',
      dataParameter: {},
    });
    assert.deepEqual(value5, { subject: 'secondTemplate', html: 'secondTemplateHtml' });
  });

  it('02 chooses the first variant by default', () => {
    const value0 = generateValueForData({}, mockTemplate, { index: 0, dataParameter: {} });
    assert.deepEqual(value0, { subject: 'firstTemplate', html: 'firstTemplateHtml' });
    const value1 = generateValueForData({}, mockTemplate, { index: 2, dataParameter: {} });
    assert.deepEqual(value1, { subject: 'firstVariant', html: `firstVariant` });
  });
  it('03 passes the correct arguments to variantSelector', () => {
    generateValueForData({ client: { foo: 'bar' } }, mockTemplate, {
      index: 0,
      variantSelector: (data, options) => {
        assert.deepEqual(data, { client: { foo: 'bar' } });
        assert.deepEqual(options, ['default', 'withData']);
        return 'default';
      },
      dataParameter: {},
    });
    generateValueForData({}, mockTemplate, {
      index: 2,
      variantSelector: (data, options) => {
        assert.deepEqual(data, {});
        assert.deepEqual(options, ['first', 'default', 'withData']);
        return 'default';
      },
      dataParameter: {},
    });
  });
  it('04 replaces undefined values with emptystring', () => {
    const value = generateValueForData({}, mockTemplate, {
      index: 2,
      variantSelector: () => 'withData',
      dataParameter: {},
    });
    assert.deepEqual(value, { subject: 'thirdTemplate', html: 'thirdTemplate' });
  });
  it('05 replaces template values with template.value values', () => {
    const value = generateValueForData({}, mockTemplate, {
      index: 0,
      variantSelector: () => 'withData',
      dataParameter: {},
    });
    assert.deepEqual(value, { subject: 'firstTemplatebar', html: 'firstTemplatebca' });
  });
  it('06 replaces other values with data values', () => {
    const value = generateValueForData(
      { client: { foo: 'BAR' }, user: { foo: 'ABC' } },
      mockTemplate,
      {
        index: 0,
        variantSelector: () => 'withData',
        dataParameter: {},
      },
    );
    assert.deepEqual(value, {
      subject: 'firstTemplatebarBAR',
      html: 'firstTemplatebcaABC',
    });
  });
  it('07 replaces deep values with deep data values', () => {
    const value = generateValueForData(
      { client: { foo: 'BAR' }, user: { foo: { bar: 'deepBar' } } },
      mockTemplate,
      {
        index: 1,
        variantSelector: () => 'withData',
        dataParameter: {},
      },
    );
    assert.deepEqual(value, {
      subject: 'secondTemplatebarBAR thats pretty deep',
      html: 'secondTemplatebcadeepBar thats pretty deep',
    });
  });
});

describe('replaceValues', () => {
  it('01: replaces custom markup links', () => {
    const text = `foo1[link href="foo.com"]text1[/link]test2[link class="classname" href="bar.com"]text2[/link]test3`;
    const obj = {};
    const fnParams = {};
    const values = replaceValues(text, obj, fnParams);
    assert.deepEqual(
      values,
      `foo1<a href="foo.com" class="" style="white-space: nowrap">text1</a>test2<a href="bar.com" class="classname" style="white-space: nowrap">text2</a>test3`,
    );
  });
  it('02: replaces custom markup links with variables', () => {
    const text = `foo1[link href="{prop1}"]text1[/link]test2[link class="classname" href="bar.com"]text2[/link]test3`;
    const obj = { prop1: 'prop' };
    const fnParams = {};
    const values = replaceValues(text, obj, fnParams);
    assert.deepEqual(
      values,
      `foo1<a href="prop" class="" style="white-space: nowrap">text1</a>test2<a href="bar.com" class="classname" style="white-space: nowrap">text2</a>test3`,
    );
  });
  it('03: replaces ternaries boolean to strings', () => {
    const text = `foo1{bool1 ? 'checked' : 'not checked'}test2{bool2 ? 'checked' : 'not checked'}test3`;
    const obj = { prop1: 'prop', bool1: true, bool2: false };
    const fnParams = {};
    const values = replaceValues(text, obj, fnParams);
    assert.deepEqual(values, `foo1checkedtest2not checkedtest3`);
  });
  it('04: replaces ternaries boolean to properties', () => {
    const text = `foo1{bool1 ? '{prop1}' : '{prop2}'}test2{bool2 ? '{prop1}' : '{prop2}'}test3`;
    const obj = { prop1: 'prop1', prop2: 'prop2', bool1: true, bool2: false };
    const fnParams = {};
    const values = replaceValues(text, obj, fnParams);
    assert.deepEqual(values, `foo1prop1test2prop2test3`);
  });
  it('05: replaces ternaries boolean to multiple properties', () => {
    const text = `foo1{bool1 ? '{prop1} {prop2}' : '{prop2} {prop1}'}test2{bool2 ? '{prop1} {prop2}' : '{prop2} {prop1}'}test3`;
    const obj = { prop1: 'prop1', prop2: 'prop2', bool1: true, bool2: false };
    const fnParams = {};
    const values = replaceValues(text, obj, fnParams);
    assert.deepEqual(values, `foo1prop1 prop2test2prop2 prop1test3`);
  });
  it('06: replaces undefined properties with emptystring', () => {
    const text = `test1{prop1}test2`;
    const obj = { prop1: undefined };
    const fnParams = {};
    const values = replaceValues(text, obj, fnParams);
    assert.deepEqual(values, `test1test2`);
  });
});
