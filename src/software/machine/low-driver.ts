import { Future, Future_, InferFuture, UnsafePromiseError } from "../adts/future";
import { InferResult, Result, Result_ } from "../adts/result";
import { calculateTimeoutByBaudrate } from "../cmpp/datalink/core/calculate-timeout-by-baudrate";
import { FrameCore, frameCoreToPayload } from "../cmpp/datalink/core/frame-core";
import { SuccessEvent } from "../cmpp/datalink/core/interpreter";
import { PayloadCore } from "../cmpp/datalink/core/payload";
import { payloadTransaction_CB, TransactErrorEvent } from "../cmpp/datalink/transactioners/payload-transact-cb";
import { castPortCloseError, PortCloseError } from "../cmpp/datalink/transactioners/safe-payload-transact";
import { InferCmppType } from "../cmpp/transport/memmap-caster";
import { CMPP00LG, CMPP00LG_Memmap } from "../cmpp/transport/memmap-CMPP00LG";
import { Tunnel } from "../cmpp/transport/tunnel";
import { PortOpenError } from "../serial/port-controler/main/errors-types";
import { portOpener_CB } from "../serial/port-controler/main/legacy/port-opener-cb";


// low level cmpp driver


type AnyParameterKey = keyof CMPP00LG_Memmap
type GetParamCaster<K extends keyof CMPP00LG_Memmap> = CMPP00LG_Memmap[K]
type GetUserType<K extends keyof CMPP00LG_Memmap> = InferCmppType<GetParamCaster<K>>['source']


export type CmppResponse = Future<Result<SuccessEvent, TransactErrorEvent | PortOpenError | PortCloseError>>

export class LowDriver {
    
    public memmap: CMPP00LG_Memmap = CMPP00LG_Memmap
    public transportLayer: ReturnType<typeof CMPP00LG> //TODO: Improve this type to be more easy to read

    constructor (
        public tunnel: Tunnel
        ) { 
            this.transportLayer = CMPP00LG(tunnel)
    }

    public transactPayload = (data: PayloadCore): CmppResponse => {

        return Future( _yield => {
            const { return_ok, return_error } = Future_.makeContructorsFromResultEmitter(_yield)
            const { portSpec } = this.tunnel
            const receptionTimeout = calculateTimeoutByBaudrate(portSpec.baudRate)
            //
            portOpener_CB(portSpec, {
                onSuccess: portOpened => {
                    payloadTransaction_CB(portOpened, data, receptionTimeout,{
                        onSuccess: () => {},
                        onError: () => {},
                        END: result => {
                            const close = Future_.fromUnsafePromise(portOpened.close)
                            close.forResult({
                                Ok: () => {
                                    if(result.kind==='SuccessEvent') {
                                        return_ok(result)
                                    } else {
                                        return_error(result)
                                    }
                                },
                                Error: UnsafePromiseError => {
                                    const PortCloseError = castPortCloseError(UnsafePromiseError, portSpec)
                                    return_error(PortCloseError)
                                }
                            })
                        }
                    })
                    
                    
                },

                onError: PortOpenError => {
                    return_error(PortOpenError)
                }
            })
            
        })

    }

    public transactFrame = (data: FrameCore): ReturnType<typeof this.transactPayload> => {
        const payload = frameCoreToPayload(data)
        return this.transactPayload(payload)
    }
        
        
    

}