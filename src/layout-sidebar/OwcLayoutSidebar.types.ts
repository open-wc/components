export interface MenuItem {
  icon: string;
  label: string;
  href: string;
  hrefGETParams: Record<string, string>;
  selected: boolean;
  open: boolean;
  visible: boolean;
  parent: MenuItem;
  subMenuItemList: MenuItem[];
}

export interface OwcLayoutSidebarOptions {
  menuItemList: Array<MenuItem>;
  menuBottomItemList: Array<MenuItem>;
  menuTopTemplate: import('lit').TemplateResult;
}
