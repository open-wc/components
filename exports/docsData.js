const headerData = {
  logo: ['/open-wc-components-logo.svg'],
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
      { text: 'Table', href: '/table' },
      { text: 'Json Form', href: '/json-form' },
      { text: 'Layout Sidebar', href: '/layout-sidebar' },
    ],
  },
  {
    title: 'Project',
    links: [
      { text: 'GitHub', href: 'https://github.com/open-wc/components' },
      { text: 'npm', href: 'https://www.npmjs.com/package/@open-wc/components' },
      { text: 'Changelog', href: 'https://github.com/open-wc/components/blob/main/CHANGELOG.md' },
    ],
  },
];

export const docsData = {
  headerData,
  footerData,
  stylesheets: [],
  navigationIconServerBudget: 60,
};

/** @type {import('@rocket/js/types.js').HeroData} */
export const heroData = {
  headerData,
  footerData,
  heroMainData: {
    eyebrow: '@open-wc/components',
    title: 'Web components for data-heavy interfaces. Tables, forms, and workflow UI as plain ESM.',
    body: 'Framework-agnostic Lit components with typed APIs and copy-paste demos. Import only what you use — unbundled modules, no build step required.',
    setupLink: '/components',
    setupText: 'Browse components',
    documentationLink: '/table',
    documentationText: 'See the Table',
    installLabel: 'Install',
    installCommand: 'npm install @open-wc/components',
    logoNoText: '/open-wc-components-logo.svg',
    badges: [
      { text: 'MIT licensed', icon: '' },
      { text: '30+ components', icon: '' },
      { text: 'Unbundled ESM', icon: '' },
      {
        text: 'GitHub',
        icon: 'github',
        href: 'https://github.com/open-wc/components',
      },
    ],
  },
  quickStartData: {
    title: 'Quick start',
    subtitle: 'From install to rendered table',
    command: ['npm install @open-wc/components'],
    description:
      'Register an element through its define entry point, then use the tag in any template. Every component page has a copyable demo.',
  },
  workflowData: {
    title: 'How it works',
    steps: [
      {
        icon: 'box-seam',
        tone: 'red',
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
        tone: 'blue',
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
  featuresData: [
    {
      icon: '📊',
      title: 'Data views built in',
      description:
        'Tables with filtering, sorting, selection, and mass edit — plus charts, detail views, and card lists for everything around them.',
    },
    {
      icon: '📝',
      title: 'Schema-driven forms',
      description:
        'Render complete forms from a JSON Schema with Json Form, or compose inputs like autocomplete, sliders, and click-to-edit fields.',
    },
    {
      icon: '⚡',
      title: 'No build step',
      description:
        'Ships as unbundled ES modules that run directly in modern browsers and any bundler — no framework lock-in.',
    },
    {
      icon: '🔡',
      title: 'Typed APIs',
      description:
        'TypeScript definitions for every public entry point, so editors autocomplete columns, options, and events.',
    },
  ],
};
