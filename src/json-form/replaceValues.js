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
