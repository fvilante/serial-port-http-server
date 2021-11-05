import { Maybe, Maybe_ } from "./maybe"
import { Either, Either_ } from "./maybe/either"
import { InferResult, Result_, Result, ResultMatcher } from "./result"

// IMPORTANT: 
//  the idea of future is that he never trows an error
//  you must design the future to never trow.
//  use Future_.fromUnsafePromise and similars to assure your ADTs constructions are safe

// fix: setTimeout should be hiden from implementation
//      if all call to setTimeout pass through this future, we can
//      distort time frame in the effects of application
// fix: substitute all calls to setTimeout in all files by a call to setTimeout___
// fix2: I substitute this const below to Future.__setTimeout
const ____setTimeout = setTimeout 


// FIX: Can future be cancelated ? how ?
//      I think it's possible to return an unsubscriber from the emitter function
//      but how to make it not imperative and functional ? what methods should emerge from this pattern and how it's related to concept of 'fiber'
//      I think that Future<A,B> should be exists, where A is the emitter result, but B is the sync and imediate result from run the emiter once

type Receiver<A> = (received: A) => void
type Emitter<A> = (receiver: Receiver<A>) => void

type FutureWorld<A> = Emitter<A>

export type InferFuture<T extends Future<unknown>> = T extends Future<infer A> ? A : never

type Flatten<T extends readonly unknown[]> = T extends unknown[] ? _Flatten<T>[] : readonly _Flatten<T>[];
type _Flatten<T> = T extends readonly (infer U)[] ? _Flatten<U> : T;

type InferFutureResult<A> =  A extends Result<infer B,infer E> ? {value:B, error: E} : never 

type FutureResultMatcher<A,X> = ResultMatcher<InferFutureResult<A>['value'],InferFutureResult<A>['error'],X>

export type Future<A> = {
    kind: 'Future'
    // unsafe part
    unsafeRun: (_: Receiver<A>) => void
    forResult: <X>(m: FutureResultMatcher<A,void>) => void
    // safe part (?)
    runToAsync: () => () => Promise<A> // never should fails, all error treatment SHOULD be made inside A
    async: () => Promise<A> //async is designed to use 'await' keyword on futures
    map: <B>(f: (_:A) => B) => Future<B>
    fmap: <B>(f: (_:A) => Future<B>) => Future<B>
    tap: (f: (_:A) => void) => Future<A> //tap 'before' yield the value to the downstream
    transform: <X>(f: (me: Future<A>) => X) => X 
    ignoreContent: () => Future<void> // maps A to void
    __decomposeResult: () => Future<{
        value: Maybe<InferFutureResult<A>["value"]>;
        error: Maybe<InferFutureResult<A>["error"]>;
    }>
    matchResult: <X>(m: FutureResultMatcher<A,X>) => Future<X>
    addDelay: (msecs: number) => Future<A>
}

export const Future = <A>(emitter: (receiver: (received: A) => void) => void): Future<A> => {

    type T = Future<A>
    //fix: Assure that once settled future to not emit more values, even if a buggy emiter continues to send signals
    const unsafeRun: T['unsafeRun'] = receiver => {
        let emissionCounter = 0
        emitter( a => {
            //this algorithm is a protection agains buggy emmiter
            if(emissionCounter===0) { // takes only first emission
                emissionCounter = emissionCounter + 1;
                receiver(a);
            } else {
                // ignore other emissions, if it exists
            }
        })
        
    }

    const runToAsync: T['runToAsync'] = () => () => new Promise( (resolve, reject) => unsafeRun(resolve) )

    const forResult: T['forResult'] = matcher => matchResult(matcher).unsafeRun( () => {})

    const async: T['async'] = runToAsync()

    const map: T['map'] = f => Future( receiver => {
        unsafeRun( a => { 
            const b = f(a)
            receiver(b)
        })
    })

    const fmap: T['fmap'] = f => Future_.flatten(map(f))

    const tap: T['tap'] = f => Future( receiver => {
        unsafeRun( a => {
            const x = f(a)
            receiver(a)
        })
    })

    const transform: T['transform'] = f => f(Future(unsafeRun))

    const ignoreContent: T['ignoreContent'] = () => map( a => undefined)

    const __decomposeResult: T['__decomposeResult'] = () => {
        type I = InferFutureResult<A>
        const x = map( a => {
            const r = a as unknown as Result<I['value'],I['error']>
            const r0 = r.__select()
            return r0
        })
        return x 
    }

    const matchResult: T['matchResult'] = matcher => {
        type I = InferFutureResult<A>
        return Future( yield_ => {
            unsafeRun( a => {
                const r = a as unknown as Result<I['value'],I['error']>
                const x = r.match(matcher)
                yield_(x)
    
            })
        })  
    }

    const addDelay: T['addDelay'] = msecs => {
        return Future( resolve => {
            unsafeRun( a => {
                Future_.delay(msecs).unsafeRun( hasFinished => resolve(a))
            })
        })
    }

    return {
        kind: 'Future',
        unsafeRun,
        forResult,
        runToAsync,
        async,
        map,
        fmap,
        tap,
        transform,
        ignoreContent,
        __decomposeResult,
        matchResult,
        addDelay,
    }   

} 

// static part

type UnFuturifyArray<T extends readonly Future<unknown>[]>  = {
    readonly [K in keyof T]: T[K] extends Future<infer U> ? U : never
}

type InferFutures<T extends readonly Future<unknown>[]> = T extends readonly [...infer A] ? A : never
type T0 = InferFutures<[Future<number>, Future<'oi'>, Future<'juca'>]>
type T1 = UnFuturifyArray<T0>

export type UnsafePromiseError = {
    kind: 'UnsafePromiseError'
    errorMessage: `Tried to execute a promise but it trowed an error`
    details: {
        catchedError: unknown
    }
}
export type Future_ = {
    __setTimeout: <N extends number,A>(run: (msecs:N) => void, msecs: N) => { cancel: () => void } // this is the master substitute of run-time original setTimeout
    // FIX: milisecs should be a unit of time not of natural number
    //_alarm: (milisecs: number ) => Future<[timePoint: Future<Maybe<number>>, cancelation: () => void]>  // if you cancel it'll return nothing, else it will return the number of msecs programmed after the time msecs has been passed
    fromValue: <A>(value:A) => Future<A>
    fromThunk: <A>(thunk: () => A) => Future<A>
    fromUnsafePromise: <A>(f: () => Promise<A>) => Future<Result<A,UnsafePromiseError>>
    delay: <N extends number>(msecs: N) => Future<N> //Note: cannot be canceled, returns the number of msecs programed
    delayCancelable: <A, N extends number = number>(msecs: N, cancelation: Future<A>) => Future<Either<N,A>> // left if not has been canceled (returns the msecs programed), right if has been canceled (returns the type of the cancelation promise)
    race: <A,B>(f0: Future<A>, f1: Future<B>) => Future<Either<A,B>>
    all: <T extends readonly Future<unknown>[]>(fs: T) => Future<UnFuturifyArray<T>>
    flatten: <A>(mma: Future<Future<A>>) => Future<A> 
    mapResultA: <A,E,B>(mma: Future<Result<A,E>>, f: (_:A) => B) => Future<Result<B,E>>
    mapResultError: <A,E,E1>(mma: Future<Result<A,E>>, f: (_:E) => E1) => Future<Result<A,E1>>
    //relativeInterval: <A,B>(a: Future<A>, b: Future<B>) => Future<number>
}

type T = Future_

const __setTimeout: T['__setTimeout'] = (run, msecs) => {
    const timepoint = ____setTimeout( () => {
        run(msecs);
    }, msecs)
    return {
        cancel: () => clearTimeout(timepoint)
    }
}

const fromValue: T['fromValue'] = value => Future( yield_ => yield_(value))

const fromThunk: T['fromThunk'] = thunk => Future( yield_ => yield_(thunk()))

const fromUnsafePromise: T['fromUnsafePromise'] = runPromise => Future( yield_ => {

    const makeError = (catchedError: unknown): UnsafePromiseError => {
        return {
            kind: 'UnsafePromiseError',
            errorMessage: 'Tried to execute a promise but it trowed an error',
            details: {
                catchedError,
            }
        }
    }

    // try to executes
    try {
        runPromise()
            .then( a => yield_(Result_.Ok(a)))
            .catch( err => {
                yield_(Result_.Error(makeError(err)));
            
            })
    } catch (err) {
        yield_(Result_.Error(makeError(err)))
    }
})

const delay: T['delay'] = msecs => Future( yield_ => {
    Future_.__setTimeout( (n) => {
        yield_(n);
    }, msecs)
})

const delayCancelable: T['delayCancelable'] = (msecs, cancel) => {

    return Future( yield_ => {
        
        let hasFullfilled = false

        // fix: I ask myself if I could transform hasFullfilled into an Ref<A> or something in ADT format. If it's possible, how should it be and look like ? And if there is any advantage...
        const timepoint = Future_.__setTimeout( () => {
            if(hasFullfilled===false) { // in theory this if check is unnecessary may be removed for improvement
                hasFullfilled = true
                yield_(Either_.fromLeft(msecs))
            }
        }, msecs)

        cancel.unsafeRun( message => {
            if(hasFullfilled===false) {
                hasFullfilled = true
                timepoint.cancel();
                yield_(Either_.fromRight(message))
            }
        })
    })
}

// NOTE: The loser future do not get cancelead by this function. We are trying to mimic Promise.race (FIX: But I'm not sure if this is a good design decision)
const race: T['race'] = (f0, f1) => Future( yield_ => {

    let whoWins: '0_WINS' | '1_WINS' | undefined = undefined

    f0.unsafeRun( a => {
        if (whoWins === undefined) {
            whoWins = '0_WINS';
            yield_(Either_.fromLeft(a));
        }
    })

    f1.unsafeRun( b => {
        if (whoWins === undefined) {
            whoWins = '1_WINS';
            yield_(Either_.fromRight(b));
        }
    })

})

// Note: If just one of the future do not resolves, all will not resolve as well. Recomended to use Futures with timeout implemented if needed.
//       executions happens in parallel
const all: T['all'] = fs => Future( yield_ => {
    const length = fs.length
    let c = 0
    let buf: unknown[] = []
    fs.forEach( (f, index) => {
        f.unsafeRun( value => {
            c = c + 1
            buf[index] = value
            if (c===length) {
                yield_(buf as any) //fix: remove the 'any' type
            }
        })
    })
})

const flatten: T['flatten'] = mma => Future( yield_ => {
    mma.unsafeRun( fa => fa.unsafeRun( a => yield_(a)))
})

const mapResultA: T['mapResultA'] = (mma, f) => mma.map( ra => ra.map(f))

const mapResultError: T['mapResultError'] = (mma, f) => mma.map( ra => ra.mapError(f))


export const Future_: Future_ = {
    //_alarm: _alarm,
    __setTimeout,
    fromValue,
    fromThunk,
    fromUnsafePromise,
    delay,
    delayCancelable,
    race,
    all,
    flatten,
    mapResultA,
    mapResultError,
}

/*
const Test1 = async () => {

    console.log(`Setei alarme`)
    const [run, cancel] = Future_._alarm(7000)
    run.async().then( m => {
        console.log('milisecs=',m)
        console.log(`Alarme tocou`)
    })

    const [whatchDog] = Future_._alarm(12000)
    whatchDog.unsafeRun( () => {
        console.log('cancelando')
        cancel();
        console.log('cancelei')
    })

    

}

Test1();*/
