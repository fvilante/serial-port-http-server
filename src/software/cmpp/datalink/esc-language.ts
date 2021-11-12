//example parsing: 0, 10, 20, 30, 10, 11, 12, ESC, 13, ESC, 20, ESC, ESC, 30, ESC, 40
//        yields: DATA DATA, DATA, DATA, DATA, DATA, DATA, ESCAPE, DATA, ESCAPE, DATA, ESCAPE, ESCAPE_ESCAPE, DATA, ESCAPE, DATA


type Byte = number

export type CoreState = 
    | 'ESCAPE' // Esc byte
    | 'ESCAPE_ESCAPE' // duplicated Esc byte, it MUST EXISTS after an ESCAPE else error!
    | 'DATA' // any other case

export type InternalState = {
    coreState: CoreState
    lastByteWasEscape: boolean
}

// recomended initial state
export const initialState: InternalState = {
    coreState: 'DATA',
    lastByteWasEscape: false, 
}

export type Config = {
    Escape: Byte //TODO: what if we use byte[] instead byte ? it whould be more generic nah?!
    Escape_Escape: Byte  //NOTE: Escape_Escape code not necessary must be equal the Escape code
}

export type Acceptor =  (currentState: InternalState, byte: Byte) => InternalState

export const acceptor = (config: Config):Acceptor => (currentState: InternalState, byte: Byte): InternalState => {
    const { Escape, Escape_Escape} = config
    const { coreState, lastByteWasEscape} = currentState
    if (byte!==Escape) {
        // its not escape
        return {
            ...currentState,
            coreState: 'DATA',
            lastByteWasEscape: false
        }
    } else /*byte is Escape*/ {
        if (lastByteWasEscape===false) {
            // it is the first escape
            return {
                ...currentState,
                coreState: 'ESCAPE',
                lastByteWasEscape: true
            }
        } else /*lastByteWasEscape === true*/ {
            // it is the second escape, so escape_escape!
            // NOTE that the previous ESCAPE continue to be an ESCAPE in this convention.
            return {
                ...currentState,
                coreState: 'ESCAPE_ESCAPE',
                lastByteWasEscape: false
            }

        }
    }
}


