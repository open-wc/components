// export type Leaves<T> = T extends object
//   ? {
//       [K in keyof T]: `${Exclude<K, symbol>}${Leaves<T[K]> extends never
//         ? ''
//         : `.${Leaves<T[K]>}`}`;
//     }[keyof T]
//   : never;

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

type Next = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, never];

type Prev = [
  never,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  ...0[],
];

// Taken from https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object
export type Leaves<T, D extends number = 10, TakeArrays extends boolean = true> = [D] extends [
  never,
]
  ? never
  : T extends Date
    ? ''
    : T extends object
      ? {
          [K in keyof T]-?: K extends string | number
            ? K extends `_${string}`
              ? never
              : K extends `$${string}`
                ? never
                : T[K] extends Array<infer Item>
                  ? TakeArrays extends true
                    ? | Join<`${K}[]`, ''>
                      | Join<`${K}`, ''>
                      | Join<`${K}[]`, Leaves<Item, Prev[D], true>>
                    : never
                  : Join<K, Leaves<T[K], Prev[D], true>>
            : '';
        }[keyof T]
      : '';

export type LeavesArray<T> = Array<Leaves<T>>;

type Split<S extends string, D extends string> = string extends S
  ? string[]
  : S extends ''
    ? []
    : S extends `${infer T}${D}${infer U}`
      ? [T, ...Split<U, D>]
      : [S];

// TODO: Use this for getFieldPath return value and handleUpdate.value
export type TypeofLeaf<T, LeafPath extends string, i extends number = 0> = Split<
  LeafPath,
  '.'
>[i] extends string
  ? T extends (infer D)[]
    ? TypeofLeaf<D, LeafPath, i>[]
    : T extends object
      ? T extends { [k in Split<LeafPath, '.'>[i]]: unknown }
        ? TypeofLeaf<T[Split<LeafPath, '.'>[i]], LeafPath, Next[i]>
        : never
      : T
  : T;
