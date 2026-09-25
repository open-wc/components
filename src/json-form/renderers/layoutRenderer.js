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
 * @param {import("../types/schema.js").Layout} uiSchema
 * @param {unknown} value
 * @param {import("@cfworker/json-schema").ValidationResult} validatorState
 * @param {import("../types/renderer.js").RendererRecord} renderers
 * @param {boolean} forceErrors
 * @param { {disabled: boolean; hidden: boolean} } ruleOptions
 * @param { boolean } readonly
 * @param { 'form' | 'schema' } mode
 * @param { string| undefined} syncWarning
 * @param {import('../types/renderer.js').LayoutRecord} layouts
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
  syncWarning = undefined,
  layouts = {},
) {
  const tagName = Object.hasOwn(layouts, uiSchema.type)
    ? layouts[uiSchema.type].tagName
    : LAYOUTS[/** @type {keyof typeof LAYOUTS} */ (uiSchema.type)];
  if (typeof tagName !== 'string') {
    throw new Error(
      `Unknown JsonForm layout "${uiSchema.type}". Register it with the layouts property.`,
    );
  }
  const staticTag = unsafeStatic(tagName);
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
      syncWarning: syncWarning,
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
      .layouts=${layouts}
      .validatorState=${validatorState}
      ?forceErrors=${forceErrors}
      ?readonly=${readonly}
      .mode=${mode}
    ></${staticTag}>`;
}

/**
 * @param {import("../types/schema.js").Layout} uiSchema
 * @param {string} fallbackValue
 */
function withInheritedFallbackValue(uiSchema, fallbackValue) {
  const uiSchemaCopy = structuredClone(uiSchema);
  inheritFallbackValue(uiSchemaCopy, fallbackValue);
  return uiSchemaCopy;
}

/**
 * @param {import("../types/schema.js").UISchemaElement} uiSchema
 * @param {string | undefined} fallbackValue
 */
function inheritFallbackValue(uiSchema, fallbackValue) {
  const typedUiSchema = /**@type {import("../types/schema.js").UISchemaElement} */ (uiSchema);
  const nextFallbackValue = typedUiSchema.options?.fallbackValue ?? fallbackValue;
  if (typedUiSchema.type === 'Control' && nextFallbackValue !== undefined) {
    typedUiSchema.options = {
      ...typedUiSchema.options,
      fallbackValue: nextFallbackValue,
    };
  }
  const elements = 'elements' in typedUiSchema ? typedUiSchema.elements : undefined;
  if (elements) {
    for (const element of /**@type {import("../types/schema.js").UISchemaElement[]} */ (elements)) {
      inheritFallbackValue(element, nextFallbackValue);
    }
  }
}
