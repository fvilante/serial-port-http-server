import { Push } from './wrapper'


type Stream<K,A> = {


}


declare const Stream: <A>() => Stream<A>

// ----


declare const AbsoluteFindOne: <A>(toMatch:A, source: Push<A>) => { findOne: Push<A>, source: Push<A> }