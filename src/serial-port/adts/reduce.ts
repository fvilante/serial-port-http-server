import { Push } from "./push-stream"




export type Reduce<S,A> = {
    kind: 'Reduce'
    unsafeRun: () => S
    tapTransition: (f: (newState:S, value:A, lastState: S) => void) => Reduce<S,A>
}

// Synchronous reducer
export const Reduce = <S,A>(arr: readonly A[], initialState: S, reducer: (state:S, value:A) => S, onTransition: (newState:S, value:A, lastState: S) => void):Reduce<S,A> => {
    
    type T = Reduce<S,A>

    const unsafeRun: T['unsafeRun'] = () => {
        let state:S = initialState
        arr.forEach( value => {
            const newState = reducer(state, value)
            onTransition(newState,value,state);
            state = newState
        })
        return state
    }

    const tapTransition: T['tapTransition'] = f => {
        return Reduce(arr, initialState, reducer, f)
    }
    
    return {
        kind: 'Reduce',
        unsafeRun,
        tapTransition,
    }
}


export type Reduce_ = {
    fromArray: <A,S>(arr: readonly A[], initialState: S, reducer: (state:S, value:A) => S) => Reduce<S,A>
    fromArrayIso: <A>(arr: readonly A[], reducer: (state:A, value:A) => A) => Reduce<A,A>
}

type T = Reduce_

const fromArray: T['fromArray'] = (arr, initialState, reducer) => {
    return Reduce(arr, initialState, reducer, () => undefined)
}

const fromArrayIso: T['fromArrayIso'] = (arr, reducer) => {
    const [firstElement, ...rest] = arr
    const initialState = firstElement
    return Reduce(rest, initialState, reducer, () => undefined)
}

export const Reduce_: Reduce_ = {
    fromArray,
    fromArrayIso,
}


//

const Test1 = () => {

    // test constructor 'fromArray'

    const arr = [1,1,1,1,1,1,1,1,1,1] //sum=10
    const r = Reduce_
        .fromArray(arr, 1,(acc,cur) => acc+cur)
        .tapTransition( (newS, value, oldS) => {
            console.log(`newS=${newS}, value=${value}, oldS=${oldS}`)
        })
        .unsafeRun()

    console.log('final result=',r)


    // test constructor 'fromArrayIso'

    const arr_ = [2,0,1,1,1,1,1,1,1,1] //sum=10
    const r1 = Reduce_
        .fromArrayIso(arr_, (acc,cur) => acc+cur)
        .tapTransition( (newS, value, oldS) => {
            console.log(`newS=${newS}, value=${value}, oldS=${oldS}`)
        })
        .unsafeRun()

    console.log('final result=',r1)

}

//Test1();