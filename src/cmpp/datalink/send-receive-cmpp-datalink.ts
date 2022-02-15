
import { 
    FrameCore, 
    FrameInterpreted,
    frameCoreToPayload,
} from './core/frame-core'
import { BaudRate } from '../../serial/core/baudrate'
import { PortSpec } from "../../serial/core/port-spec"
import { safePayloadTransact } from './transactioners/safe-payload-transact'
import { RetryPolicy } from './transactioners/retry-logic-ADT'
import { calculateTimeoutByBaudrate } from './core/calculate-timeout-by-baudrate'

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
        const timeout = calculateTimeoutByBaudrate(baudRate)
        //NOTE: Very conservative policy, for robustness even in extremally noisy enviroments
        const retryPolicy: RetryPolicy = {
            totalRetriesOnInterpretationError: 3, 
            totalRetriesOnTimeoutError: 3 
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

