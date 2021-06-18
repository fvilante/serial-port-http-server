import { Future, Future_ } from "../future"
import { Either } from "../maybe/either"
import { Finishable } from "../stream/finishable"

type ReaderWorld<R,A> = Reader<R,A>['unsafeRun']

export type Reader<R,A = void> = {
    kind: 'Reader'
    unsafeRun: (enviroment: R) => Future<A>
    unsafeRunF: (enviroment: R, receiver: (_:A) => void) => void
    provide: (enviroment: R) => Reader<void,A>
    map: <B>(f: (data:A, enviroment: R) => B) => Reader<R,B>
    contramap: <R0>(f: (_:R0) => R) => Reader<R0,A>
} 

export const Reader = <R,A = void>(world: ReaderWorld<R,A>):Reader<R,A> => {

    type T = Reader<R,A>

    const unsafeRun: T['unsafeRun'] = world
    const unsafeRunF: T['unsafeRunF'] = (env,f) => unsafeRun(env).unsafeRun(f)
    const map: T['map'] = f => {
        return Reader( env => {
            const f_ = (env: R) => (data:A) => f(data,env)
            const a_ = unsafeRun(env)
            const b_ = a_.map(f_(env))
            return b_
        })
    }

    const contramap: T['contramap'] = f => {
        return Reader( env0 => {
            const env = f(env0)
            return unsafeRun(env)
        })
    }

    const provide: T['provide'] = env => Reader( () => unsafeRun(env) )


    return {
        kind: 'Reader',
        unsafeRun,
        unsafeRunF,
        provide,
        map,
        contramap,
       
    }
}

// static part

export type Reader_ = {
    fromSync: <R,A>(f: (_:R) => A) => Reader<R,A> 
    fromAsync: <R,A>(f: (_:R) => Future<A>) => Reader<R,A>
    flatten: <R,A>(mma: Reader<R,Reader<R,A>> ) => Reader<R,A>
}

type T = Reader_

const fromSync: T['fromSync'] = f => Reader( env => Future_.fromValue(f(env)))

const fromAsync: T['fromAsync'] = f => {
    return Reader( env => f(env).tap( () => console.log('constructing')))
}

const flatten: T['flatten'] = mma => {
    return Reader( env => {
        const ma_ = mma.unsafeRun(env)
        return Future( yield_ => {
            ma_.unsafeRun( ma => ma.unsafeRunF(env, a => yield_(a)) )
        })  
    })
}


export const Reader_: Reader_ = {
    fromSync,
    fromAsync,
    flatten,
}