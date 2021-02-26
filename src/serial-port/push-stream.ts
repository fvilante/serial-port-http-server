

export type PushEmitter<A> = (receiver: (_:A) => void) => void 

// Push stream
export type Push<A> = {
    kind: 'Push'
    //run: () => PushWorld<A>
    unsafeRun: (receiver: (_:A) => void) => void
    map: <B>(f: (_: A) => B) => Push<B>
    filter: (f: (_:A) => boolean) => Push<A>
    scan: <B>(reducer: (acc: B, cur: A) => B, initial: B) => Push<B>
    flatten: () => A extends Push<A> ? Push<A> : never
    tap0: (f: (_:A) => void) => Push<A> // tap-before
}


export const Push = <A>(emitter: PushEmitter<A>): Push<A> => {

    type T = Push<A>

    const unsafeRun: T['unsafeRun'] = receiver => emitter(receiver)

    const tap0: T['tap0'] = f => Push( receiver => {
        emitter( a => {
            f(a); //tap before run effect
            receiver(a);
        })
    })

    const map: T['map'] = f => Push( receiver => {
        emitter( a => {
            const b = f(a);
            receiver(b);
        })
    })

    const filter: T['filter'] = f => Push( receiver => {
        emitter( a => {
            const condition = f(a)
            if(condition===true) {
                receiver(a);
            }
        })
    })

    const scan: T['scan'] = (f,ini) => Push( receiver => {
        type B = Parameters<typeof receiver>[0]
        let isFirstRun: boolean = true
        let acc: B | undefined = undefined
        emitter( a => {
            if(isFirstRun===true) {
                acc = f(ini,a)
                receiver(acc)
                isFirstRun = false
            } else {
                acc = f(acc as B,a)
                receiver(acc)
            }
            
        })
    })

    const flatten: T['flatten'] = () => Push( receiver => {
        emitter( pa_ => {
            const pa = pa_ as unknown as Push<A>
            pa.unsafeRun( a => {
                receiver(a)
            })

        })
    }) as unknown as A extends Push<A> ? Push<A> : never

   
    return {
        kind: 'Push',
        unsafeRun,
        map,
        filter,
        scan,
        flatten: flatten,
        tap0: tap0,
    }
}