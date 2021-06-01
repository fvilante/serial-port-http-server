import { Future, Future_ } from "../../adts/future";
import { Result } from "../../adts/result";
import { Push, Push_ } from "../../adts/push-stream";
import { 
    compileCoreFrame, 
    flattenFrameSerialized, 
    FrameCore, 
    FrameInterpreted, 
    FrameSerialized, 
    InterpreterError,
    InterpreterState,
    Interpreter as CMPPInterpreter,
 } from "./cmpp-datalink-protocol";
import { PortOpened, SerialDriverConstructor } from "../../../serial-local-driver";
import { Pull_ } from "../../adts/stream/pull";


export type Connection = {
    begin: () => Future<void>
    tx: (_: readonly number[]) => Future<void>
    rx: () => Push<readonly number[]>
    end: () => Future<void>
}

export type SyncCommEvents<A,B,E> = 
    | { kind: 'Connection begin'}
    | { kind: 'Started TX' }
    | { kind: 'Finished TX' }
    | { kind: 'Started RX' }
    | { kind: 'Receiving data' }
    | { kind: 'Finishing RX' }
    | { kind: 'Connection ended' }
    | { kind: 'Sucessful finished', value: B}
    | { kind: 'Finished with interpretation error', error: E}


export type SyncComm<A,B,E> = {
    kind: 'SynComm'
    run: (connection: Connection, data: A) => Push<SyncCommEvents<A,B,E>>
}

export type FinishRX = () => Future<void> // call end connection
export type Interpreter<B,E> = (input: Push<readonly number[]>, finishRX: FinishRX) => Future<Result<B,E>>

export type Serializer<A> = (_:A) => readonly number[]

export type SyncCommState<A,B,E> = {
    interpreter: Interpreter<B,E>
    serializer: Serializer<A>
}

export const SyncComm = <A,B,E>(state: SyncCommState<A,B,E>):SyncComm<A,B,E> => {

    type T = SyncComm<A,B,E>

    const run: T['run'] = (connection, data) => {

        const { serializer, interpreter } = state
        
        return Push( yield_ => {

            //open communication channel
            yield_({kind: 'Connection begin'})
            connection.begin().unsafeRun( ready => {

                //send data
                yield_({kind:'Started TX'})
                const dataSerialized = serializer(data)
                connection.tx(dataSerialized)
                    .unsafeRun( finishedTX => {
                        yield_({kind: 'Finished TX'})
                                                                        
                        //prepare to read data
                        yield_({kind: 'Started RX'})
                        const rxData = connection.rx()
                        // rx finishing
                        const finisher: FinishRX = () => {
                            yield_({kind: 'Finishing RX'})
                            return Future<void>( resolve => {
                                connection.end().unsafeRun( onConnectionEnd => {
                                    yield_({kind: 'Connection ended'})
                                    resolve()
                                });
                                
                            })  
                        }
                        // interpret data rx
                        const interpreted = interpreter(rxData,finisher)
                        interpreted.unsafeRun( result => {
                            result.match({
                                Error: error => yield_({kind: 'Finished with interpretation error', error}),
                                Ok: value => yield_({kind: 'Sucessful finished', value}),
                            })
                        })

                    })


            })
            
            
            
            
        })
    }


    return {
        kind: 'SynComm',
        run,
    }

}

type SyncConn2 = {
    tx: () => Future<void>
}

const SyncConn2Reducer = (frameA: SyncConn2, frameB: SyncConn2, intervalMsecs: number = 0):SyncConn2 => {

    const r = Future<void>( yield_ => {
        frameA.tx().unsafeRun( onTx1Finished => {
           
            Future_.delay(intervalMsecs).unsafeRun( intervalHasFinished => {
                frameB.tx().unsafeRun( onTx2Finished => {
                    yield_() // second tx has finished -> emit signal
                })
            })
            
        })

    })

    return {
        tx: () => r
    }
    

}


// test

const Test1 = async () => {

    console.log('iniciando...');

    const interpreter__: Interpreter<FrameInterpreted, InterpreterError> = (stream, finish) => {
        return Future( yield_ => {
            const input = Push_.droplet(stream)
            const interpreted = CMPPInterpreter(input)
            const {
                FrameInterpreted,
                onError,
                onStateChange,
            } = interpreted
            const signal = Push_.union(FrameInterpreted,onError)
            signal.takeFirst().unsafeRun( either => {
                const result = either.toResult()
                finish().unsafeRun( onFinish => {
                    //wait finish process being concluded
                    yield_(result)
                })
                
            })
        })
    }

    const PortToConnection = (port: PortOpened): Connection => {
        return {
            begin: () => Future<void>( resolve => resolve()),
            tx: data => Future_.fromUnsafePromise( () => port.write(data)).map( r => {
                return r.forError( error => {
                    console.log('port transmission error');
                    console.log('details');
                    console.log(error);
                })
            }),
            rx: () => Push( yield_ => port.onData( data => yield_(data))),
            end: () => Future<void>( resolve => {
                //port.close()
                resolve()
            }),
        }
    }

    const state: SyncCommState<FrameCore,FrameInterpreted,InterpreterError> = {
        serializer: frame => flattenFrameSerialized(compileCoreFrame(frame)),
        interpreter: interpreter__,
    }
    const syncCommA = SyncComm(state)

    const driver = SerialDriverConstructor()
    const portOpen = await driver.open('com29', 9600)
    const connection = PortToConnection(portOpen)


    const frameCore1: FrameCore = { 
        startByte: 'STX',
        direction: 'Solicitacao',
        channel: 0,
        waddr: 193,
        uint16: 0,
    }
 
    const makeSyncConn2 = (conn: Connection, frame: FrameCore):SyncConn2 => {
        
        return {
            tx: () => {

                return Future<void>( yield_ => {

                    const effect = syncCommA.run(conn, frame)
                    effect.unsafeRun( syncCommEvents => {
                        const event = syncCommEvents
                        console.log(event)
                        if(event.kind==='Finished TX') {
                            yield_()
                        }

                    })


                })


            }
        }
    }
       
    const s1 = makeSyncConn2(connection, frameCore1)
    const s2 = makeSyncConn2(connection, frameCore1)

    const r = SyncConn2Reducer(s1,s2,0)

    const s1andS2 = r.tx()
    //s1andS2.unsafeRun( a => undefined)

    //await s1.tx().async()

    const effect = syncCommA.run(connection, frameCore1)
    effect.unsafeRun( event => {
        console.log(event)
    })

    portOpen.close();


   


}

Test1().then( () => console.log("Final da execucao do programa."))