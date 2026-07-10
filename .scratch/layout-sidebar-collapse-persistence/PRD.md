Status: ready-for-agent

# Collapsible Persistent Layout Sidebar

## Problem Statement

As an application user, I need to reduce the layout sidebar to a narrow rail when I need more room for page content, while retaining quick access to navigation. The current layout sidebar always occupies at least its full navigation width and has no way to remember a user's preferred layout after a page reload.

As a package consumer, I need this behavior to be an intentional part of the component's Public Surface: it must be controllable by applications, observable through stable events, accessible in both visual states, and documented with examples. Existing menus, URL-based selection, resizable expanded width, and page content placement must continue to work.

## Solution

Extend the layout sidebar with an expanded state and a collapsed 56px icon rail. A persistent user preference stores whether the sidebar is collapsed and the user's preferred expanded width. A collapsed rail preserves direct navigation through icons, opens the full sidebar when a menu group is activated, and provides an always-available expand control.

The component exposes its collapsed state, a consumer-defined persistence scope, an optional compact logo, lifecycle events for both state directions, and a reset method. The implementation remains a Consumer-Visible Change within the existing Public Surface: public types, docs, demos, changelog, and behavior tests ship together.

## User Stories

1. As an application user, I want to collapse the sidebar into a narrow rail, so that page content has more horizontal space.
2. As an application user, I want an always-visible control to expand the rail again, so that I am never stranded without navigation.
3. As an application user, I want normal menu icons in the rail to navigate directly, so that compact navigation remains fast.
4. As an application user, I want activating a menu-group icon in the rail to expand the sidebar and open that group, so that I can reach nested navigation predictably.
5. As an application user, I want my collapsed or expanded preference restored after a reload, so that the layout matches how I last used it.
6. As an application user, I want my expanded sidebar width restored after reopening or reloading, so that my resizing preference is not lost.
7. As an application user, I want a temporary narrow viewport not to erase my preferred expanded width, so that it returns when space is available.
8. As an application user, I want the rail to remain a fixed, usable width, so that icons retain reliable pointer and keyboard targets.
9. As an application user, I want the expanded divider not to be resizable while collapsed, so that the compact layout stays stable.
10. As an application user, I want the item selected by the current URL to remain meaningful while the rail is collapsed, so that I can orient myself.
11. As an application user, I want a selected nested item to make its parent group recognizable in the rail, so that the active navigation area is visible.
12. As an application user, I want URL-based submenu opening not to override my saved collapsed preference, so that my layout choice wins.
13. As an application user, I want icon-less menu items to remain usable in the rail, so that existing menus do not become inaccessible.
14. As an application user, I want every rail control to expose its full purpose on hover, focus, and to assistive technology, so that icon-only navigation is understandable.
15. As an application user, I want a compact logo in the rail when my application provides one, so that branding remains recognizable in compact navigation.
16. As an application user, I want no distorted wordmark when no compact logo is provided, so that the rail remains visually clean.
17. As an application user, I want the expanded sidebar's logo and top content to remain available in their existing layout, so that collapse does not change normal use.
18. As an application user who prefers reduced motion, I want the layout change to avoid animation, so that the component respects my system preference.
19. As a package consumer, I want to read and set the collapsed state programmatically, so that the sidebar can participate in application-level layout behavior.
20. As a package consumer, I want separate collapsed and expanded events, so that each transition can trigger the appropriate application response.
21. As a package consumer, I want programmatic state transitions to emit the same events as user-driven transitions, so that observers have one consistent notification contract.
22. As a package consumer, I want initial restoration from saved state to be silent, so that initialization does not look like a newly requested transition.
23. As a package consumer, I want an explicit initial state to override a saved preference, so that application configuration remains authoritative when supplied.
24. As a package consumer with multiple app shells on one origin, I want to scope persistence with a key, so that independent sidebars do not overwrite one another.
25. As a package consumer, I want a reset method for saved sidebar state, so that a workspace or account change can return the component to its configured default.
26. As a package consumer, I want the component to work when browser storage is blocked or corrupted, so that privacy settings do not prevent rendering.
27. As a package consumer, I want documented public properties, methods, events, and examples, so that I can use the new behavior without inspecting implementation source.
28. As a package maintainer, I want existing menu selection, submenu, bottom-menu, and slotted-content behavior preserved, so that this Consumer-Visible Change does not introduce regressions.
29. As a package maintainer, I want layout preferences to remain local to each tab after they are persisted, so that one tab does not unexpectedly reconfigure another open tab.
30. As a release agent, I want the Consumer-Visible Change captured in the changelog and public documentation, so that package users can discover and adopt it deliberately.

## Implementation Decisions

- Add a reactive, reflected `collapsed` boolean to the layout sidebar Public Surface. It represents the current state, not merely an initial preference.
- Add an optional `storageKey` Public Surface property. A stable component-default key supports the common one-sidebar-per-app case; a supplied key isolates independent app shells on the same origin.
- Add an optional `logoSmallSvg` template property for the compact rail. Render it only when collapsed and supplied; do not scale or derive it from the full logo. Hide the arbitrary top template when collapsed.
- Persist a versioned browser-storage record containing `collapsed` and the preferred `expandedWidth`. Persistence is enabled by default and is best-effort.
- Resolve initial state in this order: an explicit application-supplied collapsed value, then a valid stored preference, then the component default. Stored restoration must be silent.
- Programmatic changes to `collapsed` after initialization are real state transitions: persist the new value and emit the corresponding event. Assigning the current value does not create a transition or event.
- Emit `collapsed` when entering the rail and `expanded` when returning to full navigation. Events bubble and cross the component boundary. Dispatch them synchronously after the state value changes and persistence is attempted; do not wait for visual animation.
- Provide `resetPersistedState()`. It removes only this component's persisted record and restores the configured default without emitting a transition event.
- Use a fixed 56px collapsed rail. Disable divider resizing while collapsed. On expansion, restore the preferred width; allow the split layout to clamp rendering to available space without overwriting the saved preference.
- Continue storing a user's expanded divider width whenever the existing split-layout reposition behavior changes. Do not synchronize storage changes into other already-open browser tabs.
- In the rail, leaf menu items remain links and navigate immediately. Menu-group controls expand the sidebar and open the selected group. Keep submenu expansion ephemeral rather than persisted.
- Continue URL-based selection and ancestor-group opening. When a nested item is selected while the sidebar remains collapsed, visually identify its ancestor group in the rail rather than forcibly expanding the sidebar.
- Retain all existing menu items in the rail. Render an icon when provided; otherwise render a compact first-character label fallback. Every rail item has a full accessible name and native tooltip. A group control announces that it opens the named submenu.
- Place the collapse control in the expanded sidebar's upper-right area near the full logo and use it as the first rail control when collapsed. Its accessible label must describe the action that will occur.
- Animate layout width changes briefly for spatial continuity, while honoring `prefers-reduced-motion: reduce` by removing the motion.
- Do not add responsive auto-collapse, mobile drawer behavior, or live cross-tab synchronization. Applications may compose those policies outside the component.
- Update the component's public type declarations, API documentation, live demo, and package changelog as part of this Consumer-Visible Change. Preserve existing exports and the `owc-` element-prefix convention in line with the established Public Surface decisions.
- Do not add a dependency or an ADR unless implementation reveals a new dependency or an architectural decision beyond the agreed public behavior.

## Testing Decisions

- Highest behavior seam: exercise the public layout-sidebar custom element in the existing colocated browser test suite. Assert rendered behavior, public properties, user interactions, browser storage effects, events, and accessible attributes rather than private helper or rendering details.
- Verify existing top-menu, bottom-menu, hidden-item, submenu, current-URL selection, ancestor opening, logo, and slotted-content behavior remains intact in expanded mode.
- Verify user-triggered collapse and expansion change the public state, render the appropriate layout, persist the preference, and emit exactly the corresponding public event.
- Verify post-initialization programmatic transitions emit the corresponding event, while initial storage restoration and reset are silent.
- Verify explicit application state takes precedence over stored state; verify valid stored state restores when no explicit value is supplied.
- Verify persisted width is restored after reopening and reload, remains preferred when a narrow viewport clamps it, and does not change while the rail is fixed.
- Verify menu leaf items navigate from the rail; group controls expand the sidebar and open the requested submenu; a URL-selected nested item identifies its parent group while collapsed.
- Verify icon and initial fallback rendering, compact-logo rendering and absence behavior, full labels/tooltips, accessible names, and toggle-control labels.
- Verify malformed storage and unavailable storage leave the component usable and defaulted, with a later successful update writing a valid record.
- Verify public type compilation exposes the new component API through the existing public-surface type-test seam.
- Use the current layout-sidebar browser tests as prior art for component behavior and the existing table storage tests as prior art for isolated browser-storage setup and recovery cases.
- Run focused browser and type checks during implementation, then the full Release Gate. Update the changelog and public docs as part of validation for this Consumer-Visible Change; preserve Release Hygiene in all public material.

## Out of Scope

- Persisting individual submenu open/closed choices.
- Automatically expanding the sidebar solely because the current URL selects a nested item.
- Responsive breakpoint-driven collapse, mobile drawer navigation, or a modal overlay.
- Synchronizing state immediately between already-open browser tabs.
- Making the compact rail resizable.
- Deriving a compact logo by scaling the full logo.
- Introducing a new dependency solely for toggle controls, tooltips, persistence, or animation.
- Changing the existing menu item shape, URL matching rules, page-content slot, custom element name, or existing package exports.
- Editing generated artifacts by hand.

## Further Notes

- This PRD was synthesized from a completed design grilling session. The primary decisions were explicitly confirmed by the requester.
- The work is a Consumer-Visible Change to an existing public component. Follow the repository's Migration Handling and Documentation Bar expectations even though existing exports remain intact.
- The storage record is intentionally limited to layout preference. URL-derived selection and submenu visibility remain navigation concerns, not durable user preferences.
