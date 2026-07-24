import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { LitElement, html, css, nothing } from 'lit';
import { OwcGrapeTemplateEditor } from './OwcGrapeTemplateEditor.js';
import { OwcTemplateEditorOld } from './OwcTemplateEditorOld.js';

import '@awesome.me/webawesome/dist/components/switch/switch.js';

export class OwcTemplateEditor extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'owc-template-editor-old': OwcTemplateEditorOld,
    'owc-template-editor-new': OwcGrapeTemplateEditor,
  };

  static properties = {
    previewMode: { type: Boolean },
    previewMobile: { type: Boolean },
    selection: { type: Object },
    templates: { type: Object },
    grapeEditorBlocks: { type: Array },
    textModuleOptions: { type: Array },
    previewData: { type: Object },
    previewDataParameter: { type: Object },
    defaultStyling: { type: String },
    defaultStyleAttributesByComponent: { type: Object },
    componentOptions: { type: Object },
    showSubject: { type: Boolean },
    subject: { type: String },
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
    showVariantSwitch: { type: Boolean },
    disableVariantSwitch: { type: Boolean },
    delayMessage: { type: Object },
    showHelpButton: { type: Boolean },
    handleFileUpload: { type: Function },
    showFileUpload: { type: Boolean },
    renderFileContent: { type: Function },
    useNewEditor: { type: Boolean },
    selectedEmailTag: { type: String },
    showEmailTagSelection: { type: Boolean },
    tags: { type: Array },
    showEditorSwitch: { type: Boolean, attribute: 'show-editor-switch' },
  };

  constructor() {
    super();
    this.useNewEditor = false; //change for dev
    /** @type {string | undefined} */
    this.selectedEmailTag = undefined;
    /**@type {{value: string, label: string, labelUnsubscribe: string}[]} */
    (this.tags = []);

    this.showEmailTagSelection = true;
    this.showEditorSwitch = true;

    this.previewMode = false;
    this.previewMobile = false;
    this.subject = '';
    this.showSubject = false;

    /**@type {Record<string,import('./OwcTemplateEditorTypes.js').TemplateRecord>} */
    this.templates = {};
    this.currentIndex = 0;

    /**
     * @type {import('./OwcTemplateEditorTypes.js').GrapeEditorBlock[]}
     */
    this.grapeEditorBlocks = [];

    /**@type {{label: string, value: string}[]} */
    this.textModuleOptions = /**@type {{label: string, value: string}[]} */ ([]);

    /**@type {Record<string, any>} */
    this.previewData = {};

    /**@type {Record<string, any>} */
    this.previewDataParameter = {};

    /**@type {Record<string,any>} */
    this.templateData = {};

    /**@type {string} */
    this.defaultStyling = '';
    /** @type {Record<string, Record<string, string>>} */
    this.defaultStyleAttributesByComponent = {};
    /** @type {import('./OwcTemplateEditorTypes.js').ComponentOptions} */
    this.componentOptions = {};

    this.forceFormErrors = false;
    /**@type {(input: string, recipient: Record<string, any> ) => string} */
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

    this.currentVariant = 'default';

    this.enableMultiTemplate = false;
    this.showMultiTemplateButtons = true;
    this.showTemplateSelection = true;
    this.showTemplateName = false;
    this.showVariantSwitch = false;
    this.disableVariantSwitch = false;

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
     * @type {import('../file-upload/OwcFileUpload.js').OwcFileUpload['renderCardContent'] | undefined}
     */
    this.renderFileContent = undefined;
  }

  get editor() {
    return /**@type {OwcTemplateEditorOld | OwcGrapeTemplateEditor | undefined}*/ (
      this.shadowRoot?.querySelector('.editor')
    );
  }

  get valid() {
    // @ts-ignore
    return this.editor?.valid;
  }

  validate() {
    return this.editor?.validate();
  }

  /**
   * @param {Record<string, any>} data
   * @param {Record<string, any>} dataParameter
   * @param {{index?: number}} [options]
   */
  generateValueForData(data, dataParameter, options) {
    const { subject = '', html = '' } =
      this.editor?.generateValueForData(data, dataParameter, options) || {};
    return { subject, html };
  }

  getCurrentTemplate() {
    return this.editor?.getCurrentTemplate();
  }

  get currentTemplateRecord() {
    // @ts-ignore
    return this.editor?.currentTemplateRecord;
  }

  set currentTemplateRecord(data) {
    if (this.editor) {
      // @ts-ignore
      this.editor.currentTemplateRecord = data;
    }
  }

  togglePreviewMode() {
    this.editor?.togglePreviewMode();
  }

  /**
   * @returns {void}
   */
  markSaved() {
    // The concrete editor may keep transient draft state; reset it after the outer save succeeds.
    this.editor?.markSaved();
  }

  /**
   * @param {Event} ev
   */
  bubbleUpdate(ev) {
    // @ts-ignore
    this.dispatchEvent(new ev.constructor(ev.type, ev));
  }

  render() {
    return html`
      ${
        this.showEditorSwitch
          ? html`
              <wa-switch
                ?checked=${this.useNewEditor}
                @change=${(/** @type {{ target: { checked: any; }; }} */ ev) => {
                  this.useNewEditor = !!ev.target.checked;
                }}
                >Neuer Editor</wa-switch
              >
            `
          : nothing
      }
      ${
        this.useNewEditor
          ? html`
              <owc-template-editor-new
                class="editor"
                .previewMode=${this.previewMode}
                .previewMobile=${this.previewMobile}
                .templateSubject=${this.subject}
                .showSubject=${this.showSubject}
                .templates=${this.templates}
                .currentIndex=${this.currentIndex}
                .grapeEditorBlocks=${this.grapeEditorBlocks}
                .defaultStyling=${this.defaultStyling}
                .defaultStyleAttributesByComponent=${this.defaultStyleAttributesByComponent}
                .componentOptions=${this.componentOptions}
                .textModuleOptions=${this.textModuleOptions}
                .previewData=${this.previewData}
                .previewDataParameter=${this.previewDataParameter}
                .templateData=${this.templateData}
                .forceFormErrors=${this.forceFormErrors}
                .postProcessor=${this.postProcessor}
                .currentVariant=${this.currentVariant}
                .selectVariant=${this.selectVariant}
                .enableMultiTemplate=${this.enableMultiTemplate}
                .showMultiTemplateButtons=${this.showMultiTemplateButtons}
                .showTemplateSelection=${this.showTemplateSelection}
                .showTemplateName=${this.showTemplateName}
                .showVariantSwitch=${this.showVariantSwitch}
                .disableVariantSwitch=${this.disableVariantSwitch}
                .delayMessage=${this.delayMessage}
                .showHelpButton=${this.showHelpButton}
                .showFileUpload=${this.showFileUpload}
                .handleFileUpload=${this.handleFileUpload}
                .renderFileContent=${this.renderFileContent}
                .showEmailTagSelection=${this.showEmailTagSelection}
                .tags=${this.tags}
                @templateUpdate=${this.bubbleUpdate}
                @tag-change=${this.bubbleUpdate}
              ></owc-template-editor-new>
            `
          : html`
              <owc-template-editor-old
                class="editor"
                .previewMode=${this.previewMode}
                .subject=${this.subject}
                .showSubject=${this.showSubject}
                .templates=${this.templates}
                .currentIndex=${this.currentIndex}
                .textModuleOptions=${this.textModuleOptions}
                .previewData=${this.previewData}
                .previewDataParameter=${this.previewDataParameter}
                .templateData=${this.templateData}
                .forceFormErrors=${this.forceFormErrors}
                .postProcessor=${this.postProcessor}
                .currentVariant=${this.currentVariant}
                .enableMultiTemplate=${this.enableMultiTemplate}
                .showMultiTemplateButtons=${this.showMultiTemplateButtons}
                .showTemplateSelection=${this.showTemplateSelection}
                .showTemplateName=${this.showTemplateName}
                .delayMessage=${this.delayMessage}
                .showHelpButton=${this.showHelpButton}
                .showFileUpload=${this.showFileUpload}
                .handleFileUpload=${this.handleFileUpload}
                .renderFileContent=${this.renderFileContent}
                .showEmailTagSelection=${this.showEmailTagSelection}
                .tags=${this.tags}
                @templateUpdate=${this.bubbleUpdate}
                @tag-change=${this.bubbleUpdate}
              ></owc-template-editor-old>
            `
      }
    `;
  }

  static styles = [css``];
}
