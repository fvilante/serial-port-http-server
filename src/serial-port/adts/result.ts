import { Maybe, Maybe_ } from "./maybe"
import { Either, Either_ } from "./maybe/either"

export type InferResult<R> = R extends Result<infer A, infer E> ? {value: A, error: E} : never

export type ResultWorld<A,E> = ReturnType<Result<A,E>['unsafeRun']>

export type ResultMatcher<A,E,X> = {
    Ok: (value: A) => X,
    Error: (err: E) => X,
}

export type Result<A,E> = {
    kind: 'Result'
    unsafeRun: () => { hasError: true, value: E} | { hasError: false, value: A}
    forEach: (matcher: ResultMatcher<A,E,void>) => void
    forOk: (f: (_:A) => void) => void
    forError: (f: (_:E) => void) => void
    match: <X>(matcher: ResultMatcher<A,E,X>) => X 
    map: <B>(f: (_:A) => B) => Result<B,E> //maps 'ok'
    mapError: <E1>(f: (_:E) => E1) => Result<A,E1>
    transform: <X>(f: (me: Result<A,E>) => X) => X
    tap: (f: (_:A) => void) => Result<A,E>
    tapError: (f: (_:E) => void) => Result<A,E>
    __select: () => { value: Maybe<A>, error: Maybe<E> } // CAUTION: I think the concept of error is to assure you are dealing with error condition in a safe way (so we should use match instead of this selector), but I think some times we are in hush and want a breakable solution // fix: define if this function is really necessary or if it can be unsignaled as (caution)
}

export const Result = <A,E>(world: () => ResultWorld<A,E>): Result<A,E> => {

    type T = Result<A,E>

    const unsafeRun: T['unsafeRun'] = world

    const forEach: T['forEach'] = m => match(m)

    const forOk: T['forOk'] = f => {
        const data = unsafeRun()
        if(data.hasError===false) f(data.value)
    }

    const forError: T['forError'] = f => {
        const data = unsafeRun()
        if(data.hasError===true) f(data.value)
    }

    const match: T['match'] = matcher => {
        const world_ = unsafeRun()
        const value = world_.value
        return world_.hasError
            ? matcher.Error(value as E)
            : matcher.Ok(value as A)
    }

    const map: T['map'] = f => Result( () => {
        const world_ = unsafeRun()
        const value = () => world_.value
        return world_.hasError===true
            ? world_
            : { hasError: false, value: f(value() as A)}
    })

    const mapError: T['mapError'] = f => Result( () => {
        const world_ = unsafeRun()
        const value = () => world_.value
        return world_.hasError===false
            ? world_
            : { hasError: true, value: f(value() as E)}
    })

    const transform: T['transform'] = f => f(Result(world))

    const tap: T['tap'] = f => Result( () => {
        const id = unsafeRun()
        if(id.hasError===false) f(id.value)
        return id
    })

    const tapError: T['tapError'] = f => Result( () => {
        const id = unsafeRun()
        if(id.hasError===true) f(id.value)
        return id
    })

    const __select: T['__select'] = () => {
        const x = unsafeRun()
        const maybeA = x.hasError===true ? Maybe_.fromNothing<A>() : Maybe_.fromJust(x.value)
        const maybeE = x.hasError===false ? Maybe_.fromNothing<E>() : Maybe_.fromJust(x.value)
        return {
            value: maybeA,
            error: maybeE
        }
    }

    return {
        kind: 'Result',
        unsafeRun,
        match,
        forEach,
        forError,
        forOk,
        map,
        mapError,
        transform,
        tap,
        tapError,
        __select,
    }
}


// static part

export type UnsafeSyncCallError = {
    kind: 'UnsafeSyncCallError'
    errorMessage: `Tried to execute a unsafe sync function but got an error`
    details: {
        catchedError: unknown
    }
}

export type Result_ = {
    Ok: <A,E>(_:A) => Result<A,E>
    Error: <A,E>(_:E) => Result<A,E>
    fromUnsafeSyncCall: <A>(f: () => A) => Result<A,UnsafeSyncCallError>
    andThen: <A,E,B,E1>(ma: Result<A,E>, mb: Result<B,E1>) => Result<readonly [A,B], E | E1>
    orElse: <A,E,B,E1>(ma: Result<A,E>, mb: Result<B,E1>) => Result<Either<A,B>, readonly [E, E1]>
}

type T = Result_


const Ok_: T['Ok'] = <A,E>(value:A) => Result(() => ({hasError: false, value})) as unknown as Result<A,E>

const Error_: T['Error'] = <A,E>(error:E) => Result(() => ({hasError: true, value: error})) as unknown as Result<A,E>

const fromUnsafeSyncCall: T['fromUnsafeSyncCall'] = <A>(f: () => A) => {
    return Result<A,UnsafeSyncCallError>( () => {
        const mapCatchedError = (catchedError: unknown): UnsafeSyncCallError => {
            return {
                kind: 'UnsafeSyncCallError',
                errorMessage: 'Tried to execute a unsafe sync function but got an error',
                details: {
                    catchedError,
                }
            }
        }

        // try to execute
        try {
            const a = f()
            return { hasError: false, value: a }
            
        } catch (err) {
            const mappedError = mapCatchedError(err)
            return { hasError: true, value: mappedError }
        }
    })
}

const andThen: T['andThen'] = <A, E, B, E1>(ma: Result<A, E>, mb: Result<B, E1>): Result<readonly [A, B], E | E1> => {

    return Result<readonly [A, B], E | E1>( () => {

        const a = ma.unsafeRun()
        if (a.hasError===true) {
            return a
        } else {
            const b = mb.unsafeRun()
            if (b.hasError===true) {
                return b
            } else {
                const ab = [a.value, b.value] as const
                return {
                    hasError: false,
                    value: ab

                }
            }
        }



    })

}

const orElse: T['orElse'] = <A, E, B, E1>(ma: Result<A, E>, mb: Result<B, E1>): Result<Either<A, B>, readonly [E, E1]> => {
    return Result<Either<A, B>, readonly [E, E1]>(() => {
        const a = ma.unsafeRun()
        if(a.hasError===false) {
            return {
                hasError: false,
                value: Either_.fromLeft<A,B>(a.value),
            }
        } else {
            const b = mb.unsafeRun()
            if(b.hasError===false) {
                return {
                    hasError: false,
                    value: Either_.fromRight<A,B>(b.value),
                }
            } else {
                const errAB = [a.value, b.value] as const
                return {
                    hasError: true,
                    value: errAB,
                }
            }
        }
    })
}

export const Result_: Result_ = {
    Ok: Ok_,
    Error: Error_,
    fromUnsafeSyncCall,
    andThen,
    orElse,
}

// test

