import { LitElement, css, html } from 'lit';
import { HasSlotController } from '../autocomplete/HasSlotController.js';

/**
 * A leading icon and heading/body stack with an optional full-width action below.
 * Callers own heading semantics, action controls, and their behavior.
 *
 * @slot - The descriptive content.
 * @slot heading - A heading with the level appropriate to its surrounding page.
 * @slot icon - An optional leading visual; mark decorative icons aria-hidden.
 * @slot actions - Optional links or buttons; direct children fill the available width.
 * @csspart base - The card surface and outer stack.
 * @csspart content - The icon and text row.
 * @csspart icon - The leading visual container.
 * @csspart text - The heading and body stack.
 * @csspart heading - The heading slot.
 * @csspart body - The descriptive content slot.
 * @csspart actions - The action container.
 * @cssproperty --owc-action-card-background - The surface color.
 * @cssproperty --owc-action-card-border - The border shorthand.
 */
export class OwcActionCard extends LitElement {
  static properties = {
    hasIcon: { state: true },
    hasHeading: { state: true },
    hasBody: { state: true },
    hasActions: { state: true },
  };

  constructor() {
    super();
    this.hasSlotController = new HasSlotController(this, 'icon', 'heading', '[default]', 'actions');
    this.hasIcon = false;
    this.hasHeading = false;
    this.hasBody = false;
    this.hasActions = false;
  }

  willUpdate() {
    this.hasIcon = this.hasSlotController.test('icon');
    this.hasHeading = this.hasSlotController.test('heading');
    this.hasBody = this.hasSlotController.test('[default]');
    this.hasActions = this.hasSlotController.test('actions');
  }

  render() {
    return html`
      <div part="base" class="base">
        <div part="content" class="content">
          <div part="icon" class="icon" ?hidden=${!this.hasIcon}><slot name="icon"></slot></div>
          <div part="text" class="text">
            <slot part="heading" name="heading" ?hidden=${!this.hasHeading}></slot>
            <slot part="body" ?hidden=${!this.hasBody}></slot>
          </div>
        </div>
        <div part="actions" class="actions" ?hidden=${!this.hasActions}>
          <slot name="actions"></slot>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      min-inline-size: 0;
      color: var(--wa-color-text-normal, #333);
      font-family: var(--wa-font-family-body, inherit);
      font-size: var(--wa-font-size-s, 0.875rem);
      line-height: var(--wa-line-height-condensed, 1.2);
    }
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
    [hidden] {
      display: none !important;
    }
    .base {
      display: grid;
      gap: var(--wa-space-s, 0.75rem);
      padding: var(--wa-space-s, 0.75rem) var(--wa-space-m, 1rem);
      border: var(--owc-action-card-border, 1px solid var(--wa-color-surface-border, #ddd));
      border-radius: var(--wa-border-radius-l, 0.5rem);
      background: var(--owc-action-card-background, var(--wa-color-surface-default, white));
    }
    .content {
      display: flex;
      align-items: center;
      gap: var(--wa-space-s, 0.75rem);
      min-inline-size: 0;
    }
    .icon {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      inline-size: 1.5rem;
      block-size: 1.5rem;
    }
    .text {
      display: grid;
      flex: 1;
      gap: var(--wa-space-3xs, 0.125rem);
      min-inline-size: 0;
      overflow-wrap: anywhere;
    }
    slot[part='heading'] {
      font-family: var(--wa-font-family-heading, inherit);
      font-weight: var(--wa-font-weight-heading, 600);
    }
    slot::slotted(*) {
      margin: 0;
    }
    slot[name='heading']::slotted(*) {
      font: inherit;
    }
    .actions {
      display: grid;
      gap: var(--wa-space-s, 0.75rem);
      min-inline-size: 0;
    }
    slot[name='actions']::slotted(*) {
      display: block;
      inline-size: 100%;
      min-inline-size: 0;
      max-inline-size: 100%;
      box-sizing: border-box;
      white-space: normal;
      overflow-wrap: anywhere;
    }
  `;
}
