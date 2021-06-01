import { SerialDriverConstructor } from "../../../serial-local-driver";
import { Future } from "../../adts/future";
import { Push, Push_ } from "../../adts/push-stream";
import { Result, Result_ } from "../../adts/result";
import { PortOpened_, PortReadError, PortToOpen, PortWriteError, SerialDriverADT, SerialLocalDriverADT } from "../../serial-management/serial-local-driver-adt";
import { now } from "../../utils";
import { compileCoreFrame, flattenFrameSerialized, FrameCore, FrameInterpreted, FrameSerialized, Interpreter, InterpreterError, InterpreterState } from "./cmpp-datalink-protocol";


const PORT_TO_WORK = 'com29'
const BAUD_RATE = 9600


export let port___: PortOpened_ ;

export const initializeDriver = () => {
    const driver__ = SerialDriverConstructor()
    const driver_ = SerialLocalDriverADT(driver__)
    return driver_
}

export const initializePort = (driver_: SerialDriverADT) => {
    const portToOpen: PortToOpen = {
        portPath: PORT_TO_WORK,
        baudRate: BAUD_RATE,
    }

    return Future<PortOpened_>( yield_ => {
        const effect = driver_.openPort(portToOpen)
        effect.unsafeRun( r => r.match({
            Error: err => console.log(err),
            Ok: PortOpened_ => {
                yield_(PortOpened_)
            }
        }))
    })
}

export const initializeEnviroment = async () => {
    const driver = initializeDriver();
    const portOpened = await initializePort(driver).async();
    port___ = portOpened
}

export const closeEnviroment = () => {
    port___.close().unsafeRun( r => r.match({
        Error: err => { throw new Error(String(err))} ,
        Ok: () => {}
    }))
}

export const runWritter = (w: Future<Result<void, PortWriteError>>):Future<void> => {
    return Future( yield_ => {
        w.unsafeRun( r => r.match({
            Error: err => { throw new Error(String(err))},
            Ok: val => {yield_()},
        }))
    })
}

export const runReader = (rr: Push<Result<readonly number[], PortReadError>>): Push<readonly number[]> => {
    return Push( yield_ => {
        rr.unsafeRun( r => r.match({
            Error: err => { throw new Error(String(err))},
            Ok: data => {yield_(data)},
        }))
    })
}

export const serializeFrame = (frame: FrameCore): [serialized: FrameSerialized, flatten: readonly number[]] => {
    const frame_ = compileCoreFrame(frame)
    //fix: Flattening an array should be extract to an util
    const frame__ = flattenFrameSerialized(frame_)
    return [frame_, frame__]
}

export type Info = {
    timeToSend: number
    timeToReceive: number
}

export const runTransaction = <A>(w: Future<void>, r: Push<A>) => {
    let t0 = 0 // will send
    let t1 = 0 // has sent
    let t2 = 0 // has started receiving
    return Future<Info>( yield_ => {
        t0 = now()
        w.unsafeRun( onHasSent => {
            t1 = now()
            //console.log('has finished to write', frame)
            r.takeFirst().unsafeRun( data => {
                t2 = now()
                //console.log('receiving data', data)
                const timeToSend = t1-t0
                const timeToReceive = t2-t1
                yield_({
                    timeToSend,
                    timeToReceive,
                });
            })
        })
    })
}

type GenericInterpreter<S,A,B,E> = (input: Push<A>) => {
    onStateChange: Push<S>
    onSucessFull: Push<B>
    onError: Push<E>
}

export type CmppInterpreter = GenericInterpreter<InterpreterState, number, FrameInterpreted, InterpreterError>

export const adaptCmppInterpreterToGenericInterpreter = (cmpp: Interpreter):CmppInterpreter => input => {
    const x = cmpp(input)
    const a = x.FrameInterpreted
    const s = x.onStateChange
    const e = x.onError
    return {
        onSucessFull: a,
        onStateChange: s,
        onError: e,
    } 
} 

export const runTransaction2 = <S,A,B,E>(w: Future<void>, r: Push<A>, interpreter: GenericInterpreter<S,A,B,E>): Push<Result<[B,Info], E>> => {
    let t0 = 0 // will send
    let t1 = 0 // has sent
    let t2 = 0 // has started receiving
    return Push( yield_ => {
        t0 = now()
        w.unsafeRun( onHasSent => {
            t1 = now()
            const x = interpreter(r)
            const be_ = Push_.union(x.onSucessFull,x.onError)
            be_.unsafeRun( be => {
                be.toResult().match({
                    Error: err => yield_(Result_.Error(err)),
                    Ok: valueB => {
                        t2 = now()
                        const timeToSend = t1-t0
                        const timeToReceive = t2-t1
                        const info = {
                            timeToSend,
                            timeToReceive,
                        }
                        yield_(Result_.Ok([valueB, info]));
                    }
                })
                
            })
        })
    })
}

export const FrameInterpreter = Interpreter // name alias
