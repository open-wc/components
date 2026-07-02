import { TemplateResult, CSSResult } from 'lit';

export interface Tab<T> {
  label?: string | TemplateResult;
  labelPrefix?: string | TemplateResult;
  labelSuffix?: string | TemplateResult;
  content?: (options: T & { open: boolean }) => string | TemplateResult;
  visible?: boolean | ((data: T) => boolean);
  order?: number;
  customStyle?: CSSResult;
}

export type Tabs<T> = Record<string, Tab<T>>;

export interface OwcTabsOptions<T> {
  tabs: Tabs<T>;
  active?: keyof Tabs<T>;
  getRenderOptions?: () => T;
}
