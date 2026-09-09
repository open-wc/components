/**
 * @param {string} term
 */
function defaultHighlight(term) {
  return `<strong>${term}</strong>`;
}

/**
 * Highlights a search term within a text and truncates the output.
 *
 * @param {object} options
 * @param {string} options.search
 * @param {string} options.text
 * @param {string[]} [options.terms]
 * @param {boolean} [options.truncate]
 * @param {number} [options.before]
 * @param {number} [options.length]
 * @param {function} [options.highlight]
 * @param {'suffix' | 'prefix' | 'both'} [options.ellipsis]
 */
export function highlightSearchTerms({
  search,
  text,
  terms = [],
  truncate = true,
  before = 15,
  length = 100,
  highlight = defaultHighlight,
  ellipsis = 'suffix',
}) {
  if (!text) {
    return '';
  }

  let newText = text;
  let searchText = newText.toLowerCase();
  let extraLength = 0;
  let truncateStart = 0;

  const termList = terms;
  if (termList.length === 0 && search) {
    termList.push(search);
  }

  let firstFoundIndex;
  for (const term of termList) {
    let offset = 0;
    let startIndex = 0;
    const startsWithMatch = term.substring(0, search.length) === search;
    const addForEnd = startsWithMatch ? search.length : term.length;
    do {
      startIndex = searchText.indexOf(term, offset);
      if (startIndex !== -1) {
        const endIndex = startIndex + addForEnd;
        const matchingText = newText.slice(startIndex, endIndex);
        const highlightedTerm = highlight(matchingText);
        newText = [newText.slice(0, startIndex), highlightedTerm, newText.slice(endIndex)].join('');
        searchText = newText.toLowerCase();
        offset = startIndex + highlightedTerm.length;
        if (firstFoundIndex === undefined || startIndex < firstFoundIndex) {
          firstFoundIndex = startIndex;
          truncateStart = firstFoundIndex - before > 0 ? firstFoundIndex - before : 0;
        }
        if (startIndex - truncateStart - extraLength < length) {
          extraLength += highlightedTerm.length - addForEnd;
        }
      }
    } while (startIndex !== -1);
  }
  let textResult = newText;
  if (truncate) {
    textResult = newText.substring(truncateStart, truncateStart + length + extraLength);
    const prefix = ellipsis === 'prefix' || ellipsis === 'both';
    if (prefix && truncateStart > 0) {
      textResult = `...${textResult}`;
    }
    const suffix = ellipsis === 'suffix' || ellipsis === 'both';
    if (suffix && truncateStart + length + extraLength < newText.length) {
      textResult = `${textResult}...`;
    }
  }
  return textResult;
}
