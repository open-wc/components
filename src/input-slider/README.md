# Input Slider

`<owc-input-slider>` pairs a slider with a number input that both edit the same
value. The slider covers the everyday range (`min`/`max`) while the input can
break out of it - the slider range grows/shrinks to follow the value. Hard
limits are set with `absolute-min`/`absolute-max`.

## Usage

```js
import '@open-wc/components/define/owc-input-slider.js';
```

```js
html`<owc-input-slider
  label="Amount"
  value="50"
  min="0"
  max="100"
  absolute-min="0"
  @change=${ev => console.log(ev.target.value)}
></owc-input-slider>`;
```

`input` fires while the value changes, `change` when it is committed - both
re-dispatched on the host element, so listeners on `<owc-input-slider>` work.

## Features

- Dynamic range: entering a value outside `min`/`max` expands the slider range
  instead of rejecting the input (pure logic in [sliderRange.js](./sliderRange.js))
- Hard `absolute-min`/`absolute-max` bounds the value is clamped to (`0` is a
  valid bound)
- Input before or after the slider (`input-position`), `stacked` layout with a
  full-width slider, `disabled`, `step`
- Layout tunable via `--owc-input-width` and `--owc-input-slider-gap`; inner
  Web Awesome parts re-exported with `input-*`/`slider-*` prefixes

## Docs & demos

See [OwcInputSlider.rocket.md](./OwcInputSlider.rocket.md) for live demos and
the full API reference; published on the docs site under `/input-slider/`.

## Files

- [OwcInputSlider.js](./OwcInputSlider.js) - the component
- [sliderRange.js](./sliderRange.js) - pure range/clamp logic
- [OwcInputSlider.test-browser.js](./OwcInputSlider.test-browser.js) - browser tests (`npx web-test-runner src/input-slider/OwcInputSlider.test-browser.js`)
- [sliderRange.test.js](./sliderRange.test.js) - logic tests (`node --test src/input-slider/`)
