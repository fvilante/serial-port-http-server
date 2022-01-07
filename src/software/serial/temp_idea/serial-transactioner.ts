import { PortOpened } from ".."
import { Byte, Bytes } from "../../core/byte"
import { portOpener } from "../port-opener"



export type Transactioner<A,B> = {
    readonly write: (data:A) => Promise<void>
    readonly onData: (consumer: (_:B) => void) => void
    readonly close: () => Promise<void>
}

export const makeSerialTransactioner = (portOpened: PortOpened):Transactioner<Bytes, Bytes> => {
    return {
        write: async data => {
            await portOpened.write([...data])
        },
        onData: consumer => {
            portOpened.onData( data => consumer(data))
        },
        close: async  () => {
            await portOpened.close()
        }
    }
}

export const contramapTransactioner = <A,B,A0>(m: Transactioner<A,B>, f: (_:A0) => A): Transactioner<A0,B> => {
    return {
        write: async data => {
            await m.write(f(data))
        },
        onData: consumer => {
            m.onData( data => consumer(data))
        },
        close: async  () => {
            await m.close()
        }
    }
}

export const mapTransactioner = <A,B,C>(m: Transactioner<A,B>, f: (_:B) => C): Transactioner<A,C> => {
    return {
        write: async data => {
            await m.write(data)
        },
        onData: consumer => {
            m.onData( data => consumer(f(data)))
        },
        close: async () => {
            await m.close()
        }
    }
}

export const scanTransactioner = <A,B,S>(m: Transactioner<A,B>, f: (acc:S, cur:B) => S, initialState: S): Transactioner<A,S> => {
    let lastState:S = initialState
    return {
        write: async dataA => {
            await m.write(dataA)
        },
        onData: consumer => {
            m.onData( dataB => {
                const nextState = f(lastState,dataB)
                consumer(nextState)
                lastState = nextState
            })
        },
        close: async () => {
            await m.close()
        }
    }
}