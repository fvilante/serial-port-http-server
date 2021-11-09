import { calcChecksum } from "./calc-checksum";
import { int2word } from "./core-operations";
import { Direction, ESC, ETX, StartByte, StartByteNum, StartByteTxt } from "./core-types";

export type FrameCore = {
    startByte: StartByteTxt
    direction: keyof Direction
    channel: number
    waddr: number // abbreviation of 'word address', this is how I call 'cmd'
    uint16: number // data
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
export type FrameInterpreted = {
    readonly firstEsc: [firstEsc: ESC],
    readonly startByte: [startByte: StartByteNum],
    readonly dirChan: [dirChan: number] | [dirChan: ESC, escDup: ESC],
    readonly waddr: [waddr: number] | [waddr: ESC, escDup: ESC],
    readonly dataLow: [dataLow: number] | [dataLow: ESC, escDup: ESC],
    readonly dataHigh: [dataHigh: number] | [dataHigh: ESC, escDup: ESC],
    readonly lastEsc: [lastEsc: ESC],
    readonly etx: [etx: ETX],
    readonly checkSum: [checkSum: number] | [checkSum: ESC, escDup: ESC],
    readonly expectedChecksum: number
}

// TODO: change name to 'serializeFrameCore' or 'serializeCoreFrame'
export const compileCoreFrame = (core: FrameCore): FrameSerialized => {

    const dupIfNecessary = (uint8: number): [uint8: number] | [uint8: ESC, escDup: ESC] => {
            return uint8 !== ESC 
                ? [uint8]
                : [uint8, ESC]
    }

    // TODO: validate range of channel, waddr, etc.
    const { startByte, direction, channel, waddr, uint16} = core
    const startByte_ = StartByte[startByte]
    const direction_ = Direction[direction]
    const dirChan = direction_ + channel
    const [dataHigh, dataLow] = int2word(uint16)
    const checksum = calcChecksum([dirChan, waddr, dataHigh, dataLow], startByte)

    return [
        [ESC], 
        [startByte_], 
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

