import { PortOpened } from "../../serial"
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



//NOTE: you must call this function when there is no more then one cmpp per each channel connected
export const detectCmpp = (portOpened: PortOpened, channel: Channel, timeoutMilisecs: number): Promise<boolean> => {
    return new Promise( (resolve, reject) => {

        const onSuccess = (isPresent: boolean):void => {
            resolve(isPresent)
        }

        const onError = ():void => {
            //never called
        }

        const dataToSend = makeDetectionPayloadCore(channel)

        payloadTransact(portOpened, dataToSend, timeoutMilisecs)
            .then( response => {
                onSuccess(true)
            })
            .catch( err => {
                onSuccess(false)
            })
    })
}