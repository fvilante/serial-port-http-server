
type RefWorld<A> = ReturnType<Ref<A>['unsafeRun']>

export type Ref<A> = {
    kind: 'Ref'
    //unsafe
    write: (_:A) => void
    read: () => A
    update: (f:(current: A) => A) => void 
    updateAndGet: (f: (current: A) => A) => [new: A, old:A]
    unsafeRun: () =>  { write: (_:A) => void, read: () => A }
    //safe
    promap: <B>(f: (_:A) => B, g: (_:B) => A) => Ref<B>
    
}

export const Ref = <A>(world: () => RefWorld<A>): Ref<A> => {

    type T = Ref<A>

    const unsafeRun: T['unsafeRun'] = world

    const write: T['write'] = a => unsafeRun().write(a)

    const read: T['read'] = () => unsafeRun().read()

    const promap: T['promap'] = (f,g) => {
        type B = ReturnType<typeof f>
        return Ref<B>(() => ({
            write: b => unsafeRun().write(g(b)),
            read: () => f(world().read()),
        }))
    }

    const update: T['update'] = f => {
        const a = read()
        const newA = f(a);
        write(newA);
    } 

    const updateAndGet: T['updateAndGet'] = f => {
        const oldA = read()
        const newA = f(oldA);
        write(newA);
        return [newA, oldA]
    } 

    return {
        kind: 'Ref',
        write: write,
        read: read,
        update,
        updateAndGet,
        unsafeRun,
        promap,
    }
}

// static part

export type Ref_ = {
    fromLet: <A>(initialValue: A) => Ref<A>
}

type T = Ref_

const fromLet: T['fromLet'] = <A>(initialValue:A) => {
    let data: A = initialValue
    return Ref(() => ({
        read: () => data,
        write: a => {data = a},
    }))
}

export const Ref_ : Ref_ = {
    fromLet,
}