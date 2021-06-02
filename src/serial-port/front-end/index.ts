import { Maybe, Maybe_ } from "../adts/maybe"

type A = `Some text ${number}`
export const getSomeText = (n: number):Maybe<A> => Maybe_.fromJust(`Some text ${n}`  as const)