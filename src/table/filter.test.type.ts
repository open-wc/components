import { Filter } from './filter.type.js';

interface TestProduct {
  name: string;
  category: string;
  provider: { name: string };
}

interface TestContract {
  paymentAmount: number;
  paymentInterval: string;
  jbp: number;
  product?: TestProduct;
}

export interface TestRow {
  name: string;
  age: number;
  employee: boolean;
  contractList: Array<TestContract>;
  address: { city: string; country: string };
  double: Array<{ locations: Array<{ x: number; y: number }> }>;
  child: { stockList: { id: string; value: number }[] };
}

export type TestNestedFilters = Filter<TestRow>;
