/**
 * TanStack virtual-core 3.17.7 leaves development guards expressed as
 * `process.env.NODE_ENV` in its published ESM. Package consumers can load our
 * components directly in browsers, where Node's `process` global does not
 * exist. Define only the production flag before importing the adapter so those
 * guards remain inert without requiring a bundler-provided replacement.
 */
if (!globalThis.process) {
  globalThis.process = /** @type {typeof process} */ (
    /** @type {unknown} */ ({ env: { NODE_ENV: 'production' } })
  );
}
