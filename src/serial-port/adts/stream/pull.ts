

export type PullWorld<A> = ReturnType<Pull<A>['unsafeRun']>

export type Pull<A> = {
    kind: 'Pull'
    unsafeRun: () => {
        next: () => { done: false, value: A } | { done: true, value: undefined }
    }

    map: <B>(f: (_:A) => B) => Pull<B>
}

export const Pull = <A>(world: () => PullWorld<A>): Pull<A> => {

    type T = Pull<A>

    const unsafeRun: T['unsafeRun'] = world

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

  

    return {
        kind: 'Pull',
        unsafeRun,
        map,
    }
}


export type Pull_ = {
    //range: (ini: number, end:number, step: number) => Pull<number>
    fromArray: <A>(arr: readonly A[]) => Pull<A>
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
