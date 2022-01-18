import { keyboardEventEmiter, KeyboardEvent, KeyboardEventEmitter } from '../keyboard/read-keyboard-async'
import { Maybe, Just } from "../adts/maybe"
import { Push, Push_ } from "../adts/push-stream"
import { performMatrizByItsMsg, } from "../matriz-router"
import { makeMovimentKit } from "../machine-controler"


// FIX: You can filter keystroks of barcode reader to differentiate to normal typing doing this:
//      I verified inclusive in the LEONI_MACHINE computer what follows below: 
//          - normal typing: even when I type as fast as possible rarely the keystrokes interval
//            is less then 50ms (would say that certainly more than 90% of my typing is more than 50ms)
//          - barcode reading: In other hand, certainly more than 90% of barcode 'typing' has an
//          - interval less than 50ms
//      conclusion, if the reading evolve some characters, it is possible to use average mean to
//      calculate the probability of a sequence be typed by human or barcode reader.  

//if string is not a valid barcode return Nothing
//Fix: used Result instead of Maybe 
const parseBarCode = (barCode:string): Maybe<BarCode> => {
    const mSharp = "M#"
    const minus = '-' //fix (in place of minus we should accept also ' ' and '_' even something else)
    const hasMSharp = barCode.startsWith(mSharp)
    const hasMinus = barCode.includes(minus)
    const barCodeWithoutMSharp = barCode.slice(2,barCode.length)
    const isBarCodeStructureOk = hasMSharp && hasMinus
    const [partNumber, messageText] = barCodeWithoutMSharp.split(minus)

    return isBarCodeStructureOk===false // fIX: I'm not saving this lack of infrastructure
        ? Just({
            raw: barCode, 
            partNumber,
            messageText,
        })
        : Just({
            raw: barCode, 
            partNumber,
            messageText,
        })
}

const convertKeyEventsToString = (ks: readonly KeyboardEvent[]): string => (ks.map( k => k.sequence)).join('')

const trimSpacesFromData = (barCode: BarCode): BarCode => {
    return {
        messageText: String(barCode.messageText).trim(),
        partNumber: barCode.partNumber.trim(),
        raw: barCode.raw.trim(),
    }
}

// Get barcode, validate low level barcode aginst the structure of data expected, but not do other checks
export const GetBarCodeFromSignal = (input: KeyboardEventEmitter): Push<Maybe<BarCode>> => {
    
    const input_ = Push<KeyboardEvent>( yield_ => input(yield_))
    
    return input_
        .dropletWith( keyEvent => keyEvent.name==='return') // if 'enter' split stream
        .map(convertKeyEventsToString)
        .map(parseBarCode)
        .map( ma => ma.map(trimSpacesFromData))
}


export type BarCode = {
    readonly raw: string
    readonly partNumber: string
    readonly messageText: string
    //fix: include a field named (is barcode structured identified=boolean)
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

const Test2 = () => {

    console.log('iniciando varredura de teclado...')

    GetBarCodeFromSignal(keyboardEventEmiter)
        .unsafeRun( mb => {

            mb.forEach( barCode => {

                console.log(`Identificado bar-code:`, barCode)
                console.log(`localizando programacao correspondente`)
                
                const msg = barCode.messageText
                const partNumber = barCode.partNumber
                console.log(`Iniciando realizacao do trabalho`)
                makeMovimentKit()
                    .then( movimentKit => {
                        performMatrizByItsMsg(msg as unknown as any, movimentKit)
                    })  
            })

        })
        
}

//Test1()

//Test2()