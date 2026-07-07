import { LitElement, html, css, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/button-group/button-group.js';
import '@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js';

/**
 * @typedef {Object<string, string | number>} StyleObject
 */

/**
 * @typedef {Object} ThemeStyles
 * @property {StyleObject=} questionText
 * @property {StyleObject=} resultText
 * @property {StyleObject=} outroText
 * @property {Record<`--${string}`, string>=} [cssVariables]
 */

export class OwcQuestionnaire extends LitElement {
  static properties = {
    questionnaire: { type: Array },
    currentIndex: { type: Number },
    selectedAnswers: { type: Array },
    calculateResult: { type: Function },
    result: { type: Array },
    themeStyles: { type: Object },
  };

  constructor() {
    super();
    /** @type {ThemeStyles} */
    this.themeStyles = {};
    /** @type {import('./OwcQuestionnaire.types.js').Questionnaire<any>[]} */
    this.questionnaire = [];
    /** @type {number[]} */
    this.selectedAnswers = []; // [1, 0, 2] für gewählte Option pro Frage
    this.currentIndex = 0;
    /** @type {import('./OwcQuestionnaire.types.js').Result[]} */
    this.result = [];
    /**
     * @type {(questionnaire: import('./OwcQuestionnaire.types.js').Questionnaire<any>[], selectedAnswers: number[]) => import('./OwcQuestionnaire.types.js').Result[]}
     */
    this.calculateResult = () => [];
    /**
     * @type {(type: string) => import('lit').TemplateResult}
     */
    this.renderResultText = () => html``;
  }

  /** * @param  {number} optionIndex  */
  handleButtonClick(optionIndex) {
    this.selectedAnswers[this.currentIndex] = optionIndex;

    // Nur weiterzählen, wenn noch was kommt ohne outro (-2)
    if (this.currentIndex < this.questionnaire.length - 2) {
      this.currentIndex++;
      this.requestUpdate();
    } else {
      this.result = this.calculateResult(this.questionnaire, this.selectedAnswers);
      this.currentIndex++; // → damit Outro angezeigt wird
    }

    this.requestUpdate();
  }

  renderIntro() {
    const currentQuestion = this.questionnaire[this.currentIndex];

    return html` <div class="question-container">
      <div style=${styleMap(this.themeStyles?.questionText || {})}>${currentQuestion?.text()}</div>
      <div>
        <form class="validation">
          <wa-button-group label="Alignment">
            ${
              currentQuestion.options
                ? html`${currentQuestion.options.map(
                    (questionOption, i) =>
                      html`<wa-button value="${i}" @click=${() => this.handleButtonClick(i)}
                        >${questionOption.label}</wa-button
                      > `,
                  )}`
                : ''
            }
          </wa-button-group>
        </form>
      </div>
    </div>`;
  }

  renderQuestions() {
    const totalQuestions = this.questionnaire.filter(q => q.type === 'question').length;
    const currentQuestionNumber = this.questionnaire
      .slice(0, this.currentIndex)
      .filter(q => q.type === 'question').length;
    const currentQuestion = this.questionnaire[this.currentIndex];
    const progress = ((currentQuestionNumber + 1) / totalQuestions) * 100;
    return html`
      <div>${currentQuestionNumber + 1} / ${totalQuestions}</div>
      <wa-progress-bar value="${progress}"></wa-progress-bar>

      <div class="question-container">
        <div></div>
        <div style=${styleMap(this.themeStyles?.questionText || {})}>
          ${this.questionnaire[this.currentIndex]?.text()}
        </div>
        <div>
          <form class="validation">
            <wa-button-group label="Alignment">
              ${
                currentQuestion.options
                  ? html`${currentQuestion.options.map(
                      (questionOption, i) =>
                        html`<wa-button value="${i}" @click=${() => this.handleButtonClick(i)}
                          >${questionOption.label}</wa-button
                        > `,
                    )}`
                  : ''
              }
            </wa-button-group>
          </form>
        </div>
      </div>
    `;
  }

  handleStartAgain() {
    this.currentIndex = 0;
    this.selectedAnswers = [];
    this.result = [];
  }

  renderOutro() {
    return html` <div class="outro-container">
      <div style=${styleMap(this.themeStyles?.outroText || {})}>
        ${this.questionnaire[this.currentIndex]?.headline()}
      </div>
      <div>
        ${this.questionnaire[this.currentIndex]?.text?.({
          result: this.result,
          renderResultText: this.renderResultText,
        })}
      </div>
      <div style="display: flex; justify-content: center;">
        <wa-button @click=${() => this.handleStartAgain()}>Test wiederholen</wa-button>
      </div>
    </div>`;
  }

  /**
   * Extract only CSS-Custom-Properties from themeStyles-Objekt
   * @param {Record<string, unknown>} styles
   * @returns {Record<string, string>}
   */
  extractCssVars(styles) {
    /** @type {Record<string, string>} */
    const result = {};

    for (const [key, value] of Object.entries(styles || {})) {
      if (key.startsWith('--') && typeof value === 'string') {
        result[key] = value;
      }
    }

    return result;
  }

  render() {
    const styleVars = this.extractCssVars(this.themeStyles);
    const current = this.questionnaire[this.currentIndex];
    if (!current) {
      return nothing;
    }
    return html`
      <div style=${styleMap(styleVars)} class="card-overview">
        ${
          current.type === 'intro'
            ? html`<div>${this.renderIntro()}</div>`
            : current.type === 'question'
              ? html` ${this.renderQuestions()} `
              : current.type === 'outro'
                ? html`<div>${this.renderOutro()}</div>`
                : html``
        }
      </div>
    `;
  }

  static styles = [
    css`
      :host {
        font-family: var(--ci-font-family, sans-serif);
        background-color: var(--ci-background);
      }
      .card-overview {
        padding: 50px;
        background-color: var(--ci-background);
      }

      .question-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 1rem;
        background-color: var(--ci-background);
      }

      .outro-container {
        background-color: var(--ci-background);
        border-radius: 1.2rem;
      }

      .outro-container wa-button {
        margin-top: 1.5rem;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(0.5rem);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      wa-button::part(base) {
        font-size: 1.2rem;
        padding: 1.2rem 2rem;
        border-radius: 1.2rem;
        background-color: var(--wa-color-neutral-90);
        color: var(--wa-color-neutral-10);
        transition:
          background-color 0.2s ease,
          transform 0.2s ease;
        border: none;
        background-color: #fff;
      }

      wa-button-group::part(base) {
        gap: 1.5rem;
        justify-content: center;
      }

      wa-button::part(base):hover {
        background-color: var(--ci-button-hover);
        transform: scale(1.02);
        border-color: var(--ci-button-hover);
      }

      wa-progress-bar::part(base) {
        height: 8px;
        border-radius: 999px;
        background-color: var(--wa-color-neutral-80);
        margin-bottom: 2rem;
      }

      wa-progress-bar::part(indicator) {
        background-color: var(--ci-text-color-highlight-strong, #ccc);
        transition: width 0.3s ease;
      }
      @media (max-width: 600px) {
        .card-overview {
          padding: 20px 1rem;
        }

        .question-container {
          width: 100%;
          max-width: 30rem;
          margin-left: auto !important;
          margin-right: auto !important;
          padding: 0 !important;
          word-break: normal;
          overflow-wrap: normal;
          hyphens: none;
        }
        .outro-container {
          padding: 1rem;
        }

        wa-button::part(base) {
          width: 100%;
          box-sizing: border-box;
          font-size: 1.1rem; /* Leicht größer als jetzt (1rem) */
          padding: 1rem 1.2rem; /* Etwas weniger horizontal, damit nicht so breit */
        }
        wa-button-group::part(base) {
          gap: 1rem;
          width: 100%;
          flex-direction: column;
          margin: 0 !important;
        }

        .question-text {
          font-size: 1.4rem;
          line-height: 1.5;
          margin-bottom: 2rem;
          word-break: normal;
          overflow-wrap: normal;
          hyphens: none;
        }

        form.validation {
          width: 100%;
        }

        .outro-container wa-button {
          margin-top: 1.5rem;
        }
      }
    `,
  ];
}
