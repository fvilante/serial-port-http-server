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
//CAUTION: //TODO This function perform side-effect by deleting all on'data' events that eventually are programmed in the concrete port
//TODO: timeout should be a consequence of baudrate
//TODO: add number of retriais to this function or indtruduce a wrapper to do that
//TODO: rename this function to transactPayload
//TODO: and implement a callback reponse system (which is more accurate than promise system for the purpose of many data being responded)
export const cmppSimpleTransaction = (portOpened: PortOpened, payload: Payload, startByte: StartByteNum = STX): Promise<FrameInterpreted> => {

    const cleanupPortResources = runOnce( () => {
        //TODO: Encapsulates this cleanup in a more safe form. Refactor extract to a new object
        try {
            //NOTE: This try block is because looback emulated serial port do not have this __unsafe 
            //      method implemented
            //TODO: avoid to use this __unsafe method
            const p = portOpened.__unsafeGetConcreteDriver() 
            p.removeAllListeners('data')
        } catch (err) {
            //do nothing, fail silently
        }   
    })
    
    return new Promise( (resolve, reject) => {
        
        const parse = CmppDataLinkInterpreter({
            onSuccess: event => {
                cleanupPortResources()
                //TODO: verify how CHECKSUM expected vs calculated is being checked
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

        //make frame
        const dataSerialized = makeWellFormedFrame(startByte,payload)

        //TODO: Should this code be in a try..catch clause? How to handle errors here?
        //write data
        portOpened.write(dataSerialized)
            .then( () => {
                //TODO: Should be useful to remove old onData listeners before introduce this one below
                //set reception handler
                portOpened.onData(receptionHandler)      
        })
        
    })
    
}