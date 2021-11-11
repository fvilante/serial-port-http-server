import { FrameInterpreted } from "."
import { ACK, ESC, ETX, NACK, STX } from "./core-types"

export type Byte = number

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

const validStartBytes = [STX, ACK, NACK] as const

export type InternalState = {
    inputBuffer: FrameInterpreted[keyof FrameInterpreted][]
    coreState: CoreState
    failHistory: Fail[]
    waitingDuplicatedEsc: boolean
}

type Fail = {
    expectedData: ESC | typeof validStartBytes | 'any byte' | ETX
    receivedData: Byte[]
    internalState: InternalState // current internal state when fail occurs
    failMsg: string
}

type FailStructure = {
    currentCoreState: CoreState, 
    byteToAccept: Byte, 
    expectedData: Fail['expectedData'], 
    nextStateIfFailHadNotHappened: CoreState,
}

const makeFailMesage = (detail: FailStructure):string => {
    const msg = `
        ---------------------[Error]------------------------
        type: CMPP Serial Protocol Interpretation Error
        current state...........................: ${detail.currentCoreState}
        received data...........................: ${detail.byteToAccept}
        expected data...........................: ${detail.expectedData}
        next state if error had not ocurried....: ${detail.nextStateIfFailHadNotHappened}

    `
    return msg
} 

const makeDuplicatedEscFailMesage = (detail: FailStructure):string => {
    const msg = `
        ---------------------[Error]------------------------
        type: CMPP Serial Protocol Interpretation Error
        detail..................................: 'Expected a duplicate ESC, but received other thing'
        current state...........................: ${detail.currentCoreState}
        received data...........................: ${detail.byteToAccept}
        expected data...........................: ${detail.expectedData}
        next state if error had not ocurried....: ${detail.nextStateIfFailHadNotHappened}

    `
    return msg
} 



const acceptByteIntoBuffer = (currentState: InternalState, byteToAccept:Byte): InternalState => {
    const {inputBuffer} = currentState
    const nextState = {
        ...currentState,
        inputBuffer: [...inputBuffer, byteToAccept],
    }
    return nextState
}

const changeCoreState = (currentState: InternalState, newCoreState: CoreState): InternalState => {
    const nextState = {
        ...currentState,
        coreState: newCoreState,
    }
    return nextState
}



const acceptByteIntoBufferAndChangeCoreState = (currentState: InternalState, byteToAccept: Byte, nextCoreState: CoreState): InternalState => {
    const s0 = acceptByteIntoBuffer(currentState, byteToAccept)
    const s1 = changeCoreState(s0, nextCoreState)
    const nextState = { ...s1 }
    return nextState 
}

const introduceFail = (currentState: InternalState, fail: Fail): InternalState => {
    const { failHistory } = currentState
    const nextState: InternalState = {
        ...currentState,
        failHistory: [...failHistory, fail]
    }
    return nextState
}


type AcceptanceCondition = {
    expectedCoreState: CoreState
    nextCoreState: CoreState // nextState if byte is accepted
    maybeEscDuplicated: boolean
    acceptanceFunction: (dataToAccept: Byte) => {accepted: true, expected: undefined} | {accepted: false, expected: Fail['expectedData']}  // true if it is accepted
}

type AcceptanceFunction = AcceptanceCondition['acceptanceFunction']

export const byteAcceptor = (currentState: InternalState, byteToAccept:Byte, condition: AcceptanceCondition): InternalState => {
    //configure
    const { coreState: currentCoreState, waitingDuplicatedEsc } = currentState
    const { expectedCoreState, nextCoreState, acceptanceFunction, maybeEscDuplicated} = condition
    const isEscByte = byteToAccept === ESC
    const data = acceptanceFunction(byteToAccept)

    //proccess
    if (currentCoreState===expectedCoreState) {

        // deal with first esc of an dup esc
        if (maybeEscDuplicated && isEscByte && waitingDuplicatedEsc===false) {
            //accept byte but do not change coreState and mark waitingDuplicatedEsc flag
            const nextState = acceptByteIntoBufferAndChangeCoreState(currentState,byteToAccept,currentCoreState)
            return {...nextState, waitingDuplicatedEsc: true }
        }
        
        // deal with SECOND esc of an dup esc
        if (waitingDuplicatedEsc) {
            //If waiting dup esc, current byte MUST be an ESC, else we get and "dup-esc error"
            if (isEscByte) {
                //accept byte and DOES CHANGE coreState and UNMARK waitingDuplicatedEsc flag
                const nextState = acceptByteIntoBufferAndChangeCoreState(currentState,byteToAccept,nextCoreState)
                return {...nextState, waitingDuplicatedEsc: false }
            } else {
                // byte should be an duplicated ESC but it is not
                const failMsg = makeDuplicatedEscFailMesage({
                    byteToAccept,
                    currentCoreState,
                    expectedData: ESC,
                    nextStateIfFailHadNotHappened: expectedCoreState
                })
                const nextState = introduceFail(currentState, {
                    internalState: currentState,
                    expectedData: ESC,
                    receivedData: [byteToAccept],
                    failMsg,
                })
                return nextState

            }
        }

        // normal proccess
        if (data.accepted) {
            const nextState = acceptByteIntoBufferAndChangeCoreState(currentState,byteToAccept,nextCoreState)
            return nextState
        } else /*data not accepted*/{
            const failMsg = makeFailMesage({
                byteToAccept,
                currentCoreState,
                expectedData: data.expected,
                nextStateIfFailHadNotHappened: expectedCoreState
            })
            const nextState = introduceFail(currentState, {
                internalState: currentState,
                expectedData: data.expected,
                receivedData: [byteToAccept],
                failMsg,
            })
            return nextState
        }
    } else /*currentCoreState !== expectedCoreState*/ {
        throw new Error(`Cmpp interpretation error: CoreState should be '${expectedCoreState}' but it is actually '${currentCoreState}', aborting`)
    }
}

const escAcceptor: AcceptanceFunction = byte => byte === ESC ? { accepted: true } : { accepted: false, expected: ESC }
const startByteAcceptor: AcceptanceFunction = byte => validStartBytes.some( validStartByte => validStartByte===byte) ? { accepted: true } : { accepted: false, expected: validStartBytes }
const anyByteAcceptor: AcceptanceFunction = byte => byte===byte ? { accepted: true } : { accepted: false, expected: 'any byte' }
const etxByteAcceptor: AcceptanceFunction = byte => byte === ETX ? { accepted: true } : { accepted: false, expected: ETX }

export const waitingFirstEsc = (currentState: InternalState, byteToAccept:Byte): InternalState => {
    return byteAcceptor(currentState, byteToAccept,{
        expectedCoreState: 'Waiting first Esc',
        nextCoreState: 'Waiting start byte',
        acceptanceFunction: escAcceptor,
        maybeEscDuplicated: false,
    })
}

export const waitingStartByte = (currentState: InternalState, byteToAccept:Byte): InternalState => {
    return byteAcceptor(currentState, byteToAccept,{
        expectedCoreState: 'Waiting start byte',
        nextCoreState: 'Waiting direction and channel',
        acceptanceFunction: startByteAcceptor,
        maybeEscDuplicated: false,
    })
}

export const waitingDirectionAndChannel = (currentState: InternalState, byteToAccept:Byte): InternalState => {
    return byteAcceptor(currentState, byteToAccept,{
        expectedCoreState: 'Waiting direction and channel',
        nextCoreState: 'Waiting word address (waddr)',
        acceptanceFunction: anyByteAcceptor,
        maybeEscDuplicated: true,
    })
}

export const waitingWordAddress = (currentState: InternalState, byteToAccept:Byte): InternalState => {
    return byteAcceptor(currentState, byteToAccept,{
        expectedCoreState: 'Waiting word address (waddr)',
        nextCoreState: 'Waiting dataLow',
        acceptanceFunction: anyByteAcceptor,
        maybeEscDuplicated: true,
    })
}

export const waitingDataLow = (currentState: InternalState, byteToAccept:Byte): InternalState => {
    return byteAcceptor(currentState, byteToAccept,{
        expectedCoreState: 'Waiting dataLow',
        nextCoreState: 'Waiting dataHigh',
        acceptanceFunction: anyByteAcceptor,
        maybeEscDuplicated: true,
    })
}

export const waitingDataHigh = (currentState: InternalState, byteToAccept:Byte): InternalState => {
    return byteAcceptor(currentState, byteToAccept,{
        expectedCoreState: 'Waiting dataHigh',
        nextCoreState: 'Waiting lastEsc',
        acceptanceFunction: anyByteAcceptor,
        maybeEscDuplicated: true,
    })
}

export const waitingLastEsc = (currentState: InternalState, byteToAccept:Byte): InternalState => {
    return byteAcceptor(currentState, byteToAccept,{
        expectedCoreState: 'Waiting lastEsc',
        nextCoreState: 'Waiting ETX',
        acceptanceFunction: escAcceptor,
        maybeEscDuplicated: false,
    })
}

export const waitingETX = (currentState: InternalState, byteToAccept:Byte): InternalState => {
    return byteAcceptor(currentState, byteToAccept,{
        expectedCoreState: 'Waiting ETX',
        nextCoreState: 'Waiting checksum',
        acceptanceFunction: etxByteAcceptor,
        maybeEscDuplicated: false,
    })
}

export const waitingChecksum = (currentState: InternalState, byteToAccept:Byte): InternalState => {
    return byteAcceptor(currentState, byteToAccept,{
        expectedCoreState: 'Waiting checksum',
        nextCoreState: 'Waiting first Esc', // restart CoreState
        acceptanceFunction: anyByteAcceptor,
        maybeEscDuplicated: false,
    })
}

// CMPP datalink acceptor machine state (core)
type Acceptor =  (currentState: InternalState, byteToAccept:Byte) => InternalState
export const acceptor: Acceptor = (currentState: InternalState, byteToAccept:Byte): InternalState => {
    switch (currentState.coreState) {
        case 'Waiting first Esc': return waitingFirstEsc(currentState, byteToAccept)
        case 'Waiting start byte': return waitingStartByte(currentState, byteToAccept)
        case 'Waiting direction and channel': return waitingDirectionAndChannel(currentState, byteToAccept)
        case 'Waiting word address (waddr)': return waitingWordAddress(currentState, byteToAccept)
        case 'Waiting dataLow': return waitingDataLow(currentState, byteToAccept)
        case 'Waiting dataHigh': return waitingDataHigh(currentState, byteToAccept)
        case 'Waiting lastEsc': return waitingLastEsc(currentState, byteToAccept)
        case 'Waiting ETX': return waitingETX(currentState, byteToAccept)
        case 'Waiting checksum': return waitingChecksum(currentState, byteToAccept)
        default:
            throw new Error('Unexausted switch case. This should be impossible to occur in run-time')
    }
}


// TODO: this is a generic reducer, extract to utils when possible
const reduce = <A,B>(reduceFn: (currentState:A) => B, initialState: A):B => {
    const b = reduceFn(initialState)
    return b
}


// TODO: the arrays have same length, this can be enforced by static typings
export const acceptMany = (acceptor: Acceptor, currentState: InternalState, bytesToAccept: readonly Byte[]): readonly InternalState[] => {
    let response: readonly InternalState[] = [currentState]
    bytesToAccept.forEach( byte => {
        const lastState = response[response.length-1]
        const nextState = acceptor(lastState, byte)
        response = [...response, nextState]
    })
    return response
}
