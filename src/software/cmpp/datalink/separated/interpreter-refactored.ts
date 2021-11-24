import { FrameInterpreted } from ".."
import { Byte, Bytes } from "../../../core/byte"
import { calcChecksum_ } from "../calc-checksum"
import { ACK, ESC, ETX, NACK, StartByteNum, STX } from "../core-types"

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
    readonly frameInterpreted: FrameInterpreted, 
    readonly rawInput: readonly Byte[]
}

export type ErrorEvent = {
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
    onError: (event: ErrorEvent) => void,
    onInternalStateChange: (event: StateChangeEvent) => void
}

// pushed interpretation, with talkback feedback for finished or error signaling
// executes until error or finish
// Fix: Refactor this function to be more functional decomposable and easier to read
export const InterpretIncomming = (handle: EventsHandler) => (currentByte: number): typeof resetInterpreter => {

    const onError_: EventsHandler['onError'] = event => {
        handle.onError(event);
        resetInterpreter();
    }

    const onSuccess_: EventsHandler['onSuccess'] = event => {
        handle.onSuccess(event)
        resetInterpreter();
    }

    const calcChecksum__ = (frame__: Partial<FrameInterpreted>): number => {
        const dirChan = frame__.dirChan === undefined ? 0 : frame__.dirChan[0]
        const waddr = frame__.waddr === undefined ? 0 : frame__.waddr[0]
        const dataH = frame__.dataHigh === undefined ? 0 : frame__.dataHigh[0]
        const dataL = frame__.dataLow === undefined ? 0 : frame__.dataLow[0]
        const defaultStByte = validStartBytes[0] // any arbitrary among them is being the default value!
        const startByte = frame__.startByte === undefined ? defaultStByte : frame__.startByte[0]
        const chksum = calcChecksum_([dirChan, waddr, dataH, dataL], startByte)
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

    rawInput = [...rawInput, currentByte]

    const ErrorHeader = `CMPP deserialization parsing error`

    const mkControlErrorMessage = <K extends keyof FrameInterpreted>(whenIn: CoreState, waitingFor: K, expected: FrameInterpreted[K] | typeof validStartBytes, butGot: Bytes) => {
        const specificMessage = `When in state '${whenIn}', parsing the '${waitingFor}', received ${butGot} but was expecting to receive some of ${expected} (all numbers are in decimal)` as const
        return `${ErrorHeader}: ${specificMessage}` as const
    }

    const mkDuplicatedEscErrorMessage = (whenIn: CoreState, waitingFor: keyof FrameInterpreted, butGot: Byte) => {
        const specificMessage = `When in state '${whenIn}', parsing the '${waitingFor}', expected a duplicated Esc [${ESC},${ESC}] but got [${ESC},${butGot}] (all numbers are in decimal).` as const
        return `${ErrorHeader}: ${specificMessage}` as const
    }

    // todo: refactor to reduce redundancy
    switch (coreState) {

        case 'Waiting first Esc': {
            const pos: keyof FrameInterpreted = 'firstEsc'
            const nextState: CoreState = 'Waiting start byte'
            if (currentByte===ESC) {
                setFrameAndCoreState(pos,[currentByte],nextState)
            } else {
                const event: ErrorEvent = {
                    errorMessage: mkControlErrorMessage(coreState, pos, [ESC], [currentByte]),
                    partialFrame: frame,
                    rawInput,
                    coreState,
                }
                onError_(event)
            }
            break;
        }

        case 'Waiting start byte': {
            const pos: keyof FrameInterpreted = 'startByte'
            const nextState: CoreState = 'Waiting direction and channel'
            const isValidStartByte = validStartBytes.some( x => x === currentByte)
            if (isValidStartByte) {
                setFrameAndCoreState(pos,[currentByte as StartByteNum],nextState)
            } else {
                const event: ErrorEvent = {
                    errorMessage:  mkControlErrorMessage(coreState, pos, validStartBytes, [currentByte]),
                    partialFrame: frame,
                    rawInput,
                    coreState,
                }
                onError_(event)
            }
            break;
        }

        case 'Waiting direction and channel': {
            const pos: keyof FrameInterpreted = 'dirChan'
            const nextState: CoreState = 'Waiting word address (waddr)'
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
                    const event: ErrorEvent = {
                        errorMessage:  mkDuplicatedEscErrorMessage(coreState,pos,currentByte),
                        partialFrame: frame,
                        rawInput,
                        coreState,
                    }
                    onError_(event)
                }
            }
            break;
        }

        case 'Waiting word address (waddr)': {
            const nextState: CoreState = 'Waiting dataLow'
            const pos: keyof FrameInterpreted = 'waddr'
            if (waitingEscDup === false) {
                if (currentByte === ESC) {
                    waitingEscDup = true;
                } else {
                    setFrameAndCoreState(pos,[currentByte],nextState)
                }
            } else /* waitingEscDup === true */ {
                if (currentByte === ESC) {
                    setFrameAndCoreState(pos, [ESC, ESC],nextState)
                    waitingEscDup = false
                } else {
                    const event: ErrorEvent = {
                        errorMessage:  mkDuplicatedEscErrorMessage(coreState,pos,currentByte),
                        partialFrame: frame,
                        rawInput,
                        coreState,
                    }
                    onError_(event)
                }
            }
            break;
        }

        case 'Waiting dataLow': {
            const nextState: CoreState = 'Waiting dataHigh'
            const pos: keyof FrameInterpreted = 'dataLow'
            if (waitingEscDup === false) {
                if (currentByte === ESC) {
                    waitingEscDup = true;
                } else {
                    setFrameAndCoreState(pos,  [currentByte],nextState)
                }
            } else /* waitingEscDup === true */ {
                if (currentByte === ESC) {
                    setFrameAndCoreState(pos, [ESC, ESC],nextState)
                    waitingEscDup = false
                } else {
                    const event: ErrorEvent = {
                        errorMessage:  mkDuplicatedEscErrorMessage(coreState,pos,currentByte),
                        partialFrame: frame,
                        rawInput,
                        coreState,
                    }
                    onError_(event)
                }
            }
            break;
        }

        case 'Waiting dataHigh': {
            const nextState: CoreState = 'Waiting lastEsc'
            const pos: keyof FrameInterpreted = 'dataHigh'
            if (waitingEscDup === false) {
                if (currentByte === ESC) {
                    waitingEscDup = true;
                } else {
                    setFrameAndCoreState(pos,  [currentByte],nextState)
                }
            } else /* waitingEscDup === true */ {
                if (currentByte === ESC) {
                    setFrameAndCoreState(pos, [ESC, ESC],nextState)
                    waitingEscDup = false
                } else {
                    const event: ErrorEvent = {
                        errorMessage: mkDuplicatedEscErrorMessage(coreState,pos,currentByte),
                        partialFrame: frame,
                        rawInput,
                        coreState,
                    }
                    onError_(event)
                }
            }
            break;
        }

        case 'Waiting lastEsc': {
            const nextState: CoreState = 'Waiting ETX'
            const pos: keyof FrameInterpreted  = 'lastEsc'
            if (currentByte===ESC) {
                setFrameAndCoreState(pos,  [currentByte],nextState)
            } else {
                const event: ErrorEvent = {
                    errorMessage: mkControlErrorMessage(coreState, pos, [ESC], [currentByte]),
                    partialFrame: frame,
                    rawInput,
                    coreState,
                }
                onError_(event)
            }
            break;
        }

        case 'Waiting ETX': {
            const nextState: CoreState = 'Waiting checksum'
            const pos: keyof FrameInterpreted  = 'etx'
            if (currentByte===ETX) {
                setFrameAndCoreState(pos, [currentByte],nextState)
            } else {
                const event: ErrorEvent = {
                    errorMessage: mkControlErrorMessage(coreState, pos, [ETX], [currentByte]),
                    partialFrame: frame,
                    rawInput,
                    coreState,
                }
                onError_(event)
            }
            break;
        }

        case 'Waiting checksum': {
            const nextState: CoreState = 'Successful'
            const pos: keyof FrameInterpreted = 'checkSum'
            if (waitingEscDup === false) {
                if (currentByte === ESC) {
                    waitingEscDup = true;
                } else {
                    frame = {...frame, [pos]: [currentByte]};
                    const expectedChecksum = calcChecksum__(frame);
                    if(expectedChecksum===currentByte) {
                        frame = {...frame, expectedChecksum };
                        coreState = nextState;;
                    } else {
                        const event: ErrorEvent = {
                            errorMessage: mkControlErrorMessage(coreState, pos, [expectedChecksum], [currentByte]),
                            partialFrame: frame,
                            rawInput,
                            coreState,
                        }
                        onError_(event)
                    }
                    
                }
            } else /* waitingEscDup === true */ {
                if (currentByte === ESC) {
                    frame = {...frame, [pos]: [ESC, ESC]};
                    waitingEscDup = false;
                    const expectedChecksum = calcChecksum__(frame);
                    frame = {...frame, expectedChecksum };
                    coreState = nextState;
                } else {
                    const event: ErrorEvent = {
                        errorMessage:  mkDuplicatedEscErrorMessage(coreState,pos,currentByte),
                        partialFrame: frame,
                        rawInput,
                        coreState,
                    }
                    onError_(event)
                }
            }
            break;
        }

    }


    if (handle.onInternalStateChange!==undefined) {
        const event: StateChangeEvent = {
            currentCoreState: coreState,
            partialFrame: frame,
            rawInput,
            waitingEscDup,
        }
        handle.onInternalStateChange(event)
    } else {
        // do nothing
    }

    if (coreState==='Successful') {
        const event: SuccessEvent = {
            frameInterpreted: frame as FrameInterpreted,
            rawInput,
        }
        onSuccess_(event)
    }


    return resetInterpreter

}

