import { FrameInterpreted } from ".."
import { random } from "../../../core/utils"
import { ACK, ESC, ETX, NACK, StartByteNum, STX } from "../core-types"
import { calcChecksum } from "./calc-checksum"
import { duplicateEscIfNecessary } from "./esc-duplication"
import { Payload, PayloadCore } from "./payload"

export const getRandomPayload = ():Payload => {
    return [random(0,0xFF),random(0,0xFF),random(0,0xFF),random(0,0xFF),]
}

export const getRandomStartByte = ():StartByteNum => {
    const startByte = [STX,ACK,NACK] //TODO: extract details of 'all start bytes' to other appropriated file
    const randomStartByte = startByte[random(0,startByte.length-1)]
    return randomStartByte
}

// from given payload make well-formed raw frame serialized (and flatened)
// TODO: Rename to 'makeWellFormedFrameSerializedRaw' or change type to 'FrameSerialized' instead of 'number[]'
export const makeWellFormedFrame = (payloadCore: PayloadCore): number[] => {
    const { payload, startByte } = payloadCore
    const checksum = calcChecksum(payloadCore)
    return [ESC, startByte, ...duplicateEscIfNecessary(payload), ESC, ETX, ...duplicateEscIfNecessary([checksum])]
}

//

export const makeWellFormedFrameInterpreted = (_: PayloadCore): FrameInterpreted => {
    const { payload, startByte } = _
    const checksum = calcChecksum(_)
    return {
        firstEsc: [ESC],
        startByte: [startByte],
        dirChan: duplicateEscIfNecessary([payload[0]]),
        waddr: duplicateEscIfNecessary([payload[1]]),
        dataLow: duplicateEscIfNecessary([payload[2]]),
        dataHigh: duplicateEscIfNecessary([payload[3]]),
        lastEsc: [ESC],
        etx: [ETX],
        checkSum: duplicateEscIfNecessary([checksum]),
        expectedChecksum: checksum,
    } as unknown as any //TODO: remove this type cast 
}
