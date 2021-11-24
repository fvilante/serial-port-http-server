import { FrameInterpreted, InterpretIncomming } from "."
import { Byte } from "../../core/byte"
import { random } from "../../core/utils"
import { calcChecksum_ } from "./calc-checksum"
import { ACK, ESC, ETX, NACK, Payload, StartByteNum, STX } from "./core-types"
import { ErrorEvent, StateChangeEvent, SuccessEvent } from "./interpreter"


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

// from given payload make well-formed frame
export const makeWellFormedFrame = (startByte: StartByteNum, payload: Payload) => {
    const checksum = calcChecksum_(payload,startByte)
    return [ESC, startByte, ...duplicateEsc(payload), ESC, ETX, ...duplicateEsc([checksum])]
}

export const makeWellFormedFrameInterpreted = (startByte: StartByteNum, payload: Payload): FrameInterpreted => {
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
    onError: readonly ErrorEvent[]
    onStateChange: readonly StateChangeEvent[]
}

// NOTE: This function is being used in test units; I'm not sure it is necessary for other conditions
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