import { fixture, html, expect, aTimeout } from '@open-wc/testing';
import { OwcTableSettings } from './OwcTableSettings.js';

customElements.define('owc-table-settings', OwcTableSettings);

const columns = [
  { field: 'a', label: 'A', visible: 'always' },
  { field: 'b', label: 'B', visible: 'always' },
];

let prefixCounter = 0;

/**
 * Every test gets its own storage prefix so localStorage/URL state cannot
 * leak between tests.
 */
function nextPrefix() {
  prefixCounter += 1;
  return `settings-test-${prefixCounter}`;
}

/**
 * @param {string} prefix
 */
async function settingsFixture(prefix) {
  return fixture(
    html`<owc-table-settings .columns=${columns} .storeNamePrefix=${prefix}></owc-table-settings>`,
  );
}

/**
 * @param {string} prefix
 */
function cleanup(prefix) {
  localStorage.removeItem(`${prefix}-override-settings`);
  const url = new URL(location.href);
  url.searchParams.delete(`${prefix}-overrides`);
  history.replaceState({}, '', url);
}

describe('owc-table-settings', () => {
  it('shows the localized columns trigger text', async () => {
    const prefix = nextPrefix();
    const el = await settingsFixture(prefix);
    // the old renderComboBox override was never called by the base class
    expect(el.shadowRoot.querySelector('#placeholder').textContent.trim()).to.equal('Columns');
    expect(
      el.shadowRoot.querySelector('.select').classList.contains('placeholder-visible'),
    ).to.equal(true);
    cleanup(prefix);
  });

  it('lists one row per column', async () => {
    const prefix = nextPrefix();
    const el = await settingsFixture(prefix);
    el.open = true;
    await el.updateComplete;
    await aTimeout(50); // let the virtualizer render
    expect(el.shadowRoot.querySelectorAll('.row').length).to.equal(2);
    expect(el.data.map(column => column.field)).to.deep.equal(['a', 'b']);
    cleanup(prefix);
  });

  it('cycles the visibility, persists it, and fires change', async () => {
    const prefix = nextPrefix();
    const el = await settingsFixture(prefix);
    let changes = 0;
    el.addEventListener('change', () => {
      changes += 1;
    });
    const checkbox = document.createElement('input');

    el.cycleVisibility(el.data[0], checkbox);
    expect(el.overrides.visibility.a).to.equal('ifFiltered');
    expect(checkbox.indeterminate).to.equal(true);
    expect(JSON.parse(localStorage.getItem(`${prefix}-override-settings`)).visibility.a).to.equal(
      'ifFiltered',
    );

    el.cycleVisibility(el.data[0], checkbox);
    expect(el.overrides.visibility.a).to.equal('never');
    expect(checkbox.checked).to.equal(false);

    el.cycleVisibility(el.data[0], checkbox);
    expect(el.overrides.visibility.a).to.equal('always');
    expect(changes).to.equal(3);
    cleanup(prefix);
  });

  it('reset clears overrides, storage, and the URL', async () => {
    const prefix = nextPrefix();
    const el = await settingsFixture(prefix);
    el.cycleVisibility(el.data[0], document.createElement('input'));
    expect(localStorage.getItem(`${prefix}-override-settings`)).to.not.equal(null);

    el.reset();
    expect(el.overrides).to.deep.equal({ visibility: {} });
    expect(localStorage.getItem(`${prefix}-override-settings`)).to.equal(null);
    expect(new URL(location.href).searchParams.get(`${prefix}-overrides`)).to.equal(null);
    cleanup(prefix);
  });

  it('recovers from a legacy array in localStorage (regression)', async () => {
    const prefix = nextPrefix();
    localStorage.setItem(`${prefix}-override-settings`, '[]');
    const el = await settingsFixture(prefix);
    expect(el.getOverridesFromLocalStorage()).to.deep.equal({ visibility: {} });
    expect(localStorage.getItem(`${prefix}-override-settings`)).to.equal('{"visibility":{}}');
    cleanup(prefix);
  });

  it('applies overrides from the URL, local ones winning per column', async () => {
    const prefix = nextPrefix();
    localStorage.setItem(
      `${prefix}-override-settings`,
      JSON.stringify({ visibility: { a: 'never' } }),
    );
    const url = new URL(location.href);
    url.searchParams.set(
      `${prefix}-overrides`,
      JSON.stringify({ visibility: { a: 'always', b: 'ifFiltered' } }),
    );
    history.replaceState({}, '', url);

    const el = await settingsFixture(prefix);
    expect(el.overrides.visibility).to.deep.equal({ a: 'never', b: 'ifFiltered' });
    cleanup(prefix);
  });
});
