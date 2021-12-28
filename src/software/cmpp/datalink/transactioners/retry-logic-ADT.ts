import { FrameInterpreted } from "../core/frame-core";
import { Future, Future_ } from "../../../adts/future";
import { Result, Result_ } from "../../../adts/result";
import { exhaustiveSwitch } from "../../../core/utils";
import { TransactErrorEvent } from "./payload-transact-cb";
import { TransactPayloadArgument_ADT, transactPayload_ADT } from "./transact-payload_ADT";


export type RetryPolicy = {
    readonly totalRetriesOnTimeoutError: number  // number of retries
    readonly totalRetriesOnInterpretationError: number
}

// TODO: Improve this API when possible,
//       It shold be in such way that client of function can receive intermediarry attemps statys
// Applies a retry policy over the transactionPayload API
export const transactPayloadWithRetryPolicy = 
    (totalRetry: RetryPolicy) => 
    (arg: TransactPayloadArgument_ADT): Future<Result<FrameInterpreted,TransactErrorEvent>>  => {

    return Future( _yield => {

        const { return_ok, return_error} = Future_.makeContructorsFromResultEmitter(_yield)

        const run = (currentRetry: RetryPolicy) => {

            transactPayload_ADT(arg).unsafeRun( result => {
                result.forEach( {
                    Ok: value => {
                        return_ok(value)
                    },
                    Error: err => {
                        const kind = err.kind
                        switch (kind) {
                            case 'TimeoutErrorEvent': {
                                const totalRetries = totalRetry.totalRetriesOnTimeoutError
                                const retryCount = currentRetry.totalRetriesOnTimeoutError
                                // do not retry if counter reach zero
                                if (retryCount<=0) {
                                    return_error(err)
                                } else {
                                    console.log(`new attempy: ${retryCount}/${totalRetries}`)
                                    //retry
                                    run({
                                        ...currentRetry,
                                        totalRetriesOnInterpretationError: retryCount - 1
                                    })
                                }
                                break;
                            }
    
                            case 'InterpretationErrorEvent': {
                                const totalRetries = totalRetry.totalRetriesOnInterpretationError
                                const retryCount = currentRetry.totalRetriesOnInterpretationError
                                // retry if the problem is an interpretation error
                                if (retryCount<=0) {
                                    return_error(err)
                                } else {
                                    console.log(`new attempy: ${retryCount}/${totalRetries}`)
                                    //retry
                                    run({
                                        ...currentRetry,
                                        totalRetriesOnInterpretationError: retryCount - 1
                                    })
                                }
                                break;
                            }

                            default: {
                                exhaustiveSwitch(kind)
                            }
                        }
                    }
                })
            })

        }

        //BEGIN
        run(totalRetry);

    })

}