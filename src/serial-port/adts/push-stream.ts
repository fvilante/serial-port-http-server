import { Duration, TimePoint, TimePoint_ } from "../time"
import { now, Range } from "../utils"
import { Either, Either_ } from "./maybe/either"
import { Iterated, Pull, Pull_ } from "./stream/pull"

// helper types
// fix: extract to 'type utils'
export type TupleOf<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
export type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;


// enhancers
export type HasComplete = Symbol
export const HasFinished: HasComplete = Symbol()
export type FinishablePush<A> = Push<A & HasComplete> 

// -------

export type PushEmitter<A> = (receiver: (_:A) => void) => void 

export type InferPush<T extends Push<unknown>> = T extends Push<infer A> ? A : never

// Push stream
export type Push<A> = {
    kind: 'Push'
    //run: () => PushWorld<A>
    unsafeRun: (receiver: (_:A) => void) => void
    map: <B>(f: (_: A) => B) => Push<B>
    step: <N extends number>(size: N, step: number) => Push<[collected: readonly A[],size: N]>
    filter: (f: (_:A) => boolean) => Push<A>
    fork: (criteriaForLeft: (_:A) => boolean) => Push<Either<A,A>>
    scan: <B>(reducer: (acc: B, cur: A) => B, initial: B) => Push<B>
    transform: <X>(f: (me:Push<A>) => X) => X
    //flatten: () => Push<A> see 'concat'
    //all: <T extends Push<unknown>[]>(arr: T) => PushAll<T>
    tap: (f: (_:A) => void) => Push<A> // tap-before
    //fix: 'dropletWith' is not a good name for what this method does, and it could be more generic in 'f'. Improove when possible
    dropletWith: (f: (_:A) => boolean) => Push<readonly A[]> //fix: f should be a State<A> or other type (ie: Pull<A>... etc)
    ignoreAll: () => Push<A> // will never emit an A
    collect: <N extends number>(size: N) => Push<[collected: readonly A[],size: N]>
    //drop: (size: number, step: number) => Push<readonly A[]>

    // combinators
    combineWith: <B>(f: (_:Push<A>) => Push<B>) => Push<readonly [A,B]>

    // utils
    timeStamp: () => Push<{value: A, timePoint: TimePoint}>
    timeInterval: () => Push<{value: A, interval: Duration}>
    //openClose: (open: A, close: A) => Push<readonly [open: A, middle: readonly A[], close: A]> //, continuation: Push<A>, beforeOpen: A[]]> // fix: change type of beforeOpen from A[] to a tuple based with length  based on static size 

    //
    take: (size: number) => Push<Either<'eof',A>>
    //_collectAll: () => Future<readonly A[]> // attention: if timeout is not specified, then program can halt if size is not reached. Fix: Should be either readonly A or FixedArray<N,A>

}


export const Push = <A>(emitter: PushEmitter<A>): Push<A> => {

    type T = Push<A>

    const unsafeRun: T['unsafeRun'] = receiver => emitter(receiver)

    const map: T['map'] = f => Push( receiver => {
        emitter( a => {
            const b = f(a);
            receiver(b);
        })
    })

    // Fix: result is unpredictable for 'size' less than 0 and other edge or invalid cases
    const step: T['step'] = (size, step) => {
        
        if(size===step) {
            return collect(size)
        }
        else if(step<size) {
            return Push( receiver => {
                let buf:  readonly A[] = []
                unsafeRun( a => {
                    buf = [...buf, a]
                    if (buf.length===size) {
                        receiver([buf,size])
                        buf = buf.slice(step,size)
                    }  
                })
            })
        } else /*if(size>step)*/ {
            return Push( receiver => {
                let buf:  readonly A[] = []
                let i = 0
                unsafeRun( a => {
                    i++;
                    if (buf.length<=size) {
                        buf = [...buf, a]
                    }
                    if (buf.length===size) {
                        receiver([buf,size])
                    }
                    if (i===step) {
                        i = 0;
                        buf = []
                    }
                })
            })
        }
            
    }

    const filter: T['filter'] = f => Push( receiver => {
        emitter( a => {
            const condition = f(a)
            if(condition===true) {
                receiver(a);
            }
        })
    })

    const fork: T['fork'] = f => {
        return map( a => {
            const criteria = f(a)
            return criteria===true
                ? Either_.fromLeft(a)
                : Either_.fromRight(a)
              
            })
        }
    

    const scan: T['scan'] = (f,ini) => Push( receiver => {
        type B = Parameters<typeof receiver>[0]
        let isFirstRun: boolean = true
        let acc: B | undefined = undefined
        emitter( a => {
            if(isFirstRun===true) {
                acc = f(ini,a)
                receiver(acc)
                isFirstRun = false
            } else {
                acc = f(acc as B,a)
                receiver(acc)
            }
            
        })
    })

    const transform: T['transform'] = f => f(Push(emitter))

    const tap: T['tap'] = f => Push( receiver => {
        emitter( a => {
            f(a); //tap before run effect
            receiver(a);
        })
    })

    const dropletWith: T['dropletWith'] = f => Push( receiver => {
        let collected: readonly A[] = []
        emitter( a => {
            if (f(a)) {
                receiver(collected)
                collected = []
            } else {
                collected = [...collected, a]
            }
           
        })
    })

    const ignoreAll: T['ignoreAll'] = () => filter( a => false)

    const collect: T['collect'] = size => Push( yield_ => {
        let buf: readonly A[] = []
        emitter( a => {
            if (buf.length >= size-1) {
                yield_([[...buf,a], size])
                buf = []
            } else {
                buf = [...buf,a] // buferize data
            }
        })
    })

    // FIX: if b came before a, they will not be catched
    const combineWith: T['combineWith'] = f => Push( receiver => {
        const pushA = Push(emitter)
        const pushB = f(pushA) 
        pushA.unsafeRun( a => {
            pushB.unsafeRun( b => {
                receiver([a,b] as const)
            })
        })  

    })

    const _addTimeInformation = () => {
        const initialTimePoint = TimePoint_.now()
        type State = { 
            delta: Duration | undefined, 
            value: A | undefined,
            lastTimePoint: TimePoint 
        }
        const initialState: State = { 
            delta: undefined, 
            value: undefined,
            lastTimePoint: initialTimePoint
        }
        return Push(emitter)
            .timeStamp()
            .scan<State>( (acc,cur) => {
                const value = cur.value
                const currentTimePoint = cur.timePoint
                const lastTimePoint = acc.lastTimePoint
                const delta = currentTimePoint.sub(lastTimePoint)
                return { delta, value, lastTimePoint: currentTimePoint}
            }, initialState )
    }


    const timeStamp: T['timeStamp'] = () => Push( receiver => {
        _addTimeInformation()
        .map( state => ({
            value: state.value as A,
            interval: state.delta as Duration,
        }))
    })

    const timeInterval: T['timeInterval'] = () => 
        _addTimeInformation()
        .map( state => ({
            value: state.value as A,
            interval: state.delta as Duration,
        }))

    const take: T['take'] = size => Push(receiver => {
        let taken = 0
        emitter( a => {
            type A = typeof a
            taken = taken + 1
            if(taken <= size ) {
                receiver(Either_.fromRight(a))
            } else {
                receiver(Either_.fromLeft('eof'))
            }
            
        })
    })

    

    return {
        kind: 'Push',
        unsafeRun,
        map,
        step,
        filter,
        fork,
        scan,
        transform,
        //flatten: flatten,
        tap: tap,
        dropletWith: dropletWith,
        ignoreAll,
        collect,
        // combinators
        combineWith: combineWith,

        // utils
        timeStamp,
        timeInterval,
        take,
    }
}


// static part

export type Push_ = {
    fromArray: <A>(arr: readonly A[]) => Push<A>
    fromInterval: <A>(intervals: Pull<number>) => Push<Iterated<number>>
    //intervalG: <A>(f:(seq: number) => number, totalSeqs?: number) => Push<number> //attention f: must be monotonic function else behaviour should be unexpected (https://en.wikipedia.org/wiki/Monotonic_function)
    //NOTE: concat is the flatten
    // Fix: Maybe I can construct a droplet on dynamic part, just by infering in run time if its an array and in case it is flatten it, else just pass data forward as is. 
    droplet: <A>(mma: Push<readonly A[]>) => Push<A>
    concat: <A>(mma: Push<Push<A>>) => Push<A>
    range: (initialIncluded: number, finalNotIncluded: number, step: number) => Push<number>
}

type T = Push_

const fromArray: T['fromArray'] = arr => Push(receiver => {
    arr.map(receiver)
})

const fromInterval: T['fromInterval'] = intervals => Push( receiver => {
    const itor = intervals.unsafeRun()
    const timer = (timeout: number, run: () => void) => setTimeout( run, timeout)

    const loop = () => {
        //Fix: should use tail call optimization ADT for memory safety.
        const i = itor.next()
        if(i.done!==true) {
            receiver(i)
            timer(i.value, loop)
        }
    }

    loop(); //start loop
    //Note: Each step is created only after previous step has been finished.
    //      This reduce any overload into run-time scheduler
    


})

const droplet: T['droplet'] = mma => Push( receiver => {
    mma.unsafeRun( ar => {
        ar.map(receiver)
    })
})

const concat: T['concat'] = mma => Push( receiver => {
    mma.unsafeRun( pa => {
        pa.unsafeRun( a => {
            receiver(a)
        })
    })
}) 

const range: T['range'] = (ini, end, step) => Push( yield_ => {
    //fix: use a safer algorithm, should use ../utils/range.ts ? 
    for (let k=ini; k<end; k=k+step) {
        yield_(k)
    }
    
})

export const Push_: Push_ = {
    fromArray,
    fromInterval,
    //intervalG,
    droplet,
    concat,
    range,
}


