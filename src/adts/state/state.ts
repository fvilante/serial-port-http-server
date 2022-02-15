
type StateWorld<S,A> = (currentState: S, byte: A) => S

export type State<S,A> = {
    readonly kind: 'State'
    readonly unsafeRun: (currentState: S, byte: A) => S 
}

export const State = <S,A>(world: StateWorld<S,A>): State<S,A> => {

    type T = State<S,A>

    const unsafeRun: T['unsafeRun'] = (currentState, byte) => {
        const nextState = world(currentState, byte)
        return nextState
    }

    return {
        kind: 'State',
        unsafeRun,

    }
}

type State_ = {

}

type T = State_


const State_: State_ = {

}