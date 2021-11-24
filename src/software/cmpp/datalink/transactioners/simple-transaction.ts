import { FrameInterpreted } from "..";
import { PortOpened } from "../../../serial/port-opener";
import { StartByteNum, STX } from "../core-types";
import { Payload, makeWellFormedFrame } from "../payload";
import { CmppDataLinkInterpreter } from "../interpreter";

//NOTE: if error on interpretation the promisse throws ErrorEvent
//NOTE: This is the most simple form for a transaction with cmpp, there are other more efficient way to transact frames
//NOTE: This function WILL NOT automatically close the port
export const cmppSimpleTransaction = (portOpened: PortOpened) => (payload: Payload, startByte: StartByteNum = STX): Promise<FrameInterpreted> => {
    return new Promise( (resolve, reject) => {
        //TODO: Should this code be in a try..catch clause ?
        const parse = CmppDataLinkInterpreter({
            onSuccess: event => {
                const { frameInterpreted } = event
                resolve(frameInterpreted)
            },
            onError: event => {
                reject(event)
            }
        })
        //prepare port reception-handler
        portOpened.onData( data => {
            data.forEach( byte => {
                const reset = parse(byte)
            })
        })
        // write data
        const dataSerialized = makeWellFormedFrame(startByte,payload)
        portOpened.write(dataSerialized)
    })
    
}