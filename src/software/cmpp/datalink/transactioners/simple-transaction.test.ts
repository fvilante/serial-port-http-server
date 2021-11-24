import { FrameInterpreted } from ".."
import { runOnce } from "../../../core/utils"
import { getLoopBackEmulatedSerialPort } from "../../../serial/loopback"
import { ACK } from "../core-types"
import { Payload, getRandomPayload, makeWellFormedFrame, makeWellFormedFrameInterpreted } from "../payload"
import { cmppSimpleTransaction } from "./simple-transaction"

    it('can run a simple transactioner constructed from a opened serial port', async () => {
        //TODO: Should test if the port closing was adequated handled
        //prepare
        const { source, dest} = getLoopBackEmulatedSerialPort()
        const payload: Payload = [0, 0, 0, 0]
        const emulatedResponse: number[] = makeWellFormedFrame(ACK,payload)
        const expected: FrameInterpreted = makeWellFormedFrameInterpreted(ACK,payload)
        dest.onData( data => {
            runOnce(() => {
                dest.write(emulatedResponse)
            })()
        })
        //act
        const actual = await cmppSimpleTransaction(source)(payload)
        //check
        expect(actual).toEqual(expected)
        
    })