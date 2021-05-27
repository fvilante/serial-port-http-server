// =====================================================================================
// ADTs in my subset - normaly a part of a std-lib
// =====================================================================================
/*
// Future<A> - Represents a single future value of type A
type FutureModel<A> = (resolve: (_:A) => void) => void
type Future<A> = {
    readonly unsafeRun: () => Promise<A>
    readonly map: <B>(f:(_: A) => B) => Future<B>
    readonly validate: <B>(v: Validator<B>) => Future<Result<B,Error>>
}
declare const Future: <A>(m: FutureModel<A>) => Future<A>

// Result<A,E> - Represents a value that is either a Value A or a Error E
type ResultModel<A,E> = { kind: 'error', value: E } | { kind: 'data', value: A }
type Result<A,E> = {
    readonly unsafeRun: () => ResultModel<A,E>
    readonly map: <B>(f:(_: A) => B) => Future<A>
}
declare const Result: <A,E>(m: ResultModel<A,E>) => Result<A,E>
declare const Ok: <A,E>(ok: A) => Result<A,E>
declare const Fail: <A,E>(err: E) => Result<A,E>



type Predicate = (_: unknown) => boolean
type Caster<A> = (_: unknown) => A
type ErrorMessage = string
type Validator<A> = {
    
}
declare const Validator: <A>(p: Predicate, c: Caster<A>, err: ErrorMessage) => Validator<A>

// =====================================================================================
// Impure part - here compiler will not help you, but I have this code already implemented
// =====================================================================================


declare const isPureArrayOfNumber: Predicate
declare const castPureArrayOfNumber: Caster<readonly number[]>

// =====================================================================================
// Validator function - example
// =====================================================================================





// =====================================================================================
// Main
// =====================================================================================

const someDataFromWorld: unknown = [1,2,3,4,5,5]
const dataFetchedUnsafe = Future( resolve =>  { resolve(someDataFromWorld) })

const dataValidator = Validator(isPureArrayOfNumber, castPureArrayOfNumber, `Type Error: data should be an array of numbers`)

const dataValidated = dataFetchedUnsafe.validate(dataValidator)

//unsaferun
const unsaferun = await dataValidated.unsafeRun()

*/