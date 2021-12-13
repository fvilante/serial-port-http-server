import { CmppControler } from "./cmpp-controler";
import { Moviment } from "./core";
import { setNext, setNextRelative } from "./utils/go-next";
import { doSmartReferenceIfNecessary, forceSmartReference, SmartReferenceParameters } from "./utils/smart-reference";

export type AxisControler = {
    kind: 'AxisControler'
    //reference
    forceLooseReference: () => Promise<void>
    forceSmartReference: (_: SmartReferenceParameters) => Promise<void>
    doSmartReferenceIfNecessary: (_: SmartReferenceParameters) => Promise<void>
    //params
    setNext: (next: Moviment) => Promise<void>
    setNextRelative: (next: Moviment) => Promise<void>
    //start
    start: () => Promise<void>

}

export const AxisCotroler = (cmppControler: CmppControler): AxisControler => {


    return {
        kind: 'AxisControler',

        forceLooseReference: () => cmppControler.forceLooseReference(),

        forceSmartReference: (parameters: SmartReferenceParameters) => {
            return forceSmartReference(cmppControler, parameters)
        },

        doSmartReferenceIfNecessary: (parameters: SmartReferenceParameters) => {
            return doSmartReferenceIfNecessary(cmppControler, parameters)
        },

        setNext: (next: Moviment) => setNext(cmppControler, next),

        setNextRelative: (next: Moviment) => setNextRelative(cmppControler, next),

        start: () => cmppControler.start()
        
    }
}