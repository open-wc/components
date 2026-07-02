```js server
export const config = {
  path: '/components/WaveController',
  title: 'WaveController',
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@finum/data-table/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html, LitElement } from 'lit';
import { ref } from 'lit/directives/ref.js';

import { WaveController, ReactiveObject } from '@finum/data-table/WaveController.js';
```

# WaveController

A reactivity tool for deeply nested object instances.

## Kitchen Sink

```js demo
class CounterAggregator extends ReactiveObject {
  static properties = {
    count: { type: Number },
    counterParent: { type: Object },
    counterArray: { type: Array },
  };

  _controller = new WaveController(
    this,
    {
      counterParent: 'selfUpdate',
      counterArray: 'selfUpdate',
    },
    { mode: 'forwardWave+updateSendsWave' },
  );
  constructor() {
    super();
    // @ts-ignore
    this.constructor.finalize();
    this.count = 0;
    this.counterParent = undefined;
    this.counterArray = [];
  }

  increment() {
    this.count++;
  }

  update(changedProps) {
    super.update(changedProps);
  }
}

class CounterComponent extends LitElement {
  static properties = {
    counter: { type: Object },
  };

  _controller = new WaveController(
    this,
    {
      counter: 'self+parent+childUpdate',
    },
    { mode: 'waveTriggersUpdate' },
  );

  constructor() {
    super();
    this.counter = undefined;
  }

  firstUpdated() {
    this.counter = new CounterAggregator();
    this.counter.counterParent = new CounterAggregator();
    this.counter.counterArray = [
      new CounterAggregator(),
      new CounterAggregator(),
      new CounterAggregator(),
    ];
  }

  render() {
    if (!this.counter) {
      return html``;
    }
    return html` CounterAggregator:
      <button @click=${() => this.counter.increment()}>${this.counter.count}</button><br />
      Parent:
      <button @click=${() => this.counter.counterParent.increment()}>
        ${this.counter.counterParent.count}</button
      ><br />
      Array:
      [${this.counter.counterArray.map(
        counter => html`<button @click=${() => counter.increment()}>${counter.count}</button>`,
      )}]`;
  }
}

customElements.define('counter-component', CounterComponent);

WaveController.finalize();

export const simpleTable = () => {
  return html`<counter-component></counter-component>`;
};
```

## Example: Client

With WaveControllers we can propagate property updates from deep within a class structure.
For example take a client object with a name. Usually we would make a component to display the client,
and add the client as a property. However the Lit will only rerender the component if the reference to client changes, not it's name.
You can try this in this example!

```js demo
class Client {
  constructor(name) {
    this.name = name;
  }
}

class ClientComponent1 extends LitElement {
  static properties = {
    client: { type: Object },
  };

  constructor() {
    super();
    this.client = undefined;
  }

  render() {
    return html` Name: ${this.client.name}<br />
      <button
        @click=${() => {
          if (this.client) {
            this.client.name = this.client.name.split(' ').reverse().join(' ');
          }
        }}
      >
        Reverse Name
      </button>
      <button
        @click=${() => {
          this.requestUpdate();
        }}
      >
        Rerender
      </button>`;
  }
}

customElements.define('client-component1', ClientComponent1);

export const clientTest = () => {
  const client = new Client('Peter Parker');
  return html`<client-component1 .client=${client}></client-component1>`;
};
```

This creates a lot of weird checks and copying of objects when working with nested structures, especially when properties are drilled. Waves can help us by also making the objects reactive!
In this example we see the same thing with WaveControllers attached. We need a little more boilerplate including configuring the WaveControllers making Client Reactive and finalizing. However we don't need the rerender button anymore!

```js demo
class ClientReactive extends ReactiveObject {
  static properties = {
    name: { type: String },
  };

  _controller = new WaveController(this, {}, 'updateSendsWave');

  constructor(name) {
    super();
    // @ts-ignore
    this.constructor.finalize();
    this.name = name;
  }
}

class ClientComponent2 extends LitElement {
  static properties = {
    client: { type: Object },
  };

  _controller = new WaveController(
    this,
    {
      client: 'selfUpdate',
    },
    { mode: 'waveTriggersUpdate' },
  );

  constructor() {
    super();
    this.client = undefined;
  }

  render() {
    return html` Name: ${this.client.name}<br />
      <button
        @click=${() => {
          if (this.client) {
            this.client.name = this.client.name.split(' ').reverse().join(' ');
          }
        }}
      >
        Reverse Name
      </button>`;
  }
}

customElements.define('client-component2', ClientComponent2);
WaveController.finalize();
export const clientTestReactive = () => {
  const client = new ClientReactive('Peter Parker');
  return html`<client-component2 .client=${client}></client-component2>`;
};
```

We can also extend this to object and array properties! Let's add a list of invoices to the client. We can configure the WaveControllers to also react to updates on invoices by setting the clients controller to "forward" (forward waves from sub-properties) and the components controller to "childUpdate" (react to waves propagated from array properties).

```js demo
class ClientReactivePlus extends ReactiveObject {
  static properties = {
    name: { type: String },
    invoiceList: { type: Array },
  };

  _controller = new WaveController(
    this,
    { invoiceList: 'selfUpdate' },
    'forwardWave+updateSendsWave',
  );

  constructor(name) {
    super();
    // @ts-ignore
    this.constructor.finalize();
    this.name = name;
    this.invoiceList = [];
  }

  addInvoice(invoice) {
    this.invoiceList = [...this.invoiceList, invoice];
  }
}

class Invoice extends ReactiveObject {
  static properties = {
    amount: { type: String },
    date: { type: Object },
  };

  _controller = new WaveController(this, {}, { mode: 'updateSendsWave' });

  constructor(amount, date) {
    super();
    // @ts-ignore
    this.constructor.finalize();
    this.amount = amount;
    this.date = date;
  }

  evadeTaxes() {
    this.amount = Math.round(this.amount * 0.9 * 100) / 100;
  }
}

class ClientComponent3 extends LitElement {
  static properties = {
    client: { type: Object },
  };

  _controller = new WaveController(
    this,
    {
      client: 'self+childUpdate',
    },
    { mode: 'waveTriggersUpdate' },
  );

  constructor() {
    super();
    this.client = undefined;
  }

  render() {
    return html`
      Name: ${this.client.name}<br />
      <button
        @click=${() => {
          if (this.client) {
            this.client.name = this.client.name.split(' ').reverse().join(' ');
          }
        }}
      >
        Reverse Name</button
      ><br />
      ${this.client.invoiceList.map(
        invoice => html`${invoice.amount}$ ${invoice.date.toISOString().split('T')[0]}, `,
      )}<br />
      <button @click=${() => this.client.invoiceList.forEach(invoice => invoice.evadeTaxes())}>
        Cut a little off the top
      </button>
    `;
  }
}

customElements.define('client-component3', ClientComponent3);
WaveController.finalize();
export const clientTestReactivePlus = () => {
  const client = new ClientReactivePlus('Peter Parker');
  client.invoiceList = [
    new Invoice(Math.round(Math.random() * 10000) / 100, new Date(Math.random() * 2000000000)),
    new Invoice(Math.round(Math.random() * 10000) / 100, new Date(Math.random() * 2000000000)),
    new Invoice(Math.round(Math.random() * 10000) / 100, new Date(Math.random() * 2000000000)),
  ];
  return html`<client-component3 .client=${client}></client-component3>`;
};
```

We can see that reacting to changes in the sub-property are abstracted away. Our component now reacts to everything it may concern but not everything at all.
