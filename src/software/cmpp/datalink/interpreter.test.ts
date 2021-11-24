import { FrameInterpreted } from "."
import { flattenArrayDeep, makeRange, random, repeaterItor } from "../../core/utils"
import { ACK, NACK, StartByteNum, STX } from "./core-types"
import { Payload, executeCmppStreamInterpretation, getRandomPayload, getRandomStartByte, makeWellFormedFrame, makeWellFormedFrameInterpreted } from "./payload"

// TODO:    Only well-formed stream are being tested. We MUST create unit test for error and edge cases 
//          (ie: esc-dup in checksum?, intermediary noise?, etc).

const quantityOfRandomRepetition = 100 // greather this number, greather is the amount of time to execute unit test

const somePayload: Payload = [0x00, 0x00, 0x00, 0x00] 

const testParseSingleWellFormedFrame = (startByte: StartByteNum, payload: Payload):void => {
    //prepare
    const probe = makeWellFormedFrame(startByte,payload)
    const probeInterpreted = makeWellFormedFrameInterpreted(startByte,payload)
    //act
    const result = executeCmppStreamInterpretation(probe)
    //check
    expect(result.onError).toEqual([])
    expect(result.onSucess.length).toEqual(1)
    expect(result.onSucess[0].frameInterpreted).toEqual(probeInterpreted)
    expect(result.onSucess[0].rawInput).toEqual(probe)
}

const testRandomGeneratedFrame = ():void => {
    // prepare
    const randomStartByte = getRandomStartByte()
    const randomPayload: Payload = getRandomPayload()
    // act, test
    testParseSingleWellFormedFrame(randomStartByte,randomPayload)
}



describe('basic test: Parssing well-formed, random, frames', () => {

    it('can parse a simple, well-formed; master, slave, slave-error frames (STX, ACK, NACK)', async () => {
        //prepare
        const masterFrame = STX
        const slaveFrame = ACK
        const slaveErrorFrame = NACK
        const somePayload = [0,0,0,0] as const
        // act, check
        testParseSingleWellFormedFrame(masterFrame, somePayload)
        testParseSingleWellFormedFrame(slaveFrame, somePayload)
        testParseSingleWellFormedFrame(slaveErrorFrame, somePayload)
    })

    it('can parse N, random generate, well-formed, frames', async () => {
        const trials = quantityOfRandomRepetition;
        [...makeRange(0,trials)].forEach( () => testRandomGeneratedFrame() )
    })

    it('can parse N well-formed, equal, master frames', async () => {
        //configure
        const repeat = quantityOfRandomRepetition 
        const wellFormedFrame = makeWellFormedFrame(STX,somePayload) 
        const correctMasterFrameInterpreted: FrameInterpreted = makeWellFormedFrameInterpreted(STX,somePayload)
        //prepare
        const input = flattenArrayDeep<number[][], number[]>([...repeaterItor(repeat,wellFormedFrame )])
        //act
        const result = executeCmppStreamInterpretation(input)
        //check
        expect(result.onError).toEqual([])
        expect(result.onSucess.length).toEqual(repeat)
        result.onSucess.map( event => {
            expect(event.frameInterpreted).toEqual(correctMasterFrameInterpreted)
            expect(event.rawInput).toEqual(wellFormedFrame)
        })            
    })

    it('can parse N well-formed, random frames, in the same single input', async () => {
        //configure
        const N = quantityOfRandomRepetition
        type Frame_ = {
            startByte: StartByteNum
            payload: Payload
        }
        //  -- make random frames
        let frames: readonly Frame_[] = [];
        [...makeRange(0,N)].forEach( () => {
            frames = [...frames, {
                startByte: getRandomStartByte(),
                payload: getRandomPayload(),
            }]
        })
        //  -- make input 
        const input = flattenArrayDeep<number[][],number[]>(frames.map( frame => makeWellFormedFrame(frame.startByte, frame.payload)))
        // act
        const result = executeCmppStreamInterpretation(input)
        //check
        expect(result.onError).toEqual([])
        expect(result.onSucess.length).toEqual(N)
        result.onSucess.map( (event, index) => {
            const frame = frames[index]
            expect(event.frameInterpreted).toEqual(makeWellFormedFrameInterpreted(frame.startByte, frame.payload))
            expect(event.rawInput).toEqual(makeWellFormedFrame(frame.startByte, frame.payload))
        }) 
               
    })

    
})