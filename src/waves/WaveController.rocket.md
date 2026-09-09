```js server
export const config = {
  path: '/utilities/wave-controller',
  title: 'Wave Controller',
  menu: {
    parent: '/utilities',
    order: 60,
    iconName: 'water',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html, LitElement } from 'lit';
import { ref } from 'lit/directives/ref.js';

import { WaveController, ReactiveObject } from '@open-wc/components/WaveController.js';
```

# Wave Controller

A reactivity tool for deeply nested object instances.

Lit components only re-render when a property _reference_ changes. When your data is a graph
of objects ("the client's third invoice changed its amount"), that means manual
`requestUpdate()` calls or defensive copying. Waves solve this: plain data classes extend
`ReactiveObject` (a DOM-less `ReactiveElement`), and `WaveController`s propagate update
events - "waves" - through object properties, arrays, and up into Lit components.

Every wave has a direction seen from a host: `selfUpdate` (the object itself changed),
`childUpdate` (something in an array property changed), and `parentUpdate` (an object
property changed). Controllers decide which waves they listen to per property, and what they
do with them: re-render (`waveTriggersUpdate`), pass them on (`forwardWave`), or emit them
when the host updates (`updateSendsWave`).

Call `WaveController.finalize()` once after your classes are defined to start the wave flow.

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
and add the client as a property. However Lit will only re-render the component if the reference to the client changes, not its name.
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

We can also extend this to object and array properties. Without WaveController, nested object
updates need to be surfaced manually. In this example the invoice amounts change, but the component
only updates because the click handler calls `requestUpdate()`.

```js demo
class ClientPlainPlus {
  constructor(name) {
    this.name = name;
    this.invoiceList = [];
  }
}

class InvoicePlain {
  constructor(amount, date) {
    this.amount = amount;
    this.date = date;
  }

  evadeTaxes() {
    this.amount = Math.round(this.amount * 0.9 * 100) / 100;
  }
}

class ClientComponentPlainPlus extends LitElement {
  static properties = {
    client: { type: Object },
  };

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
            this.requestUpdate();
          }
        }}
      >
        Reverse Name</button
      ><br />
      ${this.client.invoiceList.map(
        invoice => html`${invoice.amount}$ ${invoice.date.toISOString().split('T')[0]}, `,
      )}<br />
      <button
        @click=${() => {
          this.client.invoiceList.forEach(invoice => invoice.evadeTaxes());
          this.requestUpdate();
        }}
      >
        Cut a little off the top
      </button>
    `;
  }
}

customElements.define('client-component-plain-plus', ClientComponentPlainPlus);

export const clientTestPlainPlus = () => {
  const client = new ClientPlainPlus('Peter Parker');
  client.invoiceList = [
    new InvoicePlain(Math.round(Math.random() * 10000) / 100, new Date(Math.random() * 2000000000)),
    new InvoicePlain(Math.round(Math.random() * 10000) / 100, new Date(Math.random() * 2000000000)),
    new InvoicePlain(Math.round(Math.random() * 10000) / 100, new Date(Math.random() * 2000000000)),
  ];
  return html`<client-component-plain-plus .client=${client}></client-component-plain-plus>`;
};
```

With WaveControllers we can configure the client controller to "forward" (forward waves from
sub-properties) and the component controller to "childUpdate" (react to waves propagated from array
properties).

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

## API

```js
import { WaveController, ReactiveObject } from '@open-wc/components/WaveController.js';
```

### `new WaveController(host, reactiveProperties, options)`

A [Lit Reactive Controller](https://lit.dev/docs/composition/controllers/). Attach it to a
`LitElement` or a `ReactiveObject`.

| Argument             | Type                                          | Description                                                                            |
| -------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------- |
| `host`               | `ReactiveElement \| ReactiveObject`           | The host whose update cycle drives the controller.                                     |
| `reactiveProperties` | `Record<string, ListenerMode>`                | Which host properties to watch, and which wave names to listen to on their values.     |
| `options`            | `{ mode?: ControllerMode } \| ControllerMode` | What the controller does with waves. The mode can also be passed directly as a string. |

**`ListenerMode`** (per property): a `+`-combination of `self`, `parent`, and `child`,
suffixed with `Update` - e.g. `'selfUpdate'`, `'self+childUpdate'`,
`'self+parent+childUpdate'`. It names the wave events the controller listens to on the
property's value(s). Property values must be `EventTarget`s (e.g. `ReactiveObject`
instances) or arrays of them; other values are ignored.

**`ControllerMode`**: a `+`-combination of

| Mode flag            | Effect                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `waveTriggersUpdate` | An incoming wave calls `host.requestUpdate()` - use this on components that render the data.                            |
| `forwardWave`        | An incoming wave is re-dispatched on the host (`parentUpdate` for object properties, `childUpdate` for array elements). |
| `updateSendsWave`    | Every host update dispatches a `selfUpdate` wave - use this on data objects others react to.                            |

When no mode is given, the default is `forwardWave+updateSendsWave`.

### `WaveController.finalize()`

Waves only flow after `WaveController.finalize()` has been called once (globally). This lets
you construct your object graph without triggering premature update cascades.

### `ReactiveObject`

A DOM-less port of Lit's `ReactiveElement`: `static properties`, `requestUpdate()`,
`update()`, `updateComplete`, and controller support - but instantiable with `new` and usable
for plain data classes. Extend it, declare `static properties`, and call
`this.constructor.finalize()` in the constructor (this is `ReactiveElement.finalize()`, which
sets up the property accessors - not the same as `WaveController.finalize()`).

### Lifecycle notes

- Listeners are attached and re-wired during the host's update cycle - assigning new values,
  adding/removing array elements, and swapping arrays for single values all clean up after
  themselves.
- When a component host disconnects, all wave listeners are removed; on reconnect they are
  re-attached automatically (the host re-renders once to catch up).
- A controller ignores waves that arrive while it is dispatching, preventing echo loops in
  cyclic object graphs.
