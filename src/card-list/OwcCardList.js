import { LitElement, css, html, nothing } from 'lit';
import { OwcCard } from '../card/OwcCard.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';

/**
 * @template {Record<string, unknown>} T
 */
export class OwcCardList extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'owc-card': OwcCard,
  };

  static properties = {
    title: { type: String },
    viewAllUrl: { type: String },
    data: { type: Array },
    fields: { type: Object },
    sorter: { type: Function },
  };

  constructor() {
    super();

    /**
     * @param {T} _row
     * @returns {import('../table/OwcTable.types.js').RowLinkSettings}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.getCardLinkSettings = _row => ({ href: '' });
    /**@type {T[]} */
    this.data = [];
    /**@type {(a: T, b: T) => number} */
    this.sorter = () => 0;
    /**@type {import('./CardListTypes.js').Fields<T>} */
    this.fields = { body: () => '' };
    this.title = '';
    this.viewAllUrl = '';
  }

  render() {
    return html`
      <div id="card-list">
        <div class="title">
          <h2>${this.title}</h2>
          ${
            this.viewAllUrl
              ? html`<a class="view-all" href=${this.viewAllUrl}><b>Alle Anzeigen</b></a>`
              : ''
          }
        </div>
        <div class="card-wrapper">
          <div class="card-list">
            ${[...this.data]
              .sort(this.sorter)
              .slice(0, 10)
              .map(
                elm => html`
                  <div class="card">
                    <owc-card
                      href=${this.getCardLinkSettings(elm).href}
                      style="${this.#renderStyles(elm)}"
                    >
                      ${this.#renderImage(elm)} ${this.#renderHeader(elm)} ${this.#renderBody(elm)}
                      ${this.#renderFooter(elm)}
                    </owc-card>
                  </div>
                `,
              )}
          </div>
        </div>
      </div>
    `;
  }

  /**
   *
   * @param {T} data
   */
  #renderStyles(data) {
    if (!this.fields.style) {
      return '';
    }
    return this.fields.style(data);
  }

  /**
   *
   * @param {T} data
   */
  #renderImage(data) {
    if (!this.fields.image?.src || !this.fields.image?.alt) {
      return nothing;
    }
    return html` <img
      slot="media"
      src=${this.fields.image.src(data)}
      alt=${this.fields.image.alt(data)}
    />`;
  }

  /**
   *
   * @param {T} data
   */
  #renderHeader(data) {
    if (!this.fields.header) {
      return nothing;
    }
    return html` <div slot="header">${this.fields.header(data)}</div>`;
  }

  /**
   *
   * @param {T} data
   */
  #renderFooter(data) {
    if (!this.fields.footer) {
      return nothing;
    }
    return html` <div slot="footer">${this.fields.footer(data)}</div>`;
  }

  /**
   *
   * @param {T} data
   */
  #renderBody(data) {
    return html` <div class="body">${this.fields.body(data)}</div>`;
  }

  static styles = [
    css`
      :host {
        display: block;
      }

      #card-list {
        width: 90%;
        padding: 20px;
        border: 1px solid var(--wa-color-neutral-80); /* Add border */
        border-radius: 8px; /* Add border radius for a nicer appearance */
      }

      .title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .title h2 {
        margin: 0;
      }

      .view-all {
        color: #37a0ee;
        text-decoration: none;
      }

      .card-list {
        display: flex;
        justify-content: left;
        gap: 10px;
      }

      .card-wrapper {
        width: 100%;
        overflow: hidden;
      }

      owc-card {
        width: 250px;
      }
    `,
  ];
}
