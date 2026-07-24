import { fixture, html, expect } from '@open-wc/testing';
import { OwcQuestionnaire } from './OwcQuestionnaire.js';

customElements.define('owc-questionnaire', OwcQuestionnaire);

function makeQuestionnaire() {
  return [
    {
      type: 'intro',
      text: () => 'Welcome!',
      options: [{ label: 'Start' }],
    },
    {
      type: 'question',
      text: () => 'Question one?',
      options: [{ label: 'Yes' }, { label: 'No' }],
    },
    {
      type: 'question',
      text: () => 'Question two?',
      options: [{ label: 'A' }, { label: 'B' }],
    },
    {
      type: 'outro',
      headline: () => 'Done!',
      text: ({ result }) => `score: ${result.map(r => r.value).join(',')}`,
    },
  ];
}

/**
 * @param {OwcQuestionnaire} el
 * @param {number} optionIndex
 */
async function answer(el, optionIndex) {
  const buttons = [...el.shadowRoot.querySelectorAll('wa-button')];
  buttons[optionIndex].click();
  await el.updateComplete;
}

describe('owc-questionnaire', () => {
  it('renders nothing for an empty questionnaire instead of crashing (regression)', async () => {
    const el = await fixture(html`<owc-questionnaire></owc-questionnaire>`);
    expect(el.shadowRoot.querySelector('.card-overview')).to.equal(null);
  });

  it('starts with the intro and advances through the questions', async () => {
    const el = await fixture(
      html`<owc-questionnaire .questionnaire=${makeQuestionnaire()}></owc-questionnaire>`,
    );
    expect(el.shadowRoot.textContent).to.contain('Welcome!');

    await answer(el, 0);
    expect(el.shadowRoot.textContent).to.contain('Question one?');
    expect(el.shadowRoot.textContent).to.contain('1 / 2');
    expect(el.shadowRoot.querySelector('wa-progress-bar')).to.exist;
  });

  it('collects answers and shows the outro with the calculated result', async () => {
    const el = await fixture(
      html`<owc-questionnaire
        .questionnaire=${makeQuestionnaire()}
        .calculateResult=${(questionnaire, selectedAnswers) => [
          { value: selectedAnswers.filter(a => a === 0).length },
        ]}
      ></owc-questionnaire>`,
    );
    await answer(el, 0); // intro
    await answer(el, 0); // question one: Yes
    await answer(el, 1); // question two: B → outro

    expect(el.shadowRoot.textContent).to.contain('Done!');
    expect(el.shadowRoot.textContent).to.contain('score: 2');
    expect(el.selectedAnswers).to.deep.equal([0, 0, 1]);
  });

  it('restarting resets answers and result (regression)', async () => {
    const el = await fixture(
      html`<owc-questionnaire
        .questionnaire=${makeQuestionnaire()}
        .calculateResult=${() => [{ value: 1 }]}
      ></owc-questionnaire>`,
    );
    await answer(el, 0);
    await answer(el, 0);
    await answer(el, 1);
    expect(el.shadowRoot.textContent).to.contain('Done!');

    el.handleStartAgain();
    await el.updateComplete;
    expect(el.shadowRoot.textContent).to.contain('Welcome!');
    expect(el.selectedAnswers).to.deep.equal([]);
    expect(el.result).to.deep.equal([]);
  });
});
