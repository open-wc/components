# Questionnaire

`<owc-questionnaire>` runs a step-by-step quiz: an intro, a sequence of
questions with answer buttons and a progress bar, and an outro that shows a
result computed by your `calculateResult`. "Test wiederholen" restarts with
fresh answers.

## Usage

```js
import '@open-wc/components/define/owc-questionnaire.js';
```

```js
html`<owc-questionnaire
  .questionnaire=${[
    { type: 'intro', text: () => html`Ready?`, options: [{ label: 'Start' }] },
    {
      type: 'question',
      text: () => html`Tabs or spaces?`,
      options: [{ label: 'Tabs' }, { label: 'Spaces' }],
    },
    { type: 'outro', headline: () => html`Done`, text: ({ result }) => html`${result[0]?.value}` },
  ]}
  .calculateResult=${(steps, answers) => [{ value: answers.filter(a => a === 0).length }]}
></owc-questionnaire>`;
```

## Docs & demos

See [OwcQuestionnaire.rocket.md](./OwcQuestionnaire.rocket.md) for live demos
and the API reference; published on the docs site under `/questionnaire/`.

## Files

- [OwcQuestionnaire.js](./OwcQuestionnaire.js) - the component
- [OwcQuestionnaire.test-browser.js](./OwcQuestionnaire.test-browser.js) - browser tests (`npx web-test-runner src/questionnaire/OwcQuestionnaire.test-browser.js`)
