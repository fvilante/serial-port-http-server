import { FrameInterpreted } from ".."
import { Future, Future_, UnsafePromiseError } from "../../../adts/future"
import { Result, Result_ } from "../../../adts/result"
import { PortSpec, PortOpened } from "../../../serial"
import { PortOpenError, portOpener_CB } from "../../../serial/port-opener-cb"
import { portOpener_ADT } from "../../../serial/portOpener_ADT"
import { frameCoreToPayload } from "../frame-core"
import { PayloadCore } from "../payload"
import { TransactErrorEvent } from "./payload-transact-cb"
import { transactPayloadWithRetryPolicy } from "./retry-logic-ADT"

//TODO: Should we extract this type to serial lib as 'portCloser_ADT' ?
export type PortCloseError = {
    errorKind: 'Port close error'   // ie: when closing the port produces an error
    portSpec: PortSpec  
    detail: UnsafePromiseError
}

//TODO: Should we extract this function to serial lib as 'portCloser' ?
const portCloser = (portOpened: PortOpened, portSpec: PortSpec): Future<Result<void,PortCloseError>> => {
    return Future( _yield => {
        const {ok, fail} = Result_.makeConstructorsFromResolver(_yield)
        const closeIt = Future_.fromUnsafePromise(portOpened.close)
        closeIt.forResult({
            Error: UnsafePromiseError => {
                _yield(fail({
                    errorKind: 'Port close error',
                    portSpec,
                    detail: UnsafePromiseError
                }))
            },
            Ok: () => {
                _yield(ok()) // port is closed
            }
        })
    })
    
}

export type Fail = 
    | PortOpenError // = AccessDenied | FileNotFound | UnknownError
    | PortCloseError
    | TransactErrorEvent // = InterpretationErrorEvent | TimeoutErrorEvent


export const safePayloadTransact = (portSpec: PortSpec, dataToSend: PayloadCore, timeout: number, retries: number): Future<Result<FrameInterpreted, Fail>> => {

    return Future( _yield => {

        const { ok, fail } = Result_.makeConstructorsFromResolver(_yield)

        portOpener_ADT(portSpec)
        .forResult({
            Error: portOpenError => {
                _yield(fail(portOpenError))
            },
            Ok: portOpened => {
            
                const run = async () => {

                    const transactPayload = transactPayloadWithRetryPolicy(retries)
    
                    const response = transactPayload({
                        dataToSend,
                        portOpened,
                        timeout,
                    })
                
                    response.forResult({
                        Ok: frameInterpreted => {
                            portCloser(portOpened, portSpec)
                                .forResult({
                                    Error: err => {
                                        _yield(fail(err))
                                    },
                                    Ok: () => {
                                        _yield(ok(frameInterpreted))
                                    }
                                })
                        },
                        Error: transactErrorEvent => {
                            //console.log('closing port.')
                            portCloser(portOpened, portSpec)
                                .forResult({
                                    Error: PortCloseError => {
                                        //console.log('PortCloseError')
                                        _yield(fail(PortCloseError)) //TODO: Two errors simultaneously happen here, but only one of them can be sent. What if we just could send both of them? This is possible? how?
                                    },
                                    Ok: () => {
                                        //console.log('transactErrorEvent')
                                        _yield(fail(transactErrorEvent))
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