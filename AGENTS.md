## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/<feature-slug>/`; external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Domain docs use a single-context layout: root `CONTEXT.md` plus `docs/adr/`. See `docs/agents/domain.md`.

### Commit messages

Commit messages should start with `feat:`, `fix:`, or `chore:`. If a commit targets a specific feature or area, include it in parentheses before the colon, for example `feat(table):`, `fix(json-form):`, or `chore(docs):`.
If a commit targets a specific issue, reference that issue in the commit message.
