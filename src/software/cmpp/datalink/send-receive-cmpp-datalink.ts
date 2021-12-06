
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

//TODO: Make this function with an ADT API
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
        //NOTE: Very conservative policy, for robustness even in extremally noisy enviroments
        const retryPolicy: RetryPolicy = {
            totalRetriesOnInterpretationError: 10, // NOTE: this error is more common. I'm exagerating and being over conservative here with number 10, maybe number 5 is enough for most of enviroments.
            totalRetriesOnTimeoutError: 4 //NOTE: In very noise enviroments, entire responses packages can evaporate. Four is a conservative value
        }
        safePayloadTransact(portSpec,dataToSend_, timeout, retryPolicy)
            .forResult({
                Ok: frameInterpreted => {
                    //console.log(`Received a frame from CMPP on port ${portName}/${String(baudRate)}`)        
                    //console.log("Frame interpreted:")
                    //console.table(frameInterpreted)
                    resolve(frameInterpreted)
                },
                Error: err => {
                    console.log(`Error on receiving data from cmpp: '${err.kind}'`) 
                    console.table(err)
                    reject(err)
                }

            })

})

