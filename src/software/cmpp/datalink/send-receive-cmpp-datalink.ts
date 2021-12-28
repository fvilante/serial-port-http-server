
import { 
    FrameCore, 
    FrameInterpreted,
    frameCoreToPayload,
} from './core/frame-core'
import { BaudRate } from '../../serial/baudrate'
import { PortSpec } from '../../serial/port-opener-cb'
import { safePayloadTransact } from './transactioners/safe-payload-transact'
import { RetryPolicy } from './transactioners/retry-logic-ADT'
import { calculateTimeout } from './calculate-timeout'

//TODO: os clientes desta funcao deveriam checar se resposta em frameInterpreted foi 'ACK' ou 'NACK' mas eles nao estao fazendo isto. Poderia haver uma funcao intermediaria que jogue um erro caso o frame retornado seja NACK
//TODO: API CHANGE: Make this function ADT API, and use PortSpec as function argment. Eventually use PayloadCore instead of frame (?!)
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

