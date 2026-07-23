import { LitElement, html, css } from 'lit';
import { OwcAutocomplete } from '../autocomplete/OwcAutocomplete.js';

import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/tag/tag.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';
import '@awesome.me/webawesome/dist/components/radio/radio.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import '@awesome.me/webawesome/dist/components/relative-time/relative-time.js';
import { OwcTemplateEditor } from '../template-editor/OwcTemplateEditor.js';
import { resolveRecipientStatus, useShortFormatter } from './recipientHelpers.js';

/**
 * @typedef {{
 *   toId: string,
 *   subject: string,
 *   text: string,
 *   from: string,
 * }} mailData
 */

/**
 * @template {Record<string, string> & {user: {email: string}}} T
 */
export class OwcComposeEmail extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'owc-autocomplete': OwcAutocomplete,
    'owc-template-editor': OwcTemplateEditor,
  };

  static properties = {
    recipientList: { type: Array },
    emailFormatter: { type: Function },
    shortEmailFormatter: { type: Function },
    formatterMode: { type: String },
    previewIndex: { type: Number },
    previewMode: { type: Boolean },
    addUnsubscribe: { type: Function },
    draftInfo: { type: Boolean },
    allowSendActions: { type: Boolean },
    textModuleOptions: { type: Array },
    sendDate: { type: Object },
    selectVariant: { type: Function },
    templates: { type: Object },
    grapeEditorBlocks: { type: Array },
    defaultStyling: { type: String },
    defaultStyleAttributesByComponent: { type: Object },
    componentOptions: { type: Object },
    defaultVariables: { type: Object },
    recipientIsGood: { type: Function },
    tags: { type: Array },
    extraActions: { type: Function },
    showHelpButton: { type: Boolean },
    showFileUpload: { type: Boolean },
    handleFileUpload: { type: Function },
    renderFileContent: { type: Function },
    showEditorSwitch: { type: Boolean },
  };

  constructor() {
    super();
    /** @type {Array<T>} */
    (this.recipientList = []);
    /** @type {(to: T) => {good: true, reason?: string} | {good: false, reason: string} }*/
    this.recipientIsGood = () => ({ good: true });

    this.previewIndex = 0;
    this.previewMode = false;
    this.draftInfo = false;
    this.allowSendActions = true;

    /**@type {Record<string, import('../template-editor/OwcTemplateEditorTypes.js').TemplateRecord>} */
    this.templates = {};
    /** @type {OwcTemplateEditor['grapeEditorBlocks']} */
    this.grapeEditorBlocks = [];
    /** @type {string} */
    this.defaultStyling = '';
    /** @type {Record<string, Record<string, string>>} */
    this.defaultStyleAttributesByComponent = {};
    /** @type {OwcTemplateEditor['componentOptions']} */
    this.componentOptions = {};

    /**@type {'short' | 'long' | `${number}auto`} */
    this.formatterMode = '500auto';

    /**
     *
     * @param {{ recipient: T; good: boolean; reason?: string, remove: () => void }} recipient
     * @returns {string | import('lit').TemplateResult}
     */
    this.emailFormatter = ({ recipient, good, remove }) => html`
      <wa-tag
        size="m"
        removable
        @wa-remove=${remove}
        class="recipient"
        variant=${good ? 'neutral' : 'danger'}
      >
        ${recipient.email}
      </wa-tag>
    `;

    /**
     *
     * @param {Array<T>} recipientList
     * @param {Array<T>} recipientListGood
     * @returns {string | import('lit').TemplateResult}
     */
    this.shortEmailFormatter = (recipientList, recipientListGood) => html`
      Good: ${recipientListGood.length}, Bad: ${recipientList.length - recipientListGood.length}
    `;

    /**@type {Record<string,string | ((recipient: T) => string)>} */
    this.defaultVariables = {};

    /**@type {{selection: Range; field: 'body'} | {selection: HTMLInputElement, field: 'subject'} | undefined} */
    this.selection = undefined;

    /**@type {{label: string, value: string}[]} */
    (this.textModuleOptions = []);
    this.sendDate = undefined;

    /**@type {(recipientListGood: OwcComposeEmail<T>['recipientListGood'] ) => ReturnType<html>} */
    this.extraActions = () => html``;

    /**
     * @type {(input: string, recipient: T, currentTag?: {value: string, labelUnsubscribe: string} ) => string}
     */
    this.addUnsubscribe = input => input;

    /**
     * @type {(data: Record<string, any>, options: string[]) => options[number]}
     */
    this.selectVariant = () => 'default';

    /**
     * @template T
     * @type {(options: {
     *  draft: boolean,
     *  recipientList: Array<T>,
     *  generateMailFromTo: (to: T) => mailData
     *  currentTemplateRecord: import('../template-editor/OwcTemplateEditorTypes.js').TemplateRecord
     *  sendDate: Date | undefined
     *  }
     * ) => Promise<Record<string, any> & {status: "success" | "error", draft: boolean}> } options
     */
    this.sendMail = async ({ draft }) => {
      return { status: 'success', draft };
    };

    /**
     * @type {(options: Record<string, any> & {status: "success" | "error", draft: boolean}) => void}
     */
    this.afterSend = () => {
      null;
    };

    /**@type {{value: string, label: string, labelUnsubscribe: string}[]} */
    (this.tags = []);

    this.showHelpButton = false;
    this.showEditorSwitch = true;

    this.showFileUpload = false;
    /**@type {OwcTemplateEditor['handleFileUpload']} */
    this.handleFileUpload = async () => {};
    /**@type {OwcTemplateEditor['renderFileContent']} */
    this.renderFileContent = undefined;
  }

  /**
   *
   * @param {T} recipient
   */
  getRecipientStatus(recipient) {
    const currentTag = this.currentTemplateRecord?.options?.tag;
    return resolveRecipientStatus(
      this.recipientIsGood(recipient),
      !!(currentTag && recipient.tagList?.includes(currentTag)),
      !!currentTag,
    );
  }

  // Needs a stale pointer because of wave based updates
  recipientListGoodIsStale = true;
  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    this.recipientListGoodIsStale = true;
    super.update(changedProperties);
  }

  // Cache this as it might be as calculation might be a little more involved
  /**@type {T[]} */
  recipientListGoodCached = [];
  get recipientListGood() {
    if (this.recipientListGoodIsStale) {
      this.recipientListGoodCached = this.recipientList.filter(
        to => this.getRecipientStatus(to).good,
      );
    }
    return this.recipientListGoodCached;
  }

  get valueList() {
    const getValueForItem =
      /**@type {(data: Record<string, any>, dataParameter: Record<string, any>) => {subject: string, html: string}}*/ (
        // @ts-ignore
        this.shadowRoot?.querySelector('owc-template-editor')?.generateValueForData
      );
    if (!getValueForItem) {
      return undefined;
    }
    return this.recipientListGood.map(client => {
      const { subject, html } = getValueForItem(
        {
          client,
          user: client.user,
          default: this.defaultVariables,
        },
        client,
      );
      return {
        email: client.email,
        subject,
        body: html,
      };
    });
  }

  get value() {
    const editor = /**@type {OwcTemplateEditor}*/ (
      this.shadowRoot?.querySelector('owc-template-editor')
    );
    if (!editor || !editor.currentTemplateRecord || !this.templates) {
      return undefined;
    }
    return {
      template: editor.currentTemplateRecord,
      recipients: this.recipientListGood.map(elm => elm.email),
    };
  }

  get currentTemplateRecord() {
    const editor = /**@type {OwcTemplateEditor}*/ (
      this.shadowRoot?.querySelector('owc-template-editor')
    );
    if (!editor || !editor.currentTemplateRecord || !this.templates) {
      return undefined;
    }
    return editor.currentTemplateRecord;
  }

  get templateData() {
    const templateEditor = /**@type {OwcTemplateEditor}*/ (
      this.shadowRoot?.querySelector('owc-template-editor')
    );
    if (!templateEditor) {
      return {};
    }
    return templateEditor.templateData;
  }

  togglePreviewMode() {
    this.previewMode = !this.previewMode;
  }

  nextPreview() {
    if (this.previewIndex < this.recipientListGood.length - 1) {
      this.previewIndex += 1;
    } else {
      this.previewIndex = 0;
    }
  }

  previousPreview() {
    if (this.previewIndex > 0) {
      this.previewIndex -= 1;
    } else {
      this.previewIndex = this.recipientListGood.length - 1;
    }
  }

  /**
   * @param {{target: {value: string}}} ev
   */
  #handleDateChange(ev) {
    if (!ev.target.value) {
      this.sendDate = undefined;
    } else if (new Date(ev.target.value) < new Date()) {
      this.sendDate = undefined;
      ev.target.value = '';
    } else {
      this.sendDate = new Date(ev.target.value);
    }
  }

  /**
   *
   * @param {{draft: boolean, sendDate?: Date}} options
   */
  async #handleSendClick({ draft, sendDate }) {
    const templateEditor = /**@type {OwcTemplateEditor} */ (
      this.shadowRoot?.querySelector('owc-template-editor')
    );
    if (!templateEditor) {
      // Do error message things
      return;
    }
    if (!this.currentTemplateRecord) {
      return;
    }

    await templateEditor.validate();
    if (!templateEditor.valid) {
      // Do error message things
      return;
    }

    const sendMailReturn = await this.sendMail({
      draft,
      recipientList: this.recipientListGood,
      generateMailFromTo: this.generateMail,
      sendDate,
      currentTemplateRecord: this.currentTemplateRecord,
    });
    this.allowSendActions = false;
    this.afterSend(sendMailReturn);
    setTimeout(() => {
      this.allowSendActions = true;
    }, 2000);
  }

  /**
   *
   * @param {T} to
   * @returns
   */
  generateMail = to => {
    const templateEditor = this.shadowRoot?.querySelector('owc-template-editor');

    if (!templateEditor) {
      return {
        toId: '',
        subject: '',
        text: '',
        from: '',
      };
    }

    // @ts-ignore
    const { subject, html } = templateEditor.generateValueForData({
      client: to,
      user: to.user,
      default: this.defaultVariables,
    });
    return {
      toId: to?.id,
      subject,
      text: html,
      from: to.user.email,
    };
  };

  /**
   * @param {T} recipient
   */
  removeRecipient(recipient) {
    this.recipientList = this.recipientList.filter(client => client.id !== recipient.id);
  }

  renderRecipientList() {
    if (useShortFormatter(this.formatterMode, this.recipientList.length)) {
      return this.shortEmailFormatter(this.recipientList, this.recipientListGood);
    }

    return html`
      ${this.recipientList.map(recipient => {
        const { good, reason } = this.getRecipientStatus(recipient);
        return this.emailFormatter({
          recipient,
          good,
          reason,
          remove: () => this.removeRecipient(recipient),
        });
      })}
    `;
  }

  render() {
    return html`
      <header>
        <div>
          <label for="to">Empfänger</label>
          <div class="to-list">${this.renderRecipientList()}</div>
        </div>
        <owc-template-editor
          showSubject
          ?showFileUpload=${this.showFileUpload}
          .showEditorSwitch=${this.showEditorSwitch}
          .showEmailTagSelection=${true}
          .handleFileUpload=${this.handleFileUpload}
          .renderFileContent=${this.renderFileContent}
          ?previewMode=${this.previewMode}
          .previewData=${{
            client: this.recipientListGood[this.previewIndex],
            user: this.recipientListGood[this.previewIndex]?.user,
            default: this.defaultVariables,
          }}
          .previewDataParameter=${this.recipientListGood[this.previewIndex]}
          @templateUpdate=${() => this.requestUpdate()}
          @tag-change=${() => this.requestUpdate()}
          .tags=${this.tags}
          .templates=${this.templates}
          .grapeEditorBlocks=${this.grapeEditorBlocks}
          .defaultStyling=${this.defaultStyling}
          .defaultStyleAttributesByComponent=${this.defaultStyleAttributesByComponent}
          .componentOptions=${this.componentOptions}
          .textModuleOptions=${this.textModuleOptions}
          .selectVariant=${this.selectVariant}
          .postProcessor=${(/** @type {string} */ input, /** @type {T} */ recipient) =>
            this.addUnsubscribe(
              input,
              recipient,
              this.tags.find(elm => elm.value === this.currentTemplateRecord?.options?.tag),
            )}
          .showHelpButton=${this.showHelpButton}
          .showVariantSwitch=${true}
          .disableVariantSwitch=${true}
        ></owc-template-editor>
        <footer>
          <div>
            ${
              this.previewMode === false
                ? html`<wa-button @click=${this.togglePreviewMode} appearance="outlined"
                    >Vorschau</wa-button
                  >`
                : html`
                    <wa-button @click=${this.togglePreviewMode} appearance="outlined"
                      >Bearbeiten</wa-button
                    >
                    ${
                      this.recipientListGood.length > 1
                        ? html`
                            <wa-button @click=${this.previousPreview} appearance="outlined"
                              >vorherige Vorschau</wa-button
                            >
                            <span>${this.previewIndex + 1} / ${this.recipientListGood.length}</span>
                            <wa-button @click=${this.nextPreview} appearance="outlined"
                              >nächste Vorschau</wa-button
                            >
                          `
                        : ''
                    }
                  `
            }
          </div>
          <wa-input
            class="send-date-picker"
            type="datetime-local"
            placeholder="Versende Datum"
            clearable
            @change=${this.#handleDateChange}
            @wa-focus=${(/** @type {{ target: { showPicker: () => void; }; }} */ ev) =>
              ev.target.showPicker()}
          ></wa-input>

          <div class="send-button-container">
            <div class="extra-actions">${this.extraActions?.(this.recipientListGood) || ''}</div>
            <div class="send-button-wrapper">
              <wa-button
                @click=${() => this.#handleSendClick({ draft: true })}
                ?disabled=${!this.allowSendActions}
                appearance="outlined"
              >
                alle ${this.recipientListGood.length} als Entwurf speichern
              </wa-button>
              <wa-button
                @click="${() => this.#handleSendClick({ draft: false, sendDate: this.sendDate })}"
                ?disabled=${!this.allowSendActions}
                appearance="outlined"
              >
                alle ${this.recipientListGood.length}
                ${
                  this.sendDate
                    ? html`<wa-relative-time
                        date=${this.sendDate.toISOString()}
                      ></wa-relative-time>`
                    : 'jetzt '
                }
                senden
              </wa-button>
            </div>
          </div>
        </footer>
      </header>
    `;
  }

  static styles = [
    css`
      * {
        font-family: var(--wa-font-family-body);
      }

      label {
        display: block;
        padding: 0.5rem 0 0.1rem 0;
      }

      footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 1rem;
      }
      .card-basic {
        width: 100%;
        word-wrap: break-word;
      }

      .to-list {
        padding: 0 0 var(--wa-space-2xs) var(--wa-space-2xs);
        resize: vertical;
        overflow-y: auto;
        max-height: 125px;
        flex-wrap: wrap;
        display: flex;
        align-content: flex-start;
        position: relative;
        min-height: calc(var(--wa-form-control-height) - var(--wa-form-control-border-width) * 2);
        background-color: var(--wa-form-control-background-color);
        border: solid var(--wa-form-control-border-width) var(--wa-form-control-border-color);
        border-radius: var(--wa-form-control-border-radius);
      }
      .to-list[style*='height'] {
        max-height: unset;
      }

      .send-date-picker {
        display: inline-block;
        padding-right: 20px;
      }

      .send-button-container {
        display: flex;
        height: 100%;
        justify-content: center;
        align-items: flex-end;
        gap: 20px;
      }

      .send-button-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 10px;
      }

      .extra-actions {
        display: flex;
        gap: 20px;
        align-items: flex-end;
      }

      .body {
        border: 1px solid #ccc;
        border-radius: 4px;
      }

      .bodyDiv {
        padding: 8px;
        font-family:
          'Yu Gothic', sans-serif, serif, EmojiFont; /* Optional: Schriftart für Textinhalt */
        font-size: 14px; /* Optional: Schriftgröße für Textinhalt */
        line-height: 1.5; /* Optional: Zeilenhöhe für Textinhalt */
        min-height: 400px; /* Mindesthöhe, um das Aussehen einer Textarea zu simulieren */
        width: 100%; /* Vollständige Breite */
        box-sizing: border-box; /* Berücksichtigt Rand- und Padding-Werte in der Gesamtbreite */
      }

      .body-header {
        display: flex;
        width: 100%;
        box-sizing: border-box;
        color: #6b7280;
        background-color: #f9fafb;
        align-items: center;
        border-bottom: 1px solid #ccc;
        gap: 10px;
      }

      #text-module-selector {
        width: 20%;
        padding-top: 10px;
        padding-bottom: 10px;
        padding-left: 10px;
      }

      .recipient {
        margin: var(--wa-space-2xs) var(--wa-space-2xs) 0 0;
      }
    `,
  ];
}
