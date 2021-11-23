import { FrameInterpreted } from ".."
import { Byte, Bytes } from "../../../core/byte"
import { calcChecksum } from "../calc-checksum"
import { ACK, ESC, ETX, NACK, StartByteNum, StartByteToText, STX } from "../core-types"

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
let acc: readonly number[] = []
let state: CoreState = 'Waiting first Esc'
let waitingEscDup: boolean = false
let frame: Partial<FrameInterpreted> = { }
// initial state reseter
const resetInterpreter = ():void => {
    acc = []
    state = 'Waiting first Esc'
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
        const defaultStByte = StartByteToText(validStartBytes[0]) // anything
        const startByte = frame__.startByte === undefined ? defaultStByte : StartByteToText(frame__.startByte[0])
        const chksum = calcChecksum([dirChan, waddr, dataH, dataL], startByte)
        return chksum
    }

    acc = [...acc, currentByte]

    // todo: refactor to reduce redundancy
    switch (state as CoreState) {

        case 'Waiting first Esc': {
            const nextState: CoreState = 'Waiting start byte'
            const pos: keyof typeof frame  = 'firstEsc'
            if (currentByte===ESC) {
                frame = { ...frame, [pos]: [currentByte] }
                state = nextState
            } else {
                //console.log(`WARNING: Expected First Esc (${ESC} decimal) but got other thing (${cur_} decimal)`)
                //resetInterpreter()
                
                // NOTE: I found a bug which is, CMPP00LG on operation for some reason I don't know,
                // send some trash data between frame packet it sends.
                // I'm not sure it is a 'noise' problem, because it consistently happens between frames
                // and not inside the frame. It occurs after tenths or hundreds of packet sent.
                // For this reason I'll remove below lines which is causing a fatal error when this
                // phenomenon happnes, and exchange the error for a warning instead.
                const event: ErrorEvent = {
                    errorMessage: `Expected First Esc (${ESC} decimal) but got other thing (${currentByte} decimal)`,
                    partialFrame: frame,
                    rawInput: acc,
                    coreState: state,
                }
                onError_(event)
            }
            break;
        }

        case 'Waiting start byte': {
            const nextState: CoreState =  'Waiting direction and channel'
            const pos: keyof typeof frame  = 'startByte'
            const isValidStartByte = validStartBytes.some( x => x === currentByte)
            if (isValidStartByte) {
                frame = {...frame, [pos]: [currentByte as StartByteNum]}
                state = nextState
            } else {
                const event: ErrorEvent = {
                    errorMessage:  `Expected a valid StartByte (some of this values ${validStartBytes} in decimal) but got other thing (${currentByte} decimal).`,
                    partialFrame: frame,
                    rawInput: acc,
                    coreState: state,
                }
                onError_(event)
            }
            break;
        }

        case 'Waiting direction and channel': {
            const nextState: CoreState = 'Waiting word address (waddr)'
            const pos: keyof typeof frame = 'dirChan'
            if (waitingEscDup === false) {
                if (currentByte === ESC) {
                    waitingEscDup = true;
                } else {
                    frame = {...frame, [pos]: [currentByte]}
                    state = nextState;
                }
            } else /* waitingEscDup === true */ {
                if (currentByte === ESC) {
                    state = nextState;
                    frame = {...frame, [pos]: [ESC, ESC]}
                    waitingEscDup = false
                } else {
                    const event: ErrorEvent = {
                        errorMessage:  `Expected a duplicated Esc after ${pos} ([${ESC},${ESC}]  decimal) but got other thing ([${ESC},${currentByte}] decimal).`,
                        partialFrame: frame,
                        rawInput: acc,
                        coreState: state,
                    }
                    onError_(event)
                }
            }
            break;
        }

        case 'Waiting word address (waddr)': {
            const nextState: CoreState = 'Waiting dataLow'
            const pos: keyof typeof frame = 'waddr'
            if (waitingEscDup === false) {
                if (currentByte === ESC) {
                    waitingEscDup = true;
                } else {
                    frame = {...frame, [pos]: [currentByte]}
                    state = nextState;
                }
            } else /* waitingEscDup === true */ {
                if (currentByte === ESC) {
                    state = nextState;
                    frame = {...frame, [pos]: [ESC, ESC]}
                    waitingEscDup = false
                } else {
                    const event: ErrorEvent = {
                        errorMessage:  `Expected a duplicated Esc after ${pos} ([${ESC},${ESC}]  decimal) but got other thing ([${ESC},${currentByte}] decimal).`,
                        partialFrame: frame,
                        rawInput: acc,
                        coreState: state,
                    }
                    onError_(event)
                }
            }
            break;
        }

        case 'Waiting dataLow': {
            const nextState: CoreState = 'Waiting dataHigh'
            const pos: keyof typeof frame = 'dataLow'
            if (waitingEscDup === false) {
                if (currentByte === ESC) {
                    waitingEscDup = true;
                } else {
                    frame = {...frame, [pos]: [currentByte]}
                    state = nextState;
                }
            } else /* waitingEscDup === true */ {
                if (currentByte === ESC) {
                    state = nextState;
                    frame = {...frame, [pos]: [ESC, ESC]}
                    waitingEscDup = false
                } else {
                    const event: ErrorEvent = {
                        errorMessage:  `Expected a duplicated Esc after ${pos} ([${ESC},${ESC}]  decimal) but got other thing ([${ESC},${currentByte}] decimal).`,
                        partialFrame: frame,
                        rawInput: acc,
                        coreState: state,
                    }
                    onError_(event)
                }
            }
            break;
        }

        case 'Waiting dataHigh': {
            const nextState: CoreState = 'Waiting lastEsc'
            const pos: keyof typeof frame = 'dataHigh'
            if (waitingEscDup === false) {
                if (currentByte === ESC) {
                    waitingEscDup = true;
                } else {
                    frame = {...frame, [pos]: [currentByte]}
                    state = nextState;
                }
            } else /* waitingEscDup === true */ {
                if (currentByte === ESC) {
                    state = nextState;
                    frame = {...frame, [pos]: [ESC, ESC]}
                    waitingEscDup = false
                } else {
                    const event: ErrorEvent = {
                        errorMessage: `Expected a duplicated Esc after ${pos} ([${ESC},${ESC}]  decimal) but got other thing ([${ESC},${currentByte}] decimal).`,
                        partialFrame: frame,
                        rawInput: acc,
                        coreState: state,
                    }
                    onError_(event)
                }
            }
            break;
        }

        case 'Waiting lastEsc': {
            const nextState: CoreState = 'Waiting ETX'
            const pos: keyof typeof frame  = 'lastEsc'
            if (currentByte===ESC) {
                frame = { ...frame, [pos]: [currentByte] }
                state = nextState
            } else {
                const event: ErrorEvent = {
                    errorMessage: `Expected ${pos} (${ESC} decimal) but got other thing (${currentByte} decimal)`,
                    partialFrame: frame,
                    rawInput: acc,
                    coreState: state,
                }
                onError_(event)
            }
            break;
        }

        case 'Waiting ETX': {
            const nextState: CoreState = 'Waiting checksum'
            const pos: keyof typeof frame  = 'etx'
            if (currentByte===ETX) {
                frame = { ...frame, [pos]: [currentByte] }
                state = nextState
            } else {
                const event: ErrorEvent = {
                    errorMessage:`Expected ${pos} (${ETX} decimal) but got other thing (${currentByte} decimal)`,
                    partialFrame: frame,
                    rawInput: acc,
                    coreState: state,
                }
                onError_(event)
            }
            break;
        }

        case 'Waiting checksum': {
            const nextState: CoreState = 'Successful'
            const pos: keyof typeof frame = 'checkSum'
            if (waitingEscDup === false) {
                if (currentByte === ESC) {
                    waitingEscDup = true;
                } else {
                    frame = {...frame, [pos]: [currentByte]};
                    const expectedChecksum = calcChecksum__(frame);
                    if(expectedChecksum===currentByte) {
                        frame = {...frame, expectedChecksum };
                        state = nextState;;
                    } else {
                        const event: ErrorEvent = {
                            errorMessage: `Expected ${pos} should be '${expectedChecksum}' but got '${currentByte}' (numbers are showed in this message in decimal)`,
                            partialFrame: frame,
                            rawInput: acc,
                            coreState: state,
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
                    state = nextState;
                } else {
                    const event: ErrorEvent = {
                        errorMessage:  `Expected a duplicated Esc after ${pos} ([${ESC},${ESC}]  decimal) but got other thing ([${ESC},${currentByte}] decimal).`,
                        partialFrame: frame,
                        rawInput: acc,
                        coreState: state,
                    }
                    onError_(event)
                }
            }
            break;
        }

    }


    if (handle.onInternalStateChange!==undefined) {
        const event: StateChangeEvent = {
            currentCoreState: state,
            partialFrame: frame,
            rawInput: acc,
            waitingEscDup,
        }
        handle.onInternalStateChange(event)
    } else {
        // do nothing
    }

    if (state==='Successful') {
        const event: SuccessEvent = {
            frameInterpreted: frame as FrameInterpreted,
            rawInput: acc,
        }
        onSuccess_(event)
    }


    return resetInterpreter

}

