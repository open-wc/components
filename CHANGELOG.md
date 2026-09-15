# Changelog

## 0.1.6

### Patch Changes

- 5d2601d: Keep the autocomplete popover width stable while searching by measuring the full option list.

All notable changes to this project will be documented in this file.

## 0.1.5

- Use inherited Web Awesome spacing, border, radius, and badge font-size tokens in detail cards while preserving explicit `--owc-detail-card-*` overrides.

- Make the detail-card accent rail optional and preserve the bottom border of open cards without body content. To retain the previous default rail, set `accent-color="var(--wa-color-brand-fill-loud)"`.

## 0.1.4

- Render synchronous table row details immediately while retaining the loading state for asynchronous details.
- Measure formatted table cells after virtualized rows become available instead of retaining header-only column widths.
- Restore table header alignment and support the `--owc-table-header-align` compatibility token.

## 0.1.3

Table operator type improvements

## 0.1.2

Json Form Type Fixes

## 0.1.1

Fixing type exports

## 0.1.0

Initial release
