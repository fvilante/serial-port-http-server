
import { 
    FrameCore, 
    FrameInterpreted,
    frameCoreToPayload,
} from './frame-core'
import { BaudRate } from '../../serial/baudrate'
import { PortSpec } from '../../serial/port-opener-cb'
import { safePayloadTransact } from './transactioners/safe-payload-transact'
import { RetryPolicy } from './transactioners/retry-logic-ADT'
import { calculateTimeout } from './calculate-timeout'


export const sendCmpp = (
        portName: string, baudRate: BaudRate
    ) => (
        frame: FrameCore
    ): Promise<FrameInterpreted> => new Promise ( (resolve, reject) => {
        const portSpec: PortSpec = {
            path: portName,
            baudRate,
        }
        const dataToSend_ = frameCoreToPayload(frame)
        const timeout = calculateTimeout(baudRate)
        const retryPolicy: RetryPolicy = {
            totalRetriesOnInterpretationError: 10,
            totalRetriesOnTimeoutError: 5
        }
        safePayloadTransact(portSpec,dataToSend_, timeout, retryPolicy)
            .forResult({
                Ok: frameInterpreted => {
                    console.log(`Received a frame from CMPP on port ${portName}/${String(baudRate)}`)        
                    console.log("Frame interpreted:")
                    console.table(frameInterpreted)
                    resolve(frameInterpreted)
                },
                Error: err => {
                    console.log(`Error on receiving data from cmpp: '${err.kind}'`) 
                    console.table(err)
                    reject(err)
                }

            })

})

