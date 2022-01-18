import { KeyboardEvent, KeyboardEventEmitter } from '../keyboard/read-keyboard-async'
import { Push  } from "../adts/push-stream"
import { BarCode } from './barcode-core'

// NOTE: You can filter keystroks of barcode reader to differentiate to normal typing doing this:
//      I verified inclusive in the LEONI_MACHINE computer what follows below: 
//          - normal typing: even when I type as fast as possible rarely the keystrokes interval
//            is less then 50ms (would say that certainly more than 90% of my typing is more than 50ms)
//          - barcode reading: In other hand, certainly more than 90% of barcode 'typing' has an
//          - interval less than 50ms
//      conclusion, if the reading evolve some characters, it is possible to use average mean to
//      calculate the probability of a sequence be typed by human or barcode reader.  


export const parseBarCode = (barCode_: string): BarCode => {
    //NOTE: trimming spaces because it is dificult to identify this spaces in real world application field. 
    //      I'm doing this to just to help field technicians. There's no reason to propagate this kind of error.
    const barCode = barCode_.trim() 
    return {
        kind: 'BarCode',
        data: barCode,
    }
};

const convertKeyEventsToString = (ks: readonly KeyboardEvent[]): string => (ks.map( k => k.sequence)).join('')


// NOTE: The separator specifies which key indicates the end of a barcode. In below case default is <enter>
//       Normally barcode readers sends a newline after it has read the barcode, this line is normally an <enter> but may
//       be configured to other keys like <TAB> and so on.
export const makeBarcodeStream = (input: KeyboardEventEmitter, separator: readonly string[] = ['return']): Push<BarCode> => {
    
    const input_ = Push<KeyboardEvent>( yield_ => input(yield_))
    
    return input_
        .dropletWith( keyEvent => separator.includes(keyEvent.name)) // if 'enter' split stream
        .map(convertKeyEventsToString)
        .map(parseBarCode)
}



