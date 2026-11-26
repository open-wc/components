const report = value => process.stdout.write(`${JSON.stringify(value)}\n`);
import assert from 'node:assert/strict';
import { chromium, firefox } from '/home/benedikt/project/components/node_modules/playwright/index.mjs';

for (const mode of ['native', 'polyfill', 'firefox', 'chrome']) {
  const browser = await (mode === 'firefox' ? firefox : chromium).launch(mode === 'firefox'
    ? { executablePath: '/tmp/doughnut-browsers/firefox-1572/firefox/firefox' }
    : { executablePath: mode === 'chrome' ? '/tmp/doughnut-chrome/opt/google/chrome/chrome' : undefined, args: mode === 'polyfill' ? ['--disable-blink-features=CanvasDrawElement'] : [] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.goto('http://127.0.0.1:8097/');
  await page.waitForFunction(() => [...document.querySelector('chart-consumer').shadowRoot.querySelectorAll('owc-doughnut-chart')].every(chart => chart.getBoundingClientRect().height > 100));
  await page.evaluate(() => document.fonts.ready);
  const result = await page.evaluate(async () => {
    const host = document.querySelector('chart-consumer');
    const chart = host.shadowRoot.querySelector('owc-doughnut-chart');
    chart.categories = chart.categories.map(category => ({ ...category, icon: '/icon.svg' }));
    await chart.updateComplete;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const canvas = chart.shadowRoot.querySelector('canvas');
    return { instance: chart instanceof globalThis.installedChartClass, center: chart.querySelector('strong').textContent,
      color: getComputedStyle(chart).color, font: getComputedStyle(chart).fontFamily,
      fontLoaded: document.fonts.check('16px Outfit'), imageCount: chart.shadowRoot.querySelectorAll('img').length,
      bitmap: [canvas.width, canvas.height], css: [canvas.clientWidth, canvas.clientHeight],
      overflow: document.documentElement.scrollWidth > innerWidth };
  });
  assert.equal(result.instance, true);
  assert.equal(result.center, '100 items');
  assert.equal(result.color, 'rgb(75, 76, 79)');
  assert.match(result.font, /Outfit/);
  assert.equal(result.fontLoaded, true);
  assert.equal(result.imageCount, 3);
  assert.equal(result.bitmap[0], result.css[0] * 2);
  assert.equal(result.bitmap[1], result.css[1] * 2);
  assert.equal(result.overflow, false);
  await page.locator('owc-doughnut-chart').first().locator('button[data-category-id="books"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('chart-consumer').shadowRoot.querySelector('[role="status"]').textContent === 'Activated: books');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (mode === 'native') {
      await page.screenshot({ path: `/home/benedikt/project/components/specs/doughnut-chart/evidence/consumer-${width}.png`, fullPage: true });
    }
  }
  const core = requests.filter(url => url.includes('loader-core-'));
  assert.equal(core.length, mode === 'native' || mode === 'chrome' ? 0 : 1);
  assert.deepEqual(errors, []);
  report({ mode, browser: browser.version(), ...result, coreDownloads: core.length, errors });
  await browser.close();
}

await import('./verify-docs.mjs');
