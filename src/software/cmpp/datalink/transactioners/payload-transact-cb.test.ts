import { FrameInterpreted } from ".."
import { runOnce } from "../../../core/utils"
import { getLoopBackEmulatedSerialPort } from "../../../serial/loopback"
import { ACK, STX } from "../core-types"
import { Payload, getRandomPayload, makeWellFormedFrame, makeWellFormedFrameInterpreted, PayloadCore } from "../payload"
import { EventHandler, payloadTransaction_CB } from "./payload-transact-cb"


describe('basic tests', () => {

    it('can transact a simple well formed payload', async done => {
        //TODO: Should test if the port closing was adequated handled
        //prepare
        const [ source, target ] = getLoopBackEmulatedSerialPort()
        const payload: Payload = [1, 2, 3, 4]
        const dataToSend: PayloadCore = {startByte:ACK, payload }
        const probe_ = [payload, ACK] as const
        const expectedResponse: FrameInterpreted = makeWellFormedFrameInterpreted(dataToSend)
        const emulatedResponse: number[] = makeWellFormedFrame(dataToSend)
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
        payloadTransaction_CB(source, dataToSend, {
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
                
                done()
            }
        })

    })

   
})