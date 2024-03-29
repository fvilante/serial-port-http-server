import { FrameInterpreted } from "../../core/frame-core"
import { runOnce } from "../../../../core/utils"
import { getLoopBackEmulatedSerialPort } from "../../../../serial/port-controler/loopback/loopback"
import { ACK } from "../../core/core-types"
import { makeWellFormedFrame, makeWellFormedFrameInterpreted } from "../../core/special-case-data-constructors"
import { Payload, PayloadCore } from "../../core/payload"
import { EventHandler, payloadTransaction_CB } from "../payload-transact-cb"
import { PortSpec } from "../../../../serial/core/port-spec"


describe('basic tests', () => {

    const portA: PortSpec = {path: 'Com_A_test', baudRate: 9600}
    const portB: PortSpec = {path: 'Com_B_test', baudRate: 9600}

    it('can transact a simple well formed payload', async done => {
        //TODO: Should test if the port closing was adequated handled
        //prepare
        const timeout = 400
        const [ source, target ] = getLoopBackEmulatedSerialPort(portA, portB)
        const payload: Payload = [1, 2, 3, 4]
        const payloadCore: PayloadCore = {startByte:ACK, payload }
        const expectedResponse: FrameInterpreted = makeWellFormedFrameInterpreted(payloadCore)
        const emulatedResponse: number[] = makeWellFormedFrame(payloadCore)
        target.onData( data => {
            const runResponse = runOnce(() => { 
                target.write(emulatedResponse)
            })
            runResponse()
        })
        type Status = {
            [K in keyof EventHandler]?: boolean
        }
        //act
        let status_: Status = { }
        //TODO: When the API become more stable, test also the messages sent's through the events 
        payloadTransaction_CB(source, payloadCore, timeout,{
            //check
            BEGIN: () => {
                status_ = { ...status_, BEGIN: true }
            },
            willSend: () => {
                status_ = { ...status_, willSend: true }
            },
            hasSent: () => {
                status_ = { ...status_, hasSent: true }
            },
            onDataChunk: () => {
                status_ = { ...status_, onDataChunk: true }
            },
            onStateChange: () => {  
                status_ = { ...status_, onStateChange: true }
            },
            onError: () => {
                status_ = { ...status_, onError: false } // note: this line is not executed
            },
            onSuccess: () => {
                status_ = { ...status_, onSuccess: true }
            },
            END: (result, header) => {
                status_ = { ...status_, END: true }
                const expected: Status = {
                    BEGIN: true,
                    willSend: true,
                    hasSent: true,
                    onDataChunk: true,
                    onStateChange: true,
                    //onError: undefined, // note: onError event is not executed
                    onSuccess: true,
                    END: true,
                }
                expect(status_).toEqual(expected)
                //
                expect(result.kind).toEqual('SuccessEvent')
                if(result.kind==='SuccessEvent') {
                    const { frameInterpreted } = result
                    expect(frameInterpreted).toEqual(expectedResponse)
                }
                
                //cleanup is important
                source.close()
                target.close()
                done()
            }
        })

    })

    it('can transact with an timeout event', async done => {
        //prepare
        const timeout = 100
        const [ source, target ] = getLoopBackEmulatedSerialPort(portA, portB)
        const payload: Payload = [1, 2, 3, 4]
        const payloadCore: PayloadCore = {startByte:ACK, payload }
        //act
        let timeoutErrorCounter: number = 0
        //TODO: When the API become more stable, test also the messages sent's through the events 
        payloadTransaction_CB(source, payloadCore, timeout,{
            //check
            BEGIN: () => {},
            willSend: () => {},
            hasSent: () => {},
            onDataChunk: () => {},
            onStateChange: () => {},
            onError: (err) => {
                expect(err.kind).toEqual('TimeoutErrorEvent')
                timeoutErrorCounter++
                
            },
            onSuccess: () => {},
            END: (result) => {
                expect(timeoutErrorCounter).toEqual(1)
                //cleanup is important
                source.close()
                target.close()
                done()
            }
        })

    })

   
})