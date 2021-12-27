import { calcChecksum } from "./core/calc-checksum";
import { int2word, word2int } from "./int-to-word-conversion";
import { Direction, DirectionNum, DirectionNumToText, ESC, ETX, StartByte, StartByteNum, StartByteToText, StartByteTxt } from "./core-types";
import { Payload, PayloadCore } from "./core/payload";
import { bit_clear, bit_test } from "../../core/bit-wise-utils";
import { Byte } from "../../core/byte";

export type FrameCore = {
    startByte: StartByteTxt
    direction: keyof Direction
    channel: number
    waddr: number // abbreviation of 'word address', this is how I call 'cmd'
    uint16: number // data
}

export const frameCoreToPayload = (frame:FrameCore): PayloadCore => {
    // TODO: validate range of channel, waddr, etc.
    const { startByte, direction, channel, waddr, uint16} = frame
    const dirNum = Direction[direction]
    const directionAndChannel = dirNum + channel
    const [dataHigh, dataLow] = int2word(uint16)
    const payload: Payload = [
        directionAndChannel,
        waddr,
        dataLow,
        dataHigh,
    ]
    const startByteNum = StartByte[startByte]
    return {payload, startByte: startByteNum}
}

//TODO: implement test unit
export const payloadToFrameCore = (payload: Payload, startByte_: StartByteNum): FrameCore => {
    // TODO: validate range of channel, waddr, etc.
    const bitD7 = 7
    const bitD6 = 6
    const dirAndChannel = payload[0]
    const channel = bit_clear( bit_clear(dirAndChannel,bitD7) , bitD6)
    const d7 = Number(bit_test(dirAndChannel, bitD7))
    const d6 = Number(bit_test(dirAndChannel, bitD6))
    const directionNum = (d7 << bitD7) + (d6 << bitD6) as unknown as DirectionNum
    const direction = DirectionNumToText(directionNum)
    const waddr = payload[1]
    const dataLow = payload[2]
    const dataHigh = payload[3]
    const uint16 = word2int(dataHigh, dataLow)
    const startByte = StartByteToText(startByte_)
    return {
        startByte,
        direction,
        channel,
        waddr,
        uint16,
    }
}

// TODO: Create CoreFrame class, with method: Serialize and SerializeFlatten, getWord, getByteLow, and other picks
//       You can use an interpreter to construct this kind of object when you are receiving data from cmpp.
//       Also you can map the word of the frame and the mapping my send it in many formats (word, byte+byte, 16bits, etc)
export const FrameCore = (startByte: StartByteTxt, direction: keyof Direction, channel: number, waddr: number, uint16: number): FrameCore => 
    ({ startByte, direction, channel, waddr, uint16})

//TODO:  FrameSerialized and FrameInterpreted are very similar. check if we can reduce to just one type
export type FrameSerialized = [
    [firstEsc: ESC],
    [startByte: StartByteNum],
    [dirChan: number] | [dirChan: ESC, escDup: ESC],
    [waddr: number] | [waddr: ESC, escDup: ESC],
    [dataLow: number] | [dataLow: ESC, escDup: ESC],
    [dataHigh: number] | [dataHigh: ESC, escDup: ESC],
    [lastEsc: ESC],
    [etx: ETX],
    [checkSum: number] | [checkSum: ESC, escDup: ESC],
]


// NOTE: javascript object guarantees the keys to be iterated in order of insertion for string-keys
// TODO: Add information about when this data arrived (for time / speed (ping) information)
// TODO: make this internal arrays readonly also
export type FrameInterpreted = {
    readonly firstEsc: [firstEsc: ESC],
    readonly startByte: [startByte: StartByteNum],
    readonly dirChan: [dirChan: Byte] | [dirChan: ESC, escDup: ESC],
    readonly waddr: [waddr: Byte] | [waddr: ESC, escDup: ESC],
    readonly dataLow: [dataLow: Byte] | [dataLow: ESC, escDup: ESC],
    readonly dataHigh: [dataHigh: Byte] | [dataHigh: ESC, escDup: ESC],
    readonly lastEsc: [lastEsc: ESC],
    readonly etx: [etx: ETX],
    readonly checkSum: [checkSum: Byte] | [checkSum: ESC, escDup: ESC],
    readonly expectedChecksum: Byte
}

export const frameInterpretedToPayload = (_: FrameInterpreted): PayloadCore => {
    const dirChan: Byte = _.dirChan[0]
    const waddr: Byte = _.waddr[0]
    const dataH: Byte = _.dataHigh[0]
    const dataL: Byte = _.dataLow[0]
    const startByte: StartByteNum = _.startByte[0]
    const payload: Payload =   [dirChan, waddr, dataL, dataH]
    return {payload, startByte}
}

// TODO: change name to 'serializeFrameCore' or 'serializeCoreFrame'
export const compileCoreFrame = (core: FrameCore): FrameSerialized => {

    const dupIfNecessary = (uint8: number): [uint8: number] | [uint8: ESC, escDup: ESC] => {
            return uint8 !== ESC 
                ? [uint8]
                : [uint8, ESC]
    }

    // TODO: validate range of channel, waddr, etc.
    const payloadCore = frameCoreToPayload(core)
    const { payload, startByte: startByteNum } = payloadCore
    const [ dirChan, waddr, dataLow, dataHigh] = payload
    const checksum = calcChecksum(payloadCore)

    return [
        [ESC], 
        [startByteNum], 
        dupIfNecessary(dirChan), 
        dupIfNecessary(waddr),
        dupIfNecessary(dataLow),
        dupIfNecessary(dataHigh),
        [ESC],
        [ETX],
        dupIfNecessary(checksum),
    ]

}


//TODO: remove this function and use a generic flattenArray function instead.
export const flattenFrameSerialized = (a: FrameSerialized): readonly number[] => {
    // TODO: this function may be generalized for flatten any type of array
    let acc: readonly number[] = []
    for (const each of a) {
        acc = [...acc, ...each]
    }
    return acc
}


// helper
// TODO: deprecate the use of this function, it seems not enough useful nor necessary. Use independent functions instead.
export const serializeFrame = (frame: FrameCore): [serialized: FrameSerialized, flatten: readonly number[]] => {
    const frame_ = compileCoreFrame(frame)
    //fix: Flattening an array should be extract to an util
    const frame__ = flattenFrameSerialized(frame_)
    return [frame_, frame__]
}

