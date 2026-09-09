import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { getLinkAttributes } from './linkHelpers.js';

describe('getLinkAttributes', () => {
  it('01: a plain link only carries the href', () => {
    assert.deepEqual(getLinkAttributes({ href: '/docs', target: '', download: '' }), {
      href: '/docs',
      target: undefined,
      download: undefined,
      rel: undefined,
    });
  });

  it('02: an empty download stays unset - a bare download="" would force a download (regression)', () => {
    const attributes = getLinkAttributes({ href: '/report', target: '', download: '' });
    assert.equal(attributes.download, undefined);
  });

  it('03: a download filename is passed through', () => {
    const attributes = getLinkAttributes({ href: '/report', target: '', download: 'report.pdf' });
    assert.equal(attributes.download, 'report.pdf');
  });

  it('04: a target adds rel="noreferrer noopener"', () => {
    assert.deepEqual(
      getLinkAttributes({ href: 'https://example.com', target: '_blank', download: '' }),
      {
        href: 'https://example.com',
        target: '_blank',
        download: undefined,
        rel: 'noreferrer noopener',
      },
    );
  });
});
