
type NothingObject = undefined // should be used 'Symbol', but it is a little bit slower
const NothingObject: NothingObject = undefined

export type MaybeWorld<A> = { hasValue: true, value: A } | { hasValue: false, value: NothingObject }

export type Maybe<A> = {
    kind: 'Maybe'
    unsafeRun: () => { hasValue: true, value: A } | { hasValue: false, value: NothingObject }
    forEach: (f: (_:A) => void) => void
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
    flatten: <A>(mma: Maybe<Maybe<A>>) => Maybe<A>
}

type T = Maybe_

const fromJust: T['fromJust'] = value => Maybe( () => ({ hasValue: true, value}))

const fromNothing: T['fromNothing'] = <A>() => Maybe( () => ({ hasValue: false, value: NothingObject})) as unknown as Maybe<A>

const flatten: T['flatten'] = mma => Maybe( () => {
    type A = InferMaybe<InferMaybe<typeof mma>>
    const ma = mma.unsafeRun()
    if(ma.hasValue===false)
        return { hasValue: false, value: NothingObject } 
    else 
        return { hasValue: true, value: ma.value.unsafeRun().value as A}
})

const Maybe_: Maybe_ = {
    fromJust,
    fromNothing,
    flatten,
}

export const Just = <A>(value: A):Maybe<A> => Maybe_.fromJust(value)
export const Nothing = <A>(): Maybe<A> => Maybe_.fromNothing()