export default {
  // browser: true is needed so packages with a browser entry (e.g. nanoid used
  // by webawesome) don't resolve to their node:* based entry points
  nodeResolve: { browser: true },
  files: ['src/**/*.test-browser.js'],
};
