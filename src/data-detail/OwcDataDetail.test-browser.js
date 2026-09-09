import { fixture, html, expect } from '@open-wc/testing';
import { OwcDataDetail } from './OwcDataDetail.js';

customElements.define('owc-data-detail', OwcDataDetail);

const data = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  age: 36,
  dateOfBirth: '1815-12-10',
};

/**
 * @param {OwcDataDetail} el
 */
function labels(el) {
  return [...el.shadowRoot.querySelectorAll('.label')].map(node => node.textContent.trim());
}

/**
 * @param {OwcDataDetail} el
 */
function values(el) {
  return [...el.shadowRoot.querySelectorAll('.grid-cell.value')].map(node =>
    node.textContent.trim(),
  );
}

describe('owc-data-detail', () => {
  it('renders without columns without crashing', async () => {
    const el = await fixture(html`<owc-data-detail .data=${data}></owc-data-detail>`);
    expect(el.shadowRoot.querySelector('.dataDetail')).to.exist;
    expect(el.columnsRowCount).to.equal(0);
  });

  it('renders label and value per column item', async () => {
    const columns = [
      [
        { label: 'First Name', field: 'firstName' },
        { label: 'Last Name', field: 'lastName' },
      ],
    ];
    const el = await fixture(
      html`<owc-data-detail .data=${data} .columns=${columns}></owc-data-detail>`,
    );
    expect(labels(el)).to.deep.equal(['First Name', 'Last Name']);
    expect(values(el)).to.deep.equal(['Ada', 'Lovelace']);
  });

  it('renders multiple columns side by side', async () => {
    const columns = [
      [
        { label: 'First Name', field: 'firstName' },
        { label: 'Age', field: 'age' },
      ],
      [{ label: 'Last Name', field: 'lastName' }],
    ];
    const el = await fixture(
      html`<owc-data-detail .data=${data} .columns=${columns}></owc-data-detail>`,
    );
    expect(el.columnsRowCount).to.equal(2);
    expect(labels(el)).to.deep.equal(['First Name', 'Last Name', 'Age']);
    expect(values(el)).to.deep.equal(['Ada', 'Lovelace', '36']);
  });

  it('renders missing plain fields as empty (fallbackValue applies to editable cells)', async () => {
    const columns = [
      [
        { label: 'Nickname', field: 'nickname' },
        { label: 'Editable Nickname', field: 'nickname', type: 'editable' },
      ],
    ];
    const el = await fixture(
      html`<owc-data-detail
        .data=${data}
        .columns=${columns}
        fallbackValue="N/A"
      ></owc-data-detail>`,
    );
    expect(values(el)[0]).to.equal('');
    const editable = el.shadowRoot.querySelector('owc-click-editable-input');
    expect(editable).to.exist;
    expect(editable.fallbackValue ?? editable.options?.fallbackValue).to.equal('N/A');
  });

  it('supports label functions', async () => {
    const columns = [[{ label: d => `Name of ${d.firstName}`, field: 'lastName' }]];
    const el = await fixture(
      html`<owc-data-detail .data=${data} .columns=${columns}></owc-data-detail>`,
    );
    expect(labels(el)).to.deep.equal(['Name of Ada']);
  });

  it('hides items with visible false or a falsy visible function', async () => {
    const columns = [
      [
        { label: 'Hidden', field: 'firstName', visible: false },
        { label: 'Adults only', field: 'lastName', visible: d => d.age > 40 },
        { label: 'Age', field: 'age' },
      ],
    ];
    const el = await fixture(
      html`<owc-data-detail .data=${data} .columns=${columns}></owc-data-detail>`,
    );
    expect(labels(el)).to.deep.equal(['Age']);

    el.data = { ...data, age: 50 };
    await el.updateComplete;
    expect(labels(el)).to.deep.equal(['Adults only', 'Age']);
  });

  it('applies custom formatter functions', async () => {
    const columns = [[{ label: 'Age', field: 'age', formatter: d => `${d.age} Years` }]];
    const el = await fixture(
      html`<owc-data-detail .data=${data} .columns=${columns}></owc-data-detail>`,
    );
    expect(values(el)).to.deep.equal(['36 Years']);
  });

  it('applies the built-in date formatter and formatter overrides', async () => {
    const columns = [[{ label: 'Born', field: 'dateOfBirth', formatter: 'date' }]];
    const el = await fixture(
      html`<owc-data-detail .data=${data} .columns=${columns}></owc-data-detail>`,
    );
    expect(values(el)).to.deep.equal(['10.12.1815']);

    el.dateFormatter = new Intl.DateTimeFormat('de', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    await el.updateComplete;
    expect(values(el)).to.deep.equal(['10. Dezember 1815']);
  });

  it('renders a labelBadge next to the label', async () => {
    const columns = [[{ label: 'First Name', field: 'firstName', labelBadge: () => 3 }]];
    const el = await fixture(
      html`<owc-data-detail .data=${data} .columns=${columns}></owc-data-detail>`,
    );
    const badge = el.shadowRoot.querySelector('.label wa-badge');
    expect(badge).to.exist;
    expect(badge.textContent.trim()).to.equal('3');
  });

  it('renders a contentSuffix after the value', async () => {
    const columns = [
      [
        {
          label: 'First Name',
          field: 'firstName',
          contentSuffix: () => html`<span id="suffix">suffix</span>`,
        },
      ],
    ];
    const el = await fixture(
      html`<owc-data-detail .data=${data} .columns=${columns}></owc-data-detail>`,
    );
    expect(el.shadowRoot.querySelector('.content-suffix #suffix')).to.exist;
  });

  it('toggles expandable content on label click', async () => {
    const columns = [
      [
        {
          label: 'First Name',
          field: 'firstName',
          type: 'expandable',
          contentExpanded: () => html`<p id="expanded">expanded content</p>`,
        },
      ],
    ];
    const el = await fixture(
      html`<owc-data-detail .data=${data} .columns=${columns}></owc-data-detail>`,
    );
    const details = el.shadowRoot.querySelector('wa-details');
    expect(details.open).to.equal(false);

    el.shadowRoot.querySelector('.expandable-label').click();
    await el.updateComplete;
    expect(details.open).to.equal(true);
    expect(el.openColumns).to.deep.equal(['firstName']);

    el.shadowRoot.querySelector('.expandable-label').click();
    await el.updateComplete;
    expect(details.open).to.equal(false);
    expect(el.openColumns).to.deep.equal([]);
  });

  it('opens a second expandable and closes the first (single open)', async () => {
    const columns = [
      [
        {
          label: 'A',
          field: 'firstName',
          type: 'expandable',
          contentExpanded: () => html`<p>a</p>`,
        },
      ],
      [
        {
          label: 'B',
          field: 'lastName',
          type: 'expandable',
          contentExpanded: () => html`<p>b</p>`,
        },
      ],
    ];
    const el = await fixture(
      html`<owc-data-detail .data=${data} .columns=${columns}></owc-data-detail>`,
    );
    const buttons = [...el.shadowRoot.querySelectorAll('.expandable-label')];
    buttons[0].click();
    await el.updateComplete;
    buttons[1].click();
    await el.updateComplete;
    expect(el.openColumns).to.deep.equal(['lastName']);
    const detailsStates = [...el.shadowRoot.querySelectorAll('wa-details')].map(d => d.open);
    expect(detailsStates).to.deep.equal([false, true]);
  });

  it('opens expandables preset via openColumns', async () => {
    const columns = [
      [
        {
          label: 'First Name',
          field: 'firstName',
          type: 'expandable',
          contentExpanded: () => html`<p>expanded</p>`,
        },
      ],
    ];
    const el = await fixture(
      html`<owc-data-detail
        .data=${data}
        .columns=${columns}
        .openColumns=${['firstName']}
      ></owc-data-detail>`,
    );
    expect(el.shadowRoot.querySelector('wa-details').open).to.equal(true);
  });

  it('renders an editable input for type editable', async () => {
    const columns = [[{ label: 'First Name', field: 'firstName', type: 'editable' }]];
    const el = await fixture(
      html`<owc-data-detail .data=${data} .columns=${columns}></owc-data-detail>`,
    );
    expect(el.shadowRoot.querySelector('owc-click-editable-input')).to.exist;
  });
});
