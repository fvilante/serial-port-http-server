

// enhancers
export type HasComplete = Symbol
export const HasFinished: HasComplete = Symbol()
export type FinishablePush<A> = Push<A & HasComplete> 

// -------

import { Duration, TimePoint, TimePoint_ } from "../time"
import { now } from "../utils"
import { Either, Either_ } from "./maybe/either"

export type PushEmitter<A> = (receiver: (_:A) => void) => void 

export type InferPush<T extends Push<unknown>> = T extends Push<infer A> ? A : never

// Push stream
export type Push<A> = {
    kind: 'Push'
    //run: () => PushWorld<A>
    unsafeRun: (receiver: (_:A) => void) => void
    map: <B>(f: (_: A) => B) => Push<B>
    filter: (f: (_:A) => boolean) => Push<A>
    scan: <B>(reducer: (acc: B, cur: A) => B, initial: B) => Push<B>
    transform: <X>(f: (me:Push<A>) => X) => X
    //flatten: () => A extends Push<A> ? Push<A> : never
    //all: <T extends Push<unknown>[]>(arr: T) => PushAll<T>
    tap: (f: (_:A) => void) => Push<A> // tap-before
    dropletWith: (f: (_:A) => boolean) => Push<readonly A[]> //fix: f should be a State<A> or other type (ie: Pull<A>... etc)
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

    const filter: T['filter'] = f => Push( receiver => {
        emitter( a => {
            const condition = f(a)
            if(condition===true) {
                receiver(a);
            }
        })
    })

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

    /*const flatten: T['flatten'] = () => Push( receiver => {
        emitter( pa_ => {
            const pa = pa_ as unknown as Push<A>
            pa.unsafeRun( a => {
                receiver(a)
            })

        })
    }) as unknown as A extends Push<A> ? Push<A> : never
    */

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
        filter,
        scan,
        transform,
        //flatten: flatten,
        tap: tap,
        dropletWith: dropletWith,

        // combinators
        combineWith: combineWith,

        // utils
        timeStamp,
        timeInterval,
        take,
    }
}

export type Push_ = {
    concat: <A>(mma: Push<Push<A>>) => Push<A>
}

type T = Push_

const concat: T['concat'] = mma => Push( receiver => {
        mma.unsafeRun( pa => {
            pa.unsafeRun( a => {
                receiver(a)
            })
        })
    }) 


export const Push_: Push_ = {
    concat,
}
