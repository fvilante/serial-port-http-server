import { Push } from "../push-stream"

// represents same data stream that may finish
// FIX: I'm using this concept not only with pull but in push, should exists a better name
// FIX: Extracted Iterated to a ADT named Iterated<A>
export type Iterated<A,R = void> = 
    | { done: false, value: A } 
    | { done: true, value: R }

//ReturnType<PullWorld<A>['next']>

export type PullWorld<A> = ReturnType<Pull<A>['unsafeRun']>

export type Pull<A,R = void> = {
    kind: 'Pull'
    unsafeRun: () => {
        next: () => Iterated<A,R>
    }
    forEach: (f: (_:A) => void) => void
    map: <B>(f: (_:A) => B) => Pull<B>
    //scanA: <B>(reducer: (acc:B, cur: A) => Future<B>, initial: Future<B>) => Pull<B>

    // tools
    pushWith: <B>(p: Push<B>) => Push<[Iterated<A>,B]>
}

export const Pull = <A>(world: () => PullWorld<A>): Pull<A> => {

    type T = Pull<A>

    const unsafeRun: T['unsafeRun'] = world

    const forEach: T['forEach'] = f => {
        const itor = world()
        let i = itor.next()
        while(i.done===false) {
            f(i.value as A)
            i = itor.next()
        }
    }

    const map: T['map'] = f => Pull( () => {
        const itor = unsafeRun()
        return {
            next: () => {
                const it = itor.next()
                return it.done === false 
                    ? {done: false, value: f(it.value) }
                    : it
                }
            }
        })

        //fix: rename this call to 'pullWith' instead 'pushWith'. I think it would be better
        const pushWith: T['pushWith'] = p => Push( receiver => {
            const itor = unsafeRun()
            p.unsafeRun( b => {
                receiver([itor.next(), b])
            })
        })

    return {
        kind: 'Pull',
        unsafeRun,
        forEach,
        map,
        pushWith,
    }
}


export type Pull_ = {
    //range: (ini: number, end:number, step: number) => Pull<number>
    fromArray: <A>(arr: readonly A[]) => Pull<A>
    //makeIntervals: (intervals: Pull<number>) => Pull<Future<number>> // each number pulled is used to configure a timeout in relation from the last one
}

type T = Pull_

//fix: arr should be not empty ?
const fromArray: T['fromArray'] = arr => {
    return Pull( () => {
        let buf = [...arr]
        type A = typeof buf extends (infer A)[] ? A : never
        return {
            next: () => {
                const nextValue = buf.shift()
                const done = nextValue===undefined ? true : false
                const value = done===true ? undefined : nextValue
                if(done===false) {
                    return ({done: false, value: value as A} as Iterated<A>)
                } else {
                    //is done
                    return ({done: true, value} as Iterated<A>)
                }
            }     
        }
    })
}
export const Pull_: Pull_ = {
    fromArray,
}
