---
'@open-wc/components': patch
---

Give DetailCard a public focus method, configurable heading level, static summaries
when details are absent, and `card-toggle` notifications forwarded from Web Awesome.
Retain hidden panel content and return focus to the summary on collapse.
Keep Web Awesome's `wa-details` for keyboard activation, disclosure semantics and
expansion animation; isolate nested disclosures and panel actions. Delegate `show()`
to Web Awesome for navigation, and respect reduced motion. The application owns focus
recovery after content removal or static/expandable mode changes. Notifications follow
Web Awesome's update timing; rapid property assignments may coalesce. Existing slots,
styling parts and `open` assignments remain supported. Consumers using private
shadow roots should use `focus()`, `show()`, `open` and `card-toggle` instead.
