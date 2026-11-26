import { strict as assert } from 'node:assert';
import { it } from 'node:test';
import { checkRocketPage } from './check-rocket-pages.js';

const page = server => `\`\`\`js server\n${server}\n\`\`\`\n\n# Example\n`;
const atlasImport =
  "import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';";

it('accepts the shared Atlas component binding', () => {
  assert.deepEqual(
    checkRocketPage(
      page(`${atlasImport}\nexport const components = atlasDocComponents;`),
      'page.rocket.md',
    ),
    [],
  );
});

it('accepts an aliased Atlas component import', () => {
  const source = page(
    "import { atlasDocLayout, atlasDocComponents as renderers } from '@rocket/js/layouts/atlasDoc.js';\nexport const components = renderers;",
  );
  assert.deepEqual(checkRocketPage(source, 'page.rocket.md'), []);
});

it('rejects a layout without shared components, even when a comment contains the missing export', () => {
  const source = page(`${atlasImport}\n// export const components = atlasDocComponents;`);
  assert.equal(checkRocketPage(source, 'page.rocket.md').length, 1);
});

it('rejects an unrelated components object', () => {
  assert.equal(
    checkRocketPage(page(`${atlasImport}\nexport const components = {};`), 'page.rocket.md').length,
    1,
  );
});

it('leaves pages using other layouts alone', () => {
  assert.deepEqual(
    checkRocketPage(page("export const layout = () => 'Overview';"), 'page.rocket.md'),
    [],
  );
});
