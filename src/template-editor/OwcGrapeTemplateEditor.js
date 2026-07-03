import { LitElement, html, css } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import grapesjs from 'grapesjs';
import 'grapesjs-mjml';
import 'mjml-browser';
import { JsonForm } from '../json-form/form/JsonForm.js';
import { OwcFileUpload } from '../file-upload/OwcFileUpload.js';
import { OwcAutocomplete } from '../autocomplete/OwcAutocomplete.js';
import { OwcTooltip } from '../tooltip/OwcTooltip.js';
import { filesToObj, generateValueForData, replaceValues } from './generateValueForData.js';
import { OwcEmailTagRadioGroup } from '../compose-email/OwcEmailTagRadioGroup.js';

import '@awesome.me/webawesome/dist/components/copy-button/copy-button.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';

const GRAPES_CSS_URL = 'https://unpkg.com/grapesjs/dist/css/grapes.min.css';
const FONT_AWESOME_CSS_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
const DESKTOP_EMAIL_CANVAS_CLASS = 'owc-desktop-email-canvas';
const DESKTOP_EMAIL_CANVAS_MIN_WIDTH = 480;
const EDITOR_MJML_COLUMN_WIDTH_PERCENTAGES = [33, 36, 64, 67, 100];

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   attributes: Record<string, string>,
 * }} ComponentStylePreset
 */
export class OwcGrapeTemplateEditor extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'json-form': JsonForm,
    'owc-file-upload': OwcFileUpload,
    'owc-autocomplete': OwcAutocomplete,
    'owc-tooltip': OwcTooltip,
    'owc-email-tag-radio-group': OwcEmailTagRadioGroup,
  };
  static properties = {
    selectedTemplateRecord: { type: Object },
    templateName: { type: String },
    previewDataParameter: { type: Object },
    previewData: { type: Object },

    templates: { type: Object },
    grapeEditorBlocks: { type: Array },
    defaultStyling: { type: String },
    defaultStyleAttributesByComponent: { type: Object },
    componentOptions: { type: Object },

    enableMultiTemplate: { type: Boolean },
    showMultiTemplateButtons: { type: Boolean },
    showTemplateSelection: { type: Boolean },
    showTemplateName: { type: Boolean },
    showHelpButton: { type: Boolean },
    showFileUpload: { type: Boolean },
    showVariantSwitch: { type: Boolean },
    disableVariantSwitch: { type: Boolean },

    templateLabel: { type: String },
    templateSubject: { type: String },
    currentIndex: { type: Number },
    currentVariant: { type: String },
    selectVariant: { type: Function },

    templateData: { type: Object },
    forceFormErrors: { type: Boolean },
    templateFileList: { type: Array },
    selectedTemplateId: { type: String },

    isCustomPreviewOpen: { type: Boolean, attribute: false },
    customPreviewHtml: { type: String, attribute: false },

    isDirty: { type: Boolean },

    textModuleOptions: { type: Array },

    defaultVariables: { type: Object },
    previewClient: { type: Object },
    postProcessor: { type: Function },
    handleFileUpload: { type: Function },
    previewMode: { type: Boolean },
    previewMobile: { type: Boolean },
    renderFileContent: { type: Function },
    selectedEmailTag: { type: String },
    showEmailTagSelection: { type: Boolean },
    tags: { type: Array },
  };

  constructor() {
    super();

    /**@type {import('./OwcTemplateEditorTypes.js').TemplateRecord & {label: string}} */
    this.selectedTemplateRecord = {
      name: 'Kein Template',
      label: 'default',
      template: [{ default: { html: '', subject: '' } }],
    };

    /**@type {import('./OwcTemplateEditorTypes.js').TemplateRecord & {label: string}} */
    this.templateRecordDraft = structuredClone(this.selectedTemplateRecord);
    this.templateName = '';
    /**@type {Record<string,import('./OwcTemplateEditorTypes.js').TemplateRecord>} */
    this.templates = {};
    /**@type {import('./OwcTemplateEditorTypes.js').GrapeEditorBlock[]} */
    this.grapeEditorBlocks = [];
    /**@type {Record<string, any>} */
    this.previewDataParameter = {};
    /**@type {Record<string, any>} */
    this.previewData = {};
    /**@type {string} */
    this.defaultStyling = '';
    /** @type {Record<string, Record<string, string>>} */
    this.defaultStyleAttributesByComponent = {};
    /** @type {string} */
    this.defaultStylingCacheKey = '';
    /** @type {import('./OwcTemplateEditorTypes.js').ComponentOptions} */
    this.componentOptions = {};
    /** @type {Record<string, Record<string, string>>} */
    this.defaultHeaderAttributesByComponentTypeCache = {};

    // UI flags
    this.enableMultiTemplate = true;
    this.showMultiTemplateButtons = true;
    this.showTemplateSelection = true;
    this.showTemplateName = false;
    this.showHelpButton = false;
    this.showFileUpload = false;
    this.showVariantSwitch = true;
    this.disableVariantSwitch = false;

    // editable state
    this.templateLabel = '';
    this.templateSubject = '';
    this.currentIndex = 0;
    this.currentVariant = '';
    /** @type {(data: Record<string, any>, options: string[]) => string} */
    this.selectVariant = (_data, options) => options[0] || '';

    /**@type {Record<string,any>} */
    this.templateData = {};
    this.forceFormErrors = false;

    /** @type {Array<{ id: string, name: string, url?: string }>} */
    this.templateFileList = [];

    /** @type {string | undefined} */
    this.selectedEmailTag = undefined;
    /**@type {{value: string, label: string, labelUnsubscribe: string}[]} */
    (this.tags = []);

    this.showEmailTagSelection = true;

    /** @type {import('grapesjs').Editor | undefined} */
    this.editor = undefined;
    /** @type {ResizeObserver | undefined} */
    this.canvasResizeObserver = undefined;

    /** @type {Map<string, { html: string, subject: string }>} */
    this.slotDraftMap = new Map();
    this.lastAppliedEditorKey = '';

    /** @type {Set<string>} */
    this.registeredCustomBlockIds = new Set();

    this.isDirty = false;

    this.isApplyingStoredTemplateToGrapes = false;

    /** @type {ReturnType<typeof setTimeout> | undefined} */
    this.dirtyUpdateTimer = undefined;

    /** @type {unknown} */
    this.previewProjectDataCache = null;
    this.isCustomPreviewOpen = false;
    this.customPreviewHtml = '';
    this.previewMode = false;
    this.previewMobile = false;

    /**@type {{label: string, value: string}[]} */ (this.textModuleOptions = []);

    this.defaultVariables = {};
    /**@type {(input: string, recipient: Record<string, any>) => string } */
    this.postProcessor = input => input;

    /**
     * @type {(options: {allFiles: (import('../file-upload/OwcFileUpload.js').FilePlus & {readonly id?: string})[], newFiles: (import('../file-upload/OwcFileUpload.js') .FilePlus & {readonly id?: string})[], requestUpdate: () => void}) => Promise<void>}
     */
    this.handleFileUpload = async () => {
      null;
    };

    /**
     * @type {import('../file-upload/OwcFileUpload.js').OwcFileUpload['renderCardContent'] | undefined}
     */
    this.renderFileContent = undefined;
  }

  /**
   * Sync local state whenever the input template changes.
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (changedProperties.has('selectedTemplateRecord') || changedProperties.has('templateLabel')) {
      this.loadTemplateFromInputs();
      this.applyTemplateToGrapesIfReady();
    }

    if (
      this.previewMode &&
      (changedProperties.has('previewMode') ||
        changedProperties.has('previewData') ||
        changedProperties.has('currentIndex') ||
        changedProperties.has('selectVariant') ||
        changedProperties.has('selectedTemplateRecord'))
    ) {
      this.syncVariantWithPreview();
    }

    if (changedProperties.has('currentIndex') || changedProperties.has('currentVariant')) {
      this.applyTemplateToGrapesIfReady();
    }

    if (
      this.isCustomPreviewOpen &&
      (changedProperties.has('previewData') ||
        changedProperties.has('previewDataParameter') ||
        changedProperties.has('templateData') ||
        changedProperties.has('currentVariant') ||
        changedProperties.has('currentIndex'))
    ) {
      this.customPreviewHtml = this.getRenderedNewsletterHtml() || '';
    }

    if (changedProperties.has('previewMode')) {
      if (this.previewMode) {
        this.openCustomPreview();
      } else {
        this.closeCustomPreview();
      }
    }

    if (changedProperties.has('grapeEditorBlocks')) {
      this.syncCustomBlocks();
    }

    if (
      changedProperties.has('defaultStyling') ||
      changedProperties.has('defaultStyleAttributesByComponent')
    ) {
      this.applyDefaultStylingToEditorComponents();
    }

    super.update(changedProperties);
  }

  firstUpdated() {
    const container = this.shadowRoot?.getElementById('editor-container');
    if (!container) {
      return;
    }

    // Evil hack v2 please don't hit me, I'm scared
    const docHead = document.head;

    if (!docHead.querySelector(`link[href="${GRAPES_CSS_URL}"]`)) {
      const grapeStyleSheet = document.createElement('link');
      grapeStyleSheet.rel = 'stylesheet';
      grapeStyleSheet.href = GRAPES_CSS_URL;
      docHead.append(grapeStyleSheet);
    }

    if (!docHead.querySelector(`link[href="${FONT_AWESOME_CSS_URL}"]`)) {
      const fontAwesomeStyleSheet = document.createElement('link');
      fontAwesomeStyleSheet.rel = 'stylesheet';
      fontAwesomeStyleSheet.href = FONT_AWESOME_CSS_URL;
      docHead.append(fontAwesomeStyleSheet);
    }

    /** @type {any} */
    const grapesjsAny = grapesjs;

    this.editor = grapesjsAny.init({
      container,
      height: '80vh',
      width: 'auto',
      storageManager: false,
      assetManager: {
        // Allow image paths/URLs only; uploaded files should not become template assets.
        upload: false,
        embedAsBase64: false,
        showUrlInput: true,
        dropzone: false,
        openAssetsOnDrop: false,
      },
      colorPicker: {
        appendTo: container,
      },
      plugins: ['grapesjs-mjml'],
      pluginsOpts: {
        'grapesjs-mjml': {},
      },
    });

    if (!this.editor) {
      return;
    }
    // Load Font Awesome into the Grapes canvas iframe as some component/tool overlays need it
    this.editor.on('load', () => {
      const frameEl = this.editor?.Canvas?.getFrameEl?.() || null;

      const frameDoc = frameEl?.contentDocument;
      if (!frameEl || !frameDoc?.head) {
        return;
      }

      if (!frameDoc.head.querySelector(`link[href="${FONT_AWESOME_CSS_URL}"]`)) {
        const fontAwesomeStyleSheet = frameDoc.createElement('link');
        fontAwesomeStyleSheet.rel = 'stylesheet';
        fontAwesomeStyleSheet.href = FONT_AWESOME_CSS_URL;
        frameDoc.head.append(fontAwesomeStyleSheet);
      }

      this.injectCanvasDropIndicatorStyles(frameDoc);
      this.keepMjmlColumnsSideBySideInDesktopCanvas(frameEl, frameDoc);
    });

    // ----- UI CLEANUP: -----
    // @ts-ignore
    const panels = this.editor.Panels;

    panels.removeButton('options', 'fullscreen');
    panels.removeButton('options', 'preview');
    panels.removeButton('options', 'gjs-open-import-template');
    panels.removeButton('options', 'gjs-toggle-images');

    // Keep newly added MJML components aligned with default styling
    this.editor.on('component:add', component => {
      this.applyDefaultStylingToComponents(component);
    });

    this.addToolbarVars();
    this.removeHiddenDefaultBlocks();
    this.addCustomBlocks();
    this.closeBlockCategories();
    this.startDraftTracking();

    if (this.templates['default']) {
      this.selectedTemplateRecord = { ...this.templates['default'], label: 'default' };
    }

    this.applyTemplateToGrapesIfReady();
  }

  /**
   * Adds the Grapes drop indicator CSS inside the MJML iframe.
   *
   * @param {Document} frameDoc
   */
  injectCanvasDropIndicatorStyles(frameDoc) {
    if (!frameDoc.head || frameDoc.getElementById('grapes-drop-indicator-style')) {
      return;
    }
    const columnWidthRules = EDITOR_MJML_COLUMN_WIDTH_PERCENTAGES.map(
      columnWidthPercentage => `
        .${DESKTOP_EMAIL_CANVAS_CLASS} .mj-column-per-${columnWidthPercentage} {
          width: ${columnWidthPercentage}% !important;
          max-width: ${columnWidthPercentage}% !important;
        }
      `,
    ).join('\n');
    const CANVAS_DROP_INDICATOR_CSS = `
      .gjs-placeholder,
      .gjs-com-placeholder {
        position: fixed !important;
        transition: top 0.2s, left 0.2s, width 0.2s, height 0.2s;
      }

      .gjs-placeholder-int,
      .gjs-com-placeholder-int {
        background-color: #2f76ad;
        min-height: 3px;
      }

      ${columnWidthRules}
    `;
    const dropIndicatorStyle = frameDoc.createElement('style');
    dropIndicatorStyle.id = 'grapes-drop-indicator-style';
    dropIndicatorStyle.textContent = CANVAS_DROP_INDICATOR_CSS;
    frameDoc.head.append(dropIndicatorStyle);
  }

  /**
   * Forces MJML percentage columns to use desktop widths only when the editor iframe is wide enough.
   *
   * @param {HTMLIFrameElement} frameEl
   * @param {Document} frameDoc
   */
  keepMjmlColumnsSideBySideInDesktopCanvas(frameEl, frameDoc) {
    if (!frameDoc.body) {
      return;
    }

    const syncDesktopCanvasClass = () => {
      const frameWidth = frameEl.getBoundingClientRect().width;

      // Grapes sometimes misses MJML's generated media-query widths in embedded layouts.
      frameDoc.body.classList.toggle(
        DESKTOP_EMAIL_CANVAS_CLASS,
        frameWidth >= DESKTOP_EMAIL_CANVAS_MIN_WIDTH,
      );
    };

    this.canvasResizeObserver?.disconnect();
    this.canvasResizeObserver = new ResizeObserver(syncDesktopCanvasClass);
    this.canvasResizeObserver.observe(frameEl);
    syncDesktopCanvasClass();
  }

  /**
   * @param {Record<string, unknown>} attributes
   * @param {string} attributeName
   * @returns {boolean}
   */
  hasComponentAttribute(attributes, attributeName) {
    return Object.prototype.hasOwnProperty.call(attributes, attributeName);
  }

  /**
   * Reads editor-ready defaults by MJML tag name, falling back to the legacy mj-attributes string.
   *
   * @returns {Record<string, Record<string, string>>}
   */
  getDefaultHeaderAttributesByComponentType() {
    if (this.hasDefaultStyleAttributesByComponent(this.defaultStyleAttributesByComponent)) {
      return this.defaultStyleAttributesByComponent;
    }

    return this.getDefaultHeaderAttributesByComponentTypeFromMjAttributes();
  }

  /**
   * @param {unknown} value
   * @returns {value is Record<string, Record<string, string>>}
   */
  hasDefaultStyleAttributesByComponent(value) {
    return Boolean(
      value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0,
    );
  }

  /**
   * Reads the legacy DEFAULT_STYLING mj-attributes block into defaults by MJML tag name.
   *
   * @returns {Record<string, Record<string, string>>}
   */
  getDefaultHeaderAttributesByComponentTypeFromMjAttributes() {
    if (this.defaultStylingCacheKey === this.defaultStyling) {
      return this.defaultHeaderAttributesByComponentTypeCache;
    }

    this.defaultStylingCacheKey = this.defaultStyling;
    this.defaultHeaderAttributesByComponentTypeCache = {};

    if (typeof this.defaultStyling !== 'string' || this.defaultStyling.length === 0) {
      return this.defaultHeaderAttributesByComponentTypeCache;
    }

    const parser = new DOMParser();
    const parsedDocument = parser.parseFromString(this.defaultStyling, 'application/xml');
    const parserError = parsedDocument.querySelector('parsererror');

    if (parserError) {
      return this.defaultHeaderAttributesByComponentTypeCache;
    }

    const attributesRoot = parsedDocument.querySelector('mj-attributes');

    if (!attributesRoot) {
      return this.defaultHeaderAttributesByComponentTypeCache;
    }

    /** @type {Record<string, Record<string, string>>} */
    const defaultAttributesByComponentType = {};

    // Each direct mj-attributes child defines the defaults for one MJML component type.
    for (const defaultElement of Array.from(attributesRoot.children)) {
      const componentType = defaultElement.tagName.toLowerCase();
      /** @type {Record<string, string>} */
      const defaultAttributes = {};

      for (const attribute of Array.from(defaultElement.attributes)) {
        defaultAttributes[attribute.name] = attribute.value;
      }

      if (Object.keys(defaultAttributes).length > 0) {
        defaultAttributesByComponentType[componentType] = defaultAttributes;
      }
    }

    this.defaultHeaderAttributesByComponentTypeCache = defaultAttributesByComponentType;

    return this.defaultHeaderAttributesByComponentTypeCache;
  }

  /**
   * Adds defaults from DEFAULT_STYLING to a component and its children.
   *
   * @param {import('grapesjs').Component | undefined} component
   */
  applyDefaultStylingToComponents(component) {
    if (!component || this.isApplyingStoredTemplateToGrapes) {
      return;
    }

    this.applyDefaultStylingToComponent(component);
    this.addPresetTraitsToComponent(component);

    // Blocks can be inserted with nested MJML components, so apply defaults recursively.
    component.components?.().forEach(childComponent => {
      this.applyDefaultStylingToComponents(childComponent);
    });
  }

  /**
   * Adds only missing DEFAULT_STYLING attributes to one MJML component.
   *
   * @param {import('grapesjs').Component} component
   */
  applyDefaultStylingToComponent(component) {
    const componentType = this.getMjmlComponentType(component);

    if (!componentType) {
      return;
    }

    const defaultAttributes = this.getDefaultHeaderAttributesByComponentType()[componentType];

    if (!defaultAttributes) {
      return;
    }

    const currentAttributes = component.getAttributes?.() || {};
    const currentStyle = component.getStyle?.() || {};
    const grapesDefaultStyle = component.get?.('style-default') || {};
    /** @type {Record<string, string>} */
    const defaultAttributesToApply = {};

    // Header defaults should replace Grapes' own defaults, but not real template/block styling.
    for (const [attributeName, attributeValue] of Object.entries(defaultAttributes)) {
      if (
        this.shouldApplyDefaultHeaderAttribute(
          attributeName,
          currentAttributes,
          currentStyle,
          grapesDefaultStyle,
        )
      ) {
        defaultAttributesToApply[attributeName] = attributeValue;
      }
    }

    if (Object.keys(defaultAttributesToApply).length > 0) {
      component.addAttributes(defaultAttributesToApply);
      component.setStyle?.({
        ...currentStyle,
        ...defaultAttributesToApply,
      });
    }
  }

  /**
   * Adds configured preset checkboxes for supported MJML component types.
   *
   * @param {import('grapesjs').Component} component
   */
  addPresetTraitsToComponent(component) {
    const componentType = this.getMjmlComponentType(component);
    const presets = this.componentOptions[componentType];

    if (!presets) {
      return;
    }

    presets.forEach((preset, index) => {
      this.addComponentPresetTrait(component, componentType, preset, index);
    });
  }

  /**
   * Adds one checkbox trait whose checked state is derived from component attributes.
   *
   * @param {import('grapesjs').Component} component
   * @param {string} componentType
   * @param {ComponentStylePreset} preset
   * @param {number} index
   */
  addComponentPresetTrait(component, componentType, preset, index) {
    const traitName = this.getComponentPresetTraitName(componentType, preset);

    if (component.getTrait?.(traitName)) {
      return;
    }

    /** @type {import('grapesjs').TraitProperties} */
    const componentPresetTrait = {
      type: 'button',
      name: traitName,
      label: preset.label,
      text: preset.label,
      labelButton: preset.label,
      command: (_editor, trait) => {
        const targetComponent = trait.target;

        if (targetComponent) {
          this.applyComponentPreset(targetComponent, componentType, preset);
        }
      },
    };

    const addTrait =
      /** @type {((trait: import('grapesjs').TraitProperties, options?: { at?: number }) => unknown) | undefined} */ (
        component.addTrait?.bind(component)
      );

    addTrait?.(componentPresetTrait, { at: 2 + index });
  }

  /**
   * @param {string} componentType
   * @param {ComponentStylePreset} preset
   * @returns {string}
   */
  getComponentPresetTraitName(componentType, preset) {
    const safeComponentType = componentType.replace(/\W/g, '_');
    return `${'componentPreset'}_${safeComponentType}_${preset.id}`;
  }

  /**
   * Applies one preset as a direct command so users can undo if they do not like the result.
   *
   * @param {import('grapesjs').Component} component
   * @param {string} componentType
   * @param {ComponentStylePreset} preset
   */
  applyComponentPreset(component, componentType, preset) {
    this.setComponentStyleAttributes(component, preset.attributes);
    this.applySectionPresetToChildren(component, componentType, preset);
  }

  /**
   * @param {import('grapesjs').Component} component
   * @param {Record<string, string>} attributes
   */
  setComponentStyleAttributes(component, attributes) {
    const currentStyle = component.getStyle?.() || {};

    component.addAttributes?.(attributes);
    component.setStyle?.({
      ...currentStyle,
      ...attributes,
    });
  }

  /**
   * Section presets should also keep nested text and buttons readable.
   *
   * @param {import('grapesjs').Component} component
   * @param {string} componentType
   * @param {ComponentStylePreset} preset
   */
  applySectionPresetToChildren(component, componentType, preset) {
    if (componentType !== 'mj-section') {
      return;
    }

    component.components?.().forEach(childComponent => {
      this.applySectionPresetToChild(childComponent, preset);
    });
  }

  /**
   * @param {import('grapesjs').Component} component
   * @param {ComponentStylePreset} sectionPreset
   */
  applySectionPresetToChild(component, sectionPreset) {
    const componentType = this.getMjmlComponentType(component);
    const sectionBackgroundColor = sectionPreset.attributes['background-color'];
    const isWhiteSectionBackground = sectionBackgroundColor === '#ffffff';
    const hasColoredSectionBackground =
      typeof sectionBackgroundColor === 'string' &&
      sectionBackgroundColor.length > 0 &&
      !isWhiteSectionBackground;

    if (componentType === 'mj-text') {
      if (isWhiteSectionBackground) {
        this.setComponentStyleAttributes(component, {
          color: '#717584',
        });
      }

      // Colored sections invert nested text
      if (hasColoredSectionBackground) {
        this.setComponentStyleAttributes(component, {
          color: '#ffffff',
        });
      }
    }

    if (componentType === 'mj-button' && hasColoredSectionBackground) {
      // Buttons on colored sections become white pills with text matching the section color.
      this.setComponentStyleAttributes(component, {
        color: sectionBackgroundColor,
        'background-color': '#ffffff',
      });
    }

    component.components?.().forEach(childComponent => {
      this.applySectionPresetToChild(childComponent, sectionPreset);
    });
  }

  /**
   * Decides if a header default can be applied without replacing set styling.
   *
   * @param {string} attributeName
   * @param {Record<string, unknown>} currentAttributes
   * @param {Record<string, unknown>} currentStyle
   * @param {Record<string, unknown>} grapesDefaultStyle
   * @returns {boolean}
   */
  shouldApplyDefaultHeaderAttribute(
    attributeName,
    currentAttributes,
    currentStyle,
    grapesDefaultStyle,
  ) {
    // Source MJML wins even when its value equals a Grapes default like padding-left="0px".
    if (this.hasExplicitMjmlAttribute(currentAttributes, attributeName)) {
      return false;
    }

    const hasAttribute = this.hasComponentAttribute(currentAttributes, attributeName);
    const hasStyle = this.hasComponentAttribute(currentStyle, attributeName);

    if (!hasAttribute && !hasStyle) {
      return true;
    }

    const grapesDefaultValue = grapesDefaultStyle[attributeName];
    const currentAttributeValue = currentAttributes[attributeName];
    const currentStyleValue = currentStyle[attributeName];

    // GrapesJS-MJML copies style-default into attributes/style, so those are safe to replace.
    const isAttributeOnlyGrapesDefault =
      hasAttribute && currentAttributeValue === grapesDefaultValue && !hasStyle;
    const isStyleOnlyGrapesDefault =
      hasStyle && currentStyleValue === grapesDefaultValue && !hasAttribute;
    const areBothGrapesDefault =
      hasAttribute &&
      hasStyle &&
      currentAttributeValue === grapesDefaultValue &&
      currentStyleValue === grapesDefaultValue;

    return isAttributeOnlyGrapesDefault || isStyleOnlyGrapesDefault || areBothGrapesDefault;
  }

  /**
   * @param {Record<string, unknown>} currentAttributes
   * @param {string} attributeName
   * @returns {boolean}
   */
  hasExplicitMjmlAttribute(currentAttributes, attributeName) {
    const explicitAttributeNames = this.getExplicitMjmlAttributeNames(currentAttributes);

    return explicitAttributeNames.has(attributeName);
  }

  /**
   * @param {Record<string, unknown>} currentAttributes
   * @returns {Set<string>}
   */
  getExplicitMjmlAttributeNames(currentAttributes) {
    const explicitMjmlAttributesAttribute = 'data-owc-explicit-mjml-attributes';
    const explicitAttributeValue = currentAttributes[explicitMjmlAttributesAttribute];

    if (typeof explicitAttributeValue !== 'string' || explicitAttributeValue.length === 0) {
      return new Set();
    }

    return new Set(
      explicitAttributeValue
        .split(',')
        .map(attributeName => attributeName.trim())
        .filter(attributeName => attributeName.length > 0),
    );
  }

  /**
   * GrapesJS-MJML can expose the MJML tag through either type or tagName.
   *
   * @param {import('grapesjs').Component} component
   * @returns {string}
   */
  getMjmlComponentType(component) {
    const componentType = component.get?.('type');

    if (typeof componentType === 'string' && componentType.startsWith('mj-')) {
      return componentType.toLowerCase();
    }

    const tagName = component.get?.('tagName');

    if (typeof tagName === 'string' && tagName.startsWith('mj-')) {
      return tagName.toLowerCase();
    }

    return '';
  }

  applyDefaultStylingToEditorComponents() {
    if (!this.editor) {
      return;
    }

    // After loading stored MJML, walk the full tree once because Grapes cannot render mj-attributes.
    this.editor.getComponents().forEach(component => {
      this.applyDefaultStylingToComponents(component);
    });
  }

  closeBlockCategories() {
    this.editor?.BlockManager?.getCategories?.().forEach(category => {
      category.set('open', false);
    });
  }

  disconnectedCallback() {
    if (this.editor) {
      this.editor.destroy();
      this.editor = undefined;
    }

    if (this.dirtyUpdateTimer) {
      clearTimeout(this.dirtyUpdateTimer);
      this.dirtyUpdateTimer = undefined;
    }

    if (this.canvasResizeObserver) {
      this.canvasResizeObserver.disconnect();
      this.canvasResizeObserver = undefined;
    }

    super.disconnectedCallback();
  }

  /**
   * Valid == subject is present AND JsonForm valid (if it exists)
   * @returns {boolean}
   */
  get valid() {
    if (!this.editor) {
      return false;
    }

    const jsonForm = /** @type {JsonForm | null} */ (this.shadowRoot?.querySelector('json-form'));
    if (!jsonForm) {
      return true;
    }

    return Boolean(jsonForm.validatorState?.valid);
  }

  getCurrentTemplate() {
    return structuredClone(this.currentTemplateRecord);
  }

  async validate() {
    this.forceFormErrors = true;
    await this.updateComplete;

    if (!this.editor) {
      return;
    }

    const jsonForm = /** @type {JsonForm | null} */ (this.shadowRoot?.querySelector('json-form'));
    if (!jsonForm) {
      return;
    }

    jsonForm.validate();

    if (!jsonForm.validatorState.valid) {
      await this.updateComplete;
      setTimeout(() => jsonForm.getFirstInvalid()?.scrollIntoView(), 100);
    }
  }

  /**
   * Builds final output for sending.
   *
   * @param {Record<string, any>} data
   * @param {Record<string, any>} dataParameter
   * @param {{index?: number}} [options]
   * @returns {{ subject: string, html: string }}
   */
  generateValueForData(data, dataParameter, { index } = {}) {
    return generateValueForData(data, this.currentTemplateRecord, {
      index: Number(index ?? this.currentIndex ?? 0),
      variantSelector: (_data, options) => {
        if (typeof this.currentVariant === 'string' && options.includes(this.currentVariant)) {
          return this.currentVariant;
        }
        return options[0];
      },
      postProcessor: this.postProcessor,
      dataParameter,
      renderMode: 'mjml',
      mjmlCompiler: this.getBrowserMjmlCompiler(),
    });
  }

  /**
   * @param {Record<string, string>} fileUrlById -> { [fileId]: downloadUrl }
   */
  applyUploadedFileUrls(fileUrlById) {
    if (!fileUrlById || typeof fileUrlById !== 'object') {
      return;
    }

    const nextFileList = Array.isArray(this.templateFileList) ? [...this.templateFileList] : [];

    for (const fileMeta of nextFileList) {
      const nextUrl = fileUrlById[fileMeta.id];
      if (typeof nextUrl === 'string' && nextUrl.length > 0) {
        fileMeta.url = nextUrl;
      }
    }

    this.templateFileList = nextFileList;

    this.requestUpdate('templateFileList');
  }

  /**
   * @returns {string}
   */
  getRawNewsletterMJML() {
    if (!this.editor) {
      return '';
    }

    const htmlFromEditor = this.restoreDynamicImagesForSave(
      this.stripExplicitMjmlAttributeMarkers(this.editor.getHtml()),
    );
    const cssFromEditor = this.editor.getCss?.() || '';

    return cssFromEditor ? `<style>${cssFromEditor}</style>${htmlFromEditor}` : htmlFromEditor;
  }

  /**
   * Allows external callers to replace the current draft record.
   *
   * @param {import('./OwcTemplateEditorTypes.js').TemplateRecord & {label: string}} nextTemplateRecord
   */
  set currentTemplateRecord(nextTemplateRecord) {
    if (!nextTemplateRecord) {
      return;
    }

    this.selectedTemplateRecord = structuredClone(nextTemplateRecord);
    this.templateRecordDraft = structuredClone(nextTemplateRecord);
  }

  /**@type {import('./OwcTemplateEditorTypes.js').TemplateRecord & {label: string}} */
  get currentTemplateRecord() {
    if (!this.templateRecordDraft) {
      this.templateRecordDraft = this.selectedTemplateRecord
        ? structuredClone(this.selectedTemplateRecord)
        : {
            name: 'Kein Template',
            label: 'Kein Template',
            template: [{ default: { subject: this.templateSubject || '', html: '' } }],
            options: { value: {}, fileList: [] },
          };
    }

    const templateRecordDraft = this.templateRecordDraft;
    templateRecordDraft.name = this.templateName;
    templateRecordDraft.label = this.templateLabel || templateRecordDraft.label;

    if (!Array.isArray(templateRecordDraft.template)) {
      templateRecordDraft.template = [];
    }

    templateRecordDraft.options = templateRecordDraft.options || {};
    templateRecordDraft.options.value = this.templateData || {};
    templateRecordDraft.options.fileList = this.getPersistableTemplateFileList();

    if (this.selectedEmailTag) {
      templateRecordDraft.options.tag = this.selectedEmailTag;
    } else {
      delete templateRecordDraft.options.tag;
    }

    if (this.editor) {
      const currentKey = this.buildEditorKey();

      if (currentKey) {
        this.slotDraftMap.set(currentKey, {
          html: this.getRawNewsletterMJML(),
          subject: this.templateSubject || '',
        });
      }
    }

    for (const [editorKey, editorValue] of this.slotDraftMap.entries()) {
      const [, index, variant] = this.decodeEditorKey(editorKey);
      const templateIndex = Number.parseInt(index, 10);

      if (!templateRecordDraft.template[templateIndex]) {
        templateRecordDraft.template[templateIndex] = {};
      }

      templateRecordDraft.template[templateIndex][variant] = { ...editorValue };
    }

    return templateRecordDraft;
  }

  loadTemplateFromInputs() {
    if (!this.selectedTemplateRecord) {
      return;
    }
    this.templateRecordDraft = structuredClone(this.selectedTemplateRecord);
    this.templateName = this.selectedTemplateRecord.name || '';
    this.selectedTemplateId = this.selectedTemplateRecord.label;
    this.templateFileList = structuredClone(this.selectedTemplateRecord.options?.fileList || []);
    this.templateData = structuredClone(this.selectedTemplateRecord.options?.value || {});
    this.selectedEmailTag = this.selectedTemplateRecord.options?.tag || undefined;
    this.forceFormErrors = false;
    this.templateLabel = this.selectedTemplateId || '';
    this.ensureValidEditorSlotSelection();
    this.syncSubjectForCurrentSlot();
    this.isDirty = false;
    this.slotDraftMap.clear();
    this.lastAppliedEditorKey = '';
  }

  /**
   * Grapes wants HTML and CSS separately.
   * @param {string} fullHtml
   * @returns {{ html: string, css: string }}
   */
  extractCssAndHtml(fullHtml) {
    const styleMatch = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);

    if (!styleMatch) {
      return { html: fullHtml, css: '' };
    }

    const cssText = styleMatch[1] || '';
    const htmlOnly = fullHtml.replace(styleMatch[0], '');

    return { html: htmlOnly, css: cssText };
  }

  /**
   * Removes mj-attributes before Grapes renders the template because GrapesJS MJML cannot edit it.
   *
   * @param {string} html
   * @returns {string}
   */
  removeMjAttributesFromTemplateHtml(html) {
    return html.replace(/<mj-attributes\b[\s\S]*?<\/mj-attributes>/gi, '');
  }

  /**
   * Marks attributes that came from the source MJML before Grapes adds its own defaults.
   *
   * @param {string} html
   * @returns {string}
   */
  markExplicitMjmlAttributesInHtml(html) {
    const explicitMjmlAttributesAttribute = 'data-owc-explicit-mjml-attributes';

    if (typeof html !== 'string' || html.length === 0) {
      return html;
    }

    return html.replace(/<mj-[\w-]+(?=\s|\/?>)(?:\s[^<>]*?)?>/gi, openingTag => {
      const explicitAttributeNames = this.getMjmlOpeningTagAttributeNames(openingTag);

      if (explicitAttributeNames.length === 0) {
        return openingTag;
      }

      // Add the marker just before the tag closes so self-closing MJML stays self-closing.
      return openingTag.replace(
        /\s*\/?>$/,
        closingText =>
          ` ${explicitMjmlAttributesAttribute}="${explicitAttributeNames.join(',')}"${closingText}`,
      );
    });
  }

  /**
   * Reads attribute names from one MJML opening tag without reparsing or restructuring MJML.
   *
   * @param {string} openingTag
   * @returns {string[]}
   */
  getMjmlOpeningTagAttributeNames(openingTag) {
    const explicitMjmlAttributesAttribute = 'data-owc-explicit-mjml-attributes';
    const attributeSource = openingTag.replace(/^<mj-[\w-]+/i, '').replace(/\s*\/?>$/, '');
    const attributePattern = /([^\s=/>]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
    /** @type {string[]} */
    const attributeNames = [];
    let attributeMatch = attributePattern.exec(attributeSource);

    while (attributeMatch) {
      const attributeName = attributeMatch[1].toLowerCase();

      if (attributeName !== explicitMjmlAttributesAttribute) {
        attributeNames.push(attributeName);
      }

      attributeMatch = attributePattern.exec(attributeSource);
    }

    return attributeNames;
  }

  /**
   * Removes the internal explicit-attribute marker before saving or compiling MJML.
   *
   * @param {string} html
   * @returns {string}
   */
  stripExplicitMjmlAttributeMarkers(html) {
    const explicitMjmlAttributesAttribute = 'data-owc-explicit-mjml-attributes';

    // Strip the marker so it never leaks into saved MJML or compiled HTML.
    return html.replace(
      new RegExp(`\\s${explicitMjmlAttributesAttribute}=(?:"[^"]*"|'[^']*'|[^\\s>]+)`, 'gi'),
      '',
    );
  }

  /**
   * @param {string} html
   * @returns {string}
   */
  prepareDynamicImagesForEditor(html) {
    let nextHtml = html;
    const EDITOR_DYNAMIC_IMAGE_SOURCE_ATTRIBUTE = 'data-owc-dynamic-image-src';
    const EDITOR_DYNAMIC_IMAGE_FALLBACKS = [
      {
        source: '{client.owner.profilePictureSquare}',
        fallback: 'https://placehold.co/200x200?text=Berater+Foto',
      },
    ];
    for (const dynamicImageFallback of EDITOR_DYNAMIC_IMAGE_FALLBACKS) {
      // Grapes cannot resolve template variables, so keep the original src in editor-only metadata.
      nextHtml = nextHtml
        .replaceAll(
          `src="${dynamicImageFallback.source}"`,
          `src="${dynamicImageFallback.fallback}" ${EDITOR_DYNAMIC_IMAGE_SOURCE_ATTRIBUTE}="${dynamicImageFallback.source}"`,
        )
        .replaceAll(
          `src='${dynamicImageFallback.source}'`,
          `src='${dynamicImageFallback.fallback}' ${EDITOR_DYNAMIC_IMAGE_SOURCE_ATTRIBUTE}="${dynamicImageFallback.source}"`,
        );
    }

    return nextHtml;
  }

  /**
   * @param {string} html
   * @returns {string}
   */
  restoreDynamicImagesForSave(html) {
    // Restore original dynamic image sources and remove editor-only metadata before saving.
    return html.replace(
      /<mj-image\b[^>]*\sdata-owc-dynamic-image-src=(?:"([^"]*)"|'([^']*)')[^>]*>/gi,
      imageOpeningTag => {
        const sourceMatch = imageOpeningTag.match(
          /\sdata-owc-dynamic-image-src=(?:"([^"]*)"|'([^']*)')/i,
        );
        const originalSource = sourceMatch?.[1] || sourceMatch?.[2];

        if (!originalSource) {
          return imageOpeningTag;
        }

        return imageOpeningTag
          .replace(/\ssrc=(?:"[^"]*"|'[^']*')/i, ` src="${originalSource}"`)
          .replace(/\sdata-owc-dynamic-image-src=(?:"[^"]*"|'[^']*')/i, '');
      },
    );
  }

  applyTemplateToGrapesIfReady() {
    if (!this.editor || !this.selectedTemplateRecord) {
      return;
    }
    this.ensureValidEditorSlotSelection();

    const editorKey = this.buildEditorKey();

    const draft = editorKey ? this.slotDraftMap.get(editorKey) : undefined;
    if (draft && typeof draft.html === 'string') {
      const { html: htmlOnly, css: cssText } = this.extractCssAndHtml(draft.html);
      this.setStoredTemplateComponents(htmlOnly.trim());
      this.editor.setStyle(cssText);
      this.templateSubject = draft.subject || '';
      this.isDirty = true;
      this.lastAppliedEditorKey = editorKey;
      return;
    }

    if (editorKey && this.lastAppliedEditorKey === editorKey) {
      return;
    }

    const variantData = this.getVariantDataForCurrentSlot();
    if (!variantData || typeof variantData.html !== 'string') {
      return;
    }

    const { html: htmlOnly, css: cssText } = this.extractCssAndHtml(variantData.html);
    this.setStoredTemplateComponents(htmlOnly.trim());
    this.editor.setStyle(cssText);

    this.lastAppliedEditorKey = editorKey;
  }

  /**
   * Loads stored MJML without applying new-component padding defaults.
   *
   * @param {string} html
   */
  setStoredTemplateComponents(html) {
    if (!this.editor) {
      return;
    }

    const htmlWithoutMjAttributes = this.removeMjAttributesFromTemplateHtml(
      this.prepareDynamicImagesForEditor(html),
    );
    const htmlWithExplicitAttributesMarked =
      this.markExplicitMjmlAttributesInHtml(htmlWithoutMjAttributes);

    this.isApplyingStoredTemplateToGrapes = true;

    try {
      this.editor.setComponents(htmlWithExplicitAttributesMarked);
    } finally {
      this.isApplyingStoredTemplateToGrapes = false;
    }

    this.applyDefaultStylingToEditorComponents();
  }

  startDraftTracking() {
    if (!this.editor) {
      return;
    }

    const onEditorChanged = () => {
      const key = this.buildEditorKey();
      if (!key) {
        return;
      }

      const rawHtml = this.getRawNewsletterMJML();

      this.slotDraftMap.set(key, {
        html: rawHtml,
        subject: this.templateSubject || '',
      });

      this.isDirty = true;
      this.requestUpdate();
    };

    this.editor.on('update', onEditorChanged);
  }

  /**
   *
   * @param {string} key
   * @returns {[string, string, string]} [id, index, variant]
   */
  decodeEditorKey(key) {
    // @ts-ignore
    return key.split('::');
  }

  buildEditorKey() {
    const id = this.templateLabel || '';
    const index = String(this.currentIndex ?? 0);
    const variant = String(this.currentVariant ?? '');
    return `${id}::${index}::${variant}`;
  }

  getTemplateCount() {
    const templateRecord = this.selectedTemplateRecord;
    if (!templateRecord || !Array.isArray(templateRecord.template)) {
      return 0;
    }
    return templateRecord.template.length;
  }

  /**
   *
   * @param {number} index
   * @returns
   */
  getTemplateObjectByIndex(index) {
    const templateRecord = this.selectedTemplateRecord;
    if (!templateRecord || !Array.isArray(templateRecord.template)) {
      return undefined;
    }

    const templateObject = templateRecord.template[index];
    if (!templateObject || typeof templateObject !== 'object') {
      return undefined;
    }

    return templateObject;
  }

  getVariantKeysForCurrentIndex() {
    const safeIndex = Number.isFinite(this.currentIndex) ? this.currentIndex : 0;
    const templateObject = this.getTemplateObjectByIndex(safeIndex);
    if (!templateObject) {
      return [];
    }
    return Object.keys(templateObject);
  }

  ensureValidEditorSlotSelection() {
    const templateCount = this.getTemplateCount();
    if (templateCount <= 0) {
      this.currentIndex = 0;
      this.currentVariant = '';
      return;
    }

    const clampedIndex = Math.min(Math.max(Number(this.currentIndex ?? 0), 0), templateCount - 1);

    if (clampedIndex !== this.currentIndex) {
      this.currentIndex = clampedIndex;
    }

    const variantKeys = this.getVariantKeysForCurrentIndex();
    if (variantKeys.length === 0) {
      this.currentVariant = '';
      return;
    }

    const hasVariant =
      typeof this.currentVariant === 'string' && variantKeys.includes(this.currentVariant);

    if (!hasVariant) {
      this.currentVariant = variantKeys[0];
    }
  }

  /**
   * Keeps the subject input aligned with the currently active slot.
   */
  syncSubjectForCurrentSlot() {
    const currentDraft = this.slotDraftMap.get(this.buildEditorKey());

    if (currentDraft && typeof currentDraft.subject === 'string') {
      this.templateSubject = currentDraft.subject;
      return;
    }

    const currentVariantData = this.getVariantDataForCurrentSlot();
    this.templateSubject = currentVariantData?.subject || '';
  }

  /**
   * Resolves which variant preview mode wants to show for the current block.
   *
   * @returns {string}
   */
  getPreviewVariantForCurrentBlock() {
    const variantKeys = this.getVariantKeysForCurrentIndex();

    if (variantKeys.length === 0) {
      return '';
    }

    if (typeof this.selectVariant !== 'function') {
      return variantKeys[0];
    }

    const selectedVariant = this.selectVariant(this.previewData || {}, variantKeys);

    if (typeof selectedVariant === 'string' && variantKeys.includes(selectedVariant)) {
      return selectedVariant;
    }

    return variantKeys[0];
  }

  /**
   * While preview mode is active, the currently displayed preview
   * should control the variant switch.
   */
  syncVariantWithPreview() {
    if (!this.previewMode) {
      return;
    }

    const previewVariant = this.getPreviewVariantForCurrentBlock();

    if (!previewVariant || previewVariant === this.currentVariant) {
      return;
    }

    this.persistCurrentSlotDraft();
    this.currentVariant = previewVariant;
    this.ensureValidEditorSlotSelection();
    this.lastAppliedEditorKey = '';
    this.applyTemplateToGrapesIfReady();
    this.syncSubjectForCurrentSlot();
  }

  /**
   * Handles manual variant switching from the UI.
   *
   * @param {Event} event
   */
  handleVariantSwitchChange(event) {
    if (this.isVariantSwitchDisabled) {
      return;
    }
    const target = /** @type {{ checked?: boolean }} */ (event.target);

    this.currentVariant = target.checked ? 'informal' : 'formal';

    this.ensureValidEditorSlotSelection();
    this.syncSubjectForCurrentSlot();
  }

  getVariantDataForCurrentSlot() {
    const templateObject = this.getTemplateObjectByIndex(Number(this.currentIndex ?? 0));
    if (!templateObject) {
      return undefined;
    }

    const variantKey = this.currentVariant;
    if (typeof variantKey !== 'string' || variantKey.length === 0) {
      return undefined;
    }

    return templateObject[variantKey];
  }

  getDelayDaysForCurrentBlock() {
    const templateRecord = this.selectedTemplateRecord;
    const delays = templateRecord?.options?.delays;

    if (!this.selectedTemplateRecord || Number(this.currentIndex ?? 0) <= 0) {
      return 0;
    }

    const delayIndex = Number(this.currentIndex ?? 0) - 1;
    const delayValue =
      Array.isArray(delays) && Number.isFinite(delays[delayIndex]) ? delays[delayIndex] : 7;

    return delayValue;
  }

  /**
   * @param {InputEvent} event
   */
  handleDelayDaysInput(event) {
    const target = /** @type {HTMLInputElement} */ (event.target);

    const parsed = Number.parseInt(target.value, 10);
    const nextDelayDays = Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;

    const nextRecord = structuredClone(this.currentTemplateRecord);
    if (!nextRecord.options) {
      nextRecord.options = {};
    }

    if (!Array.isArray(nextRecord.options.delays)) {
      nextRecord.options.delays = [];
    }

    const delayIndex = Number(this.currentIndex ?? 0) - 1;
    if (delayIndex >= 0) {
      nextRecord.options.delays[delayIndex] = nextDelayDays;
    }

    this.selectedTemplateRecord = nextRecord;
    this.templateRecordDraft = structuredClone(nextRecord);
    this.isDirty = true;
  }

  togglePreviewMode() {
    this.previewMode = !this.previewMode;
  }

  openCustomPreview() {
    const rendered = this.getRenderedNewsletterHtml() || '';
    this.customPreviewHtml = rendered;
    this.isCustomPreviewOpen = true;
  }

  closeCustomPreview() {
    this.isCustomPreviewOpen = false;
    this.customPreviewHtml = '';
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  updated(changedProperties) {
    super.updated(changedProperties);

    if (
      this.isCustomPreviewOpen &&
      (changedProperties.has('previewMobile') || changedProperties.has('customPreviewHtml'))
    ) {
      // The iframe width can change after render, so measure once Lit has applied the new class/srcdoc.
      void this.updateComplete.then(() => this.syncCustomPreviewFrameHeight());
    }
  }

  /**
   * @returns {HTMLIFrameElement | null}
   */
  getCustomPreviewFrame() {
    return this.shadowRoot?.querySelector('.custom-preview-frame') || null;
  }

  /**
   * Lets the outer preview panel own scrolling instead of showing a scrollbar inside the mobile iframe.
   *
   * @param {HTMLIFrameElement | null} [previewFrame=this.getCustomPreviewFrame()]
   */
  syncCustomPreviewFrameHeight(previewFrame = this.getCustomPreviewFrame()) {
    if (!previewFrame) {
      return;
    }

    const previewDocument = previewFrame.contentDocument;
    const previewBody = previewDocument?.body;
    const previewDocumentElement = previewDocument?.documentElement;

    if (!previewDocument || !previewBody || !previewDocumentElement) {
      return;
    }

    previewDocumentElement.style.overflow = 'hidden';
    previewBody.style.overflow = 'hidden';
    previewFrame.style.height = 'auto';

    const previewContentHeight = Math.max(
      previewBody.scrollHeight,
      previewBody.offsetHeight,
      previewDocumentElement.scrollHeight,
      previewDocumentElement.offsetHeight,
    );

    previewFrame.style.height = `${previewContentHeight}px`;
  }

  /**
   * @param {Event} event
   */
  handleCustomPreviewFrameLoad(event) {
    const previewFrame =
      event.currentTarget instanceof HTMLIFrameElement ? event.currentTarget : null;

    if (!previewFrame) {
      return;
    }

    // Wait for the iframe document to settle before measuring generated MJML/email HTML.
    requestAnimationFrame(() => this.syncCustomPreviewFrameHeight(previewFrame));
  }

  /**
   * Returns the browser MJML compiler from the global injected by mjml-browser.
   *
   * @returns {(
   *   (input: string, options?: Record<string, any>) => ({ html?: string, errors?: unknown[] } | undefined)
   * ) | undefined}
   */
  getBrowserMjmlCompiler() {
    // @ts-ignore
    const mjmlGlobal = /** @type {{ default?: unknown } | undefined} */ (window.mjml);

    const compiler =
      typeof mjmlGlobal?.default === 'function'
        ? mjmlGlobal.default
        : // @ts-ignore
          typeof window.mjml === 'function'
          ? // @ts-ignore
            window.mjml
          : undefined;

    // @ts-ignore
    return /** @type {((input: string, options?: Record<string, any>) => { html?: string, errors?: unknown[] }) | undefined} */ (
      compiler
    );
  }

  /**
   * Builds the data object used by replaceValues.
   *
   * @param {Record<string, any>} data
   * @param {import('./OwcTemplateEditorTypes.js').TemplateRecord & {label?: string}} templateRecord
   * @returns {Record<string, any>}
   */
  buildReplaceValuesData(data, templateRecord) {
    return {
      ...data,
      template: templateRecord?.options?.value || {},
      fileList: filesToObj(templateRecord),
    };
  }

  /**
   * Shared render pipeline used by both preview and send.
   *
   * @param {string} rawMjml
   * @param {Record<string, any>} data
   * @param {Record<string, any>} dataParameter
   * @param {import('./OwcTemplateEditorTypes.js').TemplateRecord & {label?: string}} templateRecord
   * @returns {string}
   */
  renderMjmlToFinalHtml(rawMjml, data, dataParameter, templateRecord) {
    if (typeof rawMjml !== 'string' || rawMjml.length === 0) {
      return '';
    }

    const mjml2html = this.getBrowserMjmlCompiler();
    if (typeof mjml2html !== 'function') {
      return '';
    }

    const replaceValuesData = this.buildReplaceValuesData(data, templateRecord);
    const mjmlWithReplacedValues = replaceValues(rawMjml, replaceValuesData, dataParameter);
    const result = mjml2html(mjmlWithReplacedValues, {
      validationLevel: 'soft',
    });

    const compiledHtml = typeof result?.html === 'string' ? result.html : '';

    return this.postProcessor(compiledHtml, dataParameter);
  }

  /**
   * Builds preview HTML from the current MJML in the editor.
   *
   * @param {Record<string, any>} [dataOverrides={}]
   * @returns {string}
   */
  getRenderedNewsletterHtml(dataOverrides = {}) {
    if (!this.editor) {
      return '';
    }

    const rawMjml = this.getRawNewsletterMJML();
    const templateRecord = this.currentTemplateRecord;
    const previewData = {
      ...this.previewData,
      ...dataOverrides,
    };

    return this.renderMjmlToFinalHtml(
      rawMjml,
      previewData,
      this.previewDataParameter,
      templateRecord,
    );
  }

  addToolbarVars() {
    const richTextEditor = this.editor?.RichTextEditor;
    if (!richTextEditor) {
      return;
    }

    richTextEditor.add('ordered-list', {
      icon: '1.',
      attributes: { title: 'Nummerierte Liste' },
      result: rte => rte.exec('insertOrderedList'),
    });

    richTextEditor.add('unordered-list', {
      icon: '&#8226;',
      attributes: { title: 'Aufzählungsliste' },
      result: rte => rte.exec('insertUnorderedList'),
    });

    richTextEditor.add('custom-vars', {
      icon: `<select class="gjs-field" style="background-color: white">
        <option value="">+ Variable</option>
            ${(this.textModuleOptions || [])
              .map(elm => `<option value="{${elm.value}}">${elm.label}</option>`)
              .join('')}
          </select>`,
      event: 'change',
      // @ts-ignore
      result: (rte, action) => rte.insertHTML(action.btn.firstChild.value),
      // @ts-ignore
      update: (rte, action) => {
        // @ts-ignore
        action.btn.firstChild.value = '';
      },
    });
  }

  // Remove some default blocks to declutter
  removeHiddenDefaultBlocks() {
    const HIDDEN_DEFAULT_MJML_BLOCK_IDS = [
      'mj-button',
      'mj-divider',
      'mj-spacer',
      'mj-navbar',
      'mj-navbar-link',
      'mj-hero',
      'mj-wrapper',
      'mj-raw',
    ];

    if (!this.editor) {
      return;
    }

    const blockManager = /** @type {{ remove?: (id: string) => unknown }} */ (
      /** @type {unknown} */ (this.editor.BlockManager)
    );

    if (typeof blockManager?.remove !== 'function') {
      return;
    }

    for (const blockId of HIDDEN_DEFAULT_MJML_BLOCK_IDS) {
      blockManager.remove(blockId);
    }
  }

  addCustomBlocks() {
    if (!this.editor) {
      return;
    }

    const blockManager =
      /** @type {{ add?: (id: string, config: import('grapesjs').BlockProperties) => unknown }} */ (
        /** @type {unknown} */ (this.editor.BlockManager)
      );

    if (typeof blockManager?.add !== 'function') {
      return;
    }

    // Build one normalized list from the new single prop and the old category props.
    const customBlocks = this.getNormalizedCustomBlocks();

    // Add each valid block once; invalid partial data is ignored to keep the editor usable.
    for (const blockDefinition of customBlocks) {
      this.addCustomBlock(blockManager, blockDefinition);
    }
  }

  /**
   * @returns {import('./OwcTemplateEditorTypes.js').GrapeEditorBlock[]}
   */
  getNormalizedCustomBlocks() {
    if (!Array.isArray(this.grapeEditorBlocks)) {
      return [];
    }

    const blocksById = new Map();

    for (const blockDefinition of this.grapeEditorBlocks) {
      if (typeof blockDefinition?.id === 'string' && !blocksById.has(blockDefinition.id)) {
        blocksById.set(blockDefinition.id, blockDefinition);
      }
    }

    return [...blocksById.values()];
  }

  /**
   * @param {{ add?: (id: string, config: import('grapesjs').BlockProperties) => unknown }} blockManager
   * @param {import('./OwcTemplateEditorTypes.js').GrapeEditorBlock} blockDefinition
   */
  addCustomBlock(blockManager, blockDefinition) {
    if (typeof blockManager.add !== 'function') {
      return;
    }

    if (!blockDefinition || typeof blockDefinition !== 'object') {
      return;
    }

    const { id, label, category, content, media, activate, select, attributes } = blockDefinition;

    if (
      typeof id !== 'string' ||
      id.length === 0 ||
      typeof label !== 'string' ||
      label.length === 0 ||
      typeof category !== 'string' ||
      category.length === 0 ||
      typeof content !== 'string' ||
      content.length === 0
    ) {
      return;
    }

    // Normalize optional Grapes fields after validation so callers can omit them safely.
    /** @type {import('grapesjs').BlockProperties} */
    const normalizedBlockConfig = {
      label,
      content: this.markExplicitMjmlAttributesInHtml(this.prepareDynamicImagesForEditor(content)),
      category: { id: category, label: category, open: false },
      ...(typeof media === 'string' && media.length > 0 ? { media } : {}),
      ...(typeof activate === 'boolean' ? { activate } : {}),
      ...(typeof select === 'boolean' ? { select } : {}),
      ...(attributes && typeof attributes === 'object' ? { attributes } : {}),
    };

    blockManager.add(id, normalizedBlockConfig);
    this.registeredCustomBlockIds.add(id);
  }

  syncCustomBlocks() {
    if (!this.editor) {
      return;
    }

    this.removeCustomBlocks();
    this.addCustomBlocks();
    this.closeBlockCategories();
  }

  removeCustomBlocks() {
    if (!this.editor || this.registeredCustomBlockIds.size === 0) {
      return;
    }

    const blockManager = /** @type {{ remove?: (id: string) => unknown }} */ (
      /** @type {unknown} */ (this.editor.BlockManager)
    );

    if (typeof blockManager?.remove !== 'function') {
      this.registeredCustomBlockIds.clear();
      return;
    }

    // Remove previously registered custom blocks before re-registering so prop
    // updates do not leave stale placeholder definitions in the picker.
    for (const blockId of this.registeredCustomBlockIds) {
      blockManager.remove(blockId);
    }

    this.registeredCustomBlockIds.clear();
  }

  /**
   * @param {CustomEvent<{ label: string, value: string }>} event
   */
  async handleTemplateAutocompleteSelection(event) {
    const autocomplete = /** @type {OwcAutocomplete<{value: String, label: string}>} */ (
      event.target
    );
    const selected = autocomplete.value;
    if (Array.isArray(selected)) {
      return;
    }

    // @ts-ignore
    this.selectedTemplateRecord = { ...this.templates[selected], label: selected };
    await this.updateComplete;

    this.dispatchEvent(
      new CustomEvent('templateUpdate', {
        detail: { templateId: selected },
      }),
    );
  }

  /**
   * @param {Event} ev
   */
  handleTemplateOptionsChange(ev) {
    const form =
      /** @type {{ validatorState?: { valid: boolean }, value: Record<string, any> }} */ (
        /** @type {unknown} */ (ev.target)
      );

    this.templateData = form.value || {};

    if (this.selectedTemplateRecord?.options) {
      this.selectedTemplateRecord.options.value = this.templateData;
    }

    if (this.templateRecordDraft?.options) {
      this.templateRecordDraft.options.value = this.templateData;
    }

    this.dispatchEvent(new Event('template-data-change', { bubbles: true, composed: true }));
    this.requestUpdate('templateData');
  }

  /**
   * @param {InputEvent} event
   */
  handleTemplateNameInput(event) {
    const target = /** @type {HTMLInputElement} */ (event.target);
    this.templateName = target.value;
  }

  /**
   * @param {InputEvent} event
   */
  handleTemplateSubjectInput(event) {
    const target = /** @type {HTMLInputElement} */ (event.target);
    this.templateSubject = target.value;
    const draftSlot = this.slotDraftMap.get(this.buildEditorKey());
    // @ts-ignore
    this.slotDraftMap.set(this.buildEditorKey(), { ...draftSlot, subject: target.value });
  }

  /**
   * @param {Event} event
   */
  handleEmailTagChange(event) {
    const target = /** @type {{ value?: string }} */ (event.target);
    const nextValue = typeof target.value === 'string' ? target.value : '';

    this.selectedEmailTag = nextValue || undefined;
  }

  /**
   * @param {Event} event
   */
  handleTemplateBlockSelectChange(event) {
    const target = /** @type {HTMLSelectElement} */ (event.target);
    const nextIndex = Number(target.value);
    this.currentIndex = Number.isFinite(nextIndex) ? nextIndex : 0;
    this.ensureValidEditorSlotSelection();
    this.syncSubjectForCurrentSlot();
  }

  /**
   * @param {import('../file-upload/OwcFileUpload.js').FilePlus[]} files
   * @returns {{ id: string, name: string, url?: string, size?: number, uploadError?: string }[]}
   */
  buildTemplateFileList(files) {
    return files.map(file => {
      if (!file.id) {
        file.id = crypto.randomUUID();
      }

      return {
        ...file,
        name: file.name,
        id: file.id,
        size: file.size,
        url: file.url,
        uploadError: typeof file.uploadError === 'string' ? file.uploadError : undefined,
      };
    });
  }

  /**
   * @returns {{ id: string, name: string, url?: string, size?: number }[]}
   */
  getPersistableTemplateFileList() {
    if (!Array.isArray(this.templateFileList)) {
      return [];
    }

    // Keep transient upload errors out of TemplateRecord.options.fileList.
    return this.templateFileList.map(file => ({
      name: file.name,
      id: file.id,
      size: 'size' in file && typeof file.size === 'number' ? file.size : undefined,
      url: file.url,
    }));
  }

  /**
   * @param {{ detail: {files: import('../file-upload/OwcFileUpload.js').FilePlus[]}, target: OwcFileUpload & { requestUpdate: () => void }; }} event
   */
  async handleFilesSelected(event) {
    const uploadElement = event.target;
    const allFiles = uploadElement.files;
    const newFiles = event.detail.files;

    // Store file metadata immediately so the template record is correct even while upload is running.
    this.templateFileList = this.buildTemplateFileList(allFiles);

    try {
      await this.handleFileUpload({
        allFiles,
        newFiles,
        requestUpdate: uploadElement.requestUpdate.bind(uploadElement),
      });
    } finally {
      // Upload handlers may add URLs or errors to the File objects, so sync metadata again afterwards.
      this.templateFileList = this.buildTemplateFileList(allFiles);
      this.requestUpdate('templateFileList');
      uploadElement.requestUpdate();
    }
  }

  /**
   * @returns {void}
   */
  markSaved() {
    const savedKey = this.buildEditorKey();

    // The parent owns persistence; this only clears editor-local draft state after that save succeeds.
    if (savedKey) {
      this.slotDraftMap.delete(savedKey);
    }

    this.isDirty = false;
  }

  /**
   * Stores the current editor content into the slot draft map before switching blocks.
   *
   */
  persistCurrentSlotDraft() {
    if (!this.editor) {
      return;
    }

    const key = this.buildEditorKey();
    if (!key) {
      return;
    }

    this.slotDraftMap.set(key, {
      html: this.getRawNewsletterMJML(),
      subject: this.templateSubject || '',
    });
  }

  handleAddBlockClick() {
    if (!this.selectedTemplateRecord) {
      return;
    }

    this.persistCurrentSlotDraft();
    const nextRecord = structuredClone(this.currentTemplateRecord);

    if (!Array.isArray(nextRecord.template)) {
      nextRecord.template = [];
    }

    const insertIndex = Number(this.currentIndex ?? 0) + 1;
    const currentIndex = Number(this.currentIndex ?? 0);
    const currentBlock = nextRecord.template[currentIndex];
    const copiedBlock = structuredClone(currentBlock);
    nextRecord.template.splice(insertIndex, 0, copiedBlock);

    if (!nextRecord.options) {
      nextRecord.options = {};
    }

    if (!Array.isArray(nextRecord.options.delays)) {
      nextRecord.options.delays = [];
    }

    if (insertIndex > 0) {
      nextRecord.options.delays.splice(insertIndex - 1, 0, 7);
    }

    this.selectedTemplateRecord = nextRecord;
    this.templateRecordDraft = structuredClone(nextRecord);

    this.currentIndex = insertIndex;
    this.ensureValidEditorSlotSelection();

    this.syncSubjectForCurrentSlot();

    this.isDirty = true;
    this.lastAppliedEditorKey = '';
    this.requestUpdate();
  }

  handleRemoveBlockClick() {
    if (!this.selectedTemplateRecord) {
      return;
    }

    const templateCount = this.getTemplateCount();
    if (templateCount <= 1) {
      return;
    }

    this.persistCurrentSlotDraft();
    const removeIndex = Number(this.currentIndex ?? 0);
    const nextRecord = structuredClone(this.currentTemplateRecord);

    if (!Array.isArray(nextRecord.template) || !nextRecord.template[removeIndex]) {
      return;
    }

    nextRecord.template.splice(removeIndex, 1);

    if (Array.isArray(nextRecord.options?.delays)) {
      if (removeIndex > 0) {
        nextRecord.options.delays.splice(removeIndex - 1, 1);
      } else if (nextRecord.options.delays.length > 0) {
        nextRecord.options.delays.splice(0, 1);
      }
    }

    // Remove stale drafts for all slots and rebuild only the surviving ones
    const nextSlotDraftMap = new Map();
    for (const [editorKey, editorValue] of this.slotDraftMap.entries()) {
      const [id, indexString, variant] = this.decodeEditorKey(editorKey);
      const index = Number.parseInt(indexString, 10);

      if (id !== (this.templateLabel || '')) {
        nextSlotDraftMap.set(editorKey, editorValue);
        continue;
      }

      if (index === removeIndex) {
        continue;
      }

      const nextIndex = index > removeIndex ? index - 1 : index;
      nextSlotDraftMap.set(`${id}::${nextIndex}::${variant}`, editorValue);
    }

    this.slotDraftMap = nextSlotDraftMap;
    this.selectedTemplateRecord = nextRecord;
    this.templateRecordDraft = structuredClone(nextRecord);

    this.currentIndex = Math.max(0, Math.min(removeIndex, nextRecord.template.length - 1));
    this.ensureValidEditorSlotSelection();

    this.syncSubjectForCurrentSlot();

    this.isDirty = true;
    this.lastAppliedEditorKey = '';
    this.requestUpdate();
  }

  get isVariantSwitchDisabled() {
    if (!this.showVariantSwitchForCurrentSlot) {
      return true;
    }

    if (this.previewMode) {
      return true;
    }

    if (this.disableVariantSwitch) {
      return true;
    }

    return false;
  }

  get showVariantSwitchForCurrentSlot() {
    if (!this.showVariantSwitch) {
      return false;
    }

    return this.getVariantKeysForCurrentIndex().length > 1;
  }

  renderEmailTagRadioGroup() {
    if (!this.showEmailTagSelection || this.tags.length <= 0) {
      return '';
    }

    return html`
      <div class="field email-tag-radio-field">
        <owc-email-tag-radio-group
          .tags=${this.tags}
          .value=${this.selectedEmailTag}
          .label=${'Art der E-Mail'}
          .handleValueChange=${(/** @type {string | undefined} */ nextValue) => {
            this.selectedEmailTag = nextValue;
            this.dispatchEvent(new Event('tag-change'));
          }}
        ></owc-email-tag-radio-group>
      </div>
    `;
  }
  // @files-selected=${this.handleFilesSelected}
  render() {
    const templateCount = this.getTemplateCount();
    const rawOptionsSchema = this.selectedTemplateRecord?.options?.schema;
    const rawOptionsUiSchema = this.selectedTemplateRecord?.options?.uiSchema;
    const optionsSchema = rawOptionsSchema ? structuredClone(rawOptionsSchema) : undefined;
    const optionsUiSchema = rawOptionsUiSchema ? structuredClone(rawOptionsUiSchema) : undefined;
    const shouldShowEditorControls =
      this.enableMultiTemplate || this.showVariantSwitchForCurrentSlot;

    return html`
      <link rel="stylesheet" href=${GRAPES_CSS_URL} data-grapes-css="true" />
      <link rel="stylesheet" href=${FONT_AWESOME_CSS_URL} data-fa-css="true" />
      <div>
        <div class="form-stack">
          ${
            this.showTemplateSelection
              ? html`
                  <div class="field">
                    <label class="field-label" for="template-picker">Template auswählen</label>
                    <div class="template-picker-row">
                      <owc-autocomplete
                        id="template-picker"
                        class="template-picker"
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
                        .value=${this.selectedTemplateId ?? ''}
                        placeholder="Template suchen..."
                        @autocomplete-selection=${this.handleTemplateAutocompleteSelection}
                      ></owc-autocomplete>
                    </div>
                  </div>
                `
              : ''
          }
          ${
            this.showTemplateName
              ? html`
                  <div class="field">
                    <label class="field-label" for="template-name">Name</label>
                    <input
                      id="template-name"
                      class="field-input"
                      type="text"
                      .value=${this.templateName ?? ''}
                      @input=${this.handleTemplateNameInput}
                    />
                  </div>
                `
              : ''
          }

          ${this.renderEmailTagRadioGroup()}

          <div class="field">
            <label class="field-label" for="template-subject">Betreff</label>
            <input
              id="template-subject"
              class="field-input"
              type="text"
              .value=${this.templateSubject ?? ''}
              @input=${this.handleTemplateSubjectInput}
            />
          </div>

          ${
            this.showFileUpload
              ? html`
                  <div class="field">
                    <label class="field-label">Dateien</label>
                    <owc-file-upload
                      @files-selected=${this.handleFilesSelected}
                      .files=${this.templateFileList}
                      .renderCardContent=${this.renderFileContent}
                    ></owc-file-upload>
                  </div>
                `
              : ''
          }
          <div class="editor-section">
            ${
              shouldShowEditorControls
                ? html`
                    <div class="editor-controls-row">
                      ${
                        this.enableMultiTemplate
                          ? html`
                              <div class="field block-field">
                                <label class="field-label" for="template-block">Block</label>

                                <div class="field-inline template-block-row">
                                  <wa-select
                                    id="template-block"
                                    class="field-input template-block-select"
                                    value=${String(this.currentIndex ?? 0)}
                                    ?disabled=${templateCount <= 1}
                                    @change=${this.handleTemplateBlockSelectChange}
                                  >
                                    ${Array.from({ length: templateCount }, (_, idx) => {
                                      const label = `Block ${idx + 1}`;
                                      return html`<wa-option value=${String(idx)}
                                        >${label}</wa-option
                                      >`;
                                    })}
                                  </wa-select>

                                  ${
                                    this.showMultiTemplateButtons
                                      ? html`
                                          <div class="icon-button-group">
                                            <wa-button
                                              class="mini-btn"
                                              @click=${this.handleAddBlockClick}
                                              ?disabled=${!this.selectedTemplateRecord}
                                              title="Block hinzufügen"
                                            >
                                              +
                                            </wa-button>
                                            <wa-button
                                              class="mini-btn"
                                              @click=${this.handleRemoveBlockClick}
                                              ?disabled=${
                                                !this.selectedTemplateRecord || templateCount <= 1
                                              }
                                              title="Block entfernen"
                                            >
                                              -
                                            </wa-button>
                                          </div>
                                        `
                                      : ''
                                  }
                                </div>
                              </div>
                            `
                          : ''
                      }
                      ${
                        this.showVariantSwitchForCurrentSlot
                          ? html`
                              <div class="field variant-field">
                                <label
                                  class="field-label variant-inline-label"
                                  for="template-variant-switch"
                                >
                                  Variante
                                </label>

                                <div class="variant-switch-row">
                                  <span>formal</span>
                                  <wa-switch
                                    id="template-variant-switch"
                                    size="small"
                                    ?checked=${(this.currentVariant || 'formal') === 'informal'}
                                    ?disabled=${this.isVariantSwitchDisabled}
                                    @change=${this.handleVariantSwitchChange}
                                  ></wa-switch>
                                  <span>informal</span>
                                </div>
                              </div>
                            `
                          : ''
                      }
                    </div>
                  `
                : ''
            }
            ${
              this.currentIndex > 0
                ? html`
                    <div class="field">
                      <label class="field-label" for="template-delay">
                        Wird verschickt
                        <input
                          id="template-delay"
                          class="field-input delay-input"
                          type="number"
                          min="0"
                          step="1"
                          .value=${String(this.getDelayDaysForCurrentBlock())}
                          @input=${this.handleDelayDaysInput}
                        />
                        Tage nach vorheriger Nachricht
                      </label>
                    </div>
                  `
                : ''
            }
            ${
              optionsSchema
                ? html`<div class="field">
                    <label class="field-label">Template Optionen:</label>
                    <json-form
                      .schema=${optionsSchema}
                      .uiSchema=${optionsUiSchema}
                      .value=${this.templateData}
                      .forceErrors=${this.forceFormErrors}
                      @formDataChange=${this.handleTemplateOptionsChange}
                    ></json-form>
                  </div>`
                : ''
            }
          </div>

            <div class="editor-wrapper">
              ${
                this.isCustomPreviewOpen
                  ? html`
                      <div class="custom-preview-overlay">
                        <iframe
                          class=${
                            this.previewMobile
                              ? 'custom-preview-frame is-mobile-preview'
                              : 'custom-preview-frame'
                          }
                          title="Newsletter Preview"
                          scrolling="no"
                          .srcdoc=${this.customPreviewHtml}
                          @load=${this.handleCustomPreviewFrameLoad}
                        ></iframe>
                      </div>
                    `
                  : ''
              }
              <div
                id="editor-container"
                class=${this.isCustomPreviewOpen ? 'is-hidden' : ''}
              ></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static styles = [
    css`
      :host {
        --blue: #144569;
        display: block;
      }

      .form-stack {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .field-label {
        font-weight: 500;
      }

      .field-input {
        padding: 8px 10px;
        border-radius: 4px;
        border: 1px solid #ced4da;
        font: inherit;
      }

      #editor-container {
        --gjs-left-width: clamp(20%, 20%, 20%);
        width: 100%;
        height: 100%;
        box-sizing: border-box;
      }

      .template-picker-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .template-picker-row .template-picker {
        flex: 1 1 auto;
        min-width: 240px;
      }

      .field-inline {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .field-inline .field-input {
        flex: 1 1 auto;
        min-width: 0;
      }

      .icon-button-group {
        display: flex;
        gap: 6px;
        align-items: center;
        height: 36px;
        flex: 0 0 auto;
      }

      .template-block-row {
        align-items: end;
        min-height: 36px;
      }

      .variant-inline-label {
        margin: 0;
        min-height: 28px;
        display: flex;
        align-items: center;
        font-size: 1.1rem;
        white-space: nowrap;
      }

      .template-block-select::part(combobox),
      .template-block-select::part(display-input) {
        border: none;
        box-shadow: none;
        outline: none;
      }

      .editor-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f3f4f6;
        border-radius: 6px;
        padding: 12px;
      }

      .editor-controls-row {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        flex-wrap: wrap;
      }

      .block-field,
      .variant-field {
        flex: 1 1 calc(33.333% - 11px);
        max-width: calc(33.333% - 11px);
        min-width: 280px;
      }

      .template-block-row .template-block-select {
        flex: 1 1 auto;
        min-width: 0;
      }

      .template-block-select {
        padding: 0;
        border: none;
        box-shadow: none;
        background: transparent;
      }

      .variant-field {
        justify-content: flex-start;
      }

      .variant-switch-row {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
      }

      .variant-switch-row span {
        font-size: 18px;
        line-height: 1;
      }

      #template-variant-switch {
        transform: scale(1.15);
        transform-origin: center;
      }

      @media (max-width: 1100px) {
        .block-field,
        .variant-field {
          flex: 1 1 100%;
          max-width: 100%;
        }
      }

      .mini-btn {
        width: 36px;
        height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }

      .delay-input {
        width: 72px;
        margin: 0 8px;
      }

      /* ---------- GRAPESJS THEME TWEAKS ---------- */

      .gjs-pn-devices-c .gjs-pn-btn[title='Tablet'] {
        display: none;
      }

      .gjs-placeholder,
      .gjs-com-placeholder {
        transition: none !important;
      }

      /* Panels & bars */
      .gjs-one-bg {
        background-color: var(--blue);
      }

      /* GrapesJS uses dark panels here; keep toolbar labels and icons readable. */
      .gjs-pn-btn,
      .gjs-pn-btn svg,
      .gjs-block-label,
      .gjs-sm-sector-title,
      .gjs-sm-label,
      .gjs-radio-item-label,
      .gjs-field-arrow,
      .gjs-traits-label,
      .gjs-layer-title,
      .gjs-layer-name,
      .gjs-clm-tag-status,
      .gjs-clm-tags-btn,
      .gjs-clm-header-label,
      .gjs-input,
      .gjs-select,
      .gjs-textarea,
      .gjs-four-color,
      .gjs-color-blue,
      .gjs-block:hover,
      .gjs-block.gjs-block-selected,
      .gjs-block svg,
      .gjs-block .gjs-block-label {
        color: #ffffff;
      }

      .gjs-field::placeholder,
      .gjs-input::placeholder,
      .gjs-textarea::placeholder {
        color: rgba(255, 255, 255, 0.75);
      }

      .gjs-btn-prim {
        background-color: var(--blue);
        border-color: var(--blue);
      }

      .gjs-pn-btn {
        background: transparent;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .gjs-pn-btn:hover {
        background-color: rgba(255, 255, 255, 0.08);
      }

      /* Font Awesome icons inside GrapesJS toolbar render too small by default. */
      .fa {
        font-size: 18px !important;
      }

      /* Active highlight */
      .gjs-pn-btn.gjs-pn-active {
        background-color: #2f76ad;
        box-shadow: inset 0 0 0 2px #ffffff22;
      }

      .gjs-rte-action {
        min-width: 25px;
        width: auto;
      }

      /* The asset manager should accept image paths only, so hide Grapes' upload drop area. */
      .gjs-am-file-uploader {
        display: none;
      }

      .gjs-am-assets-cont {
        width: 100%;
        float: none;
      }

      /* ---------- Preview mode ---------- */

      .gjs-off-prv::before {
        content: '×';
        font-family: inherit;
        font-size: 28px;
        font-weight: 600;
        line-height: 1;
      }

      .editor-wrapper {
        position: relative;
        border-radius: 4px;
        border: 1px solid #ced4da;
        overflow: hidden;
        height: 80vh;
      }

      #editor-container.is-hidden {
        display: none;
      }

      .custom-preview-overlay {
        position: absolute;
        inset: 0;
        z-index: 10;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        overflow-x: hidden;
        overflow-y: auto;
        background: #f5f5f5;
      }

      .custom-preview-frame {
        flex: 0 0 auto;
        width: 100%;
        min-height: 100%;
        border: 0;
        background: white;
      }

      .custom-preview-frame.is-mobile-preview {
        width: min(390px, 100%);
        min-height: 0;
        box-shadow: 0 0 0 1px #ced4da;
      }
    `,
  ];
}
