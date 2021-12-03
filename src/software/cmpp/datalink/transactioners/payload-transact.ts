import { FrameInterpreted } from "..";
import { PortOpened } from "../../../serial";
import { PayloadCore } from "../payload";
import { HeaderEvent, payloadTransaction_CB, TransactErrorEvent } from "./payload-transact-cb";

// this type is what the function throws when error happens
export type PayloadTransactError = readonly [TransactErrorEvent, HeaderEvent] // TODO: look for a better (normalized) type of error
                

export const payloadTransact = (portOpened: PortOpened, dataToSend: PayloadCore, timeoutMilisec: number ): Promise<FrameInterpreted> => {

    return new Promise ((resolve, reject ) => {

        payloadTransaction_CB(portOpened, dataToSend, timeoutMilisec, {
            BEGIN: () => {},
            willSend: () => {},
            hasSent: () => {},
            onDataChunk: () => {},
            onStateChange: () => {},
            onError: (err, header) => {
                const error: PayloadTransactError = [err, header] as const
                reject(error) 
            },
            onSuccess: (event, header) => {
                const { frameInterpreted } = event
                resolve(frameInterpreted)
            },
            END: () => {},
        })
        
    })
    
} 