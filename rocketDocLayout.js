/**
 * A custom layout engine to manage layouts easier
 */

import { atlasDocLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';

import { docsData } from '@open-wc/components/docsData.js';

function sortParents(menu) {
  const sorted = structuredClone(menu);

  sorted.children.sort((a, b) => {
    if (a.title === 'Internal components') {
      return 1;
    }
    if (b.title === 'Internal components') {
      return -1;
    }
    return (a.order ?? 0) - (b.order ?? 0);
  });

  return sorted;
}

export const components = atlasDocComponents;

export function layout(pageData) {
  console.log(Object.keys(pageData));

  // console.log(pageData.menu);
  // console.log(pageData.pageTree);

  return atlasDocLayout(pageData, docsData);
}
