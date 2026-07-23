```js server
export const config = {
  path: '/workflow/questionnaire',
  title: 'Questionnaire',
  menu: {
    parent: '/workflow',
    order: 40,
    iconName: 'patch-question',
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';
import '@open-wc/components/define/owc-questionnaire.js';

/**
 * @param {Array<{ name: string, data: number }>} result
 * @returns {import('lit').TemplateResult}
 */
export function renderKitchenResultSorted(result) {
  const total = result.reduce((sum, entry) => sum + entry.data, 0);
  const sorted = [...result].sort((a, b) => b.data - a.data);

  /**
   * @param {string} type - The kitchen personality type
   * @param {number} percent - The percentage of this type
   * @returns {import('lit').TemplateResult} - The description for this type
   */
  const getDescription = (type, percent) => {
    switch (type) {
      case 'Silent Sous-Chef':
        return html`
          <p>
            <strong>${percent}% – The Silent Spoon:</strong><br />
            Calm, precise, and organized – your cutting boards are alphabetized and your soufflés
            never collapse. Quiet but mighty.<br />
            🍅 Recommended: Cooking solo with jazz in the background.
          </p>
        `;
      case 'Spice Commander':
        return html`
          <p>
            <strong>${percent}% – The Flambé Fiend:</strong><br />
            You light up the kitchen – literally. You love bold flavors, dramatic techniques, and
            maybe a fire extinguisher nearby.<br />
            🔥 Recommended: Open kitchen + audience.
          </p>
        `;
      case 'Chit-Chat-Cook':
        return html`
          <p>
            <strong>${percent}% – The Chatter Chef:</strong><br />
            You stir the pot while stirring conversations. Hosting, toasting, storytelling – it all
            happens at your countertop.<br />
            🍷 Recommended: Long dinners and longer stories.
          </p>
        `;
      default:
        return html`<p>${percent}% – Unknown kitchen archetype, but probably delicious 🍕</p>`;
    }
  };

  return html`
    <div><owc-pie-chart-element .yData=${result}></owc-pie-chart-element></div>
    <div class="kitchen-personality-breakdown">
      ${sorted.map(entry => {
        const percent = Math.round((entry.data / total) * 100);
        return getDescription(entry.name, percent);
      })}
    </div>
  `;
}

/** @type {import('../../types/typeOfConsultant.js').Result} */
export function kitchenTypeEvaluation(questionnaire, selectedAnswers) {
  if (!selectedAnswers) {
    return {};
  }

  let defensive = 0;
  let offensive = 0;
  let chitChatCook = 0;

  selectedAnswers.forEach((optionIndex, i) => {
    const option = questionnaire[i].options[optionIndex];
    switch (option.category) {
      case 'defensive':
        defensive += option.score;
        break;
      case 'offensive':
        offensive += option.score;
        break;
      case 'chitChatCook':
        chitChatCook += option.score;
        break;
    }
  });

  const result = [
    { key: 'defensive', name: 'Silent Sous-Chef', data: defensive },
    { key: 'offensive', name: 'Spice Commander', data: offensive },
    { key: 'chitChatCook', name: 'Chit-Chat-Cook', data: chitChatCook },
  ];

  return result;
}

/** @type {import('../../types/typeOfConsultant.js').Questionnaire[]} */
const QUESTIONNAIRE = [
  {
    type: 'intro',
    headline: () => html``,
    text: () => html`Answer all questions spontaneously – no Googling recipes!`,
    options: [{ label: 'Start', score: 0, category: 'instruction' }],
  },
  {
    type: 'question',
    headline: () => html``,
    text: () =>
      html`At a dinner party, I love chatting with strangers while guarding the pizza slices.`,
    options: [
      { label: 'not really', score: 1, category: 'defensive' },
      { label: 'depends on the toppings', score: 3, category: 'offensive' },
      { label: 'only if there’s avocado involved', score: 2, category: 'chitChatCook' },
    ],
  },
  {
    type: 'question',
    headline: () => html``,
    text: () => html`I’d rather call someone than explain how to use chopsticks via text.`,
    options: [
      { label: 'nah, I’ll send a meme', score: 1, category: 'defensive' },
      { label: 'depends – is it about sushi?', score: 2, category: 'offensive' },
      { label: 'definitely, chopstick etiquette is sacred', score: 3, category: 'chitChatCook' },
    ],
  },
  {
    type: 'question',
    headline: () => html``,
    text: () => html`If someone rearranged your spice jars, would you…`,
    options: [
      { label: 'not notice for a week', score: 1, category: 'defensive' },
      { label: 'reorganize it immediately', score: 2, category: 'offensive' },
      { label: 'host a workshop on spice-labeling', score: 3, category: 'chitChatCook' },
    ],
  },
  {
    type: 'question',
    headline: () => html``,
    text: () => html`In your dream kitchen, there’s definitely…`,
    options: [
      { label: 'a quiet corner for prepping veggies', score: 1, category: 'defensive' },
      { label: 'a flamethrower for crème brûlée', score: 3, category: 'offensive' },
      { label: 'a bar stool for storytelling', score: 2, category: 'chitChatCook' },
    ],
  },
  {
    type: 'outro',
    headline: () => html`Here’s your kitchen personality:`,
    text: ({ result }) =>
      result ? renderKitchenResultSorted(result) : html`<p>Kein Ergebnis vorhanden.</p>`,
  },
];
```

# Questionnaire

```js demo
export const questionnaireDemo = () => {
  return html`<owc-questionnaire
    .questionnaire=${QUESTIONNAIRE}
    .calculateResult=${kitchenTypeEvaluation}
    .renderResultText=${renderKitchenResultSorted}
  ></owc-questionnaire>`;
};
```

## API

### Attributes & properties

| Property          | Type                                           | Default    | Description                                                                   |
| ----------------- | ---------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `questionnaire`   | `Questionnaire[]`                              | `[]`       | The steps: one `intro`, then `question`s, then one `outro`.                   |
| `calculateResult` | `(questionnaire, selectedAnswers) => Result[]` | `() => []` | Called after the last question; the result is passed to the outro's `text()`. |
| `selectedAnswers` | `number[]`                                     | `[]`       | The chosen option index per step (read).                                      |
| `currentIndex`    | `number`                                       | `0`        | The current step (read/write).                                                |
| `themeStyles`     | `object`                                       | `{}`       | `questionText`/`outroText` style maps plus `--*` CSS custom properties.       |

Steps have a `type` (`intro` \| `question` \| `outro`), a `text()` template function
(the outro's receives `{ result, renderResultText }`), `options` (`{ label }[]`) for
intro/questions, and `headline()` for the outro. "Test wiederholen" restarts with fresh
answers.
