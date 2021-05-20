//
// A kind is a nominal type. I can differentiate between type 'number' and 'Byte', or 'string' and 'Email'
//

export type KindedWorld<K extends string, A> = ReturnType<Kinded<K,A>['unsafeRun']>

export type InferKinded<T extends Kinded> = T extends Kinded<infer K, infer A> ? [K,A] : never

export type Kinded<K extends string = string, A = unknown> = {
    kind: 'Kinded'
    unsafeRun: () => [kind: K, value: A]
    unsafeRunV: () => A
    unsafeRunK: () => K
    map: <K1 extends string, B>(f: (kind: K, value: A) => [kind: K1, value: B]) => Kinded<K1,B>
    //fmap: <K1 extends string, B>(f: (kind: K, value: A) => Kinded) => Kinded<K1,B>
    mapKind: <K1 extends string>(f: (_:K) => K1) => Kinded<K1,A>
    mapValue: <B>(f: (_:A) => B) => Kinded<K,B>
}

export const Kinded = <K extends string, A>(world: () => KindedWorld<K,A>): Kinded<K,A> => {
    
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

export const Kinded_ : Kinded_ = {
    value,
    flatten,
}
