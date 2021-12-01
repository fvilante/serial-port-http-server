import { PortOpened, PortSpec } from "../../serial"
import { PortOpenError, portOpener_CB } from "../../serial/port-opener-cb"
import { Channel } from "../datalink/core-types"
import { frameCoreToPayload } from "../datalink/frame-core"
import { payloadTransact } from "../datalink/transactioners/payload-transact"

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
export const detectCmpp = (tunnel: Tunnel, timeoutMilisecs: number, handler: EventHandler): void => {

    const { channel, portSpec} = tunnel

    portOpener_CB(portSpec, {
        onError: err => {
            handler?.onError(err)
            handler?.END()
        },
        onSuccess: portOpened => {

            const dataToSend = makeDetectionPayloadCore(channel)

            try {
                payloadTransact(portOpened, dataToSend, timeoutMilisecs)
                .then( response => {
                    handler?.onDetected(tunnel)
                    handler?.END()
                })
                .catch( err => {
                    handler?.onError(err)
                    handler?.END()
                })
            } catch (err) {
                handler?.onError(err)
                handler?.END()
            }
            
        },
    })
        
}
