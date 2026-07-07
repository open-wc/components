import { fixture, expect } from '@open-wc/testing';
import { LitElement, html } from 'lit';
import { WaveController } from './WaveController.js';
import { ReactiveObject } from './ReactiveObject.js';

class TestInvoice extends ReactiveObject {
  static properties = {
    amount: { type: Number },
  };

  _controller = new WaveController(this, {}, { mode: 'updateSendsWave' });

  /** @param {number} amount */
  constructor(amount) {
    super();
    // @ts-ignore
    this.constructor.finalize();
    this.amount = amount;
  }
}

class TestClient extends ReactiveObject {
  static properties = {
    name: { type: String },
    invoices: { type: Array },
  };

  _controller = new WaveController(
    this,
    { invoices: 'selfUpdate' },
    { mode: 'forwardWave+updateSendsWave' },
  );

  /** @param {string} name */
  constructor(name) {
    super();
    // @ts-ignore
    this.constructor.finalize();
    this.name = name;
    /** @type {TestInvoice[]} */
    this.invoices = [];
  }
}

class WaveTestComponent extends LitElement {
  static properties = {
    client: { type: Object },
  };

  _controller = new WaveController(
    this,
    { client: 'self+childUpdate' },
    { mode: 'waveTriggersUpdate' },
  );

  constructor() {
    super();
    /** @type {TestClient | undefined} */
    this.client = undefined;
  }

  render() {
    if (!this.client) {
      return html``;
    }
    const total = this.client.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    return html`<span id="name">${this.client.name}</span><span id="total">${total}</span>`;
  }
}

customElements.define('wave-test-component', WaveTestComponent);
WaveController.finalize();

/**
 * Waits for a wave to propagate and the component to re-render.
 *
 * The wave is dispatched synchronously during the source's update, which
 * requests the component update - so awaiting both is deterministic.
 *
 * @param {ReactiveObject} source
 * @param {LitElement} el
 */
async function waveSettled(source, el) {
  await source.updateComplete;
  await el.updateComplete;
}

/**
 * @param {TestClient} client
 */
async function renderComponent(client) {
  // Note: fixture a Lit element (awaits updateComplete) - fixturing a plain
  // element would wait on requestAnimationFrame, which stalls in the
  // backgrounded pages of concurrent test runs.
  const el = /** @type {WaveTestComponent} */ (
    await fixture(html`<wave-test-component .client=${client}></wave-test-component>`)
  );
  return { wrapper: /** @type {HTMLElement} */ (el.parentElement), el };
}

describe('ReactiveObject', () => {
  it('runs the reactive update cycle for property changes', async () => {
    const invoice = new TestInvoice(10);
    await invoice.updateComplete;

    /** @type {Map<PropertyKey, unknown> | undefined} */
    let changed;
    const originalUpdate = invoice.update.bind(invoice);
    invoice.update = changedProperties => {
      changed = changedProperties;
      originalUpdate(changedProperties);
    };
    invoice.amount = 20;
    await invoice.updateComplete;
    expect(changed?.has('amount')).to.equal(true);
    expect(changed?.get('amount')).to.equal(10);
  });

  it('dispatches a selfUpdate wave on updates (updateSendsWave)', async () => {
    const invoice = new TestInvoice(10);
    await invoice.updateComplete;

    let waves = 0;
    invoice.addEventListener('selfUpdate', () => {
      waves += 1;
    });
    invoice.amount = 20;
    await invoice.updateComplete;
    expect(waves).to.equal(1);
  });
});

describe('WaveController integration', () => {
  it('re-renders the component when a property of the assigned object changes', async () => {
    const client = new TestClient('Peter Parker');
    const { el } = await renderComponent(client);
    expect(el.shadowRoot.querySelector('#name').textContent).to.equal('Peter Parker');

    client.name = 'Spider Man';
    await waveSettled(client, el);
    expect(el.shadowRoot.querySelector('#name').textContent).to.equal('Spider Man');
  });

  it('re-renders when a nested array element changes (forwarded as childUpdate)', async () => {
    const client = new TestClient('Peter Parker');
    client.invoices = [new TestInvoice(10), new TestInvoice(5)];
    await client.updateComplete;
    const { el } = await renderComponent(client);
    expect(el.shadowRoot.querySelector('#total').textContent).to.equal('15');

    client.invoices[0].amount = 100;
    await waveSettled(client.invoices[0], el);
    expect(el.shadowRoot.querySelector('#total').textContent).to.equal('105');
  });

  it('stops reacting to elements removed from the array', async () => {
    const removed = new TestInvoice(10);
    const kept = new TestInvoice(5);
    const client = new TestClient('Peter Parker');
    client.invoices = [removed, kept];
    await client.updateComplete;
    const { el } = await renderComponent(client);

    client.invoices = [kept];
    await waveSettled(client, el);
    expect(el.shadowRoot.querySelector('#total').textContent).to.equal('5');

    let waves = 0;
    client.addEventListener('childUpdate', () => {
      waves += 1;
    });
    removed.amount = 999;
    await waveSettled(removed, el);
    expect(waves).to.equal(0);
    expect(el.shadowRoot.querySelector('#total').textContent).to.equal('5');
  });

  it('re-attaches wave listeners after a disconnect/reconnect cycle', async () => {
    const client = new TestClient('Peter Parker');
    const { wrapper, el } = await renderComponent(client);

    el.remove();
    client.name = 'Changed While Detached';
    await client.updateComplete;
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('#name').textContent).to.equal('Peter Parker');

    // Reconnect: hostConnected requests an update which re-attaches and re-renders
    wrapper.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('#name').textContent).to.equal('Changed While Detached');

    client.name = 'Changed After Reconnect';
    await waveSettled(client, el);
    expect(el.shadowRoot.querySelector('#name').textContent).to.equal('Changed After Reconnect');
  });
});
