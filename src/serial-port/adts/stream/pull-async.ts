import { Future, InferFuture } from "../future"
import { Maybe, Maybe_ } from "../maybe"
import { Push } from "../push-stream"
import { Iterated } from './pull'

//IMPORTANT: there are some TCO (tail-call-optimization) issues in some streams, 
//           tests with huge data may verify robustness, also look for tags like 'TCO, tail-call-optimization, etc' along files of code

// represents same data stream that may finish
// FIX: I'm using this concept not only with pull but in push, should exists a better name
export type IteratedAsync<A> = ReturnType<PullWorld<A>['next']>

export type PullWorld<A> = ReturnType<PullAsync<A>['unsafeRun']>

export type PullAsync<A> = {
    kind: 'PullAsync'
    unsafeRun: () => {
        next: () => Future<{ done: false, value: A } | { done: true, value: undefined }>
    }
    unsafeRunM: () => {
        next: () => Future<Maybe<A>>
    } 
    forEach: (f: (_:A) => void) => Future<void>
  
    //map: <B>(f: (_:A) => B) => PullAsync<B>
    //scan: <B>(reducer: (acc:B, cur: A) => Future<B>, initial: Future<B>) => PullAsync<B>

    // tools
    //pushWith: <B>(p: Push<B>) => Push<[IteratedAsync<A>,B]>

    pushWith: <B>(p: Push<B>) => Push<[Iterated<A>,B]>
}

export const PullAsync = <A>(world: () => PullWorld<A>): PullAsync<A> => {

    type T = PullAsync<A>

    //fix: all adts should have a constant name convention to {AdtName}World, {AdtName}unsaferun(), etc
    const unsafeRun: T['unsafeRun'] = world

    const unsafeRunM: T['unsafeRunM'] = () => {
        const itor = unsafeRun()
        const toMaybe = <A>(it: Iterated<A>): Maybe<A> => {
            return it.done===false 
                ? Maybe_.fromJust(it.value)
                : Maybe_.fromNothing()
        }
        return {
            next: () => itor.next().map(toMaybe)
        }
    }

    
    const forEach: T['forEach'] = f => Future( yield_ => {
        const itor = world()

        //bugfix: this call recursion can generate stack fail. I should use tail-call-optimization Adt instead, but it is not implemented yet
        const repeat = () => {
            itor.next().unsafeRun( i => {
                if(i.done===false) {
                    f(i.value)
                    repeat()
                } else {
                    yield_(undefined)

                }
            })
        }
       
        repeat();
    }) 
    /*
    // !! you can test bellow code, it should works !!
    
    const map: T['map'] = f => PullAsync( () => {
        const itor = world()
        return {
            next: () => {
                const it = itor.next()
                const r = it.map( i => {
                    if(i.done===false) {
                        const a = i.value
                        const value = f(a)
                        return {...i, value}
                    } else {
                        //done===true
                        return i
                    }
                })
                return r 
            }
        }
    })

    const scan: T['scan'] = (f,ini) =>  PullAsync( () => {
        type B = InferFuture<ReturnType<typeof f>>
        let isFirstRun = false
        let acc: Future<B> | undefined = undefined
        const run = <A,B>(b_:Future<B>, a:A, f: (acc: B, cur: A) => Future<B>):Future<B> => {
            return b_.fmap( b => f(b,a))
        }

        return {
            next: () => Future( yield_ => {
                    // fix: to be implemented
            })
        }
    })

             */

    const pushWith: T['pushWith'] = p => Push( receiver => {
        const itor = unsafeRun()
        p.unsafeRun( b => {
            const it_ = itor.next()
            it_.unsafeRun( it => {
                receiver([it,b])
            })
        })
    })


    return {
        kind: 'PullAsync',
        unsafeRun,
        unsafeRunM,
        forEach,
        //forEach,
        //map,
        //scan,
        pushWith,

    }
}


export type PullAsync_ = {
    //range: (ini: number, end:number, step: number) => Pull<number>
    fromArray: <A>(arr: readonly A[]) => PullAsync<A>
    //makeIntervals: (intervals: Pull<number>) => Pull<Future<number>> // each number pulled is used to configure a timeout in relation from the last one
}

type T = PullAsync_

//fix: arr should be not empty ?
const fromArray: T['fromArray'] = arr => PullAsync( () => {
    let buf = [...arr]
    type A = typeof buf extends (infer A)[] ? A : never
    return {
        next: () => Future( yield_ => {
            if(buf.length===0) { //empty? 
                yield_({ done: true, value: undefined })
            } else {
                yield_({ done: false, value: buf.shift() as A})
            }
        })        
    }
})

export const PullAsync_: PullAsync_ = {
    fromArray,
}

/* // trecho do Future.Scan, primeira tentativa, deixei aqui pra comparar depois
                Future( yield_ => {
                    const it_ = itor.next()
                    it_.unsafeRun( it => {
                        if(it.done===false) {
                            if(isFirstRun===true) {
                                ini.unsafeRun( b => {
                                    const a = it.value
                                    const b_ = f(b,a);
                                    b_.unsafeRun( b__ => {
                                        b_cached = b
                                        yield_({...it,value: b__})
                                    })
                                })
                            } else {
                                // is not first run

                            }
                               
                        } else {
                            yield_(it)
                        }
                    })
                 }*/
