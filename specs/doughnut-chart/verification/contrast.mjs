const report = value => process.stdout.write(`${JSON.stringify(value)}\n`);
import assert from 'node:assert/strict';
import { chromium } from '/home/benedikt/project/components/node_modules/playwright/index.mjs';
function contrast(a, b) {
  const luminance = rgb => rgb.map(c => c / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return Number(((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2));
}
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
for (const colorScheme of ['light', 'dark']) {
  await page.emulateMedia({ colorScheme });
  await page.goto('http://127.0.0.1:8097/');
  const chart = page.locator('owc-doughnut-chart').first();
  await chart.waitFor({ state: 'visible' });
  await chart.evaluate(async element => {
    element.categories = element.categories.map(category => ({ ...category, icon: '/icon.svg' }));
    await element.updateComplete;
  });
  await page.waitForTimeout(250);
  const sample = () => chart.evaluate(element => {
    const canvas = element.shadowRoot.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth;
    const ratio = canvas.width / width;
    const pixel = (angle, radius) => [...ctx.getImageData(Math.round((width / 2 + radius * Math.sin(angle)) * ratio), Math.round((160 - radius * Math.cos(angle)) * ratio), 1, 1).data];
    return { text: getComputedStyle(element).color, background: getComputedStyle(document.body).backgroundColor,
      fills: [pixel(0.4, 126), pixel(3, 126), pixel(5.7, 126)], icon: pixel(Math.PI / 4, 126) };
  });
  const normal = await sample();
  await chart.locator('button').first().focus();
  await page.waitForTimeout(150);
  const focus = await sample();
  const white = [255, 255, 255];
  report({ colorScheme, normal, focus,
    textOnWhite: contrast([75, 76, 79], white),
    iconsOnFills: normal.fills.map(fill => contrast(white, fill.slice(0, 3))),
    boundariesOnWhite: normal.fills.map(fill => contrast(white, fill.slice(0, 3))),
    adjacentFills: [contrast(normal.fills[0].slice(0, 3), normal.fills[1].slice(0, 3)), contrast(normal.fills[1].slice(0, 3), normal.fills[2].slice(0, 3)), contrast(normal.fills[2].slice(0, 3), normal.fills[0].slice(0, 3))],
    focusedVsRest: contrast(normal.fills[0].slice(0, 3), focus.fills[0].slice(0, 3)) });
  assert.equal(normal.background, 'rgb(255, 255, 255)');
}
await browser.close();
