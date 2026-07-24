import { Validator } from '@cfworker/json-schema';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { LitElement, css, html, nothing } from 'lit';
import { FormDataChangeEvent } from '../FormDataChangeEvent.js';
import { invalidStyles } from '../invalidStyles.js';
import { GroupLayout } from '../layouts/GroupLayout.js';
import { HorizontalLayout } from '../layouts/HorizontalLayout.js';
import { VerticalLayout } from '../layouts/VerticalLayout.js';
import { enumRenderer, enumToOneOf, multiEnumRenderer } from '../renderers/enumRenderer.js';
import {
  checkboxRenderer,
  checkboxTagRenderer,
  dateRenderer,
  dateTimeRenderer,
  numberRenderer,
  textRenderer,
  timeRenderer,
} from '../renderers/inputRenderers.js';
import { layoutRenderer } from '../renderers/layoutRenderer.js';
import { dataPathSegments, isRequired, resolveDataSchema, resolveSchema } from '../resolve.js';
import { CheckboxComboLayout } from '../layouts/CheckboxComboLayout.js';
import { VerticalLayout2 } from '../layouts/VerticalLayout2.js';
import { VerticalLayoutGrid } from '../layouts/VerticalLayoutGrid.js';
import { removeFalseIshAndEmptyProperties } from '../helpers/validateSchema.js';
import { evaluateRule } from '../helpers/evaluateRule.js';
import { TabLayout } from '../layouts/TabLayout.js';
import { OwcSeparator } from '../../separator/OwcSeparator.js';
import { DetailsLayout } from '../layouts/DetailsLayout.js';
import { ArrayLayout } from '../layouts/ArrayLayout.js';
import { processLabel } from '../label/label.js';
import { OwcTooltip } from '../../tooltip/OwcTooltip.js';
import { OwcLocalizeController } from '@open-wc/components/localization.js';

/**@type {import("../types/renderer.js").FullRendererRecord} */
export const DEFAULT_RENDERERS = {
  checkboxTag: checkboxTagRenderer,
  date: dateRenderer,
  time: timeRenderer,
  datetime: dateTimeRenderer,
  string: textRenderer,
  boolean: checkboxRenderer,
  number: numberRenderer,
  integer: numberRenderer,
  enum: enumRenderer,
  multiEnum: multiEnumRenderer,
};

export class JsonForm extends ScopedElementsMixin(LitElement) {
  #localize = new OwcLocalizeController(this);
  static scopedElements = {
    'vertical-layout': VerticalLayout,
    'horizontal-layout': HorizontalLayout,
    'group-layout': GroupLayout,
    'checkbox-combo-layout': CheckboxComboLayout,
    'vertical-layout-2': VerticalLayout2,
    'vertical-layout-grid': VerticalLayoutGrid,
    'tab-layout': TabLayout,
    'details-layout': DetailsLayout,
    'array-layout': ArrayLayout,
    'owc-separator': OwcSeparator,
    'owc-tooltip': OwcTooltip,
  };
  static properties = {
    schema: { type: Object },
    uiSchema: { type: Object },
    value: { type: Object },
    validatorState: { type: Object },
    rootForm: { type: Boolean },
    forceErrors: { type: Boolean },
    renderers: { type: Object },
    readonly: { type: Boolean },
    mode: { type: String },
  };

  /**
   *
   * @param {Record<string,any> | undefined} options
   * @returns {import('../types/renderer.js').RendererKind | undefined}
   */
  matchingOption(options) {
    if (!options) {
      return undefined;
    }
    const kinds = /**@type {import('../types/renderer.js').RendererKind[]} */ (
      Object.keys(this.processedRenderers)
    );
    for (const option in options) {
      // @ts-ignore
      if (kinds.includes(option)) {
        // @ts-ignore
        return option;
      }
    }
  }

  constructor() {
    super();
    this.rootForm = true;
    /**@type {import("@jsonforms/core").JsonSchema7} */
    this.schema = {};
    /**@type {import("@jsonforms/core").UISchemaElement} */
    // @ts-ignore
    this.uiSchema = {};
    /**@type {Record<string, any>} */
    this.value = {};
    this.validator = null;
    this.forceErrors = false;
    this.processedRenderers = DEFAULT_RENDERERS;
    /**@type {import("../types/renderer.js").RendererRecord} */
    this.renderers = /**@type {import("../types/renderer.js").RendererRecord} */ ({});
    /**@type {import("@cfworker/json-schema").ValidationResult} */
    this.validatorState = { valid: true, errors: [] };
    this.addEventListener('formDataChange', ev => {
      if (!(ev instanceof FormDataChangeEvent)) {
        return;
      }
      if (!this.rootForm) {
        return;
      }
      if (!ev.path) {
        this.validatorState = this.getValidator().validate(
          removeFalseIshAndEmptyProperties(this.value),
        );
        return;
      }

      const segments = dataPathSegments(ev.path);

      let currentBlock = this.value;
      for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        const typedSegment = /**@type {keyof currentBlock} */ (segment);
        if (!currentBlock[typedSegment]) {
          // @ts-ignore
          currentBlock[typedSegment] = {};
        }
        currentBlock = currentBlock[typedSegment];
      }
      // @ts-ignore
      currentBlock[segments.at(-1)] = ev.value;
      this.validatorState = this.getValidator().validate(
        removeFalseIshAndEmptyProperties(this.value),
      );
    });

    this.readonly = false;
    /**@type {'form' | 'schema'} */
    this.mode = 'form';
  }

  validate() {
    this.validatorState = this.getValidator().validate(
      removeFalseIshAndEmptyProperties(this.value),
    );
  }

  /**
   *
   * @returns {Element | undefined}
   */
  getFirstInvalid() {
    const thisChild = this.shadowRoot?.querySelector(':first-child');
    if (!thisChild) {
      return;
    }
    if (
      thisChild.classList.contains('invalid') ||
      thisChild.shadowRoot?.querySelector('.invalid') ||
      thisChild.querySelector('.invalid')
    ) {
      return this;
    }

    const jsonFormChildren = /**@type {JsonForm[] | undefined} */ (
      thisChild?.shadowRoot?.querySelectorAll('json-form')
    );

    // If this is leaf node
    if (!jsonFormChildren || jsonFormChildren.length === 0) {
      // this has no invalid children
      return;
    }

    // Find invalid in children recoursively
    for (const nextForm of jsonFormChildren) {
      const invalid = nextForm.getFirstInvalid();
      if (invalid) {
        return invalid;
      }
    }
  }

  /**
   * @param {import('lit').PropertyValues} changedProperties
   */
  update(changedProperties) {
    if (changedProperties.has('renderers')) {
      // @ts-ignore
      this.processedRenderers = { ...DEFAULT_RENDERERS, ...this.renderers };
    }
    if (changedProperties.has('schema') && this.schema) {
      // @ts-ignore
      this.validator = new Validator(this.schema, '7', false);
      this.validatorState = this.getValidator().validate(
        removeFalseIshAndEmptyProperties(this.value),
      );
    }
    super.update(changedProperties);
  }

  static styles = [
    css`
      .hidden {
        display: none;
      }

      wa-slider {
        --track-color-active: var(--wa-color-primary-50);
        --track-color-inactive: var(--wa-color-primary-90);
      }

      wa-tag {
        margin: 0.2em;
      }

      wa-checkbox {
        line-height: 1;
      }

      span[slot='help-text'] {
        display: block;
      }
    `,
    ...invalidStyles,
  ];

  getValidator() {
    if (this.validator !== null) {
      return this.validator;
    }
    // @ts-ignore
    const validator = new Validator(this.schema, '7', false);
    this.validator = validator;
    return validator;
  }

  render() {
    if (!this.uiSchema?.type) {
      return nothing;
    } else if (this.uiSchema.type === 'Control') {
      const typedUiSchema = /**@type {import("@jsonforms/core").ControlElement} */ (
        structuredClone(this.uiSchema)
      );
      if (this.readonly) {
        typedUiSchema.options = { ...typedUiSchema.options, readonly: true };
      }

      const schema = resolveSchema(this.schema, typedUiSchema.scope, this.value) || {};
      const required = isRequired(this.schema, typedUiSchema.scope, this.value);
      /**@type {import("../types/renderer.js").ControlRenderer} */
      let renderer;
      const option = this.matchingOption(typedUiSchema.options);

      if (option) {
        renderer = this.processedRenderers[option];
      } else if (schema.enum || schema.oneOf) {
        // enum
        renderer = this.processedRenderers.enum;
      } else if (
        // multi select
        schema.type === 'array' &&
        !(schema.items instanceof Array) &&
        schema.items !== undefined &&
        (schema.items.enum || schema.items.oneOf)
      ) {
        renderer = this.processedRenderers.multiEnum;
      } else if (schema.format) {
        // @ts-ignore
        renderer = this.processedRenderers[schema.format] || this.processedRenderers[schema.type];
      } else {
        // @ts-ignore
        renderer = this.processedRenderers[schema.type];
      }

      const ruleOptions =
        this.mode === 'schema'
          ? { disabled: false, hidden: false }
          : // @ts-ignore
            evaluateRule(this.uiSchema.rule, this.value);

      if (this.mode === 'schema') {
        renderer = () =>
          html`${processLabel({
              schema,
              uiSchema: typedUiSchema,
              validatorState: this.validatorState,
              renderers: this.renderers,
              required: !!required,
              forceErrors: this.forceErrors,
            })}<br />
            ${
              schema.enum || schema.oneOf || schema.type === 'array'
                ? 'selection'
                : schema.format || schema.type || 'text'
            }`;
      }

      if (!renderer) {
        throw new Error(
          `Renderer could not be resolved for:\n${JSON.stringify(this.uiSchema, null, 2)}`,
        );
      }
      return renderer(
        {
          schema,
          uiSchema: typedUiSchema,
          validatorState: this.validatorState,
          renderers: this.renderers,
          required: !!required,
          forceErrors: this.forceErrors,
        },
        ruleOptions,
        this.value,
      );
    } else if (this.uiSchema.type === 'Label') {
      const typedUiSchema =
        /**@type {import("@jsonforms/core").LabelElement & {scope?: string}} */ (this.uiSchema);
      if (typedUiSchema.scope) {
        const schema = resolveSchema(this.schema, typedUiSchema.scope, this.value);
        const value = resolveDataSchema(this.value, typedUiSchema.scope);
        const _enum = schema?.oneOf ? schema.oneOf : enumToOneOf(schema?.enum);
        if (_enum) {
          return html`<h3>${_enum.find(elm => elm.const === value)?.title ?? value ?? ''}</h3>`;
        }
        return html`<h3>${value}</h3>`;
      }
      return html`<h3>${typedUiSchema.text}</h3>`;
    } else if (this.uiSchema.type === 'Separator') {
      const typedUiSchema =
        /**@type {{type: 'Separator', options?: {type?: 'vertical' | 'horizontal', label?: String}}} */ (
          this.uiSchema
        );
      return html`<owc-separator ?vertical=${typedUiSchema.options?.type === 'vertical'}
        >${typedUiSchema.options?.label || ''}</owc-separator
      >`;
    } else {
      const typedUiSchema = /**@type {import("@jsonforms/core").Layout} */ (this.uiSchema);
      // @ts-ignore
      const ruleOptions = evaluateRule(this.uiSchema.rule, this.value);
      return layoutRenderer(
        this.schema,
        typedUiSchema,
        this.value,
        this.validatorState,
        this.renderers,
        this.forceErrors,
        ruleOptions,
        this.readonly,
        this.mode,
        this.#localize.term('jsonFormRenderSyncWarning'),
      );
    }
  }
}
