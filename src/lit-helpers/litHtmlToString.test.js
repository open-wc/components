import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { html } from 'lit';
import { litHtmlToString } from './litHtmlToString.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

describe('litHtmlToString', () => {
  (it('01: converts a normal template', () => {
    const data = html`<div>Foobar</div>`;
    assert.deepEqual(litHtmlToString(data), '<div>Foobar</div>');
  }),
    it('02: Converts linebreaks to spaces', () => {
      const data = html`<div>Foo</div>
        <div>Bar</div>`;
      assert.deepEqual(litHtmlToString(data), '<div>Foo</div> <div>Bar</div>');
    }),
    it('03: Converts string type template literals', () => {
      const data = html`<div>Foo</div>
        <div>${'Bar'}</div>`;
      assert.deepEqual(litHtmlToString(data), '<div>Foo</div> <div>Bar</div>');
    }),
    it('04: Converts template type template literals', () => {
      const data = html`<div>Foo</div>
        <div>${html`${'Bar'}`}</div>`;
      assert.deepEqual(litHtmlToString(data), '<div>Foo</div> <div>Bar</div>');
    }),
    it('05: Converts mappings', () => {
      const data = html`${[1, 2, 3].map(elm => html`<div>${elm}</div>`)}`;
      assert.deepEqual(litHtmlToString(data), '<div>1</div><div>2</div><div>3</div>');
    }),
    it('06: Converts unsaveHtml', () => {
      const data = html`${unsafeHTML('<div>Foo</div>')}`;
      assert.deepEqual(litHtmlToString(data), '<div>Foo</div>');
    }));
});
