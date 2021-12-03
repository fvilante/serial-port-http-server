import { PortOpened, PortSpec } from ".";
import { Future } from "../adts/future";
import { Result, Result_ } from "../adts/result";
import { PortOpenError, portOpener_CB } from "./port-opener-cb";


export const portOpener_ADT = (spec: PortSpec):Future<Result<PortOpened, PortOpenError>> => {
    
    return Future( _yield => {

        const { ok, fail } = Result_.makeConstructorsFromResolver(_yield)

        portOpener_CB(spec,{
            onError: portOpenError => {
                fail(portOpenError)
            },
            onSuccess: portOpened => {
                ok(portOpened)
            }
        })
    })
}