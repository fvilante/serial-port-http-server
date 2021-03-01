
export type InferResult<R> = R extends Result<infer A, infer E> ? {value: A, error: E} : never

type ResultWorld<A,E> = { hasError: true, value: E} | { hasError: false, value: A}

type ResultMatcher<A,E,X> = {
    Ok: (value: A) => X,
    Error: (err: E) => X,
}

export type Result<A,E> = {
    kind: 'Result'
    unsafeRun: () => { kind: Result<A,E>['kind'] } & ResultWorld<A,E>
    unsafeMatch: <X>(matcher: ResultMatcher<A,E,X>) => X 
    map: <B>(f: (_:A) => B) => Result<B,E>
    mapError: <E1>(f: (_:E) => E1) => Result<A,E1>
}

export const Result = <A,E>(world: () => { hasError: true, value: E} | { hasError: false, value: A}): Result<A,E> => {

    type T = Result<A,E>

    const unsafeRun: T['unsafeRun'] = () => ({ ...world(), kind: 'Result'}) 

    const unsafeMatch: T['unsafeMatch'] = matcher => {
        const world_ = world()
        const value = world_.value
        return world_.hasError
            ? matcher.Error(value as E)
            : matcher.Ok(value as A)
    }

    const map: T['map'] = f => Result( () => {
        const world_ = world()
        const value = world_.value
        return world_.hasError===true
            ? world_
            : { hasError: false, value: f(value as A)}
    })

    const mapError: T['mapError'] = f => Result( () => {
        const world_ = world()
        const value = world_.value
        return world_.hasError===false
            ? world_
            : { hasError: true, value: f(value as E)}
    })

    return {
        kind: 'Result',
        unsafeRun,
        unsafeMatch,
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

const Test1 = () => {

    type Juca = 'juca' 
    type Fail = Error

    const a = Result_.Ok<number,string>(12)
    const b = Result_.Error<number,string>('Erro do tipo juca')

    const m: ResultMatcher<number,string, void> = {
        Error:  err => console.log('Deu Erro: ',err),
        Ok:     val => console.log('Deu bom: ', val),
    }

    a.unsafeMatch(m)
    b.unsafeMatch(m)

}

Test1();