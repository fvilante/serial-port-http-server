import { GetKeys, GetValueByKey, InferKinds, Kinded, KindedInterface, Kinded_ } from '../validated/kind'


//helper aliases for 'kinded interface'

export type AmongMatcher<T extends KindedInterface,X> = {
    [K in GetKeys<T>]: (value: GetValueByKey<T,K>, label: K) => X
}

type AmongWorld<U extends KindedInterface> = ReturnType<InferKinds<U>['unsafeRun']>

export type Among<U extends KindedInterface> = {
    kind: 'Among'
    // unsafe part
    unsafeRun: () => AmongWorld<U>
    matchAll: <X>(m: AmongMatcher<U,X>) => X
    // safe part
    mapAllSync: <V extends KindedInterface>(f: AmongMatcher<U,Among<V>>) => Among<V> 
}

export const Among = <U extends KindedInterface>(world: () => AmongWorld<U>): Among<U> => {

    type T = Among<U>

    const unsafeRun: T['unsafeRun'] = world

    const matchAll: T['matchAll'] = matcher => {
        const [kind, value] = unsafeRun()
        const f = matcher[kind]
        const x = f(value, kind)
        return x
    }

    const mapAllSync: T['mapAllSync'] = matcher => Among( () => {
        const amongV = matchAll(matcher)
        const worldV = amongV.unsafeRun()
        return worldV
    })

    return {
        kind: 'Among',
        unsafeRun,
        matchAll: matchAll,
        mapAllSync: mapAllSync,
    }
}

// static part

export type Among_ = {
    fromKind: <U extends KindedInterface>(kinded: InferKinds<U>) => Among<U>
    fromInterface: <U extends KindedInterface>() => <K extends GetKeys<U>, V extends GetValueByKey<U,K>>(key: K, value: V) => Among<U>
    
}

type T = Among_

const fromKind: T['fromKind'] = kinded => Among(() => kinded.unsafeRun() as any) //fix: confirm if this any is really necessary. Probably it is because i'm casting to the AmongInterface (which is an artificial casting naturally)
const fromInterface: T['fromInterface'] = () => (key, value) => fromKind(Kinded_.value(key, value))

export const Among_: Among_ = {
    fromKind: fromKind,
    fromInterface,
}