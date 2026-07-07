import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { LitElement, html, css } from 'lit';
import { OwcCard } from '../card/OwcCard.js';
import { OwcIconButton } from '../icon-button/OwcIconButton.js';

import { addFiles, fileIsEqual } from './fileHelpers.js';

/**
 * @typedef {File & Record<string,any>} FilePlus
 */

/**
 * A drop area for selecting files via drag & drop, click, or keyboard.
 * Selected files render as removable cards.
 *
 * @fires files-selected - after files are added (detail.files lists the newly
 *   added files) or removed (detail.files is empty); read the current list
 *   from the files property
 */
export class OwcFileUpload extends ScopedElementsMixin(LitElement) {
  static properties = {
    dragging: { type: Boolean, reflect: true },
    files: { type: Array },
    renderCardContent: { attribute: false },
    multiple: { type: Boolean },
    label: { type: String },
  };

  static scopedElements = {
    'owc-card': OwcCard,
    'owc-icon-button': OwcIconButton,
  };

  constructor() {
    super();
    this.dragging = false;
    /** @type {FilePlus[]} */
    this.files = [];
    this.renderCardContent = this.renderCardContentDefault;
    this.multiple = true;
    this.label = 'Dateien hierher ziehen oder klicken, um hochzuladen';
  }

  render() {
    return html`
      <div
        class="drop-area"
        tabindex="0"
        aria-label=${this.label}
        @dragover=${this._onDragOver}
        @dragleave=${this._onDragLeave}
        @drop=${this._onDrop}
        @click=${this._onClick}
        @keydown=${this._onKeyDown}
      >
        <input
          type="file"
          id="fileInput"
          @change=${this._onFileChange}
          ?multiple=${this.multiple}
        />
        ${
          this.files?.length
            ? html`<div class="file-list">
                ${this.files.map(
                  file =>
                    html`<owc-card @click=${(/** @type {Event} */ ev) => ev.stopPropagation()}
                      >${(this.renderCardContent || this.renderCardContentDefault)(
                        file,
                        this.removeFile.bind(this),
                      )}</owc-card
                    >`,
                )}
              </div> `
            : html`<span class="upload-label">${this.label}</span>`
        }
      </div>
    `;
  }

  /**
   * @param {FilePlus} file
   * @param {OwcFileUpload['removeFile']} removeFile
   * @returns {import('lit').TemplateResult}
   */
  renderCardContentDefault(file, removeFile) {
    return html`${file.name}
      <owc-icon-button
        @click=${() => removeFile(file)}
        name="x"
        label="Remove ${file.name}"
      ></owc-icon-button>`;
  }

  /**
   * @param {File} file
   */
  removeFile(file) {
    this.files = this.files.filter(elm => elm !== file);
    this.dispatchEvent(
      new CustomEvent('files-selected', {
        detail: { files: [] },
        bubbles: true,
        composed: true,
      }),
    );
  }

  get #fileInput() {
    return /**@type {HTMLInputElement}*/ (this.shadowRoot?.getElementById('fileInput'));
  }

  _onClick() {
    this.#fileInput.click();
  }

  /**
   * @param {KeyboardEvent} event
   */
  _onKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.#fileInput.click();
    }
  }

  /**
   * @param {DragEvent} event
   */
  _onDragOver(event) {
    event.preventDefault();
    this.dragging = true;
  }

  /**
   * @param {DragEvent} event
   */
  _onDragLeave(event) {
    event.preventDefault();
    this.dragging = false;
  }

  /**
   * @param {DragEvent} event
   */
  _onDrop(event) {
    event.preventDefault();
    this.dragging = false;
    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length) {
      this._handleFiles(files);
    }
  }

  /**
   * @param {InputEvent} event
   */
  _onFileChange(event) {
    const input = /**@type {HTMLInputElement}*/ (event.target);
    const files = Array.from(input.files || []);
    if (files.length) {
      this._handleFiles(files);
      input.value = ''; // Reset input
    }
  }

  /**
   * @param {File} file1
   * @param {File} file2
   * @returns {boolean}
   */
  fileIsEqual(file1, file2) {
    return fileIsEqual(file1, file2);
  }

  /**
   * @param {File[]} incoming
   */
  _handleFiles(incoming) {
    const { files, added } = addFiles(this.files, incoming, this.multiple);
    this.files = files;
    this.dispatchEvent(
      new CustomEvent('files-selected', {
        detail: { files: added },
        bubbles: true,
        composed: true,
      }),
    );
  }

  static styles = css`
    :host {
      display: block;
      border: var(--wa-border-width-m) dashed var(--wa-color-neutral-border-normal);
      padding: 20px;
      text-align: center;
      border-radius: 8px;
      transition:
        background-color 0.3s,
        border-color 0.3s;
      cursor: pointer;
    }

    :host([dragging]) {
      background-color: var(--wa-color-brand-95);
      border-color: var(--wa-color-brand-60);
    }

    .drop-area:focus-visible {
      outline: var(--wa-focus-ring);
      outline-offset: var(--wa-focus-ring-offset);
    }

    input[type='file'] {
      display: none;
    }

    .upload-label {
      display: block;
      font-size: 1rem;
      color: var(--wa-color-text-quiet);
    }

    .file-list {
      display: flex;
      flex-direction: row;
      gap: 10px;
    }

    owc-card {
      cursor: default;
      --spacing: var(--wa-space-s);
    }

    owc-icon-button {
      padding: 0;
    }
  `;
}
