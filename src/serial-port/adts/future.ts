import { InferResult, Result_, Result } from "./result"

type Receiver<A> = (received: A) => void
type Emitter<A> = (receiver: Receiver<A>) => void

type FutureWorld<A> = Emitter<A>

export type Future<A> = {
    kind: 'Future'
    unsafeRun: (_: Receiver<A>) => void
    runToAsync: () => () => Promise<A> // never should fails, all error treatment SHOULD be made inside A
    async: () => Promise<A> //async is designed to use 'await' keyword on futures
    map: <B>(f: (_:A) => B) => Future<B>
}

export const Future = <A>(emitter: (receiver: (received: A) => void) => void): Future<A> => {

    type T = Future<A>

    const unsafeRun: T['unsafeRun'] = receiver => emitter(receiver)

    const runToAsync: T['runToAsync'] = () => () => new Promise( (resolve, reject) => emitter(resolve) )

    const async: T['async'] = runToAsync()

    const map: T['map'] = f => Future( receiver => {
        emitter( a => {
            const b = f(a)
            receiver(b)
        })
    })

    return {
        kind: 'Future',
        unsafeRun,
        runToAsync,
        async,
        map,
    }

} 

// static part

export type Future_ = {
    mapResultA: <A,E,B>(mma: Future<Result<A,E>>, f: (_:A) => B) => Future<Result<B,E>>
    mapResultError: <A,E,E1>(mma: Future<Result<A,E>>, f: (_:E) => E1) => Future<Result<A,E1>>
}

type T = Future_

const mapResultA: T['mapResultA'] = (mma, f) => mma.map( ra => ra.map(f))

const mapResultError: T['mapResultError'] = (mma, f) => mma.map( ra => ra.mapError(f))


export const Future_: Future_ = {
    mapResultA,
    mapResultError,
}



// --------

const Test1 = async () => {


    const x = Future<Result<number,string>>( receiver => {
        receiver(Result_.Ok(2))
    })

    const x2 = Future_.mapResultError(x, t => Number(t))





}

Test1();