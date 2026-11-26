import { playwrightLauncher } from '@web/test-runner-playwright';

// npx web-test-runner --config src/doughnut-chart/motion.test-browser.config.js
export default {
  files: ['src/doughnut-chart/OwcDoughnutChart.motion.test-browser.js'],
  nodeResolve: { browser: true },
  concurrency: 1,
  browsers: [
    playwrightLauncher({
      product: 'chromium',
      createBrowserContext: ({ browser }) => browser.newContext({ reducedMotion: 'reduce' }),
    }),
  ],
};
