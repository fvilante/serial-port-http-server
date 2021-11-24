import { FrameInterpreted } from ".."
import { Byte, Bytes } from "../../../core/byte"
import { flattenArrayDeep, makeRange, random, repeaterItor } from "../../../core/utils"
import { calcChecksum_ } from "../calc-checksum"
import { ACK, ESC, ETX, NACK, StartByteNum, STX } from "../core-types"
import { ErrorEvent, InterpretIncomming, StateChangeEvent, SuccessEvent } from "./interpreter-refactored"

// TODO:    Only well-formed stream are being tested. We MUST create unit test for error and edge cases 
//          (ie: esc-dup in checksum?, intermediary noise?, etc).
// TODO:    Extract below helper functions to a particular file, so test unit remain slim.

const quantityOfRandomRepetition = 100 // greather this number, greather is the amount of time to execute unit test

type Payload = readonly [dirChan: number, waddr: number, dataLow: number, dataHigh: number]

const somePayload: Payload = [0x00, 0x00, 0x00, 0x00] 

const getRandomPayload = ():Payload => {
    return [random(0,0xFF),random(0,0xFF),random(0,0xFF),random(0,0xFF),]
}

const getRandomStartByte = ():StartByteNum => {
    const startByte = [STX,ACK,NACK]
    const randomStartByte = startByte[random(0,startByte.length-1)]
    return randomStartByte
}

const duplicateEsc = (payload: readonly number[]): readonly number[] => {
    let acc: readonly Byte[] = [] //payload_with_esc_duplicated
    payload.forEach( byte => {
        if (byte===ESC) {
            acc = [...acc, ESC, ESC]
        } else {
            acc = [...acc, byte]
        }
    }) 
    return acc 
}

const makeWellFormedFrame = (startByte: StartByteNum, payload: Payload) => {
    const checksum = calcChecksum_(payload,startByte)
    return [ESC, startByte, ...duplicateEsc(payload), ESC, ETX, ...duplicateEsc([checksum])]
}

const makeWellFormedFrameInterpreted = (startByte: StartByteNum, payload: Payload): FrameInterpreted => {
    const checksum = calcChecksum_(payload,startByte)
    return {
        firstEsc: [ESC],
        startByte: [startByte],
        dirChan: duplicateEsc([payload[0]]),
        waddr: duplicateEsc([payload[1]]),
        dataLow: duplicateEsc([payload[2]]),
        dataHigh: duplicateEsc([payload[3]]),
        lastEsc: [ESC],
        etx: [ETX],
        checkSum: duplicateEsc([checksum]),
        expectedChecksum: checksum,
    } as unknown as any //TODO: remove this type cast 
}

type ExecutionResult = {
    onSucess: readonly SuccessEvent[]
    onError: readonly ErrorEvent[]
    onStateChange: readonly StateChangeEvent[]
}

const execute = (input: readonly Byte[], lastState?: ExecutionResult):ExecutionResult => {
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

const testParseSingleWellFormedFrame = (startByte: StartByteNum, payload: Payload):void => {
    //prepare
    const probe = makeWellFormedFrame(startByte,payload)
    const probeInterpreted = makeWellFormedFrameInterpreted(startByte,payload)
    //act
    const result = execute(probe)
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
        const result = execute(input)
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
        const result = execute(input)
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