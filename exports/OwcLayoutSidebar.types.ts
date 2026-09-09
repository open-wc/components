export { MenuItem, OwcLayoutSidebarOptions } from '../src/layout-sidebar/OwcLayoutSidebar.types.js';

import { OwcLayoutSidebar } from './OwcLayoutSidebar.js';

declare global {
  interface HTMLElementTagNameMap {
    'owc-layout-sidebar': OwcLayoutSidebar;
  }
}
