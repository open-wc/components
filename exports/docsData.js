import { html } from 'lit';

const headerData = {
  logo: ['/open-wc-components-mark.svg', '/open-wc-components-wordmark.svg'],
  homeLink: '/',
  navLinks: [{ text: 'Components', href: '/components' }],
  socials: [
    {
      url: 'https://github.com/open-wc/components',
      name: 'github',
      label: 'GitHub',
    },
  ],
};

const footerData = [
  {
    title: 'Documentation',
    links: [
      { text: 'All components', href: '/components' },
      { text: 'Table', href: '/data/table' },
      { text: 'Json Form', href: '/forms/json-form' },
      { text: 'Layout Sidebar', href: '/layout/layout-sidebar' },
    ],
  },
  {
    title: 'Project',
    links: [
      { text: 'GitHub', href: 'https://github.com/open-wc/components' },
      {
        text: 'npm',
        href: 'https://www.npmjs.com/package/@open-wc/components',
      },
      {
        text: 'Changelog',
        href: 'https://github.com/open-wc/components/blob/main/CHANGELOG.md',
      },
    ],
  },
];

const stylesheets = ['/open-wc-theme.css'];

export const docsData = {
  headerData,
  footerData,
  stylesheets,
  navigationIconServerBudget: 60,
  headContent: () => html`
    <script type="module">
      import { registerIconLibrary } from '@awesome.me/webawesome/dist/webawesome.js';
      registerIconLibrary('default', {
        resolver: (name, family) => {
          if (name === 'arrow-up-right-from-square') {
            return 'https://ka-f.fontawesome.com/releases/v7.3.0/svgs/solid/arrow-up-right-from-square.svg';
          }
          if (name === 'bars') {
            return 'https://ka-f.fontawesome.com/releases/v7.3.0/svgs/solid/bars.svg';
          }
          const suffix = family === 'filled' ? '-fill' : '';
          return (
            'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons/' + name + suffix + '.svg'
          );
        },
      });
    </script>
  `,
};

/** @type {import('@rocket/js/types.js').HeroData} */
export const heroData = {
  headerData,
  footerData,
  stylesheets,
  heroMainData: {
    eyebrow: 'Open Web Components',
    title: 'Web components for data-heavy interfaces',
    body: 'Tables, forms, and workflow UI as framework-agnostic Lit components — with typed APIs and copy-paste demos. Shipped as unbundled ESM, so you import only what you use and need no build step.',
    setupLink: '/components',
    setupText: 'Browse components',
    documentationLink: '/data/table',
    documentationText: 'See the Table',
    installLabel: 'Install',
    installCommand: 'npm install @open-wc/components',
    logoNoText: '/home-hero-art.svg',
    badges: [
      { text: 'MIT licensed', icon: '' },
      { text: '25+ components', icon: '' },
      { text: 'Unbundled ESM', icon: '' },
      {
        text: 'GitHub',
        icon: 'github',
        href: 'https://github.com/open-wc/components',
      },
    ],
  },
  workflowData: {
    title: 'How it works',
    steps: [
      {
        icon: 'box-seam',
        tone: 'blue',
        title: 'Install one package',
        description: 'Unbundled ESM — applications import only the modules they use.',
      },
      {
        icon: 'plug',
        tone: 'amber',
        title: 'Register the element',
        description: 'A side-effect import from define/ registers the custom element tag.',
      },
      {
        icon: 'braces',
        tone: 'red',
        title: 'Pass data as properties',
        description: 'Typed .columns, .data, and schema properties drive the rendering.',
      },
      {
        icon: 'palette',
        tone: 'green',
        title: 'Theme with CSS',
        description: 'Style through CSS custom properties — no preprocessor required.',
      },
    ],
  },
};
