import { StartByteNum, StartByteToText, StartByteTxt, STX } from "../core/core-types";
import { Payload, PayloadCore } from "../core/payload";
import { CmppDataLinkInterpreter, StateChangeEvent, SuccessEvent, InterpretationErrorEvent } from "../core/interpreter";
import { Byte } from "../../../core/byte";
import { makeWellFormedFrame } from "../core/special-case-data-constructors";
import { PortOpened } from "../../../serial/port-controler/main/port-opened";


const cleanupPortResources = (p: PortOpened):void => {
    p.removeAllDataListeners()
}

const cleanupTimeout = (id: unknown):void => {
    if(id===undefined) return
    clearTimeout(id as any) //TODO: remove this 'any' cast
}

export type HeaderEvent = {
    startByte: {number: StartByteNum, text: StartByteTxt}
    payload: Payload
}

export type TimeoutErrorEvent = {
    kind: 'TimeoutErrorEvent',
    startByte: StartByteNum
    payload: Payload
    dataSerialized: readonly number[]
}

const makeHeaderEvent = (n: StartByteNum, payload: Payload): HeaderEvent => {
    return {
        startByte: { number: n, text: StartByteToText(n)},
        payload,
    }
}

export type TransactErrorEvent = InterpretationErrorEvent | TimeoutErrorEvent

export type EventHandler = {
    BEGIN?: (header: HeaderEvent) => void       // before all (garanteed that any event will be generated before this one)
    willSend?: (header: HeaderEvent) => void    // before send
    hasSent?: (header: HeaderEvent) => void     // after send
    onDataChunk?: (data: readonly Byte[], header: HeaderEvent) => void   // each chunck of data received
    onSuccess?: (event: SuccessEvent, header: HeaderEvent) => void // the result frame of the transaction
    onError?: (event: TransactErrorEvent, header: HeaderEvent) => void // errors of interpretation and others
    onStateChange?: (event: StateChangeEvent, header: HeaderEvent) => void // on each internal state of the interpreter change
    END?: (result: SuccessEvent | TransactErrorEvent, header: HeaderEvent) => void       // before all (garanteed that any event will be generated after this one)
}

//NOTE: This function WILL NOT automatically close the port
//TODO: create a function like that but that will attempt to retransmit failed transmission N times before effectivelly fail
//CAUTION: This function perform side-effect by deleting all on'data' events that eventually are programmed in the concrete port before its call.
//TODO: If possible reimplement to avoid caution message above
//TODO: Rename this function do 'payloadTransact_CB' to normalize it with other names
//TODO: Should we improve type cast of timeout ?
//TODO: Should we implement a 'proccess cancelation' callback ? (to be emitted with the BEGIN event and/or syncrhonous instead void)
export const payloadTransaction_CB = (portOpened: PortOpened, payloadCore: PayloadCore, timeoutMilisec: number, handler: EventHandler): void => {
    
    let resetInterpreter: () => void = () => { } 

    const { payload, startByte } = payloadCore

    const header = makeHeaderEvent(startByte, payload)

    const parse = CmppDataLinkInterpreter({
        onSuccess: event => {
            //resetInterpreter() //TODO: checkif this particular cleanup is really necessary. because interpreter is already automatic reseted in case of error (confirm it)
            cleanupPortResources(portOpened)
            cleanupTimeout(id)
            const data = [event, header] as const
            //TODO: verify where CHECKSUM expected vs calculated should be placed (ie: here or in other place) 
            if (handler.onSuccess) handler.onSuccess(...data)
            if(handler.END) handler.END(...data)
        },
        onError: event => {
            //resetInterpreter() //TODO: checkif this particular cleanup is really necessary. because interpreter is already automatic reseted in case of error (confirm it)
            const data = [event, header] as const
            cleanupPortResources(portOpened)
            cleanupTimeout(id)
            if (handler.onError) handler.onError(...data)
            if(handler.END) handler.END(...data)
        },
        onStateChange: event => {
            const data = [event, header] as const
            if(handler.onStateChange) handler.onStateChange(...data)
        }
    })

    const emitTimeoutErrorAndEnd = () => {
        const timeout: TimeoutErrorEvent = {
            kind: 'TimeoutErrorEvent',
            dataSerialized,
            payload,
            startByte
        }
        const event = [timeout, header] as const
        cleanupPortResources(portOpened) // TODO: extract all this cleanup calls to one single cleanup function
        if(handler.onError) handler.onError(...event)
        if(handler.END) handler.END(...event)
        
    }

    const receptionHandler = (data: readonly number[]) => {
        const result = [data, header] as const
        if (handler.onDataChunk) handler.onDataChunk(...result)
        data.forEach( byte => {     
            resetInterpreter = parse(byte)
        })
    }

    //make frame
    const dataSerialized = makeWellFormedFrame(payloadCore)

    let id:any = undefined //timer id

    //TODO: Should this code be in a try..catch clause? How to handle errors here?
    //write data
    if(handler.BEGIN) handler.BEGIN(header)
    if(handler.willSend) handler.willSend(header)
    portOpened.write(dataSerialized)
        .then( () => {
            
            //Starts the timeout counting after send data and before run client handler.hasSent
            id = setTimeout(() => {
                emitTimeoutErrorAndEnd()
            }, timeoutMilisec)

            if(handler.hasSent) handler.hasSent(header)
            //TODO: Check if it should be useful to remove old onData listeners before introduce this one below
            //set reception handler
            portOpened.onData(receptionHandler)      
    })
    
}

