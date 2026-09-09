# Waves

A reactivity toolkit for deeply nested object instances. Lit components only
re-render when a property _reference_ changes; waves let updates deep inside an
object graph (e.g. "the client's third invoice changed its amount") propagate
up to the components that display the data.

## Usage

```js
import { WaveController, ReactiveObject } from '@open-wc/components/WaveController.js';

class Invoice extends ReactiveObject {
  static properties = { amount: { type: Number } };
  _controller = new WaveController(this, {}, { mode: 'updateSendsWave' });
  constructor(amount) {
    super();
    this.constructor.finalize();
    this.amount = amount;
  }
}

class InvoiceComponent extends LitElement {
  static properties = { invoice: { type: Object } };
  _controller = new WaveController(this, { invoice: 'selfUpdate' }, { mode: 'waveTriggersUpdate' });
  render() {
    return html`${this.invoice.amount}`;
  }
}

WaveController.finalize(); // start the wave flow (once, after class definitions)
```

Now `invoice.amount = 5` re-renders every component displaying that invoice -
no `requestUpdate()` calls, no object copying.

## Concepts

- **Wave**: an update event with a direction seen from its host - `selfUpdate`
  (the object itself), `childUpdate` (an element of an array property),
  `parentUpdate` (an object property).
- **`ReactiveObject`**: a DOM-less port of Lit's `ReactiveElement`
  ([ReactiveObject.js](./ReactiveObject.js), adapted vendor code) so plain data
  classes get `static properties`, `update()`, `updateComplete`, and controller
  support.
- **`WaveController`**: a reactive controller that listens for waves on the
  host's property values (per-property `ListenerMode`, e.g. `'self+childUpdate'`)
  and, depending on its `ControllerMode`, re-renders the host
  (`waveTriggersUpdate`), re-dispatches the wave (`forwardWave`), and/or emits
  waves on host updates (`updateSendsWave`).
- **`WaveController.finalize()`**: waves only flow after this global switch is
  flipped, so object graphs can be constructed without premature cascades.

See [WaveController.rocket.md](./WaveController.rocket.md) for live demos and
the full API reference; published on the docs site under `/wave-controller/`.

## Files

- [WaveController.js](./WaveController.js) - the controller (listener wiring, wave dispatch)
- [ReactiveObject.js](./ReactiveObject.js) - DOM-less `ReactiveElement` port (adapted from Lit, BSD-3-Clause)
- [SmallEventTarget.js](./SmallEventTarget.js) - minimal `EventTarget` for non-DOM environments
- [eventListeners.js](./eventListeners.js) - `requestUpdate` event forwarding helpers
  (`addRequestUpdateReDispatcher` / `removeRequestUpdateReDispatcher` are part of the public export)
- [WaveControllerTypes.ts](./WaveControllerTypes.ts) - `ListenerMode` / `ControllerMode` types
- [WaveController.test-browser.js](./WaveController.test-browser.js) - integration tests with Lit
  (`npx web-test-runner src/waves/WaveController.test-browser.js`)
- [WaveController.test.js](./WaveController.test.js), [SmallEventTarget.test.js](./SmallEventTarget.test.js),
  [eventListeners.test.js](./eventListeners.test.js) - logic tests (`node --test src/waves/`)
