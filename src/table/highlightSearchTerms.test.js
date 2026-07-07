import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { highlightSearchTerms } from './highlightSearchTerms.js';

describe('highlightSearchTerms', () => {
  it('01: truncates and add ellipses if no search is given', async () => {
    const highlighted = highlightSearchTerms({
      search: '',
      text: 'Some Text',
      length: 4,
    });
    assert.equal(highlighted, 'Some...');
  });

  it('01a: does not truncate if not needed', async () => {
    const highlighted = highlightSearchTerms({
      search: '',
      text: 'Some Text',
      length: 50,
    });
    assert.equal(highlighted, 'Some Text');
  });

  it('01: highlights a term found', async () => {
    const highlighted = highlightSearchTerms({
      search: 'more',
      terms: ['more'],
      text: 'Read more ...',
    });
    assert.equal(highlighted, 'Read <strong>more</strong> ...');
  });

  it('02: highlights a search term found regardless of casing', async () => {
    const highlighted = highlightSearchTerms({
      search: 'more',
      terms: ['more'],
      text: 'Read More ...',
    });
    assert.equal(highlighted, 'Read <strong>More</strong> ...');
  });

  it('03: highlights a term found regardless of casing', async () => {
    const highlighted = highlightSearchTerms({
      search: 'fore',
      terms: ['more'],
      text: 'Read More ...',
    });
    assert.equal(highlighted, 'Read <strong>More</strong> ...');
  });

  it('highlights all terms found', async () => {
    const highlighted = highlightSearchTerms({
      search: 'fore',
      terms: ['more'],
      text: 'Read more ... more you want to read',
    });
    assert.equal(
      highlighted,
      'Read <strong>more</strong> ... <strong>more</strong> you want to read',
    );
  });

  it('highlights only the matching part if term and search do have the same beginning', async () => {
    const highlighted = highlightSearchTerms({
      search: 'lau',
      terms: ['launch'],
      text: 'You should launch that product.',
    });
    assert.equal(highlighted, 'You should <strong>lau</strong>nch that product.');
  });

  it('truncates the text to 100 characters + highlight code', async () => {
    const highlighted = highlightSearchTerms({
      search: 'launch',
      terms: ['launch'],
      text: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi ut dapibus arcu, a sodales orci. Mauris ante lectus, dictum vel nulla non.',
        'You should launch that product.',
        'Fusce vehicula ligula at scelerisque luctus. Etiam in porta augue. Integer ac nunc dapibus, feugiat metus sit.',
      ].join(' '),
    });
    assert.equal(highlighted.length, 120); // 100 + 17 (the length of "<strong></strong>" to highlight the term) + 3 (ellipsis)
  });

  it('truncates the text to 100 characters + highlight code only for the truncated text', async () => {
    const highlighted = highlightSearchTerms({
      search: 'l',
      terms: ['l'],
      text: [
        'What lovely lego launch product you have laying around this lake of lonely lovers. Would be a shame if it would be lost.',
      ].join(' '),
    });
    assert.equal(highlighted.length, 273); // 100 + 10*17 (the length of "<strong></strong>" to highlight the term) + 3 (ellipsis)
    assert.equal(
      highlighted,
      'What <strong>l</strong>ove<strong>l</strong>y <strong>l</strong>ego <strong>l</strong>aunch product you have <strong>l</strong>aying around this <strong>l</strong>ake of <strong>l</strong>one<strong>l</strong>y <strong>l</strong>overs. Wou<strong>l</strong>d be a shame ...',
    );
  });

  it('truncates the text around to the first found term', async () => {
    const highlighted = highlightSearchTerms({
      search: 'launch',
      terms: ['launch'],
      text: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi ut dapibus arcu, a sodales orci. Mauris ante lectus, dictum vel nulla non.',
        'You should launch that product.',
        'Fusce vehicula ligula at scelerisque luctus. Etiam in porta augue. Integer ac nunc dapibus, feugiat metus sit.',
      ].join(' '),
    });
    assert.equal(
      highlighted,
      'on. You should <strong>launch</strong> that product. Fusce vehicula ligula at scelerisque luctus. Etiam in porta augu...',
    );
  });

  it('handles found terms right at the start of the text', async () => {
    const highlighted = highlightSearchTerms({
      search: 'launch',
      terms: ['launch'],
      text: 'launch that product.',
    });
    assert.equal(highlighted.length, 37); // 20 + 17 (textlength + length of "<strong></strong>")
    assert.equal(highlighted, '<strong>launch</strong> that product.');
  });
});
