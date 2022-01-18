import { keyboardEventEmiter, KeyboardEvent, KeyboardEventEmitter } from '../keyboard/read-keyboard-async'
import { Maybe } from "../adts/maybe"
import { Push, Push_ } from "../adts/push-stream"
import { performMatrizByItsMsg, } from "../matriz-router"
import { makeMovimentKit } from "../machine-controler"
import { BarCode } from './barcode-core'
import { parseBarCode } from './barcode-parser'

const convertKeyEventsToString = (ks: readonly KeyboardEvent[]): string => (ks.map( k => k.sequence)).join('')

const trimSpacesFromData = (barCode: BarCode): BarCode => {
    return {
        messageText: String(barCode.messageText).trim(),
        partNumber: barCode.partNumber.trim(),
        raw: barCode.raw.trim(),
    }
}

// Get barcode, validate low level barcode aginst the structure of data expected, but not do other checks
export const makeBarcodeStream = (input: KeyboardEventEmitter): Push<Maybe<BarCode>> => {
    
    const input_ = Push<KeyboardEvent>( yield_ => input(yield_))
    
    return input_
        .dropletWith( keyEvent => keyEvent.name==='return') // if 'enter' split stream
        .map(convertKeyEventsToString)
        .map(parseBarCode)
        .map( ma => ma.map(trimSpacesFromData))
}

const Test1 = () => {

    const probes = [
        `M#12345-6789`,
        `12345-6789`,
        `M#123456789`,
        `M#   12345-6789`,
        `M#12345-6789    `,
        `M#`,        
    ]

    const r = probes
        .map( probe => {
            const mBarCode = parseBarCode(probe)
            return mBarCode.unsafeRun().value
        })

    console.table(r)
}

