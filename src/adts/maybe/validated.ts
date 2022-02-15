import { NothingObject } from "../maybe"

// DOC
//
// Like a Maybe, but with a invalid message in case of nothing

export type InvalidationMesssages = readonly string[]

export type ValidatedWorld<A> = 
    | { isValid: true, value: A } 
    | { isValid: false, invalidationMessages: InvalidationMesssages }

export type ValidatedMatcher<A,T> = {
    valid: (value:A) => T
    invalid: (invalidationMessages: readonly string[]) => T
}

export type Validated<A> = {
    kind: 'Validated'
    unsafeRun: () => ValidatedWorld<A>
    valueOrThrow: () => A   //NOTE: it throws with the invalidation messages
    forEach: (f: (_:A) => void) => void //TODO: This method seems to not make sense
    match: <T>(f: ValidatedMatcher<A,T>) => T
    transform: <X>(f: (this_: Validated<A>) => X) => X
    map: <B>(f: (_:A) => B) => Validated<B>
    fmap: <B>(f: (_:A) => Validated<B>) => Validated<B>
    tap: (f: (_:A) => void) => Validated<A>
}

export type InferValidated<T extends Validated<unknown>> = T extends Validated<infer R> ? R : never

export const Validated = <A>(world: () => ValidatedWorld<A>): Validated<A> => {

    type T = Validated<A>

    const unsafeRun: T['unsafeRun'] = () => world()

    const valueOrThrow: T['valueOrThrow']  = () => {
        const m = world()
        if(m.isValid) {
            return m.value
        } else {
            const msg = String(m.invalidationMessages)
            throw new Error(msg)
        }
    }

    const forEach: T['forEach'] = f => {
        const maybeValue = world()
        const hasValue = maybeValue.isValid
        if(hasValue===true) {
            const value = maybeValue.value 
            f(value);
        } else {
            // nop
        }
    }

    const match: T['match'] = m => {
        const r = unsafeRun()
        return r.isValid 
            ? m.valid(r.value)
            : m.invalid(r.invalidationMessages)
    }

    const transform: T['transform'] = f => f(Validated(world))

    const map: T['map'] = f => {
        return Validated( () => {
            const r = unsafeRun()
            const isNothing = r.isValid === false
            return isNothing   
                ? { ...r }
                : { isValid: true,  value: f(r.value) }
            })
    }

    const fmap: T['fmap'] = f => Validated_.flatten( map(f) )
    
    const tap: T['tap'] = f => map( a => {
        f(a); //run effect before
        return a
    })

    return {
        kind: 'Validated',
        unsafeRun,
        valueOrThrow,
        forEach,
        match,
        transform,
        map,
        fmap,
        tap,
    }
}

type ValidatedAllResult<T extends readonly Validated<unknown>[]> = {
    [K in keyof T]: T[K] extends Validated<infer R> ? R : never
}

export type Validated_ = {
    fromValid: <A>(value: A) => Validated<A>
    fromInvalid: <A>(invalidationMessages: readonly string[]) => Validated<A>
    //fromPossibleUndefined: <A>(a: A | undefined) => Validated<A>
    flatten: <A>(mma: Validated<Validated<A>>) => Validated<A>
}

type T = Validated_

const fromValid: T['fromValid'] = value => Validated( () => ({ isValid: true, value}))

const fromInvalid: T['fromInvalid'] = <A>(invalidationMessages: readonly string[]) => Validated( () => ({ isValid: false, invalidationMessages})) 

/*const fromPossibleUndefined: T['fromPossibleUndefined'] = <A>(aOrUndefined: A | undefined) => {
    if(aOrUndefined===undefined) {
        return fromInvalid<A>()
    } else {
        return fromValid<A>(aOrUndefined)
    }
}*/

const flatten: T['flatten'] = mma => {
    type A = InferValidated<InferValidated<typeof mma>>
    const ma = mma.unsafeRun()
    if(ma.isValid===false)
        return Validated( () => ({ isValid: false, invalidationMessages: ma.invalidationMessages })) 
    else {
        const v = ma.value
        return v
    }
}

export const Validated_: Validated_ = {
    fromValid,
    fromInvalid,
    //fromPossibleUndefined,
    flatten,
}

// alias
export const Valid = <A>(value: A):Validated<A> => Validated_.fromValid(value)
export const Invalid = <A>(invalidatedMessages: readonly string[]): Validated<A> => Validated_.fromInvalid(invalidatedMessages)