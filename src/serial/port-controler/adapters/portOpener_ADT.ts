import { Future, Future_ } from "../../../adts/future";
import { Result, Result_ } from "../../../adts/result";
import { PortSpec } from "../../core/port-spec";
import { PortOpenError } from "../main/errors-types";
import { PortOpened } from "../main/port-opened";
import { portOpener_CB } from "../main/legacy/port-opener-cb";


export const portOpener_ADT = (spec: PortSpec):Future<Result<PortOpened, PortOpenError>> => {
    
    return Future( _yield => {

        const { return_ok, return_error } = Future_.makeContructorsFromResultEmitter (_yield)

        portOpener_CB(spec,{
            onError: portOpenError => {
                return_error(portOpenError)
            },
            onSuccess: portOpened => {
                return_ok(portOpened)
            }
        })
    })
}