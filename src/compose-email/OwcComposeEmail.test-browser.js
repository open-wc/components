import { fixture, html, expect, waitUntil, aTimeout } from '@open-wc/testing';
import { OwcComposeEmail } from './OwcComposeEmail.js';

customElements.define('owc-compose-email', OwcComposeEmail);

function makeRecipients() {
  return [
    { id: '1', email: 'ada@example.com', user: { email: 'me@example.com' } },
    { id: '2', email: 'grace@example.com', user: { email: 'me@example.com' } },
    { id: '3', email: 'bounce@example.com', user: { email: 'me@example.com' } },
  ];
}

/**
 * @param {OwcComposeEmail} el
 */
function recipientTags(el) {
  return [...el.shadowRoot.querySelectorAll('.to-list wa-tag')];
}

describe('owc-compose-email', () => {
  it('renders a tag per recipient, danger for bad ones', async () => {
    const el = await fixture(
      html`<owc-compose-email
        .recipientList=${makeRecipients()}
        .recipientIsGood=${recipient =>
          recipient.email.startsWith('bounce')
            ? { good: false, reason: 'bounced' }
            : { good: true }}
      ></owc-compose-email>`,
    );
    const tags = recipientTags(el);
    expect(tags.length).to.equal(3);
    expect(tags[0].getAttribute('variant')).to.equal('neutral');
    expect(tags[2].getAttribute('variant')).to.equal('danger');
    expect(el.recipientListGood.map(recipient => recipient.id)).to.deep.equal(['1', '2']);
  });

  it('removes a recipient via the tag remove button', async () => {
    const el = await fixture(
      html`<owc-compose-email .recipientList=${makeRecipients()}></owc-compose-email>`,
    );
    recipientTags(el)[0].dispatchEvent(new Event('wa-remove'));
    await el.updateComplete;
    expect(el.recipientList.map(recipient => recipient.id)).to.deep.equal(['2', '3']);
    expect(recipientTags(el).length).to.equal(2);
  });

  it('collapses to the short summary at the auto threshold', async () => {
    const el = await fixture(
      html`<owc-compose-email
        formatterMode="3auto"
        .recipientList=${makeRecipients()}
        .recipientIsGood=${recipient =>
          recipient.email.startsWith('bounce') ? { good: false, reason: 'x' } : { good: true }}
      ></owc-compose-email>`,
    );
    expect(recipientTags(el).length).to.equal(0);
    expect(el.shadowRoot.querySelector('.to-list').textContent).to.contain('Good: 2, Bad: 1');
  });

  it('excludes recipients without the template tag from the good list', async () => {
    const el = await fixture(
      html`<owc-compose-email
        .recipientList=${[
          { id: '1', email: 'a@example.com', tagList: ['news'], user: { email: 'me@example.com' } },
          { id: '2', email: 'b@example.com', tagList: [], user: { email: 'me@example.com' } },
        ]}
      ></owc-compose-email>`,
    );
    const editor = el.shadowRoot.querySelector('owc-template-editor');
    await waitUntil(() => editor.currentTemplateRecord, 'inner editor never ready');
    editor.currentTemplateRecord = {
      ...editor.currentTemplateRecord,
      options: { tag: 'news' },
    };
    el.requestUpdate();
    await el.updateComplete;

    expect(el.recipientListGood.map(recipient => recipient.id)).to.deep.equal(['1']);
    expect(el.getRecipientStatus(el.recipientList[1]).reason).to.equal(
      'Hat kein Interesse an dieser E-Mail',
    );
  });

  it('cycles through previews with wrap-around', async () => {
    const el = await fixture(
      html`<owc-compose-email .recipientList=${makeRecipients().slice(0, 2)}></owc-compose-email>`,
    );
    el.togglePreviewMode();
    await el.updateComplete;
    expect(el.previewMode).to.equal(true);
    expect(el.previewIndex).to.equal(0);

    el.nextPreview();
    expect(el.previewIndex).to.equal(1);
    el.nextPreview();
    expect(el.previewIndex).to.equal(0);
    el.previousPreview();
    expect(el.previewIndex).to.equal(1);
  });

  it('sends to the good recipients and reports back via afterSend', async function sendFlow() {
    this.timeout(6000); // the component locks the send actions for 2s after sending
    const sends = [];
    const results = [];
    const el = await fixture(
      html`<owc-compose-email
        .recipientList=${makeRecipients()}
        .recipientIsGood=${recipient =>
          recipient.email.startsWith('bounce') ? { good: false, reason: 'x' } : { good: true }}
      ></owc-compose-email>`,
    );
    el.sendMail = async options => {
      sends.push(options);
      return { status: 'success', draft: options.draft };
    };
    el.afterSend = result => results.push(result);

    const editor = el.shadowRoot.querySelector('owc-template-editor');
    await waitUntil(() => editor.currentTemplateRecord, 'inner editor never ready');

    const sendButton = [...el.shadowRoot.querySelectorAll('.send-button-wrapper wa-button')].at(-1);
    expect(sendButton.textContent).to.contain('alle 2');
    sendButton.click();
    await waitUntil(() => sends.length === 1, 'sendMail never called');

    expect(sends[0].draft).to.equal(false);
    expect(sends[0].recipientList.length).to.equal(2);
    expect(results[0]).to.deep.equal({ status: 'success', draft: false });

    // send actions are locked briefly after sending
    await el.updateComplete;
    expect(el.allowSendActions).to.equal(false);
    await aTimeout(2100);
    expect(el.allowSendActions).to.equal(true);
  });
});
