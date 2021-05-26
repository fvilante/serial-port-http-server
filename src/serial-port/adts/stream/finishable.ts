import { Either, Either_ } from "../maybe/either";
import { Iterated } from "./pull";


// Purpose: ADT for an iterated value which is Finishible

// helper - Conventioned to use an either as isomorphism for implemantation, where: done is either-right, next is either-left
type Isomorphism = {
    toEither: <A,R>(_:Finishable<A,R>) => Either<A,R>
    fromEither: <A,R>(_:Either<A,R>) => Finishable<A,R>
}

const iso: Isomorphism = {
    toEither: fin => {
        return fin.match({
            Next: val => Either_.fromLeft(val),
            Done: res => Either_.fromRight(res),
        })
    },
    fromEither: eit => {
        return eit.match({
            Left: val => Finishable_.next(val),
            Right: val => Finishable_.done(val),
        })
    }
}

type FinishableWorld<A,R> = Iterated<A,R>

type FinishableMatcher<A,R,X> = {
    Next: (_:A) => X,
    Done: (_:R) => X,
}

export type Finishable<A,R = void> = {
    kind: 'Finishable'
    unsafeRun: () => Iterated<A,R>
    forEach: (m: FinishableMatcher<A,R,void>) => void
    match: <X>(m: FinishableMatcher<A,R,X>) => X
    mapNext: <B>(f: (_:A) => B) => Finishable<B,R>
    mapDone: <R1>(f: (_:R) => R1) => Finishable<A,R1>
}

export const Finishable = <A,R = void>(world: () => Iterated<A,R>): Finishable<A,R> => {

    type T = Finishable<A,R>

    const unsafeRun: T['unsafeRun'] = world

    const forEach: T['forEach'] = m => {
        match(m)
    }

    const match: T['match'] = m => {
        const a = unsafeRun();
        if (a.done===false) {
            return m.Next(a.value)
        } else {
            //done
            return m.Done(a.value)
        }
    }

    const mapNext: T['mapNext'] = f => {
        const id = Finishable(world)
        const ei = iso.toEither(id)
        const mapped = ei.mapLeft(f)
        const r = iso.fromEither(mapped)
        return r
    }

    const mapDone: T['mapDone'] = f => {
        const id = Finishable(world)
        const ei = iso.toEither(id)
        const mapped = ei.mapRight(f)
        const r = iso.fromEither(mapped)
        return r
    }



    return {
        kind: 'Finishable',
        unsafeRun,
        forEach,
        match,
        mapNext,
        mapDone,
    }
}

export type Finishable_ = {
    next: <A,R>(_:A) => Finishable<A,R>
    done: <A,R>(_:R) => Finishable<A,R>
}

export type T = Finishable_

const next: T['next'] = <A, R>(value: A):Finishable<A, R> => {
    return Finishable<A,R>( () => ({
        done: false,
        value: value,
    }))
}

const done: T['done'] = <A, R>(value: R):Finishable<A, R> => {
    return Finishable<A,R>( () => ({
        done: true,
        value: value,
    }))
}

export const Finishable_: Finishable_ = {
    next,
    done,
}
