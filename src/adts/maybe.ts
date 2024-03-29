
export type NothingObject = undefined // should be used 'Symbol', but it is a little bit slower
export const NothingObject: NothingObject = undefined

export type MaybeWorld<A> = ReturnType<Maybe<A>['unsafeRun']>

export type MaybeMatcher<A,T> = {
    Just: (value:A) => T
    Nothing: () => T
}

export type Maybe<A> = {
    kind: 'Maybe'
    unsafeRun: () => { hasValue: true, value: A } | { hasValue: false, value: NothingObject }
    forEach: (f: (_:A) => void) => void
    match: <T>(f: MaybeMatcher<A,T>) => T
    transform: <X>(f: (this_: Maybe<A>) => X) => X
    map: <B>(f: (_:A) => B) => Maybe<B>
    fmap: <B>(f: (_:A) => Maybe<B>) => Maybe<B>
    tap: (f: (_:A) => void) => Maybe<A>
}

export type InferMaybe<T extends Maybe<unknown>> = T extends Maybe<infer R> ? R : never

export const Maybe = <A>(world: () => MaybeWorld<A>): Maybe<A> => {

    type T = Maybe<A>

    const unsafeRun: T['unsafeRun'] = () => world()

    const forEach: T['forEach'] = f => {
        const maybeValue = world()
        const hasValue = maybeValue.hasValue
        if(hasValue===true) {
            const value = maybeValue.value as A
            f(value);
        } else {
            // nop
        }
    }

    const match: T['match'] = m => {
        const r = unsafeRun()
        return r.hasValue 
            ? m.Just(r.value)
            : m.Nothing()
    }

    const transform: T['transform'] = f => f(Maybe(world))

    const map: T['map'] = f => {
        return Maybe( () => {
            const r = unsafeRun()
            const isNothing = r.hasValue === false
            return isNothing   
                ? { hasValue: false, value: NothingObject }
                : { hasValue: true,  value: f(r.value as A) }
            })
    }

    const fmap: T['fmap'] = f => Maybe_.flatten( map(f) )
    
    const tap: T['tap'] = f => map( a => {
        f(a); //run effect before
        return a
    })

    return {
        kind: 'Maybe',
        unsafeRun,
        forEach,
        match,
        transform,
        map,
        fmap,
        tap,
    }
}

type MaybeAllResult<T extends readonly Maybe<unknown>[]> = {
    [K in keyof T]: T[K] extends Maybe<infer R> ? R : never
}

export type Maybe_ = {
    fromJust: <A>(value: A) => Maybe<A>
    fromNothing: <A>() => Maybe<A>
    fromPossibleUndefined: <A>(a: A | undefined) => Maybe<A>
    flatten: <A>(mma: Maybe<Maybe<A>>) => Maybe<A>
}

type T = Maybe_

const fromJust: T['fromJust'] = value => Maybe( () => ({ hasValue: true, value}))

const fromNothing: T['fromNothing'] = <A>() => Maybe( () => ({ hasValue: false, value: NothingObject})) as unknown as Maybe<A>

const fromPossibleUndefined: T['fromPossibleUndefined'] = <A>(aOrUndefined: A | undefined) => {
    if(aOrUndefined===undefined) {
        return fromNothing<A>()
    } else {
        return fromJust<A>(aOrUndefined)
    }
}

const flatten: T['flatten'] = mma => Maybe( () => {
    type A = InferMaybe<InferMaybe<typeof mma>>
    const ma = mma.unsafeRun()
    if(ma.hasValue===false)
        return { hasValue: false, value: NothingObject } 
    else 
        return { hasValue: true, value: ma.value.unsafeRun().value as A}
})

export const Maybe_: Maybe_ = {
    fromJust,
    fromNothing,
    fromPossibleUndefined,
    flatten,
}

export const Just = <A>(value: A):Maybe<A> => Maybe_.fromJust(value)
export const Nothing = <A>(): Maybe<A> => Maybe_.fromNothing()