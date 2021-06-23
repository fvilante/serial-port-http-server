import { Either, Either_ } from "../maybe/either";
import { InferIterated, Iterated } from "./pull";


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
    _forNext: (f: (next: A) => void) => void
    _forDone: (f: (done: R) => void) => void
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

    const _forNext: T['_forNext'] = f => {
        match({
            Next: value => f(value),
            Done: value => undefined,
        })
    }

    const _forDone: T['_forDone'] = f => {
        match({
            Next: value => undefined,
            Done: value => f(value),
        })
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
        _forNext,
        _forDone,
        match,
        mapNext,
        mapDone,
    }
}

export type Finishable_ = {
    _fromIterated: <A,R>(_:Iterated<A,R>) => Finishable<A,R> // Attention: From this construction you need to specify type param 'A' and 'R' to get a good construction, because Typescript inference is not good here. (Aparently is the same case for Either_.left or Either_.right constructors)
    next: <A,R>(_:A) => Finishable<A,R>
    done: <A,R>(_:R) => Finishable<A,R>
}

export type T = Finishable_

const _fromIterated: T['_fromIterated'] = iter => Finishable(() => iter)

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
    _fromIterated: _fromIterated,
    next,
    done,
}
