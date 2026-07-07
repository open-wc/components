export default {
  // browser: true is needed so packages with a browser entry (e.g. nanoid used
  // by webawesome) don't resolve to their node:* based entry points
  nodeResolve: { browser: true },
  files: ['src/**/*.test-browser.js'],
  // Background tabs get render-throttled, which starves ResizeObserver/rAF
  // driven code (virtualizer, animations) and makes those tests flaky at
  // higher parallelism.
  concurrency: 1,
};
