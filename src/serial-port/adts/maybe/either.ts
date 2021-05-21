
export type EitherWorld<A,B> = ReturnType<Either<A,B>['unsafeRun']>


export type Either<A,B> = {
    kind: 'Either'
    unsafeRun: () => { isLeft: true, value: A } | { isLeft: false, value: B }
    transform: <X>(f: (this_: Either<A,B>) => X) => X
    bimap: <C,D>(f: (_:A) => C, g: (_:B) => D) => Either<C,D>
    mapLeft: <C>(f: (_:A) => C) => Either<C,B>
    mapRight: <D>(g: (_:B) => D) => Either<A,D>
}

export type InferEither<T extends Either<unknown, unknown>> = T extends Either<infer A, infer B> ? [left: A, right: B] : never

export const Either = <A,B>(world: () => EitherWorld<A,B>): Either<A,B> => {

    type T = Either<A,B>

    const id = <A>(a:A) => a

    const unsafeRun: T['unsafeRun'] = () => world()

    const transform: T['transform'] = f => f(Either(world))

    const bimap: T['bimap'] = (f,g) => Either( () => {
        type C = ReturnType<typeof f>
        type D = ReturnType<typeof g>
        const a = unsafeRun()
        const value_ = a.isLeft ? f(a.value) : g(a.value)
        return a.isLeft
            ? { isLeft: a.isLeft, value: f(a.value)} as EitherWorld<C,D>
            : { isLeft: a.isLeft, value: g(a.value)} as EitherWorld<C,D>
            
    })

    const mapLeft: T['mapLeft'] = f => bimap(f,id)
    const mapRight: T['mapRight'] = g => bimap(id,g)

    return {
        kind: 'Either',
        unsafeRun,
        transform,
        bimap,
        mapLeft,
        mapRight,
    } 
    
}

export type Either_ = {
    fromLeft: <A,B>(value: A) => Either<A,B> // FIX: I'm in doubt if this is necessary to be a lazy value or not. Decide on future.
    fromRight: <A,B>(value: B) => Either<A,B>
    flattenLeft: <A,B>(mma: Either<Either<A,B>,B>) => Either<A,B>
    flattenRight: <A,B>(mma: Either<A,Either<A,B>>) => Either<A,B>
}

type T = Either_

const fromLeft: T['fromLeft'] = <A,B>(value: A) => Either<A,B>(() => ({ isLeft: true, value}) )
const fromRight: T['fromRight'] = <A,B>(value: B) => Either<A,B>(() => ({ isLeft: false, value}) )

const flattenLeft: T['flattenLeft'] = <A, B>(mma: Either<Either<A, B>, B>) => Either<A, B>( () => {
    const s0 = mma.unsafeRun()
    if (s0.isLeft===false) {
        const b = s0.value
        return { isLeft: false, value: b }
    } else {
        const ma = s0.value
        return ma.unsafeRun()
    }
})

const flattenRight: T['flattenRight'] = <A, B>(mma: Either<A, Either<A, B>>) => Either<A, B>( () => {
    const s0 = mma.unsafeRun()
    if (s0.isLeft===true) {
        const a = s0.value
        return { isLeft: true, value: a }
    } else {
        const ma = s0.value
        return ma.unsafeRun()
    }
})


export const Either_ : Either_ = {
    fromLeft,
    fromRight,
    flattenLeft,
    flattenRight,
}

