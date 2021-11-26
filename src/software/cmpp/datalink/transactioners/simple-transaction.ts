import { FrameInterpreted } from "..";
import { PortOpened } from "../../../serial/port-opener";
import { StartByteNum, STX } from "../core-types";
import { Payload, makeWellFormedFrame } from "../payload";
import { CmppDataLinkInterpreter } from "../interpreter";
import { runOnce } from "../../../core/utils";

//NOTE: if error on interpretation the promisse throws ErrorEvent
//NOTE: This is the most simple form for a transaction with cmpp, there are other more efficient way to transact frames
//NOTE: This function WILL NOT automatically close the port
//TODO: create a function like that but that will attempt to retransmit failed transmission N times before effectivelly fail
export const cmppSimpleTransaction = (portOpened: PortOpened) => (payload: Payload, startByte: StartByteNum = STX): Promise<FrameInterpreted> => {
    
    const cleanupPortResources = runOnce( () => {
        //TODO: Encapsulates this cleanup in a more safe form. Refactor extract to a new object
        try {
            //NOTE: This try block is because looback emulated serial port do not have this __unsafe method implemented
            const p = portOpened.__unsafeGetConcreteDriver() //TODO: avoid to use this __unsafe method
            p.removeAllListeners('data')
        } catch (err) {
            //do nothing
        }   
    })
    
    return new Promise( (resolve, reject) => {
        //TODO: Should this code be in a try..catch clause ?
        const parse = CmppDataLinkInterpreter({
            onSuccess: event => {
                cleanupPortResources()
                const { frameInterpreted } = event
                resolve(frameInterpreted)
            },
            onError: event => {
                cleanupPortResources()
                reject(event)
            }
        })

        const receptionHandler = (data: readonly number[]) => {
            data.forEach( byte => {
                const reset = parse(byte)
            })
        }

        // make frame
        const dataSerialized = makeWellFormedFrame(startByte,payload)
        
        // run: ---

        // write data
        //set reception handler
        portOpened.onData(receptionHandler) //TODO: Loopback serial port emulated (used in unit tests) requires this handler to be set before transmission, but in real hardware this is not a assumption. Refactor so tests works as real hardware.
        portOpened.write(dataSerialized)
        
    })
    
}