

// synchronous transaction, async in some sense

import { PortOpened, SerialDriver } from "../serial-local-driver"


export type Model<A> = (yield_: (_:A) => void) => void
type Stream<A> = { 
       
}
declare const Stream: <A>(f: Model<A>) => Stream<A>
type Stream_ = { 
    readonly fromArray: <A>(arr: readonly A[]) => Stream<A>
}


type WriteOn = (port: PortOpened, data: number[], timeoutMs: number) => Stream<number>
const WriteOn: WriteOn = (port, data, timeoutMs) => Stream( (yield_) => {
    port.onData( data => data.map( d => yield_(d)))
    port.write(data).then( () => {
        const tid = setTimeout( () => {
            port.close()
        }, timeoutMs)
    })
})



type Interpreter<A,B,E> = {
    readonly interpret: (input: Stream<A>) => Stream<Result<B,E>> 
}

type Trans<A,B,E> = {
    readonly payload: A
    readonly interpreter: Interpreter<A,B,E>
}

type Transs<A,B,E> = readonly Trans<A,B,E>[]

type AtomicTranss = <A,B,E>(transs: readonly Trans<A,B,E>[]) => Future<readonly Result<B,E>[]>