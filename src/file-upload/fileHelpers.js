/**
 * Two files count as the same upload when name, size, and type all match -
 * the File objects themselves are different instances after every selection.
 *
 * @param {File} file1
 * @param {File} file2
 * @returns {boolean}
 */
export function fileIsEqual(file1, file2) {
  return file1.size === file2.size && file1.name === file2.name && file1.type === file2.type;
}

/**
 * Adds incoming files to the existing list. In multiple mode duplicates
 * (also within the incoming batch) are skipped; in single mode the first
 * incoming file replaces the list. Returns the new list plus the files that
 * were actually added - the input arrays are not mutated.
 *
 * @param {File[]} existing
 * @param {File[]} incoming
 * @param {boolean} multiple
 * @returns {{ files: File[], added: File[] }}
 */
export function addFiles(existing, incoming, multiple) {
  if (!multiple) {
    const files = incoming.slice(0, 1);
    return { files, added: files };
  }
  const files = [...existing];
  const added = [];
  for (const file of incoming) {
    if (files.every(other => !fileIsEqual(file, other))) {
      files.push(file);
      added.push(file);
    }
  }
  return { files, added };
}
