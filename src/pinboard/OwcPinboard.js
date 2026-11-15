import { LitElement, css, html, nothing, render } from 'lit';
import { OwcCard } from '../card/OwcCard.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { repeat } from 'lit/directives/repeat.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
import '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js';
import { OwcLocalizeController } from '@open-wc/components/localization.js';
import {
  VirtualizerController,
  spacerStyles,
  virtualizes,
} from '../virtualizer/VirtualizerController.js';
import {
  controlsIn,
  focusControl,
  handleInteractionKey,
  keepOutOfTabOrder,
} from '../a11y/controls.js';
import { LiveRegionController } from '../a11y/LiveRegionController.js';
import { keyName } from '../a11y/keys.js';

/** Height of a card in px until the cards of a list have been measured. */
const ESTIMATED_CARD_HEIGHT = 80;

/** The element of a card that takes the focus: its list item. */
const CARD_ITEM = 'column-item';

/** Selects what holds a card's content, whose controls are no Tab stops. */
const CARD_CONTENT = '.column-card';

/** The keys that move the roving focus. */
const NAVIGATION_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);

/**
 * A card by where it is: the key of its list, and its index among the cards
 * of that list.
 *
 * @typedef {{ list: string, index: number }} CardPosition
 */

/**
 * A key that was pressed on a card, or on a list that holds the focus for a
 * card that isn't rendered.
 *
 * @typedef {object} CardKeyPress
 * @property {string} key its name with modifiers, like `ArrowDown` or `Shift+F10`
 * @property {KeyboardEvent} event
 * @property {HTMLElement} [item] the list item of the card; none while a list holds the focus
 */

/**
 * Where a card can be, and where it can go: a column, or a dropzone. The
 * board's destinations are its columns from left to right, then its dropzones
 * in the order they show.
 *
 * @template T
 * @typedef {object} Destination
 * @property {'column' | 'dropzone'} kind
 * @property {string} name the column's `value`, or the dropzone's key: what the hooks and `canDrop` get
 * @property {string} label its accessible name: the column's `label`, else its `value`; the localized name of a dropzone
 * @property {string} [header] the text of a column's header, if it has one
 * @property {string} [listKey] identifies its list of cards across renders; a dropzone that keeps no cards has none
 * @property {T[]} cards the cards of its list, in the order they show
 * @property {boolean} open whether its list shows: always for a column, for a dropzone while its list is open
 * @property {boolean} liftable whether cards can be moved out of its list
 * @property {(data: T, name: string) => void | Promise<void>} onLift takes a card out of it: the consumer's hook, else the default
 * @property {(data: T, name: string) => void | Promise<void>} onDrop puts a card into it: the consumer's hook, else the default
 */

/**
 * @template {Record<string, any>} T
 * @template {{label?: string, value: string, onDrop?: (data: T, column: string) => void, onLift?: (data: T, column: string) => void}[]} Columns
 * @template {{data: T[], onDrop: (data: T, column: string) => void, onLift?: (data: T, column: string) => void, liftable?: boolean}} DropzoneColumn
 */
export class OwcPinboard extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'owc-card': OwcCard,
  };

  static properties = {
    data: { type: Array },
    columns: { type: Array },
    dropZones: { type: Object },
    sorter: { type: Function },
    fieldMapper: { type: Object },
    canDrop: { type: Function },
    cardLabel: { attribute: false },
    getCardId: { attribute: false },
    virtualizerMode: { type: String, attribute: 'virtualizer-mode' },
  };

  constructor() {
    super();
    /**@type {T[][]} */
    this.data = [];
    /**@type {Columns} */
    // @ts-ignore
    this.columns = [];
    /**@type {{delete?: DropzoneColumn, success?: DropzoneColumn}}} */
    this.dropZones = {};
    /**@type {import('../card-list/CardListTypes.js').Fields<T>} */
    this.fieldMapper = { body: () => '' };
    /**@type {(a: T, b: T) => number} */
    this.sorter = () => 0;
    /**@type {(data: T, column: string) => boolean} */
    this.canDrop = () => true;
    /**
     * The name of a card: its accessible name, and what announcements call it.
     * Without it, a card is named by its text.
     *
     * @type {((data: T) => string) | undefined}
     */
    this.cardLabel = undefined;
    /**
     * What identifies a card when its object is replaced by a new one, so the
     * focus stays on it. Without it, a card is its object.
     *
     * @type {((data: T) => string | number) | undefined}
     */
    this.getCardId = undefined;
    /**@type {import('../virtualizer/VirtualizerController.js').VirtualizerMode} */
    this.virtualizerMode = 'auto';
  }

  /**
   * One virtualizer per list (column or dropzone list) that renders through
   * one, created on its first virtualized render.
   *
   * @type {Map<string, VirtualizerController<T>>}
   */
  #virtualizers = new Map();

  /** @type {Set<string>} the lists the current render virtualizes */
  #virtualizedLists = new Set();

  /** @type {WeakMap<T[], {sorter: (a: T, b: T) => number, source: T[], sorted: T[]}>} */
  #sortedLists = new WeakMap();

  /** @type {WeakMap<T, string>} */
  #contentIds = new WeakMap();

  #contentIdCount = 0;

  #localize = new OwcLocalizeController(this);

  /** Says what a screen reader user can't see, e.g. how to leave a card's controls. */
  #liveRegion = new LiveRegionController(this);

  /**
   * The columns, then the dropzones, as of the last render.
   *
   * @type {Destination<T>[]}
   */
  #destinations = [];

  /** @type {Set<string>} the names of the dropzones whose list is open */
  #openDropzones = new Set();

  willUpdate() {
    this.#virtualizedLists = new Set();
    this.#destinations = this.#buildDestinations();
    this.#moveTo = this.#localize.term('pinboardMoveTo');
    this.#refreshPickedUp();
    const active = this.shadowRoot?.activeElement;
    const item = active ? this.#itemOf(active) : undefined;
    this.#focusedBeforeUpdate = item && { item, list: this.#positionOf(item).list };
  }

  /** @returns {Destination<T>[]} */
  #buildDestinations() {
    /** @type {Destination<T>[]} */
    const columns = this.columns.map((column, index) => ({
      kind: 'column',
      name: column.value,
      label: column.label || column.value,
      header: column.label,
      listKey: `column:${column.value}`,
      cards: this.#sorted(this.data[index]),
      open: true,
      liftable: true,
      ...this.#wrapCallbacks(column),
    }));
    /** @type {Destination<T>[]} */
    const dropzones = Object.entries(this.dropZones)
      .filter(([, config]) => config)
      .map(([name, config]) => ({
        kind: 'dropzone',
        name,
        label: this.#localize.term(
          name === 'success' ? 'pinboardDropzoneSuccess' : 'pinboardDropzoneDelete',
        ),
        listKey: config.data !== undefined ? `dropzone:${name}` : undefined,
        cards: this.#sorted(config.data),
        open: config.data !== undefined && this.#openDropzones.has(name),
        liftable: config.liftable || false,
        ...this.#wrapCallbacks({ onDrop: config.onDrop, onLift: config.onLift }),
      }));
    return [...columns, ...dropzones];
  }

  /** @param {string | undefined} name */
  #destination(name) {
    return this.#destinations.find(destination => destination.name === name);
  }

  updated() {
    // Lists that are gone, or render every card now, don't need their
    // virtualizer anymore. It went idle in its `hostUpdated`, as its spacers
    // are no longer rendered.
    for (const [key, virtualizer] of this.#virtualizers) {
      if (!this.#virtualizedLists.has(key)) {
        this.removeController(virtualizer);
        this.#virtualizers.delete(key);
      }
    }
    if (this.#moveMenu && !this.renderRoot.querySelector('.move-menu')) {
      // The card of the open menu isn't rendered anymore, so the menu is
      // gone. It doesn't come back with the card.
      this.#moveMenu = undefined;
    }
    const board = this.#board;
    if (board) {
      // New cards and new card content bring new controls with every render.
      keepOutOfTabOrder(board, CARD_CONTENT);
      const focused = this.#focusedBeforeUpdate;
      this.#focusedBeforeUpdate = undefined;
      if (focused && !focused.item.isConnected) {
        this.#interactionItem = undefined;
        this.#restoreFocus(focused.list);
      }
      this.#updateTabStop();
    }
  }

  /**
   * The id of the element with a card's content, which names the card's list
   * item while there is no `cardLabel`.
   *
   * @param {T} card
   */
  #contentIdOf(card) {
    let id = this.#contentIds.get(card);
    if (!id) {
      id = `pinboard-card-${++this.#contentIdCount}`;
      this.#contentIds.set(card, id);
    }
    return id;
  }

  /** @param {string} key */
  #virtualizerFor(key) {
    this.#virtualizedLists.add(key);
    let virtualizer = this.#virtualizers.get(key);
    if (!virtualizer) {
      virtualizer = new VirtualizerController(this, { estimateSize: ESTIMATED_CARD_HEIGHT });
      this.#virtualizers.set(key, virtualizer);
    }
    return virtualizer;
  }

  /**
   * A sorted copy of a list. It is sorted again only when the list's cards or
   * the sorter change, so the virtualizer keeps its state across renders.
   *
   * @param {T[] | undefined} data
   * @returns {T[]}
   */
  #sorted(data = []) {
    const cached = this.#sortedLists.get(data);
    if (
      cached &&
      cached.sorter === this.sorter &&
      cached.source.length === data.length &&
      cached.source.every((item, index) => item === data[index])
    ) {
      return cached.sorted;
    }
    const sorted = [...data].sort(this.sorter);
    this.#sortedLists.set(data, { sorter: this.sorter, source: [...data], sorted });
    return sorted;
  }

  render() {
    return html` <div
      class="main-container"
      @keydown=${this.#handleBoardKeydown}
      @focusin=${this.#handleBoardFocusin}
      @focusout=${this.#handleBoardFocusout}
    >
      <div class="column-container">
        ${repeat(
          this.#destinations.filter(destination => destination.kind === 'column'),
          destination => destination.name,
          destination => this.#renderList(destination),
        )}
      </div>
      <div class="dropzone-container-container">
        <div class="dropzone-container">
          ${this.#destinations
            .filter(destination => destination.kind === 'dropzone')
            .map(destination => this.#renderDropzone(destination))}
        </div>
      </div>
    </div>`;
  }

  /**
   * A dropzone: a button, and the list of the cards it keeps, if it keeps
   * them. The button opens and closes the list.
   *
   * @param {Destination<T>} dropzone
   */
  #renderDropzone(dropzone) {
    const { name, listKey } = dropzone;
    const listId = `dropzone-list-${name}`;
    return html` <div class="${name}-container dropzone-sub-container">
      <button
        type="button"
        class="dropzone ${name} ${this.#dropCues(dropzone)}"
        aria-label=${dropzone.label}
        aria-expanded=${ifDefined(listKey ? String(dropzone.open) : undefined)}
        aria-controls=${ifDefined(listKey ? listId : undefined)}
        .name=${name}
        @dragover=${this.#onDragMove}
        @drop=${this.#onDrop}
        @dragleave=${this.#onDragLeave}
        @click=${() => this.#handleDropzoneClick(name)}
      >
        <wa-icon
          auto-width
          class="dropzone-icon"
          name=${name === 'success' ? 'check' : 'trash'}
        ></wa-icon>
      </button>
      ${
        listKey
          ? html`<wa-details
              class="dropzone-details"
              @wa-show=${(/** @type {Event} */ event) => this.#onDropzoneListToggle(event, name)}
              @wa-hide=${(/** @type {Event} */ event) => this.#onDropzoneListToggle(event, name)}
            >
              ${this.#renderList(dropzone, listId)}
            </wa-details>`
          : nothing
      }
    </div>`;
  }

  /** @param {string} dropzone */
  #handleDropzoneClick(dropzone) {
    const details = /**@type {{open: boolean} | undefined}*/ (
      this.shadowRoot?.querySelector(`.${dropzone}-container .dropzone-details`)
    );
    if (!details) {
      return;
    }
    details.open = !details.open;
  }

  /**
   * Follows the list of a dropzone as it opens and closes, whoever does it.
   *
   * @param {Event} event `wa-show` or `wa-hide` of the list's `wa-details`
   * @param {string} name the dropzone's
   */
  #onDropzoneListToggle(event, name) {
    if (event.target !== event.currentTarget) {
      // from a `wa-details` in a card
      return;
    }
    if (/** @type {HTMLElement & { open: boolean }} */ (event.target).open) {
      this.#openDropzones.add(name);
    } else {
      this.#openDropzones.delete(name);
    }
    this.requestUpdate();
  }

  /**
   * The list of cards of a column or of a dropzone, with the column's header.
   *
   * @param {Destination<T>} destination
   * @param {string} [listId] an id for the list element
   */
  #renderList(destination, listId) {
    const { liftable } = destination;
    return html`
      <div
        class="column ${liftable ? 'liftable' : ''} ${
          destination.kind === 'column' ? this.#dropCues(destination) : ''
        }"
        .name=${destination.name}
        @dragover=${this.#onDragMove}
        @drop=${this.#onDrop}
        @dragleave=${this.#onDragLeave}
        @dragstart=${liftable ? this.#onDragStart : undefined}
        @dragend=${liftable ? this.#onDragEnd : undefined}
      >
        ${
          destination.header
            ? html`<div class="column-header-cell">${destination.header}</div>`
            : nothing
        }
        <div
          class="card-list"
          id=${ifDefined(listId)}
          role="list"
          aria-label=${destination.label}
          .listKey=${destination.listKey}
        >
          ${this.#renderCards(
            destination.cards,
            liftable,
            /** @type {string} */ (destination.listKey),
          )}
        </div>
      </div>
    `;
  }

  /**
   * Every card, or the cards in and around the visible area between two
   * spacers, from the `virtualizer-mode` threshold on. Cards are keyed by
   * their object.
   *
   * @param {T[]} cards
   * @param {boolean} liftable
   * @param {string} listKey
   */
  #renderCards(cards, liftable, listKey) {
    /** @param {T} card @param {number} index */
    const renderCard = (card, index) => this.#renderCard(card, index, cards.length, liftable);
    if (!virtualizes(this.virtualizerMode, cards.length)) {
      return repeat(cards, card => card, renderCard);
    }
    const virtualizer = this.#virtualizerFor(listKey);
    return virtualizer.renderSlice(virtualizer.slice(cards), renderCard);
  }

  /**
   * One element per card, which contains the card's margins, so the
   * virtualizer measures the whole space a card takes. It is the list item:
   * named by `cardLabel`, else by the text of its card.
   *
   * @param {T} card
   * @param {number} index the card's index in its list
   * @param {number} count the number of cards in its list
   * @param {boolean} liftable
   */
  #renderCard(card, index, count, liftable) {
    const label = this.cardLabel?.(card) || undefined;
    const contentId = this.#contentIdOf(card);
    return html`
      <div
        class="column-item"
        role="listitem"
        tabindex="-1"
        aria-posinset=${index + 1}
        aria-setsize=${count}
        aria-label=${ifDefined(label)}
        aria-labelledby=${ifDefined(label === undefined ? contentId : undefined)}
      >
        <owc-card
          id=${contentId}
          class="column-card"
          .data=${card}
          draggable=${liftable}
          small-padding
          style="${this.#renderStyles(card)}"
        >
          ${this.#renderCardImage(card)} ${this.#renderCardHeader(card)}
          ${this.#renderCardBody(card)} ${this.#renderCardFooter(card)}
        </owc-card>
        ${
          // a card that can be moved, on a board that has somewhere else to move it to
          liftable && this.#destinations.length > 1
            ? this.#renderMoveButton(card, label, contentId)
            : nothing
        }
      </div>
    `;
  }

  // The Move to… menu: moves a card with single clicks, or with the keys of a menu.

  /**
   * The Move to… menu that is open, or closing: the card it belongs to, by
   * what identifies it, where the card can go, and whether a key opened it
   * from the card itself. Only this card renders a menu.
   *
   * @type {{ id: unknown, targets: { key: string, label: string, disabled: boolean }[], fromCard: boolean } | undefined}
   */
  #moveMenu;

  /** What the Move to… buttons say, looked up once per render and not once per card. */
  #moveTo = '';

  /**
   * The Move to… button of a card, in the card's corner, and the card's menu
   * while it is open. The button sits next to the card in the list item, so it
   * isn't part of the card's name, and it is named after its card: by
   * `cardLabel`, else by the text of the card.
   *
   * @param {T} card
   * @param {string | undefined} label the card's `cardLabel`
   * @param {string} contentId the id of the element with the card's content
   */
  #renderMoveButton(card, label, contentId) {
    const moveTo = this.#moveTo;
    const buttonId = `${contentId}-move`;
    const menu = this.#moveMenu?.id === this.#idOf(card) ? this.#moveMenu : undefined;
    return html`
      <button
        type="button"
        class="move-button"
        id=${buttonId}
        tabindex="-1"
        aria-haspopup="menu"
        aria-expanded=${menu ? 'true' : 'false'}
        aria-label=${label === undefined ? moveTo : `${moveTo} ${label}`}
        aria-labelledby=${ifDefined(label === undefined ? `${buttonId} ${contentId}` : undefined)}
        @click=${this.#onMoveButtonClick}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" /></svg>
      </button>
      ${menu ? this.#renderMoveMenu(menu.targets) : nothing}
    `;
  }

  /**
   * The menu of the one card whose menu is open. A `wa-dropdown` per card
   * would make a board with many cards several times slower to render, so
   * the menu doesn't own the button: it is rendered open, next to the button,
   * and its trigger is an element that only marks where the button is.
   *
   * @param {{ key: string, label: string, disabled: boolean }[]} targets
   */
  #renderMoveMenu(targets) {
    return html`
      <wa-dropdown
        class="move-menu"
        open
        placement="bottom-end"
        @wa-show=${this.#stopPropagation}
        @wa-after-show=${this.#stopPropagation}
        @wa-hide=${this.#stopPropagation}
        @wa-after-hide=${this.#onMoveMenuAfterHide}
        @wa-select=${this.#onMoveMenuSelect}
      >
        <span slot="trigger" class="move-menu-anchor" aria-hidden="true"></span>
        ${repeat(
          targets,
          target => target.key,
          target =>
            html`<wa-dropdown-item value=${target.key} ?disabled=${target.disabled}
              >${target.label}</wa-dropdown-item
            >`,
        )}
      </wa-dropdown>
    `;
  }

  /**
   * What tells a destination from the others, as the value of a menu item.
   *
   * @param {Destination<T>} destination
   */
  #destinationKey(destination) {
    return `${destination.kind}:${destination.name}`;
  }

  /**
   * The destination that the card of a list item is in.
   *
   * @param {HTMLElement} item
   */
  #destinationOf(item) {
    return this.#destinationOfList(this.#positionOf(item).list);
  }

  /**
   * The menu of a card, while it is rendered.
   *
   * @param {HTMLElement} item
   */
  #moveMenuIn(item) {
    return /** @type {(HTMLElement & { open: boolean }) | null} */ (
      item.querySelector(':scope > .move-menu')
    );
  }

  /**
   * Opens the menu of a card, with an item for every destination except the
   * one the card is in. `canDrop` is asked about columns only, as with
   * dragging, and only now.
   *
   * @param {HTMLElement} item the card's list item
   * @param {{ fromCard: boolean }} options `fromCard`: a key opens it from the card, where closing it returns to
   */
  #showMoveMenu(item, { fromCard }) {
    const card = this.#cardOf(item);
    const from = this.#destinationOf(item);
    if (card === undefined) {
      return;
    }
    this.#moveMenu = {
      id: this.#idOf(card),
      fromCard,
      targets: this.#destinations
        .filter(destination => destination !== from)
        .map(destination => ({
          key: this.#destinationKey(destination),
          label: destination.label,
          disabled: !this.#canDropOn(destination, card),
        })),
    };
    this.requestUpdate();
  }

  /**
   * A click on a Move to… button opens the menu of its card. On the button
   * of an open menu it closes the menu, which a pointer has done by now.
   *
   * @param {Event} event
   */
  #onMoveButtonClick(event) {
    const item = this.#itemOf(/** @type {Element} */ (event.currentTarget));
    if (!item) {
      return;
    }
    const menu = this.#moveMenuIn(item);
    if (menu) {
      menu.open = false;
    } else {
      this.#showMoveMenu(item, { fromCard: false });
    }
  }

  /**
   * Shift+F10 and the context-menu key open the Move to… menu of a card that
   * has one, instead of the browser's menu. The focus moves to the menu's
   * button right away, so the keys that follow are the menu's while it opens.
   *
   * @param {CardKeyPress} press
   */
  #openMoveMenu({ key, item }) {
    const button = /** @type {HTMLElement | null | undefined} */ (
      key === 'Shift+F10' || key === 'ContextMenu'
        ? item?.querySelector(':scope > .move-button')
        : undefined
    );
    if (!item || !button) {
      return false;
    }
    button.focus({ preventScroll: true });
    this.#showMoveMenu(item, { fromCard: true });
    return true;
  }

  /**
   * The events of a Move to… menu bubble and cross shadow roots. Outside they
   * would look like events of the board, so they stop at the menu.
   *
   * @param {Event} event
   */
  #stopPropagation(event) {
    event.stopPropagation();
  }

  /**
   * Takes the focus out of a menu before the menu goes, since the menu can't
   * give it back to its button itself: to the card if a key opened the menu
   * from there, as closing a context menu does, else to the button. A focus
   * that has moved elsewhere stays there.
   *
   * @param {HTMLElement} item the list item of the menu's card
   */
  #takeFocusFromMoveMenu(item) {
    const active = /** @type {ShadowRoot} */ (this.renderRoot).activeElement;
    const button = /** @type {HTMLElement | null} */ (item.querySelector(':scope > .move-button'));
    const inMenu = Boolean(active?.closest('.move-menu'));
    if (this.#moveMenu?.fromCard && (inMenu || active === button)) {
      item.focus({ preventScroll: true });
    } else if (inMenu) {
      button?.focus({ preventScroll: true });
    }
  }

  /**
   * A menu has closed, by Escape, by Tab or by a pointer elsewhere, and isn't
   * rendered anymore. The focus only leaves it now: Tab has moved it on by
   * itself, which it couldn't from the button.
   *
   * @param {Event} event `wa-after-hide` of a Move to… menu
   */
  #onMoveMenuAfterHide(event) {
    this.#stopPropagation(event);
    const item = this.#itemOf(/** @type {Element} */ (event.currentTarget));
    if (!item?.isConnected || !this.#moveMenu) {
      // the menu went with its card, or when one of its items was chosen
      return;
    }
    this.#takeFocusFromMoveMenu(item);
    this.#moveMenu = undefined;
    this.requestUpdate();
  }

  /**
   * An item of a menu was chosen: its card moves to that destination.
   *
   * @param {Event & { detail: { item: { value: string } } }} event `wa-select` of a Move to… menu
   */
  #onMoveMenuSelect(event) {
    this.#stopPropagation(event);
    const item = this.#itemOf(/** @type {Element} */ (event.currentTarget));
    const card = item && this.#cardOf(item);
    const from = item && this.#destinationOf(item);
    const to = this.#destinations.find(
      destination => this.#destinationKey(destination) === event.detail.item.value,
    );
    if (item && card !== undefined && to) {
      void this.#moveFromMenu(item, card, from, to);
    }
  }

  /**
   * Moves a card that its menu was asked to move. The menu goes first, with
   * a render of its own: its state must not follow the card to its new list,
   * and a render between the lift hook and the drop hook would show the card
   * in neither list and lose the focus that is to follow it.
   *
   * @param {HTMLElement} item the card's list item
   * @param {T} card
   * @param {Destination<T> | undefined} from
   * @param {Destination<T>} to
   */
  async #moveFromMenu(item, card, from, to) {
    this.#takeFocusFromMoveMenu(item);
    this.#moveMenu = undefined;
    this.requestUpdate();
    await this.updateComplete;
    await this.#moveCard(card, from, to);
  }

  // Card focus: the board is one Tab stop, and the focus roves over its cards.

  /** The element around the columns and the dropzones, which listens for the cards' keys. */
  get #board() {
    return /** @type {HTMLElement | null} */ (this.renderRoot?.querySelector('.main-container'));
  }

  /**
   * The card the roving focus is on, or was on last: what identifies the card,
   * and where it was, which tells its neighbours once it is gone.
   *
   * @type {(CardPosition & { id: unknown }) | undefined}
   */
  #remembered;

  /**
   * The element with `tabindex="0"`: the board's one Tab stop.
   *
   * @type {HTMLElement | undefined}
   */
  #tabStop;

  /**
   * What identifies a card: `getCardId`, else its object.
   *
   * @param {T} card
   */
  #idOf(card) {
    return this.getCardId ? this.getCardId(card) : card;
  }

  /** The lists the focus roves over: the columns, then the open lists of the dropzones. */
  #lists() {
    return /** @type {(Destination<T> & { listKey: string })[]} */ (
      this.#destinations.filter(destination => destination.listKey && destination.open)
    );
  }

  /**
   * The destination whose list has a key, of the lists the focus roves over.
   *
   * @param {string} listKey
   */
  #destinationOfList(listKey) {
    return this.#lists().find(list => list.listKey === listKey);
  }

  /**
   * The list element of a list, which is rendered whether or not it has cards.
   *
   * @param {string} listKey
   */
  #listElement(listKey) {
    const lists = /** @type {NodeListOf<HTMLElement & { listKey?: string }>} */ (
      this.renderRoot.querySelectorAll('.card-list')
    );
    return [...lists].find(list => list.listKey === listKey);
  }

  /**
   * The list item of a card, if the card is rendered.
   *
   * @param {CardPosition} position
   */
  #itemAt({ list, index }) {
    return /** @type {HTMLElement | undefined} */ (
      this.#listElement(list)?.querySelector(`:scope > [aria-posinset="${index + 1}"]`) ?? undefined
    );
  }

  /**
   * @param {HTMLElement} item
   * @returns {CardPosition}
   */
  #positionOf(item) {
    return {
      list: /** @type {HTMLElement & { listKey: string }} */ (item.parentElement).listKey,
      index: Number(item.getAttribute('aria-posinset')) - 1,
    };
  }

  /**
   * The card of a list item.
   *
   * @param {HTMLElement} item
   */
  #cardOf(item) {
    const position = this.#positionOf(item);
    return this.#destinationOfList(position.list)?.cards[position.index];
  }

  /**
   * The list item of this board that an event comes from, or that an element
   * is in.
   *
   * @param {EventTarget[] | Element} from an event's path, or an element of the board
   */
  #itemOf(from) {
    if (from instanceof Element) {
      return /** @type {HTMLElement | undefined} */ (from.closest(`.${CARD_ITEM}`) ?? undefined);
    }
    return /** @type {HTMLElement | undefined} */ (
      from.find(
        target =>
          target instanceof HTMLElement &&
          target.classList.contains(CARD_ITEM) &&
          target.getRootNode() === this.renderRoot,
      )
    );
  }

  /** The first card of the first list that has cards. */
  #firstPosition() {
    const list = this.#lists().find(candidate => candidate.cards.length > 0);
    return list ? { list: list.listKey, index: 0 } : undefined;
  }

  /**
   * Where the remembered card is now. It is found by what identifies it, in
   * its list first, then in the columns: the focus follows a card to another
   * column, but not into a dropzone. If it is gone, the card that took its
   * place in its list is remembered instead, or the list's last card.
   *
   * @returns {CardPosition | undefined} nothing if no card is remembered, or its list has no cards or doesn't show
   */
  #rememberedPosition() {
    const remembered = this.#remembered;
    if (!remembered) {
      return undefined;
    }
    /** @param {T | undefined} card */
    const isRemembered = card => card !== undefined && this.#idOf(card) === remembered.id;
    const lists = this.#lists();
    const home = lists.find(list => list.listKey === remembered.list);
    if (isRemembered(home?.cards[remembered.index])) {
      return { list: remembered.list, index: remembered.index };
    }
    for (const list of lists) {
      const index =
        list === home || list.kind === 'column' ? list.cards.findIndex(isRemembered) : -1;
      if (index !== -1) {
        this.#remembered = { ...remembered, list: list.listKey, index };
        return { list: list.listKey, index };
      }
    }
    const index = Math.min(remembered.index, (home?.cards.length ?? 0) - 1);
    if (!home || index < 0) {
      this.#remembered = undefined;
      return undefined;
    }
    this.#remembered = { list: home.listKey, index, id: this.#idOf(home.cards[index]) };
    return { list: home.listKey, index };
  }

  /**
   * While the board updates: the card item that had the focus, or a control
   * with the focus, when the update began, and the key of its list.
   *
   * @type {{ item: HTMLElement, list: string } | undefined}
   */
  #focusedBeforeUpdate;

  /**
   * Gives the focus back to the board after a render removed the card that
   * had it: to the remembered card, or to its list while the card isn't
   * rendered or the list has no cards left. Neither scrolls.
   *
   * @param {string} listKey the list the focus was in
   */
  #restoreFocus(listKey) {
    this.#restoringFocus = true;
    try {
      const position = this.#rememberedPosition();
      const item = position && this.#itemAt(position);
      if (item) {
        item.focus({ preventScroll: true });
      } else {
        this.#holdFocusOn(position?.list ?? listKey);
      }
    } finally {
      this.#restoringFocus = false;
    }
  }

  /** Whether the board is giving the focus back right now, and not the user moving it. */
  #restoringFocus = false;

  /**
   * Makes one element the board's Tab stop, or none.
   *
   * @param {HTMLElement | undefined} element a card's list item, or a list element
   */
  #setTabStop(element) {
    const previous = this.#tabStop;
    if (previous !== element) {
      this.#tabStop = element;
      if (previous?.classList.contains(CARD_ITEM) || (previous && previous === this.#focusHolder)) {
        // cards stay focusable for pointers and scripts, a list while it holds the focus
        previous.setAttribute('tabindex', '-1');
      } else {
        previous?.removeAttribute('tabindex');
      }
    }
    if (element && element.getAttribute('tabindex') !== '0') {
      element.setAttribute('tabindex', '0');
    }
  }

  /**
   * Keeps the board one Tab stop after a render or after the focus left it:
   * the card that has the focus or the list that holds it, else the
   * remembered card, else the first card of the first list that has cards. A
   * card that isn't rendered is stood in for by its list, which brings the
   * card in when it gets the focus.
   *
   * @param {{ focusLeft?: boolean }} [options] `focusLeft`: the focus is leaving the board right now
   */
  #updateTabStop({ focusLeft = false } = {}) {
    const active = focusLeft ? null : /** @type {ShadowRoot} */ (this.renderRoot).activeElement;
    const focused = active ? this.#itemOf(active) : undefined;
    if (focused || (active && active === this.#focusHolder)) {
      this.#setTabStop(focused ?? this.#focusHolder);
      return;
    }
    const position = this.#rememberedPosition() ?? this.#firstPosition();
    this.#setTabStop(position && (this.#itemAt(position) ?? this.#listElement(position.list)));
  }

  /**
   * Follows the focus through the board: remembers the card it is on, tracks
   * interaction mode, and moves the focus on from a list that got it as the
   * Tab stop.
   *
   * @param {FocusEvent} event
   */
  #handleBoardFocusin(event) {
    const [target] = event.composedPath();
    const item = this.#itemOf(event.composedPath());
    const card = item && this.#cardOf(item);
    /** @type {string[]} */
    const messages = [];
    if (
      this.#pickedUp &&
      target !== this.#focusHolder &&
      !(target === item && card !== undefined && this.#idOf(card) === this.#pickedUp.id) &&
      this.#putBack()
    ) {
      // the focus left the card that is picked up
      messages.push(this.#localize.term('pinboardMoveCancelled'));
    }
    this.#followFocus(target, item, card, messages);
    this.#announceAll(messages);
  }

  /**
   * Says messages in the live region as one: of several messages in a row,
   * it would only say the last one.
   *
   * @param {string[]} messages
   */
  #announceAll(messages) {
    if (messages.length > 0) {
      this.#liveRegion.announce(messages.join(' '));
    }
  }

  /**
   * The part of `#handleBoardFocusin` that follows the focus to where it is
   * now.
   *
   * @param {EventTarget | undefined} target what got the focus
   * @param {HTMLElement | undefined} item the card it is on or in
   * @param {T | undefined} card
   * @param {string[]} messages what the live region is to say, which this adds to
   */
  #followFocus(target, item, card, messages) {
    if (!item) {
      const list = this.#tabStop;
      if (list && target === list && list !== this.#focusHolder) {
        // A list is the Tab stop while its card isn't rendered. It holds the
        // focus now, and Tab moves on from it to the card; a pointer would
        // scroll away from what it clicked.
        this.#focusHolder = list;
        const position = this.#rememberedPosition() ?? this.#firstPosition();
        if (position && list.matches(':focus-visible')) {
          void this.#focusCard(position);
        }
      }
      return;
    }
    this.#remembered = card && { ...this.#positionOf(item), id: this.#idOf(card) };
    if (!this.#restoringFocus && this.#remembered?.id !== this.#movingWithFocus?.id) {
      // the user went on to another card while the hooks of a move ran
      this.#movingWithFocus = undefined;
    }
    this.#setTabStop(item);
    if (target === item) {
      this.#interactionItem = undefined;
    } else if (this.#interactionItem !== item) {
      // on a control of the card, from Enter, F2 or a pointer
      this.#interactionItem = item;
      messages.push(this.#localize.term('pinboardInteractionHint'));
    }
  }

  /**
   * What a key does that is pressed on a card. They are tried in this order,
   * and the first that returns true has handled the key, which also keeps it
   * from the browser.
   *
   * @type {((press: CardKeyPress) => boolean)[]}
   */
  #cardKeyHandlers = [
    // Space, and every key of a card that is picked up
    press => this.#handlePickUpKey(press),
    // Enter and F2
    press => this.#enterInteractionMode(press),
    // the arrow keys, Home and End
    press => this.#navigate(press),
    // Shift+F10 and the context-menu key
    press => this.#openMoveMenu(press),
  ];

  /**
   * The board's keys. They only count when they are pressed on a card itself,
   * or on a list that holds the focus for a card.
   *
   * @param {KeyboardEvent} event
   */
  #handleBoardKeydown(event) {
    const path = event.composedPath();
    const item = this.#itemOf(path);
    if (event.defaultPrevented) {
      return;
    }
    if (item && path[0] !== item) {
      this.#handleInteractionKey(event, item);
      return;
    }
    if (path[0] !== (item ?? this.#focusHolder)) {
      return;
    }
    const press = { key: keyName(event), event, item };
    if (this.#cardKeyHandlers.some(handle => handle(press))) {
      event.preventDefault();
    }
  }

  /**
   * The card whose controls have the focus in interaction mode.
   *
   * @type {HTMLElement | undefined}
   */
  #interactionItem;

  /**
   * Enter and F2 move the focus to the first control of a card that has
   * controls: interaction mode, which the focus arriving there starts.
   *
   * @param {CardKeyPress} press
   */
  #enterInteractionMode({ key, item }) {
    const [first] = item && (key === 'Enter' || key === 'F2') ? controlsIn(item) : [];
    if (!first) {
      return false;
    }
    focusControl(first);
    return true;
  }

  /**
   * Interaction mode: the controls of a card get every key, except that Tab
   * and Shift+Tab cycle through them and Escape returns to the card.
   *
   * @param {KeyboardEvent} event
   * @param {HTMLElement} item
   */
  #handleInteractionKey(event, item) {
    if (this.#moveMenuIn(item)?.open) {
      // An open menu handles all of its keys itself, in a listener on the
      // document, which runs after this one. That goes for the keys on its
      // button too: Tab closes the menu and moves on.
      return;
    }
    handleInteractionKey(event, item);
  }

  /**
   * The navigation keys: ↑ and ↓ move between the cards of a list, Home and
   * End to its ends, ← and → to the neighbouring list.
   *
   * @param {CardKeyPress} press
   */
  #navigate({ key, item }) {
    if (!NAVIGATION_KEYS.has(key)) {
      return false;
    }
    const from = this.#pendingPosition ?? (item && this.#positionOf(item));
    if (from) {
      void this.#focusCard(this.#move(from, key));
      return true;
    }
    // A list holds the focus: the key brings its card back. Without cards, ←
    // and → move on from the list.
    const holder = /** @type {HTMLElement & { listKey: string }} */ (this.#focusHolder);
    void this.#focusCard(
      this.#rememberedPosition() ?? this.#move({ list: holder.listKey, index: 0 }, key),
    );
    return true;
  }

  /**
   * Where a navigation key moves the focus to, which is `from` itself when
   * the key has nowhere to go. ← and → go to the card at the same index of the
   * next list that has cards, or to that list's last card if it has fewer.
   *
   * @param {CardPosition} from
   * @param {string} key one of `NAVIGATION_KEYS`
   * @returns {CardPosition}
   */
  #move(from, key) {
    const lists = this.#lists().filter(list => list.cards.length > 0 || list.listKey === from.list);
    const at = lists.findIndex(list => list.listKey === from.list);
    const last = (lists[at]?.cards.length ?? 0) - 1;
    if (at === -1 || (last < 0 && key !== 'ArrowLeft' && key !== 'ArrowRight')) {
      return from;
    }
    switch (key) {
      case 'ArrowUp':
        return { ...from, index: Math.max(0, from.index - 1) };
      case 'ArrowDown':
        return { ...from, index: Math.min(last, from.index + 1) };
      case 'Home':
        return { ...from, index: 0 };
      case 'End':
        return { ...from, index: last };
      default: {
        const neighbour = lists[at + (key === 'ArrowRight' ? 1 : -1)];
        return neighbour
          ? { list: neighbour.listKey, index: Math.min(from.index, neighbour.cards.length - 1) }
          : from;
      }
    }
  }

  /**
   * Where a key is moving the focus while its card is brought in, so the next
   * key goes on from there.
   *
   * @type {CardPosition | undefined}
   */
  #pendingPosition;

  /** Counts the moves of the roving focus, so a move knows when a later one replaced it. */
  #focusMove = 0;

  /** Resolves once the last card the board asked a virtualizer for is in view. */
  #scrolledToCard = Promise.resolve();

  /**
   * The list element that holds the focus for a card that isn't rendered.
   *
   * @type {HTMLElement | undefined}
   */
  #focusHolder;

  /**
   * Moves the roving focus to a card: brings it in through the virtualizer of
   * its list if it isn't rendered, scrolls it into view and focuses it.
   *
   * @param {CardPosition} position
   */
  async #focusCard(position) {
    const move = ++this.#focusMove;
    this.#pendingPosition = position;
    const virtualizer = this.#virtualizers.get(position.list);
    if (virtualizer && !this.#itemAt(position)) {
      this.#holdFocusOn(position.list);
      await this.#scrolledToCard;
      if (move !== this.#focusMove) {
        return;
      }
      this.#scrolledToCard = virtualizer.scrollToIndex(position.index, { block: 'nearest' });
      await this.#scrolledToCard;
      if (move !== this.#focusMove) {
        return;
      }
    }
    this.#pendingPosition = undefined;
    const item = this.#itemAt(position);
    if (!item || !this.#hasCardFocus()) {
      // the user moved the focus elsewhere meanwhile
      return;
    }
    item.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    item.focus({ preventScroll: true });
  }

  /** Whether the focus is on a card, in a card, or on a list that holds it for a card. */
  #hasCardFocus() {
    const active = /** @type {ShadowRoot} */ (this.renderRoot).activeElement;
    return active !== null && (active === this.#focusHolder || this.#itemOf(active) !== undefined);
  }

  /**
   * Moves the focus to the element of a list, which is always rendered, while
   * a card of the list isn't: keys have to keep arriving at the board. A list
   * is focusable only while it holds the focus, so a click beside its cards
   * doesn't land on it.
   *
   * @param {string} listKey
   */
  #holdFocusOn(listKey) {
    const list = this.#listElement(listKey);
    if (!list || list === this.#focusHolder) {
      return;
    }
    const previous = this.#focusHolder;
    this.#focusHolder = list;
    if (!list.hasAttribute('tabindex')) {
      list.setAttribute('tabindex', '-1');
    }
    list.focus({ preventScroll: true });
    if (previous && previous !== this.#tabStop) {
      previous.removeAttribute('tabindex');
    }
  }

  /** @param {FocusEvent} event */
  #handleBoardFocusout(event) {
    if (this.#focusedBeforeUpdate) {
      // A render is removing the focused card; `updated` gives the focus back.
      return;
    }
    const board = /** @type {HTMLElement} */ (event.currentTarget);
    const [target] = event.composedPath();
    if (target === this.#focusHolder) {
      this.#focusHolder = undefined;
      if (target !== this.#tabStop) {
        // it held the focus for a card that was brought in
        /** @type {HTMLElement} */ (target).removeAttribute('tabindex');
      }
    }
    if (!(event.relatedTarget instanceof Node && board.contains(event.relatedTarget))) {
      this.#cancelPickUp();
      this.#interactionItem = undefined;
      this.#updateTabStop({ focusLeft: true });
    }
  }

  // Pick-up mode: Space picks the focused card up, ← and → choose where it goes.

  /**
   * What announcements call a card: its `cardLabel`, else the text it shows.
   * A card that isn't rendered is rendered aside for its text.
   *
   * @param {T} data
   */
  #cardName(data) {
    const label = this.cardLabel?.(data);
    if (label) {
      return label;
    }
    let content = this.renderRoot.querySelector(`#${this.#contentIdOf(data)}`);
    if (!content) {
      content = document.createElement('div');
      render(
        html`${this.#renderCardHeader(data)} ${this.#renderCardBody(data)}
        ${this.#renderCardFooter(data)}`,
        /** @type {HTMLElement} */ (content),
      );
    }
    return (content.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * The card that is picked up: what identifies it, and as of the last
   * render its object, where it is, and where it would go if it were dropped
   * now.
   *
   * @type {{ id: unknown, card: T, from: Destination<T>, to: Destination<T> } | undefined}
   */
  #pickedUp;

  /**
   * Whether two destinations, maybe of different renders, are the same column
   * or dropzone.
   *
   * @param {Destination<T>} a
   * @param {Destination<T>} b
   */
  #isSame(a, b) {
    return a.kind === b.kind && a.name === b.name;
  }

  /**
   * Finds the picked-up card in the destinations of a new render, where its
   * object and its list can be other ones. A card that no list shows anymore
   * isn't picked up anymore.
   */
  #refreshPickedUp() {
    const pickedUp = this.#pickedUp;
    if (!pickedUp) {
      return;
    }
    /** @param {T} card */
    const isPickedUp = card => this.#idOf(card) === pickedUp.id;
    const from = this.#lists().find(list => list.cards.some(isPickedUp));
    const card = from?.cards.find(isPickedUp);
    if (!from || card === undefined) {
      this.#cancelPickUp();
      return;
    }
    const to = this.#destinations.find(candidate => this.#isSame(candidate, pickedUp.to)) ?? from;
    this.#pickedUp = { id: pickedUp.id, card, from, to };
  }

  /**
   * The keys of pick-up mode: Space picks the focused card up. While a card
   * is picked up, ← and → step through the destinations, Space and Enter drop
   * it, and Escape and Tab put it back.
   *
   * @param {CardKeyPress} press
   */
  #handlePickUpKey({ key, item, event }) {
    if (event.repeat && (key === 'Space' || (this.#pickedUp && key === 'Enter'))) {
      // a key that is held picks up or drops once
      return true;
    }
    if (!this.#pickedUp) {
      return key === 'Space' && item !== undefined && this.#pickUp(item);
    }
    switch (key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        this.#stepTo(key === 'ArrowRight' ? 1 : -1);
        return true;
      case 'Space':
      case 'Enter':
        this.#drop();
        return true;
      case 'Escape':
        this.#cancelPickUp();
        return true;
      case 'Tab':
      case 'Shift+Tab':
        // the focus moves on
        this.#cancelPickUp();
        return false;
      default:
        // the card stays where the focus is: the other navigation keys do nothing
        return NAVIGATION_KEYS.has(key);
    }
  }

  /** Puts the card that is picked up back, and says so. */
  #cancelPickUp() {
    if (this.#putBack()) {
      this.#liveRegion.announce(this.#localize.term('pinboardMoveCancelled'));
    }
  }

  /**
   * Puts the card that is picked up back, without saying so.
   *
   * @returns {boolean} whether a card was picked up
   */
  #putBack() {
    if (!this.#pickedUp) {
      return false;
    }
    this.#pickedUp = undefined;
    this.requestUpdate();
    return true;
  }

  /**
   * Drops the card that is picked up where it would go now. A column that
   * can't take it says so again, and the card stays picked up.
   */
  #drop() {
    const pickedUp = this.#pickedUp;
    if (!pickedUp) {
      return;
    }
    const { card, from, to } = pickedUp;
    if (this.#isSame(from, to)) {
      // back where it came from: nothing moves, as when a card is dragged onto its own column
      this.#cancelPickUp();
      return;
    }
    if (!this.#canDropOn(to, card)) {
      this.#announceDestination(to, card);
      return;
    }
    this.#pickedUp = undefined;
    this.requestUpdate();
    void this.#moveCard(card, from, to);
  }

  /**
   * Whether a card can be dropped somewhere. `canDrop` is asked about columns
   * only: a dropzone takes every card.
   *
   * @param {Destination<T>} destination
   * @param {T} card
   */
  #canDropOn(destination, card) {
    return destination.kind !== 'column' || this.canDrop(card, destination.name);
  }

  /**
   * Says where a card would go: the name of the destination and the number of
   * cards it keeps, or that the card can't be dropped there.
   *
   * @param {Destination<T>} destination
   * @param {T} card
   */
  #announceDestination(destination, card) {
    this.#liveRegion.announce(
      this.#canDropOn(destination, card)
        ? this.#localize.term(
            'pinboardDestination',
            destination.label,
            destination.listKey ? destination.cards.length : undefined,
          )
        : this.#localize.term('pinboardCannotDrop', destination.label),
    );
  }

  /**
   * Picks a card up, which starts where it is. A card in a list that isn't
   * liftable stays where it is, and the board says so.
   *
   * @param {HTMLElement} item the card's list item
   * @returns {boolean} false if there is no such card
   */
  #pickUp(item) {
    const from = this.#destinationOfList(this.#positionOf(item).list);
    const card = this.#cardOf(item);
    if (!from || card === undefined) {
      return false;
    }
    if (!from.liftable) {
      this.#liveRegion.announce(this.#localize.term('pinboardCannotMove', this.#cardName(card)));
      return true;
    }
    this.#pickedUp = { id: this.#idOf(card), card, from, to: from };
    this.requestUpdate();
    this.#liveRegion.announce(this.#localize.term('pinboardPickedUp', this.#cardName(card)));
    return true;
  }

  /**
   * Moves on to the next or the previous destination, and says which one it
   * is. At either end, it stays where it is.
   *
   * @param {1 | -1} step
   */
  #stepTo(step) {
    const pickedUp = this.#pickedUp;
    if (!pickedUp) {
      return;
    }
    const at = this.#destinations.findIndex(destination => this.#isSame(destination, pickedUp.to));
    const to = this.#destinations[at + step] ?? this.#destinations[at] ?? pickedUp.to;
    this.#pickedUp = { ...pickedUp, to };
    this.requestUpdate();
    this.#announceDestination(to, pickedUp.card);
  }

  /**
   * The classes that show where a picked-up card would go, which are the
   * ones dragging shows: `cannot-drop` on every column that can't take the
   * card, `drop-hover` on where it would go now.
   *
   * @param {Destination<T>} destination
   */
  #dropCues(destination) {
    const pickedUp = this.#pickedUp;
    if (!pickedUp) {
      return '';
    }
    if (!this.#canDropOn(destination, pickedUp.card)) {
      return 'cannot-drop';
    }
    return this.#isSame(destination, pickedUp.to) ? 'drop-hover' : '';
  }

  /**
   * @param {T} data
   * @param {string} column
   * @return {void}
   */
  #defaultOnDrop = (data, column) => {
    const colIndex = this.columns.findIndex(c => c.value === column);
    if (colIndex !== -1) {
      this.data[colIndex] = [...this.data[colIndex], data];
      return;
    }
    const zone = column === 'delete' || column === 'success' ? this.dropZones[column] : undefined;
    if (zone && Array.isArray(zone.data)) {
      zone.data = [...zone.data, data];
    }
  };

  /**
   * @param {T} data
   * @param {string} column
   * @return {void}
   */
  #defaultOnLift = (data, column) => {
    const colIndex = this.columns.findIndex(c => c.value === column);
    if (colIndex !== -1) {
      this.data[colIndex] = this.data[colIndex].filter(elm => elm !== data);
      return;
    }
    const zone = column === 'delete' || column === 'success' ? this.dropZones[column] : undefined;
    if (zone && Array.isArray(zone.data)) {
      zone.data = zone.data.filter((/** @type {T} */ elm) => elm !== data);
    }
  };

  /**
   * @param {((data: T, column: string, defaultAction: (data: T, column: string) => void) => void) | undefined} userFn
   * @param {T} data
   * @param {string} column
   * @param {(data: T, column: string) => void} defaultFn
   * @return {void}
   */
  #runHook(userFn, data, column, defaultFn) {
    return userFn ? userFn(data, column, defaultFn) : defaultFn(data, column);
  }

  /**
   * The hooks of a column or dropzone: the consumer's, which get the default
   * action to call, else the default action.
   *
   * @param {{onDrop?: (data: T, column: string, defaultAction: (data: T, column: string) => void) => void, onLift?: (data: T, column: string, defaultAction: (data: T, column: string) => void) => void}} hooks
   * @return {{onDrop: (data: T, column: string) => void, onLift: (data: T, column: string) => void}}
   */
  #wrapCallbacks(hooks) {
    return {
      onDrop: (data, column) => this.#runHook(hooks.onDrop, data, column, this.#defaultOnDrop),
      onLift: (data, column) => this.#runHook(hooks.onLift, data, column, this.#defaultOnLift),
    };
  }

  /**
   *
   * @param {T} data
   */
  #renderStyles(data) {
    if (!this.fieldMapper.style) {
      return '';
    }
    return this.fieldMapper.style(data);
  }

  /**
   *
   * @param {T} data
   */
  #renderCardImage(data) {
    if (!this.fieldMapper.image?.src || !this.fieldMapper.image?.alt) {
      return nothing;
    }
    return html` <img
      slot="media"
      src=${this.fieldMapper.image.src(data)}
      alt=${this.fieldMapper.image.alt(data)}
    />`;
  }

  /**
   *
   * @param {T} data
   */
  #renderCardHeader(data) {
    if (!this.fieldMapper.header) {
      return nothing;
    }
    return html` <div slot="header">${this.fieldMapper.header(data)}</div>`;
  }

  /**
   *
   * @param {T} data
   */
  #renderCardFooter(data) {
    if (!this.fieldMapper.footer) {
      return nothing;
    }
    return html` <div slot="footer">${this.fieldMapper.footer(data)}</div>`;
  }

  /**
   *
   * @param {T} data
   */
  #renderCardBody(data) {
    return html` <div class="body">${this.fieldMapper.body(data)}</div>`;
  }

  #removeHoverShadow() {
    this.shadowRoot
      ?.querySelectorAll('.drop-hover')
      .forEach(elm => elm.classList.remove('drop-hover'));
  }

  /**
   *
   * @param {T} dragged
   */
  #showNonDropColsDisabled(dragged) {
    const columns = /**@type {(Element & {name: string})[]}*/ (
      Array.from(this.shadowRoot?.querySelectorAll('.column') || [])
    );
    columns?.forEach(column => {
      const destination = this.#destination(column.name);
      if (destination && !this.#canDropOn(destination, dragged)) {
        column.classList.add('cannot-drop');
      }
    });
  }

  #hideNonDropColsDisabled() {
    const columns = this.shadowRoot?.querySelectorAll('.column');
    columns?.forEach(column => {
      column.classList.remove('cannot-drop');
    });
  }

  /**
   *
   * @param {DragEvent} ev
   */
  #onDragStart(ev) {
    if (this.#pickedUp) {
      // One way to move a card at a time. Rendered right away: a later render
      // would take the classes with it that dragging sets on the columns now.
      this.#cancelPickUp();
      this.performUpdate();
    }
    this.dragged = /**@type {HTMLElement}*/ (ev.target);
    this.draggedFrom = ev.currentTarget;
    // @ts-ignore
    this.#showNonDropColsDisabled(this.dragged.data);
    // @ts-ignore
    ev.dataTransfer.effectAllowed = 'move';
  }

  /**
   *
   * @param {DragEvent} ev
   */
  #onDragEnd(ev) {
    ev.preventDefault();
    this.#hideNonDropColsDisabled();
  }

  /**
   *
   * @param {DragEvent} ev
   */
  #onDragMove(ev) {
    if (!ev.dataTransfer) {
      return;
    }
    const typedTarget = /**@type {HTMLElement & { name: string }}*/ (ev.currentTarget);
    const destination = this.#destination(typedTarget.name);
    // @ts-ignore
    if (destination && !this.#canDropOn(destination, this.dragged?.data)) {
      // a column that can't take the card; the open list of a dropzone takes every card
      this.#removeHoverShadow();
      return;
    }
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
    if (this.dragged?.parentElement !== typedTarget) {
      if (
        typedTarget.classList.contains('dropzone') &&
        !typedTarget.classList.contains('drop-hover')
      ) {
        this.#removeHoverShadow();
        typedTarget.classList.add('drop-hover');
      } else if (typedTarget.classList.contains('column')) {
        // typedTarget.appendChild(this.dragged);
        this.#removeHoverShadow();
        typedTarget.classList.add('drop-hover');
      }
    } else {
      this.#removeHoverShadow();
    }
  }

  /**
   *
   * @param {DragEvent} ev
   */
  async #onDragLeave(ev) {
    const composedPath = ev.composedPath();
    if (
      composedPath.indexOf(/**@type {Node}*/ (ev.currentTarget)) <
      composedPath.indexOf(/**@type {Node}*/ (ev.relatedTarget))
    ) {
      // currentTarget is inside of relatedTarget
      this.#removeHoverShadow();
    }
  }

  /**
   *
   * @param {DragEvent} ev
   */
  async #onDrop(ev) {
    ev.preventDefault();
    this.#removeHoverShadow();
    this.#hideNonDropColsDisabled();
    const typedTarget = /**@type {HTMLElement & {name: string}}*/ (ev.currentTarget);
    if (typedTarget !== this.draggedFrom || typedTarget.classList.contains('dropzone')) {
      await this.#moveCard(
        // @ts-ignore
        this.dragged?.data,
        // @ts-ignore
        this.#destination(this.draggedFrom?.name),
        this.#destination(typedTarget.name),
      );
    }
  }

  /**
   * Moves a card. Every move goes through here, whatever started it: the lift
   * hook of where the card comes from runs first, then the drop hook of where
   * it goes, each awaited, and the board renders again. It doesn't ask
   * `canDrop`; whoever starts a move does.
   *
   * Then the board says where the card is now. If the focus was on the card
   * when the move began, and the user didn't move it since, it follows the
   * card to its new column, which scrolls to it. A card that is in no column
   * anymore leaves the focus to the next card of the list it came from, else
   * to the previous one, else to that list.
   *
   * @param {T} card
   * @param {Destination<T> | undefined} from
   * @param {Destination<T> | undefined} to
   */
  async #moveCard(card, from, to) {
    if (!card || !to) {
      // a drop of something that isn't a card of this board
      await from?.onLift(card, from.name);
      await to?.onDrop(card, to.name);
      this.requestUpdate();
      return;
    }
    const id = this.#idOf(card);
    const name = this.#cardName(card);
    const origin =
      this.#hasCardFocus() && this.#remembered?.id === id ? this.#remembered : undefined;
    this.#movingWithFocus = origin;

    await from?.onLift(card, from.name);
    await to.onDrop(card, to.name);
    this.requestUpdate();
    await this.updateComplete;

    const now = this.#destinations.find(destination => this.#isSame(destination, to)) ?? to;
    const index = now.cards.findIndex(candidate => this.#idOf(candidate) === id);
    this.#liveRegion.announce(
      index === -1
        ? this.#localize.term('pinboardMoved', name, now.label)
        : this.#localize.term('pinboardMoved', name, now.label, index + 1, now.cards.length),
    );
    if (!origin || this.#movingWithFocus !== origin) {
      return;
    }
    this.#movingWithFocus = undefined;
    if (this.#hasCardFocus()) {
      // A render in between may have given the focus to a neighbour already.
      this.#remembered = origin;
      const position = this.#rememberedPosition();
      if (position) {
        void this.#focusCard(position);
      } else {
        this.#holdFocusOn(origin.list);
      }
    }
  }

  /**
   * The card that a move takes the focus along with, as it was remembered
   * when the move began. It is forgotten when the user moves the focus to
   * another card meanwhile.
   *
   * @type {(CardPosition & { id: unknown }) | undefined}
   */
  #movingWithFocus;

  static styles = [
    spacerStyles,
    css`
      .main-container {
        display: flex;
        gap: 100px;
        min-height: inherit;
      }

      .column-container {
        display: flex;
        flex-direction: row;
        flex-basis: auto;
        width: max-content;
      }

      .dropzone-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: sticky;
        height: min(100%, 100vh);
        top: 0px;
        gap: max(20%, 10px);
      }

      .dropzone-sub-container {
        display: grid;
        justify-items: center;
      }

      .column {
        --border-style: 1px solid var(--wa-color-surface-border);

        display: flex;
        flex-direction: column;
        border-right: var(--border-style);
        border-bottom: var(--border-style);
        gap: 10px;
        padding-bottom: 10px;
        width: 250px;
        transition: var(--wa-transition-medium);
      }

      .dropzone-details .column {
        padding-top: 10px;
        border-top: var(--border-style);
      }

      .column:first-child {
        border-left: var(--border-style);
        border-start-start-radius: var(--wa-border-radius-m);
        border-end-start-radius: var(--wa-border-radius-m);
      }

      .column:last-child {
        border-start-end-radius: var(--wa-border-radius-m);
        border-end-end-radius: var(--wa-border-radius-m);
      }

      .column-item {
        display: flow-root;
        /* the Move to… button is placed in the corner of the card */
        position: relative;
        /* room for the focus ring of the card, which starts at the top of the item */
        scroll-margin-top: 6px;
      }

      /* below the sticky header: a line of text, its padding and its borders */
      .column-header-cell + .card-list > .column-item {
        scroll-margin-top: calc(1lh + 28px);
      }

      .column-card {
        margin-right: 10px;
        margin-left: 10px;
        width: 230px;
        margin-bottom: 10px;
      }

      /* The item takes the focus and contains the card's margins, so the card shows the ring. */
      .column-item:focus {
        outline: none;
      }

      .column-item:focus-visible > .column-card,
      .dropzone:focus-visible {
        outline: var(--wa-focus-ring, 2px solid Highlight);
        outline-offset: var(--wa-focus-ring-offset, 1px);
      }

      /*
       * The Move to… button, in the top corner at the end of its card. It is
       * only hidden from the eye while it isn't needed: assistive technology
       * finds every card's button all the time.
       */
      .move-button,
      .move-menu-anchor {
        position: absolute;
        /* inside the rounded corner of the card, which has a margin of 10px at its sides */
        top: 6px;
        inset-inline-end: 16px;
        box-sizing: border-box;
        /* 24px to click or tap at the default font size */
        inline-size: 1.5em;
        block-size: 1.5em;
      }

      /* where the button is, for the menu to open at: the menu's trigger, which nothing can hit */
      .move-menu-anchor {
        pointer-events: none;
      }

      .move-button {
        display: grid;
        place-items: center;
        padding: 0;
        border: 1px solid var(--wa-color-surface-border, currentColor);
        border-radius: var(--wa-border-radius-s);
        background: var(--wa-color-surface-default, Canvas);
        color: inherit;
        font: inherit;
        cursor: pointer;
        opacity: 0;
      }

      /* an arrow to the right */
      .move-button svg {
        inline-size: 1em;
        block-size: 1em;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.5;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .column-item:hover .move-button,
      .column-item:focus-within .move-button,
      .move-button[aria-expanded='true'] {
        opacity: 1;
      }

      /* touch screens have no hover that would show it */
      @media (hover: none) {
        .move-button {
          opacity: 1;
        }
      }

      .move-button:focus-visible {
        outline: var(--wa-focus-ring, 2px solid Highlight);
        outline-offset: var(--wa-focus-ring-offset, 1px);
      }

      /* a list holds the focus for a card that isn't rendered, or when it has no cards left */
      .card-list:focus-visible {
        outline: var(--wa-focus-ring, 2px solid Highlight);
        outline-offset: calc(-1 * var(--wa-focus-ring-width, 2px));
      }

      .column-header-cell {
        text-align: center;
        border-bottom: var(--border-style);
        border-top: var(--border-style);
        color: #6b7280;
        background-color: #f9fafb;
        position: sticky;
        top: 0px;
        z-index: 100;
        padding-top: 10px;
        padding-bottom: 10px;
      }

      .dropzone {
        box-sizing: content-box;
        display: block;
        background: none;
        color: inherit;
        font-family: inherit;
        line-height: inherit;
        cursor: pointer;
        font-size: 40px;
        max-width: 1em;
        max-height: 1em;
        padding: 0.8em;
        border-radius: var(--wa-border-radius-l);
        border: thick dashed;
        transition: var(--wa-transition-medium);
        z-index: 300;
      }

      .delete {
        border-color: red;
      }

      .dropzone-icon {
        transition: var(--wa-transition-medium);
        display: flex;
      }

      .delete .dropzone-icon {
        color: red;
      }

      .success {
        border-color: green;
      }

      .success .dropzone-icon {
        color: green;
      }

      .drop-hover {
        transition: var(--wa-transition-medium);
        box-shadow: 0 2px 8px rgb(0 0 0 / 50%);
        z-index: 150;
      }

      .drop-hover .column-header-cell {
        z-index: 200;
      }

      .drop-hover.delete {
        background-color: red;
      }

      .drop-hover .dropzone-icon {
        color: white;
      }

      .drop-hover.success {
        background-color: green;
      }

      .cannot-drop {
        background-color: var(--wa-color-neutral-90);
        color: var(--wa-color-neutral-900);
      }

      /* wa-detail overrides */
      .dropzone-details {
        max-height: 400px;
        animation-duration: 1s;
        overflow: auto;
      }
      .dropzone-details::part(base) {
        border: none;
        padding: 0;
        box-shadow: none;
      }
      .dropzone-details::part(icon) {
        display: none;
      }
      .dropzone-details::part(summary) {
        padding: 0;
        margin: 0;
        display: none;
      }
      /* the dropzone's button opens the list, so the summary is neither shown nor a Tab stop */
      .dropzone-details::part(header) {
        display: none;
      }
      .dropzone-details::part(content) {
        padding: 0;
        margin: 0;
      }

      owc-card::part(body) {
        display: block;
      }
    `,
  ];
}
