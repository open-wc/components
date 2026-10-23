/**
 * @typedef {object} Group
 * @property {string} key the value `groupSelector` returns for the group's rows
 * @property {string} label
 * @property {number} [priority] higher priorities come first
 * @property {boolean} [active] whether the group is expanded
 * @property {string} [backgroundColor]
 * @property {string} [textColor]
 */

/**
 * A group's header in the single list of a grouped table: one per group
 * definition, and one for the rows that match no group. The table keeps one
 * header per group, so a header keeps its element and its measured height
 * when the list is laid out again.
 */
export class GroupHeader {
  /** @type {Pick<Group, 'label' | 'active' | 'backgroundColor' | 'textColor'>} */
  #group;

  /**
   * @param {Pick<Group, 'label' | 'active' | 'backgroundColor' | 'textColor'>} group the
   *   group's definition, which `active` reads and changes
   */
  constructor(group) {
    this.#group = group;
  }

  /** The number of rows in the group, including rows being inserted. */
  count = 0;

  /** Whether this is the last group of the table. */
  last = false;

  get label() {
    return this.#group.label;
  }

  get backgroundColor() {
    return this.#group.backgroundColor;
  }

  get textColor() {
    return this.#group.textColor;
  }

  /** Whether the group is expanded, so its rows follow its header in the list. */
  get active() {
    return Boolean(this.#group.active);
  }

  set active(active) {
    this.#group.active = active;
  }

  /** Expands the group if it is collapsed, and collapses it otherwise. */
  toggle() {
    this.active = !this.active;
  }
}

/**
 * The header of the rows that match no group definition. It has no definition
 * of its own, so no colors; its label and whether it is expanded come from
 * callbacks, e.g. the table's language and its `othersGroupActive`.
 */
export class OthersGroupHeader extends GroupHeader {
  /** @type {() => string} */
  #label;

  /** @type {() => boolean} */
  #isActive;

  /** @type {(active: boolean) => void} */
  #setActive;

  /**
   * @param {object} callbacks
   * @param {() => string} callbacks.label the group's label
   * @param {() => boolean} callbacks.isActive whether the group is expanded
   * @param {(active: boolean) => void} callbacks.setActive expands or collapses the group
   */
  constructor({ label, isActive, setActive }) {
    super({ label: '' });
    this.#label = label;
    this.#isActive = isActive;
    this.#setActive = setActive;
  }

  get label() {
    return this.#label();
  }

  get active() {
    return this.#isActive();
  }

  set active(active) {
    this.#setActive(active);
  }
}

/**
 * @template T
 * @typedef {object} GroupedList
 * @property {Array<T | GroupHeader>} items every group's header, each followed by the group's rows while the group is expanded
 * @property {Int32Array} positions the index of each row within its group, by list index (-1 for headers)
 */

/**
 * Lays out the rows of a grouped table as one list. Groups are ordered by
 * priority, highest first, and otherwise keep their order in `groups`. Rows
 * whose key matches no group form a last group of their own, if there are any.
 * Rows keep their order within a group.
 *
 * @template T
 * @param {readonly T[]} rows
 * @param {object} options
 * @param {readonly Group[]} options.groups
 * @param {(row: T) => string} options.groupOf
 * @param {(group: Group) => GroupHeader} options.headerFor the header of a group, the same one for the same group
 * @param {GroupHeader} options.others the header of the rows that match no group
 * @returns {GroupedList<T>}
 */
export function groupedList(rows, { groups, groupOf, headerFor, others }) {
  const keys = new Set(groups.map(group => group.key));
  /** @type {Map<string, T[]>} */
  const rowsByKey = new Map();
  /** @type {T[]} */
  const otherRows = [];
  for (const row of rows) {
    const key = groupOf(row);
    if (!keys.has(key)) {
      otherRows.push(row);
      continue;
    }
    const groupRows = rowsByKey.get(key);
    if (groupRows) {
      groupRows.push(row);
    } else {
      rowsByKey.set(key, [row]);
    }
  }

  /** @type {{ header: GroupHeader, rows: T[] }[]} */
  const sections = [...groups]
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .map(group => ({ header: headerFor(group), rows: rowsByKey.get(group.key) ?? [] }));
  if (otherRows.length > 0) {
    sections.push({ header: others, rows: otherRows });
  }

  let length = 0;
  for (const section of sections) {
    length += 1 + (section.header.active ? section.rows.length : 0);
  }
  /** @type {Array<T | GroupHeader>} */
  const items = new Array(length);
  const positions = new Int32Array(length);
  let index = 0;
  sections.forEach((section, sectionIndex) => {
    section.header.count = section.rows.length;
    section.header.last = sectionIndex === sections.length - 1;
    items[index] = section.header;
    positions[index++] = -1;
    if (section.header.active) {
      section.rows.forEach((row, position) => {
        items[index] = row;
        positions[index++] = position;
      });
    }
  });
  return { items, positions };
}
