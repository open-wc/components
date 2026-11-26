const report = value => process.stdout.write(`${JSON.stringify(value)}\n`);
import assert from 'node:assert/strict';
import { chromium } from '/home/benedikt/project/components/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.route('http://127.0.0.1:8097/assets/**', route => route.continue({ url: route.request().url().replace('/assets/', '/docs/assets/') }));
await page.route('http://127.0.0.1:8097/_rocket/**', route => route.continue({ url: route.request().url().replace('/_rocket/', '/docs/_rocket/') }));
for (const path of ['/docs/data/doughnut-chart/', '/docs/data/doughnut-chart/_demo/sliceIcons/', '/docs/data/doughnut-chart/_demo/animatedAngles/']) {
  const errors = [];
  const listener = error => errors.push(error.message);
  page.on('pageerror', listener);
  await page.goto(`http://127.0.0.1:8097${path}`);
  await page.locator('owc-doughnut-chart').first().waitFor({ state: 'visible', timeout: 20000 });
  assert.deepEqual(errors, []);
  page.off('pageerror', listener);
  report({ rocket: path, charts: await page.locator('owc-doughnut-chart').count(), errors });
}
await browser.close();
