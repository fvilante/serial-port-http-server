import { SerialDriverConstructor } from "../../../serial-local-driver";
import { Future, Future_ } from "../../adts/future";
import { Either } from "../../adts/maybe/either";
import { Push, Push_ } from "../../adts/push-stream";
import { Result, Result_ } from "../../adts/result";
import { PortCloseError, PortError, PortOpened_, PortOpenError, PortReadError, PortToOpen, PortWriteError, SerialDriverADT, SerialLocalDriverADT } from "../../serial-management/serial-local-driver-adt";
import { compileCoreFrame, flattenFrameSerialized, FrameCore } from "./cmpp-datalink-protocol";



type Port = Future<Result<PortOpened_, PortOpenError>>

type SendSync = (port: PortOpened_, data: readonly number[]) => Future<{
    finishedToWrite: Future<void>, 
    dataReceived: Push<readonly number[]>
    errors: Push<PortWriteError | PortReadError>
    finish: () => void
}>

type Events_ =  
    | {kind: 'Opening serial connection', info: PortToOpen }
    | {kind: 'Connection sucessfully opened' }
    | {kind: 'Start to sending data', data: readonly number[] }
    | {kind: 'Data has been sent', finish: () => Future<void> }
    | {kind: 'Receiving data', data: readonly number[], finish: () => Future<void>}
    | {kind: 'Closing serial connection'}
    | {kind: 'Port Sucessfully closed'} 

// open port write in it wait result and close it, emit error if it hapens, and a signal when finished to sent
const work = (
    portToOpen: PortToOpen,
    dataToWrite: readonly number[],
    driver_: SerialDriverADT,
    ): 
    Push<Result<Events_,PortError>
    > => {

    return Push( yield_ => {

        const {Error:Fail, Ok} = Result_
        
        yield_(Ok({kind: 'Opening serial connection', info: portToOpen}))
        
        driver_.openPort(portToOpen)
            .unsafeRun( r => {
                r.match({
                    Error: PortOpenError => yield_(Fail(PortOpenError)) ,
                    Ok: PortOpened_ => {
                        yield_(Ok({kind: 'Connection sucessfully opened', info: portToOpen}))
                        yield_(Ok({kind: 'Start to sending data', data: dataToWrite}))              
                        PortOpened_.write(dataToWrite)
                            .unsafeRun( r => {
                                r.match({
                                    Error: PortWriteError => yield_(Fail(PortWriteError)),
                                    Ok: hasBeenWriten => {
                                        const finish = ():Future<void> => {
                                            yield_(Ok({kind: 'Closing serial connection'}));
                                            return PortOpened_.close().map( r => {
                                                r.match({
                                                    Error: err => yield_(Fail(err)),
                                                    Ok: val => yield_(Ok({kind: 'Port Sucessfully closed'}))
                                                })
                                            })
                                        }
                                        yield_(Ok({kind: 'Data has been sent', finish}))
                                        // Fix: I'm grabing the hook for data reception after data has been sent. Depending upon time which it takes to set the reception handler, maybe some data may be lost. Verify which kind of effect this will produce in production, and change if it necessary. You may set the reception handler before send data.
                                        PortOpened_.onData()
                                            .unsafeRun( r => {
                                                r.match({
                                                    Error: PortReadError => yield_(Fail(PortReadError)),
                                                    Ok: dataReceived => {
                                                        yield_(Ok({kind: 'Receiving data', data: dataReceived, finish}))


                                                    }
                                                })
                                            })
                                    },
                                })
                            })
                    
                    }
                })
            })


        
    })


}
   
const work2 = (
    portToOpen: PortToOpen,
    dataToWrite: readonly (readonly number[])[],
    driver_: SerialDriverADT,
    ) => {
    
        const [dataToWrite1, dataToWrite2] = dataToWrite
        const effect1 = work(portToOpen, dataToWrite1, driver_)
        const effect2 = work(portToOpen, dataToWrite1, driver_)

        effect1.unsafeRun( r => {
            console.log(`###### 1 ########`)
            r.match({
                Error: err => console.log(err),
                Ok: event => {
                    console.log("#1:",event)
                    if(event.kind==='Data has been sent') {

                        effect2.unsafeRun( r => {
                            console.log(`###### 2 ########`)
                            r.match({
                                Error: err => console.log(err),
                                Ok: event => {
                                    console.log("#2:",event)
                                }
                            })
                        })


                    }


                }
            })
        })
    
    
    }

const Test1 = () => {

    const portToOpen: PortToOpen = {
        baudRate: 9600,
        portPath: 'com29'
    }
    const dataToWrite: readonly number[] = 
        [27, 2, 192, 80, 98, 2, 27, 3, 135] // sent
      //[27, 6, 192, 80, 0, 16, 27, 3, 215 ] // expected to receive
    const driver = SerialLocalDriverADT(SerialDriverConstructor())
    const effect = work(portToOpen, dataToWrite, driver)
    effect.unsafeRun( r => {
        console.log(`*******************************************`)
        r.match({
            Error: err => console.log(`Errrorororroorororo --->`, err),
            Ok: event => {
                if (event.kind==='Opening serial connection') {
                    console.log("Wow! Haha! Open serial! hul", portToOpen)
                }
                console.log(event)
            } 
        })
    })

}



// writes to datas, the second after the first has been written
const Test2 = () => {
    let executed = false
    const receptionTimeout = 14 //milisecs
    const portToOpen: PortToOpen = {
        baudRate: 9600,
        portPath: 'com29'
    }

    const dataToWrite1: readonly number[] = 
        [27, 2, 192, 80, 98, 2, 27, 3, 135] // sent
      //[27, 6, 192, 80, 0, 16, 27, 3, 215 ] // expected to receive

      const dataToWrite2: readonly number[] = 
      [27, 2, 192, 80, 98, 2, 27, 3, 135] // sent
    //[27, 6, 192, 80, 0, 16, 27, 3, 215 ] // expected to receive

    const driver = SerialLocalDriverADT(SerialDriverConstructor())
    const effect = work2(portToOpen, [dataToWrite1, dataToWrite2], driver)
    /*effect.unsafeRun( r => {
        console.log(`*******************************************`)
        r.match({
            Error: err => {
                console.log(`Errrorororroorororo --->`, err)
                console.log("Details--->", (err as any).details.moreDetails.details)
            },
            Ok: event => {
                if (event.kind==='Opening serial connection') {
                    console.log("Wow! Haha! Open serial! hul", portToOpen)
                }
                //close port after 1000 of first reception 
                if (event.kind==='Receiving data') {
                    if(executed===false) {
                        console.log(`nonoooonononnoonononononoadsfuiadsfuqadsofsd`)
                        executed = true
                        const close = event.finish
                        setTimeout( () => {
                            close().unsafeRun( hasClosed => {
                                console.log('Hahah-> port closed after some time receiving')
                            })
                        }, receptionTimeout)
                    }
                }
                console.log(event)
            } 
        })
    })*/

}

Test2();