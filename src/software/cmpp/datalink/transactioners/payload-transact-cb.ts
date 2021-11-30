import { StartByteNum, StartByteToText, StartByteTxt, STX } from "../core-types";
import { Payload, makeWellFormedFrame, PayloadCore } from "../payload";
import { CmppDataLinkInterpreter, StateChangeEvent, SuccessEvent, ErrorEvent } from "../interpreter";
import { runOnce } from "../../../core/utils";
import { Byte } from "../../../core/byte";
import { PortOpened } from "../../../serial";


const cleanupPortResources = (p: PortOpened):void => {
    runOnce( () => {
        //TODO: Should we also use/remove Error listeners ?
        p.removeAllDataListeners()
    })
}

export type HeaderEvent = {
    startByte: {number: StartByteNum, text: StartByteTxt}
    payload: Payload
}

const makeHeaderEvent = (n: StartByteNum, payload: Payload): HeaderEvent => {
    return {
        startByte: { number: n, text: StartByteToText(n)},
        payload,
    }
}

export type EventHandler = {
    BEGIN: (header: HeaderEvent) => void       // before all (garanteed that any event will be generated before this one)
    willSend: (header: HeaderEvent) => void    // before send
    hasSent: (header: HeaderEvent) => void     // after send
    onDataChunk: (data: readonly Byte[], header: HeaderEvent) => void   // each chunck of data received
    onSuccess: (event: SuccessEvent, header: HeaderEvent) => void // the result frame of the transaction
    onError: (event: ErrorEvent, header: HeaderEvent) => void // errors of interpretation and others
    onStateChange: (event: StateChangeEvent, header: HeaderEvent) => void // on each internal state of the interpreter change
    END: (result: SuccessEvent | ErrorEvent, header: HeaderEvent) => void       // before all (garanteed that any event will be generated after this one)
}

//NOTE: This function WILL NOT automatically close the port
//TODO: create a function like that but that will attempt to retransmit failed transmission N times before effectivelly fail
//CAUTION: This function perform side-effect by deleting all on'data' events that eventually are programmed in the concrete port before its call.
//TODO: If possible reimplement to avoid caution message above
//TODO: Rename this function do 'payloadTransact_CB' to normalize it with other names
export const payloadTransaction_CB = (portOpened: PortOpened, dataToSend: PayloadCore, handler: EventHandler): void => {
    
    const { payload, startByte } = dataToSend

    const header = makeHeaderEvent(startByte, payload)

    const parse = CmppDataLinkInterpreter({
        onSuccess: event => {
            cleanupPortResources(portOpened)
            const data = [event, header] as const
            //TODO: verify where CHECKSUM expected vs calculated should be placed (ie: here or in other place) 
            if (handler.onSuccess) handler.onSuccess(...data)
            if(handler.END) handler.END(...data)
        },
        onError: event => {
            const data = [event, header] as const
            cleanupPortResources(portOpened)
            if (handler.onError) handler.onError(...data)
            if(handler.END) handler.END(...data)
        },
        onStateChange: event => {
            const data = [event, header] as const
            if(handler.onStateChange) handler.onStateChange(...data)
        }
    })

    const receptionHandler = (data: readonly number[]) => {
        const result = [data, header] as const
        if (handler.onDataChunk) handler.onDataChunk(...result)
        data.forEach( byte => {     
            const reset = parse(byte)
        })
    }

    //make frame
    const dataSerialized = makeWellFormedFrame(dataToSend)

    //TODO: Should this code be in a try..catch clause? How to handle errors here?
    //write data
    if(handler.BEGIN) handler.BEGIN(header)
    if(handler.willSend) handler.willSend(header)
    portOpened.write(dataSerialized)
        .then( () => {
            if(handler.hasSent) handler.hasSent(header)
            //TODO: Check if it should be useful to remove old onData listeners before introduce this one below
            //set reception handler
            portOpened.onData(receptionHandler)      
    })
    
}

