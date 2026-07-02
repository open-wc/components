import { LitElement, html, css, nothing } from 'lit';
import DOMPurify from 'dompurify';
import { OwcAutocomplete } from '../autocomplete/OwcAutocomplete.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/tab/tab.js';
import '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';

import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import '@awesome.me/webawesome/dist/components/relative-time/relative-time.js';
import { JsonForm } from '@finum/data-table/JsonForm.js';
import { OwcSeparator } from '../separator/OwcSeparator.js';
import { classMap } from 'lit/directives/class-map.js';
import { filesToObj, generateValueForData, replaceValues } from './generateValueForData.js';
import { OwcFileUpload } from '../file-upload/OwcFileUpload.js';
import { OwcEmailTagRadioGroup } from '../compose-email/OwcEmailTagRadioGroup.js';

/**
 * @typedef {{
 *   toId: string,
 *   subject: string,
 *   text: string,
 *   from: string,
 * }} mailData
 */

/** @typedef {import('./OwcTemplateEditorTypes.js').TemplateRecord} TemplateRecord */

/**
 *
 * @param {Object} obj
 * @returns
 */
function deepCopySerializable(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export class OwcTemplateEditorOld extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'owc-autocomplete': OwcAutocomplete,
    'owc-separator': OwcSeparator,
    'json-form': JsonForm,
    'owc-file-upload': OwcFileUpload,
    'owc-email-tag-radio-group': OwcEmailTagRadioGroup,
  };

  static properties = {
    previewMode: { type: Boolean },
    selection: { type: Object },
    templates: { type: Object },
    textModuleOptions: { type: Array },
    previewData: { type: Object },
    previewDataParameter: { type: Object },
    showSubject: { type: Boolean },
    subject: { type: String },
    currentTemplateRecord: { type: Object },
    templateData: { type: Object },
    forceFormErrors: { type: Boolean },
    postProcessor: { type: Function },
    selectVariant: { type: Function },
    currentVariant: { type: String },
    currentIndex: { type: Number },
    enableMultiTemplate: { type: Boolean, reflect: true, attribute: 'multi-template' },
    showMultiTemplateButtons: { type: Boolean, reflect: true, attribute: 'multi-template-buttons' },
    showTemplateSelection: { type: Boolean },
    showTemplateName: { type: Boolean },
    delayMessage: { type: Object },
    showHelpButton: { type: Boolean },
    handleFileUpload: { type: Function },
    showFileUpload: { type: Boolean },
    selectedEmailTag: { type: String },
    showEmailTagSelection: { type: Boolean },
    tags: { type: Array },
  };

  constructor() {
    super();
    this.previewMode = false;
    this.subject = '';
    this.showSubject = false;

    /**@type {Record<string,import('./OwcTemplateEditorTypes.js').TemplateRecord>} */
    this.templates = {};
    this.currentIndex = 0;

    /**@type {{selection: Range; field: 'body'} | {selection: HTMLInputElement, field: 'subject'} | undefined} */
    this.selection = undefined;

    /**@type {{label: string, value: string}[]} */
    this.textModuleOptions = /**@type {{label: string, value: string}[]} */ ([]);

    /**@type {Record<string, any>} */
    this.previewData = {};

    /**@type {Record<string, any>} */
    this.previewDataParameter = {};

    /**@type {Record<string,any>} */
    this.templateData = {};

    /**@type {import('./OwcTemplateEditorTypes.js').TemplateRecord & {label: string}} */
    this.currentTemplateRecord = {
      name: 'Kein Template',
      label: 'default',
      template: [{ default: { html: '', subject: '' } }],
    };

    /** @type {string | undefined} */
    this.selectedEmailTag = undefined;

    this.showEmailTagSelection = true;
    /**@type {{value: string, label: string, labelUnsubscribe: string}[]} */
    (this.tags = []);

    this.forceFormErrors = false;
    /**@type {(input: string, data: Record<string, any>) => string} */
    this.postProcessor = input => input;

    /**
     * @type {(data: Record<string, any>, options: string[]) => options[number]}
     * */
    this.selectVariant = (data, options) => {
      const variantSelector = /**@type {{value: string} | undefined}*/ (
        this.shadowRoot?.querySelector('#variant-selector')
      );
      if (options.includes(variantSelector?.value || '')) {
        return variantSelector?.value || 'default';
      }
      return 'default';
    };

    this.firstTemplateUpdate = true;
    this.currentVariant = 'default';

    this.enableMultiTemplate = false;
    this.showMultiTemplateButtons = true;
    this.showTemplateSelection = true;
    this.showTemplateName = false;

    this.delayMessage = {
      beforeInput: 'Wird verschickt',
      afterInput: 'Tage nach vorheriger Nachricht',
    };

    this.showHelpButton = false;
    this.showFileUpload = false;

    /**
     * @type {(options: {allFiles: (import('../file-upload/OwcFileUpload.js').FilePlus & {readonly id?: string})[], newFiles: (import('../file-upload/OwcFileUpload.js') .FilePlus & {readonly id?: string})[], insertTextAtCaret: OwcTemplateEditorOld['insertTextAtCaret'], requestUpdate: () => void}) => Promise<void>}
     */
    this.handleFileUpload = async () => {
      null;
    };

    /**
     * @type {OwcFileUpload['renderCardContent'] | undefined}
     */
    this.renderFileContent = undefined;
  }

  firstUpdated() {
    const templateSelector = /**@type {{value: string} | undefined} */ (
      this.shadowRoot?.querySelector('#template-selector')
    );
    if (templateSelector) {
      templateSelector.value = 'default';
    }
  }

  /**
   * @returns {HTMLElement | null | undefined}
   */
  get bodyEl() {
    return this.shadowRoot?.querySelector(`#body${this.currentIndex}`);
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  updated(changedProperties) {
    super.updated(changedProperties);
    if (this.bodyEl) {
      if (
        changedProperties.has('previewMode') ||
        changedProperties.has('previewData') ||
        changedProperties.has('templateData') ||
        changedProperties.has('currentIndex')
      ) {
        this.#setTemplate();
      }
    }
    setTimeout(() => this.showTemplate(this.currentIndex), 10);
    if (changedProperties.has('currentTemplateRecord')) {
      this.dispatchEvent(new Event('templateUpdate'));
    }
  }

  #getCurrentVariantOptions() {
    return Object.keys(this.currentTemplateRecord.template[this.currentIndex]);
  }

  /**
   *
   * @param {boolean} preview
   * @param {Record<string, any>} [data]
   * @returns
   */
  #getCurrentTexts(preview, data) {
    // TODO: Make order selectable
    if (preview) {
      return this.currentTemplateRecord.template[this.currentIndex][
        this.selectVariant(this.previewData, this.#getCurrentVariantOptions())
      ];
    }
    if (data) {
      return this.currentTemplateRecord.template[this.currentIndex][
        this.selectVariant(data, this.#getCurrentVariantOptions())
      ];
    }
    const template = this.currentTemplateRecord.template[this.currentIndex];
    return template[this.currentVariant] || template[Object.keys(template)[0]];
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (
      changedProperties.has('templates') &&
      this.currentTemplateRecord.label.includes('default') &&
      this.firstTemplateUpdate
    ) {
      const defaultTemplateLabel =
        Object.keys(this.templates).find(elm => elm.includes('default')) || 'default';
      if (this.templates[defaultTemplateLabel]) {
        changedProperties.set('currentTemplateRecord', this.currentTemplateRecord);
        this.currentTemplateRecord = deepCopySerializable({
          ...this.templates[defaultTemplateLabel],
          label: defaultTemplateLabel,
        });
        this.firstTemplateUpdate = false;
      }
    }
    if (changedProperties.has('currentTemplateRecord')) {
      this.forceFormErrors = false;
      if (this.currentTemplateRecord) {
        const types = Object.keys(this.currentTemplateRecord.template[0]);
        if (!types.includes(this.currentVariant)) {
          this.currentVariant = types[0];
        }
        this.templateData = this.currentTemplateRecord?.options?.value || {};
      }
      // Set template is called after update
    } else if (changedProperties.has('currentVariant')) {
      this.#setTemplate();
    } else if (changedProperties.has('currentIndex')) {
      this.#setTemplate();
    }
    if (changedProperties.has('previewData') && this.previewMode) {
      this.currentVariant = this.selectVariant(this.previewData, this.#getCurrentVariantOptions());
    }
    if (changedProperties.has('previewMode')) {
      this.#setTemplate();
    }
    super.update(changedProperties);
  }

  #setTemplate() {
    if (!this.currentTemplateRecord) {
      return;
    }
    const correctVariant = this.#getCurrentTexts(this.previewMode);
    if (!correctVariant) {
      return;
    }
    const bodyElement = this.shadowRoot?.querySelector(`#body${this.currentIndex}`);
    if (bodyElement) {
      if (this.previewMode) {
        bodyElement.innerHTML = this.previewString(correctVariant.html, this.previewData);
      } else {
        bodyElement.innerHTML = DOMPurify.sanitize(correctVariant.html);
      }
    }

    const subjectElement = /**@type {{value: string} | undefined}*/ (
      this.shadowRoot?.querySelector('#subject')
    );
    if (subjectElement) {
      if (this.previewMode) {
        subjectElement.value = replaceValues(
          correctVariant.subject,
          { ...this.previewData, fileList: filesToObj(this.currentTemplateRecord) },
          this.previewDataParameter,
        );
      } else {
        subjectElement.value = correctVariant.subject;
      }
    }
  }

  /**
   * @param {string} text
   * @param {Record<string,Object>} previewData
   */
  previewString(text, previewData) {
    const processedText = this.postProcessor(text, this.previewData);
    const preview = replaceValues(
      processedText,
      {
        ...previewData,
        template: this.templateData,
        fileList: filesToObj(this.currentTemplateRecord),
      },
      this.previewDataParameter,
    );
    return DOMPurify.sanitize(preview);
  }

  togglePreviewMode() {
    this.previewMode = !this.previewMode;
  }

  /**
   *
   * @param {{target: {value: string}}} ev
   */
  #nameInputChange(ev) {
    this.currentTemplateRecord.name = ev.target.value;
  }

  /**
   * @param {Event} ev
   */
  #subjectInputChange(ev) {
    if (!this.previewMode) {
      const typedTarget = /** @type {HTMLInputElement} */ (ev.target);
      this.#getCurrentTexts(false).subject = typedTarget.value;
    }
  }

  /**
   * @param {Event} ev
   */
  #subjectBlur(ev) {
    const typedTarget = /** @type {HTMLInputElement} */ (
      // @ts-ignore
      ev.target.shadowRoot.querySelector('input')
    );
    this.selection = { field: 'subject', selection: typedTarget };
  }

  /**
   * @param {Event} ev
   */
  #bodyInputChange(ev) {
    if (!this.previewMode) {
      const typedTarget = /** @type {HTMLInputElement} */ (ev.target);
      this.#getCurrentTexts(false).html = `${typedTarget.innerHTML} 
      `;
    }
  }

  #bodyBlur() {
    // @ts-ignore
    const sel = this.shadowRoot?.getSelection();
    if (sel?.getRangeAt && sel.rangeCount) {
      this.selection = { field: 'body', selection: sel.getRangeAt(0) };
    }
  }

  /**
   * @param {Event} ev
   */
  #templateSelectorChange(ev) {
    if (this.previewMode) {
      return;
    }
    const typedTarget = /** @type {HTMLSelectElement} */ (ev.target);
    const selected = typedTarget.value;
    if (this.templates[selected]) {
      this.currentTemplateRecord = deepCopySerializable({
        ...this.templates[selected],
        label: selected,
      });
    }
    this.currentIndex = 0;
    this.dispatchEvent(new Event('templateUpdate'));
  }

  /**
   * @param {Event} ev
   */
  #variantSelectorChange(ev) {
    const variantSelector = /**@type {{value: string} | null}*/ (ev.target);
    if (!variantSelector) {
      return;
    }
    this.currentVariant = variantSelector.value;
  }

  /**
   * @param {Event} ev
   */
  #templateFormChange(ev) {
    const form = /**@type {{validatorState: {valid: boolean}, value: Record<String,any>}}*/ (
      /**@type {unknown}*/ (ev.target)
    );
    this.templateData = form.value || {};
    if (this.currentTemplateRecord.options) {
      this.currentTemplateRecord.options.value = this.templateData;
    }
    this.dispatchEvent(new Event('template-data-change', { bubbles: true, composed: true }));
    this.requestUpdate('templateData');
  }

  async validate() {
    const jsonForm = /**@type {JsonForm}*/ (this.shadowRoot?.querySelector('json-form'));
    if (jsonForm) {
      this.forceFormErrors = true;
      jsonForm.validate();
      if (!jsonForm.validatorState.valid) {
        await this.updateComplete;
        setTimeout(() => jsonForm.getFirstInvalid()?.scrollIntoView(), 100);
      } else if (!this.#delaysValid().valid) {
        this.currentIndex = this.#delaysValid().firstInvalid;
        await this.updateComplete;
        const delayInput = this.shadowRoot?.querySelector('.delay-input');
        setTimeout(() => delayInput?.scrollIntoView(), 100);
      }
    }
  }

  /**
   *
   * @returns {{valid: true; firstInvalid: -1} | {valid: false; firstInvalid: number}}
   */
  #delaysValid() {
    const delays = this.currentTemplateRecord.options?.delays;
    const templates = this.currentTemplateRecord.template;
    const delaysValid =
      !delays || (delays.every(Boolean) && delays.length === templates.length - 1);

    if (!delays) {
      return { valid: delaysValid, firstInvalid: -1 };
    }

    let firstInvalidDelay = delays?.findIndex(elm => !elm);
    if (firstInvalidDelay === -1) {
      firstInvalidDelay = delays?.length;
    }
    // @ts-ignore
    return {
      valid: delaysValid,
      firstInvalid: firstInvalidDelay + 1,
    };
  }

  get valid() {
    return (
      (!this.shadowRoot?.querySelector('json-form') ||
        // @ts-ignore
        this.shadowRoot?.querySelector('json-form')?.validatorState.valid) &&
      this.#delaysValid().valid
    );
  }

  /**
   * @param {number} num
   */
  showTemplate(num) {
    const tabGroup = this.shadowRoot?.querySelector('wa-tab-group');
    if (!tabGroup) {
      return;
    }
    tabGroup.active = num.toString();
  }

  /**
   *
   * @param {{target: HTMLElement, detail: {name: string}}} ev
   */
  #handleTabChange(ev) {
    if (this.previewMode) {
      this.showTemplate(this.currentIndex);
      return;
    }

    if (ev.detail.name === 'add') {
      const templateArr = this.currentTemplateRecord.template;
      const newTemplate = templateArr[this.currentIndex]
        ? deepCopySerializable(templateArr[this.currentIndex])
        : { default: { subject: '', html: '' } };
      this.currentTemplateRecord.template.splice(this.currentIndex, 0, newTemplate);
      // @ts-ignore
      this.currentTemplateRecord.options?.delays?.splice(this.currentIndex, 0, undefined);
      this.currentIndex += this.currentTemplateRecord.template.length === 1 ? 0 : 1;
      this.requestUpdate();
      return;
    }
    this.currentIndex = Number.parseInt(ev.detail.name);
  }

  /**
   *
   * @param {{target: {panel: string}}} ev
   */
  #handleTabClose(ev) {
    if (this.previewMode) {
      this.showTemplate(this.currentIndex);
      return;
    }

    const tab = ev.target;
    const tabIndex = Number.parseInt(tab.panel);
    this.currentTemplateRecord.template.splice(tabIndex, 1);
    this.currentTemplateRecord.options?.delays?.splice(tabIndex - 1, 1);
    if (this.currentIndex >= tabIndex) {
      this.currentIndex += this.currentIndex === 0 ? 0 : -1;
    }
    this.requestUpdate();
  }

  /**
   *
   * @param {{target: {value?: string}}} ev
   */
  #handleDelayChange(ev) {
    if (!Array.isArray(this.currentTemplateRecord?.options?.delays) || this.currentIndex === 0) {
      this.requestUpdate();
      return;
    }
    // @ts-ignore
    this.currentTemplateRecord.options.delays[this.currentIndex - 1] = Number.parseInt(
      ev.target.value || '',
    );
    // Remove empty indeces
    this.currentTemplateRecord.options.delays = Array.from(
      this.currentTemplateRecord.options.delays,
    );
    this.requestUpdate();
  }

  /**
   * @param {Record<string, any>} data
   * @param {Record<string, any>} dataParameter
   * @param {{index?: number}} [options]
   */
  generateValueForData(data, dataParameter, { index = this.currentIndex } = {}) {
    return generateValueForData(data, this.currentTemplateRecord, {
      index,
      variantSelector: this.selectVariant,
      postProcessor: this.postProcessor,
      htmlSanitizer: DOMPurify.sanitize,
      dataParameter,
    });
  }

  getCurrentTemplate() {
    return deepCopySerializable(this.currentTemplateRecord);
  }

  /**
   * @returns {void}
   */
  markSaved() {
    // The old editor writes directly into currentTemplateRecord, so there is no draft state to clear.
  }

  renderEmailTagRadioGroup() {
    if (!this.showEmailTagSelection || this.tags.length <= 0) {
      return '';
    }

    return html`
      <div class="field email-tag-radio-field">
        <owc-email-tag-radio-group
          .tags=${this.tags}
          .value=${this.currentTemplateRecord.options?.tag}
          .label=${'Art der E-Mail'}
          .handleValueChange=${(/** @type {string | undefined} */ nextValue) => {
            this.selectedEmailTag = nextValue;
            if (this.currentTemplateRecord.options) {
              this.currentTemplateRecord.options.tag = nextValue;
            } else {
              this.currentTemplateRecord.options = { tag: nextValue };
            }
            this.dispatchEvent(new Event('tag-change'));
          }}
        ></owc-email-tag-radio-group>
      </div>
    `;
  }

  render() {
    return html`
      ${
        this.showSubject
          ? html`<header>
              ${
                this.showTemplateName
                  ? html`<div>
                      <label for="Name">Name</label>
                      <wa-input
                        id="name"
                        type="text"
                        ?readonly=${this.previewMode}
                        @change=${this.#nameInputChange}
                        value=${this.currentTemplateRecord.name}
                      ></wa-input>
                    </div>`
                  : nothing
              }
              ${this.renderEmailTagRadioGroup()}
              <div>
                <label for="subject">Betreff</label>
                <wa-input
                  id="subject"
                  type="text"
                  ?readonly=${this.previewMode}
                  @change=${this.#subjectInputChange}
                  @blur=${this.#subjectBlur}
                ></wa-input>
              </div>
              ${
                this.showFileUpload
                  ? html`<div>
                      <label for="files">Dateien</label>
                      <owc-file-upload
                        @files-selected=${async (
                          /** @type {{ detail: {files: import('../file-upload/OwcFileUpload.js').FilePlus[]}, target: { files: import('../file-upload/OwcFileUpload.js').FilePlus[]; requestUpdate: () => void }; }} */ ev,
                        ) => {
                          const selection = this.selection;
                          const allFiles = ev.target.files;
                          const newFiles = ev.detail.files;
                          const target = ev.target;

                          // Set current fileList
                          if (!this.currentTemplateRecord.options) {
                            this.currentTemplateRecord.options = {};
                          }
                          this.currentTemplateRecord.options.fileList = allFiles.map(file => {
                            if (!file.id) {
                              file.id = crypto.randomUUID();
                            }
                            return {
                              ...file,
                              name: file.name,
                              id: file.id,
                              size: file.size,
                              url: file.url,
                            };
                          });

                          await this.handleFileUpload({
                            allFiles,
                            newFiles,
                            insertTextAtCaret: (text, options) =>
                              this.insertTextAtCaret.bind(this)(text, { selection, ...options }),
                            requestUpdate: target.requestUpdate.bind(target),
                          });

                          this.currentTemplateRecord.options.fileList = allFiles.map(file => {
                            if (!file.id) {
                              file.id = crypto.randomUUID();
                            }
                            return {
                              ...file,
                              name: file.name,
                              id: file.id,
                              size: file.size,
                              url: file.url,
                            };
                          });
                          target.requestUpdate();
                        }}
                        .renderCardContent=${this.renderFileContent}
                        .files=${this.currentTemplateRecord.options?.fileList || []}
                      ></owc-file-upload>
                    </div>`
                  : nothing
              }
            </header>`
          : nothing
      }
      <main>
        <div>
          <label for="body">Text</label>
          <div class="body">
          <div class="body-header">
           <div class="body-header-options">${this.renderHeader()}</div> 
           <div class="body-help"><wa-details class="body-help-details">${this.renderHelp()}</wa-details></div>
              ${
                this.currentTemplateRecord?.options?.schema
                  ? html`<owc-separator>Template Optionen</owc-separator
                      ><json-form
                        .schema=${this.currentTemplateRecord.options.schema}
                        .uiSchema=${this.currentTemplateRecord.options.uiSchema}
                        .value=${this.templateData}
                        .forceErrors=${this.forceFormErrors}
                        @formDataChange=${this.#templateFormChange}
                      >
                      </json-form>`
                  : nothing
              }
            </div>
            ${
              this.enableMultiTemplate
                ? html`<div class="tab-container">
                    <wa-tab-group
                      @wa-close=${this.#handleTabClose}
                      @wa-tab-show=${this.#handleTabChange}
                      placement="start"
                    >
                      ${this.currentTemplateRecord.template.map((template, index) => {
                        return html` <wa-tab
                            slot="nav"
                            panel=${index}
                            ?closable=${!this.previewMode && this.showMultiTemplateButtons}
                            >${index + 1}</wa-tab
                          >
                          <wa-tab-panel name=${index}>
                            <div
                              class="bodyDiv"
                              id="body${index}"
                              contenteditable=${!this.previewMode}
                              @input=${this.#bodyInputChange}
                              @blur=${this.#bodyBlur}
                            ></div
                          ></wa-tab-panel>`;
                      })}
                      ${
                        !this.previewMode && this.showMultiTemplateButtons
                          ? html`<wa-tab slot="nav" panel="add">+</wa-tab>
                              <wa-tab-panel name="add"></wa-tab-panel>`
                          : nothing
                      }
                    </wa-tab-group>
                  </div>`
                : html`<div
                    class="bodyDiv"
                    id="body${0}"
                    contenteditable=${!this.previewMode}
                    @input=${this.#bodyInputChange}
                    @blur=${this.#bodyBlur}
                  ></div>`
            }
            <div class="body-footer">${this.renderFooter()}</div>
            </div>
          </div>
        </div>
      </main>
    `;
  }

  renderFooter() {
    let returnString = html``;
    if (this.currentTemplateRecord.options?.delays && this.currentIndex !== 0) {
      returnString = html`${returnString}
        <div class="delay-container">
          <div>${this.delayMessage.beforeInput}</div>
          <wa-input
            @change=${this.#handleDelayChange}
            class=${classMap({
              'delay-input': true,
              invalid:
                this.forceFormErrors && this.#delaysValid().firstInvalid === this.currentIndex,
            })}
            type="number"
            value=${this.currentTemplateRecord.options.delays[this.currentIndex - 1]}
          >
            ${
              this.forceFormErrors && this.#delaysValid().firstInvalid === this.currentIndex
                ? html`<span class="error" slot="hint">Fehlender Wert</span>`
                : nothing
            }
          </wa-input>
          <div>${this.delayMessage.afterInput}</div>
        </div> `;
    }
    return returnString;
  }

  renderHeader() {
    let returnString = html``;
    if (this.textModuleOptions.length > 0) {
      returnString = html`${returnString}
        <owc-autocomplete
          id="text-module-selector"
          placeholder="+ Variable"
          .data=${this.textModuleOptions}
          @change=${(/**@type {{target: {value: any, clear: () => void}}} */ ev) => {
            if (ev.target.value && typeof ev.target.value === 'string') {
              this.insertTextAtCaret(`{${ev.target.value}}`);
            }
            ev.target.clear();
          }}
        ></owc-autocomplete> `;
    }

    if (Object.keys(this.templates).length > 0 && this.showTemplateSelection) {
      // const entries = Object.entries(this.templates ?? {});
      // /**
      //  * @param {TemplateRecord | null | undefined} e
      //  * @returns {string}
      //  */
      // const toName = e => e?.name ?? '';
      // const coll = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
      // const templateLabels = entries
      //   .sort(([, A], [, B]) => coll.compare(toName(A), toName(B)))
      //   .map(([key, val]) => ({
      //     label: toName(val) || '',
      //     value: key,
      //   }));
      returnString = html`${returnString}
        <owc-autocomplete
          id="template-selector"
          .data=${Object.entries(this.templates ?? {})
            .map(([key, val]) => ({ value: key, label: val.name }))
            .sort((a, b) => {
              if (a < b) {
                return -1;
              }
              if (a > b) {
                return 1;
              }
              return 0;
            })}
          value=${this.currentTemplateRecord.label}
          @change=${this.#templateSelectorChange}
          ?disabled=${this.previewMode}
        ></owc-autocomplete> `;
    }

    if (
      this.currentTemplateRecord?.template[this.currentIndex] &&
      Object.keys(this.currentTemplateRecord?.template[this.currentIndex]).length > 1
    ) {
      const types = Object.keys(this.currentTemplateRecord?.template[this.currentIndex]);
      returnString = html`${returnString}
        <wa-radio-group
          id="variant-selector"
          label="Template Varianten"
          value=${this.currentVariant}
          @change=${this.#variantSelectorChange}
        >
          ${types.map(
            type => html`<wa-radio ?disabled=${this.previewMode} value=${type}>${type}</wa-radio>`,
          )}
        </wa-radio-group> `;
    }

    if (this.showHelpButton) {
      returnString = html`${returnString}<wa-button
          @click=${this.toggleHelp}
          class="help-button"
          caret
          outline
          size="small"
          >Hilfe</wa-button
        >`;
    }

    return returnString;
  }

  toggleHelp() {
    const details = /**@type {{open: boolean} | undefined} */ (
      this.shadowRoot?.querySelector('.body-help-details')
    );
    if (!details) {
      return;
    }
    details.open = !details.open;
  }

  renderHelp() {
    return html`
      <div>Text in geschwungenen Klammern "{}" durch passende Werte ersetzen</div>
      <table>
        <tr>
          <td>Art</td>
          <td>Format</td>
          <td>Tipps</td>
        </tr>
        <tr>
          <td>Hyperlink:</td>
          <td>[link href="{link}"]{text}[/link]</td>
          <td>{text} kann auch durch ein Bild ersetzt werden</td>
        </tr>
      </table>
    `;
  }

  /**
   *
   * @param {string} text
   * @param {{selection?: OwcTemplateEditorOld['selection'], type?: 'html' | 'text' }} [options]
   * @returns
   */
  insertTextAtCaret(text, { selection = this.selection, type = 'text' } = {}) {
    if (selection?.field === 'body') {
      // Copied with adjustments from https://stackoverflow.com/questions/2920150/insert-text-at-cursor-in-a-content-editable-div
      const range = selection.selection;
      range.deleteContents();
      if (type === 'text') {
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
      } else {
        const fragment = document.createRange().createContextualFragment(text);
        range.insertNode(fragment);
        range.setStartAfter(range.endContainer);
      }
      // @ts-ignore
      const sel = this.shadowRoot.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      // Dispatch change event, needed for some reason
      this.shadowRoot
        ?.querySelector(`#body${this.currentIndex}`)
        ?.dispatchEvent(new Event('input'));
    } else if (selection?.field === 'subject') {
      const inputElement = selection.selection;

      // Get start and end indices of selection
      const startPos =
        inputElement.selectionStart === null ? undefined : inputElement.selectionStart;
      const endPos = inputElement.selectionEnd;

      if ((!startPos && startPos !== 0) || (!endPos && endPos !== 0)) {
        return;
      }

      // Set delete selection and insert text
      inputElement.value =
        inputElement.value.substring(0, startPos) + text + inputElement.value.substring(endPos);

      // Dispatch change event, needed for some reason
      inputElement.dispatchEvent(new Event('change'));

      // Set selection to after the inserted text
      inputElement.setSelectionRange(startPos + text.length, startPos + text.length, 'forward');

      // Focus the input element
      inputElement.focus();
    }
  }

  static styles = [
    css`
      :host {
        font-family: var(--wa-font-family-body);
      }

      label {
        display: block;
        padding: 0.5rem 0 0.1rem 0;
      }

      footer {
        display: flex;
        justify-content: space-between;
        margin-top: 1rem;
      }
      .card-basic {
        width: 100%;
        word-wrap: break-word;
      }

      .send-date-picker {
        display: inline-block;
        padding-right: 20px;
      }

      .send-button-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        justify-content: center;
        align-items: center;
        gap: 20px;
      }

      .send-button-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        gap: 10px;
      }

      .body {
        border: 1px solid #ccc;
        border-radius: 4px;
      }

      .bodyDiv {
        color: initial;
        padding: 8px;
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
        flex-direction: column;
        color: #6b7280;
        background-color: #f9fafb;
        align-items: start;
        border-bottom: 1px solid #ccc;
      }

      .body-header-options {
        display: flex;
        width: 100%;
        box-sizing: border-box;
        align-items: center;
        gap: 10px;
      }

      #text-module-selector {
        width: 20%;
        padding-top: 10px;
        padding-bottom: 10px;
        padding-left: 10px;
      }

      #template-selector {
        width: 20%;
        padding-top: 10px;
        padding-bottom: 10px;
        padding-left: 10px;
      }

      #variant-selector {
        width: 20%;
        padding-top: 10px;
        padding-bottom: 10px;
        padding-left: 10px;
      }

      .delay-container {
        padding-left: 10px;
        padding-top: 10px;
        padding-bottom: 10px;
        align-items: baseline;
        display: flex;
        gap: 0.6ch;
      }

      .body-footer {
        display: flex;
        width: 100%;
        box-sizing: border-box;
        flex-direction: column;
        background-color: #f9fafb;
        align-items: start;
        border-top: 1px solid #ccc;
      }

      .delay-input {
        max-width: calc(4ch + 50px);
      }

      .body-help {
        width: 100%;
      }

      .body-help-details {
        margin-bottom: 10px;
        padding-left: 10px;
        padding-right: 10px;
        font-size: 14px;
      }

      .body-help-details::part(base) {
        border: none;
        padding: 0;
        box-shadow: none;
      }
      .body-help-details::part(icon) {
        display: none;
      }
      .body-help-details::part(summary) {
        padding: 0;
        margin: 0;
        display: none;
      }
      .body-help-details::part(header) {
        padding: 0;
        display: none;
      }
      .body-help-details::part(content) {
        margin: 0;
        border: 1px solid #e5e7eb;
        border-width: 0 1px 1px 1px;
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
      }

      #files {
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
      #files[style*='height'] {
        max-height: unset;
      }

      json-form {
        width: 90%;
        padding-left: 10px;
        padding-bottom: 10px;
      }

      /* User invalid styles */
      wa-input.invalid::part(base),
      wa-select.invalid::part(combobox),
      wa-checkbox.invalid::part(control) {
        border-color: var(--wa-color-danger-50);
      }

      .invalid::part(form-control-label),
      .error,
      wa-checkbox.invalid::part(label) {
        font-size: var(--wa-font-size-x-small);
        color: var(--wa-color-danger-40);
      }

      wa-input:focus-within.invalid::part(base),
      wa-select:focus-within.invalid::part(combobox),
      wa-checkbox:focus-within.invalid::part(control) {
        border-color: var(--wa-color-danger-50);
        box-shadow: 0 0 0 var(--wa-focus-ring-width) var(--wa-color-danger-80);
      }
    `,
  ];
}
