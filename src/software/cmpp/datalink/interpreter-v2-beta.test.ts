import { ACK, ESC, ETX, NACK, STX } from "./core-types"
import { acceptMany, CoreState } from "./interpreter-v2-beta"
import { acceptor, InternalState, waitingDirectionAndChannel, waitingFirstEsc, waitingStartByte } from "./interpreter-v2-beta"


describe('Basic Tests on simple parsers', () => {

    it('Can wait a first esc', async () => {
        //configure
        const currentCoreState: CoreState = 'Waiting first Esc'
        const nextCoreState: CoreState = 'Waiting start byte'
        const byteToAccept = ESC
        // prepare
        const currentState: InternalState = {
            coreState: currentCoreState,
            inputBuffer: [],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        const expected: InternalState = {
            coreState: nextCoreState,
            inputBuffer: [byteToAccept],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        //act
        const nextState = waitingFirstEsc(currentState, byteToAccept)
        //check
        expect(nextState).toEqual(expected)
    })

    it('Can fail when waiting a first esc', async () => {
        //configure
        const garbage = ESC+1 
        const currentCoreState: CoreState = 'Waiting first Esc'
        // prepare
        const byteToAccept = garbage
        const currentState: InternalState = {
            coreState: currentCoreState,
            inputBuffer: [],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        const expectedFailHistoryLength = 1
        //act
        const nextState = waitingFirstEsc(currentState, byteToAccept)
        //check
        expect(nextState.failHistory.length).toEqual(expectedFailHistoryLength)
    })

    it('Can wait a start byte (STX) value', async () => {
       //configure
       const currentCoreState: CoreState = 'Waiting start byte'
       const nextCoreState: CoreState = 'Waiting direction and channel'
       const byteToAccept = STX
       // prepare
       const currentState: InternalState = {
           coreState: currentCoreState,
           inputBuffer: [],
           failHistory: [],
           waitingDuplicatedEsc: false,
       }
       const expected: InternalState = {
           coreState: nextCoreState,
           inputBuffer: [byteToAccept],
           failHistory: [],
           waitingDuplicatedEsc: false,
       }
       //act
       const nextState = waitingStartByte(currentState, byteToAccept)
       //check
       expect(nextState).toEqual(expected)
    })

    it('Can fail when waiting a start byte (STX)', async () => {
        //configure
        const garbage = STX+1 
        const currentCoreState: CoreState = 'Waiting first Esc'
        // prepare
        const byteToAccept = garbage
        const currentState: InternalState = {
            coreState: currentCoreState,
            inputBuffer: [],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        const expectedFailHistoryLength = 1
        //act
        const nextState = waitingFirstEsc(currentState, byteToAccept)
        //check
        expect(nextState.failHistory.length).toEqual(expectedFailHistoryLength)
    })

    it('Can wait a start byte (ACK) value', async () => {
        //configure
        const currentCoreState: CoreState = 'Waiting start byte'
        const nextCoreState: CoreState = 'Waiting direction and channel'
        const byteToAccept = ACK
        // prepare
        const currentState: InternalState = {
            coreState: currentCoreState,
            inputBuffer: [],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        const expected: InternalState = {
            coreState: nextCoreState,
            inputBuffer: [byteToAccept],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        //act
        const nextState = waitingStartByte(currentState, byteToAccept)
        //check
        expect(nextState).toEqual(expected)
     })

     it('Can fail when waiting a start byte (ACK)', async () => {
        //configure
        const garbage = ACK+1 
        const currentCoreState: CoreState = 'Waiting first Esc'
        // prepare
        const byteToAccept = garbage
        const currentState: InternalState = {
            coreState: currentCoreState,
            inputBuffer: [],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        const expectedFailHistoryLength = 1
        //act
        const nextState = waitingFirstEsc(currentState, byteToAccept)
        //check
        expect(nextState.failHistory.length).toEqual(expectedFailHistoryLength)
    })


    it('Can wait a start byte (NACK) value', async () => {
    //configure
    const currentCoreState: CoreState = 'Waiting start byte'
    const nextCoreState: CoreState = 'Waiting direction and channel'
    const byteToAccept = NACK
    // prepare
    const currentState: InternalState = {
        coreState: currentCoreState,
        inputBuffer: [],
        failHistory: [],
        waitingDuplicatedEsc: false,
    }
    const expected: InternalState = {
        coreState: nextCoreState,
        inputBuffer: [byteToAccept],
        failHistory: [],
        waitingDuplicatedEsc: false,
    }
    //act
    const nextState = waitingStartByte(currentState, byteToAccept)
    //check
    expect(nextState).toEqual(expected)
    })

    it('Can fail when waiting a start byte (NACK)', async () => {
        //configure
        const garbage = NACK+1 
        const currentCoreState: CoreState = 'Waiting first Esc'
        // prepare
        const byteToAccept = garbage
        const currentState: InternalState = {
            coreState: currentCoreState,
            inputBuffer: [],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        const expectedFailHistoryLength = 1
        //act
        const nextState = waitingFirstEsc(currentState, byteToAccept)
        //check
        expect(nextState.failHistory.length).toEqual(expectedFailHistoryLength)
    })

    it('Can wait non-esc direction and channel', async () => {
        //configure
        const currentCoreState: CoreState = 'Waiting direction and channel'
        const nextCoreState: CoreState = 'Waiting word address (waddr)'
        const nonEsc_byteToAccept = ESC+1
        // prepare
        const currentState: InternalState = {
            coreState: currentCoreState,
            inputBuffer: [],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        const expected: InternalState = {
            coreState: nextCoreState,
            inputBuffer: [nonEsc_byteToAccept],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        //act
        const nextState = waitingDirectionAndChannel(currentState, nonEsc_byteToAccept)
        //check
        expect(nextState).toEqual(expected)
    })

    it('Can wait an ESC "direction and channel"', async () => {
        //configure
        const currentCoreState: CoreState = 'Waiting direction and channel'
        const nextCoreState: CoreState = currentCoreState
        const byteToAccept = ESC
        // prepare
        const currentState: InternalState = {
            coreState: currentCoreState,
            inputBuffer: [],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        const expected: InternalState = {
            coreState: nextCoreState,
            inputBuffer: [byteToAccept],
            failHistory: [],
            waitingDuplicatedEsc: true,
        }
        //act
        const nextState = waitingDirectionAndChannel(currentState, byteToAccept)
        //check
        expect(nextState).toEqual(expected)
    })

    it('Can wait an ESC dup in the "direction and channel" position after received an ESC in that same position', async () => {
        //configure
        const currentCoreState: CoreState = 'Waiting direction and channel'
        const nextCoreState: CoreState = 'Waiting word address (waddr)'
        // prepare
        const currentState: InternalState = {
            coreState: currentCoreState,
            inputBuffer: [ESC],
            failHistory: [],
            waitingDuplicatedEsc: true,
        }
        const expected: InternalState = {
            coreState: nextCoreState,
            inputBuffer: [ESC, ESC],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        //act
        const nextState = waitingDirectionAndChannel(currentState, ESC)
        //check
        expect(nextState).toEqual(expected)
    })

    it('Can FAIL when ESC dup in the "direction and channel" position after received an ESC is not present', async () => {
        //configure
        const currentCoreState: CoreState = 'Waiting direction and channel'
        const gabarge = ESC+1
        // prepare
        const currentState: InternalState = {
            coreState: currentCoreState,
            inputBuffer: [ESC],
            failHistory: [],
            waitingDuplicatedEsc: true,
        }
        const expectedFailHistoryLength = 1
        //act
        const nextState = waitingDirectionAndChannel(currentState, gabarge)
        //check
        expect(nextState.failHistory.length).toEqual(expectedFailHistoryLength)
    })

    it('can accept a complete, well formed, master frame (with no dup esc inside it)', async () => {
        //configure
        const currentCoreState: CoreState = 'Waiting first Esc'
        const nextCoreState: CoreState = 'Waiting first Esc'
        const correctMasterFrame = [ESC, STX, 0xC1, 0x50, 0x61, 0x02, ESC, ETX, 0x87,]
        const wellFormedNonEscFrame = correctMasterFrame
        // prepare
        const currentState: InternalState = {
            coreState: currentCoreState,
            inputBuffer: [],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        const expected: InternalState = {
            coreState: nextCoreState,
            inputBuffer: [...wellFormedNonEscFrame],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        //act
        const allstates = acceptMany(acceptor, currentState, correctMasterFrame)
        const lastState = allstates[allstates.length-1]
        //check
        expect(lastState).toEqual(expected)
    })

    it('can accept TWO complete, well formed, master frames (with no dup esc inside it)', async () => {
        //configure
        const currentCoreState: CoreState = 'Waiting first Esc'
        const nextCoreState: CoreState = 'Waiting first Esc'
        const correctMasterFrame = [ESC, STX, 0xC1, 0x50, 0x61, 0x02, ESC, ETX, 0x87,]
        const twoWellFormedFrames = [...correctMasterFrame, ...correctMasterFrame]
        // prepare
        const currentState: InternalState = {
            coreState: currentCoreState,
            inputBuffer: [],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        const expected: InternalState = {
            coreState: nextCoreState,
            inputBuffer: [...twoWellFormedFrames],
            failHistory: [],
            waitingDuplicatedEsc: false,
        }
        //act
        const allstates = acceptMany(acceptor, currentState, twoWellFormedFrames)
        const lastState = allstates[allstates.length-1]
        //check
        expect(lastState).toEqual(expected)
    })

})