import { Future } from "../future"
import { Reader } from "../reader/reader"
import { Result, Result_ } from "../result"


type ZIOWorld<R,A,E> = ZIO<R,A,E>['unsafeRun']

export type InferZIO<Z> = Z extends ZIO<infer R, infer A, infer E> ? {enviroment: R, success: A, error: E} : never

export type ZIO<R,A,E> = {
    kind: 'ZIO'
    //unsafe part
    unsafeRun: (enviroment: R) => Future<Result<A,E>>
    unsafeRunA: (enviroment: R, onError: (_:E) => void) => Future<A>
    unsafeRunE: (enviroment: R, onValue: (_:A) => void) => Future<E>
    // safe
    provide: (enviroment: R) => ZIO<void,A,E>
    contramap: <R0>(f: (_:R0) => R) => ZIO<R0,A,E>
    map: <B>(f: (_:A) => B) => ZIO<R,B,E>
    andThenG: <R1,B,E1>(zio: ZIO<[previousEnv: R, currentEnv:R1, previous: A],B,E1>) => ZIO<readonly [R,R1],readonly [A,B], E | E1>
}

export const ZIO = <R,A,E>(world: ZIOWorld<R,A,E>): ZIO<R,A,E> => {
    
    type T = ZIO<R,A,E>
    
    const unsafeRun: T['unsafeRun'] = world

    const unsafeRunA: T['unsafeRunA'] = (enviroment, onError) => Future(resolve => {
        const main = unsafeRun(enviroment)
        main.unsafeRun( res => {
            res.match({
                Error: error => onError(error),
                Ok: value => resolve(value)
            })
        })
    })

    const unsafeRunE: T['unsafeRunE'] = (enviroment, onValue) => Future(resolve => {
        const main = unsafeRun(enviroment)
        main.unsafeRun( res => {
            res.match({
                Error: error => resolve(error),
                Ok: value => onValue(value)
            })
        })
    })

    const provide: T['provide'] = (enviroment: R) => ZIO( env => Future( resolve => {
        const main = unsafeRun(enviroment)
        main.unsafeRun( res => {
            res.match({
                Error: error => resolve(Result_.Error(error)),
                Ok: value => resolve(Result_.Ok(value)),
            })
        })
    }))

    const contramap: T['contramap'] = f => ZIO( env => unsafeRun(f(env)))

    const map: T['map'] = f => ZIO( env => unsafeRun(env).map( r => r.map(f)))

    const andThenG: T['andThenG'] = zio_ => {
        return ZIO( env => Future(yield_ => {
            const [env_R, env_R1] = env
            const runFirst_ = unsafeRun(env_R)
            runFirst_.unsafeRun( res => {
                res.match({
                    Error: err_E => yield_(Result_.Error(err_E)),
                    Ok: valueA => {
                        // run second zio
                        const runSecond_ = zio_.unsafeRun([env_R, env_R1, valueA])
                        runSecond_.unsafeRun( res2 => {
                            res2.match({
                                Error: err_E1 => yield_(Result_.Error(err_E1)),
                                Ok: valueB => {
                                    yield_(Result_.Ok([valueA, valueB] as const))
                                },
                            })
                        })

                    },
                })
            })
        }))
    }

    return {
        kind: 'ZIO',
        unsafeRun,
        unsafeRunA,
        unsafeRunE,
        provide,
        contramap,
        map,
        andThenG: andThenG,
    }
} 

// static part

export type ZIO_ = {
    fromReader: <R,A>(r: Reader<R,A>) => ZIO<R,A,void>
    fromSync: <A,B>(f: (_:A) => B) => ZIO<A,B,void>
}

type T = ZIO_

const fromReader: T['fromReader'] = reader => ZIO( env => Future( yield_ => {
    const main = reader.unsafeRun(env)
    main.unsafeRun( valueA => yield_(Result_.Ok(valueA)))
}))

const fromSync: T['fromSync'] = f => ZIO( env => Future( yield_ => {
    const valueA = f(env)
    yield_(Result_.Ok(valueA))
}))



export const ZIO_:ZIO_ = {
    fromReader,
    fromSync,
}


