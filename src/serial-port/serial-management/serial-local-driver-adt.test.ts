import { PortInfo, PortOpened, SerialDriver, SerialDriverConstructor } from "../../serial-local-driver"
import { Future, Future_ } from "../adts/future"
import { Push } from "../adts/push-stream"
import { Result, ResultMatcher, Result_ } from "../adts/result"
import { PortError, PortToOpen, SerialLocalDriverADT } from "./serial-local-driver-adt"



describe('basic tests', () => {

    describe('Using the real hardware effects', () => {

        //NOTE: The ports expecteds is according which ports you have instaled in you enviroment. 
        //      It may change from each enviroment. 
        //      It is expected you change the 'expected' variable in demand
        it('Can list serial ports', async (done) => {
            
            //prepare
            let actual: readonly string[] = []
            const expected: readonly string[] = [
               'COM29', 'COM30', 'COM4', 'COM5'
            ]
            const driver = SerialDriverConstructor()
            const driver_ = SerialLocalDriverADT(driver)
            //act
            const action = driver_.listPorts()
            //check
            action.unsafeRun( r => {
                const i = r.unsafeRun()
                if(i.hasError===false) {
                    actual = i.value.map( a => a.uid)
                    expect(actual.length).toEqual(expected.length)
                    expect(actual).toEqual(expected)
                } else {
                    // never hapens branch
                    expect(true).toBe(false)
                }
                done();
            })
        })

        // NOTE: I'm using the 'com0com' software instaled which is a system level windows serial driver emulator with loopback
        //       If you do not have this software instaled in your test enviroment (computer), probably this test will not pass
        it('Can write and read data through ports', async (done) => {
            
            //prepare
            //jest.setTimeout(20000)
            const probe = [1,2,3] as const //data to send
            const COM4: PortToOpen = {
                portPath: 'COM4',
                baudRate: 9600,
            }
            const COM5: PortToOpen = {
                portPath: 'COM5',
                baudRate: 9600,
            }

            const driver = SerialDriverConstructor()
            const driver_ = SerialLocalDriverADT(driver)
            const port4 = driver_.openPort(COM4)
            const port5 = driver_.openPort(COM5)
 
            // writes data in port p1 and reads it in p2
            // fix: we have here the 'call-back hell', refactor this code
            //      i'll not fix this now because of time constraints
            const writeAndReadInLoopback = (p1: typeof port4, p2: typeof port5, dataToWrite: readonly number[]): Push<Result<readonly number[], PortError>> => {
                return Push( yield_ => {
                    //console.log('started function')
                    const ports = [p1,p2] as const
                    const allPorts = Future_.all(ports)
                    allPorts.unsafeRun( rs => {
                        //console.log('has result from trying to open ports')
                        const [r1,r2] = rs.map( r => r.mapError( PortOpenError => {
                            //console.log('some error on open port',PortOpenError)
                            //console.log('more details->', PortOpenError.details?.moreDetails)
                            yield_(Result_.Error(PortOpenError))
                        }))
                        r1.forOk( p1_ => { // p1 opened
                            r2.forOk( p2_ => { // p2 opened
                                //console.log('ports opended')
                                const rx = p2_.onData() 

                                p1_.write(dataToWrite)
                                    .unsafeRun( r => {
                                        r.forError( PortWriteError => yield_(Result_.Error(PortWriteError)))
                                        //receive data
                                        rx.unsafeRun( r => {
                                            r.tapError( PortReadError => yield_(Result_.Error(PortReadError)))
                                            r.forOk( dataReceived => {
                                                //console.log('data received', dataReceived)
                                                const closePorts = [p1_.close(), p2_.close()] as const
                                                const a = Future_.all(closePorts)
                                                    .map( rs => rs.map( r => r.tapError( PortCloseError =>yield_(Result_.Error(PortCloseError)) )))
                                                    .unsafeRun( rs => {
                                                        const [r1, r2] = rs
                                                        r1.match({
                                                            Error: PortCloseError =>yield_(Result_.Error(PortCloseError)),
                                                            Ok: () => undefined,
                                                        });
                                                        r2.match({
                                                            Error: PortCloseError =>yield_(Result_.Error(PortCloseError)),
                                                            Ok: () => undefined,
                                                        });
                                                        yield_(Result_.Ok(dataReceived))
                                                    })
                                                
                                                
                                                
                                            })

                                        })

                                    })

                            })
                        })
                        
                    })
                })
            }
            
            //act
            const action = writeAndReadInLoopback(port4, port5, probe)

            //check
            let buf: number[] = []
            let expected: readonly [1, 2, 3] = probe
            action.unsafeRun( r => {
                r.mapError( err => console.log('Erro->', err))
               r.forOk( dataReceived => {
                   buf.push(...dataReceived)
                   expect(buf).toStrictEqual(expected)
                   //console.log('buffer=',buf)
                   done()
               })
            })
           
            
            
        })


    })
})