/**
 * The name of a pressed key with its modifiers, like `Control+Home` or
 * `Shift+Tab`, for widgets that look their keys up by name. The Command key
 * counts as Control, and the space bar is `Space`.
 *
 * @param {Pick<KeyboardEvent, 'key'> & Partial<Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>>} event
 */
export function keyName(event) {
  const name = event.key === ' ' ? 'Space' : event.key;
  return `${event.ctrlKey || event.metaKey ? 'Control+' : ''}${event.altKey ? 'Alt+' : ''}${
    event.shiftKey ? 'Shift+' : ''
  }${name}`;
}
