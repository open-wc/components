import { html, unsafeStatic } from 'lit/static-html.js';
import { getClickEditableRenderers } from './clickEditableRenderer.js';

export const LAYOUTS = {
  VerticalLayout: 'vertical-layout',
  HorizontalLayout: 'horizontal-layout',
  GroupLayout: 'group-layout',
  CheckboxComboLayout: 'checkbox-combo-layout',
  VerticalLayout2: 'vertical-layout-2',
  VerticalLayoutGrid: 'vertical-layout-grid',
  TabLayout: 'tab-layout',
  DetailsLayout: 'details-layout',
  ArrayLayout: 'array-layout',
};

/**
 * @param {unknown} schema
 * @param {import("@jsonforms/core").Layout} uiSchema
 * @param {unknown} value
 * @param {import("@cfworker/json-schema").ValidationResult} validatorState
 * @param {import("../types/renderer.js").RendererRecord} renderers
 * @param {boolean} forceErrors
 * @param { {disabled: boolean; hidden: boolean} } ruleOptions
 * @param { boolean } readonly
 * @param { 'form' | 'schema' } mode
 */
export function layoutRenderer(
  schema,
  uiSchema,
  value,
  validatorState,
  renderers,
  forceErrors,
  ruleOptions,
  readonly,
  mode,
) {
  // @ts-ignore
  const staticTag = unsafeStatic(LAYOUTS[uiSchema.type]);
  const processedUiSchema =
    uiSchema.options?.fallbackValue !== undefined
      ? withInheritedFallbackValue(uiSchema, uiSchema.options.fallbackValue)
      : uiSchema;
  let processedRenderers = renderers;
  if (uiSchema.options?.renderers === 'default') {
    // @ts-ignore
    processedRenderers = undefined;
  }
  if (uiSchema.options?.renderers === 'clickEditable') {
    // @ts-ignore
    processedRenderers = getClickEditableRenderers({
      fallbackValue: uiSchema.options?.fallbackValue,
    });
  }
  if (ruleOptions?.hidden) {
    return html``;
  }
  return html`<${staticTag}
      .schema=${schema}
      .uiSchema=${processedUiSchema}
      .value=${value}
      .renderers=${processedRenderers}
      .validatorState=${validatorState}
      ?forceErrors=${forceErrors}
      ?readonly=${readonly}
      .mode=${mode}
    ></${staticTag}>`;
}

/**
 * @param {import("@jsonforms/core").Layout} uiSchema
 * @param {string} fallbackValue
 */
function withInheritedFallbackValue(uiSchema, fallbackValue) {
  const uiSchemaCopy = structuredClone(uiSchema);
  inheritFallbackValue(uiSchemaCopy, fallbackValue);
  return uiSchemaCopy;
}

/**
 * @param {import("@jsonforms/core").UISchemaElement} uiSchema
 * @param {string | undefined} fallbackValue
 */
function inheritFallbackValue(uiSchema, fallbackValue) {
  const typedUiSchema =
    /**@type {import("@jsonforms/core").UISchemaElement & {options?: {fallbackValue?: string}; elements?: import("@jsonforms/core").UISchemaElement[]}}*/ (
      uiSchema
    );
  const nextFallbackValue = typedUiSchema.options?.fallbackValue ?? fallbackValue;
  if (typedUiSchema.type === 'Control' && nextFallbackValue !== undefined) {
    typedUiSchema.options = {
      ...typedUiSchema.options,
      fallbackValue: nextFallbackValue,
    };
  }
  if (typedUiSchema.elements) {
    for (const element of typedUiSchema.elements) {
      inheritFallbackValue(element, nextFallbackValue);
    }
  }
}
