import { TemplateResult } from 'lit';

type FormatterFunction<T> = (row: T) => TemplateResult | string | number;
type StyleFunction<T> = (row: T) => string;

export interface Fields<T> {
  image?: { src: (row: T) => string; alt: (row: T) => string };
  header?: FormatterFunction<T>;
  body: FormatterFunction<T>;
  footer?: FormatterFunction<T>;
  style?: StyleFunction<T>;
}

export interface OwcCardListOptions<T> {
  fields: Fields<T>;
  title: string;
  viewAllUrl?: string;
  sorter?: (a: T, b: T) => number;
  getCardLinkSettings?: (card: T) => import('../OwcTable.types.js').RowLinkSettings;
}
