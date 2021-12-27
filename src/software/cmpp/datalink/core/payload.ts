import { FrameInterpreted, InterpretIncomming } from ".."
import { Byte } from "../../../core/byte"
import { random } from "../../../core/utils"
import { calcChecksum } from "./calc-checksum"
import { ACK, ESC, ETX, NACK, StartByteNum, STX } from "../core-types"
import { InterpretationErrorEvent, StateChangeEvent, SuccessEvent } from "../interpreter"

export type Payload = readonly [dirChan: number, waddr: number, dataLow: number, dataHigh: number]

//TODO: Implement this type if it worth
export type PayloadCore = { 
    readonly payload: Payload, 
    readonly startByte: StartByteNum //TODO: Rename to 'startByteNum'
}

const duplicateEscIfNecessary = (payload: readonly number[]): readonly number[] => {
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

// from given payload make well-formed frame
export const makeWellFormedFrame = (_: PayloadCore) => {
    const { payload, startByte } = _
    const checksum = calcChecksum(_)
    return [ESC, startByte, ...duplicateEscIfNecessary(payload), ESC, ETX, ...duplicateEscIfNecessary([checksum])]
}

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

export const getRandomPayload = ():Payload => {
    return [random(0,0xFF),random(0,0xFF),random(0,0xFF),random(0,0xFF),]
}

export const getRandomStartByte = ():StartByteNum => {
    const startByte = [STX,ACK,NACK] //TODO: extract details of 'all start bytes' to other appropriated file
    const randomStartByte = startByte[random(0,startByte.length-1)]
    return randomStartByte
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