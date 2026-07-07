import { fixture, html, expect } from '@open-wc/testing';
import { OwcCardList } from './OwcCardList.js';

customElements.define('owc-card-list', OwcCardList);

const data = [
  { id: 2, name: 'Beta', img: '/b.png' },
  { id: 1, name: 'Alpha', img: '/a.png' },
  { id: 3, name: 'Gamma', img: '/c.png' },
];

/**
 * @param {OwcCardList} el
 */
function cards(el) {
  return [...el.shadowRoot.querySelectorAll('owc-card')];
}

describe('owc-card-list', () => {
  it('renders title, view-all link, and one card per row', async () => {
    const el = await fixture(
      html`<owc-card-list
        title="News"
        viewAllUrl="/news"
        .data=${data}
        .fields=${{ body: row => row.name }}
      ></owc-card-list>`,
    );
    expect(el.shadowRoot.querySelector('h2').textContent).to.equal('News');
    expect(el.shadowRoot.querySelector('.view-all').getAttribute('href')).to.equal('/news');
    expect(cards(el).length).to.equal(3);
  });

  it('sorts for display without mutating the consumer array (regression)', async () => {
    const consumerData = [...data];
    const el = await fixture(
      html`<owc-card-list
        .data=${consumerData}
        .sorter=${(a, b) => a.id - b.id}
        .fields=${{ body: row => row.name }}
      ></owc-card-list>`,
    );
    expect(cards(el)[0].textContent).to.contain('Alpha');
    // the consumer's array keeps its original order
    expect(consumerData.map(row => row.id)).to.deep.equal([2, 1, 3]);
  });

  it('caps the list at 10 cards', async () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ id: i, name: `Row ${i}` }));
    const el = await fixture(
      html`<owc-card-list .data=${many} .fields=${{ body: row => row.name }}></owc-card-list>`,
    );
    expect(cards(el).length).to.equal(10);
  });

  it('renders images into the card media slot (regression)', async () => {
    const el = await fixture(
      html`<owc-card-list
        .data=${[data[0]]}
        .fields=${{
          body: row => row.name,
          image: { src: row => row.img, alt: row => row.name },
        }}
      ></owc-card-list>`,
    );
    const img = cards(el)[0].querySelector('img');
    // it was slotted as "image", which owc-card does not have
    expect(img.getAttribute('slot')).to.equal('media');
    expect(img.getAttribute('src')).to.equal('/b.png');
  });

  it('renders header and footer fields and forwards card links', async () => {
    const el = await fixture(html`<owc-card-list .data=${[data[0]]}></owc-card-list>`);
    el.fields = {
      body: row => row.name,
      header: row => `H:${row.name}`,
      footer: row => `F:${row.name}`,
    };
    el.getCardLinkSettings = row => ({ href: `/rows/${row.id}` });
    el.requestUpdate();
    await el.updateComplete;

    const card = cards(el)[0];
    expect(card.querySelector('[slot="header"]').textContent).to.equal('H:Beta');
    expect(card.querySelector('[slot="footer"]').textContent).to.equal('F:Beta');
    expect(card.getAttribute('href')).to.equal('/rows/2');
  });
});
