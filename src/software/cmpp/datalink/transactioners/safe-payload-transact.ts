import { FrameInterpreted } from ".."
import { Future, Future_, UnsafePromiseError } from "../../../adts/future"
import { Result, Result_ } from "../../../adts/result"
import { PortSpec, PortOpened } from "../../../serial"
import { PortOpenError, portOpener_CB } from "../../../serial/port-opener-cb"
import { portOpener_ADT } from "../../../serial/portOpener_ADT"
import { frameCoreToPayload } from "../frame-core"
import { PayloadCore } from "../payload"
import { TransactErrorEvent } from "./payload-transact-cb"
import { RetryPolicy, transactPayloadWithRetryPolicy } from "./retry-logic-ADT"

//TODO: Should we extract this type to serial lib as 'portCloser_ADT' ?
export type PortCloseError = {
    kind: 'Port close error'   // ie: when closing the port produces an error
    portSpec: PortSpec  
    detail: UnsafePromiseError
}

//TODO: Should we extract this function to serial lib as 'portCloser' ?
const portCloser = (portOpened: PortOpened, portSpec: PortSpec): Future<Result<void,PortCloseError>> => {
    return Future( _yield => {
        const { return_ok, return_error } = Future_.makeContructorsFromResultEmitter(_yield)
        const closeIt = Future_.fromUnsafePromise(portOpened.close)
        closeIt.forResult({
            Error: UnsafePromiseError => {
                return_error({
                    kind: 'Port close error',
                    portSpec,
                    detail: UnsafePromiseError
                })
            },
            Ok: () => {
                return_ok() // port is closed
            }
        })
    })
    
}

export type Fail = 
    | PortOpenError // = AccessDenied | FileNotFound | UnknownError
    | PortCloseError
    | TransactErrorEvent // = InterpretationErrorEvent | TimeoutErrorEvent


export const safePayloadTransact = (portSpec: PortSpec, dataToSend: PayloadCore, timeout: number, retryPolicy: RetryPolicy): Future<Result<FrameInterpreted, Fail>> => {

    return Future( _yield => {

        const { return_ok, return_error } = Future_.makeContructorsFromResultEmitter(_yield)

        portOpener_ADT(portSpec)
        .forResult({
            Error: portOpenError => {
                return_error(portOpenError)
            },
            Ok: portOpened => {
            
                const run = async () => {

                    const transactPayload = transactPayloadWithRetryPolicy(retryPolicy)
    
                    const response = transactPayload({
                        dataToSend,
                        portOpened,
                        timeout,
                    })
                
                    response.forResult({
                        Ok: frameInterpreted => {
                            console.log('received a frameInterpreted')
                            console.log(`closing port ${portSpec.path}`)
                            portCloser(portOpened, portSpec)
                                .forResult({
                                    Error: PortCloseError => {
                                        console.log('PortCloseError')
                                        return_error(PortCloseError)
                                    },
                                    Ok: () => {
                                        console.log(`Port ${portSpec.path} closed`)
                                        console.log('emiting success frameInterpreted')
                                        return_ok(frameInterpreted)
                                    }
                                })
                        },
                        Error: transactErrorEvent => {
                            console.log(`closing port ${portSpec.path}`)
                            portCloser(portOpened, portSpec)
                                .forResult({
                                    Error: PortCloseError => {
                                        console.log('PortCloseError')
                                        return_error(PortCloseError) //TODO: Two errors simultaneously happen here, but only one of them can be sent. What if we just could send both of them? This is possible? how?
                                    },
                                    Ok: () => {
                                        console.log('transactErrorEvent')
                                        return_error(transactErrorEvent)
                                    }
                                })
                        }
                    })
                }
    
                run();
    
                
            }
        })

    })

    
              
}