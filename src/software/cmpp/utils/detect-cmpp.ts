import { PortOpened, PortSpec } from "../../serial"
import { PortOpenError, portOpener_CB } from "../../serial/port-opener-cb"
import { Channel } from "../datalink/core-types"
import { frameCoreToPayload } from "../datalink/frame-core"
import { payloadTransact, PayloadTransactError } from "../datalink/transactioners/payload-transact"

//NOTE: 'true' means cmpp is present in that channel/port, 'false' otherwise.
// NOTE: This payload is just a information request of any arbitrary cmpp address
const makeDetectionPayloadCore = (channel: Channel) => {
    const dataToSend = frameCoreToPayload({
        startByte: 'STX',
        direction: 'Solicitacao',
        waddr: 0x00,
        channel,
        uint16: 0x00,
    })
    return dataToSend

}

//TODO: eventually extract this type to a better place
export type Tunnel = { 
    readonly portSpec: PortSpec, 
    readonly channel: Channel
} 

export type EventHandler = {
    readonly BEGIN: () => void
    readonly onDetected: (tunnel: Tunnel) => void
    readonly onNotDetected: (tunnel: Tunnel) => void
    readonly onError: (_: unknown | PortOpenError) => void
    readonly END: () => void
}

//NOTE: you must call this function when there is no more then one cmpp per each Tunnel connected
//NOTE: Important! this function never throws
export const detectCmpp = (tunnel: Tunnel, timeoutMilisecs: number, handler: EventHandler, retryCounter: number = 3): void => {

    const { channel, portSpec} = tunnel

    const closePortSafe = (portOpened: PortOpened): Promise<void> => {
        return new Promise( (resolve, reject) => {
            //close port
            try {
                portOpened.close()
                    .then( () => {
                        // ok sucessful closed
                        resolve()
                    })
                    .catch( err => {
                        handler?.onError(err)
                    })
                    .finally( () => {
                        handler?.END()
                        resolve()
                    })
            } catch (err) {
                handler?.onError(err)
                handler?.END()
                resolve()
            }
        })
        
    }

    portOpener_CB(portSpec, {
        onError: err => {
            handler?.onError(err)
            handler?.END()
        },
        onSuccess: portOpened => {

            const cleanupAndFinalize = (isDetected: boolean, tunnel: Tunnel): Promise<void> => {
                return new Promise( (resolve,reject) => {
                    if (isDetected) {
                        handler?.onDetected(tunnel)
                    } else {
                        handler?.onNotDetected(tunnel)
                    }
                    closePortSafe(portOpened).then( () => resolve())
                }) 
            }

            const dataToSend = makeDetectionPayloadCore(channel)

            //run
            try {
                payloadTransact(portOpened, dataToSend, timeoutMilisecs)
                .then( response => {
                    cleanupAndFinalize(true, tunnel)
                })
                .catch( err => {
                    const err_: PayloadTransactError = err as PayloadTransactError
                    const [transactError ] = err_
                    if(transactError.kind === 'ErrorEvent' ) {
                        //is not timout error but 'interpretation?' error, then:
                        //try again!
                        closePortSafe(portOpened)
                            .then( () => {
                                if (retryCounter>0) {
                                    detectCmpp(tunnel,timeoutMilisecs,handler,retryCounter-1)
                                }
                            })
                    } else {
                        //console.table(err)
                        handler?.onError(err)
                        cleanupAndFinalize(false, tunnel)
                    }

                    
                })
            } catch (err) {
                handler?.onError(err)
                cleanupAndFinalize(false, tunnel)
            }
            
        },
    })
        
}
