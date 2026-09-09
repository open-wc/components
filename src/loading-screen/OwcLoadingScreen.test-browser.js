import { fixture, html, expect, waitUntil } from '@open-wc/testing';
import { OwcLoadingScreen } from './OwcLoadingScreen.js';

customElements.define('owc-loading-screen', OwcLoadingScreen);

/**
 * @param {OwcLoadingScreen} el
 */
function percentage(el) {
  return el.shadowRoot.querySelector('#percentage').textContent.trim();
}

describe('owc-loading-screen', () => {
  it('renders the progress as a percentage', async () => {
    const el = await fixture(html`<owc-loading-screen .progress=${0.37}></owc-loading-screen>`);
    expect(percentage(el)).to.equal('37%');
    expect(el.shadowRoot.querySelector('wa-spinner')).to.exist;
  });

  it('never displays more than 99%', async () => {
    const el = await fixture(html`<owc-loading-screen .progress=${1.5}></owc-loading-screen>`);
    expect(percentage(el)).to.equal('99%');
  });

  it('renders the logo only when provided', async () => {
    const el = await fixture(html`<owc-loading-screen></owc-loading-screen>`);
    expect(el.shadowRoot.querySelector('#logo')).to.equal(null);

    const withLogo = await fixture(
      html`<owc-loading-screen
        .logoSvg=${html`<svg data-testid="logo"></svg>`}
      ></owc-loading-screen>`,
    );
    expect(withLogo.shadowRoot.querySelector('#logo svg')).to.exist;
  });

  it('advances the progress automatically with autofill and stops when disconnected', async () => {
    const el = await fixture(html`<owc-loading-screen autofill></owc-loading-screen>`);
    expect(el.autofillInterval).to.not.equal(undefined);
    await waitUntil(() => el.progress > 0, 'autofill never advanced', { timeout: 2000 });

    el.remove();
    expect(el.autofillInterval).to.equal(undefined);
  });

  it('does not start a timer without autofill', async () => {
    const el = await fixture(html`<owc-loading-screen></owc-loading-screen>`);
    expect(el.autofillInterval).to.equal(undefined);
  });
});
