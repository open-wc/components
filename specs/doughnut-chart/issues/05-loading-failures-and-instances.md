# 05: Keep loading, failures and multiple instances independent

**What to build:** Several charts can initialize, update and disconnect safely. A chart that cannot
render disappears completely without breaking another working chart or leaving stale controls.

**Blocked by:** 01 — Deliver a working public doughnut chart.

**Status:** resolved

Source: [Doughnut chart spec](../spec.md), especially Native-first loading, Rendering failure,
Independent instances, and the loader and failure testing decisions.

- [x] Concurrent charts coordinate automatic polyfill initialization. Disconnecting one chart does
      not uninstall or otherwise invalidate shared support needed by another chart.
- [x] Exercise missing native support with refused polyfill support, rejected loading and drawing
      failure. Failures produce no unhandled errors and hide all output from the failed chart.
- [x] Failed output leaves no ring, standalone total, category list, message, chart-sized placeholder,
      stale accessible content or invisible focusable controls. Keep failure distinct from valid
      empty and known-zero data states.
- [x] One instance's drawing failure does not suppress another instance that can render. Disconnects
      and asynchronous initialization completion do not restore output or controls to a removed chart.
- [x] Two mounted working charts keep highlight state, control IDs and category activation independent,
      including when their datasets reuse category IDs or labels.
- [x] Hiding or recovering a chart does not pull focus back from elsewhere. Recovery into surrounding
      page content remains the host's responsibility.
- [x] Add public-consumer lifecycle and failure checks using the existing browser seam, without a new
      test service or private testing API. Document automatic loading, failure behavior and instance
      ownership; consumer bundle download verification is completed in ticket 07.

## Answer

Implemented in `f93a7f3`. Shared loading remains installed across disconnects; per-instance initialization generations prevent stale completion from wiring removed charts. Two lifecycle tests verify reused IDs, isolated drawing failures, removal/reconnection and outside focus. The browser loader configuration passed delayed automatic polyfill loading (one core request), refused support and rejected network loading without unhandled errors. All failed output and layout disappear; consumer recovery remains explicit.
