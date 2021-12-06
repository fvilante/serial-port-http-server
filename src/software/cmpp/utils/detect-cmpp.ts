import { Future } from "../../adts/future"
import { Result } from "../../adts/result"
import { PortSpec } from "../../serial"
import { Channel } from "../datalink/core-types"
import { frameCoreToPayload, FrameInterpreted } from "../datalink/frame-core"
import { RetryPolicy } from "../datalink/transactioners/retry-logic-ADT"
import { Fail, safePayloadTransact } from "../datalink/transactioners/safe-payload-transact"

// NOTE: This payload is just a information request of any arbitrary cmpp address. I'm assuming if this answer to this 
//       request is given back as a valid Cmpp Frame Interpreted, then the CMPP device is present in the tunnel 
//       connection. 
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

//NOTE: you must call this function when there is no more then one cmpp per each Tunnel connected
//NOTE: Important! this function never throws
export const detectCmpp = (tunnel: Tunnel, timeoutMilisecs: number, retryPolicy: RetryPolicy):Future<Result<FrameInterpreted, Fail>> => {
    const { channel, portSpec} = tunnel
    const dataToSend = makeDetectionPayloadCore(channel)
    return safePayloadTransact(portSpec,dataToSend,timeoutMilisecs, retryPolicy)
    
}
