import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { OwcTableInfo } from './OwcTableInfo.js';

customElements.define('owc-table-info', OwcTableInfo);

describe('owc-table-info', () => {
  it('shows the row count info when show-info is set', async () => {
    const el = await fixture(
      html`<owc-table-info
        .showInfo=${true}
        .dataFullSize=${10}
        .dataCurrentSize=${4}
      ></owc-table-info>`,
    );
    const info = el.shadowRoot.querySelector('#info');
    expect(info.textContent).to.include('Zeige 4 von 10 Einträgen');
  });

  it('shows an "all" info text when nothing is filtered out', async () => {
    const el = await fixture(
      html`<owc-table-info
        .showInfo=${true}
        .dataFullSize=${10}
        .dataCurrentSize=${10}
        .dataSelectedSize=${2}
      ></owc-table-info>`,
    );
    const info = el.shadowRoot.querySelector('#info');
    expect(info.textContent).to.include('Zeige alle 10 Einträge');
    expect(info.textContent).to.include('(davon 2 ausgewählt)');
  });

  it('fires refresh-button-clicked when the refresh button is pressed', async () => {
    const el = await fixture(html`<owc-table-info .refreshButton=${true}></owc-table-info>`);
    const button = el.shadowRoot.querySelector('wa-button');
    expect(button).to.exist;
    setTimeout(() => button.click());
    await oneEvent(el, 'refresh-button-clicked');
  });

  it('fires action-tab-active-changed exposing actionTabActive', async () => {
    const el = await fixture(html`<owc-table-info></owc-table-info>`);
    setTimeout(() => {
      el.actionTabActive = 'export';
    });
    const event = await oneEvent(el, 'action-tab-active-changed');
    expect(event.target.actionTabActive).to.equal('export');
  });
});
