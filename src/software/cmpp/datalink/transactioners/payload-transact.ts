import { FrameInterpreted } from "..";
import { PortOpened } from "../../../serial";
import { PayloadCore } from "../payload";
import { payloadTransaction_CB } from "./payload-transact-cb";



export const payloadTransact = (portOpened: PortOpened, dataToSend: PayloadCore): Promise<FrameInterpreted> => {

    return new Promise ((resolve, reject ) => {

        payloadTransaction_CB(portOpened, dataToSend, {
            BEGIN: () => {},
            willSend: () => {},
            hasSent: () => {},
            onDataChunk: () => {},
            onStateChange: () => {},
            onError: (err, header) => {
                reject([err, header]) // TODO: decide better the type of the error to sent
            },
            onSuccess: (event, header) => {
                const { frameInterpreted } = event
                resolve(frameInterpreted)
            },
            END: () => {},
        })
        
    })
    
} 