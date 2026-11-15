import { aTimeout, fixture, html, expect, waitUntil } from '@open-wc/testing';
import { LitElement, css, html as litHtml } from 'lit';
import { LiveRegionController } from './LiveRegionController.js';

class LiveRegionHost extends LitElement {
  static properties = { text: {} };

  static styles = css`
    :host {
      display: block;
    }
    p {
      margin: 0;
      min-height: var(--content-height, auto);
    }
  `;

  liveRegion = new LiveRegionController(this, { delay: 10 });

  render() {
    return litHtml`<p>${this.text}</p>`;
  }
}
customElements.define('live-region-host', LiveRegionHost);

/** @param {LiveRegionHost} el */
function regions(el) {
  return [...el.shadowRoot.querySelectorAll('[aria-live]')];
}

describe('LiveRegionController', () => {
  it('has one polite live region in the shadow root of its host', async () => {
    /** @type {LiveRegionHost} */
    const el = await fixture(html`<live-region-host></live-region-host>`);
    expect(regions(el)).to.have.length(1);
    const [region] = regions(el);
    expect(region.getAttribute('aria-live')).to.equal('polite');
    expect(region.getAttribute('role')).to.equal('status');
    expect(region.textContent).to.equal('');
  });

  it('hides the region visually, but not from assistive technology', async () => {
    /** @type {LiveRegionHost} */
    const el = await fixture(html`<live-region-host></live-region-host>`);
    const [region] = regions(el);
    el.liveRegion.announce('Hello');
    await waitUntil(() => region.textContent === 'Hello');
    const rect = region.getBoundingClientRect();
    expect(rect.width).to.be.at.most(1);
    expect(rect.height).to.be.at.most(1);
    const style = getComputedStyle(region);
    expect(style.display).to.not.equal('none');
    expect(style.visibility).to.equal('visible');
    expect(region.hasAttribute('aria-hidden')).to.be.false;
  });

  it("doesn't take space in the layout of its host", async () => {
    /** @type {LiveRegionHost} */
    const el = await fixture(html`<live-region-host .text=${'content'}></live-region-host>`);
    const paragraph = el.shadowRoot.querySelector('p');
    expect(paragraph.getBoundingClientRect().height).to.be.above(0);
    expect(el.getBoundingClientRect().height).to.equal(paragraph.getBoundingClientRect().height);
  });

  it("doesn't become an item of a host that lays its children out as a flex box or a grid", async () => {
    /** @type {LiveRegionHost} */
    const el = await fixture(
      html`<live-region-host
        style="display: flex; flex-direction: column; gap: 20px"
        .text=${'content'}
      ></live-region-host>`,
    );
    const paragraph = el.shadowRoot.querySelector('p');
    expect(el.getBoundingClientRect().height).to.equal(paragraph.getBoundingClientRect().height);
  });

  it("doesn't end up outside a scroll container around its host, where it would make the page scroll", async () => {
    // The scroll box isn't positioned, like the content area of owc-layout-sidebar.
    const box = await fixture(html`
      <div style="height: 200px; overflow: auto">
        <live-region-host style="--content-height: 5000px" .text=${'content'}></live-region-host>
      </div>
    `);
    const el = /** @type {LiveRegionHost} */ (box.querySelector('live-region-host'));
    const [region] = regions(el);
    expect(box.scrollHeight).to.equal(5000);
    expect(document.scrollingElement.scrollHeight).to.be.below(5000);
    const rect = region.getBoundingClientRect();
    expect(rect.top).to.be.within(-1, window.innerHeight);
    box.scrollTop = 4000;
    expect(document.scrollingElement.scrollHeight).to.be.below(5000);
    expect(box.scrollHeight).to.equal(5000);
  });

  it('announces a message', async () => {
    /** @type {LiveRegionHost} */
    const el = await fixture(html`<live-region-host></live-region-host>`);
    const [region] = regions(el);
    el.liveRegion.announce('Moved the card to Done');
    await waitUntil(() => region.textContent === 'Moved the card to Done');
  });

  it('clears the region before a repeated message, so it is read again', async () => {
    /** @type {LiveRegionHost} */
    const el = await fixture(html`<live-region-host></live-region-host>`);
    const [region] = regions(el);
    el.liveRegion.announce('Hello');
    await waitUntil(() => region.textContent === 'Hello');
    el.liveRegion.announce('Hello');
    expect(region.textContent).to.equal('');
    await waitUntil(() => region.textContent === 'Hello');
  });

  it('announces only the last of the messages that arrive while one waits', async () => {
    /** @type {LiveRegionHost} */
    const el = await fixture(html`<live-region-host></live-region-host>`);
    const [region] = regions(el);
    /** @type {string[]} */
    const seen = [];
    new MutationObserver(() => {
      if (region.textContent) {
        seen.push(region.textContent);
      }
    }).observe(region, { childList: true, characterData: true, subtree: true });
    el.liveRegion.announce('First');
    el.liveRegion.announce('Second');
    el.liveRegion.announce('Third');
    await waitUntil(() => region.textContent === 'Third');
    await aTimeout(30);
    expect(seen).to.deep.equal(['Third']);
  });

  it('keeps its region when the host renders again', async () => {
    /** @type {LiveRegionHost} */
    const el = await fixture(html`<live-region-host .text=${'one'}></live-region-host>`);
    const [region] = regions(el);
    el.text = 'two';
    await el.updateComplete;
    expect(regions(el)).to.have.length(1);
    expect(regions(el)[0] === region).to.be.true;
    el.liveRegion.announce('Still here');
    await waitUntil(() => region.textContent === 'Still here');
  });

  it("doesn't announce a waiting message after the host was removed", async () => {
    /** @type {LiveRegionHost} */
    const el = await fixture(html`<live-region-host></live-region-host>`);
    const [region] = regions(el);
    el.liveRegion.announce('Too late');
    el.remove();
    await aTimeout(30);
    expect(region.textContent).to.equal('');
  });
});
