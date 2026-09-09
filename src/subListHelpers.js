import { html } from 'lit';

/**
 * @template T
 * @param {Array<T> | unknown} objList
 * @param {Array<(subType: T) => string | number | undefined | import('lit').TemplateResult>} fields
 * @param {number} [maxAmount]
 * @returns {import('lit').TemplateResult[] | import('lit').TemplateResult}
 */
export function renderSubList(objList, fields, maxAmount = Number.MAX_SAFE_INTEGER) {
  if (!Array.isArray(objList)) {
    return html``;
  }
  if (!objList) {
    return html``;
  }
  let i = 0;
  /**@type {import('lit').TemplateResult[]} */
  const returnArray = [];
  for (const obj of objList) {
    const values = fields.map(field => field(obj));
    if (values.every(Boolean)) {
      returnArray.push(html`
        <div class="list-content">${values.map(value => html`<div>${value}</div>`)}</div>
      `);
      i++;
    }
    if (i >= maxAmount) {
      return returnArray;
    }
  }
  return returnArray;
}

/**
 * @template T
 * @param {Array<T> | unknown} objList
 * @param {Array<(subType: T) => string | number | undefined | import('lit').TemplateResult>} fields
 * @returns {string}
 */
export function renderSubListAsString(objList, fields) {
  if (!Array.isArray(objList)) {
    return '';
  }

  const mappedObjList = objList?.map(obj => {
    const values = fields.map(field => field(obj));
    if (values.every(Boolean)) {
      return values.join(': ');
    }
  });

  return mappedObjList?.join(',') || '';
}
