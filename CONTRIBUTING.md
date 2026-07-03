# Contributing

## Local Setup

Install dependencies:

```sh
npm install
```

Start the documentation site while working on demos or reference pages:

```sh
npm start
```

Run the demo server when working directly with component examples:

```sh
npm run start:demo
```

## Validation

Run focused tests while changing behavior:

```sh
node --test path/to/test.js
```

Run the main validation commands before submitting changes:

```sh
npm run lint
npm run test
npm run types
npm run build
```

Use `npm run format` to apply the configured ESLint and Prettier fixes.

## Commit Messages

Commit messages must start with `feat:`, `fix:`, or `chore:`.

When a commit targets a specific feature or area, include an optional scope before the colon:

```text
feat(table): add column pinning
fix(json-form): preserve empty array values
chore(docs): update release checklist
```

When a commit targets a specific issue, reference that issue in the commit message.
