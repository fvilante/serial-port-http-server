import { calcChecksum } from './calc-checksum'
import { int2word } from './core-operations'
import { 
    ESC,
    STX,
    ETX,
    ACK,
    NACK,
    Direction,
    StartByte,
    StartByteTxt,
    StartByteNum,
    StartByteToText,
} from './core-types'





// ======== OUTGOING DATA PROCESSING =============

//
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

export const flattenFrameSerialized = (a: FrameSerialized): readonly number[] => {
    // FIX: this function may be generalized for flatten any type of array
    let acc: readonly number[] = []
    for (const each of a) {
        acc = [...acc, ...each]
    }
    return acc
}

// fix: change name to 'serializeFrameCore' or 'serializeCoreFrame'
export const compileCoreFrame = (core: FrameCore): FrameSerialized => {

    const dupIfNecessary = (uint8: number): [uint8: number] | [uint8: ESC, escDup: ESC] => {
            return uint8 !== ESC 
                ? [uint8]
                : [uint8, ESC]
    }

    // fix: validate range of channel, waddr, etc.
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

// helper
export const serializeFrame = (frame: FrameCore): [serialized: FrameSerialized, flatten: readonly number[]] => {
    const frame_ = compileCoreFrame(frame)
    //fix: Flattening an array should be extract to an util
    const frame__ = flattenFrameSerialized(frame_)
    return [frame_, frame__]
}



// ======== INCOMMING DATA PROCESSING =============

// note: javascript object guarantees the keys to be iterated in order of insertion for string-keys
// todo: Add information about when this data arrived (for time / speed (ping) information)
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


export type State = 
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
            //| 'Time out'
let acc: readonly number[] = []
let state: State = 'Waiting first Esc'
let waitingEscDup: boolean = false
let frame: Partial<FrameInterpreted> = { }
const resetInterpreter = ():void => {
    acc = []
    state = 'Waiting first Esc'
    waitingEscDup = false
    frame = { }
};
resetInterpreter();

// pushed interpretation, with talkback feedback for finished or error signaling
// executes until error or finish
// note: Should be in parameter a config data with what means the 'ESC' 'STX' etc.
// Fix: Refactor this function to be more functional decomposable and easier to read
export const InterpretIncomming = (
        ESC: ESC,
        validStartBytes: readonly [STX, ACK, NACK],
        ETX: ETX,
        //timeOutMilisec: number,
    ) => (
        onFinished: (_: FrameInterpreted, rawInput: readonly number[]) => void, 
        onError: (msg: string, partialFrame: typeof frame, rawInput: typeof acc, state: State) => void,
        onInternalStateChange?: (currentState: State, partialFrame: typeof frame, waitingEscDup: boolean, rawInput: typeof acc) => void
    ) => (
        uint8: number
    ): typeof resetInterpreter => {
        //let tid: NodeJS.Timeout | undefined = undefined

        const error_: typeof onError = (msg, partialFrame, rawInput, state) => {
            onError(msg, partialFrame, rawInput, state);
            resetInterpreter();
        }

        const success: typeof onFinished = (frame__, rawInput) => {
            const acc_ = acc
            onFinished(frame__, acc_)
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

        const cur_ = uint8 // current byte
        acc = [...acc, uint8]

        // todo: refactor to reduce redundancy
        switch (state as State) {

            case 'Waiting first Esc': {
                const nextState: State = 'Waiting start byte'
                const pos: keyof typeof frame  = 'firstEsc'
                if (cur_===ESC) {
                    frame = { ...frame, [pos]: [cur_] }
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
                    error_(
                        `Expected First Esc (${ESC} decimal) but got other thing (${cur_} decimal)`,
                        frame,
                        acc,
                        state)
                }
                break;
            }

            case 'Waiting start byte': {
                const nextState: State =  'Waiting direction and channel'
                const pos: keyof typeof frame  = 'startByte'
                const isValidStartByte = validStartBytes.some( x => x === cur_)
                if (isValidStartByte) {
                    frame = {...frame, [pos]: [cur_ as StartByteNum]}
                    state = nextState
                } else {
                    error_(
                        `Expected a valid StartByte (some of this values ${validStartBytes} in decimal) but got other thing (${cur_} decimal).`,
                        frame,
                        acc,
                        state)
                }
                break;
            }

            case 'Waiting direction and channel': {
                const nextState: State = 'Waiting word address (waddr)'
                const pos: keyof typeof frame = 'dirChan'
                if (waitingEscDup === false) {
                    if (cur_ === ESC) {
                        waitingEscDup = true;
                    } else {
                        frame = {...frame, [pos]: [cur_]}
                        state = nextState;
                    }
                } else /* waitingEscDup === true */ {
                    if (cur_ === ESC) {
                        state = nextState;
                        frame = {...frame, [pos]: [ESC, ESC]}
                        waitingEscDup = false
                    } else {
                        error_(
                            `Expected a duplicated Esc after ${pos} ([${ESC},${ESC}]  decimal) but got other thing ([${ESC},${cur_}] decimal).`,
                            frame,
                            acc,
                            state)
                    }
                }
                break;
            }

            case 'Waiting word address (waddr)': {
                const nextState: State = 'Waiting dataLow'
                const pos: keyof typeof frame = 'waddr'
                if (waitingEscDup === false) {
                    if (cur_ === ESC) {
                        waitingEscDup = true;
                    } else {
                        frame = {...frame, [pos]: [cur_]}
                        state = nextState;
                    }
                } else /* waitingEscDup === true */ {
                    if (cur_ === ESC) {
                        state = nextState;
                        frame = {...frame, [pos]: [ESC, ESC]}
                        waitingEscDup = false
                    } else {
                        error_(
                            `Expected a duplicated Esc after ${pos} ([${ESC},${ESC}]  decimal) but got other thing ([${ESC},${cur_}] decimal).`,
                            frame,
                            acc,
                            state)
                    }
                }
                break;
            }

            case 'Waiting dataLow': {
                const nextState: State = 'Waiting dataHigh'
                const pos: keyof typeof frame = 'dataLow'
                if (waitingEscDup === false) {
                    if (cur_ === ESC) {
                        waitingEscDup = true;
                    } else {
                        frame = {...frame, [pos]: [cur_]}
                        state = nextState;
                    }
                } else /* waitingEscDup === true */ {
                    if (cur_ === ESC) {
                        state = nextState;
                        frame = {...frame, [pos]: [ESC, ESC]}
                        waitingEscDup = false
                    } else {
                        error_(
                            `Expected a duplicated Esc after ${pos} ([${ESC},${ESC}]  decimal) but got other thing ([${ESC},${cur_}] decimal).`,
                            frame,
                            acc,
                            state)
                    }
                }
                break;
            }

            case 'Waiting dataHigh': {
                const nextState: State = 'Waiting lastEsc'
                const pos: keyof typeof frame = 'dataHigh'
                if (waitingEscDup === false) {
                    if (cur_ === ESC) {
                        waitingEscDup = true;
                    } else {
                        frame = {...frame, [pos]: [cur_]}
                        state = nextState;
                    }
                } else /* waitingEscDup === true */ {
                    if (cur_ === ESC) {
                        state = nextState;
                        frame = {...frame, [pos]: [ESC, ESC]}
                        waitingEscDup = false
                    } else {
                        error_(
                            `Expected a duplicated Esc after ${pos} ([${ESC},${ESC}]  decimal) but got other thing ([${ESC},${cur_}] decimal).`,
                            frame,
                            acc,
                            state)
                    }
                }
                break;
            }

            case 'Waiting lastEsc': {
                const nextState: State = 'Waiting ETX'
                const pos: keyof typeof frame  = 'lastEsc'
                if (cur_===ESC) {
                    frame = { ...frame, [pos]: [cur_] }
                    state = nextState
                } else {
                    error_(
                        `Expected ${pos} (${ESC} decimal) but got other thing (${cur_} decimal)`,
                        frame,
                        acc,
                        state)
                }
                break;
            }

            case 'Waiting ETX': {
                const nextState: State = 'Waiting checksum'
                const pos: keyof typeof frame  = 'etx'
                if (cur_===ETX) {
                    frame = { ...frame, [pos]: [cur_] }
                    state = nextState
                } else {
                    error_(
                        `Expected ${pos} (${ETX} decimal) but got other thing (${cur_} decimal)`,
                        frame,
                        acc,
                        state)
                }
                break;
            }

            case 'Waiting checksum': {
                const nextState: State = 'Successful'
                const pos: keyof typeof frame = 'checkSum'
                if (waitingEscDup === false) {
                    if (cur_ === ESC) {
                        waitingEscDup = true;
                    } else {
                        frame = {...frame, [pos]: [cur_]};
                        const expectedChecksum = calcChecksum__(frame);
                        if(expectedChecksum===cur_) {
                            frame = {...frame, expectedChecksum };
                            state = nextState;;
                        } else {
                            error_(
                                `Expected ${pos} should be '${expectedChecksum}' but got '${cur_}' (numbers are showed in this message in decimal)`,
                                frame,
                                acc,
                                state)
                        }
                        
                    }
                } else /* waitingEscDup === true */ {
                    if (cur_ === ESC) {
                        frame = {...frame, [pos]: [ESC, ESC]};
                        waitingEscDup = false;
                        const expectedChecksum = calcChecksum__(frame);
                        frame = {...frame, expectedChecksum };
                        state = nextState;
                    } else {
                        error_(
                            `Expected a duplicated Esc after ${pos} ([${ESC},${ESC}]  decimal) but got other thing ([${ESC},${cur_}] decimal).`,
                            frame,
                            acc,
                            state)
                    }
                }
                break;
            }
    
        }

        
        if (onInternalStateChange!==undefined) {
            onInternalStateChange(state,frame,waitingEscDup,acc)
        } else {
            console.log(`-----------------------------`)
            console.log(`state =`,state )
            console.log(`frame =`,frame)
            console.log(`waitingEscDup = `, waitingEscDup)
            console.log(`acc = `, acc)
        }
        
        if (state==='Successful') {
            //console.log('sucess************************')
            //console.table(frame)
            success(frame as FrameInterpreted, acc)
        }


        return resetInterpreter
        
}

export const CmppDataLinkInterpreter = InterpretIncomming(ESC, [STX,ACK,NACK], ETX)   


