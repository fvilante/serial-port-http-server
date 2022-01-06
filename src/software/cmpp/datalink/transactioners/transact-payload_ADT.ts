import { FrameInterpreted } from "../core/frame-core";
import { Future } from "../../../adts/future";
import { Result, Result_ } from "../../../adts/result";
import { PortOpened } from "../../../serial";
import { PayloadCore } from "../core/payload";
import { payloadTransaction_CB, TimeoutErrorEvent, TransactErrorEvent } from "./payload-transact-cb";
import { ACK } from "../core/core-types";

//we are very safe because we deal with open/close of the port and not only data transfer


export type TransactPayloadArgument_ADT = {
    portOpened: PortOpened
    dataToSend: PayloadCore
    timeout: number
}

export const transactPayload_ADT = (argument: TransactPayloadArgument_ADT): Future<Result<FrameInterpreted,TransactErrorEvent>> => {
    const { portOpened, dataToSend, timeout } = argument
    const { ok, fail } = Result_.makeConstructors<FrameInterpreted,TransactErrorEvent>()

    return Future( resolve => {

        payloadTransaction_CB(portOpened, dataToSend, timeout, {
            BEGIN: () => {},
            willSend: () => {},
            hasSent: () => {},
            onDataChunk: () => {},
            onStateChange: () => {},
            onError: (err, header) => {
                resolve(fail(err))
            },
            onSuccess: (event, header) => {
                //TODO: Implement a better checksum error detection and NACK detection (REMOVE this error throwing!! )
                //TODO: Probably the error code bellow should be transfered to payloadTransaction_CB
                const { frameInterpreted } = event
                const expectedChecksum = frameInterpreted.expectedChecksum
                const actualChecksum = frameInterpreted.checkSum[0]
                const isValidChecksum = expectedChecksum === actualChecksum
                const slaveStartByte = frameInterpreted.startByte[0]
                const isAck = slaveStartByte === ACK
                if(isValidChecksum && isAck) {
                    resolve(ok(frameInterpreted))
                } else if(!isValidChecksum) {
                    //TODO: remove this ugly throw and use 'fail' function above. 
                    throw new Error('Invalid checksum response from slave')
                } else if(!isAck) {
                    //TODO: remove this ugly throw and use 'fail' function above. 
                    throw new Error('Slave responded a well-formed but NON-ACK frame')
                }
                
            },
            END: () => {},
        })

    }
        

    )
}