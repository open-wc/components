import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { LitElement, html, css } from 'lit';
import { OwcCard } from '../card/OwcCard.js';
import { OwcIconButton } from '../icon-button/OwcIconButton.js';

/**
 * @typedef {File & Record<string,any>} FilePlus
 */

export class OwcFileUpload extends ScopedElementsMixin(LitElement) {
  static properties = {
    dragging: { type: Boolean, reflect: true },
    files: { type: Array },
    renderCardContent: { type: Function },
    multiple: { type: Boolean },
  };

  static scopedElements = {
    'owc-card': OwcCard,
    'owc-icon-button': OwcIconButton,
  };

  constructor() {
    super();
    this.dragging = false;
    /**@type {(FilePlus)[]} */
    (this.files = []);
    this.renderCardContent = this.renderCardContentDefault;
    this.multiple = true;
  }

  render() {
    return html`
      <div
        class="drop-area"
        @dragover=${this._onDragOver}
        @dragleave=${this._onDragLeave}
        @drop=${this._onDrop}
        @click=${this._onClick}
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
                    html`<owc-card @click=${(/** @type {Event} */ ev) => ev.stopPropagation()}>${(this.renderCardContent || this.renderCardContentDefault)(file, this.removeFile.bind(this))}</owc-card></div>`,
                )}
              </div> `
            : html`<span class="upload-label"
                >Dateien hierher ziehen oder klicken, um hochzuladen</span
              >`
        }
      </div>
    `;
  }

  /**
   *
   * @param {FilePlus} file
   * @param {OwcFileUpload['removeFile']} removeFile
   * @returns
   */
  renderCardContentDefault(file, removeFile) {
    return html`${file.name}
      <owc-icon-button @click=${() => removeFile(file)} name="x"></owc-icon-button>`;
  }

  /**
   *
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

  _onClick() {
    const input = /**@type {HTMLInputElement}*/ (this.shadowRoot?.getElementById('fileInput'));
    input.click();
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
   * @param {File[]} files
   */
  _handleFiles(files) {
    if (!this.multiple) {
      this.files = [files[0]];
      this.dispatchEvent(
        new CustomEvent('files-selected', {
          detail: { files: [files[0]] },
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }

    for (const file of files) {
      if (this.files.every(elm => !this.fileIsEqual(file, elm))) {
        this.files.push(file);
      }
    }
    this.files = [...this.files];
    this.dispatchEvent(
      new CustomEvent('files-selected', {
        detail: { files },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   *
   * @param {File} file1
   * @param {File} file2
   * @returns
   */
  fileIsEqual(file1, file2) {
    return file1.size === file2.size && file1.name === file2.name && file1.type === file2.type;
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
