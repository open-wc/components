import '@webcomponents/scoped-custom-element-registry';
import './JsonForm.layouts.test-browser.js';
import { expect } from '@open-wc/testing';

it('runs the layout suite with scoped registries enabled', () => {
  expect(ShadowRoot.prototype.createElement).to.be.a('function');
});
