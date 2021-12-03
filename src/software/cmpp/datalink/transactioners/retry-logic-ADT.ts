import { FrameInterpreted } from "..";
import { Future } from "../../../adts/future";
import { Result, Result_ } from "../../../adts/result";
import { portOpener_CB } from "../../../serial/port-opener-cb";
import { frameCoreToPayload } from "../frame-core";
import { TransactErrorEvent } from "./payload-transact-cb";
import { TransactPayloadArgument_ADT, transactPayload_ADT } from "./transact-payload_ADT";


// TODO: Improve this API when possible,
//       It shold be in such way that client of function can receive intermediarry attemps statys
// Applies a retry policy over the transactionPayload API
export const transactPayloadWithRetryPolicy = (retries: number) => (arg: TransactPayloadArgument_ADT): Future<Result<FrameInterpreted,TransactErrorEvent>>  => {
    const { ok, fail } = Result_.makeConstructors<FrameInterpreted, TransactErrorEvent>()
    return Future( _yield => {

        const run = (retryCount: number) => {

            transactPayload_ADT(arg).unsafeRun( result => {
                result.forEach( {
                    Ok: value => {
                        _yield(ok(value))
                    },
                    Error: err => {
                        switch (err.kind) {
                            case 'TimeoutErrorEvent': {
                                fail(err)
                                break;
                            }
    
                            case 'InterpretationErrorEvent': {
                                // retry if the problem is an interpretation error
                                if (retryCount<=0) {
                                    fail(err)
                                } else {
                                    console.log(`new attempy: ${retryCount}/${retries}`, )
                                    //retry
                                    run(retryCount-1)
                                }
                                break;
                            }

                            default: {
                                fail(err)
                            }
                        }
                    }
                })
            })

        }

        run(retries);

    })

}