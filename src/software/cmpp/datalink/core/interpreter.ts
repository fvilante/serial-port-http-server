import { FrameInterpreted } from "./frame-core"
import { Byte, Bytes } from "../../../core/byte"
import { calcChecksum } from "./calc-checksum"
import { ACK, ESC, ETX, NACK, StartByteNum, STX } from "./core-types"
import { frameInterpretedToPayload } from "./frame-core"

//TODO: Introduce 'checksum error' type as an interpretation error

export type CoreState = 
    | 'Waiting first Esc'
    | 'Waiting start byte'
    | 'Waiting direction and channel'
    | 'Waiting word address (waddr)'
    | 'Waiting dataLow'
    | 'Waiting dataHigh'
    | 'Waiting lastEsc'
    | 'Waiting ETX'
    | 'Waiting checksum'
    | 'Successful'
    | 'HasError'
    //| 'Waiting Duplicated Esc'

// internal state
let rawInput: readonly number[] = []
let coreState: CoreState = 'Waiting first Esc'
let waitingEscDup: boolean = false
let frame: Partial<FrameInterpreted> = { }
// initial state reseter
const resetInterpreter = ():void => {
    rawInput = []
    coreState = 'Waiting first Esc'
    waitingEscDup = false
    frame = { }
};

// do reset 
resetInterpreter();

const validStartBytes: readonly [STX, ACK, NACK] = [STX, ACK, NACK] 

export type SuccessEvent = {
    readonly kind: 'SuccessEvent'
    readonly frameInterpreted: FrameInterpreted, 
    readonly rawInput: readonly Byte[]
}

export type InterpretationErrorEvent = {
    readonly kind: 'InterpretationErrorEvent'
    readonly errorMessage: string, 
    readonly partialFrame: Partial<FrameInterpreted>, 
    readonly rawInput: readonly Byte[], 
    readonly coreState: CoreState
}



export type StateChangeEvent = {
    readonly currentCoreState: CoreState, 
    readonly partialFrame: typeof frame, 
    readonly waitingEscDup: boolean, 
    readonly rawInput: readonly Byte[]
}

export type EventsHandler = {
    onSuccess: (event: SuccessEvent) => void,
    onError: (event: InterpretationErrorEvent) => void,
    onStateChange?: (event: StateChangeEvent) => void
}

// pushed interpretation, with talkback feedback for finished or error signaling
// executes until error or finish
// Fix: Refactor this function to be more functional decomposable and easier to read
export const InterpretIncomming = (handle: EventsHandler) => (currentByte: number): typeof resetInterpreter => {

    rawInput = [...rawInput, currentByte]

    const onError_: EventsHandler['onError'] = event => {
        handle.onError(event);
        resetInterpreter();
    }

    const onSuccess_: EventsHandler['onSuccess'] = event => {
        handle.onSuccess(event)
        resetInterpreter();
    }

    const calcChecksum__ = (frame_: FrameInterpreted): number => {
        const payloadCore = frameInterpretedToPayload(frame_)
        const chksum = calcChecksum(payloadCore)
        return chksum
    }

    const setFrame = <K extends keyof FrameInterpreted>(key: K, data: FrameInterpreted[K]) => {
        frame = { ...frame, [key]: data } // update frame with specified key and data
    }

    const setCoreState = (nextCoreState: CoreState) => {
        coreState = nextCoreState
    }

    const setFrameAndCoreState = <K extends keyof FrameInterpreted>(key: K, data: FrameInterpreted[K], nextState: CoreState) => {
        setFrame(key,data)
        setCoreState(nextState)
    }

    const ErrorHeader = `CMPP deserialization parsing error`

    const mkControlErrorMessage = <K extends keyof FrameInterpreted>(whenIn: CoreState, waitingFor: K, expected: readonly Byte[], butGot: Bytes) => {
        const specificMessage = `When in state '${whenIn}', parsing the '${waitingFor}', received ${butGot} but was expecting to receive some of ${expected} (all numbers are in decimal)` as const
        return `${ErrorHeader}: ${specificMessage}` as const
    }

    const mkDuplicatedEscErrorMessage = (whenIn: CoreState, waitingFor: keyof FrameInterpreted, butGot: Byte) => {
        const specificMessage = `When in state '${whenIn}', parsing the '${waitingFor}', expected a duplicated Esc [${ESC},${ESC}] but got [${ESC},${butGot}] (all numbers are in decimal).` as const
        return `${ErrorHeader}: ${specificMessage}` as const
    }

    const produceErrorEvent = (errorMessage: InterpretationErrorEvent['errorMessage']):void => {
        const event: InterpretationErrorEvent = {
            kind: 'InterpretationErrorEvent',
            errorMessage,
            partialFrame: frame,
            rawInput,
            coreState,
        }
        onError_(event)
    }
 
    // TODO: There are redundance in below function, and they should be refactored to reduce code length and improve readability
    //NOTE: Control byte cannot be esc duplicated
    const expectToReceiveControlByte = (pos: keyof FrameInterpreted, nextState: CoreState, controlBytes: readonly Byte[]) => {
        if (controlBytes.includes(currentByte)) {
            setFrameAndCoreState(pos,  [currentByte],nextState)
        } else {
            produceErrorEvent(mkControlErrorMessage(coreState, pos, controlBytes, [currentByte]))
        }
    }

    // TODO: There are redundance in below function, and they should be refactored to reduce code length and improve readability
    //NOTE: data byte may be esc duplicated
    const expectToReceiveData = (pos: keyof FrameInterpreted, nextState: CoreState) => {
        if (waitingEscDup === false) {
            if (currentByte === ESC) {
                waitingEscDup = true;
            } else {
                setFrameAndCoreState(pos,[currentByte], nextState)
            }
        } else /* waitingEscDup === true */ {
            if (currentByte === ESC) {
                setFrameAndCoreState(pos,[ESC, ESC],nextState)
                waitingEscDup = false
            } else {
                produceErrorEvent(mkDuplicatedEscErrorMessage(coreState,pos,currentByte))
            }
        }
    }

    // TODO: There are redundance in below function, and they should be refactored to reduce code length and improve readability
    const expectToReceiveChecksum = (pos: keyof FrameInterpreted, nextState: CoreState) => {
        if (waitingEscDup === false) {
            if (currentByte === ESC) {
                waitingEscDup = true;
            } else {
                frame = {...frame, [pos]: [currentByte]};
                //TODO: Remove the expectedChecksum here, the purpose of this parser is not to check the checksum but to interpret frame
                const expectedChecksum = calcChecksum__(frame as FrameInterpreted);
                if(expectedChecksum===currentByte) {
                    frame = {...frame, expectedChecksum };
                    coreState = nextState;;
                } else {
                    produceErrorEvent(mkControlErrorMessage(coreState, pos, [expectedChecksum], [currentByte]))
                }
                
            }
        } else /* waitingEscDup === true */ {
            if (currentByte === ESC) {
                frame = {...frame, [pos]: [ESC, ESC]};
                waitingEscDup = false;
                //TODO: Remove the expectedChecksum here, the purpose of this parser is not to check the checksum but to interpret frame
                const expectedChecksum = calcChecksum__(frame as FrameInterpreted);
                frame = {...frame, expectedChecksum };
                coreState = nextState;
            } else {
                produceErrorEvent(mkDuplicatedEscErrorMessage(coreState,pos,currentByte))
            }
        }
    }

    // main execution code
    switch (coreState) {

        case 'Waiting first Esc': {
            const pos: keyof FrameInterpreted = 'firstEsc'
            const nextState: CoreState = 'Waiting start byte'
            const controlByte: Byte = ESC
            expectToReceiveControlByte(pos, nextState, [controlByte])
            break;
        }

        case 'Waiting start byte': {
            const pos: keyof FrameInterpreted = 'startByte'
            const nextState: CoreState = 'Waiting direction and channel'
            expectToReceiveControlByte(pos, nextState, validStartBytes)
            break;
        }

        case 'Waiting direction and channel': {
            const pos: keyof FrameInterpreted = 'dirChan'
            const nextState: CoreState = 'Waiting word address (waddr)'
            expectToReceiveData(pos, nextState)
            break;
        }

        case 'Waiting word address (waddr)': {
            const nextState: CoreState = 'Waiting dataLow'
            const pos: keyof FrameInterpreted = 'waddr'
            expectToReceiveData(pos, nextState)
            break;
        }

        case 'Waiting dataLow': {
            const nextState: CoreState = 'Waiting dataHigh'
            const pos: keyof FrameInterpreted = 'dataLow'
            expectToReceiveData(pos, nextState)
            break;
        }

        case 'Waiting dataHigh': {
            const nextState: CoreState = 'Waiting lastEsc'
            const pos: keyof FrameInterpreted = 'dataHigh'
            expectToReceiveData(pos, nextState)
            break;
        }

        case 'Waiting lastEsc': {
            const nextState: CoreState = 'Waiting ETX'
            const pos: keyof FrameInterpreted  = 'lastEsc'
            const controlByte: Byte = ESC
            expectToReceiveControlByte(pos, nextState, [controlByte])
            break;
        }

        case 'Waiting ETX': {
            const nextState: CoreState = 'Waiting checksum'
            const pos: keyof FrameInterpreted  = 'etx'
            const controlByte: ETX = ETX
            expectToReceiveControlByte(pos, nextState, [controlByte])
            break;
        }

        case 'Waiting checksum': {
            const nextState: CoreState = 'Successful'
            const pos: keyof FrameInterpreted = 'checkSum'
            expectToReceiveChecksum(pos, nextState)
            break;
        }

    }

    // produces state change event
    if (handle.onStateChange!==undefined) {
        const event: StateChangeEvent = {
            currentCoreState: coreState,
            partialFrame: frame,
            rawInput,
            waitingEscDup,
        }
        handle.onStateChange(event)
    } else {
        // do nothing
    }

    // produces successful event
    if (coreState==='Successful') {
        const event: SuccessEvent = {
            kind: 'SuccessEvent',
            frameInterpreted: frame as FrameInterpreted,
            rawInput,
        }
        onSuccess_(event)
    }


    return resetInterpreter

}

export const CmppDataLinkInterpreter = InterpretIncomming // alias

