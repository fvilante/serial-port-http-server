import { NaturalNumber } from "./natural-number";


export type TupleOf<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;


// informal test


type T1 = TupleOf<string, 3>;  // [string, string, string]
type T2 = TupleOf<number, 0 | 2 | 4>;  // [] | [number, number] | [number, number, number, number]
type T3 = TupleOf<number, number>;  // number[]
//type T4 = TupleOf<number, 100>;  // Depth error
type S0 = NaturalNumber<7>[number]
type T5 = TupleOf<number, S0>