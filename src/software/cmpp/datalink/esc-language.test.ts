import { ESC } from "./core-types"
import { acceptor, Config, initialState, InternalState } from "./esc-language"


const config: Config = {
    Escape: ESC,
    Escape_Escape: ESC,
}

describe('Basic Tests on simple parsers', () => {

    it('Can parse a simple ESCAPE after DATA', async () => {
        // prepare
        const currentState = initialState
        const byteToAccept = ESC
        const exptedEndState: InternalState = {
            coreState: 'ESCAPE',
            lastByteWasEscape: true,
        }
        //act
        const actual = acceptor(config)(currentState,byteToAccept)
        //check
        expect(actual).toEqual(exptedEndState)
    })

    it('Can parse a simple ESCAPE_ESCAPE after ESCAPE', async () => {
        // prepare
        const currentState: InternalState = {
            coreState: 'ESCAPE',
            lastByteWasEscape: true,
        }
        const byteToAccept = ESC
        const exptedEndState: InternalState = {
            coreState: 'ESCAPE_ESCAPE',
            lastByteWasEscape: false,
        }
        //act
        const actual = acceptor(config)(currentState,byteToAccept)
        //check
        expect(actual).toEqual(exptedEndState)
    })

    it('Can parse a simple DATA after ESCAPE', async () => {
        // prepare
        const NOT_A_ESCAPE = ESC+1
        const currentState: InternalState = {
            coreState: 'ESCAPE',
            lastByteWasEscape: true,
        }
        const byteToAccept = NOT_A_ESCAPE
        const exptedEndState: InternalState = {
            coreState: 'DATA',
            lastByteWasEscape: false,
        }
        //act
        const actual = acceptor(config)(currentState,byteToAccept)
        //check
        expect(actual).toEqual(exptedEndState)
    })

    
})