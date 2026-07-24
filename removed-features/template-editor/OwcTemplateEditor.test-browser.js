import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { OwcTemplateEditor } from './OwcTemplateEditor.js';

customElements.define('owc-template-editor', OwcTemplateEditor);

function makeTemplateRecord() {
  return {
    name: 'Greeting',
    label: 'greeting',
    template: [{ default: { subject: 'Hello {client.name}', html: 'Hi {client.name}!' } }],
    options: { value: {} },
  };
}

describe('owc-template-editor', () => {
  it('renders the classic editor by default with the editor switch', async () => {
    const el = await fixture(html`<owc-template-editor></owc-template-editor>`);
    expect(el.editor.tagName.toLowerCase()).to.equal('owc-template-editor-old');
    expect(el.shadowRoot.querySelector('wa-switch')).to.exist;
  });

  it('hides the editor switch via show-editor-switch', async () => {
    const el = await fixture(
      html`<owc-template-editor .showEditorSwitch=${false}></owc-template-editor>`,
    );
    expect(el.shadowRoot.querySelector('wa-switch')).to.equal(null);
    expect(el.editor).to.exist;
  });

  it('round-trips the current template record through the inner editor', async () => {
    const el = await fixture(html`<owc-template-editor></owc-template-editor>`);
    const record = makeTemplateRecord();
    el.currentTemplateRecord = record;
    expect(el.currentTemplateRecord.name).to.equal('Greeting');
    expect(el.editor.currentTemplateRecord.name).to.equal('Greeting');
  });

  it('generates values with variables resolved', async () => {
    const el = await fixture(html`<owc-template-editor></owc-template-editor>`);
    el.currentTemplateRecord = makeTemplateRecord();

    const { subject, html: body } = el.generateValueForData(
      { client: { name: 'Ada' } },
      { name: 'Ada' },
    );
    expect(subject).to.equal('Hello Ada');
    expect(body).to.equal('Hi Ada!');
  });

  it('re-dispatches inner editor events on the host', async () => {
    const el = await fixture(html`<owc-template-editor></owc-template-editor>`);
    setTimeout(() => el.editor.dispatchEvent(new Event('templateUpdate')));
    const ev = await oneEvent(el, 'templateUpdate');
    expect(ev.type).to.equal('templateUpdate');
  });
});
