import { InferInterface } from '../type-utils/interface-utils'

//
// A kind is a nominal type. I can differentiate between type 'number' and 'Byte', or 'string' and 'Email'
//

export type KindType = {
    Key: string
    Value: unknown
}

// ================== KINDED INTERFACE =======================================================================
//Fix: A kinded interface should have a property named '__KI_CONTEXT__' that contains the name of the interface
//     this helps to reduce the need to long description on each messages of the interface that MUST includes
//     the name of interface. (This is a kind of namespace or scope for the KindedInterface concept)
//Fix: Eventually the 'kinded interface' should be extracted to another file (I'm not sure now)
namespace KindedInterface_ {
    //NOTE: A 'kinded interface' is an interface that represents a set of possible kinded constructions
    //      It's useful for example for event creation and safe type convertion among other things.
    //      See: the constructor 'Kind_.fromInterface' for more
    type KindedInterface = {[K in KindType['Key']]: KindType['Value']}
    export type Type = KindedInterface // short alias for exporting
    //helpers for 'Kinded interface' inference and kind construction 
    export type GetKeys<U extends KindedInterface> = InferInterface.GetKeys<U,KindType['Key']>
    export type GetValueByKey<U extends KindedInterface, K extends GetKeys<U>> = InferInterface.GetValueByKey<U,KindType['Key'],K>
    export type InferKinds<U extends KindedInterface> =  {
        [K in GetKeys<U>]: Kinded<K,GetValueByKey<U,K>>
    }[GetKeys<U>]
}

//helper aliases
export type KindedInterface = KindedInterface_.Type
export type GetKeys<U extends KindedInterface> = KindedInterface_.GetKeys<U>
export type GetValueByKey<U extends KindedInterface, K extends GetKeys<U>> = KindedInterface_.GetValueByKey<U,K>
export type InferKinds<U extends KindedInterface> = KindedInterface_.InferKinds<U>

// =============================================================================================================

// local aliases
type TypeOfKey = KindType['Key']
type Value = KindType['Value']


export type KindedWorld<K extends TypeOfKey, A extends Value> = ReturnType<Kinded<K,A>['unsafeRun']>

export type InferKinded<T extends Kinded> = T extends Kinded<infer K, infer A> ? [K,A] : never

export type Kinded<K extends TypeOfKey = TypeOfKey, A extends Value = Value> = {
    kind: 'Kinded'
    unsafeRun: () => [kind: K, value: A] // Fix: The kind should return an object instead of an tuple (appears to produce code more esiear for this case )
    unsafeRunV: () => A
    unsafeRunK: () => K
    map: <K1 extends TypeOfKey, B extends Value>(f: (kind: K, value: A) => [kind: K1, value: B]) => Kinded<K1,B>
    //fmap: <K1 extends string, B>(f: (kind: K, value: A) => Kinded) => Kinded<K1,B>
    mapKind: <K1 extends TypeOfKey>(f: (_:K) => K1) => Kinded<K1,A>
    mapValue: <B extends Value>(f: (_:A) => B) => Kinded<K,B>
}

export const Kinded = <K extends TypeOfKey, A extends Value>(world: () => KindedWorld<K,A>): Kinded<K,A> => {
    
    type T = Kinded<K,A>

    const unsafeRun: T['unsafeRun'] = world
    const unsafeRunV: T['unsafeRunV'] = () => unsafeRun()[1]
    const unsafeRunK: T['unsafeRunK'] = () => unsafeRun()[0]

    const map: T['map'] = f => Kinded( () => {
        const [kind, a] = unsafeRun()
        const [newKind, b] = f(kind, a)
        return [newKind, b]
    })

    const mapKind: T['mapKind'] = f => map( (kind, value) => {
        const newKind = f(kind)
        return [newKind, value]
    })

    const mapValue: T['mapValue'] = f => map( (kind, value) => {
        const newValue = f(value)
        return [kind, newValue]
    })
    
    return {
        kind: 'Kinded',
        unsafeRun,
        unsafeRunV,
        unsafeRunK,
        map,
        mapKind,
        mapValue,
    }
}

// static part



export type Kinded_ = {
    //fix: eventually this should be generalized or decoupled from AmongInterface
    fromInterface: <U extends KindedInterface>() => <K extends GetKeys<U>, V extends GetValueByKey<U,K>>(key: K, value: V) => Kinded<K,V>
    value: <K extends string, A>(kind: K, value: A) => Kinded<K,A>
    flatten: <K1 extends string,K2 extends string,A>(mma: Kinded<K1, Kinded<K2, A>>) => Kinded<`${K1}/${K2}`, A>
} 

type T = Kinded_

const value: T['value'] = (kind, value) => Kinded( () => [kind, value])

const flatten: T['flatten'] = mma => Kinded( () => {
    const [k1, ma] = mma.unsafeRun()
    const [k2, a] = ma.unsafeRun()
    const newK = `${k1}/${k2}` as const
    return [newK,a]
    
})

const fromInterface: T['fromInterface'] = () => (kind, value) => Kinded_.value(kind,value)

export const Kinded_ : Kinded_ = {
    value,
    flatten,
    fromInterface,
}
