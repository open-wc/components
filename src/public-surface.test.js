import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

describe('public helper surface', () => {
  it('exports table helpers from table-owned paths', async () => {
    const csv = await import('@open-wc/components/table/csv.js');
    const excel = await import('@open-wc/components/table/excel.js');
    const subListHelpers = await import('@open-wc/components/table/subListHelpers.js');
    const dateParser = await import('@open-wc/components/table/dateParserForJsonDecode.js');

    assert.equal(typeof csv.convertToCsv, 'function');
    assert.equal(typeof csv.copyAsCsv, 'function');
    assert.equal(typeof csv.downloadAsCsv, 'function');
    assert.equal(typeof excel.convertToExcel, 'function');
    assert.equal(typeof excel.copyAsExcel, 'function');
    assert.equal(typeof subListHelpers.renderSubList, 'function');
    assert.equal(typeof subListHelpers.renderSubListAsString, 'function');
    assert.equal(typeof dateParser.dateParserForJsonDecode, 'function');
  });

  it('exports JSON Filter adapters from filter-owned paths', async () => {
    const filter = await import('@open-wc/components/filter/jsonToFilter.js');
    const sqlFilter = await import('@open-wc/components/filter/jsonToSqlFilter.js');

    assert.equal(typeof filter.jsonToFilter, 'function');
    assert.equal(typeof filter.globalSearchField, 'string');
    assert.equal(typeof sqlFilter.jsonToSqlFilter, 'function');
  });

  it('exports text and Lit helpers from owned paths', async () => {
    const text = await import('@open-wc/components/text/highlightSearchTerms.js');
    const lit = await import('@open-wc/components/lit/litHtmlToString.js');

    assert.equal(typeof text.highlightSearchTerms, 'function');
    assert.equal(typeof lit.litHtmlToString, 'function');
  });
});
