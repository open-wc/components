import { fixture, html, expect, aTimeout } from '@open-wc/testing';
import { OwcIconButton } from './OwcIconButton.js';

customElements.define('owc-icon-button', OwcIconButton);

/**
 * @param {OwcIconButton} el
 */
function inner(el) {
  return el.shadowRoot.querySelector('.icon-button');
}

describe('owc-icon-button', () => {
  it('renders a button with the icon by default', async () => {
    const el = await fixture(html`<owc-icon-button name="gear"></owc-icon-button>`);
    expect(inner(el).tagName).to.equal('BUTTON');
    expect(inner(el).getAttribute('type')).to.equal('button');
    const icon = el.shadowRoot.querySelector('wa-icon');
    expect(icon.getAttribute('name')).to.equal('gear');
    expect(icon.getAttribute('aria-hidden')).to.equal('true');
  });

  it('renders an anchor when href is set', async () => {
    const el = await fixture(html`<owc-icon-button name="gear" href="/docs"></owc-icon-button>`);
    expect(inner(el).tagName).to.equal('A');
    expect(inner(el).getAttribute('href')).to.equal('/docs');
  });

  it('does not put a bare download attribute on links (regression)', async () => {
    const el = await fixture(html`<owc-icon-button name="gear" href="/report"></owc-icon-button>`);
    // download="" would force same-origin links to download instead of navigate
    expect(inner(el).hasAttribute('download')).to.equal(false);
    expect(inner(el).hasAttribute('target')).to.equal(false);
    expect(inner(el).hasAttribute('rel')).to.equal(false);

    el.download = 'report.pdf';
    await el.updateComplete;
    expect(inner(el).getAttribute('download')).to.equal('report.pdf');
  });

  it('adds rel="noreferrer noopener" for links with a target', async () => {
    const el = await fixture(
      html`<owc-icon-button
        name="gear"
        href="https://example.com"
        target="_blank"
      ></owc-icon-button>`,
    );
    expect(inner(el).getAttribute('target')).to.equal('_blank');
    expect(inner(el).getAttribute('rel')).to.equal('noreferrer noopener');
  });

  it('only renders an aria-label when a label is set (regression)', async () => {
    const el = await fixture(html`<owc-icon-button name="gear"></owc-icon-button>`);
    expect(inner(el).hasAttribute('aria-label')).to.equal(false);

    el.label = 'Settings';
    await el.updateComplete;
    expect(inner(el).getAttribute('aria-label')).to.equal('Settings');
  });

  it('forwards the variant to the icon only when set', async () => {
    const el = await fixture(html`<owc-icon-button name="x-circle"></owc-icon-button>`);
    expect(el.shadowRoot.querySelector('wa-icon').hasAttribute('variant')).to.equal(false);

    el.variant = 'regular';
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('wa-icon').getAttribute('variant')).to.equal('regular');
  });

  it('blocks clicks when disabled, for buttons and links', async () => {
    const button = await fixture(html`<owc-icon-button name="gear" disabled></owc-icon-button>`);
    let buttonClicks = 0;
    button.addEventListener('click', () => {
      buttonClicks += 1;
    });
    button.click();
    await aTimeout(0);
    expect(buttonClicks).to.equal(0);
    expect(inner(button).getAttribute('tabindex')).to.equal('-1');
    expect(inner(button).getAttribute('aria-disabled')).to.equal('true');

    const link = await fixture(
      html`<owc-icon-button name="gear" href="#never" disabled></owc-icon-button>`,
    );
    let linkClicks = 0;
    link.addEventListener('click', () => {
      linkClicks += 1;
    });
    link.click();
    await aTimeout(0);
    expect(linkClicks).to.equal(0);
    expect(window.location.hash).to.not.equal('#never');
  });

  it('lets clicks through when enabled', async () => {
    const el = await fixture(html`<owc-icon-button name="gear"></owc-icon-button>`);
    let clicks = 0;
    el.addEventListener('click', () => {
      clicks += 1;
    });
    el.click();
    await aTimeout(0);
    expect(clicks).to.equal(1);
  });
});
