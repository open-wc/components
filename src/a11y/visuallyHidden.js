import { css } from 'lit';

/**
 * The declarations that hide an element visually but keep it for assistive
 * technology, like a label that names a form control which something else on
 * screen labels already. For a rule of a component's styles:
 *
 * ```js
 * css`
 *   .named-by-column::part(label) {
 *     ${visuallyHidden}
 *   }
 * `;
 * ```
 */
export const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;
