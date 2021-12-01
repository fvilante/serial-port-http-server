import { FrameInterpreted } from "..";
import { PortOpened } from "../../../serial";
import { PayloadCore } from "../payload";
import { payloadTransaction_CB } from "./payload-transact-cb";



export const payloadTransact = (portOpened: PortOpened, dataToSend: PayloadCore, timeoutMilisec: number ): Promise<FrameInterpreted> => {

    return new Promise ((resolve, reject ) => {

        payloadTransaction_CB(portOpened, dataToSend, timeoutMilisec, {
            BEGIN: () => {},
            willSend: () => {},
            hasSent: () => {},
            onDataChunk: () => {},
            onStateChange: () => {},
            onError: (err, header) => {
                reject([err, header]) // TODO: look for a better (normalized) type of error
            },
            onSuccess: (event, header) => {
                const { frameInterpreted } = event
                resolve(frameInterpreted)
            },
            END: () => {},
        })
        
    })
    
} 