import { Push } from "../push-stream"

// represents same data stream that may finish
// FIX: I'm using this concept not only with pull but in push, should exists a better name
export type Iterated<A> = ReturnType<PullWorld<A>['next']>

export type PullWorld<A> = ReturnType<Pull<A>['unsafeRun']>

export type Pull<A> = {
    kind: 'Pull'
    unsafeRun: () => {
        next: () => { done: false, value: A } | { done: true, value: undefined }
    }
    forEach: (f: (_:A) => void) => void
    map: <B>(f: (_:A) => B) => Pull<B>

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
const fromArray: T['fromArray'] = arr => Pull( () => {
    let buf = [...arr]
    type A = typeof buf extends (infer A)[] ? A : never
    return {
        next: () => 
            buf.length === 0 //empty?
                ? { done: true, value: undefined }
                : { done: false, value: buf.shift() as A},
            
        }
    })

export const Pull_: Pull_ = {
    fromArray,
}
