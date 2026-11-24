---
'@open-wc/components': patch
---

Add `action-card/OwcActionCard.js` and `action-card/define/owc-action-card.js` for a leading icon, heading/body stack and optional full-width actions. Slots preserve caller-owned heading levels and native link/button behavior; CSS parts and surface properties support application themes.

Consumers of the unreleased flat `OwcActionCard.js` and `define/owc-action-card.js` entry points must update their imports to those grouped paths. The existing wildcard export resolves the runtime files and generated declarations; no flat aliases are retained.
