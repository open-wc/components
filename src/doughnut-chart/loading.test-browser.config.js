import { playwrightLauncher } from '@web/test-runner-playwright';

const mode = process.env.CHART_SUPPORT ?? 'polyfill';

export default {
  files: ['src/doughnut-chart/OwcDoughnutChart.support.test-browser.js'],
  nodeResolve: { browser: true },
  concurrency: 1,
  browserStartTimeout: 120000,
  browsers: [
    playwrightLauncher({
      product: 'chromium',
      launchOptions: { args: ['--disable-blink-features=CanvasDrawElement'] },
      createPage: async ({ context }) => {
        const page = await context.newPage();
        await page.addInitScript(scenario => {
          Object.defineProperty(globalThis, 'chartSupportScenario', { value: scenario });
          if (scenario === 'refused') {
            Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 Firefox/100.0' });
          }
        }, mode);
        if (mode === 'rejected') {
          await page.route('**/html-in-canvas-polyfill/dist/esm/loader.js*', route =>
            route.abort(),
          );
        } else if (mode === 'polyfill') {
          await page.route('**/html-in-canvas-polyfill/dist/esm/loader.js*', async route => {
            await new Promise(resolve => setTimeout(resolve, 100));
            await route.continue();
          });
        }
        return page;
      },
    }),
  ],
};
