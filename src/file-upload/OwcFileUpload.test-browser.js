import { fixture, html, expect, oneEvent, aTimeout } from '@open-wc/testing';
import { OwcFileUpload } from './OwcFileUpload.js';

customElements.define('owc-file-upload', OwcFileUpload);

/**
 * @param {string} name
 * @param {string} [content]
 * @param {string} [type]
 */
function makeFile(name, content = 'aaaa', type = 'text/plain') {
  return new File([content], name, { type });
}

/**
 * @param {OwcFileUpload} el
 */
function input(el) {
  return el.shadowRoot.querySelector('#fileInput');
}

/**
 * @param {OwcFileUpload} el
 */
function cards(el) {
  return [...el.shadowRoot.querySelectorAll('owc-card')];
}

/**
 * Selects files through the hidden file input like the native dialog would.
 * @param {OwcFileUpload} el
 * @param {File[]} files
 */
function selectFiles(el, files) {
  const dataTransfer = new DataTransfer();
  files.forEach(file => dataTransfer.items.add(file));
  input(el).files = dataTransfer.files;
  input(el).dispatchEvent(new Event('change'));
}

describe('owc-file-upload', () => {
  it('shows the upload label while empty, configurable via label', async () => {
    const el = await fixture(html`<owc-file-upload></owc-file-upload>`);
    expect(el.shadowRoot.querySelector('.upload-label').textContent).to.equal(
      'Dateien hierher ziehen oder klicken, um hochzuladen',
    );

    el.label = 'Drop files here';
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('.upload-label').textContent).to.equal('Drop files here');
  });

  it('adds selected files as cards and fires files-selected with the added files', async () => {
    const el = await fixture(html`<owc-file-upload></owc-file-upload>`);
    setTimeout(() => selectFiles(el, [makeFile('a.txt'), makeFile('b.txt')]));
    const event = await oneEvent(el, 'files-selected');
    await el.updateComplete;

    expect(event.detail.files.map(file => file.name)).to.deep.equal(['a.txt', 'b.txt']);
    expect(el.files.map(file => file.name)).to.deep.equal(['a.txt', 'b.txt']);
    expect(cards(el).length).to.equal(2);
    expect(cards(el)[0].textContent).to.contain('a.txt');
  });

  it('skips duplicates and only reports actually added files (regression)', async () => {
    const el = await fixture(
      html`<owc-file-upload .files=${[makeFile('a.txt')]}></owc-file-upload>`,
    );
    setTimeout(() => selectFiles(el, [makeFile('a.txt'), makeFile('b.txt')]));
    const event = await oneEvent(el, 'files-selected');
    await el.updateComplete;

    expect(event.detail.files.map(file => file.name)).to.deep.equal(['b.txt']);
    expect(el.files.map(file => file.name)).to.deep.equal(['a.txt', 'b.txt']);
    expect(cards(el).length).to.equal(2);
  });

  it('does not mutate the files array passed in by the consumer (regression)', async () => {
    const consumerFiles = [makeFile('a.txt')];
    const el = await fixture(html`<owc-file-upload .files=${consumerFiles}></owc-file-upload>`);
    setTimeout(() => selectFiles(el, [makeFile('b.txt')]));
    await oneEvent(el, 'files-selected');

    expect(consumerFiles.length).to.equal(1);
    expect(el.files.length).to.equal(2);
    expect(el.files).to.not.equal(consumerFiles);
  });

  it('replaces the selection in single mode', async () => {
    const el = await fixture(
      html`<owc-file-upload .multiple=${false} .files=${[makeFile('a.txt')]}></owc-file-upload>`,
    );
    expect(input(el).hasAttribute('multiple')).to.equal(false);

    setTimeout(() => selectFiles(el, [makeFile('b.txt')]));
    await oneEvent(el, 'files-selected');
    expect(el.files.map(file => file.name)).to.deep.equal(['b.txt']);
  });

  it('removes a file via the default card button and fires files-selected', async () => {
    const el = await fixture(
      html`<owc-file-upload .files=${[makeFile('a.txt')]}></owc-file-upload>`,
    );
    const removeButton = cards(el)[0].querySelector('owc-icon-button');
    setTimeout(() => removeButton.click());
    const event = await oneEvent(el, 'files-selected');
    await el.updateComplete;

    expect(event.detail.files).to.deep.equal([]);
    expect(el.files).to.deep.equal([]);
    expect(el.shadowRoot.querySelector('.upload-label')).to.exist;
  });

  it('accepts files via drag & drop and reflects the dragging state', async () => {
    const el = await fixture(html`<owc-file-upload></owc-file-upload>`);
    const dropArea = el.shadowRoot.querySelector('.drop-area');

    dropArea.dispatchEvent(new DragEvent('dragover', { cancelable: true }));
    await el.updateComplete;
    expect(el.hasAttribute('dragging')).to.equal(true);

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(makeFile('dropped.txt'));
    setTimeout(() =>
      dropArea.dispatchEvent(new DragEvent('drop', { cancelable: true, dataTransfer })),
    );
    const event = await oneEvent(el, 'files-selected');
    await el.updateComplete;

    expect(event.detail.files.map(file => file.name)).to.deep.equal(['dropped.txt']);
    expect(el.hasAttribute('dragging')).to.equal(false);
  });

  it('opens the file dialog via keyboard (Enter/Space)', async () => {
    const el = await fixture(html`<owc-file-upload></owc-file-upload>`);
    const dropArea = el.shadowRoot.querySelector('.drop-area');
    expect(dropArea.getAttribute('tabindex')).to.equal('0');

    let dialogOpens = 0;
    input(el).click = () => {
      dialogOpens += 1;
    };
    dropArea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    dropArea.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', cancelable: true }));
    dropArea.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', cancelable: true }));
    await aTimeout(0);
    expect(dialogOpens).to.equal(2);
  });

  it('uses a custom renderCardContent when provided', async () => {
    const el = await fixture(
      html`<owc-file-upload
        .files=${[makeFile('a.txt')]}
        .renderCardContent=${(/** @type {File} */ file) => html`custom: ${file.name}`}
      ></owc-file-upload>`,
    );
    expect(cards(el)[0].textContent).to.contain('custom: a.txt');
  });
});
