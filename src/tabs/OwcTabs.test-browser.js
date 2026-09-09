import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { OwcTabs } from './OwcTabs.js';

customElements.define('owc-tabs', OwcTabs);

const basicTabs = {
  general: {
    label: 'General',
    content: () => html`<p>Some General Content</p>`,
  },
  other: {
    label: 'Other',
    content: () => html`<p>Some Other Content</p>`,
  },
};

/**
 * @param {OwcTabs} el
 */
function tabButtons(el) {
  return [...el.shadowRoot.querySelectorAll('wa-button[panel]')];
}

/**
 * @param {OwcTabs} el
 * @param {string} key
 */
function detailsFor(el, key) {
  return el.shadowRoot.querySelector(`wa-details[summary="${key}"]`);
}

describe('owc-tabs', () => {
  it('renders a button per tab', async () => {
    const el = await fixture(html`<owc-tabs .tabs=${basicTabs}></owc-tabs>`);
    const buttons = tabButtons(el);
    expect(buttons.map(b => b.textContent.trim())).to.deep.equal(['General', 'Other']);
    expect(buttons.map(b => b.getAttribute('panel'))).to.deep.equal(['general', 'other']);
  });

  it('shows no content while no tab is active', async () => {
    const el = await fixture(html`<owc-tabs .tabs=${basicTabs}></owc-tabs>`);
    expect(el.active).to.equal('');
    expect(detailsFor(el, 'general').open).to.equal(false);
    expect(detailsFor(el, 'other').open).to.equal(false);
  });

  it('opens the tab given by the active attribute', async () => {
    const el = await fixture(html`<owc-tabs .tabs=${basicTabs} active="general"></owc-tabs>`);
    expect(detailsFor(el, 'general').open).to.equal(true);
    expect(detailsFor(el, 'other').open).to.equal(false);
  });

  it('activates a tab on click and fires active-changed', async () => {
    const el = await fixture(html`<owc-tabs .tabs=${basicTabs}></owc-tabs>`);
    const [, otherButton] = tabButtons(el);
    setTimeout(() => otherButton.click());
    await oneEvent(el, 'active-changed');
    expect(el.active).to.equal('other');
    await el.updateComplete;
    expect(detailsFor(el, 'other').open).to.equal(true);
  });

  it('closes the active tab when its button is clicked again', async () => {
    const el = await fixture(html`<owc-tabs .tabs=${basicTabs} active="general"></owc-tabs>`);
    const [generalButton] = tabButtons(el);
    setTimeout(() => generalButton.click());
    await oneEvent(el, 'active-changed');
    expect(el.active).to.equal('');
    await el.updateComplete;
    expect(detailsFor(el, 'general').open).to.equal(false);
  });

  it('does not fire active-changed for the initial render', async () => {
    let count = 0;
    const el = await fixture(
      html`<owc-tabs
        @active-changed=${() => {
          count += 1;
        }}
        .tabs=${basicTabs}
        active="general"
      ></owc-tabs>`,
    );
    await el.updateComplete;
    expect(count).to.equal(0);

    el.active = 'other';
    await el.updateComplete;
    expect(count).to.equal(1);
  });

  it('ignores clicks on the tab wrapper (only panel buttons switch tabs)', async () => {
    const tabs = {
      general: {
        label: 'General',
        labelPrefix: html`<span id="prefix">pre</span>`,
        content: () => html`<p>Some General Content</p>`,
      },
    };
    const el = await fixture(html`<owc-tabs .tabs=${tabs} active="general"></owc-tabs>`);
    const wrapper = el.shadowRoot.querySelector('div.tab');
    wrapper.click();
    await el.updateComplete;
    expect(el.active).to.equal('general');

    const prefix = el.shadowRoot.querySelector('.tab-prefix');
    prefix.click();
    await el.updateComplete;
    expect(el.active).to.equal('general');
  });

  it('marks the active tab button as brand/accent', async () => {
    const el = await fixture(html`<owc-tabs .tabs=${basicTabs} active="general"></owc-tabs>`);
    const [generalButton, otherButton] = tabButtons(el);
    expect(generalButton.getAttribute('variant')).to.equal('brand');
    expect(generalButton.getAttribute('appearance')).to.equal('accent');
    expect(otherButton.getAttribute('variant')).to.equal('neutral');
    expect(otherButton.getAttribute('appearance')).to.equal('outlined');
  });

  it('hides tabs with visible false and supports visible functions', async () => {
    const tabs = {
      always: { label: 'Always', content: () => html`x` },
      never: { label: 'Never', visible: false, content: () => html`x` },
      admin: { label: 'Admin', visible: options => options.isAdmin, content: () => html`x` },
    };
    const el = await fixture(
      html`<owc-tabs .tabs=${tabs} .getRenderOptions=${() => ({ isAdmin: false })}></owc-tabs>`,
    );
    expect(tabButtons(el).map(b => b.getAttribute('panel'))).to.deep.equal(['always']);

    el.getRenderOptions = () => ({ isAdmin: true });
    el.requestUpdate();
    await el.updateComplete;
    expect(tabButtons(el).map(b => b.getAttribute('panel'))).to.deep.equal(['always', 'admin']);
  });

  it('sorts tabs by order', async () => {
    const tabs = {
      z: { label: 'Z', order: 1, content: () => html`x` },
      a: { label: 'A', order: 99, content: () => html`x` },
      m: { label: 'M', order: 50, content: () => html`x` },
    };
    const el = await fixture(html`<owc-tabs .tabs=${tabs}></owc-tabs>`);
    expect(tabButtons(el).map(b => b.getAttribute('panel'))).to.deep.equal(['z', 'm', 'a']);
  });

  it('renders labelPrefix and labelSuffix around the tab button', async () => {
    const tabs = {
      general: {
        label: 'General',
        labelPrefix: html`<span>before</span>`,
        labelSuffix: html`<span>after</span>`,
        content: () => html`x`,
      },
    };
    const el = await fixture(html`<owc-tabs .tabs=${tabs}></owc-tabs>`);
    expect(el.shadowRoot.querySelector('.tab-prefix').textContent).to.include('before');
    expect(el.shadowRoot.querySelector('.tab-suffix').textContent).to.include('after');
  });

  it('passes the render options and open state to the content function', async () => {
    /** @type {Array<Record<string, unknown>>} */
    const received = [];
    const tabs = {
      general: {
        label: 'General',
        content: options => {
          received.push(options);
          return html`x`;
        },
      },
    };
    const el = await fixture(
      html`<owc-tabs
        .tabs=${tabs}
        .getRenderOptions=${() => ({ user: 'thomas' })}
        active="general"
      ></owc-tabs>`,
    );
    await el.updateComplete;
    const last = received[received.length - 1];
    expect(last.user).to.equal('thomas');
    expect(last.open).to.equal(true);
  });

  it('renders a hint when a tab has no content function', async () => {
    const el = await fixture(
      html`<owc-tabs .tabs=${{ general: { label: 'General' } }} active="general"></owc-tabs>`,
    );
    expect(detailsFor(el, 'general').textContent).to.include(
      'Please define a content function for the tab "general"',
    );
  });

  it('applies customStyles inside the shadow root', async () => {
    const el = await fixture(html`<owc-tabs .tabs=${basicTabs}></owc-tabs>`);
    el.customStyles = '.super-red { color: red; }';
    await el.updateComplete;
    const styleTag = [...el.shadowRoot.querySelectorAll('style')].find(style =>
      style.textContent.includes('.super-red'),
    );
    expect(styleTag).to.exist;
  });

  it('renders slotted tab-list-prefix content', async () => {
    const el = await fixture(
      html`<owc-tabs .tabs=${basicTabs}>
        <div slot="tab-list-prefix">Info About 10/1300</div>
      </owc-tabs>`,
    );
    const slot = el.shadowRoot.querySelector('slot[name="tab-list-prefix"]');
    const assigned = slot.assignedElements();
    expect(assigned[0].textContent).to.equal('Info About 10/1300');
  });
});
