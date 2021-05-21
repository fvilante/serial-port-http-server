
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
        const world_ = world()
        const value = world_.value
        return world_.hasError
            ? matcher.Error(value as E)
            : matcher.Ok(value as A)
    }

    const map: T['map'] = f => Result( () => {
        const world_ = world()
        const value = () => world_.value
        return world_.hasError===true
            ? world_
            : { hasError: false, value: f(value() as A)}
    })

    const mapError: T['mapError'] = f => Result( () => {
        const world_ = world()
        const value = () => world_.value
        return world_.hasError===false
            ? world_
            : { hasError: true, value: f(value() as E)}
    })

    return {
        kind: 'Result',
        unsafeRun,
        match,
        forEach,
        forError,
        forOk,
        map,
        mapError,
    }
}

export type Result_ = {
    Ok: <A,E>(_:A) => Result<A,E>
    Error: <A,E>(_:E) => Result<A,E>
}

type T = Result_


const Ok_: T['Ok'] = <A,E>(value:A) => Result(() => ({hasError: false, value})) as unknown as Result<A,E>

const Error_: T['Error'] = <A,E>(error:E) => Result(() => ({hasError: true, value: error})) as unknown as Result<A,E>


export const Result_ = {
    Ok: Ok_,
    Error: Error_,
}

// test

