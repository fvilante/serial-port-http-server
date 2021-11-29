import { FrameInterpreted } from ".."
import { runOnce } from "../../../core/utils"
import { getLoopBackEmulatedSerialPort } from "../../../serial/loopback"
import { ACK } from "../core-types"
import { Payload, getRandomPayload, makeWellFormedFrame, makeWellFormedFrameInterpreted } from "../payload"
import { cmppSimpleTransaction } from "./payload-transact"


describe('basic tests', () => {

    it('can run a simple transactioner constructed from a opened serial port', async () => {
        //TODO: Should test if the port closing was adequated handled
        //prepare
        const [ source, dest ] = getLoopBackEmulatedSerialPort()
        const payload: Payload = [1, 2, 3, 4]
        const expected: FrameInterpreted = makeWellFormedFrameInterpreted(ACK,payload)
        dest.onData( data => {
            //this call back can be called multple times in theory: one for each byte received, thus we use runOnce here.
            runOnce(() => {
                const emulatedResponse: number[] = makeWellFormedFrame(ACK,payload)
                dest.write(emulatedResponse)
            })()
        })
        //act
        const actual = await cmppSimpleTransaction(source,payload)
        //check
        expect(actual).toEqual(expected)
        
    })
})