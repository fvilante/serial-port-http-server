import { FrameInterpreted } from "./frame-core"
import { InterpretIncomming } from "./interpreter"
import { Byte } from "../../../core/byte"
import { flattenArrayDeep, makeRange, random, repeaterItor } from "../../../core/utils"
import { ACK, NACK, StartByteNum, STX } from "./core-types"
import { getRandomPayload, getRandomStartByte, makeWellFormedFrame, makeWellFormedFrameInterpreted } from "./special-case-data-constructors"
import { Payload, PayloadCore } from "./payload"
import { InterpretationErrorEvent, StateChangeEvent, SuccessEvent } from "./interpreter"

// TODO:    Only well-formed stream are being tested. We MUST create unit test for error and edge cases 
//          (ie: esc-dup in checksum?, intermediary noise?, etc).

const quantityOfRandomRepetition = 100 // greather this number, greather is the amount of time to execute unit test

const somePayload: Payload = [0x00, 0x00, 0x00, 0x00] 

const testParseSingleWellFormedFrame = (dataToSend: PayloadCore):void => {
    const {payload, startByte } = dataToSend
    //prepare
    const probe = makeWellFormedFrame(dataToSend)
    const probeInterpreted = makeWellFormedFrameInterpreted(dataToSend)
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
    const dataToSend: PayloadCore = {
        payload: getRandomPayload(),
        startByte: getRandomStartByte
        ()
    }
    // act, test
    testParseSingleWellFormedFrame(dataToSend)
}

export type ExecutionResult = {
    onSucess: readonly SuccessEvent[]
    onError: readonly InterpretationErrorEvent[]
    onStateChange: readonly StateChangeEvent[]
}

// NOTE: This function is being used in test units; I'm not sure it is necessary for other conditions
//       May be an unecessary indirection. Check and remove it if possible.
export const executeCmppStreamInterpretation = (input: readonly Byte[], lastState?: ExecutionResult):ExecutionResult => {
    let result: ExecutionResult = lastState ? lastState : {onError: [], onStateChange: [], onSucess: []}
    const parser = InterpretIncomming
    const parse = parser({
        onSuccess: event => {
            result.onSucess = [...result.onSucess, event]
        },
        onError: event => {
            result.onError = [...result.onError, event]
        },
        onStateChange: event => {
            result.onStateChange = [...result.onStateChange, event]
        }
    })
    //run
    input.forEach( byte => parse(byte))
    return result
}



describe('basic test: Parssing well-formed, random, frames', () => {

    it('can parse a simple, well-formed; master, slave, slave-error frames (STX, ACK, NACK)', async () => {
        //prepare
        const masterFrame = STX
        const slaveFrame = ACK
        const slaveErrorFrame = NACK
        const somePayload = [0,0,0,0] as const
        // act, check
        testParseSingleWellFormedFrame({startByte: masterFrame, payload: somePayload })
        testParseSingleWellFormedFrame({startByte: slaveFrame, payload: somePayload })
        testParseSingleWellFormedFrame({startByte: slaveErrorFrame, payload: somePayload })
    })

    it('can parse N, random generate, well-formed, frames', async () => {
        const trials = quantityOfRandomRepetition;
        [...makeRange(0,trials)].forEach( () => testRandomGeneratedFrame() )
    })

    it('can parse N well-formed, equal, master frames', async () => {
        //configure
        const repeat = quantityOfRandomRepetition 
        const dataToSend = {startByte: STX, payload: somePayload}
        const wellFormedFrame = makeWellFormedFrame(dataToSend ) 
        const correctMasterFrameInterpreted: FrameInterpreted = makeWellFormedFrameInterpreted(dataToSend)
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
        const input = flattenArrayDeep<number[][],number[]>(frames.map( frame => {
            const dataToSend: PayloadCore = { startByte: frame.startByte, payload: frame.payload }
            return makeWellFormedFrame(dataToSend)
        }))
        // act
        const result = executeCmppStreamInterpretation(input)
        //check
        expect(result.onError).toEqual([])
        expect(result.onSucess.length).toEqual(N)
        result.onSucess.map( (event, index) => {
            const frame = frames[index]
            const dataToSend = { startByte: frame.startByte, payload: frame.payload}
            expect(event.frameInterpreted).toEqual(makeWellFormedFrameInterpreted(dataToSend))
            expect(event.rawInput).toEqual(makeWellFormedFrame(dataToSend))
        }) 
               
    })

    
})