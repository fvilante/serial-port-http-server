import { Result, Result_ } from '../result'
import { MapValueByKey } from '../type-utils/interface-utils'
import { GetKeys, GetValueByKey, InferKinds, Kinded, KindedInterface, Kinded_ } from '../validated/kind'


//helper aliases for 'kinded interface'

export type AmongMatcher<T extends KindedInterface,X> = {
    [K in GetKeys<T>]: (value: GetValueByKey<T,K>, label: K) => X
}

type InferAmong<T extends Among<KindedInterface>> = T extends Among<infer I> ? I : never

type AmongWorld<U extends KindedInterface> = ReturnType<InferKinds<U>['unsafeRun']>

// Fix: This flattening type is Not implemented but works. 
//      I'm studying the best form to flatenning the among interface, and to unsafeRunDeep
type AmongDeepUnsafeRun<U extends KindedInterface> = {
    [K in keyof U]: U[K] extends Among<infer I>
        ? AmongDeepUnsafeRun<I>
        : U[K]
}


export type Among<U extends KindedInterface> = {
    kind: 'Among'
    // unsafe part
    unsafeRun: () => AmongWorld<U>
    matchAll: <X>(m: AmongMatcher<U,X>) => X
    // safe part
    mapAllSync: <V extends KindedInterface>(f: AmongMatcher<U,Among<V>>) => Among<V>
    mapByKey: <K extends GetKeys<U>,B>(kind: K, f: (value: GetValueByKey<U,K>) => B) => Among<MapValueByKey<U,K,B>>
    _select: <K extends GetKeys<U>>(kind: K) => Result<Kinded<K, GetValueByKey<U,K>>, Error>
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

    const mapByKey: T['mapByKey'] = (kind, f) => Among( () => {
        const x = unsafeRun()
        const [kind_, value] = x
        if(kind===kind_) {
            const newValue = f(value as unknown as any) // fix: try to remove of check if it is safe to use this 'any' cast here
            return [kind, newValue] as unknown as any // fix: see comment above
        } else {
            return x as unknown as any //fix see comment above
        }
    })

    const _select: T['_select'] = kind  => {
        return Result( () => {
            const x = unsafeRun()
            const [kind_, value] = x
            if (x[0]===kind) {
                return Result_.Ok<any,Error>(Kinded_.fromInterface<U>()(kind_, value) as any).unsafeRun()
            }
            else  {
                const errorMessage = `Unsuccessful atempt to access key ${kind} in Among<U> ADT. This key dos not exists. Instead the concrete Among resolves to key=${kind_}, and value="${String(value)}"`
                return Result_.Error<any,Error>(new Error(errorMessage)).unsafeRun()
            }
        })
    }

    return {
        kind: 'Among',
        unsafeRun,
        matchAll: matchAll,
        mapAllSync: mapAllSync,
        mapByKey,
        _select,
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