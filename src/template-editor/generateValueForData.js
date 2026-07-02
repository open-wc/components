/**
 * @param {Record<string, any>} data
 * @param {import('./OwcTemplateEditorTypes.js').TemplateRecord} templateRecord
 * @param {{
 *   index: number,
 *   variantSelector?: (data: Record<string, any>, options: string[]) => options[number],
 *   postProcessor?: (input: string, data: Record<string, any>) => string,
 *   htmlSanitizer?: (html: string) => string,
 *   dataParameter?: Record<string, any>,
 *   renderMode?: 'html' | 'mjml',
 *   mjmlCompiler?: (
 *     input: string,
 *     options?: Record<string, any>
 *   ) => ({ html?: string, errors?: unknown[] } | undefined)
 * }} options
 */
export function generateValueForData(
  data,
  templateRecord,
  {
    index,
    variantSelector = (_data, options) => options[0],
    postProcessor = str => str,
    htmlSanitizer = str => str,
    dataParameter = {},
    renderMode,
    mjmlCompiler,
  },
) {
  const correctIndex = templateRecord?.template?.[index];
  if (!correctIndex || typeof correctIndex !== 'object') {
    return { subject: '', html: '' };
  }

  const variantKeys = Object.keys(correctIndex);
  const selectedVariantKey = variantSelector(data, variantKeys);
  const correctVariant = correctIndex[selectedVariantKey] || correctIndex[variantKeys[0]];

  if (!correctVariant) {
    return { subject: '', html: '' };
  }

  const replaceValuesData = {
    ...data,
    template: templateRecord.options?.value,
    fileList: filesToObj(templateRecord),
  };

  const subject = replaceValues(correctVariant.subject || '', replaceValuesData, dataParameter);

  const rawTemplateHtml = correctVariant.html || '';

  const detectedRenderMode =
    renderMode ||
    (typeof rawTemplateHtml === 'string' && rawTemplateHtml.includes('<mjml') ? 'mjml' : 'html');

  if (detectedRenderMode === 'mjml') {
    if (typeof mjmlCompiler !== 'function') {
      throw new Error('MJML template detected but no mjmlCompiler was provided.');
    }

    const mjmlWithValues = replaceValues(rawTemplateHtml, replaceValuesData, dataParameter);

    const result = mjmlCompiler(mjmlWithValues, {
      validationLevel: 'soft',
    });

    const compiledHtml = typeof result?.html === 'string' ? result.html : '';

    return {
      subject,
      html: htmlSanitizer(postProcessor(compiledHtml, dataParameter)),
    };
  }

  return {
    subject,
    html: htmlSanitizer(
      postProcessor(
        replaceValues(rawTemplateHtml, replaceValuesData, dataParameter),
        dataParameter,
      ),
    ),
  };
}

/**
 * @param {string} text
 * @param {Record<string, any>} obj
 * @param {Record<string,any>} [dataParameter]
 * @returns {string}
 */
export function replaceValues(text, obj, dataParameter = {}) {
  const parsedMarkup = parseCustomMarkup(text);
  const parsedTernaries = parseTernaries(parsedMarkup, obj, dataParameter);

  const replaceValuesText = parsedTernaries.replace(/{(.*?)}/g, (_, key) => {
    return resolveProperty(key, obj, dataParameter);
  });
  return replaceValuesText;
}

/**
 * @param {string} key
 * @param {Record<string,any>} obj
 * @param {Record<string,any>} [dataParameter]
 */
function resolveProperty(key, obj, dataParameter = {}) {
  const path = key.split('.');
  let last = undefined;
  let next = obj;
  // Find property
  for (const part of path) {
    if (
      typeof next === 'string' ||
      typeof next === 'number' ||
      typeof next === 'function' ||
      next[part] === undefined
    ) {
      break;
    }
    last = next;
    next = next[part];
  }
  // Execute function if necessary
  if (typeof next === 'function') {
    next = next.bind(last)(dataParameter);
  }

  // Check return value
  if (typeof next === 'object' || typeof next === 'symbol' || typeof next === 'undefined') {
    return '';
  }
  return next;
}

/**
 * @param {string} text
 * @param {Record<string, any>} obj
 * @param {Record<string,any>} [dataParameter]
 * @returns {string}
 */
function parseTernaries(text, obj, dataParameter = {}) {
  const replaced = text.replace(
    /\{([\w.]+)(?:\s*(===|!==)\s*['"]([^'"]*)['"])?\s*\?\s*['"](.*?)['"]\s*:\s*['"](.*?)['"]\}/g,
    (_, key, op, compStr, first, second) => {
      const checkValue = resolveProperty(key, obj, dataParameter);
      const compData = typeof checkValue === 'number' ? Number.parseFloat(compStr) : compStr;
      let evaluation = false;
      if (op === '===') {
        evaluation = checkValue === compData;
      } else if (op === '!==') {
        evaluation = checkValue !== compData;
      } else {
        evaluation = Boolean(checkValue);
      }

      if (evaluation) {
        return replaceValues(first, obj, dataParameter);
      } else {
        return replaceValues(second, obj, dataParameter);
      }
    },
  );
  return replaced;
}

/**
 *
 * @param {string} input
 * @returns
 */
function parseCustomMarkup(input) {
  const linkReplaced = input.replace(
    /\[link(?: class="([^"]+)")? href="([^"]+)"\]((?:.|\n)*?)\[\/link\]/g,
    (_, className, href, text) =>
      `<a href="${href}" class="${className || ''}" style="white-space: nowrap">${text}</a>`,
  );
  return linkReplaced;
}

/**
 * @param {import('./OwcTemplateEditorTypes.js').TemplateRecord} templateRecord
 */
export function filesToObj(templateRecord) {
  if (!templateRecord.options?.fileList) {
    return {};
  }
  return Object.fromEntries(templateRecord.options.fileList.map(file => [file.id, file]));
}
