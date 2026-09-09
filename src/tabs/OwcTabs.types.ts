import { TemplateResult } from 'lit';

export interface Tab<T> {
  label?: string | TemplateResult;
  labelPrefix?: string | TemplateResult;
  labelSuffix?: string | TemplateResult;
  content?: (options: T & { open: boolean; closeTab: () => void }) => string | TemplateResult;
  visible?: boolean | ((data: T) => boolean);
  order?: number;
}

export type Tabs<T> = Record<string, Tab<T>>;

export interface OwcTabsOptions<T> {
  tabs: Tabs<T>;
  active?: keyof Tabs<T>;
  getRenderOptions?: () => T;
  renderMode: 'eager' | 'deferred';
}
