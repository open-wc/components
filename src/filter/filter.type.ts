import { globalSearchField } from './jsonToFilter.js';
import {
  DATE_OPERATORS,
  NUMBER_OPERATORS,
  OPERATORS,
  TEXT_OPERATORS,
} from '../table-filter/operators.js';

export type Filter<T> = (row: T) => boolean;

export type textOperator = keyof typeof TEXT_OPERATORS;

export type numberOperator = keyof typeof NUMBER_OPERATORS;
export type dateOperator = keyof typeof DATE_OPERATORS;

export type operator = keyof typeof OPERATORS;

export type JsonFilter = {
  value:
    | string
    | number
    | boolean
    | Date
    | Array<string | number | boolean>
    | { from: Date; to: Date }
    | { from: number; to: number }
    | NestedJsonFilters;
  operator: operator;
  field: string | typeof globalSearchField;
  enabled?: boolean; // defaults to true
  negated?: boolean; // defaults to false
};

export type NestedJsonFilters = Array<JsonFilter | NestedJsonFilters>;

export type SqlPrimitive =
  string | number | boolean | { from: string; to: string } | { from: number; to: number };
