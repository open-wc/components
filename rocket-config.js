import { readFileSync } from 'node:fs';

const logoMark = readFileSync(
  new URL('./public/open-wc-components-mark.svg', import.meta.url),
  'utf8',
).replace('<svg ', '<svg class="mark" ');

/**
 * @param {string} value
 */
function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/**
 * The image link previews show when a page is shared (1200×630).
 *
 * @type {import('@rocket/js/types.js').SocialPreviewTemplate}
 */
function socialPreviewTemplate({ site, page }) {
  const url = page.canonicalUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `<!doctype html>
<html lang="${escapeHtml(site.language)}">
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; }
      html, body { width: 1200px; height: 630px; margin: 0; }
      body {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 72px 80px 64px;
        color: #0b1220;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background:
          radial-gradient(circle at 92% 8%, rgba(155, 0, 255, 0.2), transparent 42%),
          radial-gradient(circle at 70% 105%, rgba(0, 119, 255, 0.2), transparent 46%),
          #ffffff;
      }
      header { display: flex; align-items: center; gap: 22px; }
      .mark { width: 84px; height: 84px; }
      .name { font-size: 38px; letter-spacing: -0.01em; }
      .name span { color: #64748b; font-weight: 500; }
      .name b { font-weight: 800; }
      h1 {
        max-width: 980px;
        margin: 0;
        font-size: 82px;
        font-weight: 800;
        line-height: 1.04;
        letter-spacing: -0.03em;
      }
      h1.long { font-size: 64px; }
      .description {
        display: -webkit-box;
        max-width: 960px;
        margin: 26px 0 0;
        overflow: hidden;
        color: #475569;
        font-size: 32px;
        line-height: 1.32;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }
      footer { display: flex; align-items: center; gap: 18px; color: #64748b; font-size: 26px; }
      footer i {
        width: 64px;
        height: 8px;
        border-radius: 4px;
        background: linear-gradient(90deg, #9b00ff, #0077ff);
      }
    </style>
  </head>
  <body>
    <header>
      ${logoMark}
      <div class="name"><span>@open-wc/</span><b>components</b></div>
    </header>
    <main>
      <h1 class="${page.title.length > 28 ? 'long' : ''}">${escapeHtml(page.title)}</h1>
      <p class="description">${escapeHtml(page.description)}</p>
    </main>
    <footer><i></i>${escapeHtml(url)}</footer>
  </body>
</html>`;
}

/** @type {import('@rocket/js/types.js').RocketConfig} */
export default {
  includeGlobs: ['*.rocket.{md,js}', 'src/**/*.rocket.{md,js}', 'docs/**/*.rocket.{md,js}'],
  siteHeadMetadata: {
    language: 'en-US',
    siteName: '@open-wc/components',
    defaultDescription:
      'Web components for data-heavy interfaces: tables, forms, and workflow UI as framework-agnostic Lit components.',
    icons: {
      svg: '/open-wc-components-mark.svg',
    },
    themeColor: '#4f3bf6',
    socialPreview: {
      delivery: 'static',
      template: socialPreviewTemplate,
    },
  },
  siteOrigin: 'https://components.open-wc.org/',
};
