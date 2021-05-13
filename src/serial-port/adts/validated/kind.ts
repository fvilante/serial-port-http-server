//
// A kind is a nominal type. I can differentiate between type 'number' and 'Byte', or 'string' and 'Email'
//

export type KindedWorld<K extends string, A> = ReturnType<Kinded<K,A>['unsafeRun']>

export type Kinded<K extends string = string, A = unknown> = {
    unsafeRun: () => [kind: K, value: A]
    //mapKind: <K1 extends string>(f: (_:K) => K1) => Kinded<K1,A>
    //mapValue: <B>(f: (_:A) => B) => Kinded<K,B>
}

export const Kinded = <K extends string, A>(world: () => KindedWorld<K,A>): Kinded<K,A> => {
    
    type T = Kinded<K,A>

    const unsafeRun: T['unsafeRun'] = world
    
    return {
        unsafeRun
    }
}
